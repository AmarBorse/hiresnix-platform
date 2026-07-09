// src/pages/student/StudentMockInterview.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, RotateCcw, Clock, Award, BarChart2, AlertCircle, Play, Bot, Send } from 'lucide-react';

const DOMAINS = ['Full Stack', 'Frontend', 'Backend', 'Data Science', 'Machine Learning', 'DevOps', 'UI/UX', 'Data Analyst', 'Cloud Computing', 'App Development'];

interface Message { role: 'user' | 'assistant'; content: string; }
interface QResult { question: string; answer: string; score: number; feedback: string; }
type Stage = 'setup' | 'interview' | 'result';

export function StudentMockInterview() {
  const [stage, setStage]       = useState<Stage>('setup');
  const [domain, setDomain]     = useState('Full Stack');
  const [messages, setMessages] = useState<Message[]>([]);
  const [results, setResults]   = useState<QResult[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [qNumber, setQNumber]   = useState(0);
  const [answer, setAnswer]     = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer]       = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [camOn, setCamOn]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState<{score: number; text: string} | null>(null);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const recognRef  = useRef<any>(null);
  const timerRef   = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // ── Speech Recording — Push to Talk style ────────────────────────
  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome for speech recognition'); return; }
    
    // Stop any existing
    if (recognRef.current) { try { recognRef.current.stop(); } catch {} recognRef.current = null; }

    const recog = new SR();
    recog.continuous = false; // single utterance
    recog.interimResults = false;
    recog.lang = 'en-US';
    
    recog.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setAnswer(prev => (prev ? prev + ' ' + text : text));
    };
    recog.onerror = () => { setIsRecording(false); recognRef.current = null; };
    recog.onend   = () => { setIsRecording(false); recognRef.current = null; };
    
    recog.start();
    recognRef.current = recog;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognRef.current) { try { recognRef.current.stop(); } catch {} }
    setIsRecording(false);
  };

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      handleSubmit();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer, timerActive]);

  // ── Groq API ─────────────────────────────────────────────────────
  const GROQ_KEY = (import.meta as any).env.VITE_GROQ_API_KEY || '';
  const SYSTEM_MSG = `You are an expert technical interviewer. Ask ONE clear technical question at a time. Evaluate answers. Always respond ONLY in valid JSON: {"feedback":"brief feedback on previous answer, empty string for first question","score":0,"nextQuestion":"your question here","isComplete":false}. Set isComplete true after 5 questions. Domain: ${domain}`;

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
    const text = data?.choices?.[0]?.message?.content || '{}';
    try { return JSON.parse(text); }
    catch { return { feedback: '', score: 5, nextQuestion: 'Tell me about yourself.', isComplete: false }; }
  };

  // ── Start ────────────────────────────────────────────────────────
  const startInterview = async () => {
    setLoading(true);
    await startCamera();
    const initMsg: Message = { role: 'user', content: `Start the interview. I am being interviewed for ${domain} role. Ask me the first question.` };
    try {
      const res = await callAI([initMsg]);
      const msgs: Message[] = [initMsg, { role: 'assistant', content: res.nextQuestion }];
      setMessages(msgs);
      setCurrentQ(res.nextQuestion);
      setQNumber(1); setResults([]); setAnswer('');
      setFeedback(null); setTimer(90); setTimerActive(true);
      setStage('interview');
    } catch (e) { alert('AI connection failed. Check Groq API key in Vercel env.'); }
    finally { setLoading(false); }
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const ans = answer.trim();
    setTimerActive(false);
    stopRecording();
    setLoading(true);
    const userMsg: Message = { role: 'user', content: ans || '(No answer given)' };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    try {
      const res = await callAI(newMsgs);
      setResults(prev => [...prev, { question: currentQ, answer: ans || '(No answer)', score: res.score, feedback: res.feedback }]);
      if (res.isComplete || qNumber >= 5) { stopCamera(); setStage('result'); return; }
      const aiMsg: Message = { role: 'assistant', content: res.nextQuestion };
      setMessages([...newMsgs, aiMsg]);
      setFeedback({ score: res.score, text: res.feedback });
      setCurrentQ(res.nextQuestion);
      setQNumber(n => n + 1);
      setAnswer('');
      setTimeout(() => { setFeedback(null); setTimer(90); setTimerActive(true); }, 3500);
    } catch { alert('Error getting AI response.'); }
    finally { setLoading(false); }
  };

  useEffect(() => () => { stopCamera(); stopRecording(); }, []);

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const timerColor = timer <= 20 ? 'text-red-500' : timer <= 40 ? 'text-amber-500' : 'text-emerald-600';

  // ── SETUP ─────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Powered by Groq AI (Llama 3.1) • Real questions • Instant feedback</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
          {['AI will ask 5 technical questions', 'Hold 🎤 mic button while speaking', 'Or type your answer in the box', '90 seconds per question', 'Get AI score + detailed feedback'].map((t, i) => <p key={i}>✓ {t}</p>)}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <span>Hold the <strong>🎤 Hold to Speak</strong> button while talking. Release when done. Or just type your answer.</span>
        </div>
        <button onClick={startInterview} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
          {loading ? <><Bot size={18} className="animate-pulse" /> Connecting...</> : <><Play size={18} /> Start AI Interview</>}
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
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timer<=20?'bg-red-50':timer<=40?'bg-amber-50':'bg-emerald-50'}`}>
          <Clock size={16} className={timerColor} />
          <span className={`font-mono font-bold text-xl ${timerColor}`}>{timer}s</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${((qNumber-1)/5)*100}%` }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera */}
        <div className="space-y-3">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!camOn && <div className="absolute inset-0 flex items-center justify-center"><VideoOff size={36} className="text-gray-500" /></div>}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
            </div>
          </div>
          <button onClick={camOn ? stopCamera : startCamera}
            className={`w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${camOn ? 'bg-gray-100 text-gray-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {camOn ? <><VideoOff size={14} /> Turn Off Camera</> : <><Video size={14} /> Turn On Camera</>}
          </button>
        </div>

        {/* Q&A */}
        <div className="space-y-3">
          <div className="bg-indigo-600 text-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} className="text-indigo-200" />
              <span className="text-xs text-indigo-200 font-semibold">QUESTION {qNumber}</span>
            </div>
            <p className="font-semibold leading-snug">{currentQ}</p>
          </div>

          {feedback ? (
            <div className={`rounded-xl p-4 border ${feedback.score>=7?'bg-green-50 border-green-200':feedback.score>=5?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200'}`}>
              <p className="font-bold text-gray-800">Score: {feedback.score}/10</p>
              <p className="text-sm text-gray-600 mt-1">{feedback.text}</p>
              <p className="text-xs text-gray-400 mt-2">Next question loading...</p>
            </div>
          ) : (
            <>
              {/* Text area */}
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:border-indigo-400 bg-white"
              />

              {/* Hold to speak button */}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition select-none ${
                  isRecording ? 'bg-red-500 text-white scale-95' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}>
                {isRecording ? <><MicOff size={16} /> 🔴 Recording... Release when done</> : <><Mic size={16} /> 🎤 Hold to Speak</>}
              </button>

              <button onClick={handleSubmit} disabled={loading || !answer.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm">
                {loading ? <><Bot size={16} className="animate-pulse" /> AI evaluating...</> : <><Send size={15} /> Submit Answer</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-2xl p-6 text-center text-white ${avgScore>=7?'bg-gradient-to-br from-emerald-500 to-teal-600':avgScore>=5?'bg-gradient-to-br from-amber-500 to-orange-600':'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-black mb-1">Interview Complete!</h2>
        <p className="text-5xl font-black my-3">{avgScore}<span className="text-2xl">/10</span></p>
        <p className="text-lg font-semibold">{avgScore>=8?'🌟 Excellent!':avgScore>=6?'👍 Good Job!':avgScore>=4?'📚 Keep Practicing!':'💪 Keep Going!'}</p>
        <p className="text-sm opacity-80 mt-1">{domain} • {results.length} Questions • Groq AI</p>
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
        <button onClick={() => { setStage('setup'); setResults([]); setMessages([]); setQNumber(0); setAnswer(''); setFeedback(null); }}
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