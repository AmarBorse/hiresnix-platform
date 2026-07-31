// src/pages/student/StudentJobs.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, DollarSign, Briefcase, Search, Loader2, CheckCircle, ExternalLink, Globe, RefreshCw } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi } from '../../api/applications';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Application, Job } from '../../types';
import { toast } from 'sonner';
import axios from 'axios';

const DIFFICULTY_COLORS: Record<string, string> = {
  'Full-time': 'bg-green-100 text-green-700',
  'Internship': 'bg-blue-100 text-blue-700',
  'Part-time': 'bg-yellow-100 text-yellow-700',
  'Contract': 'bg-purple-100 text-purple-700',
  'remote': 'bg-indigo-100 text-indigo-700',
};

// ── External Job Sources ──────────────────────────────────────────
interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  url: string;
  description: string;
  tags: string[];
  source: 'remotive' | 'themuse';
  postedAt: string;
}

const REMOTIVE_CATEGORIES = [
  'software-dev', 'data', 'devops-sysadmin', 'design',
  'product', 'backend', 'frontend', 'fullstack',
];

async function fetchRemotive(search: string): Promise<ExternalJob[]> {
  try {
    const url = search
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}&limit=30`
      : `https://remotive.com/api/remote-jobs?category=software-dev&limit=30`;
    const res = await axios.get(url);
    return (res.data?.jobs || []).map((j: any) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || 'Remote',
      type: 'remote',
      url: j.url,
      description: j.description?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
      tags: j.tags || [],
      source: 'remotive' as const,
      postedAt: j.publication_date,
    }));
  } catch { return []; }
}

async function fetchTheMuse(search: string): Promise<ExternalJob[]> {
  try {
    const url = search
      ? `https://www.themuse.com/api/public/jobs?category=Computer+and+IT&descending=true&page=1&query=${encodeURIComponent(search)}`
      : `https://www.themuse.com/api/public/jobs?category=Computer+and+IT&descending=true&page=1`;
    const res = await axios.get(url);
    return (res.data?.results || []).slice(0, 20).map((j: any) => ({
      id: `muse-${j.id}`,
      title: j.name,
      company: j.company?.name || 'Company',
      location: j.locations?.map((l: any) => l.name).join(', ') || 'Remote',
      type: j.type || 'Full-time',
      url: j.refs?.landing_page || '#',
      description: j.contents?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
      tags: j.categories?.map((c: any) => c.name) || [],
      source: 'themuse' as const,
      postedAt: j.publication_date,
    }));
  } catch { return []; }
}

// ── Source badge ──────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  if (source === 'remotive') return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)' }}>
      🌐 Remotive
    </span>
  );
  if (source === 'themuse') return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899', border: '1px solid rgba(236,72,153,0.2)' }}>
      ✨ The Muse
    </span>
  );
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
      🏢 Hiresnix
    </span>
  );
}

