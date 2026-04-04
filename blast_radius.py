"""
blast_radius.py — INDRA v2 Causal Impact Query Engine
======================================================
Answers: "If X happens, what else is affected and how?"

Algorithm:
  1. Resolve entity in typed_graph (ID, fuzzy ID, label, token overlap)
  2. BFS over outgoing impact edges to depth N
  3. Multiply confidence scores at each hop (joint probability)
  4. Rank affected entities by combined confidence
  5. Pass compact subgraph to LLM for causal synthesis

Usage:
  POST /api/blast-radius  {"entity": "PAKISTAN", "depth": 3}
  OR: python blast_radius.py "PAKISTAN"
"""

import re
import json
import logging
import asyncio
from collections import deque

from typed_ontology import (
    load_typed_graph, TypedGraph, TypedEdge, EdgeType
)

logger = logging.getLogger("INDRA.BlastRadius")

# Strict causal edges (logged separately for diagnostics)
STRICT_CAUSAL_TYPES = {
    EdgeType.CAUSES.value,
    EdgeType.THREATENS.value,
    EdgeType.BLOCKS.value,
    EdgeType.SANCTIONS.value,
    EdgeType.CONTROLS.value,
}

# BFS traverses these — includes RELATED_TO / SUPPORTS so sparse graphs still return paths
TRAVERSAL_EDGE_TYPES = STRICT_CAUSAL_TYPES | {
    EdgeType.RELATED_TO.value,
    EdgeType.SUPPORTS.value,
    EdgeType.FUNDS.value,
    EdgeType.ALLIES_WITH.value,
    EdgeType.TRADES_WITH.value,
    EdgeType.COMPETES_WITH.value,
}


def _normalize_key(s: str) -> str:
    return str(s).strip().upper().replace(" ", "_")[:80]


def _token_set(s: str) -> set[str]:
    s = _normalize_key(s).replace("_", " ")
    return {t for t in re.split(r"[^A-Z0-9]+", s) if len(t) >= 2}


def _entity_match_scores(query: str, graph: TypedGraph) -> list[tuple[str, float, str]]:
    """
    Score every entity (id, score, reason) for resolving a free-text query.
    Higher is better. Reasons are for logs only.
    """
    q_raw = query.strip()
    q_key = _normalize_key(q_raw)
    q_tokens = _token_set(q_raw)
    scored: list[tuple[str, float, str]] = []

    for eid, ent in graph.entities.items():
        label = (ent.label or eid or "").strip()
        best = 0.0
        reason = ""

        if q_key and q_key == eid:
            scored.append((eid, 1.0, "exact_id"))
            continue

        if q_key and (q_key in eid or eid in q_key):
            best = max(best, 0.92)
            reason = "id_substring"

        lab_key = _normalize_key(label)
        if q_key and lab_key and (q_key == lab_key or q_key in lab_key or lab_key in q_key):
            best = max(best, 0.95)
            reason = "label_substring"

        if q_tokens:
            id_tok = _token_set(eid)
            lab_tok = _token_set(label)
            union = id_tok | lab_tok
            inter = q_tokens & union
            if inter:
                j = len(inter) / len(q_tokens)
                if j >= best:
                    best = j
                    reason = f"token_overlap_{len(inter)}/{len(q_tokens)}"

        if best > 0:
            scored.append((eid, best, reason or "token"))

    scored.sort(key=lambda x: -x[1])
    return scored


def resolve_blast_entity(query: str, graph: TypedGraph, min_score: float = 0.34) -> tuple[str | None, float, str]:
    """
    Pick best-matching entity id. min_score ~0.34 allows 1-of-3 query tokens to match
    only if that is the best candidate; typical country names need 2/2 overlap → 1.0.
    """
    if not query or not query.strip():
        return None, 0.0, "empty_query"

    ranked = _entity_match_scores(query, graph)
    if not ranked:
        logger.info(
            "[BlastRadius] resolve: no candidates (graph has %d entities)",
            len(graph.entities),
        )
        return None, 0.0, "no_candidates"

    best_id, best_score, best_reason = ranked[0]
    second = ranked[1][1] if len(ranked) > 1 else 0.0

    if best_score < min_score:
        logger.info(
            "[BlastRadius] resolve: best score %.3f below min %.2f for query=%r top=(%s, %s)",
            best_score,
            min_score,
            query.strip(),
            best_id,
            best_reason,
        )
        return None, best_score, "below_threshold"

    # Ambiguous: two entities tie closely
    if second >= best_score - 0.05 and second >= min_score and ranked[1][0] != best_id:
        logger.warning(
            "[BlastRadius] resolve: ambiguous query=%r — top %s (%.3f) vs %s (%.3f); picking top",
            query.strip(),
            best_id,
            best_score,
            ranked[1][0],
            second,
        )

    logger.info(
        "[BlastRadius] resolve: query=%r -> id=%s score=%.3f reason=%s (graph_entities=%d)",
        query.strip(),
        best_id,
        best_score,
        best_reason,
        len(graph.entities),
    )
    return best_id, best_score, best_reason


