"""
local_extractor.py — INDRA v2 Zero-Cost Local NLP Extraction
=============================================================
Replaces LLM-based entity + relation extraction during ingestion with:
  1. spaCy NER (en_core_web_sm)   → entities → EntityType mapping
  2. REBEL model (Babelscape/rebel-large) → (head, rel, tail) triples → EdgeType mapping
  3. Rule-based confidence scoring → decides if LLM fallback is needed

LLM is now ONLY called at query time (synthesis), not during ingestion.

Models are lazy-loaded once on first use.
First run will download REBEL (~900MB) and spaCy model (~50MB) — cache forever.

Usage:
  from local_extractor import extract_local
  entities, edges = extract_local(article)   # zero API calls
"""

import re
import logging
from typing import Optional

logger = logging.getLogger("INDRA.LocalExtractor")

# ── spaCy NER label → EntityType ───────────────────────────────────────────────
SPACY_TO_ENTITY_TYPE = {
    "GPE":    "NATION",          # Geopolitical entity (country, city, state)
    "NORP":   "ORGANIZATION",    # Nationalities, religious/political groups
    "ORG":    "ORGANIZATION",    # Companies, agencies, institutions
    "PERSON": "LEADER",          # People's names
    "LOC":    "CONFLICT_ZONE",   # Non-GPE location (mountain, river)
    "FAC":    "CONFLICT_ZONE",   # Buildings, airports, etc.
    "LAW":    "TREATY",          # Named laws, treaties, articles
    "MONEY":  "ECONOMIC_INDICATOR",
    "PERCENT":"ECONOMIC_INDICATOR",
    "PRODUCT":"TECHNOLOGY",
    "WORK_OF_ART": "UNKNOWN",
    "EVENT":  "CONFLICT_ZONE",
    "DATE":   "UNKNOWN",
    "TIME":   "UNKNOWN",
}

# ── REBEL relation string → EdgeType ───────────────────────────────────────────
# REBEL outputs Wikidata-style relation names; we map to our EdgeType vocabulary
REBEL_TO_EDGE_TYPE = {
    # Conflict / causal
    "conflict":                   "CAUSES",
    "war":                        "CAUSES",
    "attack":                     "THREATENS",
    "military operation":         "THREATENS",
    "threatens":                  "THREATENS",
    "threatened by":              "THREATENS",
    "blockade":                   "BLOCKS",
    "sanctions":                  "SANCTIONS",
    "sanctioned by":              "SANCTIONS",
    "economic sanctions":         "SANCTIONS",
    # Support / alliance
    "alliance":                   "ALLIES_WITH",
    "allied with":                 "ALLIES_WITH",
    "member of":                   "ALLIES_WITH",
    "part of":                     "ALLIES_WITH",
    "supported by":                "SUPPORTS",
    "support":                     "SUPPORTS",
    "diplomatic support":          "SUPPORTS",
    # Control / power
    "controlled by":              "CONTROLS",
    "controls":                   "CONTROLS",
    "occupation":                 "CONTROLS",
    "owned by":                   "CONTROLS",
    "head of government":         "CONTROLS",
    "head of state":              "CONTROLS",
    "officeholder":               "CONTROLS",
    "employer":                   "CONTROLS",
    # Economic
    "trade":                      "TRADES_WITH",
    "trading partner":            "TRADES_WITH",
    "export":                     "TRADES_WITH",
    "import":                     "TRADES_WITH",
    "currency":                   "ECONOMIC_INDICATOR",
    "funding":                    "FUNDS",
    "funded by":                  "FUNDS",
    "sponsor":                    "FUNDS",
    "financial support":          "FUNDS",
    # Competition
    "competition":                "COMPETES_WITH",
    "rival":                      "COMPETES_WITH",
    "competitor":                 "COMPETES_WITH",
    # Fallback
    "subclass of":                "RELATED_TO",
    "instance of":                "RELATED_TO",
    "country":                    "RELATED_TO",
    "country of citizenship":     "RELATED_TO",
    "located in":                 "RELATED_TO",
    "located in the administrative territorial entity": "RELATED_TO",
    "capital":                    "RELATED_TO",
    "headquarters location":      "RELATED_TO",
    "diplomatic relation":        "ALLIES_WITH",
    "shares border with":         "RELATED_TO",
    "ethnic group":               "RELATED_TO",
    "religion":                   "RELATED_TO",
}

