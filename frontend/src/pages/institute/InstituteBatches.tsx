import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';

interface BatchRow {
  id: number;
  name: string;
  courseId: number | null;
  courseName: string | null;
  trainerName: string | null;
  schedule: string | null;
  status: 'upcoming' | 'active' | 'completed';
}

const statusTone: Record<BatchRow['status'], string> = {
  upcoming: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
};

const columns: CrudColumn<BatchRow>[] = [
  { key: 'name', label: 'Batch' },
  { key: 'courseName', label: 'Course', render: (r) => r.courseName || '—' },
  { key: 'trainerName', label: 'Trainer', render: (r) => r.trainerName || '—' },
  { key: 'schedule', label: 'Schedule', render: (r) => r.schedule || '—' },
  { key: 'status', label: 'Status', render: (r) => <Badge className={statusTone[r.status]}>{r.status}</Badge> },
];

export function InstituteBatches() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    instituteApi.courses.list().then((res) => {
      setCourseOptions((res.data || []).map((c: any) => ({ value: String(c.id), label: c.title })));
    });
  }, []);

  const fields: CrudField[] = [
    { key: 'name', label: 'Batch name', required: true, placeholder: 'e.g. FS-26-A' },
    { key: 'courseId', label: 'Course', type: 'select', options: courseOptions },
    { key: 'trainerName', label: 'Trainer', placeholder: 'e.g. Meera Nair' },
    { key: 'schedule', label: 'Schedule', placeholder: 'e.g. Mon-Wed-Fri' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
    ] },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<BatchRow>
        title="Batch Management"
        addLabel="Add Batch"
        api={instituteApi.batches}
        columns={columns}
        fields={fields}
        defaultValues={{ status: 'upcoming' }}
        rowLabel={(r) => r.name}
        emptyMessage="No batches yet. Add your first batch to get started."
      />
    </div>
  );
}
