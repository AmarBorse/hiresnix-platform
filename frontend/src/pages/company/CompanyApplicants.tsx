// src/pages/company/CompanyApplicants.tsx
import React, { useState } from 'react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi } from '../../api/applications';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { toast } from 'sonner';
import { ChevronDown, FileText, Calendar, ExternalLink, Loader2 } from 'lucide-react';

const STATUSES = ['Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

const STATUS_STYLES: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  Shortlisted: 'bg-purple-100 text-purple-700',
  'Interview Scheduled': 'bg-orange-100 text-orange-700',
  Selected: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export function CompanyApplicants() {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [interviewModal, setInterviewModal] = useState<{ appId: number } | null>(null);
  const [interviewForm, setInterviewForm] = useState({ date: '', time: '', mode: 'Online', link: '' });

  const { data: jobsRes } = useFetch(() => jobsApi.getMyPostings());
  const jobs: any[] = Array.isArray(jobsRes) ? jobsRes : (Array.isArray((jobsRes as any)?.data) ? (jobsRes as any)?.data : ((jobsRes as any)?.data?.data || []));

  const { data: appsRes, loading, error, refetch } = useFetch(
    () => selectedJob
      ? applicationsApi.getJobApplicants(selectedJob)
      : Promise.resolve({ data: [], success: true }),
    [selectedJob]
  );
  const applications: any[] = Array.isArray(appsRes) ? appsRes : (Array.isArray((appsRes as any)?.data) ? (appsRes as any)?.data : ((appsRes as any)?.data?.data || []));

  const handleStatusChange = async (appId: number, status: string) => {
    if (status === 'Interview Scheduled') {
      setInterviewModal({ appId });
      return;
    }
    setUpdating(appId);
    try {
      await applicationsApi.updateStatus(appId, { status });
      toast.success(`Status updated to ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewModal || !interviewForm.date || !interviewForm.time) {
      toast.error('Date and time are required');
      return;
    }
    setUpdating(interviewModal.appId);
    try {
      await applicationsApi.updateStatus(interviewModal.appId, {
        status: 'Interview Scheduled',
        interviewDetails: {
          interviewAt: new Date(`${interviewForm.date}T${interviewForm.time}`).toISOString(),
          interviewMode: interviewForm.mode,
          meetingLink: interviewForm.link,
        },
      });
      toast.success('Interview scheduled!');
      setInterviewModal(null);
      setInterviewForm({ date: '', time: '', mode: 'Online', link: '' });
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Applicants</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage candidates for your job postings</p>
      </div>

      {/* Job selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Job Posting</label>
        <select
          value={selectedJob || ''}
          onChange={e => setSelectedJob(e.target.value ? Number(e.target.value) : null)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 bg-white"
        >
          <option value="">-- Choose a job --</option>
          {jobs.map((j: any) => (
            <option key={j.id} value={j.id}>{j.title} ({j.applicationCount} applicants)</option>
          ))}
        </select>
      </div>

      {!selectedJob ? (
        <EmptyState title="Select a job to view applicants" description="Choose a job posting from the dropdown above" />
      ) : loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : applications.length === 0 ? (
        <EmptyState title="No applicants yet" description="Applicants will appear here once students apply" />
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                      {app.student?.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{app.student?.user?.name}</p>
                      <p className="text-xs text-gray-500">{app.student?.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {app.student?.cgpa && <span className="bg-gray-100 px-2 py-0.5 rounded">CGPA: {app.student.cgpa}</span>}
                    {app.student?.department && <span className="bg-gray-100 px-2 py-0.5 rounded">{app.student.department}</span>}
                    {app.student?.year && <span className="bg-gray-100 px-2 py-0.5 rounded">Year {app.student.year}</span>}
                  </div>

                  {app.student?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.student.skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}

                  {app.coverLetter && (
                    <p className="text-xs text-gray-600 mt-2 italic bg-gray-50 p-2 rounded-lg line-clamp-2">"{app.coverLetter}"</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {app.student?.resumeUrl && (
                      <a
                        href={`${((import.meta as any).env.VITE_API_URL || '').replace('/api', '')}/${app.student.resumeUrl}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                      >
                        <FileText size={11} /> Resume <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                    {!['Selected', 'Rejected'].includes(app.status) && (
                      <div className="relative">
                        <select
                          disabled={updating === app.id}
                          onChange={e => e.target.value && handleStatusChange(app.id, e.target.value)}
                          className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white focus:outline-none focus:border-violet-400 cursor-pointer pr-7"
                          defaultValue=""
                        >
                          <option value="" disabled>Update status</option>
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {updating === app.id
                          ? <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                          : <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        }
                      </div>
                    )}
                  </div>

                  {app.status === 'Interview Scheduled' && app.interviewAt && (
                    <div className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg">
                      <p className="font-bold">📅 {new Date(app.interviewAt).toLocaleString()} · {app.interviewMode || 'Online'}</p>
                      {app.meetingLink && (
                        <a href={app.meetingLink.startsWith('http') ? app.meetingLink : `https://${app.meetingLink}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-blue-600 hover:text-blue-700 hover:underline">
                          Meeting Link
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interview Schedule Modal */}
      {interviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-black text-gray-900 text-lg mb-4">Schedule Interview</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date *</label>
                  <input
                    type="date"
                    value={interviewForm.date}
                    onChange={e => setInterviewForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Time *</label>
                  <input
                    type="time"
                    value={interviewForm.time}
                    onChange={e => setInterviewForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mode</label>
                <select
                  value={interviewForm.mode}
                  onChange={e => setInterviewForm(p => ({ ...p, mode: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 bg-white"
                >
                  <option>Online</option>
                  <option>In-Person</option>
                  <option>Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meeting Link</label>
                <input
                  type="url" placeholder="https://meet.google.com/..."
                  value={interviewForm.link}
                  onChange={e => setInterviewForm(p => ({ ...p, link: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleScheduleInterview}
                disabled={!!updating}
                className="flex-1 flex items-center justify-center gap-1.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                Schedule
              </button>
              <button
                onClick={() => setInterviewModal(null)}
                className="flex-1 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
