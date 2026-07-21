// src/pages/student/StudentResumeBuilder.tsx
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Zap, Download, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles, Target, Brain, Plus, Briefcase, MessageSquare, Linkedin, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

// ── ATS Keywords Database ─────────────────────────────────────────
const ATS_KEYWORDS: Record<string, string[]> = {
  'Python Developer': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'postgresql', 'mongodb', 'docker', 'aws', 'rest api', 'git', 'agile', 'ci/cd', 'unit testing', 'microservices'],
  'React Developer': ['react', 'typescript', 'javascript', 'node.js', 'redux', 'tailwind', 'next.js', 'graphql', 'rest api', 'webpack', 'vite', 'jest', 'git', 'agile', 'responsive design', 'html', 'css', 'figma'],
  'Java Developer': ['java', 'spring boot', 'hibernate', 'microservices', 'maven', 'gradle', 'mysql', 'postgresql', 'docker', 'kubernetes', 'aws', 'rest api', 'junit', 'git', 'agile', 'ci/cd', 'multithreading', 'design patterns'],
  'Data Scientist': ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'sql', 'tableau', 'power bi', 'statistics', 'nlp', 'computer vision', 'feature engineering', 'model deployment', 'r', 'spark', 'hadoop'],
  'Full Stack Developer': ['react', 'node.js', 'javascript', 'typescript', 'mongodb', 'postgresql', 'docker', 'aws', 'rest api', 'graphql', 'git', 'agile', 'html', 'css', 'redis', 'microservices', 'ci/cd', 'tailwind'],
  'DevOps Engineer': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'linux', 'bash', 'python', 'git', 'prometheus', 'grafana', 'nginx', 'helm', 'monitoring'],
  'UI/UX Designer': ['figma', 'adobe xd', 'sketch', 'user research', 'wireframing', 'prototyping', 'usability testing', 'design system', 'responsive design', 'html', 'css', 'adobe illustrator', 'user journey', 'accessibility', 'interaction design'],
  'Data Analyst': ['sql', 'python', 'excel', 'tableau', 'power bi', 'pandas', 'statistics', 'data visualization', 'r', 'google analytics', 'a/b testing', 'reporting', 'data cleaning', 'mysql', 'postgresql'],
  'Android Developer': ['android', 'kotlin', 'java', 'jetpack compose', 'mvvm', 'retrofit', 'room', 'firebase', 'google play', 'rest api', 'git', 'xml', 'coroutines', 'hilt', 'material design'],
  'iOS Developer': ['swift', 'objective-c', 'xcode', 'uikit', 'swiftui', 'core data', 'cocoapods', 'rest api', 'git', 'firebase', 'mvvm', 'app store', 'combine', 'auto layout'],
};

const ACTION_VERBS = ['developed', 'built', 'designed', 'implemented', 'led', 'managed', 'created', 'optimized', 'increased', 'reduced', 'improved', 'delivered', 'launched', 'architected', 'collaborated', 'mentored', 'achieved', 'automated', 'deployed', 'integrated', 'scaled', 'migrated', 'refactored', 'tested'];
const SECTIONS = ['education', 'experience', 'skills', 'contact', 'projects', 'certifications'];

interface ATSScore {
  total: number;
  breakdown: { name: string; score: number; max: number; issues: string[] }[];
}
interface AIAnalysis {
  missingKeywords: string[];
  weakSentences: string[];
  suggestions: string[];
  jobRoleMatch: number;
  summary: string;
}

// ── ATS Calculator ────────────────────────────────────────────────
function calculateATS(text: string, role: string): ATSScore {
  const lower = text.toLowerCase();
  const keywords = ATS_KEYWORDS[role] || [];
  const kwScore = keywords.length > 0 ? Math.round((keywords.filter(k => lower.includes(k)).length / keywords.length) * 30) : 15;
  const kwIssues = keywords.filter(k => !lower.includes(k)).slice(0, 5).map(k => `Missing keyword: "${k}"`);
  const foundSections = SECTIONS.filter(s => lower.includes(s));
  const secScore = Math.round((foundSections.length / SECTIONS.length) * 25);
  const secIssues = SECTIONS.filter(s => !lower.includes(s)).map(s => `Missing section: ${s}`);
  const foundVerbs = ACTION_VERBS.filter(v => lower.includes(v));
  const verbScore = Math.min(20, Math.round((foundVerbs.length / 8) * 20));
  const verbIssues = foundVerbs.length < 5 ? [`Only ${foundVerbs.length} action verbs found. Add: ${ACTION_VERBS.slice(0,3).join(', ')}`] : [];
  const numbers = (text.match(/\d+%|\d+\+|\$\d+|\d+ (users|projects|team|years|months)/gi) || []).length;
  const quantScore = Math.min(15, numbers * 3);
  const quantIssues = numbers < 3 ? ['Add quantified results (e.g. "Increased performance by 40%")'] : [];
  const lines = text.split('\n').filter(l => l.trim());
  const formatScore = Math.min(10, Math.round((lines.length / 20) * 10));
  const formatIssues = lines.length < 20 ? ['Resume seems short. Add more details.'] : [];
  return {
    total: kwScore + secScore + verbScore + quantScore + formatScore,
    breakdown: [
      { name: 'Keywords Match', score: kwScore, max: 30, issues: kwIssues },
      { name: 'Section Completeness', score: secScore, max: 25, issues: secIssues },
      { name: 'Action Verbs', score: verbScore, max: 20, issues: verbIssues },
      { name: 'Quantified Results', score: quantScore, max: 15, issues: quantIssues },
      { name: 'Formatting', score: formatScore, max: 10, issues: formatIssues },
    ],
  };
}

