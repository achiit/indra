"""
provider_router.py — INDRA v2 Multi-Provider LLM Router
========================================================
Default try order: gemini → groq → cerebras → openrouter (only providers with keys).

Override order in .env:
  INDRA_LLM_ORDER=groq,gemini,cerebras,openrouter

Skip Gemini entirely (e.g. all keys 429):
  GEMINI_DISABLED=1

Providers:
  - Gemini (GEMINI_API_KEY_1..4 / GEMINI_API_KEYS)
  - Groq (GROQ_API_KEYS / GROQ_API_KEY; default llama-3.1-8b-instant)
  - Cerebras, OpenRouter (optional)

LightRAG: router.complete(prompt, system_prompt, history_messages, **kwargs)
"""

import os
import time
import asyncio
import itertools
import logging
from typing import Optional

logger = logging.getLogger("INDRA.Router")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)


# ── Key loaders ────────────────────────────────────────────────────────────────

def _load_numbered_keys(prefix: str) -> list[str]:
    """Load PROVIDER_KEY_1, PROVIDER_KEY_2, … up to 20."""
    keys = []
    for i in range(1, 21):
        k = os.getenv(f"{prefix}_{i}", "").strip()
        if k:
            keys.append(k)
    # also accept plain PREFIX without number
    plain = os.getenv(prefix, "").strip()
    if plain and plain not in keys:
        keys.append(plain)
    return keys


def _load_csv_keys(env_var: str) -> list[str]:
    """Load comma-separated keys from a single env var."""
    raw = os.getenv(env_var, "")
    return [k.strip() for k in raw.split(",") if k.strip()]


# ── Provider base ──────────────────────────────────────────────────────────────

class Provider:
    name: str

    def __init__(self):
        self._cooldown_until: float = 0.0

    def is_available(self) -> bool:
        return time.monotonic() >= self._cooldown_until

    def back_off(self, seconds: float):
        self._cooldown_until = time.monotonic() + seconds
        logger.warning(f"[{self.name}] backing off for {seconds:.0f}s")

    async def complete(
        self, prompt: str, system_prompt: Optional[str],
        history_messages: list, **kwargs
    ) -> str:
        raise NotImplementedError


# ── Gemini provider ───────────────────────────────────────────────────────────

