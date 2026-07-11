// src/pages/institution/InstitutionStudents.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, Upload, X, Eye, Download, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionStudent } from '../../types';
import * as XLSX from 'xlsx';
import { StudentModal } from './StudentModal';

export function InstitutionStudents() {
  const [students, setStudents] = useState<InstitutionStudent[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<InstitutionStudent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const LIMIT = 15;

  const load = () => {
    setLoading(true);
    institutionApi.getStudents({ search, page, limit: LIMIT })
      .then(r => { setStudents(r.data); setTotal(r.total); })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, page]);

  const handleDelete = async (s: InstitutionStudent) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    try { await institutionApi.deleteStudent(s.id); toast.success('Student deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        const students = rows.map(r => ({
          name: r['Name'] || r['name'] || '',
          email: r['Email'] || r['email'] || '',
          mobile: r['Mobile'] || r['mobile'] || '',
          department: r['Department'] || r['department'] || '',
          rollNumber: r['Roll Number'] || r['rollNumber'] || '',
          year: r['Year'] || r['year'] || '',
        }));
        const res = await institutionApi.bulkImport(students);
        toast.success(`Imported: ${res.data.created} students. Skipped: ${res.data.skipped}`);
        load();
      } catch { toast.error('Import failed'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportExcel = () => {
    const data = students.map(s => ({
      'Career ID': s.careerId, Name: s.name, Email: s.email,
      Mobile: s.mobile, Department: s.department,
      'Roll No': s.rollNumber, Year: s.year,
      Skills: (s.skills || []).join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
  };

  const downloadCredentials = async () => {
    try {
      const res = await institutionApi.getStudentCredentials();
      const ws = XLSX.utils.json_to_sheet(res.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Credentials');
      XLSX.writeFile(wb, 'student-login-credentials.xlsx');
      toast.success('Credentials sheet downloaded!');
    } catch { toast.error('Failed to download credentials'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Student Management</h1>
          <p className="text-sm" style={{color:"#64748b"}}>{total} students enrolled</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8"}}>
            <Upload size={15} /> Import Excel
          </button>
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
          <button onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8"}}>
            <Download size={15} /> Export
          </button>
          <button onClick={downloadCredentials}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition" style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#34d399"}}>
            <FileDown size={15} /> Download Login Sheet
          </button>
          <button onClick={() => { setSelected(null); setModal('add'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8"}}>
        <span className="mt-0.5">ℹ️</span>
        <span><strong>Login Sheet:</strong> "Download Login Sheet" button se ek Excel file milegi jisme Career ID aur Default Password hoga. Use students ke saath share karo. Students <strong>/inst-login</strong> se login kar sakte hain.</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, mobile, career ID..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none dark-input" />
      </div>

      <div className="rounded-xl overflow-x-auto" style={{background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(20,30,55,0.95))",border:"1px solid rgba(255,255,255,0.1)"}}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide" style={{color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <th className="px-4 py-3">Career ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12" style={{color:"#475569"}}>Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12" style={{color:"#475569"}}>No students found</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="transition" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8"}}>{s.careerId}</span>
                </td>
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3" style={{color:"#64748b"}}>{s.email}</td>
                <td className="px-4 py-3" style={{color:"#64748b"}}>{s.mobile || '—'}</td>
                <td className="px-4 py-3" style={{color:"#64748b"}}>{s.department || '—'}</td>
                <td className="px-4 py-3" style={{color:"#64748b"}}>{s.year ? `Year ${s.year}` : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => { setSelected(s); setModal('view'); }}
                      className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition"><Eye size={15} /></button>
                    <button onClick={() => { setSelected(s); setModal('edit'); }}
                      className="p-1.5 rounded hover:bg-indigo-500/20 text-indigo-400 transition"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(s)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm" style={{color:"#64748b"}}>
          <span>Showing {Math.min((page-1)*LIMIT+1, total)}–{Math.min(page*LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}><ChevronLeft size={16} /></button>
            <button disabled={page*LIMIT>=total} onClick={() => setPage(p=>p+1)}
              className="p-1.5 rounded disabled:opacity-40 hover:bg-white/10 text-gray-400 transition" style={{border:"1px solid rgba(255,255,255,0.1)"}}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal — separate component to prevent re-mount */}
      {(modal === 'add' || modal === 'edit') && (
        <StudentModal
          student={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="rounded-xl w-full max-w-md" style={{background:"linear-gradient(135deg,#0f1729,#0d1b35)",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}>
            <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <h2 className="font-semibold text-white">Student Details</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="" style={{color:"#64748b"}}>Career ID</span>
                <span className="font-mono font-semibold" style={{color:"#818cf8"}}>{selected.careerId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="" style={{color:"#64748b"}}>Default Password</span>
                <span className="font-mono text-xs px-2 py-1 rounded" style={{background:"rgba(255,255,255,0.08)",color:"#e2e8f0"}}>
                  HX@{selected.careerId?.split('-')[2]}
                </span>
              </div>
              {[['Name', selected.name], ['Email', selected.email], ['Mobile', selected.mobile],
                ['Department', selected.department], ['Year', selected.year ? `Year ${selected.year}` : null],
                ['Roll No', selected.rollNumber], ['Gender', selected.gender]
              ].map(([l, v]) => v && (
                <div key={l as string} className="flex items-center justify-between">
                  <span className="" style={{color:"#64748b"}}>{l}</span>
                  <span className="font-medium text-white">{v as string}</span>
                </div>
              ))}
              {(selected.skills || []).length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map(sk => (
                      <span key={sk} className="px-2 py-0.5 rounded text-xs" style={{background:"rgba(99,102,241,0.15)",color:"#818cf8"}}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                <span className="" style={{color:"#64748b"}}>Internship Eligible</span>
                <span className={`font-semibold ${selected.isInternshipEligible ? 'text-green-600' : 'text-gray-400'}`}>
                  {selected.isInternshipEligible ? '✓ Eligible' : 'Not Eligible'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}