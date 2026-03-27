"""
typed_ontology.py — INDRA v2 Typed Knowledge Graph
====================================================
Parallel typed graph store alongside LightRAG's graphml.
Uses Pydantic v2 for all schema validation.
Stored in: indra_data/typed_graph.json
Archived:  indra_data/archived_edges.json
"""

import os
import json
import time
import logging
import asyncio
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger("INDRA.TypedOntology")

TYPED_GRAPH_FILE   = "./indra_data/typed_graph.json"
ARCHIVED_FILE      = "./indra_data/archived_edges.json"

os.makedirs("./indra_data", exist_ok=True)


# ── Enums ──────────────────────────────────────────────────────────────────────

class EntityType(str, Enum):
    NATION            = "NATION"
    LEADER            = "LEADER"
    ORGANIZATION      = "ORGANIZATION"
    MILITARY_UNIT     = "MILITARY_UNIT"
    TREATY            = "TREATY"
    ECONOMIC_INDICATOR = "ECONOMIC_INDICATOR"
    CONFLICT_ZONE     = "CONFLICT_ZONE"
    POLICY            = "POLICY"
    TECHNOLOGY        = "TECHNOLOGY"
    NATURAL_RESOURCE  = "NATURAL_RESOURCE"
    ALLIANCE          = "ALLIANCE"
    SANCTION          = "SANCTION"
    UNKNOWN           = "UNKNOWN"


class EdgeType(str, Enum):
    CAUSES       = "CAUSES"
    BLOCKS       = "BLOCKS"
    FUNDS        = "FUNDS"
    CONTROLS     = "CONTROLS"
    THREATENS    = "THREATENS"
    SUPPORTS     = "SUPPORTS"
    TRADES_WITH  = "TRADES_WITH"
    SANCTIONS    = "SANCTIONS"
    ALLIES_WITH  = "ALLIES_WITH"
    COMPETES_WITH = "COMPETES_WITH"
    RELATED_TO   = "RELATED_TO"


# Edges with high temporal sensitivity → faster decay
FAST_DECAY_EDGES = {EdgeType.THREATENS, EdgeType.CAUSES, EdgeType.BLOCKS}
SLOW_DECAY_EDGES = {EdgeType.ALLIES_WITH, EdgeType.TRADES_WITH}


# ── Pydantic v2 models ────────────────────────────────────────────────────────

class TypedEntity(BaseModel):
    id:         str
    label:      str
    type:       EntityType      = EntityType.UNKNOWN
    domain:     str             = "general"
    first_seen: datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen:  datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"use_enum_values": True}

    @field_validator("id", mode="before")
    @classmethod
    def normalize_id(cls, v):
        return str(v).strip().upper().replace(" ", "_")[:80]


class TypedEdge(BaseModel):
    source:         str
    target:         str
    type:           EdgeType        = EdgeType.RELATED_TO
    confidence:     float           = Field(default=0.7, ge=0.0, le=1.0)
    first_seen:     datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_confirmed: datetime        = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_count:   int             = 1
    evidence:       list[str]       = Field(default_factory=list)
    stale:          bool            = False
    archived:       bool            = False

    model_config = {"use_enum_values": True}

    @property
    def edge_key(self) -> str:
        return f"{self.source}|{self.type}|{self.target}"

    def decay_lambda(self) -> float:
        etype = EdgeType(self.type)
        if etype in FAST_DECAY_EDGES:
            return 0.2
        if etype in SLOW_DECAY_EDGES:
            return 0.05
        return 0.1

    def apply_decay(self) -> "TypedEdge":
        import math
        now = datetime.now(timezone.utc)
        days = (now - self.last_confirmed).total_seconds() / 86400
        lam  = self.decay_lambda()
        new_conf = self.confidence * math.exp(-lam * days)
        return self.model_copy(update={"confidence": round(max(new_conf, 0.0), 4)})


class TypedGraph(BaseModel):
    entities:       dict[str, TypedEntity] = Field(default_factory=dict)
    edges:          dict[str, TypedEdge]   = Field(default_factory=dict)
    last_updated:   datetime               = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"use_enum_values": True}


# ── Persistence ────────────────────────────────────────────────────────────────