def suggest_entities(query: str, graph: TypedGraph, limit: int = 8) -> list[dict]:
    """Ranked suggestions for API + UX; scans full graph (not a stale [:20] slice)."""
    ranked = _entity_match_scores(query, graph)
    out = []
    for eid, sc, _ in ranked[:limit]:
        ent = graph.entities.get(eid)
        out.append({
            "id": eid,
            "label": ent.label if ent else eid.replace("_", " ").title(),
            "score": round(sc, 3),
        })
    return out


def _outgoing_edge_counts(entity_id: str, graph: TypedGraph) -> dict[str, int]:
    counts: dict[str, int] = {
        "traversal": 0,
        "strict_causal": 0,
        "archived_skipped": 0,
        "incoming_traversal": 0,
    }
    for edge in graph.edges.values():
        if edge.source == entity_id and edge.archived:
            counts["archived_skipped"] += 1
            continue
        if edge.archived:
            continue
        et = str(edge.type)
        if edge.source == entity_id and et in TRAVERSAL_EDGE_TYPES:
            counts["traversal"] += 1
        if edge.source == entity_id and et in STRICT_CAUSAL_TYPES:
            counts["strict_causal"] += 1
        if edge.target == entity_id and et in TRAVERSAL_EDGE_TYPES:
            counts["incoming_traversal"] += 1
    return counts

SYNTHESIS_SYSTEM_PROMPT = """You are INDRA, an autonomous geopolitical intelligence engine.
You have been given a causal impact analysis showing how one geopolitical event
cascades through connected entities. Synthesize this into a clear intelligence brief.
Be direct and analytical. Use bullet points for each causal chain.
Focus on the most high-confidence pathways. Highlight key uncertainties."""

SYNTHESIS_USER_TEMPLATE = """BLAST RADIUS ANALYSIS for: {entity}

The following causal chains have been identified in the knowledge graph:

{chains}

SUPPORTING EVIDENCE:
{evidence}

Synthesize this into a concise intelligence brief explaining:
1. The primary causal chain and its likelihood
2. Secondary effects at 2-3 hops
3. Key uncertainties and confidence caveats
4. Strategic implications for decision-makers"""


# ── BFS Causal Traversal ──────────────────────────────────────────────────────

def blast_radius_bfs(
    entity_id: str,
    graph: TypedGraph,
    max_depth: int = 3,
    min_confidence: float = 0.05,
) -> list[dict]:
    """
    BFS from entity_id over traversal edges (causal + related).
    Caller must pass a key that exists in graph.entities.
    Returns list of affected paths sorted by joint confidence (descending).
    """
    if entity_id not in graph.entities:
        logger.warning(
            "[BlastRadius] bfs: entity_id=%r not in graph (caller should resolve first)",
            entity_id,
        )
        return []

    # Build adjacency index: source → list of edges
    outgoing: dict[str, list[TypedEdge]] = {}
    for edge in graph.edges.values():
        if str(edge.type) in TRAVERSAL_EDGE_TYPES and not edge.archived:
            outgoing.setdefault(edge.source, []).append(edge)

    # BFS
    # State: (current_node, path_so_far, joint_confidence, evidence_collected)
    queue    = deque()
    visited  = set()
    results  = []

    queue.append((entity_id, [entity_id], 1.0, []))

    while queue:
        node, path, joint_conf, evidence = queue.popleft()

        depth = len(path) - 1
        if depth > 0:
            # Record this as an affected hop
            ent = graph.entities.get(node)
            results.append({
                "entity":       node,
                "label":        ent.label if ent else node.replace("_", " ").title(),
                "entity_type":  str(ent.type) if ent else "UNKNOWN",
                "domain":       ent.domain if ent else "general",
                "depth":        depth,
                "path":         list(path),
                "path_labels":  [
                    graph.entities[n].label if n in graph.entities else n.replace("_", " ").title()
                    for n in path
                ],
                "joint_confidence": round(joint_conf, 4),
                "evidence":     list(set(evidence))[:5],
            })

        if depth >= max_depth:
            continue

        state_key = (node, depth)
        if state_key in visited:
            continue
        visited.add(state_key)

        for edge in outgoing.get(node, []):
            next_node = edge.target
            new_conf  = joint_conf * edge.confidence
            if new_conf < min_confidence:
                continue
            new_evidence = evidence + edge.evidence
            new_path     = path + [next_node]
            queue.append((next_node, new_path, new_conf, new_evidence))

    for r in results:
        r.setdefault("traversal", "outgoing")

    # Sort by confidence descending, then by depth ascending
    results.sort(key=lambda x: (-x["joint_confidence"], x["depth"]))
    return results


