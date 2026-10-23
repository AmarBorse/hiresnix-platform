// src/lib/aiVoice.ts
// Natural "Gemini" voice for the AI (Mock Interview, AI Academy teacher).
//
// speakAI() asks the backend (/api/tts → Gemini text-to-speech) for audio and plays it.
// It returns false if Gemini audio could not be produced, so the caller can fall back
// to the browser's built-in voice. Long text is split into sentences; the next one is
// fetched while the current one plays, so speech starts quickly and flows without gaps.

// ── Voice settings: change these to pick a different Gemini voice ──
// All 30 options: Zephyr, Puck, Charon, Kore, Fenrir, Leda, Orus, Aoede, Callirrhoe, Autonoe,
// Enceladus, Iapetus, Umbriel, Algieba, Despina, Erinome, Algenib, Rasalgethi, Laomedeia,
// Achernar, Alnilam, Schedar, Gacrux, Pulcherrima, Achird, Zubenelgenubi, Vindemiatrix,
// Sadachbia, Sadaltager, Sulafat
export const VOICES = {
  interviewer: { voice: 'Kore', style: 'professional, warm and clear, natural conversational pace' },
  teacher: { voice: 'Achird', style: 'friendly, encouraging teacher, clear and relaxed' },
} as const;

type SpeakOptions = { voice: string; style?: string; onStart?: () => void };

const API_BASE: string = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';
const MAX_CHARS = 1200;   // per call to speakAI
const CHUNK_CHARS = 320;  // per request to the backend

let seq = 0;                               // increments on every new speak/stop, cancels older ones
let ctrl: AbortController | null = null;   // aborts in-flight audio requests
let audioEl: HTMLAudioElement | null = null;
let pausedUntil = 0;                       // after a quota/server error, skip Gemini for a while

const authToken = () =>
  localStorage.getItem('hx_student_token') ||
  localStorage.getItem('hirenix_token') ||
  localStorage.getItem('hx_inst_student_token') ||
  localStorage.getItem('hx_inst_hiresnix_token') || '';

/** Remove markdown/code so it isn't read aloud */
function clean(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[#*_>~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARS);
}

/** Split into sentence-sized pieces of at most CHUNK_CHARS */
function chunk(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > CHUNK_CHARS && cur) { out.push(cur.trim()); cur = ''; }
    if (s.length > CHUNK_CHARS) {
      // very long sentence: cut on commas/spaces
      for (let i = 0; i < s.length; i += CHUNK_CHARS) out.push(s.slice(i, i + CHUNK_CHARS).trim());
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

async function fetchAudio(text: string, opts: SpeakOptions, signal: AbortSignal): Promise<string | null> {
  const token = authToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, voice: opts.voice, style: opts.style }),
      signal,
    });
    if (!r.ok) {
      // quota or server problem: use the browser voice for the next 2 minutes instead of waiting each time
      if (r.status === 429 || r.status >= 500) pausedUntil = Date.now() + 2 * 60 * 1000;
      return null;
    }
    const blob = await r.blob();
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null; // aborted or network error
  }
}

function play(url: string, mySeq: number): Promise<void> {
  return new Promise(resolve => {
    if (mySeq !== seq) { resolve(); return; }
    const a = new Audio(url);
    audioEl = a;
    const done = () => { a.onended = null; a.onerror = null; resolve(); };
    a.onended = done;
    a.onerror = done;
    a.play().catch(done);
  });
}

/** Stop any Gemini speech that is playing or loading */
export function stopAIVoice() {
  seq++;
  ctrl?.abort();
  ctrl = null;
  if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
}

/** Stop everything: Gemini audio and the browser's built-in voice */
export function stopAllSpeech() {
  stopAIVoice();
  try { window.speechSynthesis?.cancel(); } catch { /* not supported */ }
}

/**
 * Speak with a Gemini voice. Resolves when speech has finished (or was stopped).
 * Returns false only if no Gemini audio could be produced, so the caller can use the browser voice.
 */
export async function speakAI(text: string, opts: SpeakOptions): Promise<boolean> {
  if (Date.now() < pausedUntil) return false;
  const parts = chunk(clean(text));
  if (!parts.length) return false;

  stopAIVoice();
  const mySeq = seq;
  ctrl = new AbortController();
  const signal = ctrl.signal;

  let started = false;
  let next = fetchAudio(parts[0], opts, signal);
  for (let i = 0; i < parts.length; i++) {
    const url = await next;
    if (mySeq !== seq) { if (url) URL.revokeObjectURL(url); return true; } // stopped meanwhile
    if (!url) return started;            // nothing played yet → let caller fall back
    if (i + 1 < parts.length) next = fetchAudio(parts[i + 1], opts, signal); // prefetch next sentence
    if (!started) { started = true; opts.onStart?.(); }
    await play(url, mySeq);
    URL.revokeObjectURL(url);
    if (mySeq !== seq) return true;
  }
  return true;
}
