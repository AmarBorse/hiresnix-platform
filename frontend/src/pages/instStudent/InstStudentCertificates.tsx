// src/pages/instStudent/InstStudentCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle2, GraduationCap } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Course Completion':   { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  'Training Completion': { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  'Skill Assessment':    { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
};

const ACADEMY_COURSES = [
  { id: 'python',     title: 'Python Programming',       icon: '🐍' },
  { id: 'javascript', title: 'JavaScript',               icon: '⚡' },
  { id: 'java',       title: 'Java',                     icon: '☕' },
  { id: 'cpp',        title: 'C++',                      icon: '⚙️' },
  { id: 'dsa',        title: 'Data Structures & Algorithms', icon: '🧠' },
  { id: 'sql',        title: 'SQL & Databases',          icon: '🗄️' },
  { id: 'webdev',     title: 'Full Stack Web Development', icon: '🌐' },
];

export function InstStudentCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [academyProgress, setAcademyProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      instStudentApi.getCertificates().catch(() => ({ success: false, data: [] })),
      instStudentApi.getAcademyProgress().catch(() => ({ success: false, data: [] })),
    ]).then(([certsRes, progressRes]) => {
      // getCertificates returns {success, data:[]} 
      // getAcademyProgress returns {success, data:[]}
      const certsData = Array.isArray(certsRes) ? certsRes : (certsRes?.data || []);
      const progressData = Array.isArray(progressRes) ? progressRes : (progressRes?.data || []);
      setCerts(certsData);
      setAcademyProgress(progressData);
    }).finally(() => setLoading(false));
  }, []);

  // Academy courses where progress >= 100% or cert claimed
  const academyCerts = ACADEMY_COURSES.filter(c => {
    const p = academyProgress.find((p: any) => p.course_id === c.id || p.courseId === c.id);
    if (!p) return false;
    const done = p.completed?.length || 0;
    const pct = Math.min(100, Math.round((done / (8 * 5)) * 100)); // rough estimate
    return p.claimed_cert || p.claimedCert || done >= 35; // 35+ lessons = completed
  });

  const totalCerts = certs.length + academyCerts.length;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16" style={{ color: '#64748b' }}>
      <p>Failed to load certificates. Please refresh.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">My Certificates</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{totalCerts} certificate{totalCerts !== 1 ? 's' : ''} earned</p>
      </div>

      {totalCerts === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Award size={40} className="mx-auto mb-3 opacity-30 text-white" />
          <p className="text-white opacity-50">No certificates yet</p>
          <p className="text-sm mt-1" style={{ color: '#334155' }}>Complete courses to earn certificates</p>
        </div>
      ) : (
        <>
          {/* Institution Certificates */}
          {certs.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award size={15} style={{ color: '#6366f1' }} /> Institution Certificates
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{certs.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certs.map(c => {
                  const typeStyle = TYPE_COLORS[c.type] || { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' };
                  return (
                    <div key={c.id} className="rounded-xl p-5 transition hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.95))', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: typeStyle.bg }}>
                          <Award size={20} style={{ color: typeStyle.color }} />
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: typeStyle.bg, color: typeStyle.color }}>
                          {c.type}
                        </span>
                      </div>
                      <p className="font-bold text-white">{c.institutionName}</p>
                      {c.courseName && <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{c.courseName}</p>}
                      <p className="text-xs mt-2" style={{ color: '#475569' }}>
                        Issued: {new Date(c.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#34d399' }}>
                          <CheckCircle2 size={13} /> Valid Certificate
                        </div>
                        <button onClick={() => window.open(instStudentApi.downloadCertPdf(c.certificateId), '_blank')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition hover:opacity-80"
                          style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                      <p className="text-xs font-mono mt-2" style={{ color: '#334155' }}>{c.certificateId}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Academy Certificates */}
          {academyCerts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <GraduationCap size={15} style={{ color: '#f59e0b' }} /> AI Academy Certificates
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{academyCerts.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academyCerts.map(c => (
                  <div key={c.id} className="rounded-xl p-5 transition hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,25,50,0.95))', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ background: 'rgba(245,158,11,0.1)' }}>
                        {c.icon}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        AI Academy
                      </span>
                    </div>
                    <p className="font-bold text-white">{c.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Hiresnix AI Academy</p>
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#34d399' }}>
                        <CheckCircle2 size={13} /> Completed
                      </div>
                      <button onClick={() => instStudentApi.downloadAcademyCertPdf(c.id, c.title).catch(() => toast.error('Download failed'))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition hover:opacity-80"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <Download size={13} /> Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}