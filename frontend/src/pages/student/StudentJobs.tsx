// src/pages/student/StudentJobs.tsx
import React, { useMemo, useState } from 'react';
import { MapPin, DollarSign, Briefcase, Search, Loader2, CheckCircle } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi } from '../../api/applications';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Application, Job } from '../../types';
import { toast } from 'sonner';

const DIFFICULTY_COLORS: Record<string, string> = {
  'Full-time': 'bg-green-100 text-green-700',
  'Internship': 'bg-blue-100 text-blue-700',
  'Part-time': 'bg-yellow-100 text-yellow-700',
  'Contract': 'bg-purple-100 text-purple-700',
};

export function StudentJobs() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [applying, setApplying] = useState<number | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<number, string>>({});
  const [showCover, setShowCover] = useState<number | null>(null);

  const { data: result, loading, error, refetch } = useFetch(
    () => jobsApi.getJobs({ search: search || undefined, type: type || undefined, page, limit: 10 }),
    [search, type, page]
  );
  const { data: applicationsResult, loading: applicationsLoading, error: applicationsError, refetch: refetchApplications } = useFetch(
    () => applicationsApi.getMyApplications()
  );

  const jobs: Job[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));
  const applications: Application[] = Array.isArray(applicationsResult)
    ? applicationsResult
    : (Array.isArray((applicationsResult as any)?.data) ? (applicationsResult as any)?.data : ((applicationsResult as any)?.data?.data || []));
  const total: number = (result as any)?.data?.total || (result as any)?.total || 0;
  const totalPages: number = (result as any)?.data?.totalPages || (result as any)?.totalPages || 1;
  const applicationByJobId = useMemo(() => {
    return new Map(
      applications
        .filter(app => app.job?.id)
        .map(app => [app.job!.id, app])
    );
  }, [applications]);

  const handleApply = async (jobId: number) => {
    setApplying(jobId);
    try {
      await applicationsApi.apply(jobId, { coverLetter: coverLetters[jobId] || '' });
      toast.success('Application submitted successfully!');
      setShowCover(null);
      refetch();
      refetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  if (loading || applicationsLoading) return <PageLoader />;
  if (error || applicationsError) return <ErrorState message={error || applicationsError || 'Failed to load jobs'} onRetry={() => { refetch(); refetchApplications(); }} />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Browse Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Find the perfect opportunity for your career</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search jobs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>
        <select
          value={type}
          onChange={e => { setType(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">{total} jobs found</p>

      {jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Try adjusting your search filters" />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const application = applicationByJobId.get(job.id);
            const hasApplication = !!application;

            return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[job.type] || 'bg-gray-100 text-gray-600'}`}>
                      {job.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{job.company?.companyName}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} />
                      ₹{(job.salaryMin / 100000).toFixed(1)}L – ₹{(job.salaryMax / 100000).toFixed(1)}L
                    </span>
                    <span className="flex items-center gap-1.5"><Briefcase size={14} /> Min CGPA: {job.minCGPA}</span>
                  </div>
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.requiredSkills.slice(0, 5).map(s => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <p className="text-xs text-gray-400">
                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </p>
                  {hasApplication ? (
                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-lg">
                      <CheckCircle size={13} />
                      {application.status === 'Withdrawn' ? 'Withdrawn' : 'Applied'}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCover(showCover === job.id ? null : job.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>

              {!hasApplication && showCover === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Cover letter (optional)..."
                    value={coverLetters[job.id] || ''}
                    onChange={e => setCoverLetters(p => ({ ...p, [job.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowCover(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applying === job.id}
                      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
                    >
                      {applying === job.id && <Loader2 size={12} className="animate-spin" />}
                      Submit Application
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
