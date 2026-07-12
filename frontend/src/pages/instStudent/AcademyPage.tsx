// src/pages/instStudent/AcademyPage.tsx
// Simple AI Academy — works for both InstStudent and Student portals
// Uses Groq API directly from frontend (no Supabase, no backend needed)

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronRight, ArrowLeft, Send, Mic, MicOff, Code, FileText, HelpCircle, Loader2, CheckCircle, Play, Volume2, VolumeX } from 'lucide-react';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const GROQ_KEY = (import.meta as any).env.VITE_GROQ_API_KEY || '';

// ── Courses ────────────────────────────────────────────────────────
const COURSES = [
  {
    id: 'python', title: 'Python Programming', icon: '🐍',
    accent: '#3B82F6', desc: 'Learn Python from scratch with AI teacher',
    modules: [
      { id: 'basics', title: 'Basics', lessons: ['Variables & Data Types', 'Operators', 'Input/Output', 'Type Conversion'] },
      { id: 'control', title: 'Control Flow', lessons: ['if/else Conditionals', 'for Loops', 'while Loops', 'break & continue'] },
      { id: 'functions', title: 'Functions', lessons: ['Defining Functions', 'Arguments & Return', 'Default Parameters', 'Lambda Functions'] },
      { id: 'ds', title: 'Data Structures', lessons: ['Lists', 'Tuples', 'Dictionaries', 'Sets'] },
      { id: 'oop', title: 'OOP', lessons: ['Classes & Objects', 'Inheritance', 'Encapsulation', 'Polymorphism'] },
    ]
  },
  {
    id: 'javascript', title: 'JavaScript', icon: '⚡',
    accent: '#F59E0B', desc: 'Master modern JavaScript with AI guidance',
    modules: [
      { id: 'basics', title: 'Basics', lessons: ['Variables (let/const/var)', 'Data Types', 'Operators', 'Template Literals'] },
      { id: 'control', title: 'Control Flow', lessons: ['if/else', 'switch', 'for/while Loops', 'Array methods'] },
      { id: 'functions', title: 'Functions', lessons: ['Function Declarations', 'Arrow Functions', 'Callbacks', 'Closures'] },
      { id: 'dom', title: 'DOM & Events', lessons: ['Selecting Elements', 'Event Listeners', 'DOM Manipulation', 'Forms'] },
      { id: 'async', title: 'Async JS', lessons: ['Promises', 'async/await', 'fetch API', 'Error Handling'] },
    ]
  },
  {
    id: 'dsa', title: 'Data Structures & Algorithms', icon: '🧠',
    accent: '#8B5CF6', desc: 'Master DSA for interviews with AI explanations',
    modules: [
      { id: 'arrays', title: 'Arrays', lessons: ['Array Basics', 'Two Pointers', 'Sliding Window', 'Prefix Sum'] },
      { id: 'strings', title: 'Strings', lessons: ['String Operations', 'Pattern Matching', 'Palindromes', 'Anagrams'] },
      { id: 'linked', title: 'Linked Lists', lessons: ['Singly Linked List', 'Doubly Linked List', 'Reversal', 'Cycle Detection'] },
      { id: 'trees', title: 'Trees', lessons: ['Binary Trees', 'BST', 'Tree Traversals', 'Height & Depth'] },
      { id: 'sorting', title: 'Sorting & Searching', lessons: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Binary Search'] },
    ]
  },
  {
    id: 'webdev', title: 'Web Development', icon: '🌐',
    accent: '#10B981', desc: 'HTML, CSS and React from basics to advanced',
    modules: [
      { id: 'html', title: 'HTML', lessons: ['HTML Basics', 'Forms & Inputs', 'Semantic HTML', 'Tables & Lists'] },
      { id: 'css', title: 'CSS', lessons: ['Selectors & Properties', 'Box Model', 'Flexbox', 'CSS Grid'] },
      { id: 'react', title: 'React Basics', lessons: ['JSX & Components', 'Props', 'State & useState', 'useEffect'] },
      { id: 'react2', title: 'React Advanced', lessons: ['Context API', 'Custom Hooks', 'React Router', 'Forms in React'] },
    ]
  },
  {
    id: 'sql', title: 'SQL & Databases', icon: '🗄️',
    accent: '#EC4899', desc: 'Learn SQL from basics to advanced queries',
    modules: [
      { id: 'basics', title: 'SQL Basics', lessons: ['SELECT Queries', 'WHERE Clause', 'ORDER BY & LIMIT', 'DISTINCT'] },
      { id: 'joins', title: 'Joins', lessons: ['INNER JOIN', 'LEFT/RIGHT JOIN', 'FULL OUTER JOIN', 'Self Join'] },
      { id: 'agg', title: 'Aggregations', lessons: ['COUNT/SUM/AVG', 'GROUP BY', 'HAVING', 'Subqueries'] },
      { id: 'adv', title: 'Advanced', lessons: ['Indexes', 'Views', 'Stored Procedures', 'Transactions'] },
    ]
  },
];

// ── AI Call ────────────────────────────────────────────────────────
async function callGroq(messages: any[], system: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7, max_tokens: 1000,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'Sorry, could not get response.';
}

type View = 'catalog' | 'course' | 'lesson';
interface Msg { role: 'user' | 'assistant'; content: string; }

// ── CATALOG ────────────────────────────────────────────────────────
function Catalog({ onSelect }: { onSelect: (c: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <h1 className="text-2xl font-black text-white">🎓 AI Academy</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Learn with your personal AI teacher — at your own pace</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSES.map(c => (
          <div key={c.id} onClick={() => onSelect(c)}
            className="rounded-xl p-5 cursor-pointer transition hover:-translate-y-1 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl mb-3">{c.icon}</div>
            <div className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: `${c.accent}22`, color: c.accent }}>
              {c.modules.length} Modules
            </div>
            <h3 className="font-bold text-white mb-1">{c.title}</h3>
            <p className="text-xs mb-3" style={{ color: '#64748b' }}>{c.desc}</p>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: c.accent }}>
              Start Learning <ChevronRight size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COURSE ─────────────────────────────────────────────────────────
function Course({ course, onBack, onLesson }: { course: any; onBack: () => void; onLesson: (lesson: string, module: any) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-black text-white">{course.icon} {course.title}</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>{course.modules.reduce((a: number, m: any) => a + m.lessons.length, 0)} lessons</p>
        </div>
      </div>
      <div className="space-y-3">
        {course.modules.map((mod: any, mi: number) => (
          <div key={mod.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                style={{ background: course.accent }}>{mi + 1}</span>
              <span className="font-bold text-white text-sm">{mod.title}</span>
              <span className="text-xs ml-auto" style={{ color: '#64748b' }}>{mod.lessons.length} lessons</span>
            </div>
            <div className="p-3 space-y-1">
              {mod.lessons.map((lesson: string, li: number) => (
                <button key={li} onClick={() => onLesson(lesson, mod)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition hover:bg-white/05 group">
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs transition"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#64748b' }}>
                    {li + 1}
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition">{lesson}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-600 group-hover:text-gray-400 transition" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LESSON ─────────────────────────────────────────────────────────
function Lesson({ course, module: mod, lesson, onBack }: { course: any; module: any; lesson: string; onBack: () => void }) {
  const [tab, setTab] = useState<'teach' | 'quiz' | 'practice' | 'notes'>('teach');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [practice, setPractice] = useState('');
  const [practiceLoading, setPracticeLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognRef = useRef<any>(null);
  const micActiveRef = useRef(false);

  const SYSTEM = `You are Alex, a friendly AI teacher at Hiresnix Academy. 
You are teaching "${lesson}" from the "${mod.title}" module of "${course.title}".
Explain concepts clearly with simple language, real-world examples, and code snippets where relevant.
Keep responses focused and educational. Use markdown for code blocks.`;

  const speak = (text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, 'See the code example above.').slice(0, 300));
    utt.rate = 0.9; utt.pitch = 1.1;
    window.speechSynthesis.speak(utt);
  };

  const startLesson = async () => {
    setStarted(true);
    setLoading(true);
    const res = await callGroq([], `${SYSTEM}\n\nStart teaching "${lesson}" now. Give a brief intro, explain the key concept, provide a simple code example if relevant, and ask if the student has questions.`);
    const aiMsg: Msg = { role: 'assistant', content: res };
    setMsgs([aiMsg]);
    speak(res);
    setLoading(false);
  };

  const sendMsg = async (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: q };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setLoading(true);
    const res = await callGroq(newMsgs.map(m => ({ role: m.role, content: m.content })), SYSTEM);
    const aiMsg: Msg = { role: 'assistant', content: res };
    setMsgs([...newMsgs, aiMsg]);
    speak(res);
    setLoading(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateQuiz = async () => {
    setQuizLoading(true); setSelectedAnswer(null); setQuiz(null);
    const res = await callGroq([], `Generate a multiple choice quiz question about "${lesson}" in ${course.title}.
Return ONLY valid JSON: {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}`);
    try {
      const clean = res.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(clean));
    } catch { setQuiz({ question: 'Could not generate quiz. Try again.', options: [], correct: 0, explanation: '' }); }
    setQuizLoading(false);
  };

  const generateNotes = async () => {
    setNotesLoading(true);
    const res = await callGroq([], `${SYSTEM}\n\nCreate concise study notes for "${lesson}". Include: key concepts, syntax, examples, and common mistakes. Format with clear sections.`);
    setNotes(res); setNotesLoading(false);
  };

  const generatePractice = async () => {
    setPracticeLoading(true);
    const res = await callGroq([], `${SYSTEM}\n\nCreate 3 practice problems for "${lesson}" at different difficulty levels (Easy/Medium/Hard). For each: problem statement, hint, and expected output.`);
    setPractice(res); setPracticeLoading(false);
  };

  const toggleMic = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome for voice'); return; }
    if (micOn) {
      micActiveRef.current = false;
      recognRef.current?.stop();
      setMicOn(false);
    } else {
      micActiveRef.current = true;
      setMicOn(true);
      const r = new SR();
      r.continuous = false; r.lang = 'en-IN'; r.interimResults = false;
      r.onresult = (e: any) => { const t = e.results[0][0].transcript; sendMsg(t); };
      r.onend = () => { micActiveRef.current = false; setMicOn(false); };
      recognRef.current = r;
      r.start();
    }
  };

  useEffect(() => { return () => window.speechSynthesis?.cancel(); }, []);

  const TABS = [
    { id: 'teach', label: '🤖 AI Teacher', icon: BookOpen },
    { id: 'quiz', label: '❓ Quiz', icon: HelpCircle },
    { id: 'practice', label: '🎯 Practice', icon: Code },
    { id: 'notes', label: '📝 Notes', icon: FileText },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">{lesson}</h1>
          <p className="text-xs" style={{ color: '#64748b' }}>{course.title} → {mod.title}</p>
        </div>
        <button onClick={() => setMuted(m => !m)} className="p-2 rounded-xl hover:bg-white/10 transition">
          {muted ? <VolumeX size={16} className="text-gray-500" /> : <Volume2 size={16} style={{ color: course.accent }} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); if (t.id === 'quiz' && !quiz) generateQuiz(); if (t.id === 'notes' && !notes) generateNotes(); if (t.id === 'practice' && !practice) generatePractice(); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition"
            style={tab === t.id ? { background: course.accent, color: '#fff' } : { color: '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI Teacher Tab */}
      {tab === 'teach' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {!started ? (
            <div className="p-8 text-center space-y-4">
              <div className="text-5xl">🤖</div>
              <h2 className="text-white font-bold">Ready to learn {lesson}?</h2>
              <p className="text-sm" style={{ color: '#64748b' }}>Alex, your AI teacher, will explain this topic step by step</p>
              <button onClick={startLesson} className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-white font-bold"
                style={{ background: `linear-gradient(135deg,${course.accent},${course.accent}99)` }}>
                <Play size={16} /> Start Lesson
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '420px' }}>
                {msgs.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold"
                      style={{ background: m.role === 'assistant' ? `linear-gradient(135deg,${course.accent},${course.accent}99)` : 'rgba(255,255,255,0.1)' }}>
                      {m.role === 'assistant' ? '🤖' : '👤'}
                    </div>
                    <div className="rounded-xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap"
                      style={{
                        background: m.role === 'assistant' ? `${course.accent}15` : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${m.role === 'assistant' ? `${course.accent}30` : 'rgba(255,255,255,0.08)'}`,
                        color: m.role === 'assistant' ? '#e2e8f0' : '#cbd5e1',
                      }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg,${course.accent},${course.accent}99)` }}>🤖</div>
                    <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: `${course.accent}15`, border: `1px solid ${course.accent}30` }}>
                      <Loader2 size={14} className="animate-spin" style={{ color: course.accent }} />
                      <span className="text-sm" style={{ color: '#64748b' }}>Alex is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                  placeholder="Ask Alex anything about this lesson..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none dark-input" />
                <button onClick={toggleMic} className="p-2.5 rounded-xl transition"
                  style={{ background: micOn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  {micOn ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-gray-400" />}
                </button>
                <button onClick={() => sendMsg()} disabled={!input.trim() || loading}
                  className="px-4 py-2.5 rounded-xl text-white font-bold transition disabled:opacity-40"
                  style={{ background: course.accent }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {tab === 'quiz' && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {quizLoading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: course.accent }} /><p className="text-sm" style={{ color: '#64748b' }}>Generating quiz...</p></div>
          ) : quiz ? (
            <>
              <p className="font-bold text-white">{quiz.question}</p>
              <div className="space-y-2">
                {quiz.options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => setSelectedAnswer(i)} disabled={selectedAnswer !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition text-sm"
                    style={{
                      background: selectedAnswer === null ? 'rgba(255,255,255,0.04)' : i === quiz.correct ? 'rgba(16,185,129,0.15)' : selectedAnswer === i ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                      border: selectedAnswer === null ? '1px solid rgba(255,255,255,0.08)' : i === quiz.correct ? '1px solid rgba(16,185,129,0.4)' : selectedAnswer === i ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: selectedAnswer === null ? '#94a3b8' : i === quiz.correct ? '#34d399' : selectedAnswer === i ? '#f87171' : '#475569',
                    }}>
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.2)' }}>{String.fromCharCode(65 + i)}</span>
                    {opt}
                    {selectedAnswer !== null && i === quiz.correct && <CheckCircle size={14} className="ml-auto text-emerald-400" />}
                  </button>
                ))}
              </div>
              {selectedAnswer !== null && (
                <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe' }}>
                  💡 {quiz.explanation}
                </div>
              )}
              <button onClick={generateQuiz} className="w-full py-2.5 rounded-xl text-white font-bold text-sm"
                style={{ background: course.accent }}>Next Question →</button>
            </>
          ) : null}
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {notesLoading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: course.accent }} /><p className="text-sm" style={{ color: '#64748b' }}>Generating notes...</p></div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-sm">📝 Study Notes — {lesson}</h2>
                <button onClick={generateNotes} className="text-xs px-3 py-1.5 rounded-lg transition" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>Regenerate</button>
              </div>
              <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#cbd5e1', fontFamily: 'inherit' }}>{notes}</pre>
            </>
          )}
        </div>
      )}

      {/* Practice Tab */}
      {tab === 'practice' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {practiceLoading ? (
            <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: course.accent }} /><p className="text-sm" style={{ color: '#64748b' }}>Generating practice problems...</p></div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-sm">🎯 Practice Problems</h2>
                <button onClick={generatePractice} className="text-xs px-3 py-1.5 rounded-lg transition" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>New Problems</button>
              </div>
              <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#cbd5e1', fontFamily: 'inherit' }}>{practice}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────
export function AcademyPage() {
  const [view, setView] = useState<View>('catalog');
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [lesson, setLesson] = useState<string>('');

  if (view === 'lesson' && course && module && lesson) {
    return <Lesson course={course} module={module} lesson={lesson} onBack={() => setView('course')} />;
  }
  if (view === 'course' && course) {
    return <Course course={course} onBack={() => setView('catalog')} onLesson={(l, m) => { setLesson(l); setModule(m); setView('lesson'); }} />;
  }
  return <Catalog onSelect={c => { setCourse(c); setView('course'); }} />;
}