# ── Domain tag heuristics (keyword-based) ─────────────────────────────────────
DOMAIN_KEYWORDS = {
    "defense":     {"military", "army", "war", "weapon", "missile", "navy",
                    "airforce", "troops", "soldier", "bomb", "nuclear", "attack",
                    "defense", "defence", "conflict", "idf", "nato"},
    "economics":   {"economy", "gdp", "trade", "market", "inflation", "tariff",
                    "sanctions", "dollar", "rupee", "stock", "export", "import",
                    "bank", "imf", "debt", "finance", "currency", "price"},
    "technology":  {"ai", "cyber", "tech", "digital", "software", "hack",
                    "internet", "chip", "semiconductor", "data", "satellite",
                    "space", "5g", "quantum", "robot"},
    "climate":     {"climate", "carbon", "emission", "renewable", "solar", "wind",
                    "flood", "drought", "temperature", "environment", "cop",
                    "deforestation", "fossil", "oil leak", "pollution"},
    "society":     {"election", "protest", "rights", "refugee", "migrants",
                    "democracy", "constitution", "poverty", "health", "education",
                    "pandemic", "vaccine", "culture", "religion"},
}

def infer_domain(text: str, declared_domain: str = "geopolitics") -> str:
    text_lower = text.lower()
    scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        scores[domain] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] >= 2 else declared_domain


# ── Lazy model loaders ────────────────────────────────────────────────────────

_spacy_nlp = None
_rebel_pipeline = None


def _get_spacy():
    global _spacy_nlp
    if _spacy_nlp is None:
        import spacy
        model_name = "en_core_web_sm"
        try:
            _spacy_nlp = spacy.load(model_name)
            logger.info(f"[NLP] spaCy loaded: {model_name}")
        except OSError:
            logger.warning(f"[NLP] {model_name} not found — downloading...")
            import subprocess, sys
            subprocess.run(
                [sys.executable, "-m", "spacy", "download", model_name],
                check=True, capture_output=True
            )
            _spacy_nlp = spacy.load(model_name)
            logger.info(f"[NLP] spaCy {model_name} downloaded and loaded")
    return _spacy_nlp


def _get_rebel():
    global _rebel_pipeline
    if _rebel_pipeline is None:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        logger.info("[NLP] Loading REBEL model (first time ~30s)...")
        _rebel_pipeline = {
            "tokenizer": AutoTokenizer.from_pretrained("Babelscape/rebel-large"),
            "model":     AutoModelForSeq2SeqLM.from_pretrained("Babelscape/rebel-large"),
        }
        logger.info("[NLP] REBEL model loaded.")
    return _rebel_pipeline


# ── REBEL output decoder ──────────────────────────────────────────────────────

def _decode_rebel_output(generated_text: str) -> list[dict]:
    """
    Decode REBEL's special token format into (head, type, tail) triplets.
    Format: <triplet> head <subj> tail <obj> relation
    """
    triplets = []
    relation = subject = object_ = ""
    current   = "x"

    tokens = generated_text.strip()
    for pat in ["<s>", "</s>", "<pad>"]:
        tokens = tokens.replace(pat, "")
    tokens = tokens.split()

    for token in tokens:
        if token == "<triplet>":
            if relation and subject and object_:
                triplets.append({
                    "head": subject.strip(),
                    "type": relation.strip(),
                    "tail": object_.strip(),
                })
            subject = relation = object_ = ""
            current = "t"
        elif token == "<subj>":
            if relation and subject and object_:
                triplets.append({
                    "head": subject.strip(),
                    "type": relation.strip(),
                    "tail": object_.strip(),
                })
            object_ = ""
            current = "s"
        elif token == "<obj>":
            relation = ""
            current  = "o"
        else:
            if current == "t":
                subject  += " " + token
            elif current == "s":
                object_  += " " + token
            elif current == "o":
                relation += " " + token

    if subject and relation and object_:
        triplets.append({
            "head": subject.strip(),
            "type": relation.strip(),
            "tail": object_.strip(),
        })
    return triplets


# ── Relation mapper ───────────────────────────────────────────────────────────

def _map_relation(rebel_type: str) -> tuple[str, float]:
    """
    Map a REBEL relation string to our EdgeType.
    Returns (edge_type_str, confidence_adjustment).
    """
    lower = rebel_type.lower().strip()

    # Direct match
    if lower in REBEL_TO_EDGE_TYPE:
        return REBEL_TO_EDGE_TYPE[lower], 0.0

    # Partial/keyword match with penalty
    for key, mapped in REBEL_TO_EDGE_TYPE.items():
        if key in lower or lower in key:
            return mapped, -0.1

    # Unknown relation — treat as RELATED_TO with low confidence
    return "RELATED_TO", -0.25


# ── Entity normalizer ─────────────────────────────────────────────────────────

def _normalize_entity_id(text: str) -> str:
    """Normalise entity text to a consistent ID format."""
    cleaned = re.sub(r"[^a-zA-Z0-9\s\-]", "", text)
    cleaned = cleaned.strip().upper().replace(" ", "_").replace("-", "_")
    # Remove common stop prefixes
    for prefix in ["THE_", "A_", "AN_"]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
    return cleaned[:80]


# ── Confidence scorer ─────────────────────────────────────────────────────────

