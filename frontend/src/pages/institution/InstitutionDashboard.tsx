// src/pages/institution/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Layers, BookOpen, Award, GraduationCap, TrendingUp } from 'lucide-react';
import { institutionApi } from '../../api/institution';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DashStats {
  totalStudents: number; totalBatches: number; totalCourses: number; totalCertificates: number;
  recentStudents: any[]; recentBatches: any[];
}

const StatCard = ({ label, value, icon: Icon, color, to }: any) => {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(to)}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

export function InstitutionDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    institutionApi.getDashboard()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Institution Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your students, batches, and certificates</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"    value={stats?.totalStudents ?? 0}     icon={Users}         color="bg-indigo-500"  to="/institution/students" />
        <StatCard label="Total Batches"     value={stats?.totalBatches ?? 0}      icon={Layers}        color="bg-violet-500"  to="/institution/batches" />
        <StatCard label="Total Courses"     value={stats?.totalCourses ?? 0}      icon={BookOpen}      color="bg-blue-500"    to="/institution/courses" />
        <StatCard label="Certificates"      value={stats?.totalCertificates ?? 0} icon={Award}         color="bg-emerald-500" to="/institution/certificates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-800">Recent Students</h2>
          </div>
          {(stats?.recentStudents?.length ?? 0) === 0
            ? <p className="text-gray-400 text-sm">No students yet</p>
            : <div className="divide-y divide-gray-50">
                {stats!.recentStudents.map(s => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                    <span className="text-[11px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                      {s.careerId}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent Batches */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-violet-500" />
            <h2 className="text-base font-semibold text-gray-800">Batches Overview</h2>
          </div>
          {(stats?.recentBatches?.length ?? 0) === 0
            ? <p className="text-gray-400 text-sm">No batches yet</p>
            : <div className="divide-y divide-gray-50">
                {stats!.recentBatches.map(b => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{b.status}</p>
                    </div>
                    <span className="text-sm font-semibold text-violet-600">{b.studentCount} students</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
