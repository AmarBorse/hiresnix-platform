// src/pages/instStudent/InstStudentCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle2, Star } from 'lucide-react';
import { instStudentApi } from '../../api/instStudent';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  'Course Completion':   'bg-emerald-100 text-emerald-700',
  'Training Completion': 'bg-blue-100 text-blue-700',
  'Skill Assessment':    'bg-violet-100 text-violet-700',
  'AI Academy':          'bg-amber-100 text-amber-700',
};

export function InstStudentCertificates() {
  const [certs, setCerts]           = useState<any[]>([]);
  const [academyCerts, setAcademyCerts] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    // Load institution certificates from backend
    instStudentApi.getCertificates()
      .then(r => setCerts(r.data || []))
      .catch(() => {});

    // Load AI Academy certs from DB
    instStudentApi.getAcademyProgress()
      .then(r => {
        const COURSE_NAMES: Record<string,string> = {
          python:'Python Programming', javascript:'JavaScript', java:'Java',
          cpp:'C++', dsa:'Data Structures & Algorithms', sql:'SQL & Databases',
          webdev:'Full Stack Web Development', nodejs:'Node.js & Express',
          react:'React', c:'C Programming', git:'Git & GitHub',
          docker:'Docker & DevOps', cybersecurity:'Cybersecurity',
          flutter:'Flutter & Dart', datascience:'Data Science', ml:'Machine Learning',
        };
        const completed = (r.data || []).filter((p: any) => p.claimed_cert || p.claimedCert);
        setAcademyCerts(completed.map((p: any) => ({
          ...p,
          course_id: p.course_id || p.courseId,
          courseName: COURSE_NAMES[p.course_id || p.courseId] || p.course_id,
        })));
      })
      .catch(() => {});

    setLoading(false);
  }, []);

  const downloadPdf = (certId: string) => {
    window.open(instStudentApi.downloadCertPdf(certId), '_blank');
  };

  const downloadAcademyCert = (courseId: string, courseName: string) => {
    instStudentApi.downloadAcademyCertPdf(courseId, courseName);
  };

  const total = certs.length + academyCerts.length;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My Certificates</h1>
        <p className="text-sm text-gray-500">{total} certificates earned</p>
      </div>

      {/* Institution Certificates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Institution Certificates</h2>
          <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full">{certs.length}</span>
        </div>

        {certs.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <Award size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No institution certificates yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map(c => (
              <div key={c.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-indigo-700/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-900/40 rounded-xl flex items-center justify-center">
                    <Award size={20} className="text-indigo-400" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-800 text-gray-400'}`}>
                    {c.type}
                  </span>
                </div>
                <p className="font-semibold text-white">{c.institutionName}</p>
                {c.courseName && <p className="text-sm text-gray-400 mt-0.5">{c.courseName}</p>}
                <p className="text-xs text-gray-600 mt-2">Issued: {new Date(c.issuedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                    <CheckCircle2 size={13} /> Valid Certificate
                  </div>
                  <button onClick={() => downloadPdf(c.certificateId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <Download size={13} /> Download PDF
                  </button>
                </div>
                <p className="text-[10px] font-mono text-gray-700 mt-2">{c.certificateId}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Academy Certificates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white">AI Academy Certificates</h2>
          <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full">{academyCerts.length}</span>
        </div>

        {academyCerts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <Star size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Complete AI Academy courses to earn certificates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academyCerts.map((p: any) => (
              <div key={p.courseId} className="bg-gray-900 rounded-xl p-5 border border-amber-800/30 hover:border-amber-700/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Star size={20} className="text-amber-400" />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                    AI Academy
                  </span>
                </div>
                <p className="font-semibold text-white">Hiresnix AI Academy</p>
                <p className="text-sm text-gray-400 mt-0.5">{p.courseName || p.course_id || p.courseId}</p>
                <p className="text-xs text-amber-500 mt-1">⚡ {p.xp || 0} XP earned</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                    <CheckCircle2 size={13} /> Course Completed
                  </div>
                  <button onClick={() => downloadAcademyCert(p.course_id || p.courseId, p.courseName || p.course_id || p.courseId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {total === 0 && (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
          <Award size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No certificates yet</p>
          <p className="text-gray-600 text-sm mt-1">Complete courses in institution or AI Academy to earn certificates</p>
        </div>
      )}
    </div>
  );
}