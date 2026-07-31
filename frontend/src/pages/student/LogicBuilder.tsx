// src/pages/student/LogicBuilder.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Brain, Code2, Zap, Target, GitBranch, Play, ChevronRight,
  ChevronLeft, Star, Flame, Trophy, CheckCircle2, Loader2,
  RotateCcw, Lightbulb, AlertCircle, Calendar, TrendingUp,
  Lock, Cpu, Layers
} from 'lucide-react';

const API = (import.meta as any).env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';
const getToken = () => localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token') || '';
const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// ── CONSTANTS ─────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'Python',     emoji: '🐍', color: '#3B82F6', desc: 'Beginners & AI/ML' },
  { id: 'JavaScript', emoji: '⚡', color: '#F59E0B', desc: 'Web Frontend/Backend' },
  { id: 'Java',       emoji: '☕', color: '#EF4444', desc: 'Enterprise & Android' },
  { id: 'C++',        emoji: '⚙️', color: '#8B5CF6', desc: 'Systems & Competitive' },
  { id: 'React',      emoji: '⚛️', color: '#06B6D4', desc: 'Modern UI Development' },
  { id: 'DSA',        emoji: '🧩', color: '#10B981', desc: 'Data Structures & Algo' },
  { id: 'SQL',        emoji: '🗄️', color: '#F97316', desc: 'Database & Queries' },
  { id: 'Node.js',    emoji: '🟢', color: '#22C55E', desc: 'Backend API Dev' },
  { id: 'Flutter',    emoji: '📱', color: '#EC4899', desc: 'Cross-platform Apps' },
];

const STEPS = [
  { id: 0, label: 'Concept',    icon: Brain,     emoji: '🧠', maxScore: 15 },
  { id: 1, label: 'Pseudocode', icon: Layers,    emoji: '📝', maxScore: 20 },
  { id: 2, label: 'Flowchart',  icon: GitBranch, emoji: '🔀', maxScore: 15 },
  { id: 3, label: 'Code',       icon: Code2,     emoji: '💻', maxScore: 25 },
  { id: 4, label: 'Dry Run',    icon: Cpu,       emoji: '🔢', maxScore: 15 },
  { id: 5, label: 'Edge Cases', icon: Target,    emoji: '🎯', maxScore: 10 },
];

const BADGES = [
  { id: 'beginner',     label: 'Beginner',      emoji: '🌱', minScore: 0   },
  { id: 'thinker',      label: 'Thinker',        emoji: '💭', minScore: 30  },
  { id: 'logic_master', label: 'Logic Master',   emoji: '🧠', minScore: 60  },
  { id: 'code_ninja',   label: 'Code Ninja',     emoji: '🥷', minScore: 85  },
];

const PISTON_API = 'https://emkc.org/api/v2/piston';

const LANG_TO_PISTON: Record<string, { language: string; version: string }> = {
  Python: { language: 'python', version: '3.10.0' },
  JavaScript: { language: 'javascript', version: '18.15.0' },
  Java: { language: 'java', version: '15.0.2' },
  'C++': { language: 'c++', version: '10.2.0' },
  'Node.js': { language: 'javascript', version: '18.15.0' },
  DSA: { language: 'python', version: '3.10.0' },
  React: { language: 'javascript', version: '18.15.0' },
  SQL: { language: 'sqlite', version: '3.36.0' },
  Flutter: { language: 'dart', version: '2.19.6' },
};

const MONACO_LANG: Record<string, string> = {
  Python: 'python', JavaScript: 'javascript', Java: 'java',
  'C++': 'cpp', React: 'javascript', DSA: 'python',
  SQL: 'sql', 'Node.js': 'javascript', Flutter: 'dart',
};

// ── GROQ HELPER ───────────────────────────────────────────────────
async function askGroq(system: string, user: string): Promise<string> {
  const res = await axios.post(
    `${API}/groq/chat`,
    {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
    },
    authHeaders()
  );
  return res.data.content || '';
}

// ── FLOWCHART COMPONENT ───────────────────────────────────────────
interface FlowBlock { id: string; type: 'start' | 'process' | 'decision' | 'end'; text: string; x: number; y: number }

