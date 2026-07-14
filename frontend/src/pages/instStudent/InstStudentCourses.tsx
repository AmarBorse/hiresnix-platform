// src/pages/instStudent/InstStudentCourses.tsx
import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, ChevronRight, GraduationCap, CheckCircle, Sparkles, Download } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useInstStudentStore } from '../../store/useInstStudentStore';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.instStudent;

const ACADEMY_COURSES = [
  { id: 'python',     title: 'Python Programming',       icon: '🐍', accent: '#6366f1', modules: 8  },
  { id: 'javascript', title: 'JavaScript',               icon: '⚡', accent: '#f59e0b', modules: 6  },
  { id: 'java',       title: 'Java',                     icon: '☕', accent: '#ef4444', modules: 5  },
  { id: 'cpp',        title: 'C++',                      icon: '⚙️', accent: '#06b6d4', modules: 5  },
  { id: 'dsa',        title: 'DSA',                      icon: '🧠', accent: '#8b5cf6', modules: 6  },
  { id: 'sql',        title: 'SQL & Databases',          icon: '🗄️', accent: '#10b981', modules: 4  },
  { id: 'webdev',     title: 'Full Stack Web Dev',       icon: '🌐', accent: '#ec4899', modules: 6  },
];

export function InstStudentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyProgress, setAcademyProgress] = useState<any[]>([]);
  const navigate = useNavigate();
  const { student } = useInstStudentStore();
  const studentId = student?.id?.toString() || student?.careerId || 'guest';

  useEffect(() => {
    // Load institution courses
    instStudentApi.getDashboard()
      .then(r => setCourses(r.data.courses || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));

    // Load academy progress from backend
    instStudentApi.getAcademyProgress()
      .then(r => setAcademyProgress(r.data || []))
      .catch(() => {
        // Fallback to localStorage
        const lsProgress = ACADEMY_COURSES.map(c => {
          const key = `hx_academy_${studentId}_${c.id}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          try { return { course_id: c.id, ...JSON.parse(raw) }; } catch { return null; }
        }).filter(Boolean);
        setAcademyProgress(lsProgress);
      });
  }, []);

  const getAcademyProg = (courseId: string) => {
    const p = academyProgress.find(p => p.course_id === courseId || p.courseId === courseId);
    if (!p) return null;
    const done = p.completed?.length || 0;
    return { done, xp: p.xp || 0, cert: p.claimed_cert || p.claimedCert || false };
  };

  const enrolledAcademy = ACADEMY_COURSES.filter(c => getAcademyProg(c.id) !== null);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.accent} transparent transparent transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">My Courses</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          {courses.length} institution course{courses.length !== 1 ? 's' : ''} · {enrolledAcademy.length} AI Academy course{enrolledAcademy.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── INSTITUTION COURSES ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} style={{ color: C.accent }} />
          <h2 className="font-bold text-white text-sm">Institution Courses</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${C.accent}22`, color: C.accent }}>
            {courses.length}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <BookOpen size={32} className="mx-auto mb-3 opacity-30 text-white" />
            <p className="text-sm" style={{ color: '#475569' }}>Not enrolled in any institution course yet</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>Your institution admin will assign you to a batch with a course</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(c => {
              const enrollment = c.students?.[0]?.CourseStudent || c.CourseStudent;
              const status = enrollment?.status || 'Enrolled';
              return (
                <div key={c.id} className="rounded-xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${C.accent}22`, color: C.accent }}>
                      <BookOpen size={20} />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                      background: status === 'Completed' ? 'rgba(16,185,129,0.15)' : status === 'Dropped' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                      color: status === 'Completed' ? '#34d399' : status === 'Dropped' ? '#f87171' : '#818cf8',
                    }}>{status}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{c.name}</h3>
                  {c.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: '#64748b' }}>{c.description}</p>}
                  {c.duration && (
                    <div className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#475569' }}>
                      <Clock size={11} /> {c.duration} {c.durationUnit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AI ACADEMY COURSES ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#f59e0b' }} />
            <h2 className="font-bold text-white text-sm">🎓 AI Academy Courses</h2>
            {enrolledAcademy.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                {enrolledAcademy.length} started
              </span>
            )}
          </div>
          <button onClick={() => navigate('/inst-student/academy')}
            className="flex items-center gap-1 text-xs font-bold transition"
            style={{ color: C.accent }}>
            View All <ChevronRight size={12} />
          </button>
        </div>

        {/* All 7 academy courses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACADEMY_COURSES.map(c => {
            const prog = getAcademyProg(c.id);
            const pct = prog ? Math.min(100, Math.round((prog.done / (c.modules * 5)) * 100)) : 0;
            const isCompleted = pct >= 100 || prog?.cert;
            return (
              <div key={c.id}
                className="rounded-xl p-4 transition hover:-translate-y-0.5"
                style={{
                  background: prog ? `linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.98))` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCompleted ? '#34d39933' : prog ? c.accent + '33' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0"
                    onClick={() => navigate('/inst-student/academy')}
                    style={{ cursor: 'pointer' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white truncate">{c.title}</span>
                      {isCompleted && <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: '#34d399' }}>✓ Completed</span>}
                    </div>
                    {prog ? (
                      <>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: isCompleted ? '#34d399' : c.accent }} />
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: isCompleted ? '#34d399' : c.accent }}>{pct}%</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: '#475569' }}>{prog.done} lessons done</span>
                          {prog.xp > 0 && <span className="text-xs" style={{ color: '#f59e0b' }}>⚡ {prog.xp} XP</span>}
                          {prog.cert && <span className="text-xs" style={{ color: '#34d399' }}>🏆 Certified</span>}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#334155' }}>
                        <span>{c.modules} modules · Free</span>
                      </div>
                    )}
                  </div>
                  {/* Download button if completed */}
                  {isCompleted ? (
                    <button
                      onClick={e => { e.stopPropagation(); void instStudentApi.downloadAcademyCertPdf(c.id, c.title).catch(() => toast.error('Download failed')); }}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                      title="Download Certificate">
                      <Download size={12} /> PDF
                    </button>
                  ) : (
                    <ChevronRight size={14} onClick={() => navigate('/inst-student/academy')} style={{ color: prog ? c.accent : '#334155', flexShrink: 0, cursor: 'pointer' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Go to Academy CTA */}
        <button onClick={() => navigate('/inst-student/academy')}
          className="w-full mt-3 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
          <GraduationCap size={16} /> Open AI Academy
        </button>
      </div>
    </div>
  );
}