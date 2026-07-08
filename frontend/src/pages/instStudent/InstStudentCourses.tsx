// src/pages/instStudent/InstStudentCourses.tsx
import React, { useEffect, useState } from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

export function InstStudentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getDashboard()
      .then(r => setCourses(r.data.courses || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Courses</h1>
        <p className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Not enrolled in any course yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(c => {
            const enrollment = c.students?.[0]?.CourseStudent || c.CourseStudent;
            const status = enrollment?.status || 'Enrolled';
            return (
              <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === 'Completed' ? 'bg-emerald-100 text-emerald-700'
                    : status === 'Dropped' ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-700'
                  }`}>{status}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{c.name}</h3>
                {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                {c.duration && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                    <Clock size={12} /> {c.duration} {c.durationUnit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
