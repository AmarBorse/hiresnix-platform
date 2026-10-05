// src/pages/instStudent/InstStudentCourses.tsx
import React, { useEffect, useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.instStudent;

export function InstStudentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load institution courses
    instStudentApi.getDashboard()
      .then(r => setCourses(r.data.courses || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));

  }, []);

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
          {courses.length} institution course{courses.length !== 1 ? 's' : ''}
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

    </div>
  );
}