// src/pages/admin/AdminStudents.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Search, CheckCircle, Clock, Download, Filter } from 'lucide-react';

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

  const { data: result, loading, error, refetch } = useFetch(
    () => adminApi.getAllStudents({ page, limit: 50 }), [page]
  );
  const students: any[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));
  const total = (result as any)?.total || 0;
  const totalPages = (result as any)?.totalPages || 1;

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

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, email, roll no..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={placementFilter} onChange={e => setPlacementFilter(e.target.value)}
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Student','Dept / Year','CGPA','Skills','Placement','Resume'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                          {s.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{s.user?.name}</p>
                          <p className="text-gray-400 text-[11px]">{s.user?.email}</p>
                          {s.rollNumber && <p className="text-[11px] text-gray-400">{s.rollNumber}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-700">{s.department || '—'}</p>
                      <p className="text-[11px] text-gray-400">{s.year ? `Year ${s.year}` : '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {s.cgpa ? (
                        <span className={`text-sm font-black ${+s.cgpa >= 8 ? 'text-emerald-600' : +s.cgpa >= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {s.cgpa}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.skills || []).slice(0, 3).map((sk: string) => (
                          <span key={sk} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{sk}</span>
                        ))}
                        {(s.skills || []).length > 3 && <span className="text-[10px] text-gray-400">+{s.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.placementStatus === 'Placed' ? (
                        <div>
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle size={11} /> Placed</span>
                          {s.placedCompany && <p className="text-[11px] text-gray-500 mt-0.5">{s.placedCompany}</p>}
                          {s.placedSalary && <p className="text-[11px] text-emerald-600 font-semibold">₹{(s.placedSalary/100000).toFixed(1)} LPA</p>}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} /> {s.placementStatus}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.resumeUrl ? (
                        <a href={`http://localhost:5000${s.resumeUrl}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                          View CV
                        </a>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      )}
    </div>
  );
}
