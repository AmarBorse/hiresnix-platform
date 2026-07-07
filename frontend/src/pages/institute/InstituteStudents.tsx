import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';
import { ProgressBar } from '../../modules/institution/components/InstitutionCards';

interface StudentRow {
  id: number;
  name: string;
  email: string | null;
  careerId: string;
  batchId: number | null;
  batchName: string | null;
  attendance: number;
  progress: number;
  assessmentScore: number;
  skills: string[];
  internshipEligible: boolean;
}

const columns: CrudColumn<StudentRow>[] = [
  { key: 'name', label: 'Student', render: (r) => (
    <div>
      <p className="font-bold text-slate-950">{r.name}</p>
      <p className="text-xs text-slate-500">{r.careerId}</p>
    </div>
  ) },
  { key: 'batchName', label: 'Batch', render: (r) => r.batchName || '—' },
  { key: 'attendance', label: 'Attendance', render: (r) => <ProgressBar value={r.attendance} /> },
  { key: 'progress', label: 'Progress', render: (r) => <ProgressBar value={r.progress} /> },
  { key: 'internshipEligible', label: 'Eligibility', render: (r) => (
    <Badge className={r.internshipEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
      {r.internshipEligible ? 'Eligible' : 'Not Eligible'}
    </Badge>
  ) },
];

export function InstituteStudents() {
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    instituteApi.batches.list().then((res) => {
      setBatchOptions((res.data || []).map((b: any) => ({ value: String(b.id), label: b.name })));
    });
  }, []);

  const fields: CrudField[] = [
    { key: 'name', label: 'Student name', required: true },
    { key: 'email', label: 'Email', type: 'text', placeholder: 'student@example.com' },
    { key: 'batchId', label: 'Batch', type: 'select', options: batchOptions },
    { key: 'attendance', label: 'Attendance (%)', type: 'number' },
    { key: 'progress', label: 'Progress (%)', type: 'number' },
    { key: 'assessmentScore', label: 'Assessment score (%)', type: 'number' },
    {
      key: 'skills', label: 'Skills (comma separated)', placeholder: 'React, Node.js, SQL',
      parse: (raw) => raw.split(',').map((s) => s.trim()).filter(Boolean),
      format: (value) => (Array.isArray(value) ? value.join(', ') : ''),
    },
    { key: 'internshipEligible', label: 'Internship eligible', type: 'checkbox' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<StudentRow>
        title="Student Management"
        addLabel="Add Student"
        api={instituteApi.students}
        columns={columns}
        fields={fields}
        defaultValues={{ attendance: 0, progress: 0, assessmentScore: 0, internshipEligible: false }}
        rowLabel={(r) => r.name}
        emptyMessage="No students yet. Add your first student to get started."
      />
    </div>
  );
}
