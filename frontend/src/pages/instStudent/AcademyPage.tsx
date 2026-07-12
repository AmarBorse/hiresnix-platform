// src/pages/instStudent/AcademyPage.tsx
// Hiresnix AI Academy — Premium Learning Experience
// Free APIs: Groq (AI), Piston (code execution), Web Speech (voice)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, ChevronRight, ChevronDown, CheckCircle, ArrowLeft,
  Send, Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw,
  Code2, FileText, BookOpen, Zap, ArrowLeftRight, Terminal,
  Sparkles, Globe, Trophy, Flame, Star
} from 'lucide-react';

// ── APIs ──────────────────────────────────────────────────────────
const GROQ = (import.meta as any).env.VITE_GROQ_API_KEY || '';

async function askGroq(messages: {role:string,content:string}[], system: string, stream = false) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7, max_tokens: 1200, stream,
    }),
  });
  if (!stream) {
    const d = await r.json();
    return d?.choices?.[0]?.message?.content || 'Could not get response.';
  }
  return r;
}

async function runCode(language: string, code: string): Promise<{stdout:string,stderr:string}> {
  const langMap: Record<string,{language:string,version:string}> = {
    python: { language: 'python', version: '3.10.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    java: { language: 'java', version: '15.0.2' },
    c: { language: 'c', version: '10.2.0' },
    'c++': { language: 'c++', version: '10.2.0' },
  };
  const lang = langMap[language] || langMap.python;
  try {
    const r = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang.language, version: lang.version, files: [{ content: code }] }),
    });
    const d = await r.json();
    return { stdout: d.run?.stdout || '', stderr: d.run?.stderr || '' };
  } catch { return { stdout: '', stderr: 'Could not connect to code runner.' }; }
}

