// src/pages/instStudent/AcademyPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, ChevronRight, ChevronDown, CheckCircle, ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw, Code2, FileText, BookOpen, Zap, ArrowLeftRight } from 'lucide-react';

const GROQ = (import.meta as any).env.VITE_GROQ_API_KEY || '';

// ── Data ─────────────────────────────────────────────────────────
const COURSES = [
  {
    id: 'python', title: 'Python Programming', icon: '🐍', accent: '#6366f1',
    modules: [
      { title: 'Introduction to Python', lessons: ['What is Python?', 'Installing Python', 'Your First Program'] },
      { title: 'Variables & Data Types', lessons: ['Variables in Python', 'Data Types', 'Type Conversion'] },
      { title: 'Operators', lessons: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators'] },
      { title: 'Control Flow', lessons: ['If Statement', 'If-Else Statement', 'Nested If-Else', 'Loops'] },
      { title: 'Functions', lessons: ['Defining Functions', 'Parameters', 'Return Statement'] },
    ]
  },
  {
    id: 'js', title: 'JavaScript', icon: '⚡', accent: '#F59E0B',
    modules: [
      { title: 'JS Basics', lessons: ['What is JavaScript?', 'Variables (let/const)', 'Data Types'] },
      { title: 'Control Flow', lessons: ['if/else', 'Switch', 'Loops'] },
      { title: 'Functions', lessons: ['Function Declaration', 'Arrow Functions', 'Callbacks'] },
      { title: 'DOM', lessons: ['Selecting Elements', 'Event Listeners', 'DOM Manipulation'] },
    ]
  },
  {
    id: 'dsa', title: 'DSA', icon: '🧠', accent: '#8B5CF6',
    modules: [
      { title: 'Arrays', lessons: ['Array Basics', 'Two Pointers', 'Sliding Window'] },
      { title: 'Strings', lessons: ['String Operations', 'Pattern Matching', 'Palindromes'] },
      { title: 'Linked Lists', lessons: ['Singly Linked List', 'Doubly Linked List', 'Reversal'] },
    ]
  },
  {
    id: 'sql', title: 'SQL', icon: '🗄️', accent: '#10B981',
    modules: [
      { title: 'SQL Basics', lessons: ['SELECT Queries', 'WHERE Clause', 'ORDER BY'] },
      { title: 'Joins', lessons: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'] },
      { title: 'Aggregations', lessons: ['COUNT/SUM/AVG', 'GROUP BY', 'HAVING'] },
    ]
  },
];

// ── Groq API ──────────────────────────────────────────────────────
async function askGroq(messages: {role:string,content:string}[], system: string) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7, max_tokens: 800,
    }),
  });
  const d = await r.json();
  return d?.choices?.[0]?.message?.content || 'Could not get response.';
}

type Msg = { role: 'user' | 'assistant'; content: string };

