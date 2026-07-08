// src/pages/institution/InstitutionStudents.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, Upload, X, Eye, Download, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionStudent } from '../../types';
import * as XLSX from 'xlsx';

const EMPTY_FORM = { name: '', email: '', mobile: '', dob: '', gender: '', department: '', rollNumber: '', year: '', skills: '', address: '' };

function StudentModal({ student, onClose, onSaved }: { student?: InstitutionStudent | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(student ? {
    name: student.name, email: student.email, mobile: student.mobile || '', dob: student.dob || '',
    gender: student.gender || '', department: student.department || '', rollNumber: student.rollNumber || '',
    year: student.year?.toString() || '', skills: (student.skills || []).join(', '), address: student.address || '',
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, year: form.year ? parseInt(form.year) : undefined, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
      if (student) await institutionApi.updateStudent(student.id, payload);
      else await institutionApi.createStudent(payload);
      toast.success(student ? 'Student updated' : 'Student added');
      onSaved();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const Input = ({ label, k, type = 'text' }: { label: string; k: string; type?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={(form as any)[k]} onChange={f(k)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{student ? 'Edit Student' : 'Add Student'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-3">
          <Input label="Full Name *" k="name" />
          <Input label="Email *" k="email" type="email" />
          <Input label="Mobile" k="mobile" />
          <Input label="Date of Birth" k="dob" type="date" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select value={form.gender} onChange={f('gender')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <Input label="Department" k="department" />
          <Input label="Roll Number" k="rollNumber" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select value={form.year} onChange={f('year')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Select</option>
              {[1,2,3,4,5].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma separated)</label>
            <input value={form.skills} onChange={f('skills')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. Python, React, SQL" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <textarea value={form.address} onChange={f('address')} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (student ? 'Update' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InstitutionStudents() {
  const [students, setStudents] = useState<InstitutionStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
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
    const data = students.map(s => ({ 'Career ID': s.careerId, Name: s.name, Email: s.email, Mobile: s.mobile, Department: s.department, 'Roll No': s.rollNumber, Year: s.year, Skills: (s.skills||[]).join(', ') }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
  };

  // Download credentials sheet (Career ID + Default Password) for sharing
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
          <h1 className="text-xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-500">{total} students enrolled</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Upload size={15} /> Import Excel
          </button>
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
          <button onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={15} /> Export
          </button>
          <button onClick={downloadCredentials}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100">
            <FileDown size={15} /> Download Login Sheet
          </button>
          <button onClick={() => { setSelected(null); setModal('add'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-700 flex items-start gap-2">
        <span className="mt-0.5">ℹ️</span>
        <span><strong>Login Sheet:</strong> "Download Login Sheet" button se ek Excel file milegi jisme Career ID aur Default Password hoga. Use students ke saath share karo. Students <strong>/inst-login</strong> se login kar sakte hain.</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, mobile, career ID..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
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
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{s.careerId}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.email}</td>
                <td className="px-4 py-3 text-gray-500">{s.mobile || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{s.department || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{s.year ? `Year ${s.year}` : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => { setSelected(s); setModal('view'); }}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="View"><Eye size={15} /></button>
                    <button onClick={() => { setSelected(s); setModal('edit'); }}
                      className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500" title="Edit"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(s)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 size={15} /></button>
                  </div>
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

      {(modal === 'add' || modal === 'edit') && (
        <StudentModal student={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}

      {modal === 'view' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Student Details</h2>
              <button onClick={() => setModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Career ID</span>
                <span className="font-mono font-semibold text-indigo-600">{selected.careerId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Default Password</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">HX@{selected.careerId?.split('-')[2]}</span>
              </div>
              {[['Name', selected.name], ['Email', selected.email], ['Mobile', selected.mobile], ['Department', selected.department], ['Year', selected.year ? `Year ${selected.year}` : null], ['Roll No', selected.rollNumber], ['Gender', selected.gender]].map(([l, v]) => v && (
                <div key={l as string} className="flex items-center justify-between">
                  <span className="text-gray-500">{l}</span>
                  <span className="text-gray-800 font-medium">{v as string}</span>
                </div>
              ))}
              {(selected.skills||[]).length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map(sk => <span key={sk} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{sk}</span>)}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-500">Internship Eligible</span>
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
