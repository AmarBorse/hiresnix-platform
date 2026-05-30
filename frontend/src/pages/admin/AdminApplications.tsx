// src/pages/admin/AdminApplications.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { Download, Search, Loader2, FileText, ChevronDown, ChevronUp, Filter } from 'lucide-react';

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

const STATUS_COLORS: Record<string, string> = {
  'Applied':'bg-blue-100 text-blue-700','Under Review':'bg-yellow-100 text-yellow-700',
  'Shortlisted':'bg-indigo-100 text-indigo-700','Interview Scheduled':'bg-purple-100 text-purple-700',
  'Selected':'bg-green-100 text-green-700','Rejected':'bg-red-100 text-red-700','Withdrawn':'bg-gray-100 text-gray-600',
};

export function AdminApplications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(() => adminApi.getAllApplications({ limit: 200 }));
  const all: any[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const filtered = all.filter(a => {
    const q = search.toLowerCase();
    return (!search || a.student?.user?.name?.toLowerCase().includes(q) || a.student?.user?.email?.toLowerCase().includes(q) ||
      a.job?.title?.toLowerCase().includes(q) || a.job?.company?.companyName?.toLowerCase().includes(q)) &&
      (!statusFilter || a.status === statusFilter);
  });

  const handleStatusChange = async (id: number, status: string) => {
    setUpdating(id);
    try { await adminApi.updateApplicationStatus(id, { status }); toast.success(`Updated to ${status}`); refetch(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setUpdating(null); }
  };

  const handleDownload = () => {
    const rows = filtered.map(a => ({
      StudentName: a.student?.user?.name || '', Email: a.student?.user?.email || '',
      Department: a.student?.department || '', CGPA: a.student?.cgpa || '',
      JobTitle: a.job?.title || '', Company: a.job?.company?.companyName || '',
      Type: a.job?.type || '', Status: a.status,
      AppliedOn: new Date(a.createdAt).toLocaleDateString(),
      MatchScore: a.matchScore ? `${Math.round(a.matchScore)}%` : '',
      ResumeUrl: a.resumeUrl || '',
    }));
    downloadCSV(rows, `applications_${statusFilter || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Job Applications</h1>
          <p className="text-sm text-gray-500 mt-1">{all.length} total · {filtered.length} shown</p>
        </div>
        <button onClick={handleDownload}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Download size={15} /> Download CSV ({filtered.length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search student, job, company..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(all.reduce((acc: any, a: any) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {}))
          .map(([status, count]) => (
            <button key={status} onClick={() => setStatusFilter(p => p === status ? '' : status)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${statusFilter === status ? 'ring-2 ring-offset-1 ring-emerald-400' : ''} ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
              {status} ({count as number})
            </button>
          ))}
      </div>

      {filtered.length === 0 ? <EmptyState title="No applications found" description="Try adjusting your filters" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Student','Job / Company','Status','Applied','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a: any) => (
                  <React.Fragment key={a.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                            {a.student?.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs">{a.student?.user?.name || 'Unknown'}</p>
                            <p className="text-gray-500 text-[11px]">{a.student?.user?.email}</p>
                            {a.student?.cgpa && <p className="text-[11px] text-emerald-600 font-semibold">CGPA: {a.student.cgpa}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-xs">{a.job?.title}</p>
                        <p className="text-gray-500 text-[11px]">{a.job?.company?.companyName}</p>
                        <p className="text-[11px] text-gray-400">{a.job?.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                        {a.matchScore && <p className="text-[11px] text-gray-400 mt-0.5">Match: {Math.round(a.matchScore)}%</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {a.resumeUrl && (
                            <a href={`http://localhost:5000${a.resumeUrl}`} target="_blank" rel="noreferrer"
                              className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-100">
                              <FileText size={11} /> CV
                            </a>
                          )}
                          <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                            className="text-xs text-gray-400 hover:text-gray-700 bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-gray-100">
                            {expandedId === a.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />} Details
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr>
                        <td colSpan={5} className="px-4 pb-4 bg-gray-50">
                          <div className="pt-3 grid sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-1.5">Update Status</p>
                              <div className="flex flex-wrap gap-1.5">
                                {['Under Review','Shortlisted','Interview Scheduled','Selected','Rejected'].map(s => (
                                  <button key={s} onClick={() => handleStatusChange(a.id, s)}
                                    disabled={updating === a.id || a.status === s}
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${a.status === s ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
                                    {updating === a.id && a.status !== s ? <Loader2 size={10} className="animate-spin inline" /> : s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {a.coverLetter && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-1">Cover Letter</p>
                                <p className="text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100 line-clamp-3">{a.coverLetter}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
