// backend/routes/groqRoutes.js
// AI Router — Groq only (free tier works).
//
// Why this changed (Oct 2026):
//   Groq shut down llama-3.1-8b-instant and llama-3.3-70b-versatile on
//   16 Aug 2026. The frontend still asks for those names, so every request
//   failed. This router maps old names to Groq's recommended replacements
//   and tries a backup model if one fails.
//
// Env vars (set on Render):
//   GROQ_API_KEY   required — https://console.groq.com/keys
//   GROQ_MODELS    optional, comma-separated override, e.g. "openai/gpt-oss-20b,openai/gpt-oss-120b"
//
// Frontend contract is unchanged: POST /api/groq/chat
//   { messages, system, model, temperature, max_tokens, module } → { content, provider }

const express   = require('express');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const r = express.Router();

// Retired model → Groq's recommended replacement
const MODEL_REPLACEMENTS = {
  'llama-3.1-8b-instant':    'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama3-8b-8192':          'openai/gpt-oss-20b',
  'llama3-70b-8192':         'openai/gpt-oss-120b',
  'gemma2-9b-it':            'openai/gpt-oss-20b',
};

const DEFAULT_CHAIN = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
const ENV_CHAIN = (process.env.GROQ_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
const TIMEOUT_MS = 30000;

// ── Rate limiter ──────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // per user per minute; protects the shared free-tier quota
  keyGenerator: (req) => req.headers.authorization || req.ip,
  message: { error: 'Too many AI requests, please wait a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Soft auth ─────────────────────────────────────────────────────
const softAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Helpers ───────────────────────────────────────────────────────
function sanitizeSystem(system) {
  if (!system) return null;
  return String(system)
    .slice(0, 4000)
    .replace(/ignore (all |previous |above |prior )?instructions?/gi, '')
    .replace(/you are now|pretend to be|act as if|forget your/gi, '')
    .replace(/DAN|jailbreak|JAILBREAK|bypass/g, '');
}

function cleanMessages(messages) {
  return messages
    .slice(-20)
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 12000) }));
}

// Requested model first (mapped if retired), then the backup chain, no duplicates
function modelChain(requested) {
  const base = ENV_CHAIN.length ? ENV_CHAIN : DEFAULT_CHAIN;
  const first = requested ? (MODEL_REPLACEMENTS[requested] || requested) : null;
  return [...new Set([first, ...base].filter(Boolean))];
}

async function callGroqModel(model, messages, system, temperature, max_tokens) {
  const isReasoning = /gpt-oss|qwen3/i.test(model);
  const wanted = Math.min(max_tokens || 1000, 2000);

  const payload = {
    model,
    temperature: typeof temperature === 'number' ? temperature : 0.7,
    // Reasoning models spend tokens "thinking" before answering — give headroom
    max_tokens: isReasoning ? Math.min(wanted * 2 + 512, 8192) : wanted,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
  };
  if (/gpt-oss/i.test(model)) payload.reasoning_effort = 'low'; // faster, fewer tokens

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }

  if (!response.ok) {
    const errText = (await response.text()).slice(0, 300);
    const err = new Error(`Groq ${model} ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  // Strip any <think>...</think> block some models include in the text
  const content = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!content) throw new Error(`Groq ${model} returned no text (${data.choices?.[0]?.finish_reason || 'empty'})`);
  return content;
}

// ── Main AI proxy route ───────────────────────────────────────────
r.post('/chat', softAuth, aiLimiter, async (req, res) => {
  const { messages, model, temperature, max_tokens, system, module: mod } = req.body || {};
  const label = mod || 'general';

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (!process.env.GROQ_API_KEY) {
    console.error('[AI] GROQ_API_KEY is not set on the server');
    return res.status(503).json({ error: 'AI is not configured. Please contact support.' });
  }

  const msgs = cleanMessages(messages);
  if (!msgs.length) return res.status(400).json({ error: 'messages array is empty' });
  const cleanSystem = sanitizeSystem(system);

  let rateLimited = false;
  for (const m of modelChain(model)) {
    try {
      const content = await callGroqModel(m, msgs, cleanSystem, temperature, max_tokens);
      console.log(`[AI] module=${label} model=${m} ✅`);
      return res.json({ content, provider: 'groq' });
    } catch (e) {
      console.warn(`[AI] module=${label} ${e.message}`);
      if (e.status === 401) {
        console.error('[AI] GROQ_API_KEY is invalid or revoked — create a new key at console.groq.com/keys');
        break; // a bad key fails on every model
      }
      if (e.status === 429) rateLimited = true;
      // otherwise (404 retired model, 400, 5xx, timeout) → try next model
    }
  }

  return res.status(503).json({
    error: rateLimited
      ? 'AI usage limit reached for now. Please try again in a few minutes.'
      : 'AI is temporarily unavailable. Please try again.',
  });
});

module.exports = r;
