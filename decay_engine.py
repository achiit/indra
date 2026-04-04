"""
decay_engine.py — INDRA v2 Confidence Decay Engine
====================================================
Formula: confidence(t) = base_confidence × e^(-λ × days_since_confirmed)
  λ = 0.05  for slow facts (alliances, treaties, trade)
  λ = 0.2   for fast facts (military moves, prices, threats)
  λ = 0.1   for neutral facts

Thresholds:
  < 0.15  → stale (greyed in UI)
  < 0.05  → archived to archived_edges.json (not deleted)

Run: python decay_engine.py
     OR import and call run_decay() from server.py
"""

import os
import json
import math
import logging
from datetime import datetime, timezone
from pathlib import Path
from collections import defaultdict

from typed_ontology import (
    load_typed_graph, save_typed_graph,
    TypedGraph, TypedEdge, ARCHIVED_FILE
)

logger = logging.getLogger("INDRA.Decay")

STALE_THRESHOLD   = 0.15
ARCHIVE_THRESHOLD = 0.05


# ── Core decay pass ───────────────────────────────────────────────────────────

def run_decay(graph: TypedGraph | None = None, persist: bool = True) -> dict:
    """
    Apply confidence decay to all edges in typed_graph.json.
    Returns a stats dict for the /api/graph-confidence endpoint.
    Returns modified graph (not saved if persist=False).
    """
    if graph is None:
        graph = load_typed_graph()

    now       = datetime.now(timezone.utc)
    archived  = []
    staled    = []
    decayed   = []
    unchanged = []

    CONF_BUCKETS = [0.0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.01]
    histogram    = {f"{CONF_BUCKETS[i]:.2f}-{CONF_BUCKETS[i+1]:.2f}": 0
                    for i in range(len(CONF_BUCKETS) - 1)}

    new_edges    = {}
    archive_list = []

    # Load existing archive
    if Path(ARCHIVED_FILE).exists():
        try:
            with open(ARCHIVED_FILE, "r") as f:
                archive_list = json.load(f)
        except Exception:
            archive_list = []

    for key, edge in graph.edges.items():
        decayed_edge = edge.apply_decay()
        conf        = decayed_edge.confidence

        # Histogram bucket
        for i in range(len(CONF_BUCKETS) - 1):
            if CONF_BUCKETS[i] <= conf < CONF_BUCKETS[i + 1]:
                bucket_key = f"{CONF_BUCKETS[i]:.2f}-{CONF_BUCKETS[i+1]:.2f}"
                histogram[bucket_key] += 1
                break

        if conf < ARCHIVE_THRESHOLD:
            # Archive it
            archived.append(key)
            archive_entry = decayed_edge.model_dump(mode="json")
            archive_entry["archived_at"] = now.isoformat()
            archive_list.append(archive_entry)
        elif conf < STALE_THRESHOLD:
            # Mark stale
            staled.append(key)
            new_edges[key] = decayed_edge.model_copy(update={"stale": True})
        else:
            # Active
            new_edges[key] = decayed_edge.model_copy(update={"stale": False})
            if abs(conf - edge.confidence) > 0.001:
                decayed.append(key)
            else:
                unchanged.append(key)

    graph.edges = new_edges

    if persist:
        save_typed_graph(graph)
        # Save archived edges
        try:
            with open(ARCHIVED_FILE, "w") as f:
                json.dump(archive_list, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"[Decay] Could not save archive: {e}")

    stats = {
        "total_edges":    len(graph.edges) + len(archived),
        "active_edges":   len(new_edges),
        "stale_edges":    len(staled),
        "archived_edges": len(archived),
        "decayed_count":  len(decayed),
        "histogram":      histogram,
        "run_at":         now.isoformat(),
    }

    logger.info(
        f"[Decay] Active={len(new_edges)} Stale={len(staled)} "
        f"Archived={len(archived)} Run@{now.strftime('%H:%M:%S')}"
    )
    return stats


# ── Domain-level confidence summary (for UI panels) ───────────────────────────

def domain_confidence_summary() -> dict:
    """Return average confidence per domain for UI sparklines."""
    graph = load_typed_graph()
    domain_conf  = defaultdict(list)
    domain_stale = defaultdict(int)

    for edge in graph.edges.values():
        src_ent = graph.entities.get(edge.source)
        domain  = src_ent.domain if src_ent else "general"
        domain_conf[domain].append(edge.confidence)
        if edge.stale:
            domain_stale[domain] += 1

    summary = {}
    for domain, confs in domain_conf.items():
        summary[domain] = {
            "avg_confidence": round(sum(confs) / len(confs), 3),
            "min_confidence": round(min(confs), 3),
            "max_confidence": round(max(confs), 3),
            "edge_count":     len(confs),
            "stale_count":    domain_stale[domain],
        }
    return summary


# ── Alert detection (edges that dropped >30% since yesterday) ─────────────────

def get_domain_alerts(threshold_pct: float = 0.30) -> list[dict]:
    """
    Identify edges whose confidence decayed significantly.
    Uses 24h retrospective projection for 'yesterday' confidence.
    """
    graph = load_typed_graph()
    import math

    alerts = []
    for key, edge in graph.edges.items():
        lam           = edge.decay_lambda()
        # What was confidence 1 day ago?
        conf_yesterday = edge.confidence / math.exp(-lam * 1)  # inverse decay
        conf_yesterday = min(1.0, conf_yesterday)
        drop_pct       = (conf_yesterday - edge.confidence) / max(conf_yesterday, 0.001)

        if drop_pct > threshold_pct:
            src_ent = graph.entities.get(edge.source)
            domain  = src_ent.domain if src_ent else "general"
            alerts.append({
                "edge_key":         key,
                "source":           edge.source,
                "target":           edge.target,
                "edge_type":        str(edge.type),
                "domain":           domain,
                "confidence_now":   round(edge.confidence, 3),
                "confidence_yesterday": round(conf_yesterday, 3),
                "drop_pct":         round(drop_pct * 100, 1),
                "stale":            edge.stale,
            })

    alerts.sort(key=lambda x: x["drop_pct"], reverse=True)
    return alerts[:50]  # cap at 50 alerts


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s",
        datefmt="%H:%M:%S"
    )
    print("\n=== INDRA Decay Engine ===\n")
    stats = run_decay()
    print(json.dumps(stats, indent=2))
    print("\nDomain confidence summary:")
    print(json.dumps(domain_confidence_summary(), indent=2))
    alerts = get_domain_alerts()
    print(f"\n{len(alerts)} confidence alert(s) (>30% drop):")
    for a in alerts[:10]:
        print(f"  [{a['domain']}] {a['source']} →{a['edge_type']}→ {a['target']}: "
              f"{a['confidence_yesterday']:.2f} → {a['confidence_now']:.2f} (-{a['drop_pct']}%)")
