"""
INDRA v2 — FastAPI Backend Server
==================================
Run: uvicorn server:app --reload --port 8000
Then open: http://localhost:8000

New v2 endpoints:
  GET  /api/typed-graph          — typed entity/edge graph for UI panels
  GET  /api/graph-confidence     — confidence histogram + domain summary
  GET  /api/domain-alerts        — edges that dropped >30% confidence in 24h
  GET  /api/domain/{name}        — subgraph for a specific domain panel
  GET  /api/cross-domain         — edges spanning multiple domains
  POST /api/blast-radius         — causal impact BFS query
"""

import os
import asyncio
import logging
import shutil
import xml.etree.ElementTree as ET

from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("INDRA.Server")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)

from autonomous_pipeline import (
    fetch_all_rss, fetch_newsdata,
    ingest_articles_to_graph, query_graph,
    load_seen, WORKING_DIR,
)
from typed_ontology import (
    get_typed_graph_summary, get_typed_graph_for_domain,
    get_cross_domain_edges, load_typed_graph,
)
from decay_engine import run_decay, domain_confidence_summary, get_domain_alerts
from blast_radius import blast_radius_query
from provider_router import llm_complete

app = FastAPI(title="INDRA v2 Intelligence Graph")

# Serve static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Startup: run decay engine ─────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    logger.info("[Server] INDRA v2 startup — running decay engine...")
    try:
        stats = await asyncio.to_thread(run_decay)
        logger.info(
            f"[Decay] Startup: active={stats['active_edges']} "
            f"stale={stats['stale_edges']} archived={stats['archived_edges']}"
        )
    except Exception as e:
        logger.warning(f"[Decay] Startup decay failed (no typed graph yet): {e}")


# ── Status ────────────────────────────────────────────────────────────────────

@app.get("/api/status")
async def status():
    seen = load_seen()
    graph_file = os.path.join(WORKING_DIR, "graph_chunk_entity_relation.graphml")
    graph_exists = os.path.exists(graph_file)
    typed_summary = {}
    try:
        typed_summary = get_typed_graph_summary()
    except Exception:
        pass
    return {
        "status":           "ready" if graph_exists else "empty",
        "articles_ingested": len(seen),
        "graph_ready":       graph_exists,
        "typed_graph":       typed_summary,
    }


# ── LightRAG graph data (original vis.js graph) ───────────────────────────────

@app.get("/api/graph-data")
async def graph_data():
    graph_file = os.path.join(WORKING_DIR, "graph_chunk_entity_relation.graphml")
    if not os.path.exists(graph_file):
        return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}

    tree = ET.parse(graph_file)
    root = tree.getroot()
    ns   = {"g": "http://graphml.graphdrawing.org/xmlns"}

    nodes, edges = [], []
    node_ids = set()

    for node in root.findall(".//g:node", ns):
        nid = node.get("id")
        if nid and nid not in node_ids:
            node_ids.add(nid)
            nodes.append({"id": nid, "label": nid.replace("_", " ").title()[:30]})

    for edge in root.findall(".//g:edge", ns):
        src, tgt = edge.get("source"), edge.get("target")
        if src in node_ids and tgt in node_ids:
            label = ""
            for data in edge.findall("g:data", ns):
                if data.text and len(data.text) < 50:
                    label = data.text[:30]
                    break
            edges.append({"from": src, "to": tgt, "label": label})

    return {
        "nodes":       nodes[:200],
        "edges":       edges[:500],
        "total_nodes": len(nodes),
        "total_edges": len(edges),
    }


# ── v2: Typed graph data ──────────────────────────────────────────────────────

@app.get("/api/typed-graph")
async def typed_graph_endpoint():
    try:
        return get_typed_graph_summary()
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/domain/{domain_name}")
async def domain_graph(domain_name: str):
    valid_domains = {"geopolitics", "economics", "defense", "technology", "climate", "society"}
    if domain_name not in valid_domains:
        return JSONResponse({"error": f"Unknown domain '{domain_name}'"}, status_code=400)
    try:
        data = get_typed_graph_for_domain(domain_name)
        return data
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/cross-domain")
async def cross_domain():
    try:
        return get_cross_domain_edges()
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── v2: Confidence histogram ──────────────────────────────────────────────────

