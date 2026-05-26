// src/pages/student/StudentApplications.tsx
import React from 'react';
import { applicationsApi } from '../../api/applications';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState, EmptyState } from '../../components/common/LoadingState';
import { Application } from '../../types';
import { toast } from 'sonner';
import { Calendar, MapPin } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Shortlisted: 'bg-purple-100 text-purple-700 border-purple-200',
  'Interview Scheduled': 'bg-orange-100 text-orange-700 border-orange-200',
  Selected: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function StudentApplications() {
  const { data: result, loading, error, refetch } = useFetch(
    () => applicationsApi.getMyApplications()
  );

  const applications: Application[] = Array.isArray(result) ? result : (Array.isArray((result as any)?.data) ? (result as any)?.data : ((result as any)?.data?.data || []));

  const handleWithdraw = async (id: number) => {
    if (!confirm('Withdraw this application?')) return;
    try {
      await applicationsApi.withdraw(id);
      toast.success('Application withdrawn');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Applications</h1>
        <p className="text-sm text-gray-500 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''} total</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Browse jobs and apply to get started" />
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{app.job?.title}</h3>
                  <p className="text-sm text-gray-600">{app.job?.company?.companyName}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {app.job?.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>

                  {app.status === 'Interview Scheduled' && app.interviewAt && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-orange-700">Interview Scheduled</p>
                          <p className="text-xs text-orange-600 mt-0.5">
                            📅 {new Date(app.interviewAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} · {app.interviewMode}
                          </p>
                        </div>
                        {app.meetingLink && (
                          <a href={app.meetingLink.startsWith('http') ? app.meetingLink : `https://${app.meetingLink}`} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition" target="_blank" rel="noopener noreferrer">Join Meeting</a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLES[app.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {app.status}
                  </span>
                  {!['Selected', 'Rejected', 'Withdrawn'].includes(app.status) && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