class GeminiProvider(Provider):
    name = "gemini"

    def __init__(self):
        super().__init__()
        keys = _load_numbered_keys("GEMINI_API_KEY")
        if not keys:
            keys = _load_csv_keys("GEMINI_API_KEYS")
        self._keys = keys
        self._cycle = itertools.cycle(keys) if keys else None
        if keys:
            logger.info(f"[Gemini] Loaded {len(keys)} API key(s)")
        else:
            logger.warning("[Gemini] No keys found — provider disabled")

    def available_keys(self) -> bool:
        return bool(self._keys)

    def _next_key(self) -> str:
        return next(self._cycle)

    async def complete(self, prompt, system_prompt=None, history_messages=[], **kwargs) -> str:
        from google import genai

        contents = ""
        if system_prompt:
            contents += f"System: {system_prompt}\n\n"
        for msg in history_messages:
            contents += f"{msg.get('role','user').capitalize()}: {msg.get('content','')}\n\n"
        contents += f"User: {prompt}"

        max_attempts = max(len(self._keys) * 2, 4)
        last_exc = None
        for attempt in range(max_attempts):
            key = self._next_key()
            t0 = time.monotonic()
            try:
                def _call(k):
                    client = genai.Client(api_key=k)
                    return client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=contents,
                    ).text

                result = await asyncio.to_thread(_call, key)
                elapsed = (time.monotonic() - t0) * 1000
                logger.info(f"[Gemini] key_{attempt % len(self._keys) + 1} → OK ({elapsed:.0f}ms)")
                return result
            except Exception as e:
                last_exc = e
                err = str(e).lower()
                if any(x in err for x in ("429", "quota", "rate limit", "resource_exhausted")):
                    wait = 2 ** min(attempt, 4)
                    logger.warning(f"[Gemini] key rate-limited (attempt {attempt+1}), retry in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    raise e
        raise RuntimeError(f"Gemini all keys exhausted: {last_exc}")


# ── Groq provider ─────────────────────────────────────────────────────────────

# Groq retires model ids periodically; map old .env values to current ids.
# https://console.groq.com/docs/deprecations
GROQ_DEFAULT_MODEL = "llama-3.1-8b-instant"
GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile"

GROQ_LEGACY_MODEL_MAP = {
    "llama3-8b-8192": GROQ_DEFAULT_MODEL,
    "llama3-70b-8192": GROQ_FALLBACK_MODEL,
    "llama2-70b-4096": GROQ_FALLBACK_MODEL,
    "mixtral-8x7b-32768": GROQ_FALLBACK_MODEL,
    "gemma-7b-it": GROQ_DEFAULT_MODEL,
}


def _resolve_groq_model(raw: str) -> str:
    m = (raw or "").strip()
    if not m:
        return GROQ_DEFAULT_MODEL
    key = m.lower().replace(" ", "")
    return GROQ_LEGACY_MODEL_MAP.get(key, m)


class GroqProvider(Provider):
    name = "groq"

    def __init__(self):
        super().__init__()
        keys = _load_csv_keys("GROQ_API_KEYS")
        if not keys:
            k = os.getenv("GROQ_API_KEY", "").strip()
            if k:
                keys = [k]
        self._keys = keys
        self._cycle = itertools.cycle(keys) if keys else None
        env_model = os.getenv("GROQ_MODEL", "").strip()
        self._model = _resolve_groq_model(env_model or GROQ_DEFAULT_MODEL)
        if env_model and self._model != env_model.strip():
            logger.warning(
                f"[Groq] GROQ_MODEL={env_model!r} is legacy or unknown — using {self._model!r}"
            )
        if keys:
            logger.info(f"[Groq] Loaded {len(keys)} key(s), model={self._model}")
        else:
            logger.warning("[Groq] No keys found — provider disabled")

    def available_keys(self) -> bool:
        return bool(self._keys)

    def _next_key(self) -> str:
        return next(self._cycle)

    async def complete(self, prompt, system_prompt=None, history_messages=[], **kwargs) -> str:
        from openai import AsyncOpenAI

        # Hard-clip prompt to stay under Groq's 20k TPM
        MAX = 16000
        if len(prompt) > MAX:
            prompt = prompt[:MAX] + "\n\n[Context truncated]"

        messages = []
        if system_prompt:
            sp = system_prompt[:2000] if len(system_prompt) > 2000 else system_prompt
            messages.append({"role": "system", "content": sp})
        for msg in history_messages:
            messages.append(msg)
        messages.append({"role": "user", "content": prompt})

        allowed = {"temperature", "max_tokens", "top_p", "stop"}
        fkw = {k: v for k, v in kwargs.items() if k in allowed}
        fkw.setdefault("max_tokens", 1024)

        max_attempts = max(len(self._keys) * 3, 6)
        last_exc = None
        for attempt in range(max_attempts):
            key = self._next_key()
            client = AsyncOpenAI(
                api_key=key,
                base_url="https://api.groq.com/openai/v1",
                max_retries=0,
            )
            t0 = time.monotonic()
            try:
                resp = await client.chat.completions.create(
                    model=self._model, messages=messages, **fkw
                )
                elapsed = (time.monotonic() - t0) * 1000
                logger.info(f"[Groq] key_{attempt % len(self._keys) + 1} → OK ({elapsed:.0f}ms)")
                return resp.choices[0].message.content
            except Exception as e:
                last_exc = e
                err = str(e).lower()
                if "decommissioned" in err or "model_decommissioned" in err:
                    alt = os.getenv("GROQ_FALLBACK_MODEL", GROQ_FALLBACK_MODEL)
                    if self._model != alt:
                        logger.warning(
                            f"[Groq] model {self._model!r} rejected by API — switching to {alt!r}"
                        )
                        self._model = alt
                        continue
                if any(x in err for x in ("429", "413", "rate limit", "rate_limit")):
                    wait = 2 ** min(attempt, 4)
                    logger.warning(f"[Groq] rate-limited (attempt {attempt+1}), retry in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    raise e
        raise RuntimeError(f"Groq all keys exhausted: {last_exc}")


# ── Cerebras provider ─────────────────────────────────────────────────────────

class CerebrasProvider(Provider):
    name = "cerebras"

    def __init__(self):
        super().__init__()
        self._key = os.getenv("CEREBRAS_API_KEY", "").strip()
        self._model = os.getenv("CEREBRAS_MODEL", "llama-3.3-70b")
        if self._key:
            logger.info(f"[Cerebras] Key loaded, model={self._model}")
        else:
            logger.info("[Cerebras] No key — provider disabled (optional)")

    def available_keys(self) -> bool:
        return bool(self._key)

    async def complete(self, prompt, system_prompt=None, history_messages=[], **kwargs) -> str:
        from openai import AsyncOpenAI

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt[:2000]})
        for msg in history_messages:
            messages.append(msg)
        messages.append({"role": "user", "content": prompt[:20000]})

        client = AsyncOpenAI(
            api_key=self._key,
            base_url="https://api.cerebras.ai/v1",
            max_retries=0,
        )
        allowed = {"temperature", "max_tokens", "top_p"}
        fkw = {k: v for k, v in kwargs.items() if k in allowed}
        fkw.setdefault("max_tokens", 1024)

        t0 = time.monotonic()
        resp = await client.chat.completions.create(
            model=self._model, messages=messages, **fkw
        )
        elapsed = (time.monotonic() - t0) * 1000
        logger.info(f"[Cerebras] → OK ({elapsed:.0f}ms)")
        return resp.choices[0].message.content


