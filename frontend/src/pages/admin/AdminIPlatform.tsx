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
import * as XLSX from 'xlsx';

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
  const keys = Object.keys(data[0]);

  const wsData = [
    keys,
    ...data.map(row =>
      keys.map(k => {
        const val = row[k] ?? '';
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      })
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen, 10), 60) };
  });
  ws['!cols'] = colWidths;
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const xlsxFilename = filename.replace(/\.csv$/, '') + '.xlsx';
  XLSX.writeFile(wb, xlsxFilename);
  toast.success(`Downloaded ${xlsxFilename}`);
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
type Tab = 'applications' | 'institution' | 'students' | 'domains' | 'resources' | 'attendance';

export function AdminIPlatform() {
  const [tab, setTab] = useState<Tab>('applications');
  const [stats, setStats] = useState<any>({});
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [leavePending, setLeavePending] = useState<any[]>([]);
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
    { id: 'attendance'   as Tab, label: '📅 Attendance',   count: null },
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
                      mode: app.offerMode || 'Remote',
                      offerLetterDate: app.offerLetterDate || todayInputValue(),
                      joiningDate: app.offerJoiningDate || '',
                      endDate: app.offerEndDate || '',
                      datesLocked: Boolean(app.offerLetterDate || app.offerJoiningDate || app.offerEndDate),
                    })} className="flex items-center gap-1 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg transition">
                    <FileText size={11} /> Offer
                  </button>
                  <a href={`https://wa.me/91${(app.phone||"").replace(/[^0-9]/g,"")}?text=${encodeURIComponent(`Hi ${app.studentName},\n\nThank you for applying for the Hiresnix Internship Program! 🎉\n\nTo complete your enrollment, please share the following:\n\n📄 Updated Resume (PDF)\n💼 LinkedIn Profile URL\n💻 GitHub Profile URL (if available)\n✍️ Brief intro about your skills, projects & career interests\n🎓 Mention if this internship is for college verification or mandatory requirement\n\n━━━━━━━━━━━━━━━━━━━━\n🚀 YOUR HIRESNIX CAREER TOOLKIT\n━━━━━━━━━━━━━━━━━━━━\n\nOnce enrolled, you get 1 FULL YEAR access to:\n\n🎤 AI Mock Interview\n→ Practice Technical + HR rounds anytime\n→ Get score 0-100 on every answer\n→ Know exactly where you're weak\n→ Download PDF report for self-review\n\n📄 AI Resume Builder + ATS Scanner\n→ See your ATS score instantly\n→ AI shows missing keywords recruiters look for\n→ Download professional PDF resume\n\n💼 Internship Program (12+ Domains)\n→ Web Dev, AI/ML, Data Science, Android, UI/UX & more\n→ Structured 8-12 week program with real tasks\n→ Weekly mentorship & progress tracking\n\n🎓 Verified Career Documents\n→ Appointment Letter\n→ Joining Letter\n→ Internship Completion Certificate\n→ Letter of Recommendation (LOR)\n→ All QR Code verified — recruiters can instantly check authenticity\n\n🚀 Public Portfolio Page\n→ Your own URL: hiresnix.co.in/projects/your-name\n→ Show recruiters what you've actually built\n→ Add to resume & LinkedIn\n\n📚 AI Academy — 16 Courses\n→ Python, React, Java, DSA, SQL, ML, Docker & more\n→ AI Teacher available 24/7 for doubt solving\n→ Code directly in browser — no setup needed\n→ Certificate on course completion\n\n🗺️ AI Career Tools\n→ Career Roadmap for your domain\n→ Cold Email Generator — reach any HR directly\n→ JD Match — check resume vs job description\n→ AI Cover Letter & LinkedIn Summary\n\n🏆 All India Challenge — Deadline or Dead\n→ Compete with students across India\n→ Build streak, earn rewards, climb leaderboard\n\n━━━━━━━━━━━━━━━━━━━━\n💳 Enrollment Fee: ₹100 (1 Year)\n━━━━━━━━━━━━━━━━━━━━\nUPI: hiresnix@ybl\n\nAfter payment, send screenshot here to activate your account.\n\n📞 WhatsApp: +91 9529120977\n📧 hr@hiresnix.co.in\n🌐 hiresnix.co.in\n\nHiresnix — Elevating Talent. Empowering Futures. 🌟\n\n🔗 Follow us on LinkedIn: linkedin.com/company/hiresnix\n📖 Read our Blog: hiresnix.co.in/blog`)}`}
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
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color:"#64748b"}}>Mode of Internship</label>
                <select disabled={offerModal.datesLocked} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none dark-input disabled:opacity-50"
                  value={offerModal.mode || 'Remote'} onChange={e => setOfferModal({ ...offerModal, mode: e.target.value })}>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-Site">On-Site</option>
                </select>
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

      {/* ── ATTENDANCE TAB ──────────────────────────────────── */}
      {!loading && tab === 'attendance' && (
        <AttendanceTab />
      )}
    </div>
  );
}

// ── Helper: format time 12hr ──────────────────────────────────────
function formatTime12(time: string) {
  if (!time) return '--';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// ── Attendance Tab Component ──────────────────────────────────────
function AttendanceTab() {
  const [view, setView] = useState<'date' | 'student'>('date');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [leavePending, setLeavePending] = useState<any[]>([]);

  // Student-wise view
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    date: '', status: 'present',
    check_in_time: '10:00', check_out_time: '17:00',
    leave_reason: '', remarks: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  const [selfAddEnabled, setSelfAddEnabled] = useState<boolean>(false);
  const [selfAddLoading, setSelfAddLoading] = useState(false);
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState<string | null>(null);

  // Load enrolled students list
  useEffect(() => {
    client.get('/attendance/all').then(res => {
      const all = res.data.data || [];
      setAttendanceData(all);
      setLeavePending(all.filter((r: any) => r.status === 'leave' && !r.leave_approved));
      const map = new Map();
      all.forEach((r: any) => {
        if (!map.has(r.student_id)) map.set(r.student_id, { id: r.student_id, name: r.student_name, email: r.student_email, domain: r.domain_name });
      });
      setEnrolledStudents(Array.from(map.values()));
    }).catch(() => {});
  }, []);

  const fetchByDate = async (date: string) => {
    setAttendanceLoading(true);
    try {
      const res = await client.get(`/attendance/all?date=${date}`);
      const all = res.data.data || [];
      setAttendanceData(all);
      setLeavePending(all.filter((r: any) => r.status === 'leave' && !r.leave_approved));
    } catch { toast.error('Failed to load'); }
    finally { setAttendanceLoading(false); }
  };

  const fetchStudentHistory = async (studentId: string) => {
    setStudentLoading(true);
    try {
      const res = await client.get(`/attendance/student/${studentId}`);
      setStudentHistory(res.data.data || []);
      setStudentStats(res.data.stats);
      setSelfAddEnabled(res.data.can_self_add || false);
      setCurrentEnrollmentId(res.data.enrollment_id || null);
      if (enrolledStudents.length === 0) {
        const d = res.data.data[0];
        if (d) setEnrolledStudents([{ id: d.student_id, name: d.student_name, email: d.student_email, domain: d.domain_name }]);
      }
    } catch { toast.error('Failed to load student history'); }
    finally { setStudentLoading(false); }
  };

  const handleToggleSelfAdd = async (enrollmentId: string, value: boolean) => {
    setSelfAddLoading(true);
    try {
      await client.put(`/attendance/toggle-self-add/${enrollmentId}`, { can_self_add: value });
      setSelfAddEnabled(value);
      toast.success(value ? 'Self-add enabled for student' : 'Self-add disabled');
    } catch { toast.error('Failed to update'); }
    finally { setSelfAddLoading(false); }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await client.put(`/attendance/leave/${id}/approve`);
      toast.success('Leave approved');
      if (view === 'date') fetchByDate(attendanceDate);
      else if (selectedStudent) fetchStudentHistory(selectedStudent.id);
    } catch { toast.error('Failed'); }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await client.put(`/attendance/leave/${id}/reject`);
      toast.success('Leave rejected');
      if (view === 'date') fetchByDate(attendanceDate);
      else if (selectedStudent) fetchStudentHistory(selectedStudent.id);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await client.delete(`/attendance/${id}`);
      toast.success('Deleted');
      if (view === 'date') fetchByDate(attendanceDate);
      else if (selectedStudent) fetchStudentHistory(selectedStudent.id);
    } catch { toast.error('Failed to delete'); }
  };

  const handleMarkAbsent = async () => {
    if (!confirm('Mark all unmarked students as absent for today?')) return;
    try {
      const res = await client.put('/attendance/mark-absent');
      toast.success(res.data.message);
      fetchByDate(attendanceDate);
    } catch { toast.error('Failed'); }
  };

  const handleAddAttendance = async () => {
    if (!addForm.date || !addForm.status) { toast.error('Date and status required'); return; }
    if (!selectedStudent) { toast.error('Select a student first'); return; }
    setAddLoading(true);
    try {
      await client.post('/attendance/admin-add', {
        student_id: selectedStudent.id,
        date: addForm.date,
        status: addForm.status,
        check_in_time: addForm.status === 'present' ? addForm.check_in_time : null,
        check_out_time: addForm.status === 'present' ? addForm.check_out_time : null,
        leave_reason: addForm.status === 'leave' ? addForm.leave_reason : null,
        remarks: addForm.remarks || null,
      });
      toast.success('Attendance added!');
      setShowAddModal(false);
      setAddForm({ date: '', status: 'present', check_in_time: '10:00', check_out_time: '17:00', leave_reason: '', remarks: '' });
      fetchStudentHistory(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally { setAddLoading(false); }
  };

  const downloadStudentExcel = () => {
    if (!studentHistory.length) { toast.error('No data'); return; }
    const data = studentHistory.map((r: any) => ({
      'Date': r.date,
      'Status': r.status,
      'Check In': r.check_in_time ? formatTime12(r.check_in_time) : '10:00 AM',
      'Check Out': r.check_out_time ? formatTime12(r.check_out_time) : '5:00 PM',
      'Marked By': r.marked_by,
      'Leave Reason': r.leave_reason || '-',
      'Leave Approved': r.leave_approved ? 'Yes' : 'No',
    }));
    downloadExcel(data, `${selectedStudent?.name}_attendance`);
  };

  const downloadStudentPDF = async () => {
    if (!studentHistory.length) { toast.error('No data'); return; }
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = 210;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('HIRESNIX', 14, 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('SR Patil Infrastructure Private Limited', 14, 19);
    doc.text('hiresnix.co.in  |  hr@hiresnix.co.in  |  +91 9529120977', 14, 24);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153);
    doc.text('ATTENDANCE REPORT', 14, 32);

    // Student info box
    doc.setFillColor(241, 245, 249);
    doc.rect(10, 44, pageW - 20, 28, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(selectedStudent?.name || '-', 14, 52);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${selectedStudent?.email || '-'}`, 14, 58);
    doc.text(`Domain: ${selectedStudent?.domain || '-'}`, 14, 64);
    doc.text(`Timings: 10:00 AM – 5:00 PM`, 120, 58);
    if (studentStats) {
      doc.text(`Present: ${studentStats.present}  |  Absent: ${studentStats.absent}  |  Leave: ${studentStats.leave}  |  %: ${studentStats.percentage}%`, 120, 64);
    }

    // Table
    const cols = [
      { header: '#',        w: 10, x: 10  },
      { header: 'Date',     w: 32, x: 20  },
      { header: 'Status',   w: 25, x: 52  },
      { header: 'Check In', w: 30, x: 77  },
      { header: 'Check Out',w: 30, x: 107 },
      { header: 'Reason',   w: 58, x: 137 },
    ];
    const rowH = 8;
    let y = 78;

    doc.setFillColor(15, 23, 42);
    doc.rect(10, y, pageW - 20, rowH, 'F');
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    cols.forEach(c => doc.text(c.header, c.x + 1, y + 5.5));
    y += rowH;

    doc.setFont('helvetica', 'normal');
    studentHistory.forEach((r: any, i: number) => {
      if (y > 275) { doc.addPage(); y = 15; }
      const alt = i % 2 === 0;
      doc.setFillColor(alt ? 248 : 255, alt ? 250 : 255, alt ? 252 : 255);
      doc.rect(10, y, pageW - 20, rowH, 'F');
      const sc: [number,number,number] = r.status === 'present' ? [22,163,74] : r.status === 'absent' ? [220,38,38] : [217,119,6];
      doc.setTextColor(60, 60, 60); doc.setFontSize(8);
      doc.text(String(i + 1), cols[0].x + 1, y + 5.5);
      doc.text(r.date, cols[1].x + 1, y + 5.5);
      doc.setTextColor(...sc);
      doc.text(r.status.toUpperCase(), cols[2].x + 1, y + 5.5);
      doc.setTextColor(60, 60, 60);
      doc.text(r.check_in_time ? formatTime12(r.check_in_time) : '10:00 AM', cols[3].x + 1, y + 5.5);
      doc.text(r.check_out_time ? formatTime12(r.check_out_time) : '5:00 PM', cols[4].x + 1, y + 5.5);
      doc.text((r.leave_reason || '-').substring(0, 30), cols[5].x + 1, y + 5.5);
      y += rowH;
    });

    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated document.  |  Hiresnix — hiresnix.co.in', 14, 288);
    doc.save(`hiresnix_${selectedStudent?.name}_attendance.pdf`);
    toast.success('PDF downloaded!');
  };

  const downloadDateExcel = () => {
    if (!attendanceData.length) { toast.error('No data'); return; }
    downloadExcel(attendanceData.map((r: any) => ({
      'Student Name': r.student_name || '-',
      'Email': r.student_email || '-',
      'Domain': r.domain_name || '-',
      'Date': r.date,
      'Status': r.status,
      'Check In': r.check_in_time ? formatTime12(r.check_in_time) : '10:00 AM',
      'Check Out': r.check_out_time ? formatTime12(r.check_out_time) : '5:00 PM',
      'Leave Reason': r.leave_reason || '-',
    })), `attendance_${attendanceDate}`);
  };

  const downloadDatePDF = async () => {
    if (!attendanceData.length) { toast.error('No data'); return; }
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = 297;
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageW, 36, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('HIRESNIX', 14, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('SR Patil Infrastructure Private Limited', 14, 20);
    doc.text('hiresnix.co.in  |  hr@hiresnix.co.in  |  +91 9529120977', 14, 26);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(52, 211, 153);
    doc.text('INTERNSHIP ATTENDANCE REPORT', 165, 13);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200);
    doc.text(`Date: ${new Date(attendanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 165, 20);
    doc.text('Timings: 10:00 AM – 5:00 PM', 165, 26);
    const cols = [
      { header: '#', w: 10, x: 10 }, { header: 'Student Name', w: 55, x: 20 },
      { header: 'Domain', w: 45, x: 75 }, { header: 'Status', w: 22, x: 120 },
      { header: 'Check In', w: 25, x: 142 }, { header: 'Check Out', w: 25, x: 167 },
      { header: 'Leave Reason', w: 80, x: 192 },
    ];
    const rowH = 8; let y = 44;
    doc.setFillColor(15, 23, 42); doc.rect(10, y, pageW - 20, rowH, 'F');
    doc.setTextColor(52, 211, 153); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    cols.forEach(c => doc.text(c.header, c.x + 1, y + 5.5)); y += rowH;
    doc.setFont('helvetica', 'normal');
    attendanceData.forEach((r: any, i: number) => {
      if (y > 190) { doc.addPage(); y = 15; }
      const alt = i % 2 === 0;
      doc.setFillColor(alt ? 245 : 255, alt ? 247 : 255, alt ? 250 : 255);
      doc.rect(10, y, pageW - 20, rowH, 'F');
      const sc: [number,number,number] = r.status === 'present' ? [22,163,74] : r.status === 'absent' ? [220,38,38] : [217,119,6];
      doc.setTextColor(60, 60, 60); doc.setFontSize(8);
      doc.text(String(i + 1), cols[0].x + 1, y + 5.5);
      doc.text((r.student_name || '-').substring(0, 28), cols[1].x + 1, y + 5.5);
      doc.text((r.domain_name || '-').substring(0, 22), cols[2].x + 1, y + 5.5);
      doc.setTextColor(...sc); doc.text(r.status.toUpperCase(), cols[3].x + 1, y + 5.5);
      doc.setTextColor(60, 60, 60);
      doc.text(r.check_in_time ? formatTime12(r.check_in_time) : '10:00 AM', cols[4].x + 1, y + 5.5);
      doc.text(r.check_out_time ? formatTime12(r.check_out_time) : '5:00 PM', cols[5].x + 1, y + 5.5);
      doc.text((r.leave_reason || '-').substring(0, 38), cols[6].x + 1, y + 5.5);
      y += rowH;
    });
    const p = attendanceData.filter((r: any) => r.status === 'present').length;
    const a = attendanceData.filter((r: any) => r.status === 'absent').length;
    const l = attendanceData.filter((r: any) => r.status === 'leave').length;
    y += 6;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(`Summary — Present: ${p}  |  Absent: ${a}  |  Leave: ${l}  |  Total: ${attendanceData.length}`, 14, y);
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated document.  |  Hiresnix — hiresnix.co.in', 14, 205);
    doc.save(`hiresnix_attendance_${attendanceDate}.pdf`);
    toast.success('PDF downloaded!');
  };

  const currentData = view === 'date' ? attendanceData : studentHistory;
  const isLoading = view === 'date' ? attendanceLoading : studentLoading;

  return (
    <div className="bg-white rounded-b-xl p-5 space-y-4">

      {/* View Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView('date')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'date' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          📅 Date-wise
        </button>
        <button onClick={() => setView('student')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'student' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          👤 Student-wise
        </button>
      </div>

      {/* DATE VIEW */}
      {view === 'date' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <input type="date" value={attendanceDate}
                onChange={e => { setAttendanceDate(e.target.value); setAttendanceData([]); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => fetchByDate(attendanceDate)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">Load</button>
              <button onClick={handleMarkAbsent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition">Mark Absent (Bulk)</button>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadDateExcel} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                <Download size={14} /> Excel
              </button>
              <button onClick={downloadDatePDF} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Present', value: attendanceData.filter(r => r.status === 'present').length, color: 'bg-green-50 text-green-700' },
              { label: 'Absent',  value: attendanceData.filter(r => r.status === 'absent').length,  color: 'bg-red-50 text-red-700' },
              { label: 'Leave',   value: attendanceData.filter(r => r.status === 'leave').length,   color: 'bg-amber-50 text-amber-700' },
              { label: 'Total',   value: attendanceData.length, color: 'bg-blue-50 text-blue-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pending leaves */}
          {leavePending.length > 0 && (
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
              <h3 className="text-sm font-bold text-amber-800 mb-3">⏳ Pending Leave Requests ({leavePending.length})</h3>
              <div className="space-y-2">
                {leavePending.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.student_name}</p>
                      <p className="text-xs text-gray-500">{r.date} • {r.leave_reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveLeave(r.id)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">Approve</button>
                      <button onClick={() => handleRejectLeave(r.id)}  className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attendanceLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>
          ) : attendanceData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No records for this date</div>
          ) : (
            <AttendanceTable data={attendanceData} onDelete={handleDelete} onApprove={handleApproveLeave} onReject={handleRejectLeave} />
          )}
        </div>
      )}

      {/* STUDENT VIEW */}
      {view === 'student' && (
        <div className="space-y-4">
          {/* Student selector */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStudent?.id || ''}
              onChange={e => {
                const s = enrolledStudents.find(s => String(s.id) === e.target.value);
                setSelectedStudent(s || null);
                setStudentHistory([]);
                setStudentStats(null);
                setSelfAddEnabled(false);
                setCurrentEnrollmentId(null);
                if (s) fetchStudentHistory(s.id);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[240px]"
            >
              <option value="">-- Select Student --</option>
              {enrolledStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.domain || 'Unknown domain'})</option>
              ))}
            </select>

            {selectedStudent && (
              <>
                <button onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
                  <Plus size={14} /> Add Attendance
                </button>
                <button onClick={downloadStudentExcel}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                  <Download size={14} /> Excel
                </button>
                <button onClick={downloadStudentPDF}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                  <FileText size={14} /> PDF
                </button>
                {/* Self-add toggle */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-600">Student Self-Add</span>
                  <button
                    disabled={selfAddLoading}
                    onClick={() => {
                      const enrollmentId = studentHistory[0]?.enrollment_id;
                      if (enrollmentId) handleToggleSelfAdd(enrollmentId, !selfAddEnabled);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${selfAddEnabled ? 'bg-purple-500' : 'bg-gray-300'} ${selfAddLoading ? 'opacity-50' : ''}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${selfAddEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-xs font-bold ${selfAddEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                    {selfAddEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Student stats */}
          {studentStats && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Present',    value: studentStats.present,    color: 'bg-green-50 text-green-700' },
                  { label: 'Absent',     value: studentStats.absent,     color: 'bg-red-50 text-red-700' },
                  { label: 'Leave',      value: studentStats.leave,      color: 'bg-amber-50 text-amber-700' },
                  { label: 'Total',      value: studentStats.total,      color: 'bg-blue-50 text-blue-700' },
                  { label: 'Percentage', value: `${studentStats.percentage}%`, color: 'bg-purple-50 text-purple-700' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs font-semibold mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Self-Add Permission Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${selfAddEnabled ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                <div>
                  <p className="text-sm font-bold text-gray-800">🔓 Allow Student to Add Past Attendance</p>
                  <p className="text-xs text-gray-500 mt-0.5">When ON, student can manually add their past attendance records</p>
                </div>
                <button
                  disabled={selfAddLoading}
                  onClick={() => {
                    if (currentEnrollmentId) handleToggleSelfAdd(currentEnrollmentId, !selfAddEnabled);
                    else toast.error('No enrollment found for this student');
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                    selfAddEnabled
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  } ${selfAddLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {selfAddLoading ? 'Updating...' : selfAddEnabled ? '✓ Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          )}

          {studentLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" size={28} /></div>
          ) : !selectedStudent ? (
            <div className="text-center py-12 text-gray-400">Select a student to view attendance history</div>
          ) : studentHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No attendance records found</div>
          ) : (
            <AttendanceTable data={studentHistory} onDelete={handleDelete} onApprove={handleApproveLeave} onReject={handleRejectLeave} showDate />
          )}
        </div>
      )}

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Add Attendance — {selectedStudent?.name}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
                <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                <select value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              {addForm.status === 'present' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Check In</label>
                    <input type="time" value={addForm.check_in_time} onChange={e => setAddForm(f => ({ ...f, check_in_time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Check Out</label>
                    <input type="time" value={addForm.check_out_time} onChange={e => setAddForm(f => ({ ...f, check_out_time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              {addForm.status === 'leave' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Leave Reason</label>
                  <input type="text" value={addForm.leave_reason} onChange={e => setAddForm(f => ({ ...f, leave_reason: e.target.value }))}
                    placeholder="Enter reason..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Remarks (optional)</label>
                <input type="text" value={addForm.remarks} onChange={e => setAddForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="Any remarks..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAddAttendance} disabled={addLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 transition">
                {addLoading ? 'Adding...' : 'Add Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable attendance table ─────────────────────────────────────
function AttendanceTable({ data, onDelete, onApprove, onReject, showDate }: {
  data: any[]; onDelete: (id: string) => void;
  onApprove: (id: string) => void; onReject: (id: string) => void;
  showDate?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
            {!showDate && <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>}
            {showDate  && <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>}
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Domain</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Check In</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Check Out</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Leave Reason</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((r: any, i: number) => (
            <tr key={r.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
              {!showDate && (
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800">{r.student_name || '-'}</p>
                  <p className="text-xs text-gray-400">{r.student_email || '-'}</p>
                </td>
              )}
              {showDate && <td className="px-4 py-3 text-gray-700 font-medium text-sm">{r.date}</td>}
              <td className="px-4 py-3 text-gray-600 text-xs">{r.domain_name || '-'}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  r.status === 'present' ? 'bg-green-100 text-green-700' :
                  r.status === 'absent'  ? 'bg-red-100 text-red-700' :
                  r.leave_approved ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.status === 'leave' ? (r.leave_approved ? '✓ Leave' : '⏳ Leave') : r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.check_in_time ? formatTime12(r.check_in_time) : '—'}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{r.check_out_time ? formatTime12(r.check_out_time) : '—'}</td>
              <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{r.leave_reason || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {r.status === 'leave' && !r.leave_approved && (
                    <>
                      <button onClick={() => onApprove(r.id)} className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600 transition">✓</button>
                      <button onClick={() => onReject(r.id)}  className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded hover:bg-amber-600 transition">✗</button>
                    </>
                  )}
                  <button onClick={() => onDelete(r.id)} className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition">🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}