// backend/routes/groqRoutes.js
// AI Router: Gemini (primary, module-wise keys) → Groq (fallback)
// Module mapping:
//   mock-interview  → GEMINI_KEY_MOCK
//   academy         → GEMINI_KEY_ACADEMY
//   logic-builder   → GEMINI_KEY_LOGIC
//   general/other   → GEMINI_KEY_GENERAL
// On Gemini 429 (quota exceeded) or 503 → auto-switch to Groq

const express = require('express');
const jwt     = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const r = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
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

// ── Sanitize system prompt ────────────────────────────────────────
function sanitizeSystem(system) {
  if (!system) return null;
  return system
    .slice(0, 2000)
    .replace(/ignore (all |previous |above |prior )?instructions?/gi, '')
    .replace(/you are now|pretend to be|act as if|forget your/gi, '')
    .replace(/DAN|jailbreak|JAILBREAK|bypass/g, '');
}

// ── Module → Gemini key mapping ───────────────────────────────────
function getGeminiKey(module) {
  const map = {
    'mock-interview': process.env.GEMINI_KEY_MOCK,
    'academy':        process.env.GEMINI_KEY_ACADEMY,
    'logic-builder':  process.env.GEMINI_KEY_LOGIC,
    'general':        process.env.GEMINI_KEY_GENERAL,
    'resume':         process.env.GEMINI_KEY_GENERAL,
    'career':         process.env.GEMINI_KEY_GENERAL,
    'chatbot':        process.env.GEMINI_KEY_GENERAL,
  };
  return map[module] || process.env.GEMINI_KEY_GENERAL || null;
}

// ── Gemini API call ───────────────────────────────────────────────
async function callGemini(apiKey, messages, system, temperature, max_tokens) {
  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: temperature || 0.7,
      maxOutputTokens: Math.min(max_tokens || 1000, 2048),
    },
  };

  // Add system instruction if present
  if (system) {
    payload.systemInstruction = { parts: [{ text: system }] };
  }

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error(`Gemini ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return content;
}

// ── Groq API call ─────────────────────────────────────────────────
async function callGroq(messages, system, model, temperature, max_tokens) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) throw new Error('Groq not configured');

  const payload = {
    model: model || 'llama-3.3-70b-versatile',
    max_tokens: Math.min(max_tokens || 1000, 2000),
    temperature: temperature || 0.7,
    messages: system
      ? [{ role: 'system', content: system }, ...messages]
      : messages,
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Main AI proxy route ───────────────────────────────────────────
// Frontend sends: { messages, system, model, temperature, max_tokens, module }
// module field tells which Gemini key to use
r.post('/chat', softAuth, aiLimiter, async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens, system, module: mod } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const cleanSystem = sanitizeSystem(system);
    const geminiKey   = getGeminiKey(mod || 'general');

    let content = '';
    let provider = 'gemini';

    // ── Try Gemini first ──────────────────────────────────────────
    if (geminiKey) {
      try {
        content  = await callGemini(geminiKey, messages, cleanSystem, temperature, max_tokens);
        provider = 'gemini';
        console.log(`[AI] module=${mod || 'general'} provider=gemini ✅`);
      } catch (geminiErr) {
        const status = geminiErr.status;
        const isQuotaErr = status === 429 || status === 503 || status === 500;

        if (isQuotaErr) {
          // Quota hit → fallback to Groq
          console.warn(`[AI] Gemini quota/error (${status}) for module=${mod} → switching to Groq`);
          try {
            content  = await callGroq(messages, cleanSystem, model, temperature, max_tokens);
            provider = 'groq-fallback';
            console.log(`[AI] module=${mod || 'general'} provider=groq-fallback ✅`);
          } catch (groqErr) {
            console.error('[AI] Both Gemini and Groq failed:', groqErr.message);
            return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
          }
        } else {
          // Non-quota Gemini error (bad request etc.) → don't fallback
          console.error('[AI] Gemini non-quota error:', geminiErr.message);
          return res.status(400).json({ error: 'AI request failed: ' + geminiErr.message });
        }
      }
    } else {
      // No Gemini key configured for this module → use Groq directly
      console.log(`[AI] No Gemini key for module=${mod}, using Groq directly`);
      try {
        content  = await callGroq(messages, cleanSystem, model, temperature, max_tokens);
        provider = 'groq';
      } catch (groqErr) {
        console.error('[AI] Groq failed:', groqErr.message);
        return res.status(503).json({ error: 'AI service unavailable.' });
      }
    }

    res.json({ content, provider });
  } catch (err) {
    console.error('AI proxy error:', err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = r;