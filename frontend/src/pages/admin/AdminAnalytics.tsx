// src/pages/admin/AdminAnalytics.tsx
import React from 'react';
import { analyticsApi } from '../../api/analytics';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { TrendingUp, Users, Briefcase, Award } from 'lucide-react';

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const { data: overview, loading, error, refetch } = useFetch(() => adminApi.getAnalytics());
  const { data: cgpaData } = useFetch(() => analyticsApi.getCgpaPlacement().catch(() => ({ data: null, success: false })));
  const { data: skillData } = useFetch(() => analyticsApi.getSkillDemand().catch(() => ({ data: null, success: false })));
  const { data: deptData } = useFetch(() => analyticsApi.getDepartmentStats().catch(() => ({ data: null, success: false })));

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  // Safely extract the overview object whether it is nested in .data or already unwrapped
  const a = (overview as any)?.data || (overview as any) || {};
  const placementRate = a.totalStudents > 0 ? Math.round((a.placedStudents / a.totalStudents) * 100) : 0;

  const departments = Array.isArray(deptData) ? deptData : (Array.isArray((deptData as any)?.data) ? (deptData as any)?.data : ((deptData as any)?.data?.data || []));
  const skills = Array.isArray(skillData) ? skillData : (Array.isArray((skillData as any)?.data) ? (skillData as any)?.data : ((skillData as any)?.data?.data || []));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Live platform statistics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Students"   value={a.totalStudents}     icon={Users}    color="bg-blue-500" />
        <MetricCard label="Placed Students"  value={a.placedStudents}    icon={TrendingUp} color="bg-green-500" />
        <MetricCard label="Total Jobs"       value={a.totalJobs}         icon={Briefcase} color="bg-violet-500" />
        <MetricCard label="Certificates"     value={a.totalCertificates} icon={Award}    color="bg-amber-500" />
      </div>

      {/* Placement rate bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Overall Placement Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all duration-700"
                style={{ width: `${placementRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{a.placedStudents} placed</span>
              <span>{a.totalStudents ? a.totalStudents - a.placedStudents : 0} not yet placed</span>
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{placementRate}%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Department stats */}
        {departments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Students by Department</h2>
            <div className="space-y-2">
              {departments.slice(0, 8).map((d: any) => {
                const pct = d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0;
                return (
                  <div key={d.department}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="font-semibold">{d.department || 'Unknown'}</span>
                      <span>{d.placed}/{d.total} placed ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top skills in demand */}
        {skills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Top Skills in Demand</h2>
            <div className="space-y-2">
              {skills.slice(0, 8).map((s: any, idx: number) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-semibold text-gray-800">{s.skill}</span>
                      <span className="text-gray-500">{s.count} jobs</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-violet-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (s.count / (skills[0]?.count || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Platform Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Companies',          value: a.totalCompanies },
            { label: 'Applications',       value: a.totalApplications },
            { label: 'Active Internships', value: a.activeInternships },
            { label: 'Pending Jobs',       value: a.pendingJobs },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xl font-black text-gray-900">{value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