def load_typed_graph() -> TypedGraph:
    if Path(TYPED_GRAPH_FILE).exists():
        try:
            with open(TYPED_GRAPH_FILE, "r") as f:
                data = json.load(f)
            return TypedGraph.model_validate(data)
        except Exception as e:
            logger.warning(f"[TypedGraph] Could not load graph: {e}. Starting fresh.")
    return TypedGraph()


def save_typed_graph(graph: TypedGraph):
    with open(TYPED_GRAPH_FILE, "w") as f:
        json.dump(graph.model_dump(mode="json"), f, indent=2, default=str)
    logger.debug(f"[TypedGraph] Saved: {len(graph.entities)} entities, {len(graph.edges)} edges")


# ── LLM extraction prompt ─────────────────────────────────────────────────────

EXTRACTION_SYSTEM_PROMPT = """You are a geopolitical knowledge graph extraction engine.
Extract entities and relationships from the given text.
You MUST respond with ONLY valid JSON — no explanation, no markdown, no code blocks.

Output this exact JSON structure:
{
  "entities": [
    {"id": "ENTITY_NAME", "label": "Human Label", "type": "ENTITY_TYPE"}
  ],
  "edges": [
    {
      "source": "ENTITY_ID",
      "target": "ENTITY_ID", 
      "type": "EDGE_TYPE",
      "confidence": 0.85,
      "evidence_snippet": "brief quote from text"
    }
  ]
}

Valid ENTITY_TYPE values (use exactly one):
NATION, LEADER, ORGANIZATION, MILITARY_UNIT, TREATY, ECONOMIC_INDICATOR,
CONFLICT_ZONE, POLICY, TECHNOLOGY, NATURAL_RESOURCE, ALLIANCE, SANCTION, UNKNOWN

Valid EDGE_TYPE values (use exactly one):
CAUSES, BLOCKS, FUNDS, CONTROLS, THREATENS, SUPPORTS,
TRADES_WITH, SANCTIONS, ALLIES_WITH, COMPETES_WITH, RELATED_TO

Rules:
- Extract 3-8 entities and 2-6 edges maximum
- confidence must be 0.0 to 1.0 (your certainty this relationship exists)
- Use high confidence (>0.8) only for explicit direct statements
- Use lower confidence (0.4-0.7) for implied relationships
- Entity IDs: uppercase, underscores, no spaces (e.g. "IRAN", "PM_MODI", "NATO")
- ONLY output JSON. Any other text will cause a parse failure."""

EXTRACTION_USER_TEMPLATE = """Extract geopolitical entities and relationships from this text:

DOMAIN: {domain}
SOURCE: {source}
DATE: {date}

TEXT:
{text}"""


# ── LLM-powered extraction ────────────────────────────────────────────────────

async def extract_typed_triples(
    article: dict,
    llm_func,
    max_retries: int = 2,
) -> tuple[list[TypedEntity], list[TypedEdge]]:
    """
    Call the LLM to extract typed entities + edges from an article.
    Returns (entities, edges). On failure returns empty lists.
    """
    prompt = EXTRACTION_USER_TEMPLATE.format(
        domain=article.get("domain", "general"),
        source=article.get("source", "unknown"),
        date=article.get("date", "unknown"),
        text=article.get("text", "")[:1200],
    )

    for attempt in range(max_retries):
        try:
            raw = await llm_func(prompt, system_prompt=EXTRACTION_SYSTEM_PROMPT)
            if not raw or not raw.strip():
                continue

            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(
                    l for l in lines if not l.strip().startswith("```")
                )

            parsed = json.loads(cleaned)
            entities = []
            edges    = []
            evidence_url = article.get("url", "")
            now = datetime.now(timezone.utc)

            for e in parsed.get("entities", []):
                try:
                    ent = TypedEntity(
                        id     = str(e.get("id", "UNKNOWN")),
                        label  = str(e.get("label", e.get("id", "Unknown"))),
                        type   = e.get("type", "UNKNOWN"),
                        domain = article.get("domain", "general"),
                        first_seen = now,
                        last_seen  = now,
                    )
                    entities.append(ent)
                except Exception as ve:
                    logger.debug(f"[TypedGraph] Entity validation failed: {ve}")

            for ed in parsed.get("edges", []):
                try:
                    edge = TypedEdge(
                        source         = str(ed.get("source", "")),
                        target         = str(ed.get("target", "")),
                        type           = ed.get("type", "RELATED_TO"),
                        confidence     = float(ed.get("confidence", 0.5)),
                        first_seen     = now,
                        last_confirmed = now,
                        source_count   = 1,
                        evidence       = [evidence_url] if evidence_url else [],
                    )
                    if edge.source and edge.target:
                        edges.append(edge)
                except Exception as ve:
                    logger.debug(f"[TypedGraph] Edge validation failed: {ve}")

            logger.info(
                f"[TypedGraph] Extracted {len(entities)} entities, {len(edges)} edges "
                f"from '{article.get('title','')[:50]}'"
            )
            return entities, edges

        except json.JSONDecodeError as e:
            logger.warning(f"[TypedGraph] JSON parse error (attempt {attempt+1}): {e}")
        except Exception as e:
            logger.warning(f"[TypedGraph] Extraction error (attempt {attempt+1}): {e}")

    return [], []