@app.get("/api/graph-confidence")
async def graph_confidence():
    try:
        stats   = await asyncio.to_thread(run_decay, None, False)  # dry-run, no persist
        summary = await asyncio.to_thread(domain_confidence_summary)
        return {
            "histogram":       stats["histogram"],
            "domain_summary":  summary,
            "total_edges":     stats["total_edges"],
            "active_edges":    stats["active_edges"],
            "stale_edges":     stats["stale_edges"],
            "archived_edges":  stats["archived_edges"],
            "run_at":          stats["run_at"],
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── v2: Domain alerts ─────────────────────────────────────────────────────────

@app.get("/api/domain-alerts")
async def domain_alerts():
    try:
        alerts = await asyncio.to_thread(get_domain_alerts, 0.30)
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── v2: Blast radius ─────────────────────────────────────────────────────────

@app.post("/api/blast-radius")
async def blast_radius_endpoint(body: dict):
    entity = body.get("entity", "").strip()
    depth  = min(int(body.get("depth", 3)), 4)

    if not entity:
        return JSONResponse({"error": "entity is required"}, status_code=400)

    try:
        result = await blast_radius_query(entity, depth=depth, llm_func=llm_complete)
        return result
    except Exception as e:
        logger.error(f"[BlastRadius] Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


# ── Sync & Bootstrap ──────────────────────────────────────────────────────────

@app.post("/api/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    async def do_sync():
        rss = fetch_all_rss()
        await ingest_articles_to_graph(rss)
        await asyncio.to_thread(run_decay)  # re-run decay after sync

    background_tasks.add_task(do_sync)
    return {"status": "sync started in background"}


@app.post("/api/bootstrap")
async def trigger_bootstrap(background_tasks: BackgroundTasks):
    async def do_bootstrap():
        rss   = fetch_all_rss()
        news  = fetch_newsdata("India defense geopolitics Pakistan China")
        await ingest_articles_to_graph(rss + news)
        await asyncio.to_thread(run_decay)

    background_tasks.add_task(do_bootstrap)
    return {"status": "bootstrap started — this takes 3-5 minutes"}


# ── Query (LightRAG + new blast_radius mode) ──────────────────────────────────

@app.post("/api/query")
async def query(body: dict):
    question = body.get("question", "")
    mode     = body.get("mode", "hybrid")

    if not question:
        return JSONResponse({"error": "question is required"}, status_code=400)

    # Blast radius mode
    if mode == "blast_radius":
        result = await blast_radius_query(question, depth=3, llm_func=llm_complete)
        return {
            "answer":   result.get("synthesis") or "No synthesis available.",
            "question": question,
            "blast_radius_data": result,
        }

    graph_file = os.path.join(WORKING_DIR, "graph_chunk_entity_relation.graphml")
    if not os.path.exists(graph_file):
        return JSONResponse({"error": "Graph not ready. Run bootstrap first."}, status_code=400)

    try:
        answer = await query_graph(question, mode=mode)
        return {"answer": answer, "question": question}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── Manual PDF upload ─────────────────────────────────────────────────────────

@app.post("/api/ingest/pdf")
async def ingest_pdf(file: UploadFile = File(...)):
    from pypdf import PdfReader
    from autonomous_pipeline import ingest_articles_to_graph, article_id

    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    reader = PdfReader(path)
    text   = "".join(page.extract_text() or "" for page in reader.pages)

    articles = [{
        "title":  file.filename,
        "url":    f"local://{file.filename}",
        "date":   "",
        "source": "manual-upload",
        "domain": "general",
        "text":   text[:50000],
    }]

    count = await ingest_articles_to_graph(articles)
    return {"status": "success", "pages": len(reader.pages), "ingested": count}


# ── Serve frontend ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return FileResponse("static/index.html")
