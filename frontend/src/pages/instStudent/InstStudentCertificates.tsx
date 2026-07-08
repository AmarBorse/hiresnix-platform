// src/pages/instStudent/InstStudentCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle2 } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  'Course Completion':   'bg-emerald-100 text-emerald-700',
  'Training Completion': 'bg-blue-100 text-blue-700',
  'Skill Assessment':    'bg-violet-100 text-violet-700',
};

export function InstStudentCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instStudentApi.getCertificates()
      .then(r => setCerts(r.data))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = (certId: string) => {
    window.open(instStudentApi.downloadCertPdf(certId), '_blank');
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-sm text-gray-500">{certs.length} certificates earned</p>
      </div>

      {certs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Award size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No certificates yet</p>
          <p className="text-gray-300 text-sm mt-1">Complete courses to earn certificates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Award size={20} className="text-indigo-600" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                  {c.type}
                </span>
              </div>
              <p className="font-semibold text-gray-800">{c.institutionName}</p>
              {c.courseName && <p className="text-sm text-gray-500 mt-0.5">{c.courseName}</p>}
              <p className="text-xs text-gray-400 mt-2">Issued: {new Date(c.issuedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                  <CheckCircle2 size={13} /> Valid Certificate
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(c.certificateId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>
              <p className="text-[10px] font-mono text-gray-300 mt-2">{c.certificateId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
