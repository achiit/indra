# INDRA — AI Geopolitical Intelligence Engine

INDRA is an autonomous geopolitical intelligence engine designed to map causal chains between world events. It uses an LLM-powered backend capable of aggregating real-time data and a high-performance React frontend for visualization.

## Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, react-force-graph-2d, Zustand.
- **Backend (API)**: Python, FastAPI, LightRAG, spaCy, REBEL (Local Models), and Multi-LLM Routing (Gemini/Groq).
- **Database**: PostgreSQL (Neon) — connection managed via backend API exclusively.

## Quickstart

### 1. Backend Server
Ensure the Python backend is running:
```bash
cd ..
source venv/bin/activate
uvicorn server:app --reload --port 8000
```

### 2. Frontend Application

1. Open the `frontend/` directory.
2. Install dependencies:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
```

### Environment Variables

A `.env.development` file is included, which sets `VITE_USE_MOCK=true`. This allows full visual exploration of the war room and dashboads without needing a fully hydrated knowledge graph.

To connect to production or local un-mocked data, change this value to `false`.

```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=true
```

## Features Complete

- ✅ **Authentication**: Simulated OTP login
- ✅ **War Room**: Realtime stats, confidence bar charts, and global react-force-graph-2d
- ✅ **Domain Panels**: Domain-filtered graphs, interactive Q&A LLM prompting
- ✅ **Blast Radius**: Causal path rendering, joint probability math, max-depth calculations
- ✅ **Alerts Center**: Active state tracking for decaying subgraphs