export function StudentJobs() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [applying, setApplying] = useState<number | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<number, string>>({});
  const [showCover, setShowCover] = useState<number | null>(null);
  const [activeSource, setActiveSource] = useState<'all' | 'hiresnix' | 'remotive' | 'themuse'>('all');

  // External jobs state
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);

  const { data: result, loading, error, refetch } = useFetch(
    () => jobsApi.getJobs({ search: search || undefined, type: type || undefined, page, limit: 10 }),
    [search, type, page]
  );
  const { data: applicationsResult, loading: applicationsLoading, refetch: refetchApplications } = useFetch(
    () => applicationsApi.getMyApplications()
  );

  const jobs: Job[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));
  const applications: Application[] = Array.isArray(applicationsResult)
    ? applicationsResult
    : (Array.isArray((applicationsResult as any)?.data) ? (applicationsResult as any)?.data : ((applicationsResult as any)?.data?.data || []));
  const totalPages: number = (result as any)?.data?.totalPages || (result as any)?.totalPages || 1;
  const applicationByJobId = useMemo(() => {
    return new Map(
      applications.filter(app => app.job?.id).map(app => [app.job!.id, app])
    );
  }, [applications]);

  // Fetch external jobs
  const loadExternalJobs = async (q: string) => {
    setExternalLoading(true);
    const [remotive, muse] = await Promise.all([
      fetchRemotive(q),
      fetchTheMuse(q),
    ]);
    setExternalJobs([...remotive, ...muse]);
    setExternalLoading(false);
  };

  useEffect(() => {
    if (activeSource !== 'hiresnix') loadExternalJobs(search);
  }, [search, activeSource]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

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

  // Filter external jobs by source
  const filteredExternal = externalJobs.filter(j => {
    if (activeSource === 'remotive') return j.source === 'remotive';
    if (activeSource === 'themuse') return j.source === 'themuse';
    return true;
  });

  const showHiresnix = activeSource === 'all' || activeSource === 'hiresnix';
  const showExternal = activeSource !== 'hiresnix';

  const totalCount = (showHiresnix ? jobs.length : 0) + (showExternal ? filteredExternal.length : 0);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Browse Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Real jobs from multiple sources — apply directly</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>
        <button onClick={handleSearch}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition flex items-center gap-1.5">
          <Search size={14} /> Search
        </button>
        <button onClick={() => loadExternalJobs(search)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition" title="Refresh jobs">
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Source tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'all', label: '🌍 All Jobs' },
          { id: 'hiresnix', label: '🏢 Hiresnix' },
          { id: 'remotive', label: '🌐 Remotive' },
          { id: 'themuse', label: '✨ The Muse' },
        ] as const).map(s => (
          <button key={s.id} onClick={() => setActiveSource(s.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${activeSource === s.id ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {externalLoading ? 'Fetching live jobs...' : `${totalCount} jobs found`}
      </p>

      {/* Loading */}
      {(loading || applicationsLoading) && showHiresnix && <PageLoader />}

      {/* Jobs list */}
      <div className="space-y-3">

        {/* Hiresnix jobs */}
        {showHiresnix && jobs.map(job => {
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
                    <SourceBadge source="hiresnix" />
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
                  <p className="text-xs text-gray-400">Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</p>
                  {hasApplication ? (
                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-lg">
                      <CheckCircle size={13} />
                      {application.status === 'Withdrawn' ? 'Withdrawn' : 'Applied'}
                    </div>
                  ) : (
                    <button onClick={() => setShowCover(showCover === job.id ? null : job.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
              {!hasApplication && showCover === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <textarea rows={3} placeholder="Cover letter (optional)..."
                    value={coverLetters[job.id] || ''}
                    onChange={e => setCoverLetters(p => ({ ...p, [job.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowCover(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition">Cancel</button>
                    <button onClick={() => handleApply(job.id)} disabled={applying === job.id}
                      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition">
                      {applying === job.id && <Loader2 size={12} className="animate-spin" />}
                      Submit Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* External jobs */}
        {showExternal && (
          externalLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">Fetching live jobs from Remotive & The Muse...</span>
            </div>
          ) : (
            filteredExternal.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {job.type === 'remote' ? '🌍 Remote' : job.type}
                      </span>
                      <SourceBadge source={job.source} />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                      {job.postedAt && (
                        <span>📅 {new Date(job.postedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.description}</p>
                    )}
                    {job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <a href={job.url} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                    <ExternalLink size={12} /> Apply
                  </a>
                </div>
              </div>
            ))
          )
        )}

        {/* Empty state */}
        {totalCount === 0 && !loading && !externalLoading && (
          <EmptyState title="No jobs found" description="Try different search keywords or change the source filter" />
        )}
      </div>

      {/* Pagination for Hiresnix jobs */}
      {showHiresnix && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400">
        External jobs from Remotive & The Muse are fetched live. Hiresnix is not responsible for external listings.
      </p>
    </div>
  );
}