function FlowchartEditor({ onVerify, language, concept }: { onVerify: (score: number, feedback: string) => void; language: string; concept: string }) {
  const [blocks, setBlocks] = useState<FlowBlock[]>([
    { id: '1', type: 'start', text: 'Start', x: 160, y: 20 },
    { id: '2', type: 'end', text: 'End', x: 160, y: 300 },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const addBlock = (type: FlowBlock['type']) => {
    const newBlock: FlowBlock = {
      id: Date.now().toString(),
      type,
      text: type === 'process' ? 'Action' : type === 'decision' ? 'Yes/No?' : type,
      x: 100 + Math.random() * 100,
      y: 100 + blocks.length * 60,
    };
    setBlocks(b => [...b, newBlock]);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const block = blocks.find(b => b.id === id)!;
    setDragging(id);
    setDragOffset({ x: e.clientX - rect.left - block.x, y: e.clientY - rect.top - block.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = svgRef.current!.getBoundingClientRect();
    setBlocks(prev => prev.map(b => b.id === dragging
      ? { ...b, x: Math.max(0, Math.min(320, e.clientX - rect.left - dragOffset.x)), y: Math.max(0, Math.min(460, e.clientY - rect.top - dragOffset.y)) }
      : b
    ));
  };

  const removeBlock = (id: string) => setBlocks(b => b.filter(x => x.id !== id));

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const flowDesc = blocks.map(b => `${b.type.toUpperCase()}: "${b.text}" at position (${Math.round(b.x)},${Math.round(b.y)})`).join('\n');
      const system = `You are a logic teaching assistant for ${language}. Be encouraging but precise. Respond in JSON only: {"score": 0-15, "feedback": "string", "missing": ["array"], "correct": ["array"]}`;
      const prompt = `Concept being learned: "${concept}"\n\nStudent's flowchart blocks:\n${flowDesc}\n\nEvaluate if this flowchart logically represents the concept. Has Start and End? Correct flow? Process blocks make sense? Score 0-15.`;
      const raw = await askGroq(system, prompt);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setFeedback(parsed.feedback);
      onVerify(parsed.score, parsed.feedback);
    } catch {
      toast.error('AI verification failed, try again');
    }
    setVerifying(false);
  };

  const shapeFor = (b: FlowBlock) => {
    const cx = b.x + 60, cy = b.y + 25;
    if (b.type === 'start' || b.type === 'end')
      return <ellipse cx={cx} cy={cy} rx={55} ry={22} fill={b.type === 'start' ? '#10B981' : '#EF4444'} opacity={0.85} />;
    if (b.type === 'decision')
      return <polygon points={`${cx},${cy-22} ${cx+55},${cy} ${cx},${cy+22} ${cx-55},${cy}`} fill="#F59E0B" opacity={0.85} />;
    return <rect x={b.x + 5} y={b.y + 5} width={110} height={40} rx={6} fill="#3B82F6" opacity={0.85} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['process', 'decision'] as const).map(t => (
          <button key={t} onClick={() => addBlock(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
            style={{ background: t === 'process' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', borderColor: t === 'process' ? '#3B82F6' : '#F59E0B', color: t === 'process' ? '#93C5FD' : '#FCD34D' }}>
            + {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="text-xs text-gray-500 self-center ml-2">Drag blocks to arrange • Double-click to edit text • Click × to remove</span>
      </div>

      <svg ref={svgRef} width="100%" height="500" onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)}
        style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: dragging ? 'grabbing' : 'default' }}>
        {/* Draw arrows between blocks sorted by Y */}
        {[...blocks].sort((a, b) => a.y - b.y).map((b, i, arr) => {
          if (i === arr.length - 1) return null;
          const next = arr[i + 1];
          return <line key={`arrow-${i}`} x1={b.x + 60} y1={b.y + 50} x2={next.x + 60} y2={next.y + 5} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} markerEnd="url(#arrow)" />;
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>

        {blocks.map(b => (
          <g key={b.id} onMouseDown={e => handleMouseDown(e, b.id)} style={{ cursor: 'grab' }}>
            {shapeFor(b)}
            {editing === b.id
              ? <foreignObject x={b.x + 10} y={b.y + 10} width={100} height={30}>
                  <input autoFocus value={b.text} onChange={e => setBlocks(prev => prev.map(x => x.id === b.id ? { ...x, text: e.target.value } : x))}
                    onBlur={() => setEditing(null)} onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 11, outline: 'none', textAlign: 'center' }} />
                </foreignObject>
              : <text x={b.x + 60} y={b.y + 29} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}
                  onDoubleClick={() => setEditing(b.id)} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {b.text.length > 14 ? b.text.slice(0, 14) + '…' : b.text}
                </text>
            }
            {b.type !== 'start' && b.type !== 'end' && (
              <text x={b.x + 115} y={b.y + 8} fill="#EF4444" fontSize={13} fontWeight={700} onClick={() => removeBlock(b.id)} style={{ cursor: 'pointer' }}>×</text>
            )}
            <text x={b.x + 60} y={b.y + 42} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>{b.type}</text>
          </g>
        ))}
      </svg>

      {feedback && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }}>
          {feedback}
        </div>
      )}

      <button onClick={handleVerify} disabled={verifying || blocks.length < 3}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
        {verifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        Verify Flowchart with AI
      </button>
    </div>
  );
}

// ── DRY RUN COMPONENT ─────────────────────────────────────────────
function DryRunStep({ code, language, onVerify }: { code: string; language: string; onVerify: (score: number, feedback: string) => void }) {
  const [input, setInput] = useState('');
  const [trace, setTrace] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleVerify = async () => {
    if (!trace.trim()) return toast.error('Write your trace first!');
    setVerifying(true);
    try {
      const system = `You are a strict but encouraging programming teacher. Evaluate dry run traces. Respond in JSON only: {"score": 0-15, "feedback": "string", "correct": true/false}`;
      const prompt = `Language: ${language}\nCode:\n${code}\n\nInput used: ${input}\nStudent's dry run trace:\n${trace}\n\nIs this trace correct? Did they correctly track variables step by step? Score 0-15.`;
      const raw = await askGroq(system, prompt);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setFeedback(parsed.feedback);
      onVerify(parsed.score, parsed.feedback);
    } catch {
      toast.error('Verification failed');
    }
    setVerifying(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: '#94A3B8' }}>
        Manually trace through the code step-by-step. Track each variable's value as the code executes.
      </p>
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Test Input</label>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. n=5, arr=[1,2,3]"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0' }} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: '#64748B' }}>Your Dry Run Trace (Step by step)</label>
        <textarea value={trace} onChange={e => setTrace(e.target.value)} rows={8}
          placeholder={`Step 1: i = 0, sum = 0\nStep 2: i = 1, sum = 1\nStep 3: i = 2, sum = 3\n...and so on`}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none font-mono"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0' }} />
      </div>
      {feedback && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6EE7B7' }}>
          {feedback}
        </div>
      )}
      <button onClick={handleVerify} disabled={verifying}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff' }}>
        {verifying ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
        AI Verify Trace
      </button>
    </div>
  );
}