// ── Courses ───────────────────────────────────────────────────────
const COURSES = [
  {
    id: 'python', title: 'Python Programming', icon: '🐍',
    accent: '#6366f1', bg: 'from-indigo-500/20 to-purple-500/10',
    tag: 'Most Popular', tagColor: '#f59e0b',
    modules: [
      { title: 'Introduction to Python', lessons: ['What is Python?', 'Installing Python', 'Your First Program', 'Python Syntax Basics'] },
      { title: 'Variables & Data Types', lessons: ['Variables in Python', 'Numbers & Strings', 'Booleans', 'Type Conversion'] },
      { title: 'Operators', lessons: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators', 'Assignment Operators'] },
      { title: 'Control Flow', lessons: ['If Statement', 'If-Else Statement', 'Elif Chains', 'Nested Conditions'] },
      { title: 'Loops', lessons: ['While Loop', 'For Loop', 'Break & Continue', 'Loop Patterns'] },
      { title: 'Functions', lessons: ['Defining Functions', 'Parameters & Arguments', 'Return Values', 'Default Parameters'] },
      { title: 'Data Structures', lessons: ['Lists', 'Tuples', 'Dictionaries', 'Sets'] },
      { title: 'OOP Basics', lessons: ['Classes & Objects', 'Methods', 'Inheritance', '__init__ Method'] },
    ],
    codeLanguage: 'python',
  },
  {
    id: 'js', title: 'JavaScript', icon: '⚡',
    accent: '#f59e0b', bg: 'from-amber-500/20 to-orange-500/10',
    tag: 'Web Dev', tagColor: '#10b981',
    modules: [
      { title: 'JS Basics', lessons: ['What is JavaScript?', 'Variables (let/const)', 'Data Types', 'Template Literals'] },
      { title: 'Control Flow', lessons: ['if/else Statements', 'Switch Case', 'For Loops', 'While Loops'] },
      { title: 'Functions', lessons: ['Function Declaration', 'Arrow Functions', 'Callbacks', 'Closures'] },
      { title: 'Arrays & Objects', lessons: ['Array Methods', 'Object Basics', 'Destructuring', 'Spread Operator'] },
      { title: 'DOM & Events', lessons: ['Selecting Elements', 'Event Listeners', 'DOM Manipulation', 'Forms'] },
      { title: 'Async JS', lessons: ['Promises', 'async/await', 'fetch API', 'Error Handling'] },
    ],
    codeLanguage: 'javascript',
  },
  {
    id: 'dsa', title: 'Data Structures & Algorithms', icon: '🧠',
    accent: '#8b5cf6', bg: 'from-violet-500/20 to-pink-500/10',
    tag: 'Interview Prep', tagColor: '#ec4899',
    modules: [
      { title: 'Arrays', lessons: ['Array Basics', 'Two Pointers Technique', 'Sliding Window', 'Prefix Sum'] },
      { title: 'Strings', lessons: ['String Operations', 'Pattern Matching', 'Palindromes', 'Anagrams'] },
      { title: 'Linked Lists', lessons: ['Singly Linked List', 'Doubly Linked List', 'Reversal', 'Cycle Detection'] },
      { title: 'Stacks & Queues', lessons: ['Stack Basics', 'Queue Basics', 'Min Stack', 'Applications'] },
      { title: 'Trees', lessons: ['Binary Trees', 'BST', 'Tree Traversals', 'Height & Depth'] },
      { title: 'Sorting', lessons: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Binary Search'] },
    ],
    codeLanguage: 'python',
  },
  {
    id: 'sql', title: 'SQL & Databases', icon: '🗄️',
    accent: '#10b981', bg: 'from-emerald-500/20 to-teal-500/10',
    tag: 'Data Skills', tagColor: '#6366f1',
    modules: [
      { title: 'SQL Basics', lessons: ['What is SQL?', 'SELECT Queries', 'WHERE Clause', 'ORDER BY & LIMIT'] },
      { title: 'Joins', lessons: ['INNER JOIN', 'LEFT & RIGHT JOIN', 'FULL OUTER JOIN', 'Self Joins'] },
      { title: 'Aggregations', lessons: ['COUNT/SUM/AVG', 'GROUP BY', 'HAVING Clause', 'Subqueries'] },
      { title: 'Advanced SQL', lessons: ['Window Functions', 'CTEs', 'Indexes', 'Transactions'] },
    ],
    codeLanguage: 'python',
  },
  {
    id: 'webdev', title: 'Web Development', icon: '🌐',
    accent: '#ec4899', bg: 'from-pink-500/20 to-rose-500/10',
    tag: 'Full Stack', tagColor: '#f59e0b',
    modules: [
      { title: 'HTML', lessons: ['HTML Basics', 'Forms & Inputs', 'Semantic HTML', 'Tables'] },
      { title: 'CSS', lessons: ['Selectors', 'Box Model', 'Flexbox', 'CSS Grid'] },
      { title: 'React Basics', lessons: ['What is React?', 'Components', 'Props', 'State & useState'] },
      { title: 'React Advanced', lessons: ['useEffect', 'Context API', 'React Router', 'API Calls'] },
    ],
    codeLanguage: 'javascript',
  },
];

type Msg = { role: 'user' | 'assistant'; content: string };
type Lang = 'en-IN' | 'hi-IN' | 'mr-IN';

const LANG_NAMES: Record<Lang,string> = { 'en-IN': 'English', 'hi-IN': 'Hindi', 'mr-IN': 'Marathi' };

// ── CATALOG ───────────────────────────────────────────────────────
function Catalog({ onSelect }: { onSelect: (c: any) => void }) {
  const [hovered, setHovered] = useState<string|null>(null);
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', padding: '40px 32px', fontFamily: 'system-ui,sans-serif' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .course-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .course-card:hover { transform: translateY(-6px) scale(1.01); }
      `}</style>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px', animation: 'slide-up 0.6s ease both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: '20px' }}>
          <Sparkles size={14} style={{ color: '#818cf8' }} />
          <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: 700 }}>AI-Powered Learning</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          🎓 Hiresnix<br />
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Academy</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '28px' }}>Your personal AI teacher — learn at your pace, in your language</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          {[['🔥', 'Live AI Teaching'], ['🎯', 'Quiz & Practice'], ['🖥️', 'Run Code Live'], ['🏆', 'Earn Certificate']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>
              <span>{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {COURSES.map((c, i) => (
          <div key={c.id} className="course-card"
            onClick={() => onSelect(c)}
            onMouseEnter={() => setHovered(c.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === c.id
                ? `linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,30,60,0.98))`
                : 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.95))',
              border: `1px solid ${hovered === c.id ? c.accent+'44' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '20px', padding: '28px', cursor: 'pointer',
              animation: `slide-up 0.5s ease ${i*0.08}s both`,
              boxShadow: hovered === c.id ? `0 20px 60px ${c.accent}22` : 'none',
              position: 'relative', overflow: 'hidden',
            }}>
            {/* Glow blob */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: c.accent, opacity: hovered === c.id ? 0.08 : 0.03, transition: 'opacity 0.3s', filter: 'blur(30px)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '40px', animation: hovered === c.id ? 'float 2s ease infinite' : 'none' }}>{c.icon}</div>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: `${c.tagColor}22`, color: c.tagColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.tag}</span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{c.title}</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>📚 {c.modules.length} Modules</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>📖 {c.modules.reduce((a,m)=>a+m.lessons.length,0)} Lessons</span>
            </div>

            {/* Module preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
              {c.modules.slice(0,3).map((m,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '4px', background: `${c.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: c.accent, fontWeight: 800, flexShrink: 0 }}>{i+1}</div>
                  {m.title}
                </div>
              ))}
              {c.modules.length > 3 && <div style={{ fontSize: '11px', color: '#334155', paddingLeft: '24px' }}>+{c.modules.length-3} more modules</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(5)].map((_,i) => <Star key={i} size={12} fill={c.accent} style={{ color: c.accent }} />)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: c.accent }}>
                Start Learning <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN LESSON UI ────────────────────────────────────────────────
function LessonUI({ course, onBack }: { course: any; onBack: () => void }) {
  const [activeMod, setActiveMod] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedMods, setExpandedMods] = useState<number[]>([0]);
  const [tab, setTab] = useState<'teacher'|'code'|'backward'|'forward'|'notes'|'quiz'>('teacher');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [lang, setLang] = useState<Lang>('en-IN');

  // Content states
  const [teacherText, setTeacherText] = useState('');
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [backward, setBackward] = useState('');
  const [forward, setForward] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAns, setSelectedAns] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [quizCount, setQuizCount] = useState(0);

  // Mentor
  const [mentorMsgs, setMentorMsgs] = useState<Msg[]>([
    { role: 'assistant', content: `Hi! 👋 I'm your AI Mentor. Ask me anything!` }
  ]);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);

  // Voice/Audio
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>(Array(20).fill(4));
  const micRef = useRef<any>(null);
  const micActive = useRef(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const waveInterval = useRef<any>(null);

  const lesson = course.modules[activeMod]?.lessons[activeLesson] || '';
  const totalLessons = course.modules.reduce((a: number, m: any) => a + m.lessons.length, 0);
  const doneCount = completed.size;
  const progress = Math.round((doneCount / totalLessons) * 100);
  const langLabel = LANG_NAMES[lang];

  const SYSTEM = `You are Alex, a friendly AI teacher at Hiresnix Academy teaching "${course.title}". Lesson: "${lesson}". IMPORTANT: Respond in ${langLabel}. Use simple language. For Hindi/Marathi, mix technical terms in English but explain in the local language.`;

  // Wave animation
  const startWave = () => {
    waveInterval.current = setInterval(() => {
      setWaveBars(Array(20).fill(0).map(() => Math.random() * 28 + 4));
    }, 120);
  };
  const stopWave = () => {
    clearInterval(waveInterval.current);
    setWaveBars(Array(20).fill(4));
  };

  const speak = useCallback((text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, ' code example ').replace(/[#*`]/g, '').slice(0, 500);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang; u.rate = 0.88; u.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (pref) u.voice = pref;
    u.onstart = () => { setSpeaking(true); startWave(); };
    u.onend = () => { setSpeaking(false); stopWave(); };
    u.onerror = () => { setSpeaking(false); stopWave(); };
    window.speechSynthesis.speak(u);
  }, [muted, lang]);

  // Streaming AI teacher
  const loadTeacher = useCallback(async () => {
    setTeacherLoading(true); setTeacherText('');
    window.speechSynthesis?.cancel();
    try {
      const res = await askGroq([], `${SYSTEM}\n\nTeach "${lesson}" clearly:\n1. Simple definition\n2. Real-world analogy\n3. Key concepts (3-4 points)\n4. A quick tip\n\nBe engaging and conversational. Keep it under 250 words.`, true) as Response;
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content || '';
            full += delta;
            setTeacherText(full);
          } catch {}
        }
      }
      speak(full);
    } catch { setTeacherText('Could not load lesson. Please try again.'); }
    setTeacherLoading(false);
  }, [lesson, lang]);

  const loadCode = useCallback(async () => {
    setCodeLoading(true); setCodeText(''); setUserCode(''); setCodeOutput('');
    const res = await askGroq([], `${SYSTEM}\n\nCreate a clear ${course.codeLanguage} code example for "${lesson}".\n\nFormat exactly:\n\`\`\`${course.codeLanguage}\n# Your code here with comments\n\`\`\`\n\nOutput:\n\`\`\`\nexpected output here\n\`\`\`\n\n**Line by line explanation** (in ${langLabel}):`);
    setCodeText(res);
    // Extract code for playground
    const match = res.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (match) setUserCode(match[1].trim());
    setCodeLoading(false);
  }, [lesson, lang]);

  const loadTrace = useCallback(async () => {
    setTraceLoading(true); setBackward(''); setForward('');
    const [bwd, fwd] = await Promise.all([
      askGroq([], `${SYSTEM}\n\nBACKWARD TRACING for "${lesson}" (in ${langLabel}):\nShow how to trace from OUTPUT back to INPUT. Use arrows: output ← step ← input. Show each reverse step clearly with variable states.`),
      askGroq([], `${SYSTEM}\n\nFORWARD TRACING for "${lesson}" (in ${langLabel}):\nShow step-by-step execution from start to end. Format each step:\nStep N → [line/operation] → [variable states] → [what happens next]`),
    ]);
    setBackward(bwd); setForward(fwd);
    setTraceLoading(false);
  }, [lesson, lang]);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true); setNotes('');
    const res = await askGroq([], `${SYSTEM}\n\nCreate study notes for "${lesson}" in ${langLabel}:\n\n## 📌 Key Concepts\n## 💻 Syntax\n## 📝 Examples\n## ⚠️ Common Mistakes\n## ⚡ Quick Summary`);
    setNotes(res); setNotesLoading(false);
  }, [lesson, lang]);

  const loadQuiz = useCallback(async () => {
    setQuizLoading(true); setQuiz(null); setSelectedAns(null);
    const res = await askGroq([], `Generate a quiz question about "${lesson}" in ${langLabel}.\nReturn ONLY valid JSON (no markdown):\n{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"...","fun_fact":"..."}`);
    try {
      const clean = res.replace(/```json?|```/g, '').trim();
      setQuiz(JSON.parse(clean));
    } catch {
      setQuiz({ question: `What is the main purpose of ${lesson}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, explanation: 'Try again for a better question.', fun_fact: '' });
    }
    setQuizLoading(false);
  }, [lesson, lang]);

  const runUserCode = async () => {
    setRunLoading(true); setCodeOutput('');
    const result = await runCode(course.codeLanguage, userCode);
    setCodeOutput(result.stdout || result.stderr || 'No output');
    setRunLoading(false);
  };

  const sendMentor = async (text?: string) => {
    const q = text || mentorInput.trim();
    if (!q) return;
    setMentorInput('');
    const userMsg: Msg = { role: 'user', content: q };
    const newMsgs = [...mentorMsgs, userMsg];
    setMentorMsgs(newMsgs);
    setMentorLoading(true);
    const res = await askGroq(
      newMsgs.map(m => ({ role: m.role, content: m.content })),
      `You are a supportive AI Mentor for ${course.title}. Current lesson: "${lesson}". Respond in ${langLabel}. Be encouraging, clear, and concise.`
    );
    setMentorMsgs([...newMsgs, { role: 'assistant', content: res }]);
    speak(res.slice(0, 200));
    setMentorLoading(false);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome browser for voice'); return; }
    if (micOn) {
      micActive.current = false; micRef.current?.abort(); setMicOn(false);
    } else {
      micActive.current = true; setMicOn(true);
      const r = new SR(); r.lang = lang; r.continuous = false; r.interimResults = false;
      r.onresult = (e: any) => { sendMentor(e.results[0][0].transcript); };
      r.onend = () => { micActive.current = false; setMicOn(false); };
      r.onerror = () => { micActive.current = false; setMicOn(false); };
      micRef.current = r; r.start();
    }
  };

  const selectLesson = (mi: number, li: number) => {
    setActiveMod(mi); setActiveLesson(li); setTab('teacher');
    setTeacherText(''); setCodeText(''); setBackward(''); setForward(''); setNotes(''); setQuiz(null);
    window.speechSynthesis?.cancel();
  };

  const markDone = () => {
    const key = `${activeMod}-${activeLesson}`;
    if (!completed.has(key)) setCompleted(prev => new Set([...prev, key]));
    const mod = course.modules[activeMod];
    if (activeLesson < mod.lessons.length - 1) selectLesson(activeMod, activeLesson + 1);
    else if (activeMod < course.modules.length - 1) {
      setExpandedMods(p => [...p, activeMod + 1]);
      selectLesson(activeMod + 1, 0);
    }
  };

  const isDone = (mi: number, li: number) => completed.has(`${mi}-${li}`);

  useEffect(() => {
    setTeacherText(''); setCodeText(''); setBackward(''); setForward(''); setNotes(''); setQuiz(null);
    window.speechSynthesis?.cancel();
  }, [lesson]);

  useEffect(() => {
    if (tab === 'teacher' && !teacherText && !teacherLoading) loadTeacher();
    if (tab === 'code' && !codeText && !codeLoading) loadCode();
    if ((tab === 'backward' || tab === 'forward') && !backward && !traceLoading) loadTrace();
    if (tab === 'notes' && !notes && !notesLoading) loadNotes();
    if (tab === 'quiz' && !quiz && !quizLoading) loadQuiz();
  }, [tab]);

  useEffect(() => { return () => window.speechSynthesis?.cancel(); }, []);

  const QUICK_Q = [`Explain ${lesson} simply`, `Give me an example of ${lesson}`, `What are common mistakes in ${lesson}?`, `How is ${lesson} used in real projects?`];

  const TABS = [
    { id: 'teacher', label: '🤖 AI Teacher' },
    { id: 'code', label: '⌨️ Code & Run' },
    { id: 'backward', label: '← Backward' },
    { id: 'forward', label: '→ Forward' },
    { id: 'quiz', label: '❓ Quiz' },
    { id: 'notes', label: '📝 Notes' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 290px', height: '100vh', background: '#080b12', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.4);opacity:0}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .lesson-btn:hover{background:rgba(255,255,255,0.06)!important;color:#e2e8f0!important}
        .tab-btn:hover{background:rgba(255,255,255,0.08)!important}
        .quick-q:hover{background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.15)!important}
        *::-webkit-scrollbar{width:3px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        .typing-cursor::after{content:'|';animation:blink 1s infinite;color:${course.accent}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        textarea{color-scheme:dark}
        .run-btn:hover{opacity:0.85!important}
      `}</style>

      {/* ══ LEFT SIDEBAR ══════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(180deg,#0b0f1a 0%,#080b12 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', padding: 0 }}>
            <ArrowLeft size={13} /> Back to courses
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ fontSize: '24px', animation: 'float 3s ease infinite' }}>{course.icon}</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '13px', lineHeight: 1.2 }}>{course.title}</div>
              <div style={{ color: course.accent, fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>{progress}% Complete</div>
            </div>
          </div>
          {/* Progress */}
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${course.accent},${course.accent}bb)`, borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Modules list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {course.modules.map((mod: any, mi: number) => (
            <div key={mi}>
              <button onClick={() => setExpandedMods(p => p.includes(mi) ? p.filter(x=>x!==mi) : [...p,mi])}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px', fontWeight: 700, textAlign: 'left', marginBottom: '2px' }}>
                <span style={{ color: course.accent, fontSize: '10px' }}>{expandedMods.includes(mi) ? '▼' : '▶'}</span>
                <span style={{ flex: 1 }}>{mi+1}. {mod.title}</span>
                <span style={{ fontSize: '10px', color: '#334155' }}>{mod.lessons.filter((_:any,li:number)=>isDone(mi,li)).length}/{mod.lessons.length}</span>
              </button>
              {expandedMods.includes(mi) && mod.lessons.map((ls: string, li: number) => {
                const active = activeMod === mi && activeLesson === li;
                const done = isDone(mi, li);
                return (
                  <button key={li} onClick={() => selectLesson(mi, li)} className="lesson-btn"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px 6px 22px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '11px', marginBottom: '1px', transition: 'all 0.15s', background: active ? `${course.accent}18` : 'none', color: active ? course.accent : done ? '#34d399' : '#475569', borderLeft: active ? `2px solid ${course.accent}` : '2px solid transparent' }}>
                    {done ? <CheckCircle size={11} style={{ color: '#34d399', flexShrink: 0 }} /> : <div style={{ width: 11, height: 11, borderRadius: '50%', border: `1.5px solid ${active ? course.accent : 'rgba(255,255,255,0.12)'}`, flexShrink: 0 }} />}
                    <span style={{ flex: 1, lineHeight: 1.3 }}>{ls}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b' }}>
              <Flame size={12} /> {doneCount} lessons done
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#818cf8' }}>
              <Trophy size={12} /> {score} pts
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#334155', textAlign: 'center' }}>Keep going! You're doing great 🚀</div>
        </div>
      </div>

      {/* ══ CENTER ════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080b12' }}>
        {/* Top bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(11,15,26,0.8)', backdropFilter: 'blur(12px)' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>{lesson}</div>
            <div style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>{course.modules[activeMod]?.title}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Lang selector */}
            <select value={lang} onChange={e => { setLang(e.target.value as Lang); setTeacherText(''); setNotes(''); setBackward(''); setForward(''); setQuiz(null); }}
              style={{ padding: '6px 10px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
              <option value="en-IN">🇬🇧 English</option>
              <option value="hi-IN">🇮🇳 Hindi</option>
              <option value="mr-IN">🏛️ Marathi</option>
            </select>
            <button onClick={() => { setMuted(m=>!m); window.speechSynthesis?.cancel(); setSpeaking(false); stopWave(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: muted ? '#334155' : course.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button onClick={markDone}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg,${course.accent},${course.accent}99)`, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              <CheckCircle size={13} /> Mark Done
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'rgba(11,15,26,0.5)' }}>
          {TABS.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id as any)}
              style={{ padding: '6px 13px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s', background: tab === t.id ? course.accent : 'rgba(255,255,255,0.04)', color: tab === t.id ? '#fff' : '#475569' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── AI TEACHER ── */}
          {tab === 'teacher' && (
            <div style={{ animation: 'fade-in 0.3s ease' }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.98))', borderRadius: '18px', border: `1px solid ${course.accent}33`, padding: '24px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 150, height: 150, borderRadius: '50%', background: course.accent, opacity: 0.05, filter: 'blur(40px)' }} />
                <div style={{ display: 'flex', gap: '16px' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${course.accent},${course.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: `2px solid ${course.accent}66`, boxShadow: speaking ? `0 0 24px ${course.accent}88` : 'none', transition: 'box-shadow 0.3s' }}>
                      🤖
                    </div>
                    {speaking && <>
                      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${course.accent}44`, animation: 'pulse-ring 1s ease-out infinite' }} />
                      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${course.accent}22`, animation: 'pulse-ring 1s ease-out 0.3s infinite' }} />
                    </>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ color: course.accent, fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>ALEX · AI TEACHER</span>
                      {speaking && <span style={{ background: `${course.accent}22`, color: course.accent, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>🔊 Speaking...</span>}
                      {teacherLoading && <span style={{ color: '#475569', fontSize: '11px' }}>Thinking...</span>}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.75, whiteSpace: 'pre-wrap' }} className={teacherLoading ? 'typing-cursor' : ''}>
                      {teacherLoading && !teacherText ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                          <Loader2 size={16} className="animate-spin" style={{ color: course.accent }} />
                          <span>Alex is preparing your lesson in {langLabel}...</span>
                        </div>
                      ) : teacherText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sound wave */}
              {speaking && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '40px', marginBottom: '16px' }}>
                  {waveBars.map((h, i) => (
                    <div key={i} style={{ width: '3px', background: `${course.accent}`, borderRadius: '2px', height: `${h}px`, transition: 'height 0.12s ease', opacity: 0.7 + (i%3)*0.1 }} />
                  ))}
                </div>
              )}

              <button onClick={loadTeacher} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${course.accent}33`, background: `${course.accent}11`, color: course.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <RefreshCw size={12} /> Re-explain in {langLabel}
              </button>
            </div>
          )}

          {/* ── CODE & RUN ── */}
          {tab === 'code' && (
            <div style={{ animation: 'fade-in 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {codeLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: course.accent, margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontSize: '14px' }}>Generating code example in {course.codeLanguage}...</div>
                </div>
              ) : (
                <>
                  {/* AI generated explanation */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '16px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                    {codeText}
                  </div>

                  {/* Live playground */}
                  <div style={{ background: '#0d1117', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal size={13} style={{ color: course.accent }} />
                        <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>▶ Live Code Playground — {course.codeLanguage}</span>
                      </div>
                      <button className="run-btn" onClick={runUserCode} disabled={runLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: runLoading ? 0.6 : 1 }}>
                        {runLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="#fff" />}
                        {runLoading ? 'Running...' : 'Run Code'}
                      </button>
                    </div>
                    <textarea value={userCode} onChange={e => setUserCode(e.target.value)}
                      spellCheck={false}
                      style={{ width: '100%', minHeight: '180px', background: 'transparent', border: 'none', padding: '16px', fontFamily: "'Fira Code',monospace", fontSize: '13px', color: '#e2e8f0', outline: 'none', resize: 'vertical', lineHeight: 1.7 }}
                      placeholder={`Write your ${course.codeLanguage} code here...`} />
                    {codeOutput && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Terminal size={11} /> OUTPUT
                        </div>
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: codeOutput.includes('Error') || codeOutput.includes('error') ? '#f87171' : '#a7f3d0', lineHeight: 1.6 }}>{codeOutput}</pre>
                      </div>
                    )}
                  </div>
                  <button onClick={loadCode} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    <RefreshCw size={12} /> New Example
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── BACKWARD TRACING ── */}
          {tab === 'backward' && (
            <div style={{ animation: 'fade-in 0.3s ease' }}>
              {traceLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: '#f87171', margin: '0 auto 12px', display: 'block' }} />
                  Analyzing backward trace in {langLabel}...
                </div>
              ) : (
                <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.05),rgba(15,23,42,0.98))', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeftRight size={16} style={{ color: '#f87171' }} />
                    </div>
                    <div>
                      <div style={{ color: '#f87171', fontWeight: 800, fontSize: '14px' }}>← Backward Tracing</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>How the output was produced — traced in reverse</div>
                    </div>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{backward}</div>
                  <button onClick={loadTrace} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── FORWARD TRACING ── */}
          {tab === 'forward' && (
            <div style={{ animation: 'fade-in 0.3s ease' }}>
              {traceLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: '#34d399', margin: '0 auto 12px', display: 'block' }} />
                  Analyzing forward execution in {langLabel}...
                </div>
              ) : (
                <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(15,23,42,0.98))', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={16} style={{ color: '#34d399' }} />
                    </div>
                    <div>
                      <div style={{ color: '#34d399', fontWeight: 800, fontSize: '14px' }}>→ Forward Tracing</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>Step-by-step execution from start to end</div>
                    </div>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{forward}</div>
                  <button onClick={loadTrace} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(16,185,129,0.08)', color: '#34d399', fontSize: '12px', cursor: 'pointer' }}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── QUIZ ── */}
          {tab === 'quiz' && (
            <div style={{ animation: 'fade-in 0.3s ease' }}>
              {quizLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'float 1.5s ease infinite' }}>🎯</div>
                  <Loader2 size={24} className="animate-spin" style={{ color: course.accent, margin: '0 auto 12px', display: 'block' }} />
                  Generating quiz in {langLabel}...
                </div>
              ) : quiz ? (
                <div>
                  {/* Score bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trophy size={16} style={{ color: '#f59e0b' }} />
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '14px' }}>Score: {score} pts</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '12px' }}>{quizCount} questions answered</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '20px', lineHeight: 1.5 }}>{quiz.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {quiz.options.map((opt: string, i: number) => {
                        const isCorrect = i === quiz.correct;
                        const isSelected = selectedAns === i;
                        const revealed = selectedAns !== null;
                        return (
                          <button key={i} onClick={() => { if (selectedAns !== null) return; setSelectedAns(i); if (isCorrect) { setScore(s => s+10); } setQuizCount(c => c+1); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: revealed ? (isCorrect ? '1px solid rgba(52,211,153,0.6)' : isSelected ? '1px solid rgba(248,113,113,0.6)' : '1px solid rgba(255,255,255,0.06)') : '1px solid rgba(255,255,255,0.08)',
                              background: revealed ? (isCorrect ? 'rgba(16,185,129,0.12)' : isSelected ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)') : 'rgba(255,255,255,0.04)',
                              color: revealed ? (isCorrect ? '#34d399' : isSelected ? '#f87171' : '#475569') : '#94a3b8',
                              cursor: revealed ? 'default' : 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                            }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${revealed ? (isCorrect ? '#34d399' : isSelected ? '#f87171' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0, color: revealed ? (isCorrect ? '#34d399' : isSelected ? '#f87171' : '#334155') : '#64748b' }}>
                              {String.fromCharCode(65+i)}
                            </span>
                            {opt}
                            {revealed && isCorrect && <CheckCircle size={14} style={{ color: '#34d399', marginLeft: 'auto' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedAns !== null && (
                    <div style={{ animation: 'fade-in 0.3s ease' }}>
                      <div style={{ background: selectedAns === quiz.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '12px', border: `1px solid ${selectedAns === quiz.correct ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, padding: '16px', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '6px', color: selectedAns === quiz.correct ? '#34d399' : '#f87171' }}>
                          {selectedAns === quiz.correct ? '✅ Correct! +10 points' : '❌ Not quite!'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{quiz.explanation}</div>
                        {quiz.fun_fact && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>💡 {quiz.fun_fact}</div>}
                      </div>
                      <button onClick={loadQuiz} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${course.accent},${course.accent}99)`, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                        Next Question →
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === 'notes' && (
            <div style={{ animation: 'fade-in 0.3s ease' }}>
              {notesLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: course.accent, margin: '0 auto 12px', display: 'block' }} />
                  Generating study notes in {langLabel}...
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: course.accent }} />
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>Study Notes — {lesson}</span>
                    </div>
                    <button onClick={loadNotes} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#475569', fontSize: '11px', cursor: 'pointer' }}>
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT SIDEBAR — AI MENTOR ══════════════════════════════ */}
      <div style={{ background: 'linear-gradient(180deg,#0b0f1a 0%,#080b12 100%)', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${course.accent},${course.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: `0 0 14px ${course.accent}44` }}>🤖</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#34d399', border: '2px solid #0b0f1a' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>AI Mentor</div>
            <div style={{ color: '#34d399', fontSize: '10px', fontWeight: 600 }}>● Online · {langLabel}</div>
          </div>
        </div>

        {/* Quick questions */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '7px' }}>Quick Questions</div>
          {QUICK_Q.map((q, i) => (
            <button key={i} className="quick-q" onClick={() => sendMentor(q)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: '11px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', transition: 'all 0.15s', lineHeight: 1.4 }}>
              <span>{q}</span>
              <ChevronRight size={10} style={{ flexShrink: 0, marginLeft: '4px', color: '#334155' }} />
            </button>
          ))}
        </div>

        {/* Voice */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Voice ({langLabel})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '24px' }}>
              {Array.from({length:14}).map((_,i) => (
                <div key={i} style={{ flex: 1, background: micOn ? course.accent : 'rgba(255,255,255,0.07)', borderRadius: '2px', height: micOn ? `${Math.random()*18+4}px` : '3px', transition: 'height 0.12s ease', opacity: 0.7 }} />
              ))}
            </div>
            <button onClick={toggleMic}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: micOn ? 'linear-gradient(135deg,#ef4444,#dc2626)' : `linear-gradient(135deg,${course.accent},${course.accent}99)`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: micOn ? '0 0 16px rgba(239,68,68,0.5)' : `0 0 12px ${course.accent}44` }}>
              {micOn ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '24px' }}>
              {Array.from({length:14}).map((_,i) => (
                <div key={i} style={{ flex: 1, background: speaking ? course.accent : 'rgba(255,255,255,0.07)', borderRadius: '2px', height: speaking ? `${waveBars[i]||4}px` : '3px', transition: 'height 0.12s ease', opacity: 0.7 }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#334155', marginTop: '5px' }}>
            {micOn ? '🎤 Listening...' : 'Tap mic to speak'}
          </div>
        </div>

        {/* Chat */}
        <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '8px 12px 4px' }}>Chat</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mentorMsgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fade-in 0.3s ease' }}>
              <div style={{
                maxWidth: '86%', padding: '9px 12px', borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                fontSize: '12px', lineHeight: 1.55,
                background: m.role === 'user' ? `linear-gradient(135deg,${course.accent},${course.accent}99)` : 'rgba(255,255,255,0.06)',
                color: m.role === 'user' ? '#fff' : '#cbd5e1',
                border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>{m.content}</div>
            </div>
          ))}
          {mentorLoading && (
            <div style={{ display: 'flex', gap: '4px', padding: '10px 12px', width: 'fit-content', borderRadius: '14px', background: 'rgba(255,255,255,0.05)' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: `bounce 0.8s ${i*0.15}s infinite ease-in-out` }} />)}
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '6px' }}>
          <input value={mentorInput} onChange={e => setMentorInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMentor()}
            placeholder={`Ask in ${langLabel}...`}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }} />
          <button onClick={() => sendMentor()} disabled={!mentorInput.trim() || mentorLoading}
            style={{ width: 34, height: 34, borderRadius: '10px', border: 'none', background: mentorInput.trim() ? course.accent : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!mentorInput.trim() || mentorLoading) ? 0.4 : 1, transition: 'all 0.2s', flexShrink: 0 }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────
export function AcademyPage() {
  const [course, setCourse] = useState<any>(null);
  if (course) return <LessonUI course={course} onBack={() => setCourse(null)} />;
  return <Catalog onSelect={setCourse} />;
}