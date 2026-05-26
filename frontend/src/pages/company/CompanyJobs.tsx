// src/pages/company/CompanyJobs.tsx
import React, { useState } from 'react';
import { Link } from 'react-router';
import { jobsApi } from '../../api/jobs';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Job } from '../../types';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, Users, MapPin, DollarSign, Loader2 } from 'lucide-react';

export function CompanyJobs() {
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => jobsApi.getMyPostings()
  );
  const jobs: Job[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this job posting?')) return;
    setDeleting(id);
    try {
      await jobsApi.deleteJob(id);
      toast.success('Job deleted');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/company/jobs/create"
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
        >
          <PlusCircle size={16} /> Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No jobs posted yet" description="Create your first job posting to start receiving applications" />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      job.status === 'Approved' ? 'bg-green-100 text-green-700'
                      : job.status === 'Pending' ? 'bg-yellow-100 text-yellow-700'
                      : job.status === 'Rejected' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1.5"><MapPin size={13} /> {job.location}</span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={13} />
                      ₹{(job.salaryMin / 100000).toFixed(1)}L–{(job.salaryMax / 100000).toFixed(1)}L
                    </span>
                    <span className="flex items-center gap-1.5"><Users size={13} /> {job.applicationCount} applicants</span>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.requiredSkills.slice(0, 5).map(s => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/company/jobs/edit/${job.id}`}
                    className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-300 transition"
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deleting === job.id}
                    className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition"
                  >
                    {deleting === job.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
