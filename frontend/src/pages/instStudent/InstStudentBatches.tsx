// src/pages/instStudent/InstStudentBatches.tsx
import React, { useEffect, useState } from 'react';
import { Layers, Calendar, User } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-gray-100 text-gray-600',
  Upcoming: 'bg-blue-100 text-blue-700',
};

export function InstStudentBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getDashboard()
      .then(r => setBatches(r.data.batches || []))
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Batch</h1>
        <p className="text-sm text-gray-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''} enrolled</p>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Layers size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Not assigned to any batch yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map(b => (
            <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Layers size={20} className="text-violet-600" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">{b.name}</h3>
              {b.description && <p className="text-sm text-gray-500 mt-1">{b.description}</p>}
              <div className="mt-3 space-y-1.5">
                {b.trainerName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={12} /> Trainer: {b.trainerName}
                  </div>
                )}
                {b.startDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} /> {b.startDate} → {b.endDate || 'Ongoing'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