// ── Circular Score ────────────────────────────────────────────────
function CircularScore({ score }: { score: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const color = score >= 71 ? '#22c55e' : score >= 41 ? '#f59e0b' : '#ef4444';
  const label = score >= 71 ? 'Excellent' : score >= 41 ? 'Needs Work' : 'Poor';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="130" height="130" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{ transition: 'all 1s ease' }} />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">/100</text>
      </svg>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

const GLASS = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
const ACCENT = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

// ── Main Component ────────────────────────────────────────────────
export function StudentResumeBuilder() {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [role, setRole] = useState('React Developer');
  const [customRole, setCustomRole] = useState('');
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');
  const [activeTab, setActiveTab] = useState<'scan' | 'build' | 'advanced'>('scan');
  const [activeAdvanced, setActiveAdvanced] = useState<'jd' | 'cover' | 'interview' | 'linkedin'>('jd');
  const [jdText, setJdText] = useState('');
  const [jdResult, setJdResult] = useState('');
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [builder, setBuilder] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '',
    summary: '', objective: '',
    experience: '', education: '', skills: '', projects: '', certifications: '',
    languages: '', achievements: '', hobbies: '', references: '',
    photo: '',
  });

  const effectiveRole = showCustomRole && customRole.trim() ? customRole.trim() : role;

  // ── File Parse ───────────────────────────────────────────────
  const parseFile = async (file: File) => {
    setFileName(file.name);
    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      toast('Extracting PDF text...', { duration: 2000 });
      try {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await fetch(`${API_URL}/public/extract-pdf`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.text?.length > 50) {
          setResumeText(data.text);
          toast.success('PDF parsed successfully!');
        } else {
          toast.error('Could not extract text. Please paste your resume below.');
        }
      } catch { toast.error('PDF parse failed. Please paste resume text below.'); }
    } else {
      setResumeText(await file.text());
      toast.success('Resume loaded!');
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  // ── ATS Scan ─────────────────────────────────────────────────
  const handleScan = () => {
    if (!resumeText.trim()) { toast.error('Upload or paste resume first'); return; }
    setScanning(true);
    setTimeout(() => { setAtsScore(calculateATS(resumeText, effectiveRole)); setScanning(false); toast.success('ATS scan complete!'); }, 1200);
  };

  // ── Groq Call ────────────────────────────────────────────────
  const groqCall = async (prompt: string, system: string) => {
    const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
    const res = await fetch(`${API_URL}/groq/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], system }),
    });
    const data = await res.json();
    return data.content || '';
  };

  // ── AI Analysis ───────────────────────────────────────────────
  const handleAIAnalysis = async () => {
    if (!resumeText.trim()) { toast.error('Upload resume first'); return; }
    setAnalyzing(true);
    try {
      const raw = await groqCall(
        `Analyze this resume for ${effectiveRole}. Return ONLY valid JSON:\n{"missingKeywords":["kw1"],"weakSentences":["sent1"],"suggestions":["sug1","sug2","sug3","sug4","sug5"],"jobRoleMatch":75,"summary":"2-3 line assessment"}\n\nResume:\n${resumeText.slice(0,2000)}`,
        'You are an expert ATS resume analyzer. Always respond with valid JSON only, no markdown, no extra text.'
      );
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setAiAnalysis(parsed);
      toast.success('AI analysis complete!');
    } catch { toast.error('AI analysis failed. Try again.'); }
    finally { setAnalyzing(false); }
  };

  // ── Advanced Features ─────────────────────────────────────────
  const handleAdvanced = async (type: string) => {
    if (!resumeText.trim() && type !== 'linkedin') { toast.error('Upload resume first'); return; }
    if (type === 'jd' && !jdText.trim()) { toast.error('Paste job description first'); return; }
    setAdvancedLoading(true);
    setJdResult('');
    try {
      let prompt = '';
      let system = 'You are an expert career coach and resume writer.';
      if (type === 'jd') {
        prompt = `Compare this resume with the job description and provide:\n1. Match percentage\n2. Missing keywords from JD\n3. Skills to add\n4. How to tailor the resume\n\nResume:\n${resumeText.slice(0,1500)}\n\nJob Description:\n${jdText.slice(0,1000)}`;
      } else if (type === 'cover') {
        prompt = `Write a professional cover letter for ${effectiveRole} role based on this resume. Make it compelling, 3 paragraphs, personalized.\n\nResume:\n${resumeText.slice(0,1500)}`;
      } else if (type === 'interview') {
        prompt = `Based on this resume for ${effectiveRole} role, generate 10 likely interview questions with brief answer tips for each.\n\nResume:\n${resumeText.slice(0,1500)}`;
      } else if (type === 'linkedin') {
        prompt = `Write a compelling LinkedIn "About" section (300 words) for a ${effectiveRole}. Professional, first person, engaging.\n\nResume:\n${resumeText.slice(0,1000)}`;
      }
      const result = await groqCall(prompt, system);
      setJdResult(result);
    } catch { toast.error('Failed. Try again.'); }
    finally { setAdvancedLoading(false); }
  };

  // ── PDF Download ──────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!builder.name) { toast.error('Add your name first'); return; }
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 18; let y = 22; const pw = 174;

      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(builder.name, margin, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      const contactLine = [builder.email, builder.phone, builder.location, builder.website].filter(Boolean).join('  |  ');
      doc.text(contactLine, margin, 20);
      if (builder.linkedin || builder.github) {
        doc.text([builder.linkedin, builder.github].filter(Boolean).join('  |  '), margin, 26);
      }
      y = 36;

      const addSection = (title: string, content: string) => {
        if (!content.trim()) return;
        if (y > 265) { doc.addPage(); y = 18; }
        // Bold section heading with underline
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(99, 102, 241);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.3);
        doc.line(margin, y + 1, margin + pw, y + 1);
        y += 6;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(content, pw);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 18; }
          doc.text(line, margin, y); y += 4.5;
        });
        y += 3;
      };

      if (builder.summary) addSection('Professional Summary', builder.summary);
      if (builder.objective) addSection('Objective', builder.objective);
      addSection('Experience', builder.experience);
      addSection('Education', builder.education);
      addSection('Skills', builder.skills);
      addSection('Projects', builder.projects);
      addSection('Certifications', builder.certifications);
      addSection('Achievements', builder.achievements);
      addSection('Languages', builder.languages);
      if (builder.hobbies) addSection('Hobbies & Interests', builder.hobbies);
      if (builder.references) addSection('References', builder.references);

      doc.save(`${builder.name.replace(/\s+/g, '_')}_Resume.pdf`);
      toast.success('Resume downloaded!');
    } catch (e) { toast.error('PDF generation failed'); }
  };

  const bStyle = (active: boolean) => ({
    background: active ? ACCENT : 'rgba(255,255,255,0.05)',
    color: active ? 'white' : 'rgba(255,255,255,0.5)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
  });

  const BUILDER_SECTIONS = [
    { key: 'personal', label: '👤 Personal Info', isPersonal: true },
    { key: 'summary', label: '📝 Professional Summary', rows: 3 },
    { key: 'objective', label: '🎯 Career Objective', rows: 2 },
    { key: 'experience', label: '💼 Work Experience', rows: 6 },
    { key: 'education', label: '🎓 Education', rows: 3 },
    { key: 'skills', label: '⚡ Technical Skills', rows: 2 },
    { key: 'projects', label: '🚀 Projects', rows: 5 },
    { key: 'certifications', label: '🏆 Certifications', rows: 2 },
    { key: 'achievements', label: '🥇 Achievements & Awards', rows: 3 },
    { key: 'languages', label: '🌐 Languages', rows: 1 },
    { key: 'hobbies', label: '🎨 Hobbies & Interests', rows: 2 },
    { key: 'references', label: '📋 References', rows: 2 },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0a0f1e' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ACCENT }}>
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Hiresnix Resume AI</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Get ATS Ready in Minutes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ id: 'scan', label: '🔍 ATS Scanner' }, { id: 'build', label: '✏️ Resume Builder' }, { id: 'advanced', label: '🤖 AI Tools' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={bStyle(activeTab === t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── ATS SCANNER ── */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">

            {/* Role Selector */}
            <div className="rounded-2xl p-4" style={GLASS}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>TARGET JOB ROLE</label>
              <div className="flex gap-2">
                <select value={role} onChange={e => { setRole(e.target.value); setShowCustomRole(false); }}
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  {Object.keys(ATS_KEYWORDS).map(r => <option key={r} value={r} style={{ background: '#1a1f35' }}>{r}</option>)}
                </select>
                <button onClick={() => setShowCustomRole(!showCustomRole)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                  style={{ background: showCustomRole ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Plus size={13} /> Custom
                </button>
              </div>
              {showCustomRole && (
                <input className="mt-2 w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.4)' }}
                  placeholder="e.g. Flutter Developer, ML Engineer..."
                  value={customRole} onChange={e => setCustomRole(e.target.value)} />
              )}
            </div>

            {/* Drop Zone */}
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onDrop={onDrop} onClick={() => fileRef.current?.click()}
              className="rounded-2xl p-6 text-center cursor-pointer transition-all"
              style={{ background: dragging ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)', border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.1)'}` }}>
              <Upload size={26} className="mx-auto mb-2" style={{ color: dragging ? '#6366f1' : 'rgba(255,255,255,0.25)' }} />
              <p className="text-sm font-medium text-white">{fileName || 'Drop your resume here'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>PDF or DOC • Click to browse</p>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </div>

            {/* Textarea */}
            <div className="rounded-2xl p-4" style={GLASS}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>OR PASTE RESUME TEXT</label>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..." rows={7}
                className="w-full text-sm outline-none resize-none rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={handleScan} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: ACCENT, color: 'white', opacity: scanning ? 0.7 : 1 }}>
                {scanning ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
                {scanning ? 'Scanning...' : 'ATS Scan'}
              </button>
              <button onClick={handleAIAnalysis} disabled={analyzing}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', opacity: analyzing ? 0.7 : 1 }}>
                {analyzing ? <RefreshCw size={15} className="animate-spin" /> : <Brain size={15} />}
                {analyzing ? 'Analyzing...' : 'AI Analysis'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {atsScore ? (
              <div className="rounded-2xl p-5" style={GLASS}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">ATS Score</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{effectiveRole}</p>
                  </div>
                  <CircularScore score={atsScore.total} />
                </div>
                <div className="space-y-3">
                  {atsScore.breakdown.map(item => (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.name}</span>
                        <span className="font-semibold" style={{ color: item.score >= item.max * 0.7 ? '#22c55e' : item.score >= item.max * 0.4 ? '#f59e0b' : '#ef4444' }}>{item.score}/{item.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(item.score / item.max) * 100}%`, background: ACCENT }} />
                      </div>
                      {item.issues.slice(0, 2).map((issue, i) => (
                        <p key={i} className="text-xs mt-0.5 flex items-start gap-1" style={{ color: '#f87171' }}>
                          <XCircle size={10} className="mt-0.5 flex-shrink-0" />{issue}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-10 text-center" style={GLASS}>
                <Target size={36} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.12)' }} />
                <p className="text-sm font-medium text-white">Upload your resume</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Get ATS score and AI suggestions</p>
              </div>
            )}

            {aiAnalysis && (
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} style={{ color: '#a5b4fc' }} />
                  <h3 className="font-bold text-white text-sm">AI Analysis</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>{aiAnalysis.jobRoleMatch}% Match</span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{aiAnalysis.summary}</p>
                {aiAnalysis.missingKeywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#f87171' }}>❌ Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiAnalysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {aiAnalysis.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#34d399' }}>✅ Suggestions</p>
                    <ul className="space-y-1">
                      {aiAnalysis.suggestions.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                          <CheckCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiAnalysis.weakSentences?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#f59e0b' }}>⚠️ Weak Sentences</p>
                    {aiAnalysis.weakSentences.map((s, i) => <p key={i} className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>• {s}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESUME BUILDER ── */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            {BUILDER_SECTIONS.map(section => (
              <div key={section.key} className="rounded-2xl overflow-hidden" style={GLASS}>
                <button onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  className="w-full flex items-center justify-between p-3.5 text-left">
                  <span className="text-sm font-semibold text-white">{section.label}</span>
                  {expandedSection === section.key ? <ChevronUp size={15} style={{ color: 'rgba(255,255,255,0.35)' }} /> : <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.35)' }} />}
                </button>
                {expandedSection === section.key && (
                  <div className="px-4 pb-4">
                    {section.isPersonal ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'name', label: 'Full Name', full: true },
                          { key: 'email', label: 'Email' },
                          { key: 'phone', label: 'Phone' },
                          { key: 'location', label: 'Location (City, State)' },
                          { key: 'linkedin', label: 'LinkedIn URL' },
                          { key: 'github', label: 'GitHub URL' },
                          { key: 'website', label: 'Portfolio / Website', full: true },
                        ].map(f => (
                          <input key={f.key} placeholder={f.label}
                            className={`rounded-xl px-3 py-2 text-sm text-white outline-none ${f.full ? 'col-span-2' : ''}`}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            value={builder[f.key as keyof typeof builder]}
                            onChange={e => setBuilder(p => ({ ...p, [f.key]: e.target.value }))} />
                        ))}
                      </div>
                    ) : (
                      <textarea rows={(section as any).rows || 3}
                        value={builder[section.key as keyof typeof builder]}
                        onChange={e => setBuilder(p => ({ ...p, [section.key]: e.target.value }))}
                        placeholder={`Enter your ${section.label.replace(/[^\w\s]/g, '').trim()}...`}
                        className="w-full text-sm outline-none resize-none rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
                    )}
                  </div>
                )}
              </div>
            ))}
            <button onClick={downloadPDF}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm"
              style={{ background: ACCENT, color: 'white' }}>
              <Download size={16} /> Download PDF Resume
            </button>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl p-4" style={GLASS}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">📄 Live Preview</h3>
              {builder.name && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  ATS: {calculateATS(Object.values(builder).join(' '), effectiveRole).total}/100
                </span>
              )}
            </div>
            <div className="rounded-xl p-4 overflow-y-auto" style={{ background: 'white', minHeight: '500px', maxHeight: '70vh', fontFamily: 'serif', fontSize: '11px' }}>
              {builder.name ? (
                <>
                  <div className="p-3 mb-3 rounded" style={{ background: '#6366f1' }}>
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{builder.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '9px', margin: '2px 0 0' }}>
                      {[builder.email, builder.phone, builder.location].filter(Boolean).join(' | ')}
                    </p>
                    {(builder.linkedin || builder.github || builder.website) && (
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', margin: '1px 0 0' }}>
                        {[builder.linkedin, builder.github, builder.website].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </div>
                  {[
                    { label: 'PROFESSIONAL SUMMARY', value: builder.summary },
                    { label: 'CAREER OBJECTIVE', value: builder.objective },
                    { label: 'WORK EXPERIENCE', value: builder.experience },
                    { label: 'EDUCATION', value: builder.education },
                    { label: 'TECHNICAL SKILLS', value: builder.skills },
                    { label: 'PROJECTS', value: builder.projects },
                    { label: 'CERTIFICATIONS', value: builder.certifications },
                    { label: 'ACHIEVEMENTS', value: builder.achievements },
                    { label: 'LANGUAGES', value: builder.languages },
                    { label: 'HOBBIES & INTERESTS', value: builder.hobbies },
                    { label: 'REFERENCES', value: builder.references },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label} style={{ marginBottom: '10px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '10px', color: '#6366f1', borderBottom: '1px solid #6366f1', paddingBottom: '2px', marginBottom: '4px', letterSpacing: '0.5px' }}>{s.label}</p>
                      <p style={{ color: '#333', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{s.value}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999' }}>
                  <p style={{ fontSize: '13px' }}>Fill in your details to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI TOOLS ── */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          {/* Sub tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'jd', label: '🎯 JD Match', icon: Target },
              { id: 'cover', label: '✉️ Cover Letter', icon: MessageSquare },
              { id: 'interview', label: '🎤 Interview Questions', icon: HelpCircle },
              { id: 'linkedin', label: '💼 LinkedIn Summary', icon: Linkedin },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveAdvanced(t.id as any)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={bStyle(activeAdvanced === t.id)}>{t.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {activeAdvanced === 'jd' && (
                <div className="rounded-2xl p-4" style={GLASS}>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>PASTE JOB DESCRIPTION</label>
                  <textarea value={jdText} onChange={e => setJdText(e.target.value)}
                    placeholder="Paste the full job description here..." rows={10}
                    className="w-full text-sm outline-none resize-none rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}

              {activeAdvanced !== 'jd' && (
                <div className="rounded-2xl p-4" style={GLASS}>
                  <p className="text-sm text-white mb-1 font-semibold">Resume loaded: {fileName || 'No file'}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {resumeText ? `${resumeText.length} characters extracted` : 'Go to ATS Scanner tab and upload your resume first'}
                  </p>
                </div>
              )}

              <button onClick={() => handleAdvanced(activeAdvanced)} disabled={advancedLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: ACCENT, color: 'white', opacity: advancedLoading ? 0.7 : 1 }}>
                {advancedLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {advancedLoading ? 'Generating...' : `Generate ${activeAdvanced === 'jd' ? 'JD Match Report' : activeAdvanced === 'cover' ? 'Cover Letter' : activeAdvanced === 'interview' ? 'Interview Questions' : 'LinkedIn Summary'}`}
              </button>
            </div>

            {/* Result */}
            <div className="rounded-2xl p-4" style={{ ...GLASS, minHeight: '300px' }}>
              {jdResult ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-sm">Result</h3>
                    <button onClick={() => { navigator.clipboard.writeText(jdResult); toast.success('Copied!'); }}
                      className="text-xs px-3 py-1 rounded-lg font-medium"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>Copy</button>
                  </div>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>{jdResult}</div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: '250px' }}>
                  <Sparkles size={32} className="mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm text-white">Result will appear here</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Click Generate to start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}