def blast_radius_bfs_reverse(
    entity_id: str,
    graph: TypedGraph,
    max_depth: int = 3,
    min_confidence: float = 0.05,
) -> list[dict]:
    """
    Walk *incoming* edges (who points at this entity). Same path shape as forward BFS
    so the UI and LLM template stay unchanged; path reads root → … → upstream cause.
    """
    if entity_id not in graph.entities:
        return []

    incoming: dict[str, list[TypedEdge]] = {}
    for edge in graph.edges.values():
        if str(edge.type) in TRAVERSAL_EDGE_TYPES and not edge.archived:
            incoming.setdefault(edge.target, []).append(edge)

    queue   = deque()
    visited = set()
    results = []
    queue.append((entity_id, [entity_id], 1.0, []))

    while queue:
        node, path, joint_conf, evidence = queue.popleft()
        depth = len(path) - 1
        if depth > 0:
            ent = graph.entities.get(node)
            results.append({
                "entity":       node,
                "label":        ent.label if ent else node.replace("_", " ").title(),
                "entity_type":  str(ent.type) if ent else "UNKNOWN",
                "domain":       ent.domain if ent else "general",
                "depth":        depth,
                "path":         list(path),
                "path_labels":  [
                    graph.entities[n].label if n in graph.entities else n.replace("_", " ").title()
                    for n in path
                ],
                "joint_confidence": round(joint_conf, 4),
                "evidence":     list(set(evidence))[:5],
                "traversal":    "incoming",
            })

        if depth >= max_depth:
            continue

        state_key = (node, depth)
        if state_key in visited:
            continue
        visited.add(state_key)

        for edge in incoming.get(node, []):
            prev_node = edge.source
            new_conf  = joint_conf * edge.confidence
            if new_conf < min_confidence:
                continue
            new_evidence = evidence + edge.evidence
            new_path     = path + [prev_node]
            queue.append((prev_node, new_path, new_conf, new_evidence))

    results.sort(key=lambda x: (-x["joint_confidence"], x["depth"]))
    return results


# ── LLM Synthesis ──────────────────────────────────────────────────────────────

def _format_chains(paths: list[dict]) -> str:
    lines = []
    for p in paths[:20]:  # top 20 paths
        arrow_path = " → ".join(p["path_labels"])
        conf_pct   = int(p["joint_confidence"] * 100)
        lines.append(
            f"  [Depth {p['depth']}, {conf_pct}% confidence] "
            f"{arrow_path}"
            f"  [{p['entity_type']}]"
        )
    return "\n".join(lines) if lines else "  No causal chains found."


def _format_evidence(paths: list[dict]) -> str:
    all_evidence = []
    for p in paths[:10]:
        all_evidence.extend(p["evidence"])
    unique_ev = list(dict.fromkeys(all_evidence))[:10]
    if not unique_ev:
        return "  No direct source URLs available."
    return "\n".join(f"  - {url}" for url in unique_ev)


