import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';
import { ProgressBar } from '../../modules/institution/components/InstitutionCards';

interface CourseRow {
  id: number;
  title: string;
  duration: string | null;
  modules: number;
  completionRate: number;
}

const columns: CrudColumn<CourseRow>[] = [
  { key: 'title', label: 'Title' },
  { key: 'duration', label: 'Duration', render: (r) => r.duration || '—' },
  { key: 'modules', label: 'Modules' },
  { key: 'completionRate', label: 'Completion', render: (r) => <ProgressBar value={r.completionRate} /> },
];

const fields: CrudField[] = [
  { key: 'title', label: 'Course title', required: true },
  { key: 'duration', label: 'Duration', placeholder: 'e.g. 24 weeks' },
  { key: 'modules', label: 'Modules', type: 'number' },
  { key: 'completionRate', label: 'Completion rate (%)', type: 'number' },
];

export function InstituteCourses() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<CourseRow>
        title="Course Management"
        addLabel="Add Course"
        api={instituteApi.courses}
        columns={columns}
        fields={fields}
        defaultValues={{ modules: 0, completionRate: 0 }}
        rowLabel={(r) => r.title}
        emptyMessage="No courses yet. Add your first course to get started."
      />
    </div>
  );
}