# ── Graph merging ──────────────────────────────────────────────────────────────

def merge_into_graph(
    graph: TypedGraph,
    entities: list[TypedEntity],
    edges: list[TypedEdge],
) -> TypedGraph:
    """Upsert entities and edges into the typed graph."""
    now = datetime.now(timezone.utc)

    for ent in entities:
        if ent.id in graph.entities:
            existing = graph.entities[ent.id]
            # Keep earliest first_seen, update last_seen
            graph.entities[ent.id] = existing.model_copy(update={"last_seen": now})
        else:
            graph.entities[ent.id] = ent

    for edge in edges:
        key = edge.edge_key
        if key in graph.edges:
            existing = graph.edges[key]
            # Merge: blend confidence, increment source count, extend evidence
            blended = min(1.0, (existing.confidence + edge.confidence) / 2 + 0.05)
            new_evidence = list(set(existing.evidence + edge.evidence))[:20]
            graph.edges[key] = existing.model_copy(update={
                "confidence":     round(blended, 4),
                "last_confirmed": now,
                "source_count":   existing.source_count + 1,
                "evidence":       new_evidence,
                "stale":          False,
            })
        else:
            graph.edges[key] = edge

    graph.last_updated = now
    return graph


# ── Local NLP extraction (zero LLM cost) + optional LLM fallback ────────────────

LLM_FALLBACK_THRESHOLD = 0.6   # call LLM only if local confidence < this


def _raw_to_pydantic(
    raw_entities: list[dict],
    raw_edges:    list[dict],
) -> tuple[list[TypedEntity], list[TypedEdge]]:
    """Convert raw dicts from local_extractor into Pydantic TypedEntity/TypedEdge."""
    now = datetime.now(timezone.utc)
    entities, edges = [], []

    for e in raw_entities:
        try:
            entities.append(TypedEntity(
                id=e["id"], label=e["label"],
                type=e.get("type", "UNKNOWN"),
                domain=e.get("domain", "general"),
                first_seen=now, last_seen=now,
            ))
        except Exception as ve:
            logger.debug(f"[TypedGraph] Entity validation failed: {ve}")

    for ed in raw_edges:
        try:
            edge = TypedEdge(
                source=ed["source"], target=ed["target"],
                type=ed.get("type", "RELATED_TO"),
                confidence=float(ed.get("confidence", 0.5)),
                first_seen=now, last_confirmed=now,
                source_count=1,
                evidence=ed.get("evidence", []),
            )
            if edge.source and edge.target:
                edges.append(edge)
        except Exception as ve:
            logger.debug(f"[TypedGraph] Edge validation failed: {ve}")

    return entities, edges


