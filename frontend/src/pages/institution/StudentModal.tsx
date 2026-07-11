// src/pages/institution/StudentModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { institutionApi } from '../../api/institution';
import { InstitutionStudent } from '../../types';

const EMPTY = { name: '', email: '', mobile: '', dob: '', gender: '', department: '', rollNumber: '', year: '', skills: '', address: '' };

interface Props {
  student?: InstitutionStudent | null;
  onClose: () => void;
  onSaved: () => void;
}

export function StudentModal({ student, onClose, onSaved }: Props) {
  const [form, setForm] = useState(student ? {
    name: student.name, email: student.email, mobile: student.mobile || '',
    dob: student.dob || '', gender: student.gender || '',
    department: student.department || '', rollNumber: student.rollNumber || '',
    year: student.year?.toString() || '', skills: (student.skills || []).join(', '),
    address: student.address || '',
  } : { ...EMPTY });
  const [loading, setLoading] = useState(false);

  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        year: form.year ? parseInt(form.year) : undefined,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (student) await institutionApi.updateStudent(student.id, payload);
      else await institutionApi.createStudent(payload);
      toast.success(student ? 'Student updated' : 'Student added');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-white">{student ? 'Edit Student' : 'Add Student'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Full Name *</label>
            <input value={form.name} onChange={handleChange('name')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Email *</label>
            <input type="email" value={form.email} onChange={handleChange('email')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Mobile */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Mobile</label>
            <input value={form.mobile} onChange={handleChange('mobile')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* DOB */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Date of Birth</label>
            <input type="date" value={form.dob} onChange={handleChange('dob')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Gender */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Gender</label>
            <select value={form.gender} onChange={handleChange('gender')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          {/* Department */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Department</label>
            <input value={form.department} onChange={handleChange('department')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Roll Number */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Roll Number</label>
            <input value={form.rollNumber} onChange={handleChange('rollNumber')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Year */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Year</label>
            <select value={form.year} onChange={handleChange('year')}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input">
              <option value="">Select</option>
              {[1,2,3,4,5].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          {/* Skills */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Skills (comma separated)</label>
            <input value={form.skills} onChange={handleChange('skills')} placeholder="e.g. Python, React, SQL"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Address */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{color:"#64748b"}}>Address</label>
            <textarea value={form.address} onChange={handleChange('address')} rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none dark-input" />
          </div>
          {/* Buttons */}
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
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