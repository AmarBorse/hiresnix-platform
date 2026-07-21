// src/pages/admin/AdminAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics';
import { adminApi } from '../../api/admin';
import { useFetch } from '../../hooks/useFetch';
import { PageLoader, ErrorState } from '../../components/common/LoadingState';
import { TrendingUp, Users, Briefcase, Award, MessageSquare, BarChart2, Brain, FileText, GraduationCap, Zap, Mail, Target, Mic } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

const FEATURE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  mock_interview:   { label: 'AI Mock Interview',    icon: '🎤', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  resume_builder:   { label: 'Resume AI',            icon: '📄', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  academy:          { label: 'AI Academy',           icon: '🎓', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  internship:       { label: 'Internship Platform',  icon: '💼', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  career_roadmap:   { label: 'Career Roadmap',       icon: '🗺️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  cold_email:       { label: 'Cold Email Generator', icon: '📧', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  jd_match:         { label: 'JD Match',             icon: '🎯', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  cover_letter:     { label: 'Cover Letter',         icon: '✉️', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  interview_prep:   { label: 'Interview Prep',       icon: '❓', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  linkedin_summary: { label: 'LinkedIn Summary',     icon: '💼', color: '#0077b5', bg: 'rgba(0,119,181,0.12)' },
};

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
  const [featureData, setFeatureData] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem('hx_admin_token') || localStorage.getItem('hirenix_token');
    fetch(`${API}/analytics/feature-usage?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { if (d.success) setFeatureData(d.data); }).catch(() => {});
  }, [days]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const a = (overview as any)?.data || (overview as any) || {};
  const placementRate = a.totalStudents > 0 ? Math.round((a.placedStudents / a.totalStudents) * 100) : 0;
  const departments = Array.isArray(deptData) ? deptData : (Array.isArray((deptData as any)?.data) ? (deptData as any)?.data : ((deptData as any)?.data?.data || []));
  const skills = Array.isArray(skillData) ? skillData : (Array.isArray((skillData as any)?.data) ? (skillData as any)?.data : ((skillData as any)?.data?.data || []));

  const featureUsage = featureData?.featureUsage || {};
  const totalUsage = Object.values(featureUsage).reduce((s: any, v: any) => s + v, 0) as number;
  const sortedFeatures = Object.entries(featureUsage).sort(([,a]: any, [,b]: any) => b - a);
  const topFeature = sortedFeatures[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Live platform statistics</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Students"   value={a.totalStudents}     icon={Users}       color="bg-blue-500" />
        <MetricCard label="Placed Students"  value={a.placedStudents}    icon={TrendingUp}  color="bg-green-500" />
        <MetricCard label="Total Jobs"       value={a.totalJobs}         icon={Briefcase}   color="bg-violet-500" />
        <MetricCard label="Certificates"     value={a.totalCertificates} icon={Award}       color="bg-amber-500" />
        <MetricCard label="Unread Enquiries" value={a.unreadEnquiries}   icon={MessageSquare} color="bg-rose-500" />
      </div>

      {/* ── FEATURE USAGE SECTION ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-500" /> Feature Usage
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Which features students use the most</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${days === d ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {sortedFeatures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm text-gray-500">No usage data yet</p>
            <p className="text-xs text-gray-400 mt-1">Data will appear as students use features</p>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-3 rounded-xl bg-indigo-50">
                <p className="text-xl font-black text-indigo-600">{totalUsage}</p>
                <p className="text-xs text-gray-500">Total interactions</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50">
                <p className="text-xl font-black text-green-600">{sortedFeatures.length}</p>
                <p className="text-xs text-gray-500">Active features</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <p className="text-sm font-black text-amber-600">{topFeature ? (FEATURE_CONFIG[topFeature[0]]?.label || topFeature[0]) : '—'}</p>
                <p className="text-xs text-gray-500">Most popular</p>
              </div>
            </div>

            {/* Feature bars */}
            <div className="space-y-3">
              {sortedFeatures.map(([feature, count]: any) => {
                const config = FEATURE_CONFIG[feature] || { label: feature, icon: '⚡', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
                const pct = totalUsage > 0 ? Math.round((count / totalUsage) * 100) : 0;
                return (
                  <div key={feature}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{config.icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{pct}%</span>
                        <span className="text-sm font-bold" style={{ color: config.color }}>{count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: config.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Mock Interview + Academy Stats */}
      {featureData && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎤</span> Mock Interview Stats
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-indigo-50">
                <p className="text-xl font-black text-indigo-600">{featureData.mockInterview?.total || 0}</p>
                <p className="text-xs text-gray-500">Total interviews</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50">
                <p className="text-xl font-black text-green-600">{Math.round(featureData.mockInterview?.avg_score || 0)}</p>
                <p className="text-xs text-gray-500">Avg score</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50">
                <p className="text-xl font-black text-amber-600">{featureData.mockInterview?.top_score || 0}</p>
                <p className="text-xs text-gray-500">Top score</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎓</span> Academy Stats
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-blue-50">
                <p className="text-xl font-black text-blue-600">{featureData.academy?.active_students || 0}</p>
                <p className="text-xs text-gray-500">Active students</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-50">
                <p className="text-xl font-black text-purple-600">{featureData.academy?.total_completions || 0}</p>
                <p className="text-xs text-gray-500">Course completions</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50">
                <p className="text-xl font-black text-green-600">{Math.round(featureData.academy?.avg_progress || 0)}%</p>
                <p className="text-xs text-gray-500">Avg progress</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placement rate bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Overall Placement Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all duration-700"
                style={{ width: `${placementRate}%` }} />
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