async def ingest_article_to_typed_graph(
    article: dict,
    llm_func,
    use_local: bool = True,
):
    """
    Primary ingestion path:
      1. Try spaCy NER + REBEL (zero LLM cost, local models)
      2. If local confidence < LLM_FALLBACK_THRESHOLD → one LLM call fallback
      3. Persist to typed_graph.json

    Set use_local=False to force LLM extraction (testing only).
    """
    try:
        entities: list[TypedEntity] = []
        edges:    list[TypedEdge]   = []
        used_llm = False

        if use_local:
            try:
                from local_extractor import extract_local
                raw_ents, raw_edges, conf = extract_local(article)

                if conf >= LLM_FALLBACK_THRESHOLD or not llm_func:
                    # Good enough — use local results
                    entities, edges = _raw_to_pydantic(raw_ents, raw_edges)
                    logger.debug(
                        f"[TypedGraph] Local extraction ok (conf={conf:.2f}), skipping LLM"
                    )
                else:
                    # Low confidence — fall back to LLM for this article
                    logger.info(
                        f"[TypedGraph] Local conf={conf:.2f} < {LLM_FALLBACK_THRESHOLD}, "
                        f"using LLM fallback for '{article.get('title','')[:40]}'"
                    )
                    entities, edges = await extract_typed_triples(article, llm_func)
                    used_llm = True

            except ImportError:
                # local_extractor not available — fall back to LLM always
                logger.warning("[TypedGraph] local_extractor not found — using LLM")
                entities, edges = await extract_typed_triples(article, llm_func)
                used_llm = True
        else:
            entities, edges = await extract_typed_triples(article, llm_func)
            used_llm = True

        if not entities and not edges:
            return

        graph = load_typed_graph()
        graph = merge_into_graph(graph, entities, edges)
        save_typed_graph(graph)

        logger.info(
            f"[TypedGraph] +{len(entities)} entities, +{len(edges)} edges "
            f"({'LLM' if used_llm else 'local'})"
        )

    except Exception as e:
        logger.error(f"[TypedGraph] ingest_article_to_typed_graph failed: {e}")


# ── API helpers for server.py ─────────────────────────────────────────────────

def get_typed_graph_summary() -> dict:
    graph = load_typed_graph()
    entity_types = {}
    for ent in graph.entities.values():
        t = str(ent.type)
        entity_types[t] = entity_types.get(t, 0) + 1

    edge_types = {}
    stale_count = 0
    for edge in graph.edges.values():
        t = str(edge.type)
        edge_types[t] = edge_types.get(t, 0) + 1
        if edge.stale:
            stale_count += 1

    return {
        "total_entities": len(graph.entities),
        "total_edges":    len(graph.edges),
        "stale_edges":    stale_count,
        "entity_types":   entity_types,
        "edge_types":     edge_types,
        "last_updated":   graph.last_updated.isoformat(),
    }


def get_typed_graph_for_domain(domain: str) -> dict:
    """Return nodes/edges filtered by domain for the UI panels."""
    graph = load_typed_graph()
    domain_entities = {
        eid: ent for eid, ent in graph.entities.items()
        if ent.domain == domain
    }
    domain_ids = set(domain_entities.keys())

    # Edges where both endpoints are in this domain
    domain_edges = {
        key: edge for key, edge in graph.edges.items()
        if edge.source in domain_ids or edge.target in domain_ids
    }

    nodes = [
        {
            "id":         eid,
            "label":      ent.label,
            "type":       str(ent.type),
            "domain":     ent.domain,
            "confidence": 1.0,
        }
        for eid, ent in domain_entities.items()
    ]
    edges_out = [
        {
            "from":       e.source,
            "to":         e.target,
            "label":      str(e.type),
            "confidence": e.confidence,
            "stale":      e.stale,
        }
        for e in domain_edges.values()
    ]
    return {"nodes": nodes, "edges": edges_out}


def get_cross_domain_edges() -> dict:
    """Return edges that span across different domains."""
    graph = load_typed_graph()
    cross = []
    for edge in graph.edges.values():
        src_domain = graph.entities.get(edge.source, TypedEntity(id=edge.source, label=edge.source)).domain
        tgt_domain = graph.entities.get(edge.target, TypedEntity(id=edge.target, label=edge.target)).domain
        if src_domain != tgt_domain:
            cross.append({
                "from":         edge.source,
                "to":           edge.target,
                "label":        str(edge.type),
                "confidence":   edge.confidence,
                "src_domain":   src_domain,
                "tgt_domain":   tgt_domain,
                "stale":        edge.stale,
            })
    return {"edges": cross, "count": len(cross)}
