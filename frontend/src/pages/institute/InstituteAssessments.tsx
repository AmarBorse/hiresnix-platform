import { useEffect, useState } from 'react';
import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';

interface AssessmentRow {
  id: number;
  title: string;
  courseId: number | null;
  courseName: string | null;
  dueDate: string | null;
  submissions: number;
  averageScore: number;
}

const columns: CrudColumn<AssessmentRow>[] = [
  { key: 'title', label: 'Title' },
  { key: 'courseName', label: 'Course', render: (r) => r.courseName || '—' },
  { key: 'dueDate', label: 'Due Date', render: (r) => r.dueDate || '—' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'averageScore', label: 'Avg Score (%)' },
];

export function InstituteAssessments() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    instituteApi.courses.list().then((res) => {
      setCourseOptions((res.data || []).map((c: any) => ({ value: String(c.id), label: c.title })));
    });
  }, []);

  const fields: CrudField[] = [
    { key: 'title', label: 'Assessment title', required: true },
    { key: 'courseId', label: 'Course', type: 'select', options: courseOptions },
    { key: 'dueDate', label: 'Due date', type: 'date' },
    { key: 'submissions', label: 'Submissions', type: 'number' },
    { key: 'averageScore', label: 'Average score (%)', type: 'number' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<AssessmentRow>
        title="Assessments"
        addLabel="Add Assessment"
        api={instituteApi.assessments}
        columns={columns}
        fields={fields}
        defaultValues={{ submissions: 0, averageScore: 0 }}
        rowLabel={(r) => r.title}
        emptyMessage="No assessments yet. Add your first assessment to get started."
      />
    </div>
  );
}