// ── Catalog ───────────────────────────────────────────────────────
function Catalog({ onSelect }: { onSelect: (c: any) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0D1117' }}>
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">🎓 AI Academy</h1>
          <p style={{ color: '#64748b' }}>Learn with your personal AI Teacher</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COURSES.map(c => (
            <div key={c.id} onClick={() => onSelect(c)}
              className="rounded-2xl p-6 cursor-pointer transition hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-4xl mb-4">{c.icon}</div>
              <h2 className="text-xl font-black text-white mb-1">{c.title}</h2>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>{c.modules.length} Modules · {c.modules.reduce((a,m)=>a+m.lessons.length,0)} Lessons</p>
              <div className="flex items-center gap-1 text-sm font-bold" style={{ color: c.accent }}>
                Start Learning <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Lesson UI ────────────────────────────────────────────────
function LessonUI({ course, onBack }: { course: any; onBack: () => void }) {
  // State
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [tab, setTab] = useState<'teacher'|'code'|'backward'|'forward'|'notes'>('teacher');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [teacherContent, setTeacherContent] = useState('');
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [codeExample, setCodeExample] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [backward, setBackward] = useState('');
  const [forward, setForward] = useState('');
  const [traceLoading, setTraceLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [mentorMsgs, setMentorMsgs] = useState<Msg[]>([
    { role: 'assistant', content: `Hi! 👋 I'm your AI Mentor. How can I help you today?` }
  ]);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<'en-IN'|'hi-IN'|'mr-IN'>('en-IN');
  const micRef = useRef<any>(null);
  const micActive = useRef(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const lesson = course.modules[activeModule]?.lessons[activeLesson];
  const totalLessons = course.modules.reduce((a: number, m: any) => a + m.lessons.length, 0);
  const doneCount = completed.size;
  const progress = Math.round((doneCount / totalLessons) * 100);

  const langLabel = lang === 'hi-IN' ? 'Hindi' : lang === 'mr-IN' ? 'Marathi' : 'Simple English';
  const SYSTEM = `You are Alex, an expert AI teacher at Hiresnix Academy teaching "${course.title}". Current lesson: "${lesson}". IMPORTANT: Always respond in ${langLabel}. Be clear, concise, and use practical examples. If Hindi or Marathi, use simple everyday language mixed with English technical terms.`;

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, '').slice(0, 400));
    u.rate = 0.9;
    u.lang = lang;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (preferred) u.voice = preferred;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const loadTeacher = async () => {
    setTeacherLoading(true); setTeacherContent('');
    const res = await askGroq([], `${SYSTEM}\n\nTeach "${lesson}" in a clear, structured way. Include:\n1. What it is (simple definition)\n2. Why it matters (real-world use)\n3. Key points to remember\n4. A simple analogy\n\nKeep it engaging and conversational.`);
    setTeacherContent(res);
    speak(res);
    setTeacherLoading(false);
  };

  const loadCode = async () => {
    setCodeLoading(true); setCodeExample('');
    const res = await askGroq([], `${SYSTEM}\n\nCreate a clear code example for "${lesson}". Show:\n1. The code with comments\n2. What the output would be\n3. Brief explanation of each key line\n\nFormat:\n\`\`\`python\n# code here\n\`\`\`\n\nOutput:\n\`\`\`\noutput here\n\`\`\`\n\nExplanation: brief line by line explanation`);
    setCodeExample(res);
    setCodeLoading(false);
  };

  const loadTrace = async () => {
    setTraceLoading(true); setBackward(''); setForward('');
    const [bwd, fwd] = await Promise.all([
      askGroq([], `${SYSTEM}\n\nFor "${lesson}", explain BACKWARD TRACING — how would you trace back from the output to understand what happened? Show step by step in reverse: what produced what. Use arrow notation like: result ← operation ← input`),
      askGroq([], `${SYSTEM}\n\nFor "${lesson}", explain FORWARD TRACING — show step by step execution from start to end. Show each step with: line number, what executes, current state of variables. Use: Step 1 → Step 2 → format`),
    ]);
    setBackward(bwd); setForward(fwd);
    setTraceLoading(false);
  };

  const loadNotes = async () => {
    setNotesLoading(true); setNotes('');
    const res = await askGroq([], `${SYSTEM}\n\nCreate concise study notes for "${lesson}":\n\n## Key Concepts\n## Syntax\n## Examples\n## Common Mistakes\n## Quick Summary`);
    setNotes(res);
    setNotesLoading(false);
  };

  const sendMentor = async (text?: string) => {
    const q = text || mentorInput.trim();
    if (!q) return;
    setMentorInput('');
    const userMsg: Msg = { role: 'user', content: q };
    const newMsgs = [...mentorMsgs, userMsg];
    setMentorMsgs(newMsgs);
    setMentorLoading(true);
    const res = await askGroq(newMsgs.map(m=>({role:m.role,content:m.content})), `You are a helpful AI Mentor for ${course.title}. Current lesson: "${lesson}". Answer questions clearly and encourage the student.`);
    setMentorMsgs([...newMsgs, { role: 'assistant', content: res }]);
    setMentorLoading(false);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome'); return; }
    if (micOn) {
      micActive.current = false; micRef.current?.stop(); setMicOn(false);
    } else {
      micActive.current = true; setMicOn(true);
      const r = new SR(); r.lang = lang; r.continuous = false;
      r.onresult = (e: any) => { sendMentor(e.results[0][0].transcript); };
      r.onend = () => { micActive.current = false; setMicOn(false); };
      micRef.current = r; r.start();
    }
  };

  const selectLesson = (mi: number, li: number) => {
    setActiveModule(mi); setActiveLesson(li);
    setTeacherContent(''); setCodeExample(''); setBackward(''); setForward(''); setNotes('');
    setTab('teacher');
  };

  const markDone = () => {
    const key = `${activeModule}-${activeLesson}`;
    setCompleted(prev => new Set([...prev, key]));
    // Auto advance
    const mod = course.modules[activeModule];
    if (activeLesson < mod.lessons.length - 1) setActiveLesson(l => l + 1);
    else if (activeModule < course.modules.length - 1) { setActiveModule(m => m+1); setActiveLesson(0); setExpandedModules(p => [...p, activeModule+1]); }
  };

  useEffect(() => { if (tab === 'teacher' && !teacherContent) loadTeacher(); }, [tab, lesson]);
  useEffect(() => { if (tab === 'code' && !codeExample) loadCode(); }, [tab]);
  useEffect(() => { if ((tab === 'backward' || tab === 'forward') && !backward) loadTrace(); }, [tab]);
  useEffect(() => { if (tab === 'notes' && !notes) loadNotes(); }, [tab]);
  useEffect(() => { setTeacherContent(''); setCodeExample(''); setBackward(''); setForward(''); setNotes(''); loadTeacher(); }, [lesson]);

  const isDone = (mi: number, li: number) => completed.has(`${mi}-${li}`);

  const QUICK_Q = [
    `Explain ${lesson} with an example`,
    `What is the difference between similar concepts in ${lesson}?`,
    `Why do we need ${lesson}?`,
    `Give me a coding exercise for ${lesson}`,
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', height: '100vh', background: '#0D1117', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ background: '#0B0F1A', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Course header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{course.icon}</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>{course.title}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: course.accent, borderRadius: '4px', transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{progress}% Completed</div>
        </div>

        {/* Modules */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {course.modules.map((mod: any, mi: number) => (
            <div key={mi} style={{ marginBottom: '4px' }}>
              <button onClick={() => setExpandedModules(p => p.includes(mi) ? p.filter(x=>x!==mi) : [...p, mi])}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', fontWeight: 700, textAlign: 'left' }}>
                {expandedModules.includes(mi) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span style={{ flex: 1 }}>{mi+1}. {mod.title}</span>
              </button>
              {expandedModules.includes(mi) && mod.lessons.map((ls: string, li: number) => (
                <button key={li} onClick={() => selectLesson(mi, li)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px 7px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px',
                    background: activeModule===mi && activeLesson===li ? `${course.accent}22` : 'none',
                    color: activeModule===mi && activeLesson===li ? course.accent : isDone(mi,li) ? '#34d399' : '#64748b',
                    borderLeft: activeModule===mi && activeLesson===li ? `2px solid ${course.accent}` : '2px solid transparent',
                  }}>
                  {isDone(mi,li)
                    ? <CheckCircle size={12} style={{ color: '#34d399', flexShrink: 0 }} />
                    : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />}
                  {ls}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Course Progress</div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: course.accent }} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{doneCount} / {totalLessons} Lessons Completed</div>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>{lesson}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Learn how {lesson?.toLowerCase()} works</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setMuted(m=>!m); window.speechSynthesis?.cancel(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: muted ? '#475569' : course.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? 'Muted' : 'Sound ON'}
            </button>
            {/* Language Selector */}
            <select value={lang} onChange={e => setLang(e.target.value as any)}
              style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              <option value="en-IN">🇬🇧 English</option>
              <option value="hi-IN">🇮🇳 Hindi</option>
              <option value="mr-IN">🏛️ Marathi</option>
            </select>
            <button onClick={markDone} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', background: course.accent, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} /> Mark Done
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {[
            { id: 'teacher', label: '🤖 AI Teacher' },
            { id: 'code', label: '⌨️ Code' },
            { id: 'backward', label: '← Backward Tracing' },
            { id: 'forward', label: '→ Forward Tracing' },
            { id: 'notes', label: '📝 Notes' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                background: tab === t.id ? course.accent : 'rgba(255,255,255,0.05)',
                color: tab === t.id ? '#fff' : '#64748b',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* AI Teacher */}
          {tab === 'teacher' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Avatar area */}
              <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)', borderRadius: '16px', padding: '28px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg,${course.accent},${course.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: `2px solid ${course.accent}`, boxShadow: speaking ? `0 0 20px ${course.accent}66` : 'none', transition: 'box-shadow 0.3s' }}>
                    🤖
                  </div>
                  {speaking && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${course.accent}44`, animation: 'ping 1s infinite' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: course.accent, fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>ALEX · AI TEACHER {speaking ? '🔊' : ''}</div>
                  {teacherLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                      <Loader2 size={16} className="animate-spin" style={{ color: course.accent }} /> Alex is preparing the lesson...
                    </div>
                  ) : (
                    <div style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{teacherContent}</div>
                  )}
                </div>
              </div>
              {/* Sound waves */}
              {speaking && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '16px', height: '32px' }}>
                  {Array.from({length:20}).map((_,i) => (
                    <div key={i} style={{ width: 3, background: course.accent, borderRadius: 2, height: `${Math.random()*24+8}px`, animation: `wave ${0.4+i*0.05}s ease-in-out infinite alternate`, opacity: 0.8 }} />
                  ))}
                </div>
              )}
              <button onClick={loadTeacher} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${course.accent}44`, background: `${course.accent}11`, color: course.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <RefreshCw size={13} /> Re-explain
              </button>
            </div>
          )}

          {/* Code */}
          {tab === 'code' && (
            <div>
              {codeLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={24} className="animate-spin" style={{ color: course.accent, display: 'block', margin: '0 auto 12px' }} />Generating code example...</div>
              ) : (
                <div style={{ background: '#0d1117', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
                      <Code2 size={14} style={{ color: course.accent }} /> Code Example — {lesson}
                    </div>
                    <button onClick={loadCode} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                  <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.8, color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{codeExample}</div>
                </div>
              )}
            </div>
          )}

          {/* Backward Tracing */}
          {tab === 'backward' && (
            <div>
              {traceLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={24} className="animate-spin" style={{ color: course.accent, display: 'block', margin: '0 auto 12px' }} />Analyzing backward trace...</div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <ArrowLeftRight size={16} style={{ color: '#f87171' }} />
                    <span style={{ color: '#f87171', fontWeight: 700, fontSize: '14px' }}>Backward Tracing — How output was produced</span>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{backward}</div>
                  <button onClick={loadTrace} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Forward Tracing */}
          {tab === 'forward' && (
            <div>
              {traceLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={24} className="animate-spin" style={{ color: course.accent, display: 'block', margin: '0 auto 12px' }} />Analyzing forward trace...</div>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.2)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Zap size={16} style={{ color: '#34d399' }} />
                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: '14px' }}>Forward Tracing — Step by step execution</span>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{forward}</div>
                  <button onClick={loadTrace} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '12px', cursor: 'pointer' }}>
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div>
              {notesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 size={24} className="animate-spin" style={{ color: course.accent, display: 'block', margin: '0 auto 12px' }} />Generating notes...</div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: course.accent }} />
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Study Notes — {lesson}</span>
                    </div>
                    <button onClick={loadNotes} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR — AI MENTOR ── */}
      <div style={{ background: '#0B0F1A', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${course.accent},${course.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>AI Mentor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#34d399' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} /> Online
            </div>
          </div>
        </div>

        {/* Quick questions */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Questions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {QUICK_Q.map((q, i) => (
              <button key={i} onClick={() => sendMentor(q)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {q} <ChevronRight size={11} style={{ flexShrink: 0, color: '#475569' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Conversation</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: 28, display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({length: 12}).map((_,i) => (
                <div key={i} style={{ flex: 1, background: micOn ? course.accent : 'rgba(255,255,255,0.08)', borderRadius: 2, height: micOn ? `${Math.random()*20+8}px` : '4px', transition: 'height 0.1s' }} />
              ))}
            </div>
            <button onClick={toggleMic} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: micOn ? '#ef4444' : course.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {micOn ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <div style={{ flex: 1, height: 28, display: 'flex', alignItems: 'center', gap: '2px' }}>
              {Array.from({length: 12}).map((_,i) => (
                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 2, height: '4px' }} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '6px' }}>Tap to speak</div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chat</div>
          {mentorMsgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '9px 12px', borderRadius: 12, fontSize: '12px', lineHeight: 1.5,
                background: m.role === 'user' ? course.accent : 'rgba(255,255,255,0.06)',
                color: m.role === 'user' ? '#fff' : '#cbd5e1',
              }}>{m.content}</div>
            </div>
          ))}
          {mentorLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: `bounce 0.8s ${i*0.15}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
          <input value={mentorInput} onChange={e => setMentorInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMentor()}
            placeholder="Type your message..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }} />
          <button onClick={() => sendMentor()} disabled={!mentorInput.trim() || mentorLoading}
            style={{ width: 36, height: 36, borderRadius: '10px', border: 'none', background: course.accent, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!mentorInput.trim() || mentorLoading) ? 0.4 : 1 }}>
            <Send size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ping { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.2);opacity:0} }
        @keyframes wave { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        *::-webkit-scrollbar{width:4px} *::-webkit-scrollbar-track{background:transparent} *::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────
export function AcademyPage() {
  const [course, setCourse] = useState<any>(null);
  if (course) return <LessonUI course={course} onBack={() => setCourse(null)} />;
  return <Catalog onSelect={setCourse} />;
}