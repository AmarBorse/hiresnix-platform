// backend/routes/ttsRoutes.js
// Gemini text-to-speech: turns AI text into a natural "Gemini" voice.
//
// POST /api/tts  { text, voice?, style? }  →  audio/wav
//
// Env vars (Render):
//   GEMINI_TTS_KEY     Gemini API key from https://aistudio.google.com/apikey
//                      (falls back to GEMINI_KEY_MOCK / GEMINI_KEY_GENERAL if not set)
//   GEMINI_TTS_MODELS  optional comma-separated override of the model chain
//
// If this route fails (no key, quota used up, network), the frontend falls back
// to the browser's built-in voice, so the AI never goes silent.

const express   = require('express');
const crypto    = require('crypto');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const r = express.Router();

const DEFAULT_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];
const MODELS = (process.env.GEMINI_TTS_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
const modelChain = () => (MODELS.length ? MODELS : DEFAULT_MODELS);

// Gemini's 30 prebuilt voices
const VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe',
  'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',
  'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);
const DEFAULT_VOICE = 'Kore';
const MAX_TEXT = 1200;
const TIMEOUT_MS = 30000;

const getKey = () =>
  process.env.GEMINI_TTS_KEY || process.env.GEMINI_KEY_MOCK || process.env.GEMINI_KEY_GENERAL || process.env.GEMINI_API_KEY || null;

// ── Small in-memory cache: greetings and common phrases repeat a lot ──
const CACHE_MAX_ITEMS = 150;
const CACHE_MAX_BYTES = 40 * 1024 * 1024;
const cache = new Map(); // key → Buffer (Map keeps insertion order → simple LRU)
let cacheBytes = 0;
function cacheGet(k) {
  const v = cache.get(k);
  if (v) { cache.delete(k); cache.set(k, v); }
  return v;
}
function cacheSet(k, buf) {
  if (buf.length > 5 * 1024 * 1024) return;
  cache.set(k, buf); cacheBytes += buf.length;
  while (cache.size > CACHE_MAX_ITEMS || cacheBytes > CACHE_MAX_BYTES) {
    const [oldKey, oldBuf] = cache.entries().next().value;
    cache.delete(oldKey); cacheBytes -= oldBuf.length;
  }
}

// ── Auth + rate limit (any logged-in student / institution student) ──
const softAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try { jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
};
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  keyGenerator: (req) => req.headers.authorization || req.ip,
  message: { error: 'Too many voice requests, please wait a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Wrap raw 16-bit PCM (24 kHz mono) in a WAV header, for models that return audio/l16
function pcmToWav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Find the last {type:"audio", data:"..."} block anywhere in the response
function findAudio(node, found = { data: null, mime: null }) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) { node.forEach(n => findAudio(n, found)); return found; }
  if (node.type === 'audio' && typeof node.data === 'string') { found.data = node.data; found.mime = node.mime_type || node.mimeType || null; }
  Object.values(node).forEach(v => { if (v && typeof v === 'object') findAudio(v, found); });
  return found;
}

async function synthesize(model, apiKey, text, voice, style) {
  const content = { type: 'text', text };
  if (style) content.annotations = [{ type: 'speech_metadata', style }];
  const body = {
    model,
    input: [{ type: 'user_input', content: [content] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice }] },
  };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let resp;
  try {
    resp = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally { clearTimeout(t); }

  if (!resp.ok) {
    const err = new Error(`Gemini TTS ${model} ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const { data: b64, mime } = findAudio(data);
  if (!b64) throw new Error(`Gemini TTS ${model} returned no audio`);
  let buf = Buffer.from(b64, 'base64');
  const isWav = buf.slice(0, 4).toString('ascii') === 'RIFF';
  if (!isWav && (!mime || /l16|pcm/i.test(mime))) buf = pcmToWav(buf);
  return buf;
}

r.post('/', softAuth, ttsLimiter, async (req, res) => {
  const apiKey = getKey();
  if (!apiKey) return res.status(503).json({ error: 'Voice not configured' });

  const text = String(req.body?.text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  if (!text) return res.status(400).json({ error: 'text required' });
  const voice = VOICES.has(req.body?.voice) ? req.body.voice : DEFAULT_VOICE;
  const style = String(req.body?.style || '').slice(0, 120);

  const key = crypto.createHash('sha1').update(`${voice}|${style}|${text}`).digest('hex');
  const hit = cacheGet(key);
  if (hit) {
    res.setHeader('Content-Type', 'audio/wav'); res.setHeader('X-TTS-Cache', 'hit');
    return res.send(hit);
  }

  let quota = false;
  for (const model of modelChain()) {
    try {
      const wav = await synthesize(model, apiKey, text, voice, style);
      cacheSet(key, wav);
      res.setHeader('Content-Type', 'audio/wav');
      return res.send(wav);
    } catch (e) {
      console.warn(`[TTS] ${e.message}`);
      if (e.status === 401 || e.status === 403) break;        // bad key → no point trying another model
      if (e.status === 429) quota = true;
    }
  }
  return res.status(quota ? 429 : 503).json({ error: quota ? 'Voice quota reached' : 'Voice unavailable' });
});

module.exports = r;
