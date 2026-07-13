// src/pages/institution/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Layers, BookOpen, Award, ChevronRight, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { institutionApi } from '../../api/institution';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AcademyAdminView } from './AcademyAdminView';
import { PORTAL_COLORS } from '../../components/layout/PortalTheme';

const C = PORTAL_COLORS.institution;

interface DashStats {
  totalStudents: number; totalBatches: number; totalCourses: number; totalCertificates: number;
  recentStudents: any[]; recentBatches: any[]; completedBatches: any[];
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

// Completed Batch Detail Modal
function CompletedBatchModal({ batch, onClose }: { batch: any; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    institutionApi.getBatchStudents(batch.id)
      .then(r => setStudents(r.data || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [batch.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} style={{color:"#34d399"}} />
              <h2 className="font-bold text-white">{batch.name}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>Completed</span>
            </div>
            <p className="text-xs mt-0.5" style={{color:"#64748b"}}>{batch.studentCount ?? 0} students · {batch.startDate && `${batch.startDate} → ${batch.endDate || 'ongoing'}`}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {/* Students */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${C.accent} transparent transparent transparent`}} />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-8" style={{color:"#64748b"}}>No students in this batch</p>
          ) : (
            <div className="space-y-2">
              {students.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:"rgba(255,255,255,0.04)"}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{background:`linear-gradient(135deg,#34d399,#10b981)`}}>
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                    <p className="text-xs truncate" style={{color:"#64748b"}}>{s.careerId} · {s.department || s.email}</p>
                  </div>
                  <CheckCircle size={14} style={{color:"#34d399",flexShrink:0}} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-xl hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstitutionDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

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

        {/* Active Batches */}
        <div className="rounded-2xl p-5 animate-page stagger-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold text-white text-sm mb-4">Active Batches</h2>
          {(stats?.recentBatches || []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No active batches</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentBatches || []).map((b: any) => (
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

      {/* Academy Progress Section */}
      <AcademyAdminView />

      {/* Completed Batches */}
      {(stats?.completedBatches || []).length > 0 && (
        <div className="animate-page" style={{animationDelay:"0.2s"}}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} style={{color:"#34d399"}} />
            <h2 className="font-bold text-white text-sm">Completed Batches</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>
              {(stats?.completedBatches || []).length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(stats?.completedBatches || []).map((b: any) => (
              <div key={b.id} onClick={() => setSelectedBatch(b)}
                className="rounded-xl p-4 cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
                style={{background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(15,23,42,0.95))",border:"1px solid rgba(16,185,129,0.2)"}}>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle size={13} style={{color:"#34d399"}} />
                  <span className="text-xs font-bold" style={{color:"#34d399"}}>Completed</span>
                </div>
                <p className="font-bold text-white text-sm mb-1">{b.name}</p>
                {b.trainerName && <p className="text-xs mb-1" style={{color:"#64748b"}}>{b.trainerName}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{color:"#64748b"}}>{b.studentCount ?? 0} students</span>
                  <ChevronRight size={12} style={{color:"#34d399"}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Batch Modal */}
      {selectedBatch && (
        <CompletedBatchModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      )}
    </div>
  );
}