// src/pages/instStudent/InstStudentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Award, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { useInstStudentStore } from '../../store/useInstStudentStore';
import { toast } from 'sonner';

export function InstStudentDashboard() {
  const { student } = useInstStudentStore();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">Welcome back, {student?.name}! 👋</h1>
        <p className="text-indigo-200 text-sm">{student?.institutionName}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <GraduationCap size={18} />
          <span className="font-mono font-bold tracking-wider text-lg">{student?.careerId}</span>
        </div>
        <p className="text-indigo-300 text-xs mt-2">Your Hiresnix Career ID</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'My Batches',      value: data?.batches?.length ?? 0,      icon: Layers, color: 'bg-violet-500' },
          { label: 'My Courses',      value: data?.courses?.length ?? 0,      icon: BookOpen, color: 'bg-blue-500' },
          { label: 'My Certificates', value: data?.certificates?.length ?? 0, icon: Award, color: 'bg-emerald-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Certificates */}
      {(data?.certificates?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Award size={16} className="text-emerald-500" /> Recent Certificates
          </h2>
          <div className="space-y-2">
            {data.certificates.slice(0,3).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.type}</p>
                  {c.courseName && <p className="text-xs text-gray-400">{c.courseName}</p>}
                </div>
                <span className="text-xs text-gray-400">{new Date(c.issuedAt).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Batches */}
      {(data?.batches?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Layers size={16} className="text-violet-500" /> My Batches
          </h2>
          <div className="space-y-2">
            {data.batches.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.name}</p>
                  {b.trainerName && <p className="text-xs text-gray-400">Trainer: {b.trainerName}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status==='Active' ? 'bg-green-100 text-green-700' : b.status==='Completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