# ── OpenRouter provider ───────────────────────────────────────────────────────

class OpenRouterProvider(Provider):
    name = "openrouter"

    def __init__(self):
        super().__init__()
        self._key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self._model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3-0324:free")
        if self._key:
            logger.info(f"[OpenRouter] Key loaded, model={self._model}")
        else:
            logger.info("[OpenRouter] No key — provider disabled (optional)")

    def available_keys(self) -> bool:
        return bool(self._key)

    async def complete(self, prompt, system_prompt=None, history_messages=[], **kwargs) -> str:
        from openai import AsyncOpenAI

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt[:2000]})
        for msg in history_messages:
            messages.append(msg)
        messages.append({"role": "user", "content": prompt[:30000]})

        client = AsyncOpenAI(
            api_key=self._key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={"HTTP-Referer": "https://indra.intelligence", "X-Title": "INDRA"},
            max_retries=0,
        )
        allowed = {"temperature", "max_tokens", "top_p"}
        fkw = {k: v for k, v in kwargs.items() if k in allowed}
        fkw.setdefault("max_tokens", 1024)

        t0 = time.monotonic()
        resp = await client.chat.completions.create(
            model=self._model, messages=messages, **fkw
        )
        elapsed = (time.monotonic() - t0) * 1000
        logger.info(f"[OpenRouter] → OK ({elapsed:.0f}ms)")
        return resp.choices[0].message.content


# ── Router ────────────────────────────────────────────────────────────────────

_DEFAULT_LLM_ORDER = ("gemini", "groq", "cerebras", "openrouter")

_PROVIDER_CLASSES: dict[str, type] = {
    "gemini": GeminiProvider,
    "groq": GroqProvider,
    "cerebras": CerebrasProvider,
    "openrouter": OpenRouterProvider,
}


