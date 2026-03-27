"""
blast_radius.py — INDRA v2 Causal Impact Query Engine
======================================================
Answers: "If X happens, what else is affected and how?"

Algorithm:
  1. Find entity in typed_graph
  2. BFS over OUTGOING causal edges (CAUSES, THREATENS, BLOCKS) to depth 3
  3. Multiply confidence scores at each hop (joint probability)
  4. Rank affected entities by combined confidence
  5. Pass compact subgraph to LLM for causal synthesis

Usage:
  POST /api/blast-radius  {"entity": "PAKISTAN", "depth": 3}
  OR: python blast_radius.py "PAKISTAN"
"""

import os
import json
import logging
import asyncio
from collections import deque

from typed_ontology import (
    load_typed_graph, TypedGraph, TypedEdge, EdgeType
)

logger = logging.getLogger("INDRA.BlastRadius")

# Edges that propagate causal impact
CAUSAL_EDGE_TYPES = {
    EdgeType.CAUSES.value,
    EdgeType.THREATENS.value,
    EdgeType.BLOCKS.value,
    EdgeType.SANCTIONS.value,
    EdgeType.CONTROLS.value,
}

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
    BFS from entity_id over causal edges.
    Returns list of affected paths sorted by joint confidence (descending).
    """
    # Normalize: entity IDs in typed graph are uppercase_underscored
    entity_id = entity_id.strip().upper().replace(" ", "_")

    # Check direct match or fuzzy match
    if entity_id not in graph.entities:
        # Try case-insensitive prefix match
        matches = [
            eid for eid in graph.entities
            if entity_id in eid or eid in entity_id
        ]
        if not matches:
            return []
        entity_id = matches[0]
        logger.info(f"[BlastRadius] Fuzzy matched '{entity_id}'")

    # Build adjacency index: source → list of edges
    outgoing: dict[str, list[TypedEdge]] = {}
    for edge in graph.edges.values():
        if str(edge.type) in CAUSAL_EDGE_TYPES and not edge.archived:
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

    # Sort by confidence descending, then by depth ascending
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

    if len(graph.entities) == 0:
        return {
            "entity":    entity,
            "error":     "Typed knowledge graph is empty. Run bootstrap first.",
            "paths":     [],
            "synthesis": None,
        }

    paths = blast_radius_bfs(entity, graph, max_depth=depth)

    if not paths:
        # Try to find nearby entities to suggest
        entity_norm = entity.strip().upper().replace(" ", "_")
        suggestions = [
            eid for eid in list(graph.entities.keys())[:20]
            if any(word in eid for word in entity_norm.split("_"))
        ]
        return {
            "entity":      entity,
            "error":       f"Entity '{entity}' not found in typed graph.",
            "suggestions": suggestions[:5],
            "paths":       [],
            "synthesis":   None,
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

    return {
        "entity":        entity,
        "entity_found":  entity.strip().upper().replace(" ", "_"),
        "total_affected": len(paths),
        "max_depth":     depth,
        "depth_summary": {
            d: {
                "count": len(dp),
                "top_entity": dp[0]["label"] if dp else None,
                "top_confidence": dp[0]["joint_confidence"] if dp else 0,
            }
            for d, dp in depth_groups.items()
        },
        "paths":         paths[:30],  # top 30 paths
        "synthesis":     synthesis,
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
