// src/pages/admin/AdminStudents.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Search, CheckCircle, Clock, Download, Trash2, Loader2, KeyRound, X } from 'lucide-react';

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

export function AdminStudents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  const handlePlacementFilter = (v: string) => { setPlacementFilter(v); setPage(1); };
  const handleDeptFilter = (v: string) => { setDeptFilter(v); setPage(1); };
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resetModal, setResetModal] = useState<any | null>(null);
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetting, setResetting] = useState(false);

  const [students, setStudents] = React.useState<any[]>([]);
  const [total, setTotal]       = React.useState(0);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<string | null>(null);
  const totalPages = Math.ceil(total / 15) || 1;

  const refetch = React.useCallback(() => {
    setLoading(true);
    adminApi.getAllStudents({ page, limit: 15, placementStatus: placementFilter || undefined, department: deptFilter || undefined })
      .then((res: any) => {
        setStudents(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((err: any) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page, placementFilter, deptFilter]);

  React.useEffect(() => { refetch(); }, [refetch]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      (!search || s.user?.name?.toLowerCase().includes(q) || s.user?.email?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q)) &&
      (!deptFilter || s.department === deptFilter) &&
      (!placementFilter || s.placementStatus === placementFilter)
    );
  });

  const handleDownload = () => {
    const rows = filtered.map(s => ({
      Name:            s.user?.name || '',
      Email:           s.user?.email || '',
      RollNumber:      s.rollNumber || '',
      Department:      s.department || '',
      Year:            s.year || '',
      CGPA:            s.cgpa || '',
      Skills:          (s.skills || []).join('; '),
      PlacementStatus: s.placementStatus || '',
      PlacedCompany:   s.placedCompany || '',
      PlacedRole:      s.placedRole || '',
      PlacedSalary:    s.placedSalary || '',
      LinkedIn:        s.linkedin || '',
      GitHub:          s.github || '',
      ProfileComplete: s.isProfileComplete ? 'Yes' : 'No',
    }));
    downloadCSV(rows, `students_${deptFilter || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleDelete = async (student: any) => {
    const name = student.user?.name || 'this student';
    const confirmed = window.confirm(
      `Permanently delete ${name}? Their account, applications, enrollments, and certificates will be removed. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    try {
      await adminApi.deleteStudent(student.id);
      toast.success(`${name} deleted successfully`);
      await refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  const openResetModal = (student: any) => {
    setResetModal(student);
    setResetForm({ newPassword: '', confirmPassword: '' });
  };

  const resetErrors = {
    newPassword: resetForm.newPassword && resetForm.newPassword.length < 8 ? 'Password must be at least 8 characters' : '',
    confirmPassword: resetForm.confirmPassword && resetForm.confirmPassword !== resetForm.newPassword ? 'Passwords do not match' : '',
  };
  const canSubmitReset =
    resetForm.newPassword.length >= 8 &&
    resetForm.confirmPassword === resetForm.newPassword &&
    !resetting;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModal || !canSubmitReset) return;

    setResetting(true);
    try {
      const res = await adminApi.resetStudentPassword(resetModal.id, { newPassword: resetForm.newPassword });
      toast.success(res.message || 'Password has been reset successfully.');
      setResetModal(null);
      setResetForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total students · {filtered.length} shown</p>
        </div>
        <button onClick={handleDownload}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Download size={15} /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, email, roll no..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={deptFilter} onChange={e => handleDeptFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={placementFilter} onChange={e => handlePlacementFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Statuses</option>
          <option value="Placed">Placed</option>
          <option value="Not Placed">Not Placed</option>
          <option value="Opted Out">Opted Out</option>
        </select>
      </div>

      {/* Stats summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Placed',     count: students.filter(s => s.placementStatus === 'Placed').length,     color: 'bg-green-100 text-green-700' },
          { label: 'Not Placed', count: students.filter(s => s.placementStatus === 'Not Placed').length, color: 'bg-gray-100 text-gray-600' },
          { label: 'Opted Out',  count: students.filter(s => s.placementStatus === 'Opted Out').length,  color: 'bg-orange-100 text-orange-700' },
        ].map(s => (
          <button key={s.label} onClick={() => setPlacementFilter(p => p === s.label ? '' : s.label)}
            className={`text-xs font-bold px-3 py-1 rounded-full transition ${s.color} ${placementFilter === s.label ? 'ring-2 ring-offset-1 ring-emerald-400' : ''}`}>
            {s.label}: {s.count}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <EmptyState title="No students found" description="Try adjusting filters" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {s.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{s.user?.name}</p>
                  <p className="text-gray-400 text-xs truncate">{s.user?.email}</p>
                </div>
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

              {/* Placement Status */}
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
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* Prev */}
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce((acc: (number | string)[], p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx-1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...'
                ? <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                : <button key={p} onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border transition ${
                      page === p
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}>
                    {p}
                  </button>
            )
          }

          {/* Next */}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}