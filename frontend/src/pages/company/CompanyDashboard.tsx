// src/pages/company/CompanyDashboard.tsx
import React from 'react';
import { Link } from 'react-router';
import { Briefcase, Users, TrendingUp, ChevronRight, PlusCircle, Clock } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi } from '../../api/applications';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { useAuthStore } from '../../store/useAuthStore';

export function CompanyDashboard() {
  const { user } = useAuthStore();

  const { data: jobsRes, loading: jLoading } = useFetch(
    () => jobsApi.getMyPostings()
  );
  const jobs = Array.isArray(jobsRes) ? jobsRes : (Array.isArray((jobsRes as any)?.data) ? (jobsRes as any)?.data : ((jobsRes as any)?.data?.data || []));

  const loading = jLoading;
  if (loading) return <PageLoader />;

  const approvedJobs = jobs.filter((j: any) => j.status === 'Approved');
  const pendingJobs = jobs.filter((j: any) => j.status === 'Pending');
  const totalApplications = jobs.reduce((sum: number, j: any) => sum + (j.applicationCount || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
        <p className="text-violet-200 text-sm">Company Portal 👋</p>
        <h1 className="text-2xl font-black mt-1">{user?.name}</h1>
        <p className="text-violet-200 text-sm mt-1">Manage your job postings and find top talent</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'bg-violet-500', to: '/company/jobs' },
          { label: 'Active Jobs', value: approvedJobs.length, icon: TrendingUp, color: 'bg-green-500', to: '/company/jobs' },
          { label: 'Pending Review', value: pendingJobs.length, icon: Clock, color: 'bg-yellow-500', to: '/company/jobs' },
          { label: 'Total Applicants', value: totalApplications, icon: Users, color: 'bg-blue-500', to: '/company/applicants' },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Job Postings</h2>
          <Link to="/company/jobs" className="text-xs text-violet-500 flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 mb-3">No jobs posted yet</p>
            <Link to="/company/jobs/create" className="inline-flex items-center gap-1.5 bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-violet-600 transition">
              <PlusCircle size={13} /> Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.type} · {job.applicationCount} applicants</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  job.status === 'Approved' ? 'bg-green-100 text-green-700'
                  : job.status === 'Pending' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
