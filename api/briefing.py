import os
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

from provider_router import llm_complete
from typed_ontology import get_typed_graph_for_domain

router = APIRouter()

class BriefingRequest(BaseModel):
    domain: str

SYSTEM_PROMPT = """You are INDRA, an executive intelligence system providing restricted briefings for Cabinet Secretaries.
You must output ONLY a raw ASCII-styled briefing block exactly as shown below:

    ╔══════════════════════════════════════════════════════╗
    ║   INDRA INTELLIGENCE BRIEF                           ║
    ║   Classification: RESTRICTED                         ║
    ║   Domain: {DOMAIN}                                   ║
    ╠══════════════════════════════════════════════════════╣
    ║ SITUATION SUMMARY                                    ║
    ║ - [Insight 1 based on real data]                     ║
    ║ - [Insight 2 based on real data]                     ║
    ║ - [Insight 3 based on real data]                     ║
    ║                                                      ║
    ║ STRATEGIC OUTLOOK                                    ║
    ║ [1-2 concise sentences predicting next moves]        ║
    ╚══════════════════════════════════════════════════════╝

Keep your insights very short and punchy so they fit inside the box lines neatly. Focus on identifying actionable intelligence."""

@router.post("/briefing")
async def generate_briefing(req: BriefingRequest):
    domain = req.domain.lower()
    
    # 1. Gather recent data
    try:
        graph_data = get_typed_graph_for_domain(domain)
        # Sort edges by confidence
        edges = sorted(graph_data.get("edges", []), key=lambda x: x.get("confidence", 0), reverse=True)
        top_edges = edges[:15]
        
        context_lines = []
        for e in top_edges:
            conf = int(e.get('confidence', 0) * 100)
            context_lines.append(f"- {e.get('from')} -> {e.get('label')} -> {e.get('to')} ({conf}%)")
        context_str = "\n".join(context_lines)
    except Exception as e:
        context_str = "No specific real-time graph data available."

    prompt = f"Recent high-confidence intel:\n{context_str}\n\nGenerate the ASCII Morning Brief."
    
    try:
        sys_prompt = SYSTEM_PROMPT.replace("{DOMAIN}", domain.upper())
        res = await asyncio.wait_for(llm_complete(prompt, system_prompt=sys_prompt), timeout=25.0)
        # Clean up markdown
        if res.strip().startswith("```"):
            res = "\n".join(res.strip().split("\n")[1:-1])
        return {"briefing": res.strip()}
    except Exception as e:
        return {"briefing": f"    ╔════════════════════════════════════╗\n    ║   INDRA INTELLIGENCE BRIEF         ║\n    ║   ERROR GENERATING BRIEFING        ║\n    ╚════════════════════════════════════╝"}

