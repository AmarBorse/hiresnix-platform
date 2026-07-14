// src/types/index.ts

export type Role = 'student' | 'company' | 'admin' | 'institution' | 'inst_student';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  isApproved: boolean;
  emailVerified?: boolean;
}

export interface StudentProfile {
  id: number;
  userId: number;
  cgpa: number | null;
  domain: string | null;
  skills: string[];
  department: string | null;
  year: number | null;
  resumeUrl: string | null;
  resumeFilename: string | null;
  projects: string[];
  placementStatus: 'Not Placed' | 'Placed';
  placedCompany: string | null;
  placedRole: string | null;
  placedSalary: number | null;
}

export interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  employeeCount: number | null;
  logo: string | null;
  isVerified: boolean;
  contactName: string | null;
  contactPhone: string | null;
}

export interface Job {
  id: number;
  title: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  location: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  requiredSkills: string[];
  minCGPA: number;
  applicationDeadline: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Closed';
  applicationCount: number;
  company?: CompanyProfile;
  createdAt: string;
}

export interface Application {
  id: number;
  status: 'Applied' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected' | 'Withdrawn';
  coverLetter: string | null;
  resumeUrl: string | null;
  interviewAt: string | null;
  interviewMode: string | null;
  meetingLink: string | null;
  createdAt: string;
  job?: Job;
  student?: StudentProfile & { user?: AuthUser };
}

export interface Internship {
  id: number;
  title: string;
  description: string;
  domain: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  technologies: string[];
  tasks: InternshipTask[];
  status: 'Active' | 'Inactive';
  maxEnrollments: number;
  enrollmentCount: number;
  startDate: string | null;
  endDate: string | null;
  relatedJobDomains: string[];
  enrollment?: Enrollment | null;
  createdAt: string;
}

export interface InternshipTask {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  dueWeek: number;
}

export interface Enrollment {
  id: number;
  studentId: number;
  internshipId: number;
  progress: number;
  completedTasks: string[];
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped';
  completedAt: string | null;
  taskLogs: TaskLog[];
  internship?: Internship;
}

export interface TaskLog {
  id: string;
  title: string;
  description: string;
  githubUrl: string;
  taskId?: string;
  submittedAt: string;
  status: 'Pending' | 'Reviewed';
  grade: string | null;
}

export interface Resource {
  id: number;
  title: string;
  type: 'Video' | 'Note' | 'Article' | 'PDF';
  link: string;
  domain: string;
  category: string;
  badge: string | null;
  createdAt: string;
}

export interface Certificate {
  id: number;
  certificateId: string;
  studentName: string;
  internshipTitle: string;
  domain: string;
  issuedAt: string;
  isValid: boolean;
}

export interface AnalyticsOverview {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  totalInternships: number;
  placedStudents: number;
  activeInternships: number;
  pendingJobs: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
}

// ── Institution Module Types (NEW) ────────────────────────────────

export interface InstitutionProfile {
  id: number;
  userId: number;
  institutionName: string;
  type: string | null;
  affiliatedTo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  website: string | null;
  phone: string | null;
  logo: string | null;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isVerified: boolean;
  isPartner: boolean;
  rejectionReason: string | null;
  createdAt: string;
}

export interface InstitutionStudent {
  id: number;
  institutionId: number;
  careerId: string;
  name: string;
  email: string;
  mobile: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  department: string | null;
  rollNumber: string | null;
  year: number | null;
  skills: string[];
  documents: any[];
  photo: string | null;
  isInternshipEligible: boolean;
  batches?: InstituteBatch[];
  courses?: InstituteCourse[];
  createdAt: string;
}

export interface InstituteBatch {
  id: number;
  institutionId: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  trainerName: string | null;
  trainerEmail: string | null;
  status: 'Active' | 'Completed' | 'Upcoming';
  studentCount?: number;
  createdAt: string;
}

export interface InstituteCourse {
  id: number;
  institutionId: number;
  name: string;
  description: string | null;
  duration: string | null;
  durationUnit: 'Days' | 'Weeks' | 'Months';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface InstitutionCertificate {
  id: number;
  certificateId: string;
  institutionId: number;
  studentId: number;
  courseId: number | null;
  type: 'Course Completion' | 'Training Completion' | 'Skill Assessment';
  studentName: string;
  courseName: string | null;
  institutionName: string;
  issuedAt: string;
  isValid: boolean;
  emailSent: boolean;
  student?: { name: string; email: string; careerId: string };
  course?: { name: string };
}