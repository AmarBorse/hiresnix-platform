// src/pages/institution/InstitutionCertificates.tsx
import React, { useEffect, useState } from 'react';
import { Award, Plus, Download, X, CheckCircle2, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionCertificate, InstitutionStudent, InstituteCourse } from '../../types';

const CERT_TYPES = ['Course Completion', 'Training Completion', 'Skill Assessment'] as const;
type CertType = typeof CERT_TYPES[number];

const TYPE_COLORS: Record<CertType, string> = {
  'Course Completion':   'bg-emerald-100 text-emerald-700',
  'Training Completion': 'bg-blue-100 text-blue-700',
  'Skill Assessment':    'bg-violet-100 text-violet-700',
};

// ── Bulk Issue Modal ──────────────────────────────────────────────
function IssueCertModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [students, setStudents]   = useState<InstitutionStudent[]>([]);
  const [courses, setCourses]     = useState<InstituteCourse[]>([]);
  const [selected, setSelected]   = useState<number[]>([]);
  const [certType, setCertType]   = useState<CertType>('Course Completion');
  const [courseId, setCourseId]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([institutionApi.getStudents({ limit: 200 }), institutionApi.getCourses()])
      .then(([s, c]) => { setStudents(s.data); setCourses(c.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setDataLoading(false));
  }, []);

  // Select All
  const allSelected  = students.length > 0 && selected.length === students.length;
  const someSelected = selected.length > 0 && selected.length < students.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(students.map(s => s.id));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) { toast.error('Select at least one student'); return; }
    setLoading(true);
    let success = 0, failed = 0;
    for (const sid of selected) {
      try {
        await institutionApi.issueCertificate({
          studentId: sid,
          courseId: courseId ? parseInt(courseId) : undefined,
          type: certType,
        });
        success++;
      } catch { failed++; }
    }
    if (success > 0) toast.success(`${success} certificate${success > 1 ? 's' : ''} issued!`);
    if (failed > 0) toast.error(`${failed} failed`);
    onSaved();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Issue Certificates</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Type & Course selectors */}
        <div className="px-5 py-4 border-b space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Type *</label>
            <select value={certType} onChange={e => setCertType(e.target.value as CertType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course (optional)</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">No specific course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Select All bar */}
        <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
          <button onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
            {allSelected
              ? <CheckSquare size={18} className="text-indigo-600" />
              : someSelected
              ? <CheckSquare size={18} className="text-indigo-400" />
              : <Square size={18} className="text-gray-400" />
            }
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-gray-400">
            {students.length} students · {selected.length} selected
          </span>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {dataLoading
            ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            : students.length === 0
            ? <p className="text-center text-gray-400 text-sm py-8">No students found</p>
            : students.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(s.id)}
                  onChange={e => setSelected(prev =>
                    e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                  )}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.careerId} · {s.email}</p>
                </div>
                {s.department && (
                  <span className="text-xs text-gray-400 shrink-0">{s.department}</span>
                )}
              </label>
            ))
          }
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {selected.length > 0 ? `${selected.length} certificate${selected.length > 1 ? 's' : ''} will be issued` : 'Select students to issue certificates'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || selected.length === 0}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
              {loading ? 'Issuing...' : `Issue ${selected.length > 0 ? `(${selected.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function InstitutionCertificates() {
  const [certs, setCerts]   = useState<InstitutionCertificate[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
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
    window.open(institutionApi.downloadCertPdf(cert.certificateId), '_blank');
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
          <Plus size={15} /> Issue Certificates
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
            {loading
              ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : certs.length === 0
              ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No certificates issued yet</td></tr>
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
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button disabled={page*LIMIT>=total} onClick={() => setPage(p=>p+1)}
              className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {modal && <IssueCertModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}