def _score_extraction(
    entities: list,
    edges: list[dict],
    entity_ids: set[str],
) -> float:
    """
    Compute extraction quality score 0–1.
    Uses edge dicts with 'source'/'target' keys (already converted).
    """
    if not entities:
        return 0.0
    if not edges:
        return 0.3  # entities found but no relations

    # What fraction of edge endpoints are known entities?
    edge_entities = set()
    for e in edges:
        edge_entities.add(e.get("source", ""))
        edge_entities.add(e.get("target", ""))

    overlap = len(edge_entities & entity_ids) / max(len(edge_entities), 1)
    score = 0.4 + overlap * 0.6
    return min(score, 1.0)


# ── Main extraction function ──────────────────────────────────────────────────

def extract_local(
    article: dict,
) -> tuple[list[dict], list[dict], float]:
    """
    Extract entities and relations from an article using local NLP models.
    Returns (raw_entities, raw_edges, confidence_score).
    All dicts are plain Python — typed_ontology.py converts to Pydantic models.

    entity dict:
      {"id": str, "label": str, "type": str, "domain": str}

    edge dict:
      {"source": str, "target": str, "type": str, "confidence": float,
       "evidence": [url]}
    """
    text = article.get("text", "")
    if not text or len(text) < 30:
        return [], [], 0.0

    declared_domain = article.get("domain", "geopolitics")
    domain = infer_domain(text, declared_domain)
    evidence = [article.get("url", "")] if article.get("url") else []

    # ── 1. spaCy NER ──────────────────────────────────────────────────────────
    nlp      = _get_spacy()
    doc      = nlp(text[:1000])  # cap at 1k chars for speed
    raw_ents = []
    seen_ids = set()

    for ent in doc.ents:
        etype = SPACY_TO_ENTITY_TYPE.get(ent.label_, "UNKNOWN")
        if etype == "UNKNOWN":
            continue
        eid = _normalize_entity_id(ent.text)
        if not eid or eid in seen_ids:
            continue
        seen_ids.add(eid)
        raw_ents.append({
            "id":     eid,
            "label":  ent.text,
            "type":   etype,
            "domain": domain,
        })

    # ── 2. REBEL relation extraction ─────────────────────────────────────────
    raw_edges = []
    try:
        rebel   = _get_rebel()
        tok     = rebel["tokenizer"]
        model   = rebel["model"]
        inputs  = tok(
            text[:512], return_tensors="pt",
            padding=True, truncation=True, max_length=256
        )
        outputs = model.generate(
            **inputs,
            max_length=256,
            length_penalty=0,
            num_beams=3,
            num_return_sequences=3,
        )
        raw_triplets = []
        for out in outputs:
            decoded = tok.decode(out, skip_special_tokens=False)
            raw_triplets.extend(_decode_rebel_output(decoded))

        for triplet in raw_triplets:
            head_id = _normalize_entity_id(triplet["head"])
            tail_id = _normalize_entity_id(triplet["tail"])
            if not head_id or not tail_id or head_id == tail_id:
                continue

            edge_type, conf_adj = _map_relation(triplet["type"])
            confidence = round(max(0.45 + conf_adj, 0.1), 3)

            raw_edges.append({
                "source":     head_id,
                "target":     tail_id,
                "type":       edge_type,
                "confidence": confidence,
                "evidence":   evidence,
            })

            # Auto-add entities from triplet if not already in spaCy results
            for eid in [head_id, tail_id]:
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    raw_ents.append({
                        "id":     eid,
                        "label":  eid.replace("_", " ").title(),
                        "type":   "UNKNOWN",
                        "domain": domain,
                    })

    except Exception as e:
        logger.warning(f"[LocalExtractor] REBEL failed, using NER-only: {e}")

    # ── 3. Confidence score ───────────────────────────────────────────────────
    confidence_score = _score_extraction(raw_ents, raw_edges, seen_ids)

    logger.info(
        f"[LocalExtractor] '{article.get('title','')[:50]}' → "
        f"{len(raw_ents)} entities, {len(raw_edges)} edges, "
        f"conf={confidence_score:.2f}"
    )

    return raw_ents, raw_edges, confidence_score


# ── CLI smoke test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

    sample = {
        "title": "China threatens Taiwan after US defense deal",
        "text": (
            "China threatened military action against Taiwan after the United States "
            "signed a major defense cooperation agreement with Taipei. "
            "President Xi Jinping warned that Beijing would not tolerate interference, "
            "while NATO expressed support for Taiwan's security. "
            "The IMF warned of economic sanctions impact on global trade."
        ),
        "url": "https://example.com/test",
        "domain": "geopolitics",
    }

    print("\n=== INDRA Local Extractor Test ===\n")
    ents, edges, conf = extract_local(sample)
    print(f"Confidence: {conf:.2f}")
    print(f"Entities ({len(ents)}):")
    for e in ents:
        print(f"  [{e['type']:20s}] {e['label']}")
    print(f"Edges ({len(edges)}):")
    for e in edges:
        print(f"  {e['source']} --{e['type']}--> {e['target']} ({e['confidence']})")
