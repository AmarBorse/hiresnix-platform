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

// ── Internship Progress Section ───────────────────────────────────
function InternshipProgressSection() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    institutionApi.getInternshipProgress()
      .then(r => setEnrollments(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by month-year of startDate
  const groups: Record<string, any[]> = {};
  enrollments.forEach((e: any) => {
    const key = e.startDate
      ? new Date(e.startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : 'No Start Date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'No Start Date') return 1;
    if (b === 'No Start Date') return -1;
    return new Date(groups[a][0].startDate) > new Date(groups[b][0].startDate) ? 1 : -1;
  });

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="animate-spin" size={22} style={{color: C.accent}} />
    </div>
  );

  if (enrollments.length === 0) return (
    <div className="rounded-xl p-6 text-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
      <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎓</div>
      <p className="text-sm font-semibold" style={{color:'#475569'}}>No students enrolled in Hiresnix Internship yet</p>
      <p className="text-xs mt-1" style={{color:'#334155'}}>Students who apply with your institution name will appear here</p>
    </div>
  );

  // ── Batch Cards View ──
  if (selectedBatch === null) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {sortedKeys.map(month => {
        const bStudents = groups[month];
        const active    = bStudents.filter((e: any) => e.status === 'Active').length;
        const completed = bStudents.filter((e: any) => e.status === 'Completed').length;
        const firstDate = bStudents[0]?.startDate;
        return (
          <div key={month} onClick={() => setSelectedBatch(month)}
            className="rounded-xl p-4 cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
            style={{background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(15,23,42,0.95))',border:'1px solid rgba(139,92,246,0.2)'}}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{month} Batch</h3>
                {firstDate && (
                  <p className="text-xs mt-0.5" style={{color:'#475569'}}>
                    From {new Date(firstDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                  </p>
                )}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold mb-2" style={{color:C.accent}}>
              <Users size={20} style={{color:C.accent}} />
              {bStudents.length}
              <span className="text-sm font-normal" style={{color:'#64748b'}}>students</span>
            </div>
            <div className="flex gap-3 text-xs mb-3">
              <span className="text-green-400 font-semibold">{active} active</span>
              {completed > 0 && <span className="text-purple-400 font-semibold">{completed} completed</span>}
            </div>
            <div className="pt-2 flex items-center justify-center gap-1 text-xs font-medium" style={{borderTop:'1px solid rgba(255,255,255,0.06)',color:C.accent}}>
              <ChevronDown size={13} /> View Students
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Batch Detail View ──
  const bStudents = groups[selectedBatch] || [];
  return (
    <div className="rounded-xl overflow-hidden" style={{background:'rgba(15,23,42,0.95)',border:'1px solid rgba(255,255,255,0.1)'}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)'}}>
        <button onClick={() => { setSelectedBatch(null); setExpandedId(null); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition">
          <ChevronUp size={16} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">{selectedBatch} Batch</p>
          <p className="text-xs" style={{color:'#64748b'}}>{bStudents.length} students · {bStudents.filter((e:any)=>e.status==='Active').length} active</p>
        </div>
      </div>

      {/* Students */}
      <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.05)'}}>
        {bStudents.map((e: any) => {
          const taskLogs = Array.isArray(e.taskLogs) ? e.taskLogs : [];
          const lastActive = e.lastActive
            ? new Date(e.lastActive).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})
            : '—';
          const isExpanded = expandedId === e.id;

          return (
            <div key={e.id}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition"
                onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{background:`linear-gradient(135deg,${C.accent},${C.accent}88)`}}>
                  {e.studentName?.[0]?.toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{e.studentName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      e.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{e.status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-xs" style={{color:'#60a5fa'}}>{e.domainName}</p>
                    {e.careerId && <span className="text-[10px] font-mono font-bold" style={{color:C.accent}}>{e.careerId}</span>}
                    {e.department && <span className="text-[10px]" style={{color:'#475569'}}>{e.department}</span>}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-24 rounded-full h-1.5" style={{background:'rgba(255,255,255,0.1)'}}>
                      <div className="h-1.5 rounded-full transition-all" style={{width:`${e.progress??0}%`,background:C.accent}} />
                    </div>
                    <span className="text-xs font-bold" style={{color:C.accent}}>{e.progress??0}%</span>
                  </div>
                </div>
                {/* Right side */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-bold text-white">{taskLogs.length} tasks</p>
                  <p className="text-[10px] mt-0.5" style={{color:'#475569'}}>Last: {lastActive}</p>
                </div>
                {isExpanded ? <ChevronUp size={13} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-500 flex-shrink-0" />}
              </div>

              {/* Expanded task logs */}
              {isExpanded && (
                <div className="px-4 pb-3" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex gap-4 text-xs mt-2 mb-3 flex-wrap">
                    <span style={{color:'#475569'}}>📧 {e.email}</span>
                    {e.startDate && <span style={{color:'#475569'}}>Started: {new Date(e.startDate).toLocaleDateString('en-IN')}</span>}
                    {e.completedAt && <span style={{color:'#34d399'}}>✅ Completed: {new Date(e.completedAt).toLocaleDateString('en-IN')}</span>}
                  </div>
                  {taskLogs.length === 0 ? (
                    <p className="text-xs" style={{color:'#334155'}}>No tasks submitted yet</p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      <p className="text-xs font-semibold mb-2" style={{color:'#64748b'}}>Task Logs ({taskLogs.length})</p>
                      {[...taskLogs].reverse().map((log: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)'}}>
                          <CheckCircle size={11} className="mt-0.5 flex-shrink-0" style={{color:'#34d399'}} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white">{log.title}</p>
                            {log.description && <p className="text-[10px]" style={{color:'#475569'}}>{String(log.description||'').split('\n').join(' ').trim()}</p>}
                            {log.url && <a href={log.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline truncate block">{log.url}</a>}
                            <p className="text-[10px] mt-0.5" style={{color:'#334155'}}>
                              Week {log.week} · {log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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

      {/* Internship Progress Section */}
      <div className="animate-page" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'1rem',padding:'1.25rem'}}>
        <div className="flex items-center gap-2 mb-4">
          <span style={{fontSize:'1.1rem'}}>🎓</span>
          <h2 className="font-bold text-white text-sm">Hiresnix Internship — Student Progress</h2>
        </div>
        <InternshipProgressSection />
      </div>


    </div>
  );
}