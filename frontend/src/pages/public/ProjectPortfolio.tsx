// src/pages/public/ProjectPortfolio.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { ExternalLink, Github, Mail, Linkedin, Globe, Code2, Star, Download } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  live:        { label: '● Live', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  in_progress: { label: '◐ In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  completed:   { label: '✓ Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
};

const PROJECT_EMOJIS: Record<string, string> = {
  'e-commerce': '🛒', 'shop': '🛒', 'ai': '🤖', 'ml': '🧠', 'chat': '💬',
  'dashboard': '📊', 'analytics': '📈', 'mobile': '📱', 'app': '📱',
  'web': '🌐', 'portfolio': '💼', 'blog': '📝', 'game': '🎮',
  'auth': '🔐', 'api': '⚡', 'cloud': '☁️', 'social': '👥',
};
function getEmoji(title: string) {
  const lower = title.toLowerCase();
  for (const [key, emoji] of Object.entries(PROJECT_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🚀';
}

export function ProjectPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/projects/u/${username}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
      <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0f1e' }}>
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold text-white mb-2">Portfolio not found</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>No portfolio found for <strong className="text-white">@{username}</strong></p>
      <a href="/" className="mt-6 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        Go to Hiresnix
      </a>
    </div>
  );

  const { user, student, projects } = data;
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const liveProjects = projects.filter((p: any) => p.status === 'live').length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Code2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">Hiresnix</span>
        </a>
        <a href="/auth" className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
          Create your portfolio →
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Profile card */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            {student.profilePic ? (
              <img src={student.profilePic} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {initials}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                {student.domain && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                    {student.domain}
                  </span>
                )}
              </div>
              {student.location && <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>📍 {student.location}</p>}
              {student.bio && <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{student.bio}</p>}

              {/* Links */}
              <div className="flex gap-3 flex-wrap">
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: 'rgba(10,102,194,0.2)', color: '#60a5fa', border: '1px solid rgba(10,102,194,0.3)' }}>
                    <Linkedin size={12} /> LinkedIn
                  </a>
                )}
                {student.githubUrl && (
                  <a href={student.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Github size={12} /> GitHub
                  </a>
                )}
                {student.portfolioUrl && (
                  <a href={student.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Globe size={12} /> Website
                  </a>
                )}
                <a href={`mailto:${user.email}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Mail size={12} /> Contact
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{projects.length}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Projects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{liveProjects}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Live</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {student.skills && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>SKILLS</p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(student.skills) ? student.skills : student.skills.split(','))
                  .slice(0, 15)
                  .map((s: string) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {typeof s === 'string' ? s.trim() : s}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects */}
        <h2 className="text-lg font-bold text-white mb-4">Projects <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', fontWeight: 400 }}>({projects.length})</span></h2>

        {projects.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-3xl mb-3">🚀</p>
            <p className="text-white font-medium">No projects added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((project: any) => (
              <div key={project.id} className="rounded-2xl overflow-hidden group transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Image */}
                {project.imageUrl ? (
                  <div className="w-full h-44 overflow-hidden">
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-5xl" style={{ background: 'rgba(99,102,241,0.08)' }}>
                    {getEmoji(project.title)}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{project.title}</h3>
                        {project.featured && <Star size={13} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium"
                        style={{ background: STATUS_CONFIG[project.status]?.bg, color: STATUS_CONFIG[project.status]?.color }}>
                        {STATUS_CONFIG[project.status]?.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{project.description}</p>

                  {/* Tech */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.techStack.map((t: string) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <ExternalLink size={14} /> Live Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Github size={14} /> Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recruiter CTA */}
        <div className="mt-10 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div>
            <p className="font-bold text-white text-lg">Interested in hiring {user.name.split(' ')[0]}?</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Connect directly via email or find more talent on Hiresnix</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href={`mailto:${user.email}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Mail size={14} /> Contact {user.name.split(' ')[0]}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Powered by <a href="/" className="text-indigo-400 font-semibold">Hiresnix</a> · Build your portfolio free</p>
        </div>
      </div>
    </div>
  );
}