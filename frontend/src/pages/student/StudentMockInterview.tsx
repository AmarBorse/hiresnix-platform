// src/pages/student/StudentMockInterview.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, Award, BarChart2, Play, Volume2, VolumeX, AlertTriangle, Lock, Upload, ChevronRight, SkipForward, FileText, Download } from 'lucide-react';
import client from '../../api/client';

// ── Constants ────────────────────────────────────────────────────────
const DOMAINS = ['Full Stack','Frontend','Backend','Data Science','Machine Learning','DevOps','UI/UX','Data Analyst','Cloud Computing','App Development'];
const ROUNDS = [
  { id:'hr',    label:'HR Round',         icon:'🤝', desc:'Personal, motivation & culture fit' },
  { id:'tech',  label:'Technical Round',  icon:'💻', desc:'Domain-specific technical questions' },
  { id:'apt',   label:'Aptitude Round',   icon:'🧠', desc:'Logical reasoning & problem solving' },
  { id:'behav', label:'Behavioral Round', icon:'🎯', desc:'Situation-based STAR questions' },
];
const GROQ_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';

// ── Types ────────────────────────────────────────────────────────────
interface Message  { role:'user'|'assistant'; content:string; }
interface QResult  { question:string; answer:string; score:number; feedback:string; round:string; }
interface ScoreBreakdown { communication:number; technical:number; confidence:number; grammar:number; problemSolving:number; }
type Stage = 'setup'|'countdown'|'interview'|'result';