def _llm_provider_order() -> list[str]:
    """Comma-separated names from INDRA_LLM_ORDER; invalid tokens dropped."""
    raw = os.getenv("INDRA_LLM_ORDER", "").strip()
    if not raw:
        return list(_DEFAULT_LLM_ORDER)
    out: list[str] = []
    for part in raw.split(","):
        name = part.strip().lower()
        if name in _PROVIDER_CLASSES and name not in out:
            out.append(name)
    return out if out else list(_DEFAULT_LLM_ORDER)


class ProviderRouter:
    """
    Routes LLM calls through a priority provider chain with automatic
    failover on rate limits. Same call signature as groq_complete().
    """

    FALLBACK_RESPONSE = (
        "INDRA is temporarily unable to reach any AI provider. "
        "All providers are rate-limited. Please wait 60 seconds and retry."
    )

    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()

        order = _llm_provider_order()
        if os.getenv("GEMINI_DISABLED", "").strip().lower() in ("1", "true", "yes", "on"):
            order = [n for n in order if n != "gemini"]
            logger.info("[Router] GEMINI_DISABLED set — Gemini removed from chain")

        instantiated: dict[str, Provider] = {}
        for name, Pcls in _PROVIDER_CLASSES.items():
            p = Pcls()
            if p.available_keys():
                instantiated[name] = p

        self._providers: list[Provider] = []
        seen: set[str] = set()
        for name in order:
            if name in instantiated and name not in seen:
                self._providers.append(instantiated[name])
                seen.add(name)

        if not self._providers:
            for name in _DEFAULT_LLM_ORDER:
                if name in instantiated:
                    self._providers.append(instantiated[name])

        if not self._providers:
            raise RuntimeError(
                "No LLM providers configured! Set at least GEMINI_API_KEY_1 or GROQ_API_KEY in .env"
            )
        logger.info(
            f"[Router] Call order (INDRA_LLM_ORDER): {[p.name for p in self._providers]}"
        )

    async def complete(
        self,
        prompt: str,
        system_prompt: str = None,
        history_messages: list = [],
        keyword_extraction: bool = False,
        **kwargs,
    ) -> str:
        """
        LightRAG-compatible LLM function. Tries providers in priority order,
        falls back on 429/413, returns FALLBACK_RESPONSE if all fail.
        """
        prompt = str(prompt or "")
        for provider in self._providers:
            if not provider.is_available():
                logger.info(f"[Router] Skipping {provider.name} (cooling down)")
                continue
            try:
                return await provider.complete(
                    prompt, system_prompt, history_messages, **kwargs
                )
            except Exception as e:
                err = str(e).lower()
                if any(x in err for x in ("429", "413", "rate limit", "quota", "resource_exhausted")):
                    logger.warning(
                        f"[Router] {provider.name} rate-limited, trying next provider"
                    )
                    provider.back_off(60)
                    continue
                else:
                    logger.error(f"[Router] {provider.name} unexpected error: {e}")
                    # Non-rate-limit error: still try next provider but log it
                    continue

        logger.error("[Router] All providers failed or cooling down. Returning fallback.")
        return self.FALLBACK_RESPONSE


# ── Singleton ─────────────────────────────────────────────────────────────────

_router_instance: Optional[ProviderRouter] = None


def get_router() -> ProviderRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = ProviderRouter()
    return _router_instance


async def llm_complete(
    prompt: str,
    system_prompt: str = None,
    history_messages: list = [],
    keyword_extraction: bool = False,
    **kwargs,
) -> str:
    """
    Top-level function passed to LightRAG as llm_model_func.
    Uses the singleton ProviderRouter.
    """
    return await get_router().complete(
        prompt, system_prompt, history_messages, keyword_extraction, **kwargs
    )


# ── CLI test ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    async def test():
        print("\n=== INDRA Provider Router Test ===\n")
        router = get_router()
        result = await router.complete(
            "Say 'INDRA v2 online' and nothing else.",
            system_prompt="You are INDRA, a geopolitical intelligence engine."
        )
        print(f"Response: {result}\n")

    asyncio.run(test())
