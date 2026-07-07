import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CrudSection, type CrudColumn, type CrudField } from '../../components/institute/CrudSection';
import { instituteApi } from '../../api/instituteWorkspace';

interface CertificateRow {
  id: number;
  certificateNo: string;
  studentId: number;
  studentName: string | null;
  type: string;
  course: string | null;
  issuedOn: string;
  verified: boolean;
}

const columns: CrudColumn<CertificateRow>[] = [
  { key: 'certificateNo', label: 'Certificate No' },
  { key: 'studentName', label: 'Student', render: (r) => r.studentName || '—' },
  { key: 'type', label: 'Type' },
  { key: 'course', label: 'Course', render: (r) => r.course || '—' },
  { key: 'issuedOn', label: 'Issued On' },
  { key: 'verified', label: 'Verified', render: (r) => (
    <Badge className={r.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
      {r.verified ? 'Verified' : 'Unverified'}
    </Badge>
  ) },
];

const typeOptions = [
  { value: 'Course Completion', label: 'Course Completion' },
  { value: 'Training Completion', label: 'Training Completion' },
  { value: 'Skill Assessment', label: 'Skill Assessment' },
  { value: 'Merit', label: 'Merit' },
];

export function InstituteCertificates() {
  const [studentOptions, setStudentOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    instituteApi.students.list().then((res) => {
      setStudentOptions((res.data || []).map((s: any) => ({ value: String(s.id), label: `${s.name} (${s.careerId})` })));
    });
  }, []);

  const fields: CrudField[] = [
    { key: 'studentId', label: 'Student', type: 'select', options: studentOptions, required: true },
    { key: 'type', label: 'Certificate type', type: 'select', options: typeOptions },
    { key: 'course', label: 'Course', placeholder: 'e.g. Full Stack Development' },
    { key: 'verified', label: 'Verified', type: 'checkbox' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CrudSection<CertificateRow>
        title="Certificate Management"
        addLabel="Issue Certificate"
        api={instituteApi.certificates}
        columns={columns}
        fields={fields}
        defaultValues={{ type: 'Course Completion', verified: true }}
        rowLabel={(r) => r.certificateNo}
        emptyMessage="No certificates issued yet."
      />
    </div>
  );
}
