// src/pages/admin/AdminJobs.tsx
import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Download, Search, Building2, Loader2, Trash2 } from 'lucide-react';
import client from '../../api/client';

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
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  Closed:   'bg-gray-100 text-gray-600',
  Expired:  'bg-orange-100 text-orange-700',
};

export function AdminJobs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actioning, setActioning] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => client.get('/jobs', { params: { limit: 200, admin: true } }).then(r => r.data)
  );
  
  // Safely extract the array whether 'result' is the response object or the array itself
  const jobs: any[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (!search || j.title?.toLowerCase().includes(q) || j.company?.companyName?.toLowerCase().includes(q)) &&
      (!statusFilter || j.status === statusFilter);
  });

  const handleAction = async (id: number, approve: boolean) => {
    setActioning(id);
    try {
      if (approve) await adminApi.approveJob(id);
      else await adminApi.rejectJob(id);
      toast.success(approve ? 'Job approved!' : 'Job rejected!');
      refetch();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setActioning(null); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteJob(id);
      toast.success('Job deleted successfully!');
      refetch();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete job'); }
    finally { setDeletingId(null); }
  };

  const handleDownloadApplicants = async (jobId: number, jobTitle: string) => {
    setDownloadingId(jobId);
    try {
      const res = await adminApi.downloadJobApplications(jobId);
      const apps = res.data || [];
      if (!apps.length) { toast.error('No applicants for this job'); return; }
      const rows = apps.map((a: any) => ({
        StudentName: a.student?.user?.name || '', Email: a.student?.user?.email || '',
        Department: a.student?.department || '', CGPA: a.student?.cgpa || '',
        Status: a.status, AppliedOn: new Date(a.createdAt).toLocaleDateString(),
        MatchScore: a.matchScore ? `${Math.round(a.matchScore)}%` : '',
        ResumeUrl: a.resumeUrl || '',
      }));
      downloadCSV(rows, `applicants_${jobTitle.replace(/\s+/g, '_')}.csv`);
    } catch { toast.error('Failed to download'); }
    finally { setDownloadingId(null); }
  };

  const handleDownloadAll = () => {
    const rows = filtered.map(j => ({
      Title: j.title, Company: j.company?.companyName || '', Type: j.type,
      Status: j.status, Location: j.location || '', IsRemote: j.isRemote ? 'Yes' : 'No',
      Openings: j.openings, Applications: j.applicationCount,
      SalaryMin: j.salaryMin || '', SalaryMax: j.salaryMax || '',
      Deadline: j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString() : '',
      PostedOn: new Date(j.createdAt).toLocaleDateString(),
    }));
    downloadCSV(rows, `jobs_${statusFilter || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Job Listings</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} total · {filtered.length} shown</p>
        </div>
        <button onClick={handleDownloadAll}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          <Download size={15} /> Export Jobs CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search job title or company..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(jobs.reduce((acc: any, j: any) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {}))
          .map(([status, count]) => (
            <button key={status} onClick={() => setStatusFilter(p => p === status ? '' : status)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition ${statusFilter === status ? 'ring-2 ring-offset-1 ring-emerald-400' : ''} ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
              {status} ({count as number})
            </button>
          ))}
      </div>

      {filtered.length === 0 ? <EmptyState title="No jobs found" description="Try adjusting filters" /> : (
        <div className="space-y-3">
          {filtered.map((j: any) => {
            const expired = new Date(j.applicationDeadline) < new Date();
            return (
              <div key={j.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{j.title}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[j.status] || 'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                        {expired && j.status !== 'Closed' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expired</span>}
                      </div>
                      <p className="text-sm text-gray-600">{j.company?.companyName}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        <span>{j.type}</span>
                        {j.location && <span>📍 {j.location}</span>}
                        {j.isRemote && <span>🌐 Remote</span>}
                        <span>{j.applicationCount} applications</span>
                        <span>Deadline: {new Date(j.applicationDeadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Action Buttons */}
                    <div className="flex gap-1.5">
                      {j.status === 'Pending' && (
                        <>
                          <button onClick={() => handleAction(j.id, true)} disabled={actioning === j.id}
                            className="flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition">
                            {actioning === j.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                          </button>
                          <button onClick={() => handleAction(j.id, false)} disabled={actioning === j.id}
                            className="flex items-center gap-1 text-xs font-bold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-2 py-1.5 rounded-lg transition">
                            <XCircle size={11} /> Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(j.id)} disabled={deletingId === j.id} title="Delete Job"
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 px-2.5 py-1.5 rounded-lg transition">
                        {deletingId === j.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    </div>
                    
                    {/* Download applicants */}
                    {j.applicationCount > 0 && (
                      <button onClick={() => handleDownloadApplicants(j.id, j.title)}
                        disabled={downloadingId === j.id}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition">
                        {downloadingId === j.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                        {j.applicationCount} Applicants CSV
                      </button>
                    )}
                  </div>
                </div>

                {j.rejectionReason && (
                  <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg p-2">Rejection reason: {j.rejectionReason}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
