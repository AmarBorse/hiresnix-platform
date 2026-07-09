// src/pages/student/StudentMockInterview.tsx
// Full AI Interview Experience — Avatar + Voice Q&A

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, Award, BarChart2, Play, Volume2, VolumeX } from 'lucide-react';

const DOMAINS = ['Full Stack', 'Frontend', 'Backend', 'Data Science', 'Machine Learning', 'DevOps', 'UI/UX', 'Data Analyst', 'Cloud Computing', 'App Development'];

interface Message { role: 'user' | 'assistant'; content: string; }
interface QResult { question: string; answer: string; score: number; feedback: string; }
type Stage = 'setup' | 'countdown' | 'interview' | 'result';

// ── AI Avatar Component ───────────────────────────────────────────
function AIAvatar({ speaking, thinking }: { speaking: boolean; thinking: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 ${
        speaking ? 'border-blue-400 shadow-lg shadow-blue-400/50' : 
        thinking ? 'border-amber-400 shadow-lg shadow-amber-400/50' : 'border-gray-600'
      }`}>
        {/* Avatar face */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            {/* Head */}
            <circle cx="50" cy="35" r="22" fill="#c4b5fd"/>
            {/* Body */}
            <ellipse cx="50" cy="80" rx="28" ry="22" fill="#4c1d95"/>
            {/* Eyes */}
            <circle cx="42" cy="32" r="3.5" fill="#1e1b4b"/>
            <circle cx="58" cy="32" r="3.5" fill="#1e1b4b"/>
            {/* Eye shine */}
            <circle cx="43.5" cy="30.5" r="1" fill="white"/>
            <circle cx="59.5" cy="30.5" r="1" fill="white"/>
            {/* Mouth */}
            {speaking ? (
              <ellipse cx="50" cy="42" rx="5" ry="3.5" fill="#1e1b4b"/>
            ) : (
              <path d="M44 41 Q50 46 56 41" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round"/>
            )}
            {/* Collar */}
            <path d="M35 68 L50 58 L65 68" fill="#6d28d9"/>
          </svg>
        </div>

        {/* Speaking animation rings */}
        {speaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40" />
            <div className="absolute -inset-2 rounded-full border border-blue-300 animate-pulse opacity-20" />
          </>
        )}
        {thinking && (
          <div className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-spin opacity-60" style={{borderTopColor:'transparent'}} />
        )}
      </div>

      {/* Name tag */}
      <div className="mt-3 px-4 py-1.5 bg-indigo-900/80 rounded-full border border-indigo-500/40">
        <p className="text-white text-xs font-bold tracking-wide">HIRESNIX AI</p>
        <p className="text-indigo-300 text-[10px] text-center">
          {thinking ? '⏳ Thinking...' : speaking ? '🔊 Speaking...' : '👂 Listening'}
        </p>
      </div>
    </div>
  );
}

// ── Sound Wave Visualizer ─────────────────────────────────────────
function SoundWave({ active, color = '#6366f1' }: { active: boolean; color?: string }) {
  const bars = [3, 5, 8, 12, 8, 14, 10, 6, 11, 7, 13, 9, 5, 8, 4];
  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map((h, i) => (
        <div key={i}
          style={{
            width: 3, height: active ? h * 2 : 4, backgroundColor: color, borderRadius: 2,
            transition: 'height 0.15s ease',
            animation: active ? `wave ${0.5 + i * 0.05}s ease-in-out infinite alternate` : 'none'
          }}
        />
      ))}
      <style>{`@keyframes wave { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }`}</style>
    </div>
  );
}

export function StudentMockInterview() {
  const [stage, setStage]         = useState<Stage>('setup');
  const [domain, setDomain]       = useState('Full Stack');
  const [countdown, setCountdown] = useState(3);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [results, setResults]     = useState<QResult[]>([]);
  const [currentQ, setCurrentQ]   = useState('');
  const [qNumber, setQNumber]     = useState(0);
  const [answer, setAnswer]       = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiSpeaking, setAiSpeaking]   = useState(false);
  const [aiThinking, setAiThinking]   = useState(false);
  const [camOn, setCamOn]         = useState(false);
  const [muted, setMuted]         = useState(false);
  const [feedback, setFeedback]   = useState<{score: number; text: string} | null>(null);
  const [timer, setTimer]         = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [transcript, setTranscript]   = useState('');

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognRef = useRef<any>(null);
  const synthRef  = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);

  // ── Camera ───────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {}
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };

  // ── Text to Speech (AI voice) ─────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      if (muted || !window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9; utt.pitch = 1.1; utt.volume = 1;
      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || voices.find(v => v.lang === 'en-US') || voices[0];
      if (preferred) utt.voice = preferred;
      utt.onstart = () => setAiSpeaking(true);
      utt.onend   = () => { setAiSpeaking(false); resolve(); };
      utt.onerror = () => { setAiSpeaking(false); resolve(); };
      synthRef.current = utt;
      window.speechSynthesis.speak(utt);
    });
  }, [muted]);

  // ── Speech Recognition ────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome browser for voice input'); return; }
    if (recognRef.current) { try { recognRef.current.abort(); } catch {} recognRef.current = null; }
    
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';
    
    let finalTranscript = '';
    recog.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
      setAnswer(finalTranscript + interim);
    };
    recog.onerror = (e: any) => { console.log('Speech error:', e.error); };
    recog.onend = () => {};
    
    setTimeout(() => {
      try { recog.start(); recognRef.current = recog; }
      catch(e) { console.log('Recognition start error:', e); }
    }, 100);
  }, []);

  const stopListening = useCallback(() => {
    if (recognRef.current) { try { recognRef.current.stop(); } catch {} recognRef.current = null; }
    setIsRecording(false);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    else if (timer === 0 && timerActive) handleSubmit();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer, timerActive]);

  // ── Groq AI ───────────────────────────────────────────────────────
  const GROQ_KEY = (import.meta as any).env.VITE_GROQ_API_KEY || '';
  const SYSTEM_MSG = `You are Alex, a professional technical interviewer at Hiresnix. Conduct a realistic interview for ${domain} role. Ask ONE focused technical question at a time. Be conversational and encouraging. Always respond ONLY in valid JSON: {"feedback":"brief encouraging feedback on previous answer (empty for first question)","score":0,"nextQuestion":"your question here","isComplete":false}. Set isComplete true after exactly 5 questions. Keep questions concise and clear.`;

  const callAI = async (msgs: Message[]) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: SYSTEM_MSG }, ...msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))],
        temperature: 0.7, max_tokens: 400,
        response_format: { type: 'json_object' }
      })
    });
    const data = await res.json();
    try { return JSON.parse(data?.choices?.[0]?.message?.content || '{}'); }
    catch { return { feedback: '', score: 5, nextQuestion: 'Tell me about your experience.', isComplete: false }; }
  };

  // ── Countdown ────────────────────────────────────────────────────
  const startCountdown = async () => {
    await startCamera();
    setStage('countdown');
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(interval); beginInterview(); }
    }, 1000);
  };

  // ── Begin Interview ───────────────────────────────────────────────
  const beginInterview = async () => {
    setStage('interview');
    setAiThinking(true);
    const intro = `Hello! I'm Alex, your interviewer today. We'll be discussing ${domain}. I'll ask you 5 questions. Please speak clearly and take your time. Let's begin!`;
    await speak(intro);
    const initMsg: Message = { role: 'user', content: `Start interview for ${domain} role. Ask first question.` };
    try {
      const res = await callAI([initMsg]);
      setAiThinking(false);
      const msgs: Message[] = [initMsg, { role: 'assistant', content: res.nextQuestion }];
      setMessages(msgs);
      setCurrentQ(res.nextQuestion);
      setQNumber(1);
      await speak(res.nextQuestion);
      // Start listening after AI speaks
      setIsRecording(true);
      startListening();
      setTimer(90); setTimerActive(true);
    } catch {
      setAiThinking(false);
      alert('AI connection failed.');
    }
  };

  // ── Submit Answer ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const ans = answer.trim();
    stopListening();
    setTimerActive(false);
    setIsRecording(false);
    window.speechSynthesis.cancel();
    setAiThinking(true);

    const userMsg: Message = { role: 'user', content: ans || 'I need to pass on this one.' };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setAnswer(''); setTranscript('');

    try {
      const res = await callAI(newMsgs);
      setResults(prev => [...prev, { question: currentQ, answer: ans || '(No answer)', score: res.score, feedback: res.feedback }]);

      if (res.isComplete || qNumber >= 5) {
        setAiThinking(false);
        await speak("That concludes our interview! Great job. Let me calculate your results.");
        stopCamera();
        setStage('result');
        return;
      }

      // Show feedback briefly then next question
      setFeedback({ score: res.score, text: res.feedback });
      const aiMsg: Message = { role: 'assistant', content: res.nextQuestion };
      setMessages([...newMsgs, aiMsg]);

      // Speak feedback then next question
      setAiThinking(false);
      if (res.feedback) await speak(res.feedback);
      setFeedback(null);
      setCurrentQ(res.nextQuestion);
      setQNumber(n => n + 1);
      await speak(res.nextQuestion);

      // Start listening again
      setIsRecording(true);
      startListening();
      setTimer(90); setTimerActive(true);
    } catch {
      setAiThinking(false);
      alert('Error getting AI response.');
    }
  }, [answer, messages, currentQ, qNumber, stopListening, startListening, speak]);

  useEffect(() => () => { stopCamera(); stopListening(); window.speechSynthesis.cancel(); }, []);

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const timerColor = timer <= 20 ? 'text-red-400' : timer <= 40 ? 'text-amber-400' : 'text-emerald-400';

  // ── SETUP ─────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎙️ AI Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Real interview experience • AI interviewer speaks • You respond with voice</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {/* Preview of AI interviewer */}
        <div className="flex justify-center py-4 bg-gradient-to-br from-gray-900 to-indigo-950 rounded-xl">
          <AIAvatar speaking={false} thinking={false} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DOMAINS.map(d => (
              <button key={d} onClick={() => setDomain(d)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${domain === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 space-y-1.5 text-sm text-indigo-700">
          <p className="font-semibold text-indigo-800 mb-1">How it works:</p>
          {[
            '🤖 AI interviewer (Alex) will greet you',
            '🔊 Questions will be spoken aloud (enable sound)',
            '🎤 Speak your answers naturally',
            '⏱️ 90 seconds per question',
            '📊 Detailed AI feedback after each answer',
          ].map((t, i) => <p key={i}>{t}</p>)}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setMuted(m => !m)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${!muted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
            {!muted ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {!muted ? 'Sound ON' : 'Sound OFF'}
          </button>
          <button onClick={startCountdown}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
            <Play size={18} /> Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  // ── COUNTDOWN ─────────────────────────────────────────────────────
  if (stage === 'countdown') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-8 text-center w-80">
        <AIAvatar speaking={false} thinking={false} />
        <p className="text-white text-lg font-semibold mt-6">Interview starting in...</p>
        <p className="text-7xl font-black text-indigo-400 mt-2">{countdown}</p>
        <p className="text-gray-400 text-sm mt-3">Get ready to speak clearly!</p>
      </div>
    </div>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────
  if (stage === 'interview') return (
    <div className="max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-gray-700">LIVE INTERVIEW</span>
          <span className="text-xs text-gray-400">• {domain} • Q{qNumber}/5</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMuted(m => !m)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
            {muted ? <VolumeX size={16} className="text-gray-500" /> : <Volume2 size={16} className="text-indigo-500" />}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timer<=20?'bg-red-900/20':timer<=40?'bg-amber-900/20':'bg-emerald-900/20'}`}>
            <span className={`font-mono font-bold text-lg ${timerColor}`}>{timer}s</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 rounded-full h-1 mb-5">
        <div className="bg-indigo-500 h-1 rounded-full transition-all" style={{ width: `${((qNumber-1)/5)*100}%` }} />
      </div>

      {/* Main interview area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: AI Interviewer */}
        <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[420px]">
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full">
            <AIAvatar speaking={aiSpeaking} thinking={aiThinking} />

            {/* Question display */}
            {currentQ && !feedback && (
              <div className="w-full bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-indigo-300 text-xs font-semibold mb-1">QUESTION {qNumber}</p>
                <p className="text-white text-sm leading-relaxed">{currentQ}</p>
              </div>
            )}

            {/* Feedback display */}
            {feedback && (
              <div className={`w-full rounded-xl p-4 border ${feedback.score>=7?'bg-green-900/30 border-green-500/30':feedback.score>=5?'bg-amber-900/30 border-amber-500/30':'bg-red-900/30 border-red-500/30'}`}>
                <p className={`text-xs font-bold mb-1 ${feedback.score>=7?'text-green-400':feedback.score>=5?'text-amber-400':'text-red-400'}`}>
                  Score: {feedback.score}/10
                </p>
                <p className="text-white text-xs leading-relaxed">{feedback.text}</p>
              </div>
            )}

            {/* Sound wave */}
            <div className="flex items-center gap-3">
              <SoundWave active={aiSpeaking} color="#818cf8" />
            </div>
          </div>
        </div>

        {/* Right: Student */}
        <div className="space-y-3">
          {/* Camera */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{aspectRatio:'4/3'}}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900">
                <VideoOff size={32} className="text-gray-600" />
                <p className="text-gray-500 text-xs">Camera off</p>
              </div>
            )}
            {/* Student label */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
              <p className="text-white text-xs font-semibold">You</p>
            </div>
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> REC
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button onClick={camOn ? stopCamera : startCamera}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${camOn?'bg-gray-200 text-gray-700':'bg-gray-100 text-gray-500'}`}>
              {camOn ? <><VideoOff size={13}/> Camera Off</> : <><Video size={13}/> Camera On</>}
            </button>
            <button
              onMouseDown={() => { setIsRecording(true); startListening(); }}
              onMouseUp={() => { stopListening(); setIsRecording(false); }}
              onTouchStart={(e) => { e.preventDefault(); setIsRecording(true); startListening(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopListening(); setIsRecording(false); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition select-none ${isRecording?'bg-red-500 text-white scale-95':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {isRecording ? <><MicOff size={13}/> 🔴 Recording...</> : <><Mic size={13}/> Hold to Speak</>}
            </button>
          </div>

          {/* Answer textarea - primary input */}
          <div className="relative">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here... (or hold mic button to speak)"
              rows={4}
              autoFocus
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:border-indigo-500 bg-white"
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-300">{answer.length} chars</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit}
            disabled={aiSpeaking || aiThinking}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm">
            {aiThinking ? '⏳ AI is thinking...' : aiSpeaking ? '🔊 AI is speaking...' : '✓ Submit Answer'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-2xl p-6 text-center text-white ${avgScore>=7?'bg-gradient-to-br from-emerald-500 to-teal-600':avgScore>=5?'bg-gradient-to-br from-amber-500 to-orange-600':'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-black">Interview Complete!</h2>
        <p className="text-5xl font-black my-3">{avgScore}<span className="text-2xl">/10</span></p>
        <p className="text-lg font-semibold">{avgScore>=8?'🌟 Excellent!':avgScore>=6?'👍 Good Job!':avgScore>=4?'📚 Keep Practicing!':'💪 Keep Going!'}</p>
        <p className="text-sm opacity-80 mt-1">{domain} Interview • {results.length} Questions • Groq AI</p>
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
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full flex-shrink-0 ${r.score>=7?'bg-green-100 text-green-700':r.score>=5?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{r.score}/10</span>
              </div>
              {r.answer !== '(No answer)' && <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">Your answer: {r.answer}</p>}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{r.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setStage('setup'); setResults([]); setMessages([]); setQNumber(0); setAnswer(''); setFeedback(null); setTranscript(''); window.speechSynthesis.cancel(); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
          <RotateCcw size={16}/> Try Again
        </button>
        <button onClick={() => { setDomain(DOMAINS[(DOMAINS.indexOf(domain)+1)%DOMAINS.length]); setStage('setup'); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
          Change Domain
        </button>
      </div>
    </div>
  );
}