async def blast_radius_query(
    entity: str,
    depth: int = 3,
    llm_func = None,
    graph: TypedGraph = None,
) -> dict:
    """
    Full blast radius analysis: BFS + LLM synthesis.
    Returns structured dict ready for JSON API response.
    """
    if graph is None:
        graph = load_typed_graph()

    logger.info(
        "[BlastRadius] query start: raw=%r depth=%d entities=%d edges=%d",
        (entity or "").strip(),
        depth,
        len(graph.entities),
        len(graph.edges),
    )

    if len(graph.entities) == 0:
        logger.warning("[BlastRadius] typed graph empty — run bootstrap / sync")
        return {
            "entity":    entity,
            "error":     "Typed knowledge graph is empty. Run bootstrap first.",
            "paths":     [],
            "synthesis": None,
            "suggestions": [],
        }

    resolved_id, match_score, resolve_reason = resolve_blast_entity(entity, graph)
    suggestions = suggest_entities(entity, graph, limit=10)

    if resolved_id is None:
        sample_ids = list(graph.entities.keys())[:15]
        logger.warning(
            "[BlastRadius] unresolved query=%r best_score=%.3f reason=%s sample_entity_ids=%s",
            (entity or "").strip(),
            match_score,
            resolve_reason,
            sample_ids,
        )
        return {
            "entity":         entity,
            "error":          f"Could not match '{entity}' to any entity in the typed graph.",
            "resolve_reason": resolve_reason,
            "best_score":     round(match_score, 4) if match_score else None,
            "suggestions":    suggestions,
            "paths":          [],
            "synthesis":      None,
        }

    edge_diag = _outgoing_edge_counts(resolved_id, graph)
    logger.info(
        "[BlastRadius] resolved_id=%s match_score=%.3f out=%d in=%d strict_causal=%d",
        resolved_id,
        match_score,
        edge_diag["traversal"],
        edge_diag["incoming_traversal"],
        edge_diag["strict_causal"],
    )

    paths = blast_radius_bfs(resolved_id, graph, max_depth=depth)
    traversal_mode = "outgoing"
    if not paths:
        rev_paths = blast_radius_bfs_reverse(resolved_id, graph, max_depth=depth)
        if rev_paths:
            paths = rev_paths
            traversal_mode = "incoming"
            logger.info(
                "[BlastRadius] forward BFS empty; using incoming traversal (%d paths)",
                len(paths),
            )

    if not paths:
        ent = graph.entities.get(resolved_id)
        logger.warning(
            "[BlastRadius] no paths id=%s label=%r depth<=%d edge_diag=%s",
            resolved_id,
            ent.label if ent else None,
            depth,
            edge_diag,
        )
        return {
            "entity":             entity,
            "resolved_entity_id": resolved_id,
            "resolved_label":     ent.label if ent else resolved_id.replace("_", " ").title(),
            "error":              (
                "Entity matched, but no graph paths within depth — "
                "no traversable outgoing or incoming edges (or all pruned by min confidence)."
            ),
            "edge_summary":       edge_diag,
            "suggestions":        suggestions,
            "paths":              [],
            "synthesis":          None,
        }

    synthesis = None
    if llm_func and paths:
        chains_text   = _format_chains(paths)
        evidence_text = _format_evidence(paths)
        prompt = SYNTHESIS_USER_TEMPLATE.format(
            entity=entity,
            chains=chains_text,
            evidence=evidence_text,
        )
        try:
            synthesis = await llm_func(
                prompt, system_prompt=SYNTHESIS_SYSTEM_PROMPT
            )
        except Exception as e:
            logger.warning(f"[BlastRadius] LLM synthesis failed: {e}")
            synthesis = "Synthesis unavailable — LLM error."

    # Group paths by depth level
    depth_groups = {}
    for p in paths:
        d = p["depth"]
        depth_groups.setdefault(d, []).append(p)

    logger.info(
        "[BlastRadius] success: resolved_id=%s mode=%s paths=%d (returning top 30)",
        resolved_id,
        traversal_mode,
        len(paths),
    )

    return {
        "entity":             entity,
        "resolved_entity_id": resolved_id,
        "entity_found":       resolved_id,
        "traversal_mode":     traversal_mode,
        "match_score":        round(match_score, 4),
        "total_affected":     len(paths),
        "max_depth":          depth,
        "depth_summary":      {
            d: {
                "count": len(dp),
                "top_entity": dp[0]["label"] if dp else None,
                "top_confidence": dp[0]["joint_confidence"] if dp else 0,
            }
            for d, dp in depth_groups.items()
        },
        "paths":              paths[:30],
        "synthesis":          synthesis,
    }


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s",
        datefmt="%H:%M:%S"
    )

    entity = sys.argv[1] if len(sys.argv) > 1 else "IRAN"
    depth  = int(sys.argv[2]) if len(sys.argv) > 2 else 3

    async def main():
        from provider_router import llm_complete
        print(f"\n=== INDRA Blast Radius: {entity} (depth={depth}) ===\n")
        result = await blast_radius_query(entity, depth=depth, llm_func=llm_complete)
        print(f"Total affected entities: {result['total_affected']}")
        print("\nTop causal paths:")
        for p in result["paths"][:10]:
            chain = " → ".join(p["path_labels"])
            print(f"  [{p['depth']}] {chain} ({int(p['joint_confidence']*100)}%)")
        if result.get("synthesis"):
            print("\n── Intelligence Brief ──")
            print(result["synthesis"])

    asyncio.run(main())