// ── Sub-components ───────────────────────────────────────────────────
function AIAvatar({ speaking, thinking }: { speaking:boolean; thinking:boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative w-28 h-28 rounded-full border-4 transition-all duration-300 ${speaking?'border-blue-400 shadow-lg shadow-blue-400/50':thinking?'border-amber-400 shadow-lg shadow-amber-400/50':'border-gray-600'}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="35" r="22" fill="#c4b5fd"/>
            <ellipse cx="50" cy="80" rx="28" ry="22" fill="#4c1d95"/>
            <circle cx="42" cy="32" r="3.5" fill="#1e1b4b"/>
            <circle cx="58" cy="32" r="3.5" fill="#1e1b4b"/>
            <circle cx="43.5" cy="30.5" r="1" fill="white"/>
            <circle cx="59.5" cy="30.5" r="1" fill="white"/>
            {speaking?<ellipse cx="50" cy="42" rx="5" ry="3.5" fill="#1e1b4b"/>:<path d="M44 41 Q50 46 56 41" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round"/>}
            <path d="M35 68 L50 58 L65 68" fill="#6d28d9"/>
          </svg>
        </div>
        {speaking&&<><div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40"/><div className="absolute -inset-2 rounded-full border border-blue-300 animate-pulse opacity-20"/></>}
        {thinking&&<div className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-spin opacity-60" style={{borderTopColor:'transparent'}}/>}
      </div>
      <div className="mt-3 px-4 py-1.5 bg-indigo-900/80 rounded-full border border-indigo-500/40">
        <p className="text-white text-xs font-bold tracking-wide">HIRESNIX AI</p>
        <p className="text-indigo-300 text-[10px] text-center">{thinking?'⏳ Thinking...':speaking?'🔊 Speaking...':'👂 Listening'}</p>
      </div>
    </div>
  );
}

function SoundWave({ active, color='#6366f1' }:{ active:boolean; color?:string }) {
  const bars = [3,5,8,12,8,14,10,6,11,7,13,9,5,8,4];
  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map((h,i)=>(
        <div key={i} style={{width:3,height:active?h*2:4,backgroundColor:color,borderRadius:2,transition:'height 0.15s ease',animation:active?`wave ${0.5+i*0.05}s ease-in-out infinite alternate`:'none'}}/>
      ))}
      <style>{`@keyframes wave{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function StudentMockInterview() {
  // Enrollment gate
  const [isEnrolled, setIsEnrolled] = useState<boolean|null>(null);

  // Config
  const [domain,     setDomain]     = useState('Full Stack');
  const [round,      setRound]      = useState('hr');
  const [experience, setExperience] = useState<'Fresher'|'Experienced'>('Fresher');
  const [difficulty, setDifficulty] = useState<'Easy'|'Medium'|'Hard'>('Medium');
  const [resumeText, setResumeText] = useState('');
  const [resumeName, setResumeName] = useState('');

  // Interview state
  const [stage,        setStage]        = useState<Stage>('setup');
  const [countdown,    setCountdown]    = useState(3);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [results,      setResults]      = useState<QResult[]>([]);
  const [currentQ,     setCurrentQ]     = useState('');
  const [qNumber,      setQNumber]      = useState(0);
  const [answer,       setAnswer]       = useState('');
  const [feedback,     setFeedback]     = useState<{score:number;text:string}|null>(null);
  const [scores,       setScores]       = useState<ScoreBreakdown>({communication:0,technical:0,confidence:0,grammar:0,problemSolving:0});

  // Media
  const [micOn,       setMicOn]       = useState(false);
  const [aiSpeaking,  setAiSpeaking]  = useState(false);
  const [aiThinking,  setAiThinking]  = useState(false);
  const [camOn,       setCamOn]       = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [micError,    setMicError]    = useState('');
  const [faceWarning, setFaceWarning] = useState(false);
  const [lookAwayCount, setLookAwayCount] = useState(0);

  // Timer
  const [timer,       setTimer]       = useState(90);
  const [timerActive, setTimerActive] = useState(false);

  // Refs
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream|null>(null);
  const recognRef     = useRef<any>(null);
  const timerRef      = useRef<NodeJS.Timeout|null>(null);
  const faceTimerRef  = useRef<NodeJS.Timeout|null>(null);
  const micActiveRef  = useRef(false);
  const finalTextRef  = useRef('');
  const prevFrameRef  = useRef<ImageData|null>(null);
  const fileRef       = useRef<HTMLInputElement>(null);

  // ── Enrollment check ──────────────────────────────────────────────
  useEffect(()=>{
    Promise.allSettled([
      client.get('/internships/my'),
      client.get('/iplatform/my-application'),
      client.get('/iplatform/institution-student-app'),
    ]).then(([eR,aR,iR])=>{
      const enrollments = eR.status==='fulfilled'?(eR.value.data?.data||eR.value.data||[]):[];
      const hasE = Array.isArray(enrollments)&&enrollments.length>0;
      const aD   = aR.status==='fulfilled'?aR.value.data:null;
      const hasA = aD?.success&&aD?.data?.status==='Approved';
      const iD   = iR.status==='fulfilled'?iR.value.data:null;
      const hasI = iD?.success&&iD?.data?.status==='Approved';
      setIsEnrolled(hasE||hasA||hasI);
    });
  },[]);

  // ── Page exit detection during interview ──────────────────────────
  useEffect(()=>{
    const handleVisibility = () => {
      if (document.hidden && stage==='interview') {
        exitInterview('Tab switch detected — interview ended.');
      }
    };
    const handleBeforeUnload = (e:BeforeUnloadEvent) => {
      if (stage==='interview') { e.preventDefault(); e.returnValue='Interview in progress. Are you sure?'; }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return ()=>{ document.removeEventListener('visibilitychange',handleVisibility); window.removeEventListener('beforeunload',handleBeforeUnload); };
  },[stage]);

  // ── Resume upload ─────────────────────────────────────────────────
  const handleResumeUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeName(file.name);
    const text = await file.text().catch(()=>'');
    setResumeText(text.slice(0,2000));
  };

  // ── Camera ────────────────────────────────────────────────────────
  const startCamera = async ()=>{
    try {
      const s = await navigator.mediaDevices.getUserMedia({video:true});
      streamRef.current=s;
      if(videoRef.current) videoRef.current.srcObject=s;
      setCamOn(true);
    } catch {}
  };
  const stopCamera = ()=>{
    streamRef.current?.getTracks().forEach(t=>t.stop());
    if(videoRef.current) videoRef.current.srcObject=null;
    setCamOn(false);
  };

  // ── Face detection ────────────────────────────────────────────────
  const detectFaces = useCallback(()=>{
    if(!videoRef.current||!canvasRef.current) return;
    const video=videoRef.current, canvas=canvasRef.current;
    const ctx=canvas.getContext('2d');
    if(!ctx||video.videoWidth===0) return;
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    if(prevFrameRef.current){
      const d=frame.data, p=prevFrameRef.current.data;
      let diff=0;
      for(let i=0;i<d.length;i+=40){ const dr=d[i]-p[i],dg=d[i+1]-p[i+1],db=d[i+2]-p[i+2]; diff+=Math.sqrt(dr*dr+dg*dg+db*db); }
      const motion=diff/(d.length/40);
      if(motion<5){ setFaceWarning(true); setLookAwayCount(c=>c+1); }
      else { setFaceWarning(false); }
    }
    prevFrameRef.current=frame;
  },[]);

  useEffect(()=>{
    if(camOn&&stage==='interview'){ faceTimerRef.current=setInterval(detectFaces,2000); }
    else { if(faceTimerRef.current) clearInterval(faceTimerRef.current); setFaceWarning(false); }
    return ()=>{ if(faceTimerRef.current) clearInterval(faceTimerRef.current); };
  },[stage,camOn,detectFaces]);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!timerActive) return;
    if(timer<=0){ handleSubmit(); return; }
    timerRef.current=setTimeout(()=>setTimer(t=>t-1),1000);
    return ()=>{ if(timerRef.current) clearTimeout(timerRef.current); };
  },[timerActive,timer]);

  // ── TTS ───────────────────────────────────────────────────────────
  const speak = useCallback((text:string):Promise<void>=>{
    return new Promise(resolve=>{
      if(muted||!text){ resolve(); return; }
      window.speechSynthesis.cancel();
      const utt=new SpeechSynthesisUtterance(text);
      utt.rate=0.95; utt.pitch=1.1; utt.volume=1;
      const voices=window.speechSynthesis.getVoices();
      const en=voices.find(v=>v.lang.startsWith('en')&&v.name.includes('Female'))||voices.find(v=>v.lang.startsWith('en'));
      if(en) utt.voice=en;
      utt.onstart=()=>setAiSpeaking(true);
      utt.onend=()=>{ setAiSpeaking(false); resolve(); };
      utt.onerror=()=>{ setAiSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utt);
    });
  },[muted]);

  // ── STT ───────────────────────────────────────────────────────────
  const startMic = useCallback(async ()=>{
    if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){ setMicError('Speech recognition not supported. Use Chrome.'); return; }
    setMicError('');
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    const r=new SR();
    recognRef.current=r;
    r.continuous=true; r.interimResults=true; r.lang='en-US';
    r.onresult=(e:any)=>{
      if(!micActiveRef.current) return;
      let final='',interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal) final+=e.results[i][0].transcript;
        else interim+=e.results[i][0].transcript;
      }
      if(final){ finalTextRef.current+=final+' '; setAnswer(finalTextRef.current+interim); }
      else setAnswer(finalTextRef.current+interim);
    };
    r.onerror=(e:any)=>{ if(e.error!=='no-speech') setMicError(`Mic error: ${e.error}`); };
    r.onend=()=>{ if(micActiveRef.current) r.start(); };
    try { r.start(); setMicOn(true); } catch { setMicError('Could not start microphone.'); }
  },[]);

  const stopMic = useCallback(()=>{
    micActiveRef.current=false;
    recognRef.current?.stop();
    setMicOn(false);
  },[]);

  const toggleMic = useCallback(()=>{
    if(micOn){ stopMic(); } else { micActiveRef.current=true; startMic(); }
  },[micOn,stopMic,startMic]);

  const resetAnswer = ()=>{ setAnswer(''); finalTextRef.current=''; };

  // ── AI call ───────────────────────────────────────────────────────
  const callAI = async (msgs:Message[]) => {
    const roundLabel = ROUNDS.find(r=>r.id===round)?.label||'HR';
    const systemPrompt = `You are Alex, a professional ${roundLabel} interviewer at Hiresnix for a ${domain} role. 
Experience level: ${experience}. Difficulty: ${difficulty}.
${resumeText?`Candidate resume summary: ${resumeText.slice(0,500)}`:''}
Ask one question at a time. After the candidate answers, give brief feedback and ask the next question.
Ask follow-up questions based on their previous answers when relevant.
Total: 20 questions. Mix of ${roundLabel} questions appropriate for ${experience} level.
Respond in JSON: {"nextQuestion":"...", "feedback":"...", "score":0-10, "isComplete":false, "scoreBreakdown":{"communication":0-10,"technical":0-10,"confidence":0-10,"grammar":0-10,"problemSolving":0-10}}
Start directly with the first question. Keep questions concise.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body:JSON.stringify({
        model:'llama-3.3-70b-versatile',
        messages:[{role:'system',content:systemPrompt},...msgs],
        temperature:0.7, max_tokens:600,
      }),
    });
    const d=await res.json();
    const raw=d.choices[0].message.content;
    const clean=raw.replace(/```json|```/g,'').trim();
    try { return JSON.parse(clean); }
    catch { return {nextQuestion:raw,feedback:'',score:7,isComplete:false,scoreBreakdown:{communication:7,technical:7,confidence:7,grammar:7,problemSolving:7}}; }
  };

  // ── Start countdown ───────────────────────────────────────────────
  const startCountdown = ()=>{
    setStage('countdown'); setCountdown(3);
    const t=setInterval(()=>{
      setCountdown(c=>{
        if(c<=1){ clearInterval(t); beginInterview(); return 3; }
        return c-1;
      });
    },1000);
  };

  // ── Begin interview ───────────────────────────────────────────────
  const beginInterview = async ()=>{
    setStage('interview'); setAiThinking(true);
    const roundLabel = ROUNDS.find(r=>r.id===round)?.label||'HR';
    await speak(`Hello! I'm Alex, your Hiresnix ${roundLabel} interviewer. We'll have a ${difficulty} level interview for the ${domain} role. ${experience==='Fresher'?'As a fresher, I\'ll focus on fundamentals.':'I\'ll focus on your experience and practical knowledge.'} Let's begin!`);
    const init:Message={role:'user',content:`Start ${roundLabel} interview for ${domain}. Experience: ${experience}. Difficulty: ${difficulty}.${resumeText?` Resume: ${resumeText.slice(0,300)}`:''}. Ask first question.`};
    try {
      const res=await callAI([init]);
      setAiThinking(false);
      const msgs:Message[]=[init,{role:'assistant',content:res.nextQuestion}];
      setMessages(msgs); setCurrentQ(res.nextQuestion); setQNumber(1);
      await speak(res.nextQuestion);
      micActiveRef.current=true; setMicOn(true); await startMic();
      setTimer(90); setTimerActive(true);
    } catch { setAiThinking(false); alert('AI connection failed.'); }
  };

  // ── Exit interview ────────────────────────────────────────────────
  const exitInterview = (reason?:string)=>{
    stopMic(); stopCamera(); window.speechSynthesis.cancel();
    if(timerRef.current) clearTimeout(timerRef.current);
    setTimerActive(false);
    if(reason) alert(reason);
    setStage('setup'); setResults([]); setMessages([]); setQNumber(0); resetAnswer();
  };

  // ── Skip question ─────────────────────────────────────────────────
  const handleSkip = useCallback(async ()=>{
    stopMic(); setMicOn(false); setTimerActive(false);
    window.speechSynthesis.cancel();
    setResults(prev=>[...prev,{question:currentQ,answer:'(Skipped)',score:0,feedback:'Question was skipped.',round}]);
    if(qNumber>=20){ setStage('result'); return; }
    setAiThinking(true);
    const skipMsg:Message={role:'user',content:'Skip this question, move to next.'};
    const newMsgs=[...messages,skipMsg];
    setMessages(newMsgs); resetAnswer();
    try {
      const res=await callAI(newMsgs);
      setAiThinking(false);
      setMessages([...newMsgs,{role:'assistant',content:res.nextQuestion}]);
      setCurrentQ(res.nextQuestion); setQNumber(n=>n+1);
      await speak(res.nextQuestion);
      micActiveRef.current=true; setMicOn(true); await startMic();
      setTimer(90); setTimerActive(true);
    } catch { setAiThinking(false); }
  },[currentQ,messages,qNumber,round,stopMic,startMic,speak]);

  // ── Submit answer ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async ()=>{
    const ans=(finalTextRef.current+answer).trim()||answer.trim();
    micActiveRef.current=false; stopMic(); setMicOn(false);
    setTimerActive(false); window.speechSynthesis.cancel(); setAiThinking(true);
    const userMsg:Message={role:'user',content:ans||'I need to pass on this one.'};
    const newMsgs=[...messages,userMsg];
    setMessages(newMsgs); resetAnswer(); setLookAwayCount(0);
    try {
      const res=await callAI(newMsgs);
      setResults(prev=>[...prev,{question:currentQ,answer:ans||'(No answer)',score:res.score,feedback:res.feedback,round}]);
      if(res.scoreBreakdown){
        setScores(prev=>({
          communication: Math.round((prev.communication*(qNumber-1)+res.scoreBreakdown.communication)/qNumber),
          technical:     Math.round((prev.technical*(qNumber-1)+res.scoreBreakdown.technical)/qNumber),
          confidence:    Math.round((prev.confidence*(qNumber-1)+res.scoreBreakdown.confidence)/qNumber),
          grammar:       Math.round((prev.grammar*(qNumber-1)+res.scoreBreakdown.grammar)/qNumber),
          problemSolving:Math.round((prev.problemSolving*(qNumber-1)+res.scoreBreakdown.problemSolving)/qNumber),
        }));
      }
      if(res.isComplete||qNumber>=20){
        setAiThinking(false);
        await speak('That concludes our interview! Great effort. Let me calculate your results.');
        stopCamera(); setStage('result'); return;
      }
      const aiMsg:Message={role:'assistant',content:res.nextQuestion};
      setMessages([...newMsgs,aiMsg]); setAiThinking(false);
      setFeedback({score:res.score,text:res.feedback});
      if(res.feedback){
        const spoken=res.feedback.replace(/✅ Full Answer:/g,'Here is the complete answer.').replace(/💡 Tip:/g,'Tip:').replace(/[🎯🌟👍📚💪⚠️✅💡]/g,'');
        await speak(spoken.slice(0,250));
      }
      setFeedback(null); setCurrentQ(res.nextQuestion); setQNumber(n=>n+1);
      await speak(res.nextQuestion);
      micActiveRef.current=true; setMicOn(true); await startMic();
      setTimer(90); setTimerActive(true);
    } catch { setAiThinking(false); alert('AI error.'); }
  },[answer,messages,currentQ,qNumber,round,stopMic,startMic,speak]);

  useEffect(()=>()=>{ stopCamera(); stopMic(); window.speechSynthesis.cancel(); },[]);

  const avgScore = results.length?Math.round(results.reduce((s,r)=>s+r.score,0)/results.length):0;
  const timerColor = timer<=20?'text-red-400':timer<=40?'text-amber-400':'text-emerald-400';
  const roundInfo = ROUNDS.find(r=>r.id===round);

  // ── LOCKED ────────────────────────────────────────────────────────
  if(isEnrolled===null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if(isEnrolled===false) return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-6">
          <Lock size={36} className="text-gray-500"/>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Mock Interview Locked</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">AI Mock Interview is available only for active learners.<br/>Enroll in an internship program to unlock this feature.</p>
        <a href="/student/internships" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white" style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)'}}>
          Browse Internships →
        </a>
      </div>
    </div>
  );

  // ── SETUP ─────────────────────────────────────────────────────────
  if(stage==='setup') return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">🎙️ AI Mock Interview</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your interview session and start practicing</p>
      </div>

      {/* AI Preview */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 flex items-center gap-6">
        <AIAvatar speaking={false} thinking={false}/>
        <div>
          <h3 className="text-white font-bold text-lg">Meet Alex</h3>
          <p className="text-gray-400 text-sm">Your AI interviewer — voice + adaptive questions</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['Voice Interview','Follow-up Questions','Real-time Feedback','Auto Exit on Tab Switch'].map(f=>(
              <span key={f} className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-1 rounded-full border border-indigo-700/40">{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resume Upload */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><FileText size={15} className="text-indigo-400"/> Resume (Optional)</h3>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleResumeUpload}/>
          <button onClick={()=>fileRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition ${resumeName?'border-indigo-500 bg-indigo-950/30':'border-gray-700 hover:border-indigo-600'}`}>
            <Upload size={22} className={resumeName?'text-indigo-400':'text-gray-500'}/>
            <span className={`text-sm ${resumeName?'text-indigo-300':'text-gray-500'}`}>{resumeName||'Upload Resume PDF'}</span>
            {resumeName&&<span className="text-xs text-green-400">✓ Resume loaded — AI will personalize questions</span>}
          </button>
        </div>

        {/* Job Role */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold text-sm mb-3">💼 Job Role / Domain</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {DOMAINS.map(d=>(
              <button key={d} onClick={()=>setDomain(d)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition text-left ${domain===d?'bg-indigo-600 text-white border-indigo-600':'bg-gray-800 text-gray-400 border-gray-700 hover:border-indigo-500'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Experience + Difficulty */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold text-sm mb-3">👤 Experience Level</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['Fresher','Experienced'] as const).map(e=>(
              <button key={e} onClick={()=>setExperience(e)}
                className={`py-3 rounded-xl text-sm font-bold border transition ${experience===e?'bg-violet-600 text-white border-violet-600':'bg-gray-800 text-gray-400 border-gray-700 hover:border-violet-500'}`}>
                {e==='Fresher'?'🎓 Fresher':'💼 Experienced'}
              </button>
            ))}
          </div>
          <h3 className="text-white font-semibold text-sm mt-4 mb-3">⚡ Difficulty</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['Easy','Medium','Hard'] as const).map(d=>(
              <button key={d} onClick={()=>setDifficulty(d)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition ${difficulty===d?d==='Easy'?'bg-green-600 text-white border-green-600':d==='Medium'?'bg-amber-600 text-white border-amber-600':'bg-red-600 text-white border-red-600':'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {d==='Easy'?'😊 Easy':d==='Medium'?'🤔 Medium':'🔥 Hard'}
              </button>
            ))}
          </div>
        </div>

        {/* Round Selection */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold text-sm mb-3">🎯 Interview Round</h3>
          <div className="space-y-2">
            {ROUNDS.map(r=>(
              <button key={r.id} onClick={()=>setRound(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${round===r.id?'bg-indigo-900/60 border-indigo-500':'bg-gray-800 border-gray-700 hover:border-indigo-600'}`}>
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${round===r.id?'text-white':'text-gray-300'}`}>{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
                {round===r.id&&<ChevronRight size={16} className="text-indigo-400 ml-auto"/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-4">
        <p className="text-indigo-300 text-xs font-bold mb-2">📋 Before You Start</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-indigo-200/70">
          {['Use Chrome for best voice recognition','Stay in this tab — switching tabs will exit the interview','Enable microphone when prompted','Camera is optional but recommended','90 seconds per question — speak clearly'].map((t,i)=>(
            <p key={i}>• {t}</p>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="flex gap-3">
        <button onClick={()=>setMuted(m=>!m)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition ${!muted?'bg-emerald-900/30 border-emerald-600 text-emerald-400':'bg-gray-800 border-gray-700 text-gray-400'}`}>
          {!muted?<Volume2 size={16}/>:<VolumeX size={16}/>} {!muted?'Voice ON':'Voice OFF'}
        </button>
        <button onClick={startCountdown}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition text-base">
          <Play size={18}/> Start {roundInfo?.label||'Interview'}
        </button>
      </div>
    </div>
  );

  // ── COUNTDOWN ─────────────────────────────────────────────────────
  if(stage==='countdown') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-8 text-center w-80">
        <AIAvatar speaking={false} thinking={false}/>
        <p className="text-white text-lg font-semibold mt-6">Interview starting in...</p>
        <p className="text-7xl font-black text-indigo-400 mt-2">{countdown}</p>
        <p className="text-gray-400 text-sm mt-3">⚠️ Do NOT switch tabs during interview!</p>
        <div className="mt-4 bg-indigo-900/40 rounded-xl px-4 py-2 text-xs text-indigo-300">
          {roundInfo?.icon} {roundInfo?.label} • {difficulty} • {domain}
        </div>
      </div>
    </div>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────
  if(stage==='interview') return (
    <div className="max-w-5xl mx-auto">
      {faceWarning&&(
        <div className="mb-4 flex items-center gap-3 bg-red-900/30 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl animate-pulse">
          <AlertTriangle size={18} className="shrink-0"/>
          <p className="text-sm font-semibold">⚠️ Face not detected properly — please look at the camera!</p>
        </div>
      )}
      {micError&&(
        <div className="mb-4 bg-amber-900/30 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl">
          <p className="text-sm">{micError}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
          <span className="text-sm font-bold text-white">LIVE • {roundInfo?.label}</span>
          <span className="text-xs text-gray-500">{domain} • Q{qNumber}/20 • {difficulty}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setMuted(m=>!m)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
            {muted?<VolumeX size={15} className="text-gray-400"/>:<Volume2 size={15} className="text-indigo-400"/>}
          </button>
          <div className={`px-3 py-1.5 rounded-lg font-mono font-bold text-lg ${timer<=20?'bg-red-900/30 text-red-400':timer<=40?'bg-amber-900/30 text-amber-400':'bg-emerald-900/30 text-emerald-400'}`}>
            {timer}s
          </div>
          <button onClick={handleSkip} disabled={aiSpeaking||aiThinking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 transition disabled:opacity-40">
            <SkipForward size={13}/> Skip
          </button>
          <button onClick={()=>{ if(window.confirm('Exit interview? Progress will be lost.')) exitInterview(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs font-medium hover:bg-red-900/50 transition">
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-5">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{width:`${((qNumber-1)/20)*100}%`}}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Side */}
        <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[400px]">
          <div className="flex-1 flex flex-col items-center justify-center space-y-5 w-full">
            <AIAvatar speaking={aiSpeaking} thinking={aiThinking}/>
            {currentQ&&!feedback&&(
              <div className="w-full bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-indigo-300 text-xs font-semibold mb-1">QUESTION {qNumber}</p>
                <p className="text-white text-sm leading-relaxed">{currentQ}</p>
              </div>
            )}
            {feedback&&(
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
            {!camOn&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><VideoOff size={32} className="text-gray-600"/><p className="text-gray-500 text-xs">Camera off</p></div>}
            {faceWarning&&camOn&&<div className="absolute inset-0 border-4 border-red-500 rounded-2xl pointer-events-none animate-pulse"><div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-xs font-bold px-3 py-2 flex items-center gap-2"><AlertTriangle size={13}/> Look at camera! ({lookAwayCount} warnings)</div></div>}
            {camOn&&!faceWarning&&<div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-white rounded-full"/> 👁️ Good</div>}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
              <p className="text-white text-xs font-semibold">You {lookAwayCount>0&&<span className="text-red-300 text-[10px]">· {lookAwayCount} warning</span>}</p>
            </div>
            {micOn&&<div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/> REC</div>}
          </div>

          <div className="flex gap-2">
            <button onClick={camOn?stopCamera:startCamera}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${camOn?'bg-gray-700 text-gray-200':'bg-gray-800 text-gray-400'}`}>
              {camOn?<><VideoOff size={13}/>Off</>:<><Video size={13}/>Camera</>}
            </button>
            <button onClick={toggleMic}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${micOn?'bg-red-900/40 text-red-300':'bg-emerald-900/30 text-emerald-400'}`}>
              {micOn?<><MicOff size={13}/>Mute</>:<><Mic size={13}/>Unmute</>}
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${micOn?'bg-green-900/20 text-green-400 border border-green-800/40':'bg-gray-800 text-gray-500 border border-gray-700'}`}>
            {micOn?<><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 🎤 Listening — speak your answer</>:<><div className="w-2 h-2 bg-gray-600 rounded-full"/> Mic off — click Unmute or type below</>}
          </div>

          <div className="relative bg-gray-900 border-2 border-gray-700 rounded-xl p-3 focus-within:border-indigo-500 transition-colors">
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-2">
              {micOn&&<SoundWave active={!!answer} color="#22c55e"/>}
              {micOn?'🎤 Voice + typing both work':'⌨️ Type your answer'}
            </p>
            <textarea value={answer} onChange={e=>{ finalTextRef.current=''; setAnswer(e.target.value); }}
              placeholder="Speak or type your answer here..."
              rows={3} className="w-full text-sm text-gray-200 resize-none outline-none bg-transparent placeholder-gray-600"/>
            {answer&&<span className="absolute bottom-2 right-3 text-xs text-gray-600">{answer.length} chars</span>}
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
  const overallScore = Math.round(avgScore*10);
  const weakTopics = results.filter(r=>r.score<5).map(r=>r.question.split(' ').slice(0,5).join(' ')+'...');

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Score card */}
      <div className={`rounded-2xl p-7 text-center text-white ${overallScore>=70?'bg-gradient-to-br from-emerald-600 to-teal-700':overallScore>=50?'bg-gradient-to-br from-amber-500 to-orange-600':'bg-gradient-to-br from-red-500 to-rose-700'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90"/>
        <h2 className="text-2xl font-black">Interview Complete!</h2>
        <p className="text-6xl font-black my-3">{overallScore}<span className="text-2xl">/100</span></p>
        <p className="text-lg font-semibold">{overallScore>=80?'🌟 Excellent!':overallScore>=60?'👍 Good Job!':overallScore>=40?'📚 Keep Practicing!':'💪 Keep Going!'}</p>
        <p className="text-sm opacity-75 mt-1">{roundInfo?.label} • {domain} • {difficulty} • {results.length}/20 Questions</p>
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-indigo-400"/> Score Breakdown</h3>
        <div className="space-y-3">
          {[
            ['Communication',  scores.communication,  '🗣️'],
            ['Technical',      scores.technical,      '💻'],
            ['Confidence',     scores.confidence,     '💪'],
            ['Grammar',        scores.grammar,        '📝'],
            ['Problem Solving',scores.problemSolving, '🧠'],
          ].map(([label,score,icon])=>(
            <div key={label as string}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{icon as string} {label as string}</span>
                <span className="text-white font-bold">{score as number}/10</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${(score as number)>=7?'bg-green-500':(score as number)>=5?'bg-amber-500':'bg-red-500'}`} style={{width:`${(score as number)*10}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {weakTopics.length>0&&(
        <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-5">
          <h3 className="text-red-300 font-bold mb-3">⚠️ Weak Areas to Improve</h3>
          <ul className="space-y-1.5">
            {weakTopics.slice(0,5).map((t,i)=>(
              <li key={i} className="text-sm text-red-200/70 flex items-start gap-2"><span className="mt-0.5 text-red-400">•</span>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Results */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <BarChart2 size={16} className="text-indigo-400"/>
          <h3 className="font-bold text-white">Detailed Results</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {results.map((r,i)=>(
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-200 flex-1">Q{i+1}: {r.question}</p>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full shrink-0 ${r.score>=7?'bg-green-900/40 text-green-400':r.score>=5?'bg-amber-900/40 text-amber-400':'bg-red-900/40 text-red-400'}`}>{r.score}/10</span>
              </div>
              {r.answer!=='(No answer)'&&r.answer!=='(Skipped)'&&<p className="text-xs text-gray-500 mb-1.5 line-clamp-2">Your answer: {r.answer}</p>}
              {r.answer==='(Skipped)'&&<p className="text-xs text-gray-600 mb-1.5 italic">Skipped</p>}
              <p className="text-xs text-gray-400 bg-gray-800/60 rounded-lg px-3 py-2">{r.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={()=>{ setStage('setup');setResults([]);setMessages([]);setQNumber(0);resetAnswer();setFeedback(null);setScores({communication:0,technical:0,confidence:0,grammar:0,problemSolving:0});window.speechSynthesis.cancel(); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition">
          <RotateCcw size={16}/> Try Again
        </button>
        <button onClick={()=>{
          const content = `HIRESNIX AI MOCK INTERVIEW REPORT\n\nDate: ${new Date().toLocaleDateString()}\nDomain: ${domain}\nRound: ${roundInfo?.label}\nDifficulty: ${difficulty}\nOverall Score: ${overallScore}/100\n\nSCORE BREAKDOWN:\nCommunication: ${scores.communication}/10\nTechnical: ${scores.technical}/10\nConfidence: ${scores.confidence}/10\nGrammar: ${scores.grammar}/10\nProblem Solving: ${scores.problemSolving}/10\n\nDETAILED RESULTS:\n${results.map((r,i)=>`\nQ${i+1}: ${r.question}\nAnswer: ${r.answer}\nScore: ${r.score}/10\nFeedback: ${r.feedback}`).join('\n')}\n\nWEAK AREAS:\n${weakTopics.join('\n')}`;
          const blob=new Blob([content],{type:'text/plain'});
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');
          a.href=url; a.download=`Interview_Report_${domain}_${new Date().toLocaleDateString().replace(/\//g,'-')}.txt`;
          a.click(); URL.revokeObjectURL(url);
        }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 text-gray-200 font-semibold hover:bg-gray-700 transition border border-gray-700">
          <Download size={15}/> Download Report
        </button>
      </div>
    </div>
  );
}