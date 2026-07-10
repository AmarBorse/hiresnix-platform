// src/pages/institution/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Layers, BookOpen, Award, ChevronRight } from 'lucide-react';
import { institutionApi } from '../../api/institution';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;

interface DashStats {
  totalStudents: number; totalBatches: number; totalCourses: number; totalCertificates: number;
  recentStudents: any[]; recentBatches: any[];
}

function GlassStatCard({ label, value, icon: Icon, accent, to, delay = 0 }: any) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(to)} className="stat-card group cursor-pointer animate-page" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg,${accent}33,${accent}11)`, border: `1px solid ${accent}44` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition mt-1" />
      </div>
      <p className="text-2xl font-black text-white">{value ?? 0}</p>
      <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{label}</p>
    </div>
  );
}

export function InstitutionDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    institutionApi.getDashboard()
      .then(r => setStats(r.data))
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
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(59,130,246,0.1) 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right,rgba(139,92,246,0.08) 0%,transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.accent }}>Institution Portal</p>
          <h1 className="text-2xl font-black text-white mt-1">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Manage your students, batches, and certificates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassStatCard label="Total Students"   value={stats?.totalStudents ?? 0}     icon={Users}    accent="#8B5CF6" to="/institution/students"     delay={0}   />
        <GlassStatCard label="Total Batches"    value={stats?.totalBatches ?? 0}      icon={Layers}   accent="#6366F1" to="/institution/batches"      delay={60}  />
        <GlassStatCard label="Total Courses"    value={stats?.totalCourses ?? 0}      icon={BookOpen} accent="#3B82F6" to="/institution/courses"      delay={120} />
        <GlassStatCard label="Certificates"     value={stats?.totalCertificates ?? 0} icon={Award}    accent="#10B981" to="/institution/certificates" delay={180} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Students */}
        <div className="rounded-2xl p-5 animate-page" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-sm mb-4">Recent Students</h2>
          {(stats?.recentStudents || []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No students yet</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentStudents || []).slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${C.accent},${C.accent}99)` }}>
                    {s.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                    <p className="text-xs truncate" style={{ color: '#64748b' }}>{s.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Batches */}
        <div className="rounded-2xl p-5 animate-page stagger-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-sm mb-4">Recent Batches</h2>
          {(stats?.recentBatches || []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No batches yet</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentBatches || []).slice(0, 5).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: C.accent }} />
                    <p className="text-sm font-semibold text-white">{b.name}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.15)', color: C.accent }}>
                    {b.studentCount ?? 0} students
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}