import { useEffect, useState } from 'react';
import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';

interface AssignmentRow {
  id: number;
  title: string;
  courseId: number | null;
  courseName: string | null;
  description: string | null;
  dueDate: string | null;
  submissions: number;
}

const columns: CrudColumn<AssignmentRow>[] = [
  { key: 'title', label: 'Title' },
  { key: 'courseName', label: 'Course', render: (r) => r.courseName || '—' },
  { key: 'dueDate', label: 'Due Date', render: (r) => r.dueDate || '—' },
  { key: 'submissions', label: 'Submissions' },
];

export function InstituteAssignments() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    instituteApi.courses.list().then((res) => {
      setCourseOptions((res.data || []).map((c: any) => ({ value: String(c.id), label: c.title })));
    });
  }, []);

  const fields: CrudField[] = [
    { key: 'title', label: 'Assignment title', required: true },
    { key: 'courseId', label: 'Course', type: 'select', options: courseOptions },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'dueDate', label: 'Due date', type: 'date' },
    { key: 'submissions', label: 'Submissions', type: 'number' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<AssignmentRow>
        title="Assignments"
        addLabel="Add Assignment"
        api={instituteApi.assignments}
        columns={columns}
        fields={fields}
        defaultValues={{ submissions: 0 }}
        rowLabel={(r) => r.title}
        emptyMessage="No assignments yet. Add your first assignment to get started."
      />
    </div>
  );
}
