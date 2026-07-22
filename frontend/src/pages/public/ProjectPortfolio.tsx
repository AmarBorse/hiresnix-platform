// src/pages/student/StudentProjects.tsx
import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Github, Trash2, Edit3, Star, Eye, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';
const TECH_SUGGESTIONS = ['React','Node.js','TypeScript','JavaScript','Python','Java','MongoDB','PostgreSQL','MySQL','Docker','AWS','Firebase','Next.js','Express','Django','Flask','Flutter','Kotlin','Swift','Redis','GraphQL','REST API','Tailwind CSS','HTML/CSS','Git'];
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  live:        { label: 'Live', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  completed:   { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
};
const PROJECT_EMOJIS: Record<string, string> = {
  'e-commerce': '🛒', 'shop': '🛒', 'store': '🛒',
  'ai': '🤖', 'ml': '🧠', 'chat': '💬', 'bot': '🤖',
  'dashboard': '📊', 'analytics': '📈', 'data': '📊',
  'mobile': '📱', 'app': '📱', 'android': '📱', 'ios': '📱',
  'web': '🌐', 'portfolio': '💼', 'blog': '📝',
  'game': '🎮', 'auth': '🔐', 'api': '⚡', 'cloud': '☁️',
  'social': '👥', 'food': '🍕', 'travel': '✈️', 'music': '🎵',
};

function getEmoji(title: string) {
  const lower = title.toLowerCase();
  for (const [key, emoji] of Object.entries(PROJECT_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🚀';
}

interface Project {
  id: number; title: string; description: string; techStack: string[];
  liveUrl: string; githubUrl: string; imageUrl: string;
  status: string; featured: boolean; views: number; order: number;
  createdAt: string;
}

const EMPTY_FORM = { title: '', description: '', techStack: [] as string[], liveUrl: '', githubUrl: '', imageUrl: '', status: 'completed', featured: false };

export function StudentProjects() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [techInput, setTechInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hirenix_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const username = user?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
  const portfolioUrl = `hiresnix.co.in/projects/${username}`;

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/projects/my`, { headers });
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditProject(null); setForm(EMPTY_FORM); setTechInput(''); setShowModal(true); };
  const openEdit = (p: Project) => { setEditProject(p); setForm({ title: p.title, description: p.description, techStack: p.techStack, liveUrl: p.liveUrl, githubUrl: p.githubUrl, imageUrl: p.imageUrl, status: p.status, featured: p.featured }); setTechInput(''); setShowModal(true); };

  const addTech = (tech: string) => {
    const t = tech.trim();
    if (t && !form.techStack.includes(t)) setForm(p => ({ ...p, techStack: [...p.techStack, t] }));
    setTechInput('');
  };
  const removeTech = (t: string) => setForm(p => ({ ...p, techStack: p.techStack.filter(x => x !== t) }));

  const handleSave = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    setSaving(true);
    try {
      const url = editProject ? `${API}/projects/${editProject.id}` : `${API}/projects`;
      const method = editProject ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(editProject ? 'Project updated!' : 'Project added!');
      setShowModal(false);
      fetchProjects();
    } catch (e: any) { toast.error(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    try {
      const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Project deleted');
      setProjects(p => p.filter(x => x.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${portfolioUrl}`);
    setCopied(true);
    toast.success('Portfolio URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const G = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#0a0f1e', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">My Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Showcase your work to recruiters</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Portfolio URL banner */}
      <div className="rounded-2xl p-4 mb-6 flex items-center gap-4 flex-wrap" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="flex-1">
          <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>YOUR PUBLIC PORTFOLIO URL</p>
          <p className="text-sm font-mono text-white">{portfolioUrl}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', color: copied ? '#4ade80' : 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a href={`/projects/${username}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <ExternalLink size={14} /> View portfolio
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: projects.length },
          { label: 'Live Projects', value: projects.filter(p => p.status === 'live').length },
          { label: 'Featured', value: projects.filter(p => p.featured).length },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={G}>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={G}>
          <p className="text-4xl mb-4">🚀</p>
          <p className="text-white font-semibold text-lg mb-2">No projects yet</p>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Add your first project to start building your portfolio</p>
          <button onClick={openAdd} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Add your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="rounded-2xl overflow-hidden" style={G}>
              {/* Image / Emoji */}
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 flex items-center justify-center text-5xl" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  {getEmoji(project.title)}
                </div>
              )}

              <div className="p-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{project.title}</p>
                      {project.featured && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                      style={{ background: STATUS_CONFIG[project.status]?.bg, color: STATUS_CONFIG[project.status]?.color }}>
                      {STATUS_CONFIG[project.status]?.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{project.description}</p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.techStack.slice(0, 4).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
                  ))}
                  {project.techStack.length > 4 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>+{project.techStack.length - 4}</span>}
                </div>

                {/* Links + actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                      <ExternalLink size={11} /> Live
                    </a>
                  )}
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                      <Github size={11} /> Code
                    </a>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add more */}
          {projects.length < 10 && (
            <button onClick={openAdd} className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all" style={{ border: '1px dashed rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.05)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Plus size={20} style={{ color: '#6366f1' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Add project</p>
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0f1428', border: '1px solid rgba(99,102,241,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-white">{editProject ? 'Edit Project' : 'Add Project'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'rgba(255,255,255,0.5)' }}><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>PROJECT TITLE *</label>
                <input className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="e.g. E-commerce Platform, AI Chatbot..."
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>DESCRIPTION *</label>
                <textarea className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                  placeholder="Describe what this project does, its features, and impact..."
                  rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>TECH STACK</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.techStack.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                      {t} <button onClick={() => removeTech(t)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="Type tech and press Enter..." value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech(techInput))} />
                  <button onClick={() => addTech(techInput)} className="px-3 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'rgba(99,102,241,0.3)' }}>Add</button>
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TECH_SUGGESTIONS.filter(t => !form.techStack.includes(t) && t.toLowerCase().includes(techInput.toLowerCase())).slice(0, 8).map(t => (
                    <button key={t} onClick={() => addTech(t)} className="text-xs px-2 py-1 rounded-full transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>LIVE URL</label>
                  <input className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="https://myproject.vercel.app"
                    value={form.liveUrl} onChange={e => setForm(p => ({ ...p, liveUrl: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>GITHUB URL</label>
                  <input className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="https://github.com/user/repo"
                    value={form.githubUrl} onChange={e => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
                </div>
              </div>

              {/* Screenshot URL */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>SCREENSHOT URL <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span></label>
                <input className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Paste image URL (imgur, cloudinary, etc.)"
                  value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
              </div>

              {/* Status + Featured */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>STATUS</label>
                  <select className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="live" style={{ background: '#1a1f35' }}>🟢 Live</option>
                    <option value="in_progress" style={{ background: '#1a1f35' }}>🟡 In Progress</option>
                    <option value="completed" style={{ background: '#1a1f35' }}>✅ Completed</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-white">⭐ Featured</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editProject ? 'Update Project' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}