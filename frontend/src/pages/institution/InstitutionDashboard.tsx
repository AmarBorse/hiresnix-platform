// src/pages/institution/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Layers, BookOpen, Award, ChevronRight, CheckCircle, X, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
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

// ── Batch Cards Section ───────────────────────────────────────────
function BatchCardsSection() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  useEffect(() => {
    institutionApi.getBatches()
      .then(r => setBatches(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openBatch = async (batch: any) => {
    setSelectedBatch(batch);
    setStudentsLoading(true);
    try {
      const r = await institutionApi.getBatchStudents(batch.id);
      setBatchStudents(r.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setStudentsLoading(false); }
  };

  const activeBatches   = batches.filter((b: any) => b.status !== 'Completed');
  const completedBatches = batches.filter((b: any) => b.status === 'Completed');

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="animate-spin" size={24} style={{color: C.accent}} />
    </div>
  );

  if (batches.length === 0) return (
    <div className="rounded-2xl p-6 text-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
      <Layers size={32} className="mx-auto mb-2 opacity-30" style={{color: C.accent}} />
      <p className="text-sm" style={{color:'#475569'}}>No batches created yet</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Active Batches */}
      {activeBatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-bold text-white text-sm">Active Batches</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.15)',color:C.accent}}>
              {activeBatches.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeBatches.map((b: any) => (
              <div key={b.id} onClick={() => openBatch(b)}
                className="rounded-xl p-4 cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
                style={{background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(15,23,42,0.95))',border:'1px solid rgba(139,92,246,0.2)'}}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold" style={{color:'#34d399'}}>Active</span>
                </div>
                <p className="font-bold text-white text-sm mb-1">{b.name}</p>
                {b.course?.name && <p className="text-xs mb-2" style={{color:'#64748b'}}>{b.course.name}</p>}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs" style={{color: C.accent}}>
                    <Users size={12} />
                    <span className="font-bold">{b.studentCount ?? 0}</span>
                    <span style={{color:'#64748b'}}>students</span>
                  </div>
                  <ChevronRight size={12} style={{color: C.accent}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Batches */}
      {completedBatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} style={{color:'#34d399'}} />
            <h2 className="font-bold text-white text-sm">Completed Batches</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(16,185,129,0.15)',color:'#34d399'}}>
              {completedBatches.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {completedBatches.map((b: any) => (
              <div key={b.id} onClick={() => openBatch(b)}
                className="rounded-xl p-4 cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
                style={{background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(15,23,42,0.95))',border:'1px solid rgba(16,185,129,0.2)'}}>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle size={12} style={{color:'#34d399'}} />
                  <span className="text-xs font-bold" style={{color:'#34d399'}}>Completed</span>
                </div>
                <p className="font-bold text-white text-sm mb-1">{b.name}</p>
                {b.course?.name && <p className="text-xs mb-2" style={{color:'#64748b'}}>{b.course.name}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{color:'#64748b'}}>{b.studentCount ?? 0} students</span>
                  <ChevronRight size={12} style={{color:'#34d399'}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
            style={{background:'linear-gradient(135deg,#0f1729,#0d1b35)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 25px 60px rgba(0,0,0,0.7)'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white">{selectedBatch.name}</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={selectedBatch.status === 'Completed'
                      ? {background:'rgba(16,185,129,0.15)',color:'#34d399'}
                      : {background:'rgba(139,92,246,0.15)',color:C.accent}}>
                    {selectedBatch.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{color:'#64748b'}}>
                  {selectedBatch.course?.name && `${selectedBatch.course.name} · `}
                  {batchStudents.length} students
                  {selectedBatch.startDate && ` · From ${new Date(selectedBatch.startDate).toLocaleDateString('en-IN')}`}
                </p>
              </div>
              <button onClick={() => { setSelectedBatch(null); setBatchStudents([]); setExpandedStudent(null); }}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-4">
              {studentsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" size={24} style={{color: C.accent}} />
                </div>
              ) : batchStudents.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{color:'#475569'}}>No students in this batch</p>
              ) : (
                <div className="space-y-2">
                  {batchStudents.map((s: any) => (
                    <div key={s.id} className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition"
                        onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                          style={{background:`linear-gradient(135deg,${C.accent},${C.accent}88)`}}>
                          {s.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono" style={{color: C.accent}}>{s.careerId}</span>
                            {s.department && <span className="text-xs" style={{color:'#475569'}}>{s.department}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {s.status === 'Completed' && <CheckCircle size={14} style={{color:'#34d399'}} />}
                          {expandedStudent === s.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                        </div>
                      </div>
                      {expandedStudent === s.id && (
                        <div className="px-4 pb-3 pt-1 space-y-1.5" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                          {s.email && <p className="text-xs" style={{color:'#475569'}}>📧 {s.email}</p>}
                          {s.phone && <p className="text-xs" style={{color:'#475569'}}>📱 {s.phone}</p>}
                          {s.year && <p className="text-xs" style={{color:'#475569'}}>📚 {s.year}</p>}
                          {s.enrolledAt && <p className="text-xs" style={{color:'#475569'}}>
                            Enrolled: {new Date(s.enrolledAt).toLocaleDateString('en-IN')}
                          </p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 flex-shrink-0" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              <button onClick={() => { setSelectedBatch(null); setBatchStudents([]); setExpandedStudent(null); }}
                className="w-full py-2 text-sm font-medium rounded-xl hover:bg-white/10 text-gray-400 transition"
                style={{border:'1px solid rgba(255,255,255,0.1)'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

      {/* Batch Cards Section */}
      <BatchCardsSection />

      {/* Academy Progress Section */}
      <AcademyAdminView />


    </div>
  );
}