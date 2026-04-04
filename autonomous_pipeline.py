"""
INDRA — Autonomous Global Ontology Engine
==========================================
AI-powered intelligence graph covering geopolitics, economics, defense,
technology, climate, and society.

Sources: 25+ verified RSS feeds across 6 domains (all free, no API keys needed except NewsData).

Run modes:
  python autonomous_pipeline.py bootstrap              # First-time: loads recent data
  python autonomous_pipeline.py sync                   # Incremental: pulls latest
  python autonomous_pipeline.py watch                  # Continuous: polls every 15 min
  python autonomous_pipeline.py query "your question"  # Query all domains
  python autonomous_pipeline.py query "..." --domain defense  # Domain-filtered query
"""

import os
import json
import time
import asyncio
import hashlib
import datetime
import xml.etree.ElementTree as ET
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

WORKING_DIR  = "./indra_data"
SEEN_FILE    = "./indra_data/seen_articles.json"
NEWSDATA_KEY = os.getenv("NEWSDATA_API_KEY", "")

# ── Domain-tagged RSS Source Registry ─────────────────────────────────────────

DOMAIN_SOURCES = {
    "geopolitics": {
        "The Hindu Intl":     "https://www.thehindu.com/news/international/?service=rss",
        "IE World":           "https://indianexpress.com/section/world/feed/",
        "TOI World":          "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
        "BBC World":          "https://feeds.bbci.co.uk/news/world/rss.xml",
        "Al Jazeera":         "https://www.aljazeera.com/xml/rss/all.xml",
        "NYT World":          "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    },
    "economics": {
        "Livemint Economy":   "https://www.livemint.com/rss/economy",
        "Livemint Politics":  "https://www.livemint.com/rss/politics",
        "NYT Business":       "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        "IE Business":        "https://indianexpress.com/section/business/feed/",
    },
    "defense": {
        "The Hindu National": "https://www.thehindu.com/news/national/?service=rss",
        "IE India":           "https://indianexpress.com/section/india/feed/",
        "TOI India":          "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
        "Wired Security":     "https://www.wired.com/feed/category/security/latest/rss",
    },
    "technology": {
        "TechCrunch":         "https://feeds.feedburner.com/TechCrunch/",
        "Wired":              "https://www.wired.com/feed/rss",
        "Ars Technica":       "https://feeds.arstechnica.com/arstechnica/index",
        "NYT Technology":     "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    },
    "climate": {
        "NYT Climate":        "https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml",
        "The Hindu Sci-Tech": "https://www.thehindu.com/sci-tech/?service=rss",
        "BBC Science":        "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    },
    "society": {
        "The Hindu Opinion":  "https://www.thehindu.com/opinion/?service=rss",
        "IE Explained":       "https://indianexpress.com/section/explained/feed/",
        "NYT Asia":           "https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml",
        "BBC Asia":           "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
    },
}

RSS_SOURCES = {}
SOURCE_DOMAIN_MAP = {}
for domain, sources in DOMAIN_SOURCES.items():
    for name, url in sources.items():
        RSS_SOURCES[name] = url
        SOURCE_DOMAIN_MAP[name] = domain

os.makedirs(WORKING_DIR, exist_ok=True)

# ── Dedup engine ──────────────────────────────────────────────────────────────

def load_seen() -> set:
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(json.load(f))
    return set()

def save_seen(seen: set):
    with open(SEEN_FILE, "w") as f:
        json.dump(list(seen), f)

def article_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


# ── RSS Feed Fetcher ──────────────────────────────────────────────────────────

def fetch_rss(name: str, url: str, max_items: int = 20) -> list:
    import requests
    domain = SOURCE_DOMAIN_MAP.get(name, "general")

    for attempt in range(2):
        try:
            resp = requests.get(url, timeout=15, headers={"User-Agent": "INDRA-Bot/1.0"})
            resp.raise_for_status()
            root = ET.fromstring(resp.content)
            items = (
                root.findall(".//item")
                or root.findall(".//{http://www.w3.org/2005/Atom}entry")
            )
            articles = []
            for item in items[:max_items]:
                title = (getattr(item.find("title"), "text", "") or "").strip()
                link  = (getattr(item.find("link"),  "text", "") or "").strip()
                desc  = (getattr(item.find("description"), "text", "") or "").strip()
                date  = (getattr(item.find("pubDate"), "text", "") or "").strip()
                if not link:
                    link_el = item.find("{http://www.w3.org/2005/Atom}link")
                    if link_el is not None:
                        link = link_el.get("href", "")
                if not link:
                    guid_el = item.find("guid")
                    if guid_el is not None and guid_el.text and guid_el.text.startswith("http"):
                        link = guid_el.text
                if title and link:
                    articles.append({
                        "title": title,
                        "url": link,
                        "date": date,
                        "source": name,
                        "domain": domain,
                        # FIX 1 — cap at 800 chars so each doc stays small
                        "text": f"{title}. {desc}"[:800],
                    })
            print(f"  [{domain.upper():>12}] {name}: {len(articles)} articles")
            return articles
        except requests.exceptions.Timeout:
            if attempt == 0:
                time.sleep(1)
            else:
                print(f"  [{domain.upper():>12}] {name}: timeout — skipping")
                return []
        except Exception as e:
            print(f"  [{domain.upper():>12}] {name}: error — {e}")
            return []
    return []


def fetch_all_rss(domains: list = None) -> list:
    if domains:
        sources = {}
        for d in domains:
            if d in DOMAIN_SOURCES:
                sources.update(DOMAIN_SOURCES[d])
    else:
        sources = RSS_SOURCES

    print(f"\n[RSS] Fetching from {len(sources)} sources...")
    all_articles = []
    domain_counts = {}
    for name, url in sources.items():
        articles = fetch_rss(name, url)
        if articles:
            d = articles[0].get("domain", "unknown")
            domain_counts[d] = domain_counts.get(d, 0) + len(articles)
        all_articles.extend(articles)
    print(f"\n  [RSS] Total: {len(all_articles)} articles")
    for d, count in sorted(domain_counts.items()):
        print(f"         {d}: {count}")
    return all_articles


# ── NewsData.io ───────────────────────────────────────────────────────────────

def fetch_newsdata(query: str = "India geopolitics defense") -> list:
    if not NEWSDATA_KEY:
        print("  [NewsData] No API key — skipping (free at newsdata.io)")
        return []
    import requests
    url = (
        "https://newsdata.io/api/1/news"
        f"?apikey={NEWSDATA_KEY}&q={requests.utils.quote(query)}"
        "&country=in&language=en&category=politics,world"
    )
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
        results = data.get("results", [])
        if not isinstance(results, list):
            return []
        articles = []
        for item in results:
            if not isinstance(item, dict):
                continue
            articles.append({
                "title":  item.get("title", ""),
                "url":    item.get("link", ""),
                "date":   item.get("pubDate", ""),
                "source": item.get("source_id", "newsdata"),
                "domain": "geopolitics",
                "text":   (item.get("title", "") + ". " + (item.get("description") or ""))[:800],
            })
        print(f"  [NewsData] Got {len(articles)} articles")
        return articles
    except Exception as e:
        print(f"  [NewsData] Error: {e}")
        return []


# ── Full-text fetcher ─────────────────────────────────────────────────────────

def fetch_article_text(url: str, snippet: str) -> str:
    import requests
    from html.parser import HTMLParser

    class TextExtractor(HTMLParser):
        def __init__(self):
            super().__init__()
            self.parts = []
            self.skip = False
            self.skip_tags = {"script","style","nav","footer","header"}
        def handle_starttag(self, tag, attrs):
            if tag in self.skip_tags: self.skip = True
        def handle_endtag(self, tag):
            if tag in self.skip_tags: self.skip = False
        def handle_data(self, data):
            s = data.strip()
            if not self.skip and len(s) > 40: self.parts.append(s)
        def get_text(self): return " ".join(self.parts)[:8000]

    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent":"Mozilla/5.0"})
        p = TextExtractor(); p.feed(resp.text)
        text = p.get_text()
        return text if len(text) > 200 else snippet
    except:
        return snippet


# ── LLM Provider (routes through Gemini → Groq → Cerebras → OpenRouter) ──────
from provider_router import llm_complete

# ── LightRAG helpers ──────────────────────────────────────────────────────────


_embedding_model = None

def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        print("  [Embedding] Loading model (one-time ~30s)...")
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("  [Embedding] Model ready.")
    return _embedding_model


async def _create_rag():
    from lightrag import LightRAG
    from lightrag.utils import EmbeddingFunc
    import numpy as np

    async def hf_embedding(texts: list) -> list:
        model = _get_embedding_model()
        embeddings = model.encode(texts)
        return np.array(embeddings)

    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=llm_complete,
        embedding_func=EmbeddingFunc(
            embedding_dim=384, max_token_size=512, func=hf_embedding
        ),
    )
    await rag.initialize_storages()
    return rag


# ── LightRAG ingestion ────────────────────────────────────────────────────────

async def ingest_articles_to_graph(articles: list, fetch_full_text: bool = False):
    rag = await _create_rag()
    seen = load_seen()
    new_count = 0
    errors = 0
    domain_ingested = {}

    for article in articles:
        aid = article_id(article["url"])
        if aid in seen:
            continue

        text = article["text"]
        if fetch_full_text and article.get("url"):
            print(f"  [Fetch] {article['title'][:60]}...")
            text = fetch_article_text(article["url"], text)

        domain = article.get("domain", "general")
        doc = f"""DOMAIN: {domain}
SOURCE: {article.get('source','unknown')}
DATE: {article.get('date','unknown')}
TITLE: {article.get('title','')}

{text[:1200]}""".strip()

        if len(doc) < 80:
            continue

        try:
            print(f"  [{domain.upper():>12}] Ingesting: {article['title'][:65]}...")
            await rag.ainsert(doc)
            seen.add(aid)
            new_count += 1
            domain_ingested[domain] = domain_ingested.get(domain, 0) + 1
            # Also extract typed triples for the parallel ontology graph
            try:
                from typed_ontology import ingest_article_to_typed_graph
                await ingest_article_to_typed_graph(article, llm_complete)
            except Exception as te:
                print(f"  [TypedGraph] Skipped typed extraction: {te}")
            # Pace between inserts to stay under TPM limits
            await asyncio.sleep(1.5)
        except Exception as e:
            errors += 1
            print(f"  [{domain.upper():>12}] Failed: {e}")

    save_seen(seen)
    print(f"\n[Graph] Ingested {new_count} new. Errors: {errors}. Total seen: {len(seen)}")
    if domain_ingested:
        for d, count in sorted(domain_ingested.items()):
            print(f"         {d}: {count}")
    return new_count


# ── Query engine ──────────────────────────────────────────────────────────────

async def query_graph(question: str, mode: str = "hybrid", domain: str = None) -> str:
    from lightrag import QueryParam
    rag = await _create_rag()

    if domain:
        question = f"[Domain: {domain}] {question}"

    try:
        return await rag.aquery(question, param=QueryParam(mode=mode))
    except Exception as e:
        error_str = str(e)
        # FIX 5 — friendly error message with actionable steps
        if "413" in error_str or "too large" in error_str.lower():
            return (
                "⚠ Query context exceeded model token limit.\n\n"
                "Quick fixes:\n"
                "1. Ask a more specific question (narrows the graph context)\n"
                "2. Add to .env: GROQ_MODEL=mixtral-8x7b-32768 (32k context window)\n"
                "3. Wait 60 seconds — Groq TPM resets per minute\n\n"
                f"Error: {error_str[:300]}"
            )
        return f"Query failed: {error_str}"


# ── Pipeline modes ────────────────────────────────────────────────────────────

async def bootstrap():
    print("\n" + "="*60)
    print("INDRA BOOTSTRAP — Global Ontology Engine")
    print("="*60)
    rss  = fetch_all_rss()
    news = fetch_newsdata("India defense geopolitics Pakistan China")
    all_art = rss + news
    print(f"\n[Pipeline] Total articles to ingest: {len(all_art)}")
    await ingest_articles_to_graph(all_art)
    print("\n[INDRA] Bootstrap complete.")


async def sync():
    print(f"\n[INDRA] Sync — pulling latest articles...")
    rss = fetch_all_rss()
    await ingest_articles_to_graph(rss)
    print(f"[INDRA] Sync complete at {datetime.datetime.now().strftime('%H:%M:%S')}")


async def watch():
    print(f"\n[INDRA] Watch mode — syncing every 15 min. Ctrl+C to stop.\n")
    while True:
        try:
            await sync()
            print("[INDRA] Next sync in 15 minutes...\n")
            await asyncio.sleep(15 * 60)
        except KeyboardInterrupt:
            print("\n[INDRA] Watch mode stopped.")
            break
        except Exception as e:
            print(f"[INDRA] Error: {e} — retrying in 5 minutes")
            await asyncio.sleep(5 * 60)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(f"""
INDRA — Global Ontology Engine
================================
  Domains: {', '.join(DOMAIN_SOURCES.keys())}
  Feeds:   {len(RSS_SOURCES)} verified sources

Commands:
  python autonomous_pipeline.py bootstrap                      # Load recent articles
  python autonomous_pipeline.py sync                           # Pull latest
  python autonomous_pipeline.py watch                          # Continuous polling
  python autonomous_pipeline.py query "..."                    # Query all domains
  python autonomous_pipeline.py query "..." --domain defense   # Domain-filtered
  python autonomous_pipeline.py sources                        # List all sources
        """)
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "bootstrap":
        asyncio.run(bootstrap())
    elif cmd == "sync":
        asyncio.run(sync())
    elif cmd == "watch":
        asyncio.run(watch())
    elif cmd == "query" and len(sys.argv) > 2:
        args = sys.argv[2:]
        domain_filter = None
        question_parts = []
        i = 0
        while i < len(args):
            if args[i] == "--domain" and i + 1 < len(args):
                domain_filter = args[i + 1]
                i += 2
            else:
                question_parts.append(args[i])
                i += 1
        q = " ".join(question_parts)
        print(f"\n[INDRA] Querying: {q}")
        if domain_filter:
            print(f"[INDRA] Domain filter: {domain_filter}")
        result = asyncio.run(query_graph(q, domain=domain_filter))
        print("\n" + "="*60)
        print("INDRA INTELLIGENCE RESPONSE:")
        print("="*60)
        print(result)
    elif cmd == "sources":
        total = 0
        for domain, sources in DOMAIN_SOURCES.items():
            print(f"\n{'─'*40}")
            print(f"  {domain.upper()} ({len(sources)} feeds)")
            for n, u in sources.items():
                print(f"  {n}: {u}")
            total += len(sources)
        print(f"\n  TOTAL: {total} feeds")
        print(f"  NewsData: {'configured' if NEWSDATA_KEY else 'not set (free at newsdata.io)'}")
    else:
        print(f"Unknown command: {cmd}")