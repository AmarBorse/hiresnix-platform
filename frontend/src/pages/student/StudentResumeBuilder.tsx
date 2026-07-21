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
  const [activeAdvanced, setActiveAdvanced] = useState<'jd' | 'cover' | 'interview' | 'linkedin' | 'roadmap' | 'coldemail'>('jd');
  const [jdText, setJdText] = useState('');
  const [jdResult, setJdResult] = useState('');
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [coldEmailData, setColdEmailData] = useState({ hrName: '', company: '', jobRole: '', yourName: '', yourRole: '' });
  const [roadmapRole, setRoadmapRole] = useState('React Developer');
  const [roadmapLevel, setRoadmapLevel] = useState('beginner');
  const [sectionLoading, setSectionLoading] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [roleGenLoading, setRoleGenLoading] = useState(false);
  const [expLevel, setExpLevel] = useState('fresher');
  const builderFileRef = useRef<HTMLInputElement>(null);

  // ── Role Based Resume Generator ───────────────────────────────
  const generateRoleBasedResume = async () => {
    const targetRole = role === 'custom' ? customRole : role;
    if (!targetRole) { toast.error('Select a role first'); return; }
    if (!builder.name) { toast.error('Enter your name first'); return; }
    setRoleGenLoading(true);
    toast('AI is building your resume...', { duration: 5000 });
    try {
      const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
      const res = await fetch(`${API_URL}/groq/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          system: 'You are an expert ATS resume writer. Return ONLY valid JSON, no markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Create a complete ATS-optimized resume for a ${expLevel} ${targetRole}. Name: ${builder.name}. Return ONLY this JSON:
{
  "summary": "3-4 line professional summary with keywords",
  "objective": "2-line career objective for ${expLevel}",
  "experience": "${expLevel === 'fresher' ? 'Write internship/training experience section' : 'Write 2 realistic job experience entries with action verbs and quantified results'}",
  "education": "B.Tech/BCA/MCA Computer Science, [University Name], [Year], CGPA: 8.5/10",
  "skills": "List 20+ ATS keywords for ${targetRole} including tools, languages, frameworks, soft skills",
  "projects": "Write 2-3 impressive project descriptions with tech stack and impact for ${targetRole}",
  "certifications": "List 3 relevant certifications for ${targetRole}",
  "achievements": "Write 3 quantified achievements relevant to ${targetRole}",
  "languages": "English (Fluent), Hindi (Native), Marathi (Proficient)",
  "hobbies": "List 4-5 relevant hobbies for a ${targetRole}"
}`
          }]
        })
      });
      const data = await res.json();
      const raw = (data.content || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      setBuilder(p => ({
        ...p,
        summary: parsed.summary || p.summary,
        objective: parsed.objective || p.objective,
        experience: parsed.experience || p.experience,
        education: parsed.education || p.education,
        skills: parsed.skills || p.skills,
        projects: parsed.projects || p.projects,
        certifications: parsed.certifications || p.certifications,
        achievements: parsed.achievements || p.achievements,
        languages: parsed.languages || p.languages,
        hobbies: parsed.hobbies || p.hobbies,
      }));
      toast.success(`${targetRole} resume generated! 🎉`);
    } catch { toast.error('Generation failed. Try again.'); }
    finally { setRoleGenLoading(false); }
  };

  // ── Auto Fill from Resume ─────────────────────────────────────
  const autoFillFromResume = async (file: File) => {
    setAutoFillLoading(true);
    toast('Extracting resume text...', { duration: 2000 });
    try {
      // Step 1: Extract text from PDF
      let extractedText = '';
      if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await fetch(`${API_URL}/public/extract-pdf`, { method: 'POST', body: formData });
        const data = await res.json();
        extractedText = data.text || '';
      } else {
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.length < 50) {
        toast.error('Could not extract text from resume. Try a different file.');
        setAutoFillLoading(false);
        return;
      }

      toast('AI is filling your resume fields...', { duration: 4000 });

      // Step 2: AI parse and fill all fields
      const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
      const res = await fetch(`${API_URL}/groq/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          system: 'You are an expert resume parser. Extract information and return ONLY valid JSON. No markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Parse this resume and extract all information. Return ONLY this JSON structure (fill empty string if not found):
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "website": "",
  "summary": "",
  "objective": "",
  "experience": "",
  "education": "",
  "skills": "",
  "projects": "",
  "certifications": "",
  "achievements": "",
  "languages": "",
  "hobbies": "",
  "references": ""
}

Resume text:
${extractedText.slice(0, 3000)}`
          }]
        })
      });
      const data = await res.json();
      const raw = (data.content || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);

      toast('AI is making it ATS-friendly...', { duration: 4000 });

      // Step 3: AI improve each filled section for ATS
      const improveRes = await fetch(`${API_URL}/groq/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          system: 'You are an expert ATS resume writer. Return ONLY valid JSON, no markdown.',
          messages: [{
            role: 'user',
            content: `Make this resume ATS-friendly for ${effectiveRole} role. Improve the content — add action verbs, quantify achievements, add relevant keywords. Return ONLY this JSON:
{
  "summary": "improved summary",
  "experience": "improved experience with action verbs",
  "skills": "ATS-optimized skills list",
  "projects": "improved projects",
  "achievements": "quantified achievements"
}

Current content:
Summary: ${parsed.summary || ''}
Experience: ${parsed.experience || ''}
Skills: ${parsed.skills || ''}
Projects: ${parsed.projects || ''}
Achievements: ${parsed.achievements || ''}`
          }]
        })
      });
      const improveData = await improveRes.json();
      const improveRaw = (improveData.content || '{}').replace(/```json|```/g, '').trim();
      const improved = JSON.parse(improveRaw);

      // Merge parsed + improved
      setBuilder({
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        linkedin: parsed.linkedin || '',
        github: parsed.github || '',
        website: parsed.website || '',
        summary: improved.summary || parsed.summary || '',
        objective: parsed.objective || '',
        experience: improved.experience || parsed.experience || '',
        education: parsed.education || '',
        skills: improved.skills || parsed.skills || '',
        projects: improved.projects || parsed.projects || '',
        certifications: parsed.certifications || '',
        achievements: improved.achievements || parsed.achievements || '',
        languages: parsed.languages || '',
        hobbies: parsed.hobbies || '',
        references: parsed.references || '',
        photo: '',
      });

      toast.success('Resume auto-filled & ATS optimized! 🎉');
    } catch (err) {
      toast.error('Auto-fill failed. Try again.');
    } finally {
      setAutoFillLoading(false);
    }
  };
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
    if (!resumeText.trim() && !['linkedin', 'roadmap', 'coldemail'].includes(type)) { toast.error('Upload resume first'); return; }
    if (type === 'jd' && !jdText.trim()) { toast.error('Paste job description first'); return; }
    if (type === 'coldemail' && !coldEmailData.company) { toast.error('Fill company details first'); return; }
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
      } else if (type === 'roadmap') {
        prompt = `Create a detailed career roadmap for becoming a ${roadmapRole} from ${roadmapLevel} level. Include:

**Phase 1: Foundation (Month 1-2)**
- Core concepts to learn
- Free resources (YouTube, docs)
- Mini projects to build

**Phase 2: Core Skills (Month 3-4)**
- Key technologies/frameworks
- Paid/free courses
- Projects to add to portfolio

**Phase 3: Advanced (Month 5-6)**
- Advanced topics
- Real-world projects
- Open source contribution

**Phase 4: Job Ready (Month 7-8)**
- Portfolio checklist
- Resume keywords
- Interview preparation
- Job platforms to use

**Tools & Technologies Checklist:**
- Must know
- Good to know
- Nice to have

**Monthly Salary Range in India:**
- Fresher: 
- 2-3 years:
- 5+ years:

Make it practical, specific, and actionable for Indian job market.`;
        system = 'You are an expert career counselor specializing in tech careers in India. Give practical, actionable advice.';
      } else if (type === 'coldemail') {
        const { hrName, company, jobRole, yourName, yourRole } = coldEmailData;
        prompt = `Write a professional cold email to HR for a job opportunity. 

Details:
- HR Name: ${hrName || 'Hiring Manager'}
- Company: ${company}
- Job Role applying for: ${jobRole || effectiveRole}
- My Name: ${yourName || builder.name || 'Candidate'}
- My Current Role/Background: ${yourRole || effectiveRole}
${resumeText ? `- My Resume Summary: ${resumeText.slice(0, 500)}` : ''}

Write a compelling cold email that:
1. Has a catchy subject line
2. Opens with a strong hook
3. Shows knowledge about the company
4. Highlights 2-3 key achievements
5. Has a clear call to action
6. Is concise (150-200 words max)
7. Professional yet personable tone

Format:
Subject: [subject line]

[email body]`;
        system = 'You are an expert at writing cold emails that get responses. Write emails that stand out.';
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

            {/* Role Based Resume Generator */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Briefcase size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">🎯 Role-Based Resume Generator</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Select your target role → AI builds a complete ATS-optimized resume structure instantly</p>
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Your Name</label>
                        <input placeholder="Full Name"
                          className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                          value={builder.name}
                          onChange={e => setBuilder(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Experience Level</label>
                        <select value={expLevel} onChange={e => setExpLevel(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <option value="fresher" style={{ background: '#1a1f35' }}>Fresher (0-1 yr)</option>
                          <option value="junior" style={{ background: '#1a1f35' }}>Junior (1-3 yrs)</option>
                          <option value="mid" style={{ background: '#1a1f35' }}>Mid-Level (3-5 yrs)</option>
                          <option value="senior" style={{ background: '#1a1f35' }}>Senior (5+ yrs)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Target Role</label>
                      <select value={role} onChange={e => setRole(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        {Object.keys(ATS_KEYWORDS).map(r => <option key={r} value={r} style={{ background: '#1a1f35' }}>{r}</option>)}
                        <option value="custom" style={{ background: '#1a1f35' }}>Custom Role...</option>
                      </select>
                    </div>
                    {role === 'custom' && (
                      <input placeholder="Enter your target role..."
                        className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        value={customRole} onChange={e => setCustomRole(e.target.value)} />
                    )}
                    <button
                      onClick={generateRoleBasedResume}
                      disabled={roleGenLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', opacity: roleGenLoading ? 0.7 : 1 }}>
                      {roleGenLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {roleGenLoading ? 'Building Resume...' : '⚡ Generate Full Resume'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Fill Banner */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.35)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ACCENT }}>
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">🚀 Auto-Fill from Old Resume</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Upload your existing resume → AI extracts all info → Makes it ATS-friendly automatically</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => builderFileRef.current?.click()}
                      disabled={autoFillLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: ACCENT, color: 'white', opacity: autoFillLoading ? 0.7 : 1 }}>
                      {autoFillLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      {autoFillLoading ? 'Processing...' : 'Upload & Auto-Fill'}
                    </button>
                    <input ref={builderFileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                      onChange={e => e.target.files?.[0] && autoFillFromResume(e.target.files[0])} />
                    {autoFillLoading && (
                      <span className="text-xs self-center" style={{ color: '#a5b4fc' }}>AI is working... please wait</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
                      <div className="space-y-2">
                        <textarea rows={(section as any).rows || 3}
                          value={builder[section.key as keyof typeof builder]}
                          onChange={e => setBuilder(p => ({ ...p, [section.key]: e.target.value }))}
                          placeholder={`Enter your ${section.label.replace(/[^\w\s]/g, '').trim()}...`}
                          className="w-full text-sm outline-none resize-none rounded-xl p-3"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
                        {/* AI Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const current = builder[section.key as keyof typeof builder];
                              setSectionLoading(section.key + '_generate');
                              try {
                                const prompts: Record<string, string> = {
                                  summary: `Write a professional resume summary (3-4 lines) for a ${effectiveRole}. Name: ${builder.name || 'Candidate'}. Skills: ${builder.skills || 'not specified'}. Experience: ${builder.experience?.slice(0,200) || 'fresher'}. Make it ATS-optimized, impactful.`,
                                  objective: `Write a career objective (2-3 lines) for a ${effectiveRole} fresher/experienced candidate. Name: ${builder.name || 'Candidate'}. Make it focused and professional.`,
                                  experience: `Write a professional work experience section for ${effectiveRole}. Include 2 job entries with bullet points using action verbs and quantified achievements. Format properly.`,
                                  education: `Write an education section for a ${effectiveRole}. Include degree, college, year, CGPA placeholders. Format professionally.`,
                                  skills: `List top 20 technical and soft skills for a ${effectiveRole}. Format as comma-separated. Include tools, languages, frameworks, and soft skills.`,
                                  projects: `Write 2-3 impressive project descriptions for a ${effectiveRole} portfolio. Include project name, tech stack, and impact. Use bullet points.`,
                                  certifications: `List 3-4 relevant certifications for a ${effectiveRole} with issuing organization and year placeholders.`,
                                  achievements: `Write 3-4 professional achievements for a ${effectiveRole}. Include quantified results like percentages, rankings, awards.`,
                                  languages: `List language proficiencies relevant for a professional. Include English and Indian languages with proficiency levels.`,
                                  hobbies: `Write a concise hobbies and interests section for a ${effectiveRole}. Include relevant technical hobbies and personal interests. Keep it professional.`,
                                  references: `Write a references section with 2 professional references format (name, designation, company, contact). Use placeholder data.`,
                                };
                                const result = await groqCall(
                                  prompts[section.key] || `Write professional content for ${section.label} section of a resume for ${effectiveRole}.`,
                                  'You are an expert resume writer. Write concise, ATS-optimized professional resume content. No extra explanation, just the content.'
                                );
                                setBuilder(p => ({ ...p, [section.key]: result }));
                                toast.success('AI generated!');
                              } catch { toast.error('Failed. Try again.'); }
                              finally { setSectionLoading(''); }
                            }}
                            disabled={sectionLoading === section.key + '_generate'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', opacity: sectionLoading === section.key + '_generate' ? 0.7 : 1 }}>
                            {sectionLoading === section.key + '_generate' ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            {sectionLoading === section.key + '_generate' ? 'Generating...' : '✨ AI Generate'}
                          </button>
                          {builder[section.key as keyof typeof builder] && (
                            <button
                              onClick={async () => {
                                const current = builder[section.key as keyof typeof builder];
                                setSectionLoading(section.key + '_improve');
                                try {
                                  const result = await groqCall(
                                    `Improve this resume ${section.label} section for a ${effectiveRole} role. Make it more impactful, ATS-optimized, use strong action verbs, quantify where possible. Return only the improved content:\n\n${current}`,
                                    'You are an expert resume writer. Return only the improved resume content, no explanations.'
                                  );
                                  setBuilder(p => ({ ...p, [section.key]: result }));
                                  toast.success('AI improved!');
                                } catch { toast.error('Failed. Try again.'); }
                                finally { setSectionLoading(''); }
                              }}
                              disabled={sectionLoading === section.key + '_improve'}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', opacity: sectionLoading === section.key + '_improve' ? 0.7 : 1 }}>
                              {sectionLoading === section.key + '_improve' ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
                              {sectionLoading === section.key + '_improve' ? 'Improving...' : '⚡ AI Improve'}
                            </button>
                          )}
                        </div>
                      </div>
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
        <div className="space-y-5">
          {/* Sub tabs */}
          <div className="flex gap-1.5 flex-wrap p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { id: 'jd', label: '🎯 JD Match' },
              { id: 'cover', label: '✉️ Cover Letter' },
              { id: 'interview', label: '🎤 Interview Prep' },
              { id: 'linkedin', label: '💼 LinkedIn' },
              { id: 'roadmap', label: '🗺️ Career Roadmap' },
              { id: 'coldemail', label: '📧 Cold Email' },
            ].map(t => (
              <button key={t.id} onClick={() => { setActiveAdvanced(t.id as any); setJdResult(''); }}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={activeAdvanced === t.id ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                } : {
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                }}>{t.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Panel */}
            <div className="space-y-4">
              {/* Feature card */}
              <div className="rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                    <span className="text-base">{
                      activeAdvanced === 'jd' ? '🎯' : activeAdvanced === 'cover' ? '✉️' :
                      activeAdvanced === 'interview' ? '🎤' : activeAdvanced === 'linkedin' ? '💼' :
                      activeAdvanced === 'roadmap' ? '🗺️' : '📧'
                    }</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{
                      activeAdvanced === 'jd' ? 'Job Description Match' :
                      activeAdvanced === 'cover' ? 'Cover Letter Generator' :
                      activeAdvanced === 'interview' ? 'Interview Preparation' :
                      activeAdvanced === 'linkedin' ? 'LinkedIn Summary' :
                      activeAdvanced === 'roadmap' ? 'Career Roadmap' : 'Cold Email to HR'
                    }</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{
                      activeAdvanced === 'jd' ? 'Compare resume with job requirements' :
                      activeAdvanced === 'cover' ? 'Create personalized cover letter' :
                      activeAdvanced === 'interview' ? '10 questions with answer tips' :
                      activeAdvanced === 'linkedin' ? 'Professional About section' :
                      activeAdvanced === 'roadmap' ? 'Step-by-step learning path to your dream role' :
                      'Get a response-worthy email to HR'
                    }</p>
                  </div>
                </div>
                {!['roadmap', 'coldemail'].includes(activeAdvanced) && (
                  resumeText ? (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle size={13} style={{ color: '#4ade80' }} />
                      <span className="text-xs" style={{ color: '#4ade80' }}>Resume loaded: {fileName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <XCircle size={13} style={{ color: '#f87171' }} />
                      <span className="text-xs" style={{ color: '#f87171' }}>Upload resume in ATS Scanner tab first</span>
                    </div>
                  )
                )}
              </div>

              {/* JD Textarea */}
              {activeAdvanced === 'jd' && (
                <div className="rounded-2xl p-4" style={GLASS}>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Paste Job Description</label>
                  <textarea value={jdText} onChange={e => setJdText(e.target.value)}
                    placeholder="Paste the full job description here..." rows={8}
                    className="w-full text-sm outline-none resize-none rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}

              {/* Career Roadmap Inputs */}
              {activeAdvanced === 'roadmap' && (
                <div className="rounded-2xl p-4 space-y-3" style={GLASS}>
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Roadmap Settings</label>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Target Role</label>
                    <select value={roadmapRole} onChange={e => setRoadmapRole(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {Object.keys(ATS_KEYWORDS).map(r => <option key={r} value={r} style={{ background: '#1a1f35' }}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Current Level</label>
                    <select value={roadmapLevel} onChange={e => setRoadmapLevel(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="beginner" style={{ background: '#1a1f35' }}>🟢 Beginner (No experience)</option>
                      <option value="intermediate" style={{ background: '#1a1f35' }}>🟡 Intermediate (Some basics)</option>
                      <option value="career-switch" style={{ background: '#1a1f35' }}>🔄 Career Switch</option>
                    </select>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>
                    💡 Get a 8-month roadmap with resources, projects, and salary info
                  </div>
                </div>
              )}

              {/* Cold Email Inputs */}
              {activeAdvanced === 'coldemail' && (
                <div className="rounded-2xl p-4 space-y-3" style={GLASS}>
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Email Details</label>
                  {[
                    { key: 'yourName', label: 'Your Name', placeholder: 'Amar Borse' },
                    { key: 'yourRole', label: 'Your Background', placeholder: 'React Developer, 2 years exp' },
                    { key: 'hrName', label: 'HR Name (optional)', placeholder: 'Priya Sharma' },
                    { key: 'company', label: 'Company Name *', placeholder: 'Google, TCS, Infosys...' },
                    { key: 'jobRole', label: 'Job Role Applying For *', placeholder: 'Senior React Developer' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.label}</label>
                      <input placeholder={f.placeholder}
                        className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        value={coldEmailData[f.key as keyof typeof coldEmailData]}
                        onChange={e => setColdEmailData(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>
                    💡 Upload resume in ATS Scanner for a more personalized email
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button onClick={() => handleAdvanced(activeAdvanced)} disabled={advancedLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: advancedLoading ? 'rgba(99,102,241,0.3)' : ACCENT,
                  color: 'white',
                  boxShadow: advancedLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}>
                {advancedLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {advancedLoading ? 'AI is generating...' : `✨ Generate ${
                  activeAdvanced === 'jd' ? 'Match Report' :
                  activeAdvanced === 'cover' ? 'Cover Letter' :
                  activeAdvanced === 'interview' ? 'Interview Questions' :
                  activeAdvanced === 'linkedin' ? 'LinkedIn Summary' :
                  activeAdvanced === 'roadmap' ? 'Career Roadmap' : 'Cold Email'
                }`}
              </button>
            </div>

            {/* Result Panel */}
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'rgba(15, 20, 40, 0.8)',
              border: '1px solid rgba(99,102,241,0.2)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minHeight: '350px',
            }}>
              {jdResult ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                      <span className="text-sm font-bold text-white">{
                        activeAdvanced === 'jd' ? '🎯 JD Match Report' :
                        activeAdvanced === 'cover' ? '✉️ Cover Letter' :
                        activeAdvanced === 'interview' ? '🎤 Interview Questions' :
                        activeAdvanced === 'linkedin' ? '💼 LinkedIn Summary' :
                        activeAdvanced === 'roadmap' ? '🗺️ Career Roadmap' : '📧 Cold Email'
                      }</span>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(jdResult); toast.success('Copied!'); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                      📋 Copy
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.8)' }}
                      dangerouslySetInnerHTML={{ __html: jdResult
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:white;font-weight:700">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em style="color:#a5b4fc">$1</em>')
                        .replace(/^(#{1,3})\s(.+)$/gm, '<p style="color:#a5b4fc;font-weight:700;font-size:13px;margin-top:12px">$2</p>')
                        .replace(/^(\d+\.)\s/gm, '<span style="color:#6366f1;font-weight:bold">$1</span> ')
                        .replace(/^[-•]\s/gm, '<span style="color:#6366f1">▸</span> ')
                      }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: '350px' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <span className="text-3xl">{
                      activeAdvanced === 'roadmap' ? '🗺️' : activeAdvanced === 'coldemail' ? '📧' : '✨'
                    }</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Result will appear here</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Click Generate to start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}