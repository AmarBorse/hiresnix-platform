// src/pages/student/StudentMockInterview.tsx
// Video Mock Interview — No API needed
// Camera + Speech-to-Text + Pre-written Q&A + Rule-based scoring

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, RotateCcw,
  ChevronRight, CheckCircle, XCircle, Clock,
  Award, BarChart2, AlertCircle, Play
} from 'lucide-react';

// ── Question Bank ─────────────────────────────────────────────────
const QUESTION_BANK: Record<string, { q: string; keywords: string[]; hint: string }[]> = {
  'Full Stack': [
    { q: "Tell me about yourself and your Full Stack experience.", keywords: ['frontend','backend','database','project','experience','years','worked','built'], hint: "Mention frontend, backend, and database experience" },
    { q: "What is the difference between REST API and GraphQL?", keywords: ['rest','graphql','endpoint','query','flexible','overfetch','schema','mutation'], hint: "REST uses multiple endpoints, GraphQL uses single endpoint with flexible queries" },
    { q: "Explain the MVC architecture.", keywords: ['model','view','controller','separation','concerns','data','logic','presentation'], hint: "Model=data, View=UI, Controller=logic" },
    { q: "How do you handle authentication in a web app?", keywords: ['jwt','token','session','oauth','bcrypt','hash','cookie','secure'], hint: "Mention JWT, sessions, or OAuth" },
    { q: "What is CORS and how do you fix it?", keywords: ['cross','origin','resource','sharing','header','allow','server','browser'], hint: "Cross-Origin Resource Sharing — add proper headers on server" },
  ],
  'Frontend': [
    { q: "Explain the difference between var, let and const in JavaScript.", keywords: ['scope','block','function','hoisting','reassign','const','let','var'], hint: "Scope differences and reassignment rules" },
    { q: "What is React Virtual DOM and how does it work?", keywords: ['virtual','dom','reconciliation','diff','update','render','performance','real'], hint: "Virtual DOM compares changes and updates only what changed" },
    { q: "How does CSS Flexbox work?", keywords: ['flex','container','item','justify','align','direction','wrap','grow'], hint: "Parent is flex container, children are flex items" },
    { q: "What are React hooks and why were they introduced?", keywords: ['useState','useEffect','functional','class','state','lifecycle','hook','reuse'], hint: "Hooks allow state in functional components" },
    { q: "Explain event bubbling and event delegation.", keywords: ['bubble','propagate','parent','child','delegate','listener','stop','capture'], hint: "Events bubble up from child to parent" },
  ],
  'Backend': [
    { q: "What is the difference between SQL and NoSQL databases?", keywords: ['relational','schema','table','document','flexible','scale','acid','nosql'], hint: "SQL is structured, NoSQL is flexible schema" },
    { q: "Explain middleware in Express.js.", keywords: ['middleware','next','request','response','function','chain','route','express'], hint: "Functions that have access to req, res, next" },
    { q: "What is database indexing and why is it important?", keywords: ['index','performance','query','fast','search','column','slow','optimize'], hint: "Indexing speeds up database queries" },
    { q: "How do you secure a Node.js API?", keywords: ['helmet','cors','rate','limit','validate','sanitize','token','auth'], hint: "Use helmet, rate limiting, input validation" },
    { q: "Explain the difference between authentication and authorization.", keywords: ['authentication','authorization','who','what','permission','role','verify','access'], hint: "Auth = who you are, Authz = what you can do" },
  ],
  'Data Science': [
    { q: "What is the difference between supervised and unsupervised learning?", keywords: ['supervised','label','unsupervised','cluster','classification','regression','data','pattern'], hint: "Supervised has labeled data, unsupervised finds patterns" },
    { q: "Explain overfitting and how to prevent it.", keywords: ['overfit','generalize','train','test','regularization','dropout','cross','validation'], hint: "Model performs well on training but not test data" },
    { q: "What is the bias-variance tradeoff?", keywords: ['bias','variance','tradeoff','error','underfitting','overfitting','complexity','balance'], hint: "Balance between model complexity and generalization" },
    { q: "Explain the concept of feature engineering.", keywords: ['feature','transform','create','select','normalize','encode','important','input'], hint: "Creating/transforming input variables for better model performance" },
    { q: "What is cross-validation and why is it used?", keywords: ['cross','validation','fold','split','evaluate','generalize','test','performance'], hint: "Technique to evaluate model on multiple data splits" },
  ],
  'DevOps': [
    { q: "What is CI/CD and how does it work?", keywords: ['continuous','integration','deployment','pipeline','automate','test','build','deploy'], hint: "Automated testing and deployment pipeline" },
    { q: "Explain Docker containers vs Virtual Machines.", keywords: ['container','vm','lightweight','image','kernel','os','isolate','resource'], hint: "Containers share OS kernel, VMs have their own OS" },
    { q: "What is Kubernetes and what problem does it solve?", keywords: ['kubernetes','orchestration','container','scale','manage','cluster','pod','deploy'], hint: "Container orchestration for scaling and management" },
    { q: "Explain the difference between Git merge and rebase.", keywords: ['merge','rebase','commit','history','branch','linear','conflict','integrate'], hint: "Merge preserves history, rebase creates linear history" },
    { q: "What are microservices and their advantages?", keywords: ['microservice','independent','deploy','scale','small','service','decouple','api'], hint: "Small independent services vs monolith" },
  ],
  'UI/UX': [
    { q: "What is the difference between UI and UX design?", keywords: ['interface','experience','visual','user','feel','look','journey','interaction'], hint: "UI is look, UX is feel and experience" },
    { q: "Explain the principles of good UX design.", keywords: ['usable','accessible','consistent','feedback','simple','clear','intuitive','user'], hint: "Usability, accessibility, consistency, feedback" },
    { q: "What is a wireframe and when do you use it?", keywords: ['wireframe','prototype','layout','structure','early','design','sketch','low'], hint: "Low-fidelity layout showing structure before visual design" },
    { q: "How do you conduct user research?", keywords: ['research','user','survey','interview','observe','test','feedback','persona'], hint: "Surveys, interviews, usability testing, observations" },
    { q: "What is responsive design?", keywords: ['responsive','mobile','screen','breakpoint','fluid','adapt','viewport','flex'], hint: "Design that adapts to different screen sizes" },
  ],
};

const DOMAINS = Object.keys(QUESTION_BANK);

// ── Scoring ────────────────────────────────────────────────────────
function scoreAnswer(answer: string, keywords: string[]): number {
  const lower = answer.toLowerCase();
  const matched = keywords.filter(k => lower.includes(k.toLowerCase())).length;
  const ratio = matched / keywords.length;
  if (ratio >= 0.6) return 9 + Math.round(Math.random());
  if (ratio >= 0.4) return 7 + Math.round(Math.random());
  if (ratio >= 0.2) return 5 + Math.round(Math.random());
  if (ratio > 0)    return 3 + Math.round(Math.random());
  return answer.length > 30 ? 2 : 1;
}

function getFeedback(score: number, keywords: string[], hint: string): string {
  if (score >= 9) return `Excellent answer! 🌟 You covered all key concepts perfectly.`;
  if (score >= 7) return `Good answer! 👍 You mentioned most key points. Hint: ${hint}`;
  if (score >= 5) return `Fair answer. Try to mention: ${hint}`;
  if (score >= 3) return `Needs improvement. Key concept: ${hint}`;
  return `Try again! Key answer: ${hint}`;
}

// ── Types ─────────────────────────────────────────────────────────
interface Answer { question: string; answer: string; score: number; feedback: string; }

type Stage = 'setup' | 'interview' | 'result';