// ── SCORE DISPLAY ─────────────────────────────────────────────────
function ScoreBar({ step, score, maxScore }: { step: typeof STEPS[0]; score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20 truncate" style={{ color: '#64748B' }}>{step.emoji} {step.label}</span>
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }} />
      </div>
      <span className="text-xs font-mono w-12 text-right" style={{ color: '#94A3B8' }}>{score}/{maxScore}</span>
    </div>
  );
}

// ── CALENDAR HEATMAP ──────────────────────────────────────────────
function CalendarHeatmap({ completedSteps }: { completedSteps: any[] }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
  const activeSet = new Set(completedSteps.map(s => s.date?.split('T')[0]).filter(Boolean));

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Last 30 days</p>
      <div className="flex flex-wrap gap-1">
        {days.map(d => (
          <div key={d} title={d}
            className="w-4 h-4 rounded-sm transition-colors"
            style={{ background: activeSet.has(d) ? '#10B981' : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export function LogicBuilder() {
  const [lang, setLang] = useState<string>(() => localStorage.getItem('hx_logic_lang') || '');
  const [step, setStep] = useState(0);
  const [dayData, setDayData] = useState<any>(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [stepScores, setStepScores] = useState<Record<number, number>>({});
  const [stepFeedback, setStepFeedback] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [activeTab, setActiveTab] = useState<'journey' | 'progress'>('journey');

  // Step state
  const [conceptExplain, setConceptExplain] = useState('');
  const [pseudocode, setPseudocode] = useState('');
  const [code, setCode] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [edgeCases, setEdgeCases] = useState<string[]>([]);
  const [edgeAnswers, setEdgeAnswers] = useState<Record<number, string>>({});

  // Load progress from backend
  useEffect(() => {
    axios.get(`${API}/logic-builder/progress`, authHeaders())
      .then(r => {
        const d = r.data.data;
        if (d) {
          setProgress(d);
          if (d.language && !lang) {
            setLang(d.language);
            localStorage.setItem('hx_logic_lang', d.language);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProgress(false));
  }, []);

  // Generate day content when lang is set
  useEffect(() => {
    if (!lang) return;
    const cached = sessionStorage.getItem(`hx_logic_day_${lang}`);
    if (cached) { setDayData(JSON.parse(cached)); return; }
    generateDayContent();
  }, [lang]);

  const generateDayContent = async () => {
    if (!lang) return;
    setLoadingDay(true);
    try {
      const day = progress?.current_day || 1;
      const system = `You are a programming teacher for ${lang}. Generate a daily concept lesson. Respond ONLY in JSON, no markdown:\n{"concept":"string","definition":"string","analogy":"string","codeExample":"string","problem":"string","hint":"string"}`;
      const prompt = `Day ${day} lesson for ${lang}. Give a fundamental concept appropriate for day ${day} (Day 1=variables, Day 2=conditionals, Day 3=loops, Day 4=functions, etc. Scale appropriately). Make the problem realistic and solvable in 10-20 lines.`;
      const raw = await askGroq(system, prompt);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setDayData(parsed);
      sessionStorage.setItem(`hx_logic_day_${lang}`, JSON.stringify(parsed));
    } catch {
      toast.error('Failed to generate today\'s concept');
    }
    setLoadingDay(false);
  };

  const saveProgress = useCallback(async (newScores: Record<number, number>, newCompleted: number[]) => {
    const total = Object.values(newScores).reduce((a, b) => a + b, 0);
    const maxTotal = STEPS.reduce((a, s) => a + s.maxScore, 0);
    const normalized = Math.round((total / maxTotal) * 100);
    try {
      await axios.post(`${API}/logic-builder/progress`, {
        language: lang,
        current_day: progress?.current_day || 1,
        streak: (progress?.streak || 0),
        total_score: normalized,
        completed_steps: newCompleted.map(s => ({ step: s, date: new Date().toISOString() })),
      }, authHeaders());
    } catch {}
  }, [lang, progress]);

  const selectLang = (l: string) => {
    setLang(l);
    localStorage.setItem('hx_logic_lang', l);
    setDayData(null);
    sessionStorage.removeItem(`hx_logic_day_${l}`);
  };

  const markStepDone = (stepId: number, score: number, feedback: string) => {
    const newScores = { ...stepScores, [stepId]: score };
    const newCompleted = completedSteps.includes(stepId) ? completedSteps : [...completedSteps, stepId];
    setStepScores(newScores);
    setStepFeedback(prev => ({ ...prev, [stepId]: feedback }));
    setCompletedSteps(newCompleted);
    saveProgress(newScores, newCompleted);
    toast.success(`Step scored ${score}/${STEPS[stepId].maxScore}! 🎉`);
  };

  // ── AI Step Handlers ──
  const verifyConceptExplain = async () => {
    if (!conceptExplain.trim()) return toast.error('Write your explanation first!');
    setAiLoading(true); setAiFeedback('');
    try {
      const system = `You are a programming teacher. Evaluate student's explanation. JSON only: {"score":0-15,"feedback":"string","correct":true/false,"missing":["array"]}`;
      const prompt = `Concept: "${dayData?.concept}" in ${lang}\nDefinition: "${dayData?.definition}"\n\nStudent's explanation in their own words:\n"${conceptExplain}"\n\nDid they understand the concept? Score 0-15.`;
      const raw = await askGroq(system, prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setAiFeedback(parsed.feedback);
      markStepDone(0, parsed.score, parsed.feedback);
    } catch { toast.error('AI check failed'); }
    setAiLoading(false);
  };

  const verifyPseudocode = async () => {
    if (!pseudocode.trim()) return toast.error('Write your pseudocode first!');
    setAiLoading(true); setAiFeedback('');
    try {
      const system = `You are a programming logic teacher. Evaluate pseudocode. JSON only: {"score":0-20,"feedback":"string","missing":["steps"],"correct":["steps"]}`;
      const prompt = `Problem: "${dayData?.problem}"\nLanguage context: ${lang}\n\nStudent's pseudocode/logic steps:\n${pseudocode}\n\nAre the logical steps correct and complete? Score 0-20.`;
      const raw = await askGroq(system, prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setAiFeedback(parsed.feedback);
      markStepDone(1, parsed.score, parsed.feedback);
    } catch { toast.error('AI check failed'); }
    setAiLoading(false);
  };

  const runAndEvaluateCode = async () => {
    if (!code.trim()) return toast.error('Write your code first!');
    setAiLoading(true); setAiFeedback('');
    try {
      // Run with Piston
      let executionResult = '';
      const pistonLang = LANG_TO_PISTON[lang] || { language: 'python', version: '3.10.0' };
      if (pistonLang) {
        try {
          const r = await axios.post(`${PISTON_API}/execute`, {
            language: pistonLang.language,
            version: pistonLang.version,
            files: [{ content: code }],
          });
          executionResult = r.data.run?.output || r.data.run?.stderr || 'No output';
        } catch { executionResult = 'Execution unavailable'; }
      }

      // AI evaluate
      const system = `You are a code reviewer. JSON only: {"score":0-25,"feedback":"string","issues":["array"],"executionCorrect":true/false}`;
      const prompt = `Problem: "${dayData?.problem}"\nLanguage: ${lang}\n\nStudent's code:\n${code}\n\nExecution output: ${executionResult}\n\nEvaluate logic correctness, code quality, efficiency. Score 0-25.`;
      const raw = await askGroq(system, prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setAiFeedback(`${parsed.feedback}\n\nExecution: ${executionResult}`);
      markStepDone(3, parsed.score, parsed.feedback);
    } catch { toast.error('Evaluation failed'); }
    setAiLoading(false);
  };

  const generateEdgeCases = async () => {
    setAiLoading(true);
    try {
      const system = `Generate 3 edge cases for a programming problem. JSON only: {"edgeCases":["case1","case2","case3"]}`;
      const prompt = `Problem: "${dayData?.problem}" in ${lang}. Generate 3 edge cases the student must handle (empty input, large numbers, null values, etc.)`;
      const raw = await askGroq(system, prompt);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setEdgeCases(parsed.edgeCases || []);
    } catch { toast.error('Failed to generate edge cases'); }
    setAiLoading(false);
  };

  const verifyEdgeCases = async () => {
    if (Object.keys(edgeAnswers).length < edgeCases.length) return toast.error('Answer all edge cases!');
    setAiLoading(true);
    try {
      const answersText = edgeCases.map((ec, i) => `Edge case: ${ec}\nStudent answer: ${edgeAnswers[i] || '(no answer)'}`).join('\n\n');
      const system = `Evaluate edge case understanding. JSON only: {"score":0-10,"feedback":"string","results":[{"correct":true/false,"comment":"string"}]}`;
      const raw = await askGroq(system, `Problem: "${dayData?.problem}"\n\n${answersText}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setAiFeedback(parsed.feedback);
      markStepDone(5, parsed.score, parsed.feedback);
    } catch { toast.error('Verification failed'); }
    setAiLoading(false);
  };

  const totalScore = Object.values(stepScores).reduce((a, b) => a + b, 0);
  const maxScore = STEPS.reduce((a, s) => a + s.maxScore, 0);
  const scorePercent = Math.round((totalScore / maxScore) * 100);
  const badge = [...BADGES].reverse().find(b => scorePercent >= b.minScore) || BADGES[0];
  const currentLang = LANGUAGES.find(l => l.id === lang);
  const currentDay = progress?.current_day || 1;

  // ── LANGUAGE SELECT SCREEN ────────────────────────────────────
  if (!lang) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-bold"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}>
            <Brain size={12} /> THINK BEFORE YOU CODE
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Logic Building Journey</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Choose your language. Learn by thinking first, coding second.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => selectLang(l.id)}
              className="p-4 rounded-2xl border text-left transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = l.color; (e.currentTarget as HTMLElement).style.background = `${l.color}15`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}>
              <div className="text-2xl mb-2">{l.emoji}</div>
              <div className="font-bold text-white text-sm">{l.id}</div>
              <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────
  if (loadingDay) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="animate-spin" style={{ color: '#6366F1' }} />
        <p className="text-sm" style={{ color: '#64748B' }}>AI is preparing Day {currentDay} for {lang}…</p>
      </div>
    );
  }

  // ── MAIN JOURNEY UI ───────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setLang('')} className="text-xs px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
            ← Change Language
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: `${currentLang?.color}15`, border: `1px solid ${currentLang?.color}40` }}>
            <span>{currentLang?.emoji}</span>
            <span className="text-sm font-bold" style={{ color: currentLang?.color }}>{lang}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Flame size={12} style={{ color: '#EF4444' }} />
            <span className="text-xs font-bold" style={{ color: '#EF4444' }}>{progress?.streak || 0} day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['journey', 'progress'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition capitalize"
              style={{ background: activeTab === t ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: activeTab === t ? '#818CF8' : '#64748B', border: activeTab === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent' }}>
              {t === 'journey' ? '🧠 Journey' : '📊 Progress'}
            </button>
          ))}
        </div>
      </div>

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {/* Badge + Score */}
          <div className="rounded-2xl p-6 flex items-center gap-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-5xl">{badge.emoji}</div>
            <div className="flex-1">
              <div className="text-xs font-bold mb-1" style={{ color: '#64748B' }}>CURRENT BADGE</div>
              <div className="text-xl font-black text-white">{badge.label}</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${scorePercent}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }} />
                </div>
                <span className="text-sm font-black text-white">{scorePercent}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">{currentDay}</div>
              <div className="text-xs" style={{ color: '#64748B' }}>Day</div>
            </div>
          </div>

          {/* Badge progression */}
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(b => {
              const unlocked = scorePercent >= b.minScore;
              return (
                <div key={b.id} className="rounded-xl p-3 text-center"
                  style={{ background: unlocked ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: unlocked ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', opacity: unlocked ? 1 : 0.5 }}>
                  <div className="text-2xl mb-1">{b.emoji}</div>
                  <div className="text-xs font-bold" style={{ color: unlocked ? '#A5B4FC' : '#475569' }}>{b.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{b.minScore}+ pts</div>
                </div>
              );
            })}
          </div>

          {/* Step scores */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4">Today's Step Scores</h3>
            {STEPS.map(s => <ScoreBar key={s.id} step={s} score={stepScores[s.id] || 0} maxScore={s.maxScore} />)}
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-sm font-bold" style={{ color: '#818CF8' }}>{totalScore}/{maxScore}</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Calendar size={14} /> Activity Calendar</h3>
            <CalendarHeatmap completedSteps={progress?.completed_steps || []} />
          </div>
        </div>
      )}

      {/* JOURNEY TAB */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          {/* Day card */}
          {dayData && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  DAY {currentDay} CONCEPT
                </span>
                <button onClick={generateDayContent} className="text-xs flex items-center gap-1" style={{ color: '#64748B' }}>
                  <RotateCcw size={11} /> Regenerate
                </button>
              </div>
              <h2 className="text-xl font-black text-white mb-1">{dayData.concept}</h2>
              <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>{dayData.definition}</p>
              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb size={12} style={{ color: '#F59E0B' }} />
                  <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>Real-life Analogy</span>
                </div>
                <p className="text-sm" style={{ color: '#FCD34D' }}>{dayData.analogy}</p>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Code2 size={12} style={{ color: '#64748B' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>Code Example</span>
                </div>
                <pre className="px-4 py-3 text-xs overflow-x-auto" style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{dayData.codeExample}</pre>
              </div>
            </div>
          )}

          {/* Step tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const done = completedSteps.includes(s.id);
              const locked = i > 0 && !completedSteps.includes(i - 1) && !done;
              return (
                <button key={s.id} onClick={() => !locked && setStep(s.id)} disabled={locked}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
                  style={{
                    background: step === s.id ? 'rgba(99,102,241,0.2)' : done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                    border: step === s.id ? '1px solid rgba(99,102,241,0.5)' : done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    color: step === s.id ? '#818CF8' : done ? '#10B981' : locked ? '#334155' : '#64748B',
                    cursor: locked ? 'not-allowed' : 'pointer',
                  }}>
                  {done ? <CheckCircle2 size={11} /> : locked ? <Lock size={11} /> : <s.icon size={11} />}
                  {s.emoji} {s.label}
                  {done && <span className="font-mono">{stepScores[s.id]}/{s.maxScore}</span>}
                </button>
              );
            })}
          </div>

          {/* Step content */}
          {dayData && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{STEPS[step].emoji}</span>
                <h3 className="font-black text-white">Step {step + 1}: {STEPS[step].label}</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B' }}>
                  Max {STEPS[step].maxScore} pts
                </span>
              </div>

              {/* ── Step 0: Concept ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#818CF8' }}>📋 Today's Problem</p>
                    <p className="text-sm" style={{ color: '#E2E8F0' }}>{dayData.problem}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Explain "{dayData.concept}" in your own words</label>
                    <textarea value={conceptExplain} onChange={e => setConceptExplain(e.target.value)} rows={5}
                      placeholder="Aapne jo padha usse apne words mein samjhao... What is it? When do we use it? Why is it important?"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0' }} />
                  </div>
                  {aiFeedback && (
                    <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                      {aiFeedback}
                    </div>
                  )}
                  <button onClick={verifyConceptExplain} disabled={aiLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff' }}>
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                    AI Verify My Understanding
                  </button>
                </div>
              )}

              {/* ── Step 1: Pseudocode ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#818CF8' }}>📋 Problem to Solve</p>
                    <p className="text-sm" style={{ color: '#E2E8F0' }}>{dayData.problem}</p>
                    <p className="text-xs mt-2" style={{ color: '#475569' }}>Hint: {dayData.hint}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Write step-by-step logic in plain Hindi/English (No code!)</label>
                    <textarea value={pseudocode} onChange={e => setPseudocode(e.target.value)} rows={8}
                      placeholder={`Step 1: Start\nStep 2: Input lena\nStep 3: Check karo ki...\nStep 4: Agar condition true ho toh...\nStep 5: Result print karo\nStep 6: End`}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono transition"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0' }} />
                  </div>
                  {aiFeedback && (
                    <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                      {aiFeedback}
                    </div>
                  )}
                  <button onClick={verifyPseudocode} disabled={aiLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: '#fff' }}>
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                    AI Check My Logic
                  </button>
                </div>
              )}

              {/* ── Step 2: Flowchart ── */}
              {step === 2 && (
                <FlowchartEditor
                  onVerify={(score, fb) => markStepDone(2, score, fb)}
                  language={lang}
                  concept={dayData.concept}
                />
              )}

              {/* ── Step 3: Code ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#818CF8' }}>📋 Problem</p>
                    <p className="text-sm" style={{ color: '#E2E8F0' }}>{dayData.problem}</p>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Editor
                      height="280px"
                      language={MONACO_LANG[lang] || 'python'}
                      value={code}
                      onChange={v => setCode(v || '')}
                      theme="vs-dark"
                      options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  </div>
                  {aiFeedback && (
                    <div className="p-4 rounded-xl text-sm whitespace-pre-wrap" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                      {aiFeedback}
                    </div>
                  )}
                  <button onClick={runAndEvaluateCode} disabled={aiLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    Run & AI Evaluate
                  </button>
                </div>
              )}

              {/* ── Step 4: Dry Run ── */}
              {step === 4 && (
                <DryRunStep
                  code={code || dayData.codeExample}
                  language={lang}
                  onVerify={(score, fb) => markStepDone(4, score, fb)}
                />
              )}

              {/* ── Step 5: Edge Cases ── */}
              {step === 5 && (
                <div className="space-y-4">
                  {edgeCases.length === 0 ? (
                    <button onClick={generateEdgeCases} disabled={aiLoading}
                      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff' }}>
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                      Generate 3 Edge Cases
                    </button>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {edgeCases.map((ec, i) => (
                          <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-start gap-2 mb-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>{i + 1}</span>
                              <p className="text-sm" style={{ color: '#E2E8F0' }}>{ec}</p>
                            </div>
                            <textarea value={edgeAnswers[i] || ''} onChange={e => setEdgeAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                              rows={2} placeholder="Will your code handle this? How? (Yes/No + explanation)"
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#E2E8F0' }} />
                          </div>
                        ))}
                      </div>
                      {aiFeedback && (
                        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                          {aiFeedback}
                        </div>
                      )}
                      <button onClick={verifyEdgeCases} disabled={aiLoading}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: '#fff' }}>
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                        AI Verify Edge Case Handling
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                  <ChevronLeft size={12} /> Previous
                </button>
                <span className="text-xs" style={{ color: '#475569' }}>{step + 1} / {STEPS.length}</span>
                {step < STEPS.length - 1 ? (
                  <button onClick={() => setStep(s => s + 1)} disabled={!completedSteps.includes(step)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-30"
                    style={{ background: completedSteps.includes(step) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', color: completedSteps.includes(step) ? '#818CF8' : '#475569', border: completedSteps.includes(step) ? '1px solid rgba(99,102,241,0.4)' : 'none' }}>
                    Next <ChevronRight size={12} />
                  </button>
                ) : (
                  completedSteps.length === STEPS.length && (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <Trophy size={12} /> Day Complete! {scorePercent}%
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
