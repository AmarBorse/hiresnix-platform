// src/pages/company/JobForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { jobsApi } from '../../api/jobs';
import { toast } from 'sonner';
import { Loader2, Save, X, Plus, ArrowLeft } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  type: 'Full-time' as const,
  location: '',
  salaryMin: '',
  salaryMax: '',
  description: '',
  requiredSkills: [] as string[],
  minCGPA: '0',
  applicationDeadline: '',
  status: 'Pending' as const,
};

export function JobForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    jobsApi.getJob(Number(id)).then(res => {
      const j = res.data;
      setForm({
        title: j.title || '',
        type: j.type || 'Full-time',
        location: j.location || '',
        salaryMin: j.salaryMin?.toString() || '',
        salaryMax: j.salaryMax?.toString() || '',
        description: j.description || '',
        requiredSkills: j.requiredSkills || [],
        minCGPA: j.minCGPA?.toString() || '0',
        applicationDeadline: j.applicationDeadline?.split('T')[0] || '',
        status: j.status || 'Pending',
      });
    }).catch(() => toast.error('Failed to load job')).finally(() => setFetching(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        minCGPA: Number(form.minCGPA),
      };
      if (isEdit) {
        await jobsApi.updateJob(Number(id), payload);
        toast.success('Job updated!');
      } else {
        await jobsApi.createJob(payload);
        toast.success('Job posted! Awaiting admin approval.');
      }
      navigate('/company/jobs');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.requiredSkills.includes(newSkill.trim())) {
      setForm(p => ({ ...p, requiredSkills: [...p.requiredSkills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/company/jobs')} className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{isEdit ? 'Edit Job' : 'Post New Job'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? 'Update your job posting details' : 'Fill in the details to attract the right candidates'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Job Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Job Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 bg-white"
              >
                {['Full-time', 'Part-time', 'Internship', 'Contract'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location *</label>
              <input
                type="text" required
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                placeholder="e.g. Bangalore, Remote"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min Salary (₹) *</label>
              <input
                type="number" required min={0}
                value={form.salaryMin}
                onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                placeholder="300000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Max Salary (₹) *</label>
              <input
                type="number" required min={0}
                value={form.salaryMax}
                onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                placeholder="600000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min CGPA</label>
              <input
                type="number" step="0.01" min={0} max={10}
                value={form.minCGPA}
                onChange={e => setForm(p => ({ ...p, minCGPA: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                placeholder="6.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Application Deadline *</label>
            <input
              type="date" required
              value={form.applicationDeadline}
              onChange={e => setForm(p => ({ ...p, applicationDeadline: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Job Description *</h2>
          <textarea
            required rows={6}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
            placeholder="Describe the role, responsibilities, and requirements..."
          />
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.requiredSkills.map(s => (
              <span key={s} className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-200">
                {s}
                <button type="button" onClick={() => setForm(p => ({ ...p, requiredSkills: p.requiredSkills.filter(sk => sk !== s) }))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" placeholder="Add required skill..."
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
            />
            <button type="button" onClick={addSkill} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit" disabled={loading}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit ? 'Update Job' : 'Post Job'}
          </button>
          <button
            type="button" onClick={() => navigate('/company/jobs')}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
