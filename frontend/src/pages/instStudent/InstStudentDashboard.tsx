// src/pages/instStudent/InstStudentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Award, BookOpen, Layers, GraduationCap, ChevronRight } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';
import { toast } from 'sonner';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.instStudent;

export function InstStudentDashboard() {
  const { student } = useInstStudentStore();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.accent} transparent transparent transparent` }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15) 0%,rgba(239,68,68,0.08) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right,rgba(245,158,11,0.08) 0%,transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>Welcome back 👋</p>
          <h1 className="text-2xl font-black text-white mt-1">{student?.name}</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{student?.institutionName}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <GraduationCap size={16} style={{ color: C.accent }} />
            <span className="font-mono font-bold tracking-wider" style={{ color: C.accent }}>{student?.careerId}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: '#64748b' }}>Your Hiresnix Career ID</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'My Batches',      value: data?.batches?.length ?? 0,      icon: Layers,   accent: '#8B5CF6' },
          { label: 'My Courses',      value: data?.courses?.length ?? 0,      icon: BookOpen, accent: '#3B82F6' },
          { label: 'My Certificates', value: data?.certificates?.length ?? 0, icon: Award,    accent: '#10B981' },
        ].map((s, i) => (
          <div key={s.label} className="stat-card animate-page" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `linear-gradient(135deg,${s.accent}33,${s.accent}11)`, border: `1px solid ${s.accent}44` }}>
              <s.icon size={16} style={{ color: s.accent }} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Certificates */}
      {(data?.certificates?.length ?? 0) > 0 && (
        <div className="rounded-2xl p-5 animate-page" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Award size={15} style={{ color: C.accent }} /> Recent Certificates
          </h2>
          <div className="space-y-2">
            {data.certificates.slice(0, 3).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-sm font-semibold text-white">{c.type || 'Certificate'}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{c.courseName || ''}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#4ADE80' }}>✓ Issued</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}