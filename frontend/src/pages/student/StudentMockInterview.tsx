// src/pages/student/StudentMockInterview.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, Award, BarChart2, Play, Volume2, VolumeX, AlertTriangle, Lock } from 'lucide-react';
import client from '../../api/client';

const DOMAINS = ['Full Stack', 'Frontend', 'Backend', 'Data Science', 'Machine Learning', 'DevOps', 'UI/UX', 'Data Analyst', 'Cloud Computing', 'App Development'];

interface Message { role: 'user' | 'assistant'; content: string; }
interface QResult { question: string; answer: string; score: number; feedback: string; }
type Stage = 'setup' | 'countdown' | 'interview' | 'result';

function AIAvatar({ speaking, thinking }: { speaking: boolean; thinking: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 ${speaking ? 'border-blue-400 shadow-lg shadow-blue-400/50' : thinking ? 'border-amber-400 shadow-lg shadow-amber-400/50' : 'border-gray-600'}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="35" r="22" fill="#c4b5fd"/>
            <ellipse cx="50" cy="80" rx="28" ry="22" fill="#4c1d95"/>
            <circle cx="42" cy="32" r="3.5" fill="#1e1b4b"/>
            <circle cx="58" cy="32" r="3.5" fill="#1e1b4b"/>
            <circle cx="43.5" cy="30.5" r="1" fill="white"/>
            <circle cx="59.5" cy="30.5" r="1" fill="white"/>
            {speaking
              ? <ellipse cx="50" cy="42" rx="5" ry="3.5" fill="#1e1b4b"/>
              : <path d="M44 41 Q50 46 56 41" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round"/>}
            <path d="M35 68 L50 58 L65 68" fill="#6d28d9"/>
          </svg>
        </div>
        {speaking && <><div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40"/><div className="absolute -inset-2 rounded-full border border-blue-300 animate-pulse opacity-20"/></>}
        {thinking && <div className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-spin opacity-60" style={{borderTopColor:'transparent'}}/>}
      </div>
      <div className="mt-3 px-4 py-1.5 bg-indigo-900/80 rounded-full border border-indigo-500/40">
        <p className="text-white text-xs font-bold tracking-wide">HIRESNIX AI</p>
        <p className="text-indigo-300 text-[10px] text-center">{thinking ? '⏳ Thinking...' : speaking ? '🔊 Speaking...' : '👂 Listening'}</p>
      </div>
    </div>
  );
}

function SoundWave({ active, color='#6366f1' }: { active: boolean; color?: string }) {
  const bars = [3,5,8,12,8,14,10,6,11,7,13,9,5,8,4];
  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map((h,i) => (
        <div key={i} style={{width:3, height: active ? h*2 : 4, backgroundColor: color, borderRadius:2, transition:'height 0.15s ease', animation: active ? `wave ${0.5+i*0.05}s ease-in-out infinite alternate` : 'none'}}/>
      ))}
      <style>{`@keyframes wave{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

export function StudentMockInterview() {
  const [stage, setStage]           = useState<Stage>('setup');
  const [domain, setDomain]         = useState('Full Stack');
  const [countdown, setCountdown]   = useState(3);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [results, setResults]       = useState<QResult[]>([]);
  const [currentQ, setCurrentQ]     = useState('');
  const [qNumber, setQNumber]       = useState(0);
  const [answer, setAnswer]         = useState('');

  // ── Enrollment Gate ───────────────────────────────────────────
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.allSettled([
      client.get('/enrollments/my'),
      client.get('/iplatform/my-application'),
      client.get('/iplatform/institution-student-app'),
    ]).then(([enrollRes, appRes, instAppRes]) => {
      const enrollments = enrollRes.status === 'fulfilled'
        ? (enrollRes.value.data?.data || enrollRes.value.data || [])
        : [];
      const hasEnrollment = Array.isArray(enrollments) && enrollments.length > 0;

      const appData = appRes.status === 'fulfilled' ? appRes.value.data : null;
      const hasApp = appData?.success && appData?.data?.status === 'Approved';

      const instApp = instAppRes.status === 'fulfilled' ? instAppRes.value.data : null;
      const hasInstApp = instApp?.success && instApp?.data?.status === 'Approved';

      setIsEnrolled(hasEnrollment || hasApp || hasInstApp);
    });
  }, []);

  // Loading state
  if (isEnrolled === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Not enrolled — show locked screen
  if (!isEnrolled) return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-6">
          <Lock size={36} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Mock Interview Locked</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          AI Mock Interview is available only for active learners.<br/>
          Enroll in an internship program to unlock this feature.
        </p>
        <a href="/student/internships"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
          Browse Internships →
        </a>
      </div>
    </div>
  );
  const [micOn, setMicOn]           = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [camOn, setCamOn]           = useState(false);
  const [muted, setMuted]           = useState(false);
  const [feedback, setFeedback]     = useState<{score:number;text:string}|null>(null);
  const [timer, setTimer]           = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [faceWarning, setFaceWarning] = useState(false);
  const [lookAwayCount, setLookAwayCount] = useState(0);
  const [eyeContact, setEyeContact]       = useState(true);
  const [micError, setMicError]     = useState('');

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recognRef   = useRef<any>(null);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const faceTimerRef  = useRef<NodeJS.Timeout | null>(null);
  const micActiveRef   = useRef(false);
  const finalTextRef   = useRef('');
  const prevFrameRef   = useRef<ImageData | null>(null);

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

  // ── Face Detection ───────────────────────────────────────────────
  const detectFaces = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.videoWidth === 0) return;

    const W = Math.floor(video.videoWidth / 3);
    const H = Math.floor(video.videoHeight / 3);
    canvas.width = W;
    canvas.height = H;
    ctx.drawImage(video, 0, 0, W, H);

    try {
      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;

      // ── 1. Skin pixel detection ─────────────────────────────────
      let skinPixels = 0;
      let totalChecked = 0;

      // Check center region (face should be centered)
      const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
      const rx = Math.floor(W * 0.35), ry = Math.floor(H * 0.45);

      for (let y = cy - ry; y < cy + ry; y += 2) {
        for (let x = cx - rx; x < cx + rx; x += 2) {
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i+1], b = data[i+2];
          totalChecked++;
          // Broader skin detection (works for Indian skin tones)
          const isSkin = (
            r > 60 && g > 30 && b > 15 &&
            r > b &&
            (r - g) > 5 &&
            r < 250 &&
            Math.max(r,g,b) - Math.min(r,g,b) > 10
          );
          if (isSkin) skinPixels++;
        }
      }

      const skinRatio = totalChecked > 0 ? skinPixels / totalChecked : 0;

      // ── 2. Motion / look-away detection ────────────────────────
      // Compare brightness across left/right halves of face region
      // If person looks away, brightness distribution shifts significantly
      let leftBrightness = 0, rightBrightness = 0, brightCount = 0;
      for (let y = cy - ry; y < cy + ry; y += 4) {
        for (let x = cx - rx; x < cx + rx; x += 4) {
          const i = (y * W + x) * 4;
          const brightness = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
          if (x < cx) leftBrightness += brightness;
          else rightBrightness += brightness;
          brightCount++;
        }
      }
      const halfCount = brightCount / 2 || 1;
      const leftAvg = leftBrightness / halfCount;
      const rightAvg = rightBrightness / halfCount;
      const asymmetry = Math.abs(leftAvg - rightAvg) / (Math.max(leftAvg, rightAvg) || 1);

      // ── 3. Frame difference (motion = looking away quickly) ─────
      let motionScore = 0;
      if (prevFrameRef.current) {
        const prev = prevFrameRef.current.data;
        let diff = 0;
        for (let i = 0; i < data.length; i += 16) {
          diff += Math.abs(data[i] - prev[i]) + Math.abs(data[i+1] - prev[i+1]) + Math.abs(data[i+2] - prev[i+2]);
        }
        motionScore = diff / (data.length / 16) / 255;
      }
      prevFrameRef.current = imageData;

      // ── Decision ────────────────────────────────────────────────
      // Face not in center = low skin in center region
      const noFaceInCenter = skinRatio < 0.05;
      // Strong asymmetry = looking to the side
      const lookingAway = asymmetry > 0.45 && skinRatio > 0.05;
      // High motion = sudden head turn
      const suddenTurn = motionScore > 0.22;

      // Require at least 2 signals to avoid false positives (glasses, lighting, etc)
      const warningSignals = [noFaceInCenter, lookingAway, suddenTurn].filter(Boolean).length;
      const isWarning = warningSignals >= 2;

      if (isWarning) {
        setFaceWarning(true);
        setEyeContact(false);
        setLookAwayCount(c => c + 1);
      } else {
        setFaceWarning(false);
        setEyeContact(skinRatio > 0.12);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (stage === 'interview' && camOn) {
      faceTimerRef.current = setInterval(detectFaces, 2000);
    }
    return () => { if (faceTimerRef.current) clearInterval(faceTimerRef.current); };
  }, [stage, camOn, detectFaces]);

  // ── TTS ──────────────────────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      if (muted || !window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9; utt.pitch = 1.1; utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') && v.lang==='en-US')
        || voices.find(v => v.lang==='en-US') || voices[0];
      if (preferred) utt.voice = preferred;
      utt.onstart = () => setAiSpeaking(true);
      utt.onend   = () => { setAiSpeaking(false); resolve(); };
      utt.onerror = () => { setAiSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utt);
    });
  }, [muted]);

  // ── Speech Recognition ───────────────────────────────────────────
  // Key fixes:
  // 1. micActiveRef tracks real mic state (no stale closure in onend)
  // 2. finalTextRef accumulates final transcripts across restarts
  // 3. Auto-restart on end only if mic is still meant to be on
  // 4. Permission check before starting
  const startMic = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    // Request mic permission explicitly first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError('Microphone permission denied. Please allow mic access.');
      setMicOn(false);
      micActiveRef.current = false;
      return;
    }

    setMicError('');
    if (recognRef.current) {
      try { recognRef.current.stop(); } catch {}
      recognRef.current = null;
    }

    const recog = new SR();
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.lang            = 'en-IN'; // en-IN works better for Indian accents
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setMicError('');
    };

    recog.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTextRef.current += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setAnswer(finalTextRef.current + interim);
    };

    recog.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        setMicError('Microphone blocked. Allow mic in browser settings.');
        micActiveRef.current = false;
        setMicOn(false);
      } else if (e.error === 'no-speech') {
        // No speech detected — just restart, don't show error
      } else if (e.error === 'network') {
        setMicError('Network error. Check internet connection.');
      } else if (e.error === 'aborted') {
        // Intentional abort — ignore
      }
    };

    recog.onend = () => {
      // Auto-restart ONLY if mic should still be on
      if (micActiveRef.current) {
        setTimeout(() => {
          if (micActiveRef.current && recognRef.current) {
            try { recognRef.current.start(); } catch {}
          }
        }, 300);
      }
    };

    recognRef.current = recog;
    try {
      recog.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
    }
  }, []);

  const stopMic = useCallback(() => {
    micActiveRef.current = false;
    if (recognRef.current) {
      try { recognRef.current.stop(); } catch {}
      try { recognRef.current.abort(); } catch {}
      recognRef.current = null;
    }
  }, []);

  const toggleMic = async () => {
    if (micOn) {
      micActiveRef.current = false;
      stopMic();
      setMicOn(false);
    } else {
      micActiveRef.current = true;
      setMicOn(true);
      await startMic();
    }
  };

  // Reset finalTextRef when answer is cleared (new question)
  const resetAnswer = () => {
    finalTextRef.current = '';
    setAnswer('');
  };

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) timerRef.current = setTimeout(() => setTimer(t => t-1), 1000);
    else if (timer === 0 && timerActive) handleSubmit();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer, timerActive]);

  // ── Groq AI ───────────────────────────────────────────────────────
  const GROQ_KEY = (import.meta as any).env.VITE_GROQ_API_KEY || '';
  const SYSTEM = `You are Alex, a friendly and encouraging technical interviewer at Hiresnix conducting a ${domain} interview with 20 questions.

QUESTION FLOW — follow this order strictly:

PHASE 1 — Personal (Q1-Q5):
Q1: "Tell me about yourself." — listen carefully, note their name, background, college/company.
Q2: "Tell me about your projects — what have you built, what technologies did you use, and what was your role?" — NOTE DOWN every project, tech stack, and feature they mention. You will use these in Q3 and later.
Q3: Ask a DEEP follow-up question about ONE specific project they mentioned in Q2. Example: if they said they built a "login system", ask "In your login system, how did you handle password security and session management?" — always reference their actual project details.
Q4: "What are your interests and hobbies outside of coding?"
Q5: "Why did you choose ${domain} and where do you see yourself in 2-3 years?"

PHASE 2 — Project Deep Dive (Q6-Q8):
Ask 3 more technical questions specifically about the projects/technologies the candidate mentioned in Q2. Dig into implementation details, challenges faced, design decisions. Example: "You mentioned using React — how did you manage state in your project? Did you use Redux or Context API?" Always reference their actual answers.

PHASE 3 — Technical Beginner (Q9-Q12):
Ask 4 beginner-level ${domain} technical questions (core concepts, definitions, basic usage).

PHASE 4 — Technical Intermediate (Q13-Q16):
Ask 4 intermediate ${domain} questions (design patterns, problem-solving, real scenarios).

PHASE 5 — Technical Advanced (Q17-Q19):
Ask 3 advanced ${domain} questions (architecture, optimization, system design).

Q20: "Do you have any questions for me?" (closing)

STRICT RULES:
1. In Q3 and Q6-Q8, ALWAYS reference the candidate's actual projects and tech stack from their Q2 answer. Never ask generic questions in these slots.
2. After EVERY answer, give the CORRECT/IDEAL answer so the student learns.
   Format: "[What they got right]. ✅ Ideal Answer: [complete correct explanation]. 💡 Tip: [one improvement]"
3. For Q1, Q2, Q3, Q4, Q5 — scoring should be based on communication quality and detail, not technical accuracy.
4. Be GENEROUS with scoring. Ignore voice recognition errors, filler words, informal language. Judge content only.

SCORING GUIDE:
9-10: Excellent, detailed, accurate
7-8: Correct concept, minor gaps  
5-6: Partially correct, right direction
3-4: Some understanding but significant gaps
1-2: Mostly wrong
0-1: Blank or irrelevant

Always respond ONLY in valid JSON (no extra text):
{"feedback":"[praise] ✅ Ideal Answer: [correct explanation] 💡 Tip: [suggestion]","score":0,"nextQuestion":"your next question text","isComplete":false}
Set isComplete true only after Q20.`;

  const callAI = async (msgs: Message[]) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body: JSON.stringify({
        model:'llama-3.1-8b-instant',
        messages:[{role:'system',content:SYSTEM},...msgs.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}))],
        temperature:0.7, max_tokens:400, response_format:{type:'json_object'}
      })
    });
    const data = await res.json();
    try { return JSON.parse(data?.choices?.[0]?.message?.content||'{}'); }
    catch { return {feedback:'',score:5,nextQuestion:'Tell me about your experience.',isComplete:false}; }
  };

  // ── Countdown → Interview ─────────────────────────────────────────
  const startCountdown = async () => {
    await startCamera();
    setStage('countdown'); setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c--; setCountdown(c);
      if (c <= 0) { clearInterval(iv); beginInterview(); }
    }, 1000);
  };

  const beginInterview = async () => {
    setStage('interview'); setAiThinking(true);
    await speak(`Hello! I'm Alex, your Hiresnix interviewer. Today we have a 20-question ${domain} interview. We'll start with some questions about you and your projects, then move into technical topics. Please speak clearly or type your answers. Let's begin!`);
    const init: Message = {role:'user',content:`Start interview for ${domain}. Ask first question.`};
    try {
      const res = await callAI([init]);
      setAiThinking(false);
      const msgs: Message[] = [init,{role:'assistant',content:res.nextQuestion}];
      setMessages(msgs); setCurrentQ(res.nextQuestion); setQNumber(1);
      await speak(res.nextQuestion);
      // Start mic AFTER AI finishes speaking
      micActiveRef.current = true;
      setMicOn(true);
      await startMic();
      setTimer(90); setTimerActive(true);
    } catch { setAiThinking(false); alert('AI connection failed.'); }
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const ans = (finalTextRef.current + answer).trim() || answer.trim();
    micActiveRef.current = false;
    stopMic(); setMicOn(false);
    setTimerActive(false);
    window.speechSynthesis.cancel();
    setAiThinking(true);

    const userMsg: Message = {role:'user',content:ans||'I need to pass on this one.'};
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    resetAnswer();
    setLookAwayCount(0);

    try {
      const res = await callAI(newMsgs);
      setResults(prev => [...prev,{question:currentQ,answer:ans||'(No answer)',score:res.score,feedback:res.feedback}]);

      if (res.isComplete || qNumber >= 20) {
        setAiThinking(false);
        await speak('That concludes our interview! Great effort. Let me calculate your results.');
        stopCamera(); setStage('result'); return;
      }

      const aiMsg: Message = {role:'assistant',content:res.nextQuestion};
      setMessages([...newMsgs, aiMsg]);
      setAiThinking(false);
      setFeedback({score:res.score, text:res.feedback});
      // Speak a shortened version (remove emoji symbols for TTS clarity)
      if (res.feedback) {
        const spokenFeedback = res.feedback
          .replace(/✅ Full Answer:/g, 'Here is the complete answer.')
          .replace(/💡 Tip:/g, 'Tip:')
          .replace(/[🎯🌟👍📚💪⚠️✅💡]/g, '');
        await speak(spokenFeedback.slice(0, 300)); // limit length for TTS
      }
      setFeedback(null);
      setCurrentQ(res.nextQuestion);
      setQNumber(n => n+1);
      await speak(res.nextQuestion);
      // Restart mic after AI finishes speaking next question
      micActiveRef.current = true;
      setMicOn(true);
      await startMic();
      setTimer(90); setTimerActive(true);
    } catch { setAiThinking(false); alert('AI error.'); }
  }, [answer, messages, currentQ, qNumber, stopMic, startMic, speak]);

  useEffect(() => () => { stopCamera(); stopMic(); window.speechSynthesis.cancel(); }, []);

  const avgScore = results.length ? Math.round(results.reduce((s,r)=>s+r.score,0)/results.length) : 0;
  const timerColor = timer<=20?'text-red-400':timer<=40?'text-amber-400':'text-emerald-400';

  // ── SETUP ─────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎙️ AI Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Real interview with AI • Voice + Type • Face monitoring</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="flex justify-center py-4 bg-gradient-to-br from-gray-900 to-indigo-950 rounded-xl">
          <AIAvatar speaking={false} thinking={false}/>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DOMAINS.map(d => (
              <button key={d} onClick={()=>setDomain(d)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${domain===d?'bg-indigo-600 text-white border-indigo-600':'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 space-y-1.5 text-sm text-indigo-700">
          {['🤖 20 questions: Personal → Projects → Technical (Beginner→Advanced)','🔊 Questions spoken aloud (enable sound)','🎤 Mic auto-on after each question — speak or type','⚠️ Use Chrome browser for best voice recognition','⏱️ 90 seconds per question • 20 questions total'].map((t,i)=><p key={i}>{t}</p>)}
        </div>
        <div className="flex gap-3">
          <button onClick={()=>setMuted(m=>!m)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${!muted?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-gray-100 border-gray-200 text-gray-500'}`}>
            {!muted?<Volume2 size={16}/>:<VolumeX size={16}/>} {!muted?'Sound ON':'Sound OFF'}
          </button>
          <button onClick={startCountdown}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
            <Play size={18}/> Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  // ── COUNTDOWN ─────────────────────────────────────────────────────
  if (stage === 'countdown') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-8 text-center w-80">
        <AIAvatar speaking={false} thinking={false}/>
        <p className="text-white text-lg font-semibold mt-6">Interview starting in...</p>
        <p className="text-7xl font-black text-indigo-400 mt-2">{countdown}</p>
        <p className="text-gray-400 text-sm mt-3">Ensure you are alone in the frame!</p>
      </div>
    </div>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────
  if (stage === 'interview') return (
    <div className="max-w-5xl mx-auto">
      {faceWarning && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-pulse">
          <AlertTriangle size={20} className="flex-shrink-0"/>
          <p className="text-sm font-semibold">⚠️ Multiple faces detected! Please ensure you are alone during the interview.</p>
        </div>
      )}
      {micError && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl">
          <Mic size={18} className="flex-shrink-0"/>
          <p className="text-sm font-semibold">{micError}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
          <span className="text-sm font-bold text-gray-700">LIVE INTERVIEW</span>
          <span className="text-xs text-gray-400">• {domain} • Q{qNumber}/20</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setMuted(m=>!m)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
            {muted?<VolumeX size={16} className="text-gray-500"/>:<Volume2 size={16} className="text-indigo-500"/>}
          </button>
          <div className={`px-3 py-1.5 rounded-lg ${timer<=20?'bg-red-900/20':timer<=40?'bg-amber-900/20':'bg-emerald-900/20'}`}>
            <span className={`font-mono font-bold text-lg ${timerColor}`}>{timer}s</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1 mb-5">
        <div className="bg-indigo-500 h-1 rounded-full transition-all" style={{width:`${((qNumber-1)/20)*100}%`}}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Side */}
        <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[420px]">
          <div className="flex-1 flex flex-col items-center justify-center space-y-5 w-full">
            <AIAvatar speaking={aiSpeaking} thinking={aiThinking}/>
            {currentQ && !feedback && (
              <div className="w-full bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-indigo-300 text-xs font-semibold mb-1">QUESTION {qNumber}</p>
                <p className="text-white text-sm leading-relaxed">{currentQ}</p>
              </div>
            )}
            {feedback && (
              <div className={`w-full rounded-xl p-4 border ${feedback.score>=7?'bg-green-900/30 border-green-500/30':feedback.score>=5?'bg-amber-900/30 border-amber-500/30':'bg-red-900/30 border-red-500/30'}`}>
                <p className={`text-xs font-bold mb-1 ${feedback.score>=7?'text-green-400':feedback.score>=5?'text-amber-400':'text-red-400'}`}>Score: {feedback.score}/10</p>
                <p className="text-white text-xs leading-relaxed">{feedback.text}</p>
              </div>
            )}
            <SoundWave active={aiSpeaking} color="#818cf8"/>
          </div>
        </div>

        {/* Student Side */}
        <div className="space-y-3">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{aspectRatio:'4/3'}}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
            <canvas ref={canvasRef} className="hidden"/>
            {!camOn && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><VideoOff size={32} className="text-gray-600"/><p className="text-gray-500 text-xs">Camera off</p></div>}

            {/* Face warning overlay on video */}
            {faceWarning && camOn && (
              <div className="absolute inset-0 border-4 border-red-500 rounded-2xl pointer-events-none animate-pulse">
                <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-xs font-bold px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={13}/> 
                  {lookAwayCount > 3 ? `⚠️ Look at camera! (${lookAwayCount} warnings)` : '👁️ Please look at the camera'}
                </div>
              </div>
            )}

            {/* Eye contact indicator */}
            {camOn && !faceWarning && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full"/> 👁️ Good eye contact
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
              <p className="text-white text-xs font-semibold">You {lookAwayCount > 0 && <span className="text-red-300 text-[10px]">· {lookAwayCount} look-away</span>}</p>
            </div>
            {micOn && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/> REC
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={camOn?stopCamera:startCamera}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${camOn?'bg-gray-200 text-gray-700':'bg-gray-100 text-gray-500'}`}>
              {camOn?<><VideoOff size={13}/>Camera Off</>:<><Video size={13}/>Camera On</>}
            </button>
            <button onClick={toggleMic}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${micOn?'bg-red-100 text-red-600':'bg-emerald-100 text-emerald-700'}`}>
              {micOn?<><MicOff size={13}/>Mic Off</>:<><Mic size={13}/>Mic On</>}
            </button>
          </div>

          {/* Mic status indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${micOn ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
            {micOn ? (
              <><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 🎤 Mic is ON — speak your answer</>
            ) : (
              <><div className="w-2 h-2 bg-gray-300 rounded-full"/> Mic is OFF — click Mic On or type below</>
            )}
          </div>

          <div className="relative bg-white border-2 border-indigo-100 rounded-xl p-3 focus-within:border-indigo-400 transition-colors">
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-2">
              {micOn && <SoundWave active={!!answer} color="#22c55e"/>}
              {micOn ? '🎤 Listening... speak or type below' : '⌨️ Type your answer'}
            </p>
            <textarea
              value={answer}
              onChange={e => {
                finalTextRef.current = '';
                setAnswer(e.target.value);
              }}
              placeholder="Speak or type your answer here..."
              rows={3}
              className="w-full text-sm text-gray-800 resize-none outline-none bg-transparent"
            />
            {answer && <span className="absolute bottom-2 right-3 text-xs text-gray-300">{answer.length} chars</span>}
          </div>

          <button onClick={handleSubmit} disabled={aiSpeaking||aiThinking}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition text-sm">
            {aiThinking?'⏳ AI is thinking...':aiSpeaking?'🔊 AI is speaking...':'✓ Submit Answer'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-2xl p-6 text-center text-white ${avgScore>=7?'bg-gradient-to-br from-emerald-500 to-teal-600':avgScore>=5?'bg-gradient-to-br from-amber-500 to-orange-600':'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90"/>
        <h2 className="text-2xl font-black">Interview Complete!</h2>
        <p className="text-5xl font-black my-3">{avgScore}<span className="text-2xl">/10</span></p>
        <p className="text-lg font-semibold">{avgScore>=8?'🌟 Excellent!':avgScore>=6?'👍 Good Job!':avgScore>=4?'📚 Keep Practicing!':'💪 Keep Going!'}</p>
        <p className="text-sm opacity-80 mt-1">{domain} • {results.length}/20 Questions</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500"/>
          <h3 className="font-bold text-gray-900">Detailed Results</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {results.map((r,i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-800 flex-1">Q{i+1}: {r.question}</p>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full flex-shrink-0 ${r.score>=7?'bg-green-100 text-green-700':r.score>=5?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{r.score}/10</span>
              </div>
              {r.answer!=='(No answer)'&&<p className="text-xs text-gray-500 mb-1.5 line-clamp-2">Your answer: {r.answer}</p>}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{r.feedback}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>{setStage('setup');setResults([]);setMessages([]);setQNumber(0);resetAnswer();setFeedback(null);window.speechSynthesis.cancel();}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
          <RotateCcw size={16}/> Try Again
        </button>
        <button onClick={()=>{setDomain(DOMAINS[(DOMAINS.indexOf(domain)+1)%DOMAINS.length]);setStage('setup');}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
          Change Domain
        </button>
      </div>
    </div>
  );
}