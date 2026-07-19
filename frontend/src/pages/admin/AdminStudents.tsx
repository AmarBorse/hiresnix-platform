// src/pages/admin/AdminStudents.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Search, CheckCircle, Clock, Download, Trash2, Loader2, KeyRound, X, Users, UserX, GraduationCap, XCircle } from 'lucide-react';

function downloadCSV(data: any[], filename: string) {
  if (!data.length) { toast.error('No data to export'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    const val = row[k] ?? '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded!');
}

type InternTab = 'all' | 'not_applied' | 'active' | 'rejected';

// ── Follow-up Box (localStorage) ─────────────────────────────────
const FOLLOWUP_KEY = 'hx_admin_followup_box';
interface FollowupBox {
  month: string; // e.g. "2026-07"
  students: { id: number; name: string; email: string; reason: string; addedAt: string }[];
}
function getFollowupBox(): FollowupBox {
  try { return JSON.parse(localStorage.getItem(FOLLOWUP_KEY) || 'null') || { month: getCurrentMonth(), students: [] }; }
  catch { return { month: getCurrentMonth(), students: [] }; }
}
function getCurrentMonth() { return new Date().toISOString().slice(0, 7); }
function saveFollowupBox(box: FollowupBox) { localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(box)); }

export function AdminStudents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [internTab, setInternTab] = useState<InternTab>('all');
  const handleDeptFilter = (v: string) => { setDeptFilter(v); setPage(1); };

  // Debounce search → triggers backend call
  React.useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 700);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resetModal, setResetModal] = useState<any | null>(null);
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetting, setResetting] = useState(false);

  // Follow-up Box state
  const [followupBox, setFollowupBox] = React.useState<FollowupBox>(getFollowupBox());
  const [showFollowup, setShowFollowup] = React.useState(false);

  // Auto-add eligible students to followup box
  const processFollowup = React.useCallback((allStudents: any[], apps: any[]) => {
    const box = getFollowupBox();
    const currentMonth = getCurrentMonth();
    // Reset box if new month
    if (box.month !== currentMonth) {
      const newBox = { month: currentMonth, students: [] };
      saveFollowupBox(newBox);
      setFollowupBox(newBox);
      return;
    }
    const appliedIds = new Set(apps.map((a: any) => a.userId));
    const existingIds = new Set(box.students.map((s: any) => s.id));
    let updated = false;
    allStudents.forEach((s: any) => {
      if (existingIds.has(s.id)) return; // already in box
      if (appliedIds.has(s.id)) return;  // applied - don't touch
      // Check 48 hours since registration
      const regTime = new Date(s.createdAt).getTime();
      const hoursSince = (Date.now() - regTime) / (1000 * 60 * 60);
      if (hoursSince >= 48) {
        box.students.push({ id: s.id, name: s.name, email: s.email, reason: 'Not Applied (48h+)', addedAt: new Date().toISOString() });
        updated = true;
      }
    });
    // Also add rejected students
    apps.filter((a: any) => a.status === 'Rejected').forEach((a: any) => {
      if (!existingIds.has(a.userId)) {
        const s = allStudents.find((st: any) => st.id === a.userId);
        if (s) {
          box.students.push({ id: s.id, name: s.name, email: s.email, reason: 'Application Rejected', addedAt: new Date().toISOString() });
          updated = true;
        }
      }
    });
    if (updated) { saveFollowupBox(box); setFollowupBox({ ...box }); }
  }, []);

  const [students, setStudents] = React.useState<any[]>([]);
  const [total, setTotal]       = React.useState(0);
  const [loading, setLoading]   = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [error, setError]       = React.useState<string | null>(null);

  // Internship data
  const [applications, setApplications] = React.useState<any[]>([]);
  const [enrollments, setEnrollments]   = React.useState<any[]>([]);

  const totalPages = Math.ceil(total / 15) || 1;

  const refetch = React.useCallback(() => {
    if (students.length > 0) setSearching(true);
    else setLoading(true);
    Promise.all([
      adminApi.getAllStudents({ page, limit: 15, department: deptFilter || undefined, search: search || undefined }),
      adminApi.getIPlatformApplications(),
      adminApi.getIPlatformEnrollments(),
    ])
      .then(([studRes, appRes, enrRes]: any) => {
        const allStudents = studRes.data || [];
        const allApps = appRes.data || [];
        setStudents(allStudents);
        setTotal(studRes.total || 0);
        setApplications(allApps);
        setEnrollments(enrRes.data || []);
        processFollowup(allStudents, allApps);
      })
      .catch((err: any) => setError(err.message || 'Failed to load'))
      .finally(() => { setLoading(false); setSearching(false); });
  }, [page, deptFilter, search]);

  React.useEffect(() => { refetch(); }, [refetch]);

  // Build userId sets for classification
  const appliedUserIds   = new Set(applications.map((a: any) => a.userId));
  const rejectedUserIds  = new Set(applications.filter((a: any) => a.status === 'Rejected').map((a: any) => a.userId));
  const activeUserIds    = new Set(enrollments.filter((e: any) => e.status === 'Active').map((e: any) => e.userId));
  const completedUserIds = new Set(enrollments.filter((e: any) => e.status === 'Completed').map((e: any) => e.userId));

  const classifyStudent = (s: any): InternTab => {
    const uid = s.userId || s.user?.id;
    if (activeUserIds.has(uid) || completedUserIds.has(uid)) return 'active';
    if (rejectedUserIds.has(uid)) return 'rejected';
    if (!appliedUserIds.has(uid)) return 'not_applied';
    return 'all'; // pending/approved but not enrolled yet → show in all
  };

  const getInternStatus = (s: any) => {
    const uid = s.userId || s.user?.id;
    if (completedUserIds.has(uid)) return { label: 'Completed', color: 'bg-purple-100 text-purple-700' };
    if (activeUserIds.has(uid))    return { label: 'Active Intern', color: 'bg-blue-100 text-blue-700' };
    if (rejectedUserIds.has(uid))  return { label: 'App Rejected', color: 'bg-red-100 text-red-600' };
    const app = applications.find((a: any) => a.userId === uid);
    if (app?.status === 'Approved') return { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' };
    if (app?.status === 'Pending')  return { label: 'App Pending', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Not Applied', color: 'bg-gray-100 text-gray-500' };
  };

  const filtered = students.filter(s => {
    // search already handled by backend — only apply tab + dept filter locally
    const matchDept = !deptFilter || s.department === deptFilter;
    if (!matchDept) return false;

    if (internTab === 'all') return true;
    const uid = s.userId || s.user?.id;
    if (internTab === 'not_applied') return !appliedUserIds.has(uid) && !activeUserIds.has(uid) && !completedUserIds.has(uid);
    if (internTab === 'active') return activeUserIds.has(uid) || completedUserIds.has(uid);
    if (internTab === 'rejected') return rejectedUserIds.has(uid);
    return true;
  });

  const tabCounts = {
    all:         students.length,
    not_applied: students.filter(s => { const uid = s.userId || s.user?.id; return !appliedUserIds.has(uid) && !activeUserIds.has(uid) && !completedUserIds.has(uid); }).length,
    active:      students.filter(s => { const uid = s.userId || s.user?.id; return activeUserIds.has(uid) || completedUserIds.has(uid); }).length,
    rejected:    students.filter(s => rejectedUserIds.has(s.userId || s.user?.id)).length,
  };

  const handleDownload = () => {
    const rows = filtered.map(s => {
      const intern = getInternStatus(s);
      return {
        Name: s.user?.name || '', Email: s.user?.email || '',
        RollNumber: s.rollNumber || '', Department: s.department || '',
        Year: s.year || '', CGPA: s.cgpa || '',
        Skills: (s.skills || []).join('; '),
        PlacementStatus: s.placementStatus || '',
        InternshipStatus: intern.label,
        ProfileComplete: s.isProfileComplete ? 'Yes' : 'No',
      };
    });
    downloadCSV(rows, `students_${internTab}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDelete = async (student: any) => {
    const name = student.user?.name || 'this student';
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setDeletingId(student.id);
    try {
      await adminApi.deleteStudent(student.id);
      toast.success(`${name} deleted`);
      await refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    } finally { setDeletingId(null); }
  };

  const openResetModal = (student: any) => {
    setResetModal(student);
    setResetForm({ newPassword: '', confirmPassword: '' });
  };

  const canSubmitReset = resetForm.newPassword.length >= 8 && resetForm.confirmPassword === resetForm.newPassword && !resetting;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal || !canSubmitReset) return;
    setResetting(true);
    try {
      const res = await adminApi.resetStudentPassword(resetModal.id, { newPassword: resetForm.newPassword });
      toast.success(res.message || 'Password reset!');
      setResetModal(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset');
    } finally { setResetting(false); }
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  const TABS: { id: InternTab; label: string; icon: any; color: string; activeColor: string }[] = [
    { id: 'all',         label: 'All Students',  icon: Users,        color: 'text-gray-600',   activeColor: 'border-gray-700 text-gray-800 bg-gray-50' },
    { id: 'not_applied', label: 'Not Applied',   icon: UserX,        color: 'text-orange-500', activeColor: 'border-orange-500 text-orange-600 bg-orange-50' },
    { id: 'active',      label: 'Active Interns', icon: GraduationCap, color: 'text-blue-500',  activeColor: 'border-blue-500 text-blue-600 bg-blue-50' },
    { id: 'rejected',    label: 'Rejected',       icon: XCircle,      color: 'text-red-500',    activeColor: 'border-red-500 text-red-600 bg-red-50' },
  ];

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered · {filtered.length} shown</p>
        </div>
        <button onClick={handleDownload}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Download size={15} /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Internship Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1 flex gap-1 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = internTab === t.id;
          return (
            <button key={t.id} onClick={() => { setInternTab(t.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition flex-1 justify-center border-2 ${
                isActive ? t.activeColor + ' border-current' : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              <Icon size={15} className={isActive ? '' : t.color} />
              {t.label}
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/70' : 'bg-gray-100'
              }`}>
                {tabCounts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Dept filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          {searching
            ? <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
            : <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          }
          <input type="text" placeholder="Search name, email, roll no..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={deptFilter} onChange={e => handleDeptFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Tab description */}
      {internTab === 'not_applied' && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium">
          🔔 These students are registered on Hiresnix but haven't applied for any internship yet.
        </div>
      )}
      {internTab === 'active' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 font-medium">
          🎓 Students currently active in internship programs or who have completed one.
        </div>
      )}
      {internTab === 'rejected' && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          ❌ Students whose internship application was rejected.
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting filters or tab" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => {
            const intern = getInternStatus(s);
            const isNotApplied = intern.label === 'Not Applied';
            const isActive     = intern.label === 'Active Intern' || intern.label === 'Completed';
            const isRejected   = intern.label === 'App Rejected';

            const cardBorder = isNotApplied ? 'border-orange-200 border-l-4 border-l-orange-400'
              : isActive    ? 'border-blue-200 border-l-4 border-l-blue-500'
              : isRejected  ? 'border-red-200 border-l-4 border-l-red-400'
              : 'border-gray-100';

            return (
              <div key={s.id} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition ${cardBorder}`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isActive ? 'bg-blue-50 text-blue-600' : isRejected ? 'bg-red-50 text-red-500' : isNotApplied ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {s.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.user?.name}</p>
                    <p className="text-gray-400 text-xs truncate">{s.user?.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${intern.color}`}>
                    {intern.label}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-xs mb-3">
                  {s.rollNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Roll No</span>
                      <span className="font-medium text-gray-700">{s.rollNumber}</span>
                    </div>
                  )}
                  {s.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Department</span>
                      <span className="font-medium text-gray-700">{s.department}{s.year ? ` · Year ${s.year}` : ''}</span>
                    </div>
                  )}
                  {s.cgpa && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CGPA</span>
                      <span className={`font-bold ${+s.cgpa >= 8 ? 'text-emerald-600' : +s.cgpa >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>{s.cgpa}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {(s.skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(s.skills || []).slice(0, 3).map((sk: string) => (
                      <span key={sk} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{sk}</span>
                    ))}
                    {(s.skills || []).length > 3 && <span className="text-[10px] text-gray-400">+{s.skills.length - 3}</span>}
                  </div>
                )}

                {/* Placement */}
                <div className="mb-3">
                  {s.placementStatus === 'Placed' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={11} /> Placed
                      </span>
                      {s.placedCompany && <span className="text-xs text-gray-500">{s.placedCompany}</span>}
                      {s.placedSalary && <span className="text-xs text-emerald-600 font-semibold">₹{(s.placedSalary/100000).toFixed(1)}L</span>}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                      <Clock size={11} /> {s.placementStatus || 'Not Placed'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  {s.resumeUrl && (
                    <a href={s.resumeUrl} target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition">
                      Resume
                    </a>
                  )}
                  <button onClick={() => openResetModal(s)}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg transition">
                    <KeyRound size={11} /> Reset
                  </button>
                  <button onClick={() => handleDelete(s)} disabled={deletingId === s.id}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2 py-1.5 rounded-lg transition">
                    {deletingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce((acc: (number | string)[], p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx-1] as number) > 1) acc.push('...');
              acc.push(p); return acc;
            }, [])
            .map((p, idx) => p === '...'
              ? <span key={`d${idx}`} className="px-2 text-gray-400 text-sm">...</span>
              : <button key={p} onClick={() => setPage(p as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium border transition ${page === p ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  {p}
                </button>
            )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Reset Password</h3>
              <button onClick={() => setResetModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{resetModal.user?.name}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">New Password</label>
                <input type="password" required minLength={8}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={resetForm.newPassword} onChange={e => setResetForm(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Confirm Password</label>
                <input type="password" required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={resetForm.confirmPassword} onChange={e => setResetForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={!canSubmitReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {resetting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Reset
                </button>
                <button type="button" onClick={() => setResetModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}