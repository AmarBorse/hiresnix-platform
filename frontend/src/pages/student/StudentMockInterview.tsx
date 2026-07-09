// src/pages/student/StudentMockInterview.tsx
// AI Mock Interview powered by Google Gemini via backend proxy

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, RotateCcw,
  ChevronRight, CheckCircle, Clock, Award,
  BarChart2, AlertCircle, Play, Bot, Send
} from 'lucide-react';
import client from '../../api/client';

// ── Domains ──────────────────────────────────────────────────────
const DOMAINS = [
  'Full Stack', 'Frontend', 'Backend', 'Data Science',
  'Machine Learning', 'DevOps', 'UI/UX', 'Data Analyst',
  'Cloud Computing', 'App Development'
];

// ── Types ─────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }
interface QResult { question: string; answer: string; score: number; feedback: string; }
type Stage = 'setup' | 'interview' | 'result';

export function StudentMockInterview() {
  const [stage, setStage]         = useState<Stage>('setup');
  const [domain, setDomain]       = useState('Full Stack');
  const [messages, setMessages]   = useState<Message[]>([]);
  const [results, setResults]     = useState<QResult[]>([]);
  const [currentQ, setCurrentQ]   = useState('');
  const [qNumber, setQNumber]     = useState(0);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [timer, setTimer]         = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [camOn, setCamOn]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [feedback, setFeedback]   = useState<{score: number; text: string} | null>(null);
  const [manualInput, setManualInput] = useState('');

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognRef = useRef<any>(null);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Camera ───────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch { console.log('Camera not available'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };

  // ── Speech Recognition ───────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';
    recog.onresult = (e: any) => {
      let final = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      const text = (final + interim).trim();
      setTranscript(text);
      setManualInput(text);
    };
    recog.onerror = () => { try { recog.stop(); setTimeout(() => recog.start(), 300); } catch {} };
    recog.onend = () => { if (recognRef.current === recog) { try { recog.start(); } catch {} } };
    try { recog.start(); recognRef.current = recog; setListening(true); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    recognRef.current?.stop();
    recognRef.current = null;
    setListening(false);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      handleSubmit();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer, timerActive]);

  // ── Call Gemini API directly from frontend ──────────────────────
  const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  const SYSTEM = `You are an expert technical interviewer. Ask ONE question at a time. Evaluate answers. Always respond in this exact JSON format: {"feedback":"feedback on previous answer (empty for first)","score":0,"nextQuestion":"next question","isComplete":false}. After 5 questions set isComplete to true. Domain: ${domain}`;

  const askGemini = async (msgs: Message[]): Promise<{feedback: string; score: number; nextQuestion: string; isComplete: boolean}> => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    try { return JSON.parse(clean); }
    catch { return { feedback: '', score: 5, nextQuestion: text, isComplete: false }; }
  };

  // ── Start Interview ──────────────────────────────────────────────
  const startInterview = async () => {
    setLoading(true);
    await startCamera();
    const initMsg: Message = { role: 'user', content: `Start the interview. Domain: ${domain}. Ask me the first question.` };
    const msgs = [initMsg];
    setMessages(msgs);
    try {
      const res = await askGemini(msgs);
      const aiMsg: Message = { role: 'assistant', content: res.nextQuestion };
      setMessages([...msgs, aiMsg]);
      setCurrentQ(res.nextQuestion);
      setQNumber(1);
      setResults([]);
      setTranscript('');
      setManualInput('');
      setFeedback(null);
      setTimer(90);
      setTimerActive(true);
      setStage('interview');
      setTimeout(() => startListening(), 500);
    } catch { alert('Failed to connect to AI. Check backend.'); }
    finally { setLoading(false); }
  };

  // ── Submit Answer ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const answer = manualInput.trim() || transcript.trim();
    if (!answer && qNumber > 0) return;
    stopListening();
    setTimerActive(false);
    setLoading(true);

    const userMsg: Message = { role: 'user', content: answer || '(No answer given)' };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);

    try {
      const res = await askGemini(newMsgs);
      
      // Save result
      setResults(prev => [...prev, {
        question: currentQ,
        answer: answer || '(No answer)',
        score: res.score,
        feedback: res.feedback,
      }]);

      if (res.isComplete || qNumber >= 5) {
        stopCamera();
        setStage('result');
        return;
      }

      // Next question
      const aiMsg: Message = { role: 'assistant', content: res.nextQuestion };
      setMessages([...newMsgs, aiMsg]);
      setFeedback({ score: res.score, text: res.feedback });
      setCurrentQ(res.nextQuestion);
      setQNumber(n => n + 1);
      setTranscript('');
      setManualInput('');
      setTimer(90);

      // Auto proceed after showing feedback
      setTimeout(() => {
        setFeedback(null);
        setTimerActive(true);
        startListening();
      }, 4000);

    } catch { alert('AI response error. Try again.'); }
    finally { setLoading(false); }
  }, [manualInput, transcript, messages, currentQ, qNumber, stopListening, startListening]);

  useEffect(() => { return () => { stopCamera(); stopListening(); }; }, []);

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const timerColor = timer <= 20 ? 'text-red-500' : timer <= 40 ? 'text-amber-500' : 'text-emerald-600';

  // ── SETUP ─────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Powered by Google Gemini AI • Real interview questions • Instant feedback</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DOMAINS.map(d => (
              <button key={d} onClick={() => setDomain(d)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${
                  domain === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 space-y-1.5 text-sm text-indigo-700">
          <p className="font-semibold text-indigo-800 mb-2">How it works:</p>
          {['Gemini AI will ask 5 technical questions', 'Speak your answer (Chrome) or type it', '90 seconds per question', 'Get AI score + detailed feedback', 'Final performance report'].map((t, i) => (
            <p key={i}>✓ {t}</p>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">Use <strong>Chrome</strong> for voice recognition. You can also type your answers.</p>
        </div>
        <button onClick={startInterview} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
          {loading ? <><Bot size={18} className="animate-pulse" /> Connecting to AI...</> : <><Play size={18} /> Start AI Interview</>}
        </button>
      </div>
    </div>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────
  if (stage === 'interview') return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">🤖 {domain} AI Interview</h2>
          <p className="text-xs text-gray-500">Question {qNumber} of 5</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timer <= 20 ? 'bg-red-50' : timer <= 40 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <Clock size={16} className={timerColor} />
          <span className={`font-mono font-bold text-xl ${timerColor}`}>{timer}s</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${((qNumber-1)/5)*100}%` }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera */}
        <div className="space-y-3">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <VideoOff size={36} className="text-gray-500" />
                <p className="text-gray-500 text-xs">Camera off</p>
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
            </div>
            <div className={`absolute top-3 right-3 p-1.5 rounded-full ${listening ? 'bg-green-500' : 'bg-gray-600'}`}>
              {listening ? <Mic size={14} color="white" /> : <MicOff size={14} color="white" />}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={camOn ? stopCamera : startCamera}
              className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition ${camOn ? 'bg-gray-100 text-gray-700' : 'bg-indigo-50 text-indigo-700'}`}>
              {camOn ? <><VideoOff size={14} /> Off</> : <><Video size={14} /> Camera</>}
            </button>
            <button onClick={listening ? stopListening : startListening}
              className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition ${listening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {listening ? <><Mic size={14} /> Listening</> : <><MicOff size={14} /> Mic</>}
            </button>
          </div>
        </div>

        {/* Question + Answer */}
        <div className="space-y-3">
          {/* AI Question */}
          <div className="bg-indigo-600 text-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} className="text-indigo-200" />
              <span className="text-xs text-indigo-200 font-semibold">QUESTION {qNumber}</span>
            </div>
            <p className="font-semibold leading-snug">{currentQ}</p>
          </div>

          {/* Feedback from previous answer */}
          {feedback && (
            <div className={`rounded-xl p-3 border text-sm ${feedback.score >= 7 ? 'bg-green-50 border-green-200' : feedback.score >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-bold text-gray-800 mb-1">Previous: {feedback.score}/10 — {feedback.text}</p>
              <p className="text-xs text-gray-500">Next question loading...</p>
            </div>
          )}

          {/* Answer input */}
          {!feedback && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-3 min-h-[90px]">
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  {listening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />}
                  {listening ? 'Listening... speak now' : 'Your answer (type or speak):'}
                </p>
                <textarea
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Type your answer or speak into mic..."
                  className="w-full text-sm text-gray-800 resize-none outline-none bg-transparent"
                  rows={3}
                />
              </div>
              <button onClick={handleSubmit} disabled={loading || (!manualInput.trim() && !transcript.trim())}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm">
                {loading ? <><Bot size={16} className="animate-pulse" /> AI is evaluating...</> : <><Send size={15} /> Submit Answer</>}
              </button>
            </>
          )}
        </div>
      </div>
      <div ref={bottomRef} />
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-2xl p-6 text-center text-white ${avgScore >= 7 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : avgScore >= 5 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-black mb-1">Interview Complete!</h2>
        <p className="text-5xl font-black my-3">{avgScore}<span className="text-2xl">/10</span></p>
        <p className="text-lg font-semibold">
          {avgScore >= 8 ? '🌟 Excellent!' : avgScore >= 6 ? '👍 Good Job!' : avgScore >= 4 ? '📚 Keep Practicing!' : '💪 Keep Going!'}
        </p>
        <p className="text-sm opacity-80 mt-1">{domain} • {results.length} Questions • Gemini AI</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500" />
          <h3 className="font-bold text-gray-900">Detailed Results</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {results.map((r, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-800 flex-1">Q{i+1}: {r.question}</p>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full flex-shrink-0 ${r.score>=7?'bg-green-100 text-green-700':r.score>=5?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                  {r.score}/10
                </span>
              </div>
              {r.answer !== '(No answer)' && <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">Your answer: {r.answer}</p>}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{r.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setStage('setup'); setResults([]); setMessages([]); setQNumber(0); setTranscript(''); setManualInput(''); setFeedback(null); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
          <RotateCcw size={16} /> Try Again
        </button>
        <button onClick={() => { setDomain(DOMAINS[(DOMAINS.indexOf(domain)+1)%DOMAINS.length]); setStage('setup'); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
          Change Domain
        </button>
      </div>
    </div>
  );
}