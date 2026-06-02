// src/types/index.ts

export type Role = 'student' | 'company' | 'admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  isApproved: boolean;
}

export interface StudentProfile {
  id: number;
  userId: number;
  cgpa: number | null;
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
