// src/pages/admin/AdminIPlatform.tsx
// Full Hiresnix Internship Platform management for admin
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { toast } from 'sonner';
import {
  Users, BookOpen, CheckCircle, Clock, Plus, Trash2,
  Loader2, Award, Download, Star, ChevronDown, ChevronUp,
  GraduationCap, Globe, FileText, Video, Link2, RefreshCw
} from 'lucide-react';
import client from '../../api/client';

// ── CSV Download helper ───────────────────────────────────────────
function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const val = row[k] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
}

// ── Excel (.xlsx) Download helper (SheetJS) ──────────────────────
function downloadExcel(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  import('xlsx').then(XLSX => {
    const keys = Object.keys(data[0]);

    // Build rows: header + data
    const wsData = [
      keys, // header row
      ...data.map(row =>
        keys.map(k => {
          const val = row[k] ?? '';
          return typeof val === 'object' ? JSON.stringify(val) : String(val);
        })
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths — auto-fit based on max content length
    const colWidths = keys.map((key, ci) => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen, 10), 60) };
    });
    ws['!cols'] = colWidths;

    // Freeze top row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename.replace(/\.csv$/, '') + '.xlsx');
    toast.success(`Downloaded ${filename.replace(/\.csv$/, '')}.xlsx`);
  }).catch(() => {
    // Fallback to CSV if xlsx not available
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => {
      const val = row[k] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  });
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-xs font-medium">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value ?? 0}</p>
      </div>
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700',
    Active: 'bg-blue-100 text-blue-700',
    Completed: 'bg-purple-100 text-purple-700',
    Dropped: 'bg-gray-100 text-gray-600',
  };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

// ── TABS ──────────────────────────────────────────────────────────
type Tab = 'applications' | 'institution' | 'students' | 'domains' | 'resources';

export function AdminIPlatform() {
  const [tab, setTab] = useState<Tab>('applications');
  const [stats, setStats] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedInstBatch, setSelectedInstBatch] = useState<string | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [completeModal, setCompleteModal] = useState<any>(null);
  const [offerModal, setOfferModal] = useState<any>(null);
  const [generatingOffer, setGeneratingOffer] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [appSourceFilter, setAppSourceFilter] = useState<'All' | 'hiresnix' | 'institution'>('All');

  // Forms
  const [domainForm, setDomainForm] = useState({ name: '', description: '', icon: '💻', duration: '8 Weeks', totalSeats: 30 });
  const [resForm, setResForm] = useState({ domainId: '', title: '', type: 'Video', url: '', description: '', week: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    const requests = [
      { key: 'stats', label: 'stats', run: adminApi.getIPlatformStats },
      { key: 'applications', label: 'applications', run: adminApi.getIPlatformApplications },
      { key: 'enrollments', label: 'enrollments', run: adminApi.getIPlatformEnrollments },
      { key: 'domains', label: 'domains', run: adminApi.getIPlatformDomains },
      { key: 'resources', label: 'resources', run: adminApi.getIPlatformResources },
    ] as const;

    const results = await Promise.allSettled(requests.map(({ run }) => run()));

    results.forEach((result, index) => {
      const key = requests[index].key;
      if (result.status === 'fulfilled') {
        const data = result.value.data || [];
        if (key === 'stats') setStats(data || {});
        if (key === 'applications') {
          setApplications(Array.isArray(data) ? data : []);
          setApplicationTotal(Number(result.value.total) || (Array.isArray(data) ? data.length : 0));
        }
        if (key === 'enrollments') setEnrollments(Array.isArray(data) ? data : []);
        if (key === 'domains') setDomains(Array.isArray(data) ? data : []);
        if (key === 'resources') setResources(Array.isArray(data) ? data : []);
      }
    });

    const failed = results
      .map((result, index) => result.status === 'rejected' ? { result, label: requests[index].label } : null)
      .filter(Boolean) as { result: PromiseRejectedResult; label: string }[];

    if (failed.length > 0) {
      const details = failed
        .map(({ result, label }) => `${label}: ${result.reason?.response?.data?.message || result.reason?.message || 'failed'}`)
        .join('; ');
      toast.error(`Failed to load ${failed.map(f => f.label).join(', ')}`);
      console.error('Internship platform load failed:', details, failed.map(f => f.result.reason));
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Approve / Reject application ──────────────────────────────
  const handleAppAction = async (id: number, status: 'Approved' | 'Rejected') => {
    const note = status === 'Rejected' ? prompt('Reason for rejection (optional):') || '' : '';
    setActionId(`app-${id}`);
    try {
      await adminApi.approveIPlatformApplication(id, { status, adminNote: note });
      toast.success(`Application ${status}!`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setActionId(null); }
  };

  // ── Mark enrollment complete ──────────────────────────────────
  const handleMarkComplete = async () => {
    if (!completeModal) return;
    setActionId(`complete-${completeModal.id}`);
    try {
      await adminApi.markEnrollmentComplete(completeModal.id, {
        adminRemark: completeModal.adminRemark || '',
        lorPerformance: completeModal.lorPerformance || 'Excellent',
        lorHighlights: completeModal.lorHighlights || 'Demonstrated excellent skills and dedication.',
      });
      toast.success('Marked complete! Certificate generated 🎉');
      setCompleteModal(null);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setActionId(null); }
  };

  // ── Create domain ─────────────────────────────────────────────
  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createIPlatformDomain(domainForm);
      toast.success('Domain created!');
      setDomainForm({ name: '', description: '', icon: '💻', duration: '8 Weeks', totalSeats: 30 });
      load();
    } catch { toast.error('Failed to create domain'); }
  };

  // ── Add resource ──────────────────────────────────────────────
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.addIPlatformResource({ ...resForm, domainId: Number(resForm.domainId) });
      toast.success('Resource added!');
      setResForm({ domainId: '', title: '', type: 'Video', url: '', description: '', week: 1 });
      load();
    } catch { toast.error('Failed to add resource'); }
  };

  // ── CSV Downloads ─────────────────────────────────────────────
  const downloadApplicationsCSV = () => {
    const rows = applications.map(a => ({
      Name: a.studentName, Email: a.email, Phone: a.phone || '',
      College: a.college || '', Year: a.year || '', Domain: a.domain?.name || '',
      Status: a.status, AppliedOn: new Date(a.createdAt).toLocaleDateString(),
      WhyJoin: a.whyJoin || '', AdminNote: a.adminNote || '',
    }));
    downloadCSV(rows, 'hiresnix_internship_applications.csv');
  };

  const downloadEnrollmentsCSV = () => {
    const rows = enrollments.map(e => ({
      Name: e.studentName, Email: e.email, Domain: e.domain?.name || '',
      Progress: `${e.progress}%`, Status: e.status, TasksSubmitted: (e.taskLogs || []).length,
      StartDate: e.startDate ? new Date(e.startDate).toLocaleDateString() : '',
      CompletedOn: e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '',
      AdminRemark: e.adminRemark || '',
    }));
    downloadCSV(rows, 'hiresnix_internship_students.csv');
  };

  const tabs = [
    { id: 'applications' as Tab, label: '📋 Applications', count: stats.pendingApplications },
    { id: 'institution'  as Tab, label: '🏫 Institution Internship', count: null },
    { id: 'students'     as Tab, label: '🎓 Students',     count: stats.activeEnrollments },
    { id: 'domains'      as Tab, label: '🗂 Domains',      count: null },
    { id: 'resources'    as Tab, label: '📚 Resources',    count: null },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1e3a5f] rounded-2xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/hiresnix-logo.png" alt="" style={{ height: 44, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.5))' }} />
          <div>
            <h1 className="text-xl font-black">Internship Platform</h1>
            <p className="text-slate-400 text-sm">Manage domains, applications, and student progress</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={stats.totalApplications} icon="📋" color="bg-blue-50" />
        <StatCard label="Pending Review"     value={stats.pendingApplications} icon="⏳" color="bg-amber-50" />
        <StatCard label="Active Students"    value={stats.activeEnrollments}  icon="🎓" color="bg-emerald-50" />
        <StatCard label="Completed"          value={stats.completedEnrollments} icon="🏆" color="bg-purple-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 rounded-t-xl" style={{background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 -mb-px ${
              tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-600 hover:text-gray-300'
            }`}>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16 bg-white rounded-b-xl">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      )}

      {/* ── APPLICATIONS ─────────────────────────────────────── */}
      {!loading && tab === 'applications' && (() => {
        const q = appSearch.toLowerCase();
        const filtered = applications.filter((app: any) => {
          const matchSearch = !q ||
            (app.studentName || '').toLowerCase().includes(q) ||
            (app.email || '').toLowerCase().includes(q) ||
            (app.phone || '').toLowerCase().includes(q) ||
            (app.college || '').toLowerCase().includes(q) ||
            (app.domain?.name || '').toLowerCase().includes(q) ||
            (app.institutionName || '').toLowerCase().includes(q);
          const matchStatus = appStatusFilter === 'All' || app.status === appStatusFilter;
          const isInstitutionApp = 
            app.source === 'institution' || 
            (app.email || '').includes('@inst.hiresnix.co.in') || 
            !!app.instStudentId;

          const matchSource = appSourceFilter === 'All' || 
            (appSourceFilter === 'institution' ? isInstitutionApp : !isInstitutionApp);
          return matchSearch && matchStatus && matchSource;
        });

        const pending  = filtered.filter((a: any) => a.status === 'Pending');
        const approved = filtered.filter((a: any) => a.status === 'Approved');
        const rejected = filtered.filter((a: any) => a.status === 'Rejected');

        const AppCard = ({ app, accent, accentColor }: any) => (
          <div className={`rounded-xl border-l-4 ${accent} p-4 hover:shadow-xl transition-all hover:-translate-y-0.5`}
            style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95) 0%,rgba(20,30,55,0.95) 100%)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(12px)"}}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                  style={{background:`linear-gradient(135deg,${accentColor}cc,${accentColor}88)`,border:`1.5px solid ${accentColor}66`}}>
                  {app.studentName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{app.studentName}</p>
                    <Badge status={app.status} />
                  </div>
                  <p className="text-xs mt-0.5" style={{color:"#475569"}}>{app.email} · {app.phone}</p>
                  <p className="text-xs" style={{color:"#475569"}}>{app.college} · {app.year}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{color:"#60a5fa"}}>{app.domain?.name}</p>
                  {app.institutionName && (
                    <p className="text-[11px] mt-0.5 font-semibold" style={{color:"#f59e0b"}}>🏫 {app.institutionName}</p>
                  )}
                  {app.adminNote && app.adminNote.startsWith('Career ID:') && (
                    <p className="text-[11px] mt-0.5 font-mono" style={{color:"#a78bfa"}}>🪪 {app.adminNote}</p>
                  )}
                  <p className="text-[11px] mt-0.5" style={{color:"#475569"}}>Applied: {new Date(app.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {app.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleAppAction(app.id, 'Approved')}
                        disabled={actionId === `app-${app.id}`}
                        className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-2.5 py-1.5 rounded-lg transition">
                        {actionId === `app-${app.id}` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAppAction(app.id, 'Rejected')}
                        disabled={actionId === `app-${app.id}`}
                        className="flex items-center gap-1 text-xs font-bold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-2.5 py-1.5 rounded-lg transition">
                        ✕ Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setOfferModal({
                      applicationId: app.id,
                      candidateName: app.studentName || '',
                      role: `${app.domain?.name || 'Internship'} Intern`,
                      companyName: 'Hiresnix',
                      salary: app.offerSalary || app.salary || 'Unpaid Internship',
                      offerLetterDate: app.offerLetterDate || todayInputValue(),
                      joiningDate: app.offerJoiningDate || '',
                      endDate: app.offerEndDate || '',
                      datesLocked: Boolean(app.offerLetterDate || app.offerJoiningDate || app.offerEndDate),
                    })} className="flex items-center gap-1 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg transition">
                    <FileText size={11} /> Offer
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Hi ${app.studentName},\n\nThank you for applying for the Hiresnix Internship Program. 🎉\n\nTo complete your Profile Verification, please share the following documents:\n\n📄 Updated Resume (PDF)\n💼 LinkedIn Profile URL\n💻 GitHub Profile URL (if available)\n✍️ A brief introduction about your skills, projects, and career interests\n🎓 If this internship is required for your college verification, academic submission, or mandatory internship requirement, please mention it in your reply.\n\n📩 You can send the above documents to:\nWhatsApp: +91 9529120977\nEmail: hr@hiresnix.co.in`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg transition">
                    💬 WA
                  </a>
                </div>
              </div>
            </div>
            {app.whyJoin && (
              <div className="mt-2.5">
                <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
                  {expandedId === app.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  Why they want to join
                </button>
                {expandedId === app.id && (
                  <p className="text-xs mt-1.5 rounded-lg p-3 italic" style={{background:"rgba(255,255,255,0.05)",color:"#94a3b8"}}>"{app.whyJoin}"</p>
                )}
              </div>
            )}
            {app.adminNote && app.status === 'Rejected' && (
              <p className="text-xs mt-1.5 rounded-lg px-3 py-1.5" style={{background:"rgba(239,68,68,0.1)",color:"#f87171"}}>❌ Note: {app.adminNote}</p>
            )}
          </div>
        );

        return (
          <div className="space-y-5">
            {/* Search + Filter + Export bar */}
            <div className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div className="flex-1 min-w-[180px] relative">
                <input
                  type="text"
                  placeholder="Search by name, email, college, domain..."
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none dark-input"
                />
                <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {/* Source filter */}
                {(['All', 'hiresnix', 'institution'] as const).map(s => (
                  <button key={s} onClick={() => setAppSourceFilter(s)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                      appSourceFilter === s
                        ? s === 'institution' ? 'bg-violet-500 text-white'
                          : s === 'hiresnix' ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-white'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}>
                    {s === 'All' ? '🌐 All' : s === 'hiresnix' ? '💙 Hiresnix' : '🏫 Institution'}
                  </button>
                ))}
                <div className="w-px bg-white/10 mx-1" />
                {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(s => (
                  <button key={s} onClick={() => setAppStatusFilter(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                      appStatusFilter === s
                        ? s === 'Pending' ? 'bg-amber-500 text-white'
                          : s === 'Approved' ? 'bg-emerald-500 text-white'
                          : s === 'Rejected' ? 'bg-red-500 text-white'
                          : 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {s}{s !== 'All' ? ` (${applications.filter((a: any) => a.status === s).length})` : ` (${applications.length})`}
                  </button>
                ))}
              </div>
              <button onClick={downloadApplicationsCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                <Download size={13} /> Export CSV
              </button>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 rounded-xl" style={{background:"rgba(15,23,42,0.8)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748b"}}>
                <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
                <p>{appSearch ? 'No results found' : 'No applications yet'}</p>
              </div>
            )}

            {/* PENDING */}
            {pending.length > 0 && (appStatusFilter === 'All' || appStatusFilter === 'Pending') && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <h3 className="font-bold text-white text-sm">⏳ Pending Review <span className="font-black" style={{color:"#fbbf24"}}>({pending.length})</span></h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {pending.map((app: any) => (
                    <AppCard key={app.id} app={app} accent="border-amber-400" accentColor="#f59e0b" />
                  ))}
                </div>
              </div>
            )}

            {/* APPROVED */}
            {approved.length > 0 && (appStatusFilter === 'All' || appStatusFilter === 'Approved') && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-white text-sm">✅ Approved <span className="font-black" style={{color:"#34d399"}}>({approved.length})</span></h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {approved.map((app: any) => (
                    <AppCard key={app.id} app={app} accent="border-emerald-400" accentColor="#10b981" />
                  ))}
                </div>
              </div>
            )}

            {/* REJECTED */}
            {rejected.length > 0 && (appStatusFilter === 'All' || appStatusFilter === 'Rejected') && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <h3 className="font-bold text-white text-sm">❌ Rejected <span className="font-black" style={{color:"#f87171"}}>({rejected.length})</span></h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {rejected.map((app: any) => (
                    <AppCard key={app.id} app={app} accent="border-red-400" accentColor="#ef4444" />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

            {/* ── STUDENTS (ENROLLMENTS) ──────────────────────────── */}
      {!loading && tab === 'students' && (() => {
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

        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {enrollments.length} enrolled students · {sortedKeys.length} batch{sortedKeys.length !== 1 ? 'es' : ''}
              </p>
              <button onClick={downloadEnrollmentsCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                <Download size={13} /> Export CSV
              </button>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-white rounded-xl text-center py-16 text-gray-400 border border-gray-100">
                <Users size={36} className="mx-auto mb-3 opacity-30" />
                <p>No enrolled students yet</p>
              </div>
            ) : selectedBatch === null ? (
              /* ── Batch Cards Grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedKeys.map(month => {
                  const bStudents = groups[month];
                  const active    = bStudents.filter((e: any) => e.status === 'Active').length;
                  const completed = bStudents.filter((e: any) => e.status === 'Completed').length;
                  const firstDate = bStudents[0]?.startDate;
                  return (
                    <div key={month} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedBatch(month)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{month} Batch</h3>
                          {firstDate && (
                            <p className="text-xs mt-0.5" style={{color:"#475569"}}>
                              From {new Date(firstDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>
                      </div>
                      <div className="flex items-center gap-2 text-3xl font-bold text-indigo-600 mb-2">
                        <Users size={22} className="text-indigo-400" />
                        {bStudents.length}
                        <span className="text-sm font-normal text-gray-400">students</span>
                      </div>
                      <div className="flex gap-3 text-xs mb-4">
                        <span className="text-green-600 font-semibold">{active} active</span>
                        {completed > 0 && <span className="text-purple-600 font-semibold">{completed} completed</span>}
                      </div>
                      <div className="pt-3 border-t border-gray-50 flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-medium">
                        <ChevronDown size={14} /> View Students
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Batch Detail View ── */
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                  <button onClick={() => setSelectedBatch(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition">
                    <ChevronUp size={16} />
                  </button>
                  <div className="flex-1">
                    <p className="font-bold text-white">{selectedBatch}</p>
                    <p className="text-xs text-gray-400">{groups[selectedBatch]?.length} students · {(groups[selectedBatch] || []).filter((e:any) => e.status === 'Active').length} active</p>
                  </div>
                  {/* Bulk Mark Complete Button */}
                  {(groups[selectedBatch] || []).some((e: any) => e.status === 'Active') && (
                    <button onClick={async () => {
                      const activeStudents = (groups[selectedBatch] || []).filter((e: any) => e.status === 'Active');
                      if (!window.confirm(`Mark all ${activeStudents.length} active students as Complete and issue certificates?`)) return;
                      let success = 0, failed = 0;
                      for (const e of activeStudents) {
                        try {
                          await adminApi.markEnrollmentComplete(e.id, { adminRemark: 'Batch completed', lorPerformance: 'Good', lorHighlights: 'Completed internship program' });
                          success++;
                        } catch { failed++; }
                      }
                      alert(`✅ ${success} certificates issued${failed > 0 ? `, ❌ ${failed} failed` : ''}!`);
                      load();
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                      <Award size={13} /> Mark All Complete 🎓
                    </button>
                  )}
                  <button onClick={() => {
                      const batchStudents = groups[selectedBatch] || [];
                      const rows = batchStudents.map((e: any) => ({
                        Name: e.studentName || '',
                        Email: e.email || '',
                        Domain: e.domain?.name || '',
                        Progress: `${e.progress || 0}%`,
                        Status: e.status || '',
                        'Tasks Submitted': (e.taskLogs || []).length,
                        'Start Date': e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN') : '',
                        'Completed On': e.completedAt ? new Date(e.completedAt).toLocaleDateString('en-IN') : '',
                        'Admin Remark': e.adminRemark || '',
                      }));
                      downloadExcel(rows, `Hiresnix_Batch_${selectedBatch.replace(/\s+/g, '_')}.csv`);
                    }}
                    className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                    <Download size={12} /> Export CSV
                  </button>
                  <button onClick={() => {
                      const batchStudents = groups[selectedBatch] || [];
                      const allLogs: any[] = [];
                      batchStudents.forEach((e: any) => {
                        (e.taskLogs || []).forEach((log: any, idx: number) => {
                          allLogs.push({
                            'Sr No': allLogs.length + 1,
                            'Student Name': e.studentName || '',
                            'Email': e.email || '',
                            'Domain': e.domain?.name || '',
                            'Task Title': log.title || '',
                            'Description': (log.description || '').replace(/[\r\n]+/g, ' ').trim(),
                            'URL / Link': log.url || '',
                            'Week': log.week || '',
                            'Status': log.status || 'Submitted',
                            'Submitted On': log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : '',
                          });
                        });
                      });
                      if (allLogs.length === 0) { alert('No task logs found for this batch'); return; }
                      downloadExcel(allLogs, `AllDailyLogs_${selectedBatch.replace(/\s+/g, '_')}.csv`);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition">
                    <Download size={12} /> All Daily Logs
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {(groups[selectedBatch] || []).map((e: any) => (
                    <div key={e.id} className="px-5 py-4 transition" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                            {e.studentName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-white">{e.studentName}</p>
                              <Badge status={e.status} />
                            </div>
                            <p className="text-xs" style={{color:"#475569"}}>{e.email}</p>
                            <p className="text-sm font-medium text-blue-600">{e.domain?.name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-28 bg-gray-100 rounded-full h-2">
                                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${e.progress}%` }} />
                                </div>
                                <span className="text-xs font-bold text-emerald-600">{e.progress}%</span>
                              </div>
                              <span className="text-xs text-gray-400">{(e.taskLogs || []).length} tasks submitted</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xs text-gray-400">
                            Started {e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}
                          </p>
                          {e.status === 'Active' && (
                            <button
                              onClick={() => setCompleteModal({ id: e.id, name: e.studentName, adminRemark: '', lorPerformance: 'Excellent', lorHighlights: '' })}
                              className="flex items-center gap-1 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition">
                              <Award size={11} /> Mark Complete
                            </button>
                          )}
                          {e.status === 'Completed' && (
                            <span className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Cert issued
                            </span>
                          )}
                          {(e.taskLogs || []).length > 0 && (
                            <button
                              onClick={() => {
                                const logs = (e.taskLogs || []).map((log: any, idx: number) => ({
                                  'Sr No': idx + 1,
                                  'Student Name': e.studentName || '',
                                  'Domain': e.domain?.name || '',
                                  'Task Title': log.title || '',
                                  'Description': (log.description || '').replace(/[\r\n]+/g, ' ').trim(),
                                  'URL / Link': log.url || '',
                                  'Week': log.week || '',
                                  'Status': log.status || 'Submitted',
                                  'Submitted On': log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : '',
                                }));
                                downloadExcel(logs, `DailyLog_${(e.studentName || 'Student').replace(/\s+/g, '_')}.csv`);
                              }}
                              className="flex items-center gap-1 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">
                              <Download size={11} /> Daily Log
                            </button>
                          )}
                        </div>
                      </div>
                      {(e.taskLogs || []).length > 0 && (
                        <div className="mt-3">
                          <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                            className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
                            {expandedId === e.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            View submitted tasks ({(e.taskLogs || []).length})
                          </button>
                          {expandedId === e.id && (
                            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                              {[...(e.taskLogs || [])].reverse().map((log: any) => (
                                <div key={log.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                  <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-800">{log.title}</p>
                                    <p className="text-xs" style={{color:"#475569"}}>{log.description}</p>
                                    {log.url && <a href={log.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{log.url}</a>}
                                    <p className="text-[10px] text-gray-400 mt-0.5">Week {log.week} · {new Date(log.submittedAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── INSTITUTION INTERNSHIP ──────────────────────────── */}
      {!loading && tab === 'institution' && (() => {
        // Filter only institution enrollments
        const instEnrollments = enrollments.filter((e: any) =>
          e.source === 'institution' || !!e.institutionName || !!e.instStudentId
        );

        // Group by institution name first, then by month batch
        const instGroups: Record<string, Record<string, any[]>> = {};
        instEnrollments.forEach((e: any) => {
          const inst = e.institutionName || 'Unknown Institution';
          const month = e.startDate
            ? new Date(e.startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
            : 'No Start Date';
          if (!instGroups[inst]) instGroups[inst] = {};
          if (!instGroups[inst][month]) instGroups[inst][month] = [];
          instGroups[inst][month].push(e);
        });

        const instNames = Object.keys(instGroups).sort();

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-400">
                {instEnrollments.length} institution students · {instNames.length} institution{instNames.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => {
                const rows = instEnrollments.map((e: any) => ({
                  Name: e.studentName || '',
                  Email: e.email || '',
                  Institution: e.institutionName || '',
                  Domain: e.domain?.name || '',
                  Progress: `${e.progress || 0}%`,
                  Status: e.status || '',
                  'Tasks Submitted': (e.taskLogs || []).length,
                  'Start Date': e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN') : '',
                  'Completed On': e.completedAt ? new Date(e.completedAt).toLocaleDateString('en-IN') : '',
                }));
                downloadExcel(rows, 'Hiresnix_Institution_Students.csv');
              }} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                <Download size={13} /> Export CSV
              </button>
            </div>

            {instEnrollments.length === 0 ? (
              <div className="text-center py-16 text-gray-500" style={{background:'rgba(255,255,255,0.03)',borderRadius:'1rem',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>🏫</div>
                <p className="font-semibold text-gray-400">No institution students enrolled yet</p>
                <p className="text-xs mt-1 text-gray-600">Students approved via Institution Internship tab will appear here</p>
              </div>
            ) : selectedInstBatch === null ? (
              /* ── Institution Cards ── */
              <div className="space-y-6">
                {instNames.map(instName => {
                  const instData = instGroups[instName];
                  const allStudents = Object.values(instData).flat();
                  const totalActive = allStudents.filter((e: any) => e.status === 'Active').length;
                  const totalCompleted = allStudents.filter((e: any) => e.status === 'Completed').length;
                  const monthKeys = Object.keys(instData).sort();
                  return (
                    <div key={instName}>
                      {/* Institution Header */}
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <span style={{fontSize:'1.2rem'}}>🏫</span>
                        <h3 className="font-bold text-white text-sm">{instName}</h3>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-400">{allStudents.length} students · {totalActive} active · {totalCompleted} completed</span>
                      </div>
                      {/* Batch Cards for this institution */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthKeys.map(month => {
                          const bStudents = instData[month];
                          const active = bStudents.filter((e: any) => e.status === 'Active').length;
                          const completed = bStudents.filter((e: any) => e.status === 'Completed').length;
                          const firstDate = bStudents[0]?.startDate;
                          const batchKey = `${instName}||${month}`;
                          return (
                            <div key={batchKey}
                              className="rounded-xl p-5 border cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                              style={{background:'linear-gradient(135deg,rgba(15,23,42,0.95) 0%,rgba(20,30,55,0.95) 100%)',border:'1px solid rgba(255,255,255,0.1)'}}
                              onClick={() => setSelectedInstBatch(batchKey)}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-white">{month} Batch</h3>
                                  {firstDate && (
                                    <p className="text-xs mt-0.5" style={{color:'#475569'}}>
                                      From {new Date(firstDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>
                              </div>
                              <div className="flex items-center gap-2 text-3xl font-bold text-violet-400 mb-2">
                                <Users size={22} className="text-violet-400" />
                                {bStudents.length}
                                <span className="text-sm font-normal text-gray-400">students</span>
                              </div>
                              <div className="flex gap-3 text-xs mb-4">
                                <span className="text-green-400 font-semibold">{active} active</span>
                                {completed > 0 && <span className="text-purple-400 font-semibold">{completed} completed</span>}
                              </div>
                              <div className="pt-3 border-t flex items-center justify-center gap-1.5 text-xs text-violet-400 font-medium" style={{borderColor:'rgba(255,255,255,0.05)'}}>
                                <ChevronDown size={14} /> View Students
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Batch Detail View ── */
              (() => {
                const [bInstName, bMonth] = selectedInstBatch.split('||');
                const bStudents = (instGroups[bInstName]?.[bMonth]) || [];
                const activeStudents = bStudents.filter((e: any) => e.status === 'Active');
                return (
                  <div className="rounded-xl border overflow-hidden" style={{background:'rgba(15,23,42,0.95)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{borderColor:'rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)'}}>
                      <button onClick={() => setSelectedInstBatch(null)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition">
                        <ChevronUp size={16} />
                      </button>
                      <div className="flex-1">
                        <p className="font-bold text-white">{bMonth} Batch</p>
                        <p className="text-xs" style={{color:'#f59e0b'}}>🏫 {bInstName}</p>
                        <p className="text-xs text-gray-400">{bStudents.length} students · {activeStudents.length} active</p>
                      </div>
                      {activeStudents.length > 0 && (
                        <button onClick={async () => {
                          if (!window.confirm(`Mark all ${activeStudents.length} active students as Complete and issue certificates?`)) return;
                          let success = 0, failed = 0;
                          for (const e of activeStudents) {
                            try {
                              await adminApi.markEnrollmentComplete(e.id, { adminRemark: 'Batch completed', lorPerformance: 'Good', lorHighlights: 'Completed internship program' });
                              success++;
                            } catch { failed++; }
                          }
                          alert(`✅ ${success} certificates issued${failed > 0 ? `, ❌ ${failed} failed` : ''}!`);
                          load();
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                          <Award size={13} /> Mark All Complete 🎓
                        </button>
                      )}
                      <button onClick={() => {
                        const rows = bStudents.map((e: any) => ({
                          Name: e.studentName || '',
                          Email: e.email || '',
                          Institution: e.institutionName || '',
                          Domain: e.domain?.name || '',
                          Progress: `${e.progress || 0}%`,
                          Status: e.status || '',
                          'Tasks Submitted': (e.taskLogs || []).length,
                          'Start Date': e.startDate ? new Date(e.startDate).toLocaleDateString('en-IN') : '',
                          'Completed On': e.completedAt ? new Date(e.completedAt).toLocaleDateString('en-IN') : '',
                        }));
                        downloadExcel(rows, `Inst_Batch_${bInstName.replace(/\s+/g,'_')}_${bMonth.replace(/\s+/g,'_')}.csv`);
                      }}
                      className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                        <Download size={12} /> Export CSV
                      </button>
                      <button onClick={() => {
                          const allLogs: any[] = [];
                          bStudents.forEach((e: any) => {
                            (e.taskLogs || []).forEach((log: any) => {
                              allLogs.push({
                                'Sr No': allLogs.length + 1,
                                'Student Name': e.studentName || '',
                                'Email': e.email || '',
                                'Institution': e.institutionName || '',
                                'Domain': e.domain?.name || '',
                                'Task Title': log.title || '',
                                'Description': (log.description || '').replace(/[\r\n]+/g, ' ').trim(),
                                'URL / Link': log.url || '',
                                'Week': log.week || '',
                                'Status': log.status || 'Submitted',
                                'Submitted On': log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : '',
                              });
                            });
                          });
                          if (allLogs.length === 0) { alert('No task logs found for this batch'); return; }
                          downloadExcel(allLogs, `AllDailyLogs_${bInstName.replace(/\s+/g,'_')}_${bMonth.replace(/\s+/g,'_')}.csv`);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition">
                        <Download size={12} /> All Daily Logs
                      </button>
                    </div>
                    <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.05)'}}>
                      {bStudents.map((e: any) => (
                        <div key={e.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-violet-300 font-bold text-sm flex-shrink-0"
                                style={{background:'rgba(139,92,246,0.2)',border:'1.5px solid rgba(139,92,246,0.4)'}}>
                                {e.studentName?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-semibold text-white">{e.studentName}</p>
                                  <Badge status={e.status} />
                                </div>
                                <p className="text-xs" style={{color:'#475569'}}>{e.email}</p>
                                <p className="text-sm font-medium text-blue-400">{e.domain?.name}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-28 rounded-full h-2" style={{background:'rgba(255,255,255,0.1)'}}>
                                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${e.progress}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400">{e.progress}%</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{(e.taskLogs || []).length} tasks</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-xs text-gray-500">
                                Started {e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}
                              </p>
                              {e.status === 'Active' && (
                                <button
                                  onClick={() => setCompleteModal({ id: e.id, name: e.studentName, adminRemark: '', lorPerformance: 'Excellent', lorHighlights: '' })}
                                  className="flex items-center gap-1 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition">
                                  <Award size={11} /> Mark Complete
                                </button>
                              )}
                              {e.status === 'Completed' && (
                                <span className="text-xs text-purple-400 font-semibold flex items-center gap-1">
                                  <CheckCircle size={12} /> Cert issued
                                </span>
                              )}
                              {(e.taskLogs || []).length > 0 && (
                                <button onClick={() => {
                                  const logs = (e.taskLogs || []).map((log: any, idx: number) => ({
                                    'Sr No': idx + 1,
                                    'Student Name': e.studentName || '',
                                    'Institution': e.institutionName || '',
                                    'Domain': e.domain?.name || '',
                                    'Task Title': log.title || '',
                                    'Description': (log.description || '').replace(/[\r\n]+/g, ' ').trim(),
                                    'URL / Link': log.url || '',
                                    'Week': log.week || '',
                                    'Submitted On': log.submittedAt ? new Date(log.submittedAt).toLocaleDateString('en-IN') : '',
                                  }));
                                  downloadExcel(logs, `DailyLog_${(e.studentName || 'Student').replace(/\s+/g,'_')}.csv`);
                                }} className="flex items-center gap-1 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">
                                  <Download size={11} /> Daily Log
                                </button>
                              )}
                            </div>
                          </div>
                          {(e.taskLogs || []).length > 0 && (
                            <div className="mt-3">
                              <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                                className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1">
                                {expandedId === e.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                View submitted tasks ({(e.taskLogs || []).length})
                              </button>
                              {expandedId === e.id && (
                                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                                  {[...(e.taskLogs || [])].reverse().map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg" style={{background:'rgba(255,255,255,0.05)'}}>
                                      <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-white">{log.title}</p>
                                        <p className="text-xs" style={{color:'#475569'}}>{log.description}</p>
                                        {log.url && <a href={log.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{log.url}</a>}
                                        <p className="text-[10px] text-gray-500 mt-0.5">Week {log.week} · {new Date(log.submittedAt).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        );
      })()}

      {/* ── DOMAINS ─────────────────────────────────────────── */}
      {!loading && tab === 'domains' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Create Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Plus size={16} className="text-emerald-500" /> Create Domain
            </h3>
            <form onSubmit={handleCreateDomain} className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-center text-lg"
                    value={domainForm.icon} onChange={e => setDomainForm(p => ({ ...p, icon: e.target.value }))} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Domain Name *</label>
                  <input required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Web Development" value={domainForm.name}
                    onChange={e => setDomainForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="What will students learn?" value={domainForm.description}
                  onChange={e => setDomainForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    value={domainForm.duration} onChange={e => setDomainForm(p => ({ ...p, duration: e.target.value }))}>
                    {['4 Weeks','6 Weeks','8 Weeks','10 Weeks','12 Weeks'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Total Seats</label>
                  <input type="number" min={1} max={200} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    value={domainForm.totalSeats} onChange={e => setDomainForm(p => ({ ...p, totalSeats: +e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <Plus size={14} /> Create Domain
              </button>
            </form>
          </div>

          {/* Domain List */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">{domains.length} domains</h3>
            {domains.map((d: any) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <span className="text-2xl">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs" style={{color:"#475569"}}>{d.duration} · {d.filledSeats}/{d.totalSeats} seats</p>
                </div>
                <button onClick={async () => { 
                    if (window.confirm(`Are you sure you want to delete the ${d.name} domain?`)) {
                      await adminApi.deleteIPlatformDomain(d.id); load(); 
                    }
                  }}
                  className="text-red-400 hover:text-red-600 transition p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {domains.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-sm">No domains yet. Create your first one!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESOURCES ────────────────────────────────────────── */}
      {!loading && tab === 'resources' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Add Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" /> Add Resource
            </h3>
            <form onSubmit={handleAddResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Domain *</label>
                <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={resForm.domainId} onChange={e => setResForm(p => ({ ...p, domainId: e.target.value }))}>
                  <option value="">Select domain</option>
                  {domains.map((d: any) => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={resForm.type} onChange={e => setResForm(p => ({ ...p, type: e.target.value }))}>
                    {['Video','PDF','Article','Assignment','Link'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Week</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={resForm.week} onChange={e => setResForm(p => ({ ...p, week: +e.target.value }))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                <input required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Resource title" value={resForm.title} onChange={e => setResForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL (YouTube / Drive / Link)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..." value={resForm.url} onChange={e => setResForm(p => ({ ...p, url: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description (optional)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Brief description" value={resForm.description} onChange={e => setResForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <Plus size={14} /> Add Resource
              </button>
            </form>
          </div>

          {/* Resource List */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm">{resources.length} resources</h3>
            <div className="max-h-[600px] overflow-y-auto space-y-2">
              {resources.map((r: any) => {
                const iconMap: Record<string, any> = { Video: '🎬', PDF: '📄', Article: '📰', Assignment: '📝', Link: '🔗' };
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <span>{iconMap[r.type] || '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.domain?.name} · Week {r.week} · {r.type}</p>
                    </div>
                    <button onClick={async () => { await adminApi.deleteIPlatformResource(r.id); load(); }}
                      className="text-red-400 hover:text-red-600 transition p-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {resources.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
                  <p className="text-sm">No resources yet. Add your first one!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MARK COMPLETE MODAL ───────────────────────────────── */}

      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-0.5">Mark Internship Complete</h3>
            <p className="text-gray-500 text-sm mb-4">{completeModal.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Remark</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Overall feedback about the student..."
                  value={completeModal.adminRemark}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, adminRemark: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">LOR Performance</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  value={completeModal.lorPerformance}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, lorPerformance: e.target.value }))}>
                  {['Excellent','Very Good','Good','Satisfactory'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">LOR Highlights</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="e.g. Demonstrated excellent React skills and delivered quality work on time..."
                  value={completeModal.lorHighlights}
                  onChange={e => setCompleteModal((p: any) => ({ ...p, lorHighlights: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleMarkComplete} disabled={!!actionId}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                {actionId ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                Confirm & Generate Docs
              </button>
              <button onClick={() => setCompleteModal(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATE OFFER MODAL ───────────────────────────────── */}
      {offerModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
          <div className="rounded-2xl w-full max-w-md shadow-2xl" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",marginTop:"24px",marginBottom:"24px"}}>
            <div className="p-5" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <h3 className="font-black text-white text-base mb-0.5">Generate Offer Letter</h3>
              <p className="text-xs" style={{color:"#64748b"}}>Create a Hiresnix PDF offer letter for this candidate.</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setGeneratingOffer(true);
              try {
                const res = await client.post('/iplatform/generate-offer', offerModal, { responseType: 'blob', timeout: 60000 });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a'); a.href = url; a.download = `Hiresnix_Offer_${offerModal.candidateName}.pdf`; a.click();
                toast.success('Offer Letter Generated!');
                setOfferModal(null);
              } catch {
                toast.error('Failed to generate offer letter');
              } finally { setGeneratingOffer(false); }
            }} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Candidate Name</label>
                <input required className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input"
                  value={offerModal.candidateName} onChange={e => setOfferModal({ ...offerModal, candidateName: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Role / Domain</label>
                <input required className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input"
                  value={offerModal.role} onChange={e => setOfferModal({ ...offerModal, role: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Stipend / Salary</label>
                  <select required disabled={offerModal.datesLocked} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input disabled:opacity-50"
                    value={offerModal.salary} onChange={e => setOfferModal({ ...offerModal, salary: e.target.value })}>
                    <option value="Unpaid Internship">Unpaid Internship</option>
                    <option value="Paid Internship">Paid Internship</option>
                    {[1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000,16000,17000,18000,19000,20000].map(a=>(
                      <option key={a} value={`₹${a.toLocaleString('en-IN')}/month`}>₹{a.toLocaleString('en-IN')}/month</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Joining Date</label>
                  <input required type="date" disabled={offerModal.datesLocked} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input disabled:opacity-50"
                    value={offerModal.joiningDate} onChange={e => setOfferModal({ ...offerModal, joiningDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>End Date <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="date" disabled={offerModal.datesLocked} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input disabled:opacity-50"
                  value={offerModal.endDate || ''} onChange={e => setOfferModal({ ...offerModal, endDate: e.target.value })} />
                {offerModal.datesLocked && <p className="text-[11px] mt-1" style={{color:"#64748b"}}>End Date is locked because this offer letter was already generated.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Offer Letter Date</label>
                <input required type="date" disabled={offerModal.datesLocked} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input disabled:opacity-50"
                  value={offerModal.offerLetterDate} onChange={e => setOfferModal({ ...offerModal, offerLetterDate: e.target.value })} />
                {offerModal.datesLocked && <p className="text-[11px] mt-1" style={{color:"#64748b"}}>Dates are locked because this offer letter was already generated.</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={generatingOffer}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {generatingOffer ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {generatingOffer ? 'Generating...' : 'Download PDF'}
                </button>
                <button type="button" onClick={() => setOfferModal(null)} className="flex-1 font-bold py-2.5 rounded-xl text-sm hover:bg-white/10 transition text-gray-400" style={{border:"1px solid rgba(255,255,255,0.1)"}}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}