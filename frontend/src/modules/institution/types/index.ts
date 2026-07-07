import type { LucideIcon } from 'lucide-react';

export type InstitutionRole = 'super-admin' | 'institute-admin' | 'trainer' | 'student';

export type InstituteStatus = 'pending' | 'approved' | 'rejected';

export type CertificateType =
  | 'Course Completion'
  | 'Training Completion'
  | 'Skill Assessment'
  | 'Merit';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface InstitutionMetric {
  label: string;
  value: string;
  trend: string;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  icon: LucideIcon;
}

export interface InstituteRequest {
  id: string;
  /** Raw numeric primary key from the database, used for approve/reject actions */
  requestId?: number;
  name: string;
  city: string;
  contact: string;
  status: InstituteStatus;
  submittedOn: string;
  students: number;
  adminName?: string;
  phone?: string | null;
  website?: string | null;
  reviewNote?: string | null;
  /** Present only in the API response right after an approval that provisioned a new login. */
  tempPassword?: string | null;
}

export interface StudentRecord {
  id: string;
  name: string;
  careerId: string;
  batch: string;
  course: string;
  attendance: number;
  progress: number;
  assessments: number;
  skills: string[];
  internshipEligible: boolean;
}

export interface TrainerRecord {
  id: string;
  name: string;
  specialization: string;
  activeBatches: number;
  students: number;
  rating: number;
}

export interface CourseRecord {
  id: string;
  title: string;
  duration: string;
  modules: number;
  activeStudents: number;
  completionRate: number;
}

export interface BatchRecord {
  id: string;
  name: string;
  course: string;
  trainer: string;
  schedule: string;
  students: number;
  status: 'Upcoming' | 'Active' | 'Completed';
}

export interface AssessmentRecord {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  submissions: number;
  averageScore: number;
}

export interface CertificateRecord {
  id: string;
  certificateNo: string;
  student: string;
  type: CertificateType;
  course: string;
  issuedOn: string;
  verified: boolean;
}

export interface CareerProfile {
  careerId: string;
  studentName: string;
  skills: string[];
  courses: string[];
  assessments: string[];
  certificates: string[];
  achievements: string[];
}

export interface InstitutionWorkspace {
  metrics: InstitutionMetric[];
  institutes: InstituteRequest[];
  students: StudentRecord[];
  trainers: TrainerRecord[];
  courses: CourseRecord[];
  batches: BatchRecord[];
  assessments: AssessmentRecord[];
  certificates: CertificateRecord[];
  careerProfile: CareerProfile;
}