// ── Main Component ─────────────────────────────────────────────────
export function StudentMockInterview() {
  const [stage, setStage]           = useState<Stage>('setup');
  const [domain, setDomain]         = useState('Full Stack');
  const [questions, setQuestions]   = useState<typeof QUESTION_BANK['Full Stack']>([]);
  const [qIndex, setQIndex]         = useState(0);
  const [answers, setAnswers]       = useState<Answer[]>([]);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening]   = useState(false);
  const [timer, setTimer]           = useState(60);
  const [camOn, setCamOn]           = useState(false);
  const [micOn, setMicOn]           = useState(false);
  const [feedback, setFeedback]     = useState<{ score: number; text: string } | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recognRef   = useRef<any>(null);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);

  // ── Camera ───────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true); setMicOn(true);
    } catch { alert('Camera/Mic permission required for video interview!'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false); setMicOn(false);
  };

  // ── Speech Recognition ───────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported. Use Chrome browser.'); return; }
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-IN';
    recog.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
    };
    recog.start();
    recognRef.current = recog;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognRef.current?.stop();
    setListening(false);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      handleSubmitAnswer();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timer, timerActive]);

  // ── Start Interview ──────────────────────────────────────────────
  const startInterview = async () => {
    await startCamera();
    const qs = [...QUESTION_BANK[domain]].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(qs);
    setQIndex(0);
    setAnswers([]);
    setTranscript('');
    setFeedback(null);
    setTimer(60);
    setTimerActive(true);
    setStage('interview');
    setTimeout(() => startListening(), 500);
  };

  // ── Submit Answer ────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(() => {
    stopListening();
    setTimerActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = questions[qIndex];
    if (!q) return;
    const ans = transcript.trim() || '(No answer given)';
    const score = scoreAnswer(ans, q.keywords);
    const fb = getFeedback(score, q.keywords, q.hint);

    setFeedback({ score, text: fb });
    setAnswers(prev => [...prev, { question: q.q, answer: ans, score, feedback: fb }]);
  }, [transcript, questions, qIndex, stopListening]);

  // ── Next Question ────────────────────────────────────────────────
  const nextQuestion = () => {
    if (qIndex + 1 >= questions.length) {
      stopCamera();
      stopListening();
      setStage('result');
      return;
    }
    setQIndex(i => i + 1);
    setTranscript('');
    setFeedback(null);
    setTimer(60);
    setTimerActive(true);
    setTimeout(() => startListening(), 300);
  };

  // ── Cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopCamera(); stopListening(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const avgScore = answers.length ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length) : 0;

  // ── SETUP SCREEN ─────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎥 Video Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Practice with camera + voice recognition + instant feedback</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DOMAINS.map(d => (
              <button key={d} onClick={() => setDomain(d)}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                  domain === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-indigo-800">How it works:</p>
          <div className="space-y-1 text-indigo-700">
            {['Camera & microphone will turn on', '5 questions — 60 seconds each', 'Speak your answer clearly', 'Get instant score & feedback', 'Final performance report'].map((t, i) => (
              <p key={i}>✓ {t}</p>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">Use <strong>Chrome browser</strong> for best speech recognition. Allow camera & mic when prompted.</p>
        </div>

        <button onClick={startInterview}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
          <Play size={18} /> Start Video Interview
        </button>
      </div>
    </div>
  );

  // ── INTERVIEW SCREEN ──────────────────────────────────────────────
  if (stage === 'interview') {
    const q = questions[qIndex];
    const timerColor = timer <= 15 ? 'text-red-500' : timer <= 30 ? 'text-amber-500' : 'text-emerald-600';
    const timerBg    = timer <= 15 ? 'bg-red-50' : timer <= 30 ? 'bg-amber-50' : 'bg-emerald-50';

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">🎥 {domain} Interview</h2>
            <p className="text-xs text-gray-500">Question {qIndex + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timerBg}`}>
            <Clock size={16} className={timerColor} />
            <span className={`font-mono font-bold text-xl ${timerColor}`}>{timer}s</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${((qIndex) / questions.length) * 100}%` }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Camera */}
          <div className="space-y-3">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!camOn && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VideoOff size={40} className="text-gray-500" />
                </div>
              )}
              {/* Live indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              {/* Mic status */}
              <div className={`absolute top-3 right-3 p-1.5 rounded-full ${listening ? 'bg-green-500' : 'bg-gray-600'}`}>
                {listening ? <Mic size={14} color="white" /> : <MicOff size={14} color="white" />}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button onClick={camOn ? stopCamera : startCamera}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition ${camOn ? 'bg-gray-100 text-gray-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {camOn ? <><VideoOff size={15} /> Camera Off</> : <><Video size={15} /> Camera On</>}
              </button>
              <button onClick={listening ? stopListening : startListening}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition ${listening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {listening ? <><Mic size={15} /> Listening...</> : <><MicOff size={15} /> Start Mic</>}
              </button>
            </div>
          </div>

          {/* Question & Answer */}
          <div className="space-y-3">
            {/* Question */}
            <div className="bg-indigo-600 text-white rounded-2xl p-5">
              <p className="text-xs font-semibold text-indigo-200 mb-2">QUESTION {qIndex + 1}</p>
              <p className="font-semibold text-lg leading-snug">{q?.q}</p>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[100px]">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                {listening && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />}
                {listening ? 'Listening... speak now' : 'Your answer:'}
              </p>
              <p className="text-gray-800 text-sm leading-relaxed">
                {transcript || <span className="text-gray-300 italic">Start speaking to record your answer...</span>}
              </p>
            </div>

            {/* Feedback */}
            {feedback ? (
              <div className={`rounded-xl p-4 border ${feedback.score >= 7 ? 'bg-green-50 border-green-200' : feedback.score >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {feedback.score >= 7 ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
                  <div>
                    <p className="font-bold text-gray-900">Score: {feedback.score}/10</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({length:10}).map((_,i) => (
                        <div key={i} className={`h-1.5 w-4 rounded-full ${i < feedback.score ? (feedback.score>=7?'bg-green-500':feedback.score>=5?'bg-amber-500':'bg-red-500') : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{feedback.text}</p>
                <button onClick={nextQuestion}
                  className="mt-3 w-full bg-indigo-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition text-sm">
                  {qIndex + 1 >= questions.length ? '📊 See Results' : <>Next Question <ChevronRight size={16} /></>}
                </button>
              </div>
            ) : (
              <button onClick={handleSubmitAnswer} disabled={!transcript.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                Submit Answer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score Card */}
      <div className={`rounded-2xl p-6 text-center text-white ${avgScore >= 7 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : avgScore >= 5 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <Award size={40} className="mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-black mb-1">Interview Complete!</h2>
        <p className="text-5xl font-black my-3">{avgScore}<span className="text-2xl">/10</span></p>
        <p className="text-lg font-semibold">
          {avgScore >= 8 ? '🌟 Excellent Performance!' : avgScore >= 6 ? '👍 Good Job!' : avgScore >= 4 ? '📚 Keep Practicing!' : '💪 Don\'t Give Up!'}
        </p>
        <p className="text-sm opacity-80 mt-1">{domain} Interview · {answers.length} Questions</p>
      </div>

      {/* Per Question Results */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500" />
          <h3 className="font-bold text-gray-900">Detailed Results</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {answers.map((a, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-800 flex-1">Q{i+1}: {a.question}</p>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-full flex-shrink-0 ${a.score>=7?'bg-green-100 text-green-700':a.score>=5?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>
                  {a.score}/10
                </span>
              </div>
              {a.answer !== '(No answer given)' && (
                <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">Your answer: {a.answer}</p>
              )}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{a.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => { setStage('setup'); setAnswers([]); setQIndex(0); setTranscript(''); setFeedback(null); setTimer(60); }}
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