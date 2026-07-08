// src/pages/institution/InstitutionCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Plus, Download, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionCertificate, InstitutionStudent, InstituteCourse } from '../../types';

const CERT_TYPES = ['Course Completion', 'Training Completion', 'Skill Assessment'] as const;
type CertType = typeof CERT_TYPES[number];

const TYPE_COLORS: Record<CertType, string> = {
  'Course Completion':    'bg-emerald-100 text-emerald-700',
  'Training Completion':  'bg-blue-100 text-blue-700',
  'Skill Assessment':     'bg-violet-100 text-violet-700',
};

function IssueCertModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents] = useState<InstitutionStudent[]>([]);
  const [courses, setCourses] = useState<InstituteCourse[]>([]);
  const [form, setForm] = useState({ studentId: '', courseId: '', type: 'Course Completion' as CertType });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([institutionApi.getStudents({ limit: 200 }), institutionApi.getCourses()])
      .then(([s, c]) => { setStudents(s.data); setCourses(c.data); })
      .catch(() => toast.error('Failed to load data'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.type) { toast.error('Select student and certificate type'); return; }
    setLoading(true);
    try {
      await institutionApi.issueCertificate({ studentId: parseInt(form.studentId), courseId: form.courseId ? parseInt(form.courseId) : undefined, type: form.type });
      toast.success('Certificate issued successfully!'); onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to issue certificate'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Issue Certificate</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student *</label>
            <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Select student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.careerId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type *</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CertType }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course (optional)</label>
            <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">No specific course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InstitutionCertificates() {
  const [certs, setCerts] = useState<InstitutionCertificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const LIMIT = 15;

  const load = () => {
    setLoading(true);
    institutionApi.getCertificates({ page, limit: LIMIT })
      .then(r => { setCerts(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page]);

  const downloadPdf = (cert: InstitutionCertificate) => {
    const url = institutionApi.downloadCertPdf(cert.certificateId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-sm text-gray-500">{total} certificates issued</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={15} /> Issue Certificate
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-4 py-3">Certificate ID</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Career ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
            : certs.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No certificates issued yet</td></tr>
            : certs.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c.certificateId}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.studentName}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500">{c.student?.careerId || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type as CertType] || 'bg-gray-100 text-gray-600'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.courseName || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.issuedAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  {c.isValid
                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={13} /> Valid</span>
                    : <span className="text-red-500 text-xs">Revoked</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => downloadPdf(c)}
                    className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Download PDF">
                    <Download size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {Math.min((page-1)*LIMIT+1, total)}–{Math.min(page*LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button disabled={page*LIMIT>=total} onClick={() => setPage(p=>p+1)} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {modal && <IssueCertModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}
