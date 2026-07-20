// src/pages/student/StudentResumeBuilder.tsx
import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Zap, Download, RefreshCw, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp, Sparkles, Target, Brain } from 'lucide-react';
import { toast } from 'sonner';

// ── ATS Keywords Database ─────────────────────────────────────────
const ATS_KEYWORDS: Record<string, string[]> = {
  'Python Developer': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'postgresql', 'mongodb', 'docker', 'aws', 'rest api', 'git', 'agile', 'ci/cd', 'unit testing', 'microservices'],
  'React Developer': ['react', 'typescript', 'javascript', 'node.js', 'redux', 'tailwind', 'next.js', 'graphql', 'rest api', 'webpack', 'vite', 'jest', 'git', 'agile', 'responsive design', 'html', 'css', 'figma'],
  'Java Developer': ['java', 'spring boot', 'hibernate', 'microservices', 'maven', 'gradle', 'mysql', 'postgresql', 'docker', 'kubernetes', 'aws', 'rest api', 'junit', 'git', 'agile', 'ci/cd', 'multithreading', 'design patterns'],
  'Data Scientist': ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'sql', 'tableau', 'power bi', 'statistics', 'nlp', 'computer vision', 'feature engineering', 'model deployment', 'r', 'spark', 'hadoop'],
};

const ACTION_VERBS = ['developed', 'built', 'designed', 'implemented', 'led', 'managed', 'created', 'optimized', 'increased', 'reduced', 'improved', 'delivered', 'launched', 'architected', 'collaborated', 'mentored', 'achieved', 'automated'];
const SECTIONS = ['education', 'experience', 'skills', 'contact', 'projects', 'certifications'];

// ── Types ─────────────────────────────────────────────────────────
interface ATSScore {
  total: number;
  keywords: number;
  sections: number;
  actionVerbs: number;
  quantified: number;
  formatting: number;
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
  const keywords = ATS_KEYWORDS[role] || ATS_KEYWORDS['React Developer'];

  // Keywords score (30pts)
  const foundKw = keywords.filter(k => lower.includes(k));
  const kwScore = Math.round((foundKw.length / keywords.length) * 30);
  const kwIssues = keywords.filter(k => !lower.includes(k)).slice(0, 5).map(k => `Missing keyword: "${k}"`);

  // Sections score (25pts)
  const foundSections = SECTIONS.filter(s => lower.includes(s));
  const secScore = Math.round((foundSections.length / SECTIONS.length) * 25);
  const secIssues = SECTIONS.filter(s => !lower.includes(s)).map(s => `Missing section: ${s}`);

  // Action verbs (20pts)
  const foundVerbs = ACTION_VERBS.filter(v => lower.includes(v));
  const verbScore = Math.min(20, Math.round((foundVerbs.length / 8) * 20));
  const verbIssues = foundVerbs.length < 5 ? [`Only ${foundVerbs.length} action verbs found. Add more like: ${ACTION_VERBS.slice(0, 3).join(', ')}`] : [];

  // Quantified achievements (15pts)
  const numbers = (text.match(/\d+%|\d+\+|\$\d+|\d+ (users|projects|team|years|months)/gi) || []).length;
  const quantScore = Math.min(15, numbers * 3);
  const quantIssues = numbers < 3 ? ['Add quantified achievements (e.g., "Increased performance by 40%", "Led team of 5")'] : [];

  // Formatting (10pts)
  const lines = text.split('\n').filter(l => l.trim());
  const formatScore = lines.length > 20 ? 10 : Math.round((lines.length / 20) * 10);
  const formatIssues = lines.length < 20 ? ['Resume seems short. Add more details to each section.'] : [];

  const total = kwScore + secScore + verbScore + quantScore + formatScore;

  return {
    total,
    keywords: kwScore,
    sections: secScore,
    actionVerbs: verbScore,
    quantified: quantScore,
    formatting: formatScore,
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
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = ((score / 100) * circ);
  const color = score >= 71 ? '#22c55e' : score >= 41 ? '#f59e0b' : '#ef4444';
  const label = score >= 71 ? 'Excellent' : score >= 41 ? 'Needs Work' : 'Poor';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">/100</text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function StudentResumeBuilder() {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [role, setRole] = useState('React Developer');
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'build'>('scan');
  const fileRef = useRef<HTMLInputElement>(null);

  // Resume Builder state
  const [builder, setBuilder] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '', github: '',
    summary: '', experience: '', education: '', skills: '', projects: '', certifications: '',
  });

  // ── File Parse ───────────────────────────────────────────────
  const parseFile = async (file: File) => {
    setFileName(file.name);
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // @ts-ignore
          const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
          // @ts-ignore
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: e.target?.result }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          setResumeText(text);
          toast.success('Resume parsed successfully!');
        } catch {
          // Fallback: read as text
          const text = await file.text().catch(() => '');
          setResumeText(text || 'Could not parse PDF. Please paste your resume text below.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const text = await file.text();
      setResumeText(text);
      toast.success('Resume loaded!');
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  // ── ATS Scan ─────────────────────────────────────────────────
  const handleScan = () => {
    if (!resumeText.trim()) { toast.error('Please upload or paste your resume first'); return; }
    setScanning(true);
    setTimeout(() => {
      const score = calculateATS(resumeText, role);
      setAtsScore(score);
      setScanning(false);
      toast.success('ATS scan complete!');
    }, 1500);
  };

  // ── AI Analysis ───────────────────────────────────────────────
  const handleAIAnalysis = async () => {
    if (!resumeText.trim()) { toast.error('Please upload your resume first'); return; }
    setAnalyzing(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('No API key');

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analyze this resume for a ${role} position. Return ONLY valid JSON (no markdown):
{
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "weakSentences": ["sentence that needs improvement"],
  "suggestions": ["specific actionable suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"],
  "jobRoleMatch": 75,
  "summary": "2-3 line overall assessment"
}

Resume text:
${resumeText.slice(0, 2000)}`
          }]
        })
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const clean = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiAnalysis(parsed);
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error('AI analysis failed. Check your API key.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── PDF Download (Builder) ────────────────────────────────────
  const downloadPDF = async () => {
    if (!builder.name) { toast.error('Add your name first'); return; }
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Header
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text(builder.name, margin, y); y += 8;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
      const contact = [builder.email, builder.phone, builder.location, builder.linkedin].filter(Boolean).join(' | ');
      doc.text(contact, margin, y); y += 10;
      doc.setDrawColor(99, 102, 241); doc.setLineWidth(0.5); doc.line(margin, y, 190, y); y += 8;

      const addSection = (title: string, content: string) => {
        if (!content.trim()) return;
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
        doc.text(title.toUpperCase(), margin, y); y += 6;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
        const lines = doc.splitTextToSize(content, 170);
        lines.forEach((line: string) => { doc.text(line, margin, y); y += 5; if (y > 270) { doc.addPage(); y = 20; } });
        y += 4;
      };

      addSection('Summary', builder.summary);
      addSection('Experience', builder.experience);
      addSection('Education', builder.education);
      addSection('Skills', builder.skills);
      addSection('Projects', builder.projects);
      addSection('Certifications', builder.certifications);

      doc.save(`${builder.name.replace(' ', '_')}_Resume.pdf`);
      toast.success('Resume downloaded!');
    } catch {
      toast.error('PDF generation failed');
    }
  };

  const scoreColor = atsScore ? (atsScore.total >= 71 ? '#22c55e' : atsScore.total >= 41 ? '#f59e0b' : '#ef4444') : '#6366f1';

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0a0f1e', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <FileText size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Hiresnix Resume AI</h1>
        </div>
        <p className="text-sm ml-11" style={{ color: 'rgba(255,255,255,0.4)' }}>Get ATS Ready in Minutes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'scan', label: '🔍 ATS Scanner', }, { id: 'build', label: '✏️ Resume Builder' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
              border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ATS SCANNER TAB ── */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Upload + Input */}
          <div className="space-y-4">

            {/* Role Selector */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>TARGET JOB ROLE</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {Object.keys(ATS_KEYWORDS).map(r => <option key={r} value={r} style={{ background: '#1a1f35' }}>{r}</option>)}
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl p-6 text-center cursor-pointer transition-all"
              style={{
                background: dragging ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `2px dashed ${dragging ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
              }}>
              <Upload size={28} className="mx-auto mb-3" style={{ color: dragging ? '#6366f1' : 'rgba(255,255,255,0.3)' }} />
              <p className="text-sm font-medium text-white mb-1">{fileName || 'Drop your resume here'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>PDF or DOC • Click to browse</p>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </div>

            {/* Text Area */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>OR PASTE RESUME TEXT</label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                rows={8}
                className="w-full text-sm text-white outline-none resize-none rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
              />
            </div>

            {/* Scan Buttons */}
            <div className="flex gap-3">
              <button onClick={handleScan} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', opacity: scanning ? 0.7 : 1 }}>
                {scanning ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                {scanning ? 'Scanning...' : 'ATS Scan'}
              </button>
              <button onClick={handleAIAnalysis} disabled={analyzing}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', opacity: analyzing ? 0.7 : 1 }}>
                {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
                {analyzing ? 'Analyzing...' : 'AI Analysis'}
              </button>
            </div>
          </div>

          {/* Right — Results */}
          <div className="space-y-4">
            {atsScore ? (
              <>
                {/* Score Card */}
                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white">ATS Score</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{role}</p>
                    </div>
                    <CircularScore score={atsScore.total} />
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    {atsScore.breakdown.map(item => (
                      <div key={item.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</span>
                          <span style={{ color: scoreColor }}>{item.score}/{item.max}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${(item.score / item.max) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                        </div>
                        {item.issues.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.issues.slice(0, 2).map((issue, i) => (
                              <p key={i} className="text-xs flex items-start gap-1" style={{ color: '#f87171' }}>
                                <XCircle size={10} className="mt-0.5 flex-shrink-0" />{issue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Target size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p className="text-sm font-medium text-white mb-1">Upload your resume</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Get your ATS score and AI suggestions</p>
              </div>
            )}

            {/* AI Analysis */}
            {aiAnalysis && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} style={{ color: '#a5b4fc' }} />
                  <h3 className="font-bold text-white text-sm">AI Analysis</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                    {aiAnalysis.jobRoleMatch}% Match
                  </span>
                </div>

                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{aiAnalysis.summary}</p>

                {/* Missing Keywords */}
                {aiAnalysis.missingKeywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>❌ Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiAnalysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {aiAnalysis.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#34d399' }}>✅ Suggestions</p>
                    <ul className="space-y-1.5">
                      {aiAnalysis.suggestions.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#34d399' }} />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weak Sentences */}
                {aiAnalysis.weakSentences?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>⚠️ Weak Sentences</p>
                    <ul className="space-y-1">
                      {aiAnalysis.weakSentences.map((s, i) => (
                        <li key={i} className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESUME BUILDER TAB ── */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Builder Form */}
          <div className="space-y-4">

            {/* Personal Info */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-semibold text-white text-sm">👤 Personal Info</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name', placeholder: 'Full Name', full: true },
                  { key: 'email', placeholder: 'Email' },
                  { key: 'phone', placeholder: 'Phone' },
                  { key: 'location', placeholder: 'Location' },
                  { key: 'linkedin', placeholder: 'LinkedIn URL' },
                  { key: 'github', placeholder: 'GitHub URL' },
                ].map(field => (
                  <input key={field.key}
                    className={`rounded-xl px-3 py-2 text-sm text-white outline-none ${field.full ? 'col-span-2' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    placeholder={field.placeholder}
                    value={builder[field.key as keyof typeof builder]}
                    onChange={e => setBuilder(p => ({ ...p, [field.key]: e.target.value }))}
                  />
                ))}
              </div>
            </div>

            {/* Sections */}
            {[
              { key: 'summary', label: '📝 Professional Summary', rows: 3 },
              { key: 'experience', label: '💼 Work Experience', rows: 5 },
              { key: 'education', label: '🎓 Education', rows: 3 },
              { key: 'skills', label: '⚡ Skills', rows: 2 },
              { key: 'projects', label: '🚀 Projects', rows: 4 },
              { key: 'certifications', label: '🏆 Certifications', rows: 2 },
            ].map(section => (
              <div key={section.key} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-sm font-semibold text-white">{section.label}</span>
                  {expandedSection === section.key ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                </button>
                {expandedSection === section.key && (
                  <div className="px-4 pb-4">
                    <textarea
                      rows={section.rows}
                      value={builder[section.key as keyof typeof builder]}
                      onChange={e => setBuilder(p => ({ ...p, [section.key]: e.target.value }))}
                      placeholder={`Enter your ${section.label.split(' ').slice(1).join(' ')}...`}
                      className="w-full text-sm outline-none resize-none rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </div>
                )}
              </div>
            ))}

            <button onClick={downloadPDF}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
              <Download size={16} /> Download PDF Resume
            </button>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Live Preview</h3>
              {builder.name && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  ATS: {calculateATS(Object.values(builder).join(' '), role).total}/100
                </span>
              )}
            </div>

            <div className="rounded-xl p-4 text-xs" style={{ background: 'white', color: '#1a1a1a', minHeight: '400px', fontFamily: 'serif' }}>
              {builder.name ? (
                <>
                  <div className="border-b-2 pb-2 mb-3" style={{ borderColor: '#6366f1' }}>
                    <h2 className="text-lg font-bold">{builder.name}</h2>
                    <p className="text-xs text-gray-500">{[builder.email, builder.phone, builder.location].filter(Boolean).join(' | ')}</p>
                    {(builder.linkedin || builder.github) && (
                      <p className="text-xs text-blue-600">{[builder.linkedin, builder.github].filter(Boolean).join(' | ')}</p>
                    )}
                  </div>
                  {builder.summary && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Summary</p><p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap">{builder.summary}</p></>}
                  {builder.experience && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Experience</p><p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap">{builder.experience}</p></>}
                  {builder.education && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Education</p><p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap">{builder.education}</p></>}
                  {builder.skills && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Skills</p><p className="text-xs text-gray-600 mb-3">{builder.skills}</p></>}
                  {builder.projects && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Projects</p><p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap">{builder.projects}</p></>}
                  {builder.certifications && <><p className="font-bold text-xs mb-1 uppercase tracking-wide">Certifications</p><p className="text-xs text-gray-600 whitespace-pre-wrap">{builder.certifications}</p></>}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <FileText size={32} className="mb-2" />
                  <p className="text-xs">Fill in your details to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}