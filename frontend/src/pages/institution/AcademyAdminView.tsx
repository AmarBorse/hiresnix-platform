// src/pages/institution/AcademyAdminView.tsx
// Institution Admin can see which students enrolled in which Academy course
// Data comes from localStorage (shared on same device) or student self-reports

import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Flame, ChevronRight, Users, BarChart2, Award } from 'lucide-react';
import { institutionApi } from '../../api/institution';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;

const COURSE_NAMES: Record<string, { title: string; icon: string; accent: string }> = {
  python:     { title: 'Python Programming',     icon: '🐍', accent: '#6366f1' },
  javascript: { title: 'JavaScript',             icon: '⚡', accent: '#f59e0b' },
  java:       { title: 'Java',                   icon: '☕', accent: '#ef4444' },
  cpp:        { title: 'C++',                    icon: '⚙️', accent: '#06b6d4' },
  dsa:        { title: 'DSA',                    icon: '🧠', accent: '#8b5cf6' },
  sql:        { title: 'SQL & Databases',        icon: '🗄️', accent: '#10b981' },
  webdev:     { title: 'Full Stack Web Dev',     icon: '🌐', accent: '#ec4899' },
};

export function AcademyAdminView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string|null>(null);

  useEffect(() => {
    institutionApi.getStudents({ limit: 200 })
      .then(r => setStudents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Read academy progress from localStorage for each student
  const getStudentAcademy = (careerId: string, studentId: string) => {
    const id = studentId || careerId;
    const enrolled: string[] = [];
    const progress: Record<string, { pct: number; done: number; total: number; cert: boolean; xp: number; lastActive?: string }> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Check both id formats
      if (key.startsWith(`hx_academy_${id}_`) || key.startsWith(`hx_academy_${careerId}_`)) {
        const courseId = key.split('_').pop() || '';
        if (courseId && courseId !== 'enrolled') {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const done = data.completed?.length || 0;
            enrolled.push(courseId);
            progress[courseId] = {
              pct: data.total ? Math.round((done / data.total) * 100) : 0,
              done, total: data.total || 0, cert: data.claimedCert || false,
              xp: data.xp || 0, lastActive: data.lastActive,
            };
          } catch {}
        }
      }
    }
    return { enrolled, progress };
  };

  // Aggregate stats
  const allStats = students.map(s => ({
    ...s,
    academy: getStudentAcademy(s.careerId, s.id?.toString()),
  }));

  const totalEnrolled = allStats.filter(s => s.academy.enrolled.length > 0).length;
  const totalCerts = allStats.reduce((a, s) =>
    a + Object.values(s.academy.progress).filter((p: any) => p.cert).length, 0);
  const totalXp = allStats.reduce((a, s) =>
    a + Object.values(s.academy.progress).reduce((b: number, p: any) => b + (p.xp || 0), 0), 0);

  // Course enrollment counts
  const courseCounts = Object.keys(COURSE_NAMES).map(id => ({
    id,
    count: allStats.filter(s => s.academy.enrolled.includes(id)).length,
    completed: allStats.filter(s => s.academy.progress[id]?.pct === 100).length,
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.accent} transparent transparent transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-white">🎓 AI Academy — Student Progress</h2>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Track which students are enrolled and their progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Students Enrolled', value: totalEnrolled, icon: Users, color: '#6366f1' },
          { label: 'Certificates Earned', value: totalCerts, icon: Award, color: '#f59e0b' },
          { label: 'Total XP Earned', value: totalXp, icon: Flame, color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <s.icon size={16} style={{ color: s.color, marginBottom: '8px' }} />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course wise breakdown */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          Course Enrollment Overview
        </div>
        {courseCounts.map(c => {
          const info = COURSE_NAMES[c.id];
          const pct = students.length > 0 ? Math.round((c.count / students.length) * 100) : 0;
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 transition" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-lg flex-shrink-0">{info.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{info.title}</span>
                  <span className="text-xs" style={{ color: '#64748b' }}>{c.count} enrolled · {c.completed} completed</span>
                </div>
                <div className="rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: info.accent }} />
                </div>
              </div>
              <span className="text-xs font-bold flex-shrink-0" style={{ color: info.accent }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Student list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          Student Progress
        </div>
        {allStats.length === 0 ? (
          <div className="text-center py-10" style={{ color: '#475569' }}>No students found</div>
        ) : allStats.map(s => {
          const enrolled = s.academy.enrolled;
          const certs = Object.values(s.academy.progress).filter((p: any) => p.cert).length;
          const xp = Object.values(s.academy.progress).reduce((a: number, p: any) => a + (p.xp || 0), 0);
          const isSelected = selected === s.id?.toString();

          return (
            <div key={s.id}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(255,255,255,0.04)' : '' }}
                onClick={() => setSelected(isSelected ? null : s.id?.toString())}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                  style={{ background: `linear-gradient(135deg,${C.accent},${C.accent}99)` }}>
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{s.name}</div>
                  <div className="text-xs truncate" style={{ color: '#64748b' }}>{s.careerId}</div>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  {enrolled.length > 0
                    ? <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        📚 {enrolled.length} courses
                      </span>
                    : <span style={{ color: '#334155' }}>Not started</span>
                  }
                  {certs > 0 && <span className="font-bold" style={{ color: '#f59e0b' }}>🏆 {certs}</span>}
                  {xp > 0 && <span style={{ color: '#64748b' }}>{xp} XP</span>}
                  <ChevronRight size={14} style={{ color: '#334155', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {/* Expanded detail */}
              {isSelected && enrolled.length > 0 && (
                <div className="px-4 pb-4 pt-2 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {enrolled.map(courseId => {
                    const info = COURSE_NAMES[courseId] || { title: courseId, icon: '📚', accent: '#6366f1' };
                    const prog = s.academy.progress[courseId];
                    return (
                      <div key={courseId} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${info.accent}22` }}>
                        <span className="text-base flex-shrink-0">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-white">{info.title}</span>
                            <span className="text-xs font-bold" style={{ color: info.accent }}>{prog.pct}%</span>
                          </div>
                          <div className="rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${prog.pct}%`, background: info.accent }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs" style={{ color: '#475569' }}>{prog.done} lessons done</span>
                            <div className="flex items-center gap-2">
                              {prog.cert && <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>🏆 Certified</span>}
                              {prog.xp > 0 && <span className="text-xs" style={{ color: '#64748b' }}>{prog.xp} XP</span>}
                              {prog.lastActive && <span className="text-xs" style={{ color: '#334155' }}>Last: {new Date(prog.lastActive).toLocaleDateString('en-IN')}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {isSelected && enrolled.length === 0 && (
                <div className="px-4 py-3 text-xs" style={{ color: '#334155', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                  This student hasn't started any Academy course yet.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
