import {
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { InstitutionWorkspace } from '../types';

export const institutionWorkspace: InstitutionWorkspace = {
  metrics: [
    { label: 'Approved Institutes', value: '42', trend: '+8 this month', tone: 'emerald', icon: Building2 },
    { label: 'Active Students', value: '12,840', trend: '86% active', tone: 'blue', icon: Users },
    { label: 'Certificates Issued', value: '3,214', trend: '98.7% verified', tone: 'violet', icon: Award },
    { label: 'Avg. Attendance', value: '91%', trend: '+4.5% vs last batch', tone: 'amber', icon: ClipboardCheck },
  ],
  institutes: [
    { id: 'INS-1001', name: 'Nova Tech Academy', city: 'Hyderabad', contact: 'admin@novatech.edu', status: 'pending', submittedOn: '2026-07-01', students: 0 },
    { id: 'INS-0914', name: 'SkillForge Institute', city: 'Bengaluru', contact: 'ops@skillforge.edu', status: 'approved', submittedOn: '2026-06-18', students: 486 },
    { id: 'INS-0872', name: 'Metro Data School', city: 'Pune', contact: 'hello@metrodata.edu', status: 'rejected', submittedOn: '2026-06-02', students: 0 },
    { id: 'INS-0820', name: 'BrightPath Learning', city: 'Chennai', contact: 'director@brightpath.edu', status: 'approved', submittedOn: '2026-05-21', students: 312 },
  ],
  students: [
    { id: 'STU-001', name: 'Ananya Rao', careerId: 'HX-2026-000001', batch: 'FS-26-A', course: 'Full Stack Development', attendance: 94, progress: 78, assessments: 88, skills: ['React', 'Node.js', 'SQL'], internshipEligible: true },
    { id: 'STU-002', name: 'Rohan Mehta', careerId: 'HX-2026-000002', batch: 'DA-26-B', course: 'Data Analytics', attendance: 87, progress: 66, assessments: 74, skills: ['Python', 'Power BI', 'Statistics'], internshipEligible: false },
    { id: 'STU-003', name: 'Sara Khan', careerId: 'HX-2026-000003', batch: 'UI-26-A', course: 'UI/UX Design', attendance: 96, progress: 84, assessments: 91, skills: ['Figma', 'Research', 'Prototyping'], internshipEligible: true },
    { id: 'STU-004', name: 'Vikram Iyer', careerId: 'HX-2026-000004', batch: 'FS-26-A', course: 'Full Stack Development', attendance: 79, progress: 52, assessments: 69, skills: ['JavaScript', 'MongoDB'], internshipEligible: false },
  ],
  trainers: [
    { id: 'TR-101', name: 'Meera Nair', specialization: 'MERN Stack', activeBatches: 3, students: 124, rating: 4.8 },
    { id: 'TR-102', name: 'Arjun Pillai', specialization: 'Data Analytics', activeBatches: 2, students: 86, rating: 4.7 },
    { id: 'TR-103', name: 'Nisha Verma', specialization: 'Product Design', activeBatches: 2, students: 64, rating: 4.9 },
  ],
  courses: [
    { id: 'CRS-501', title: 'Full Stack Development', duration: '24 weeks', modules: 12, activeStudents: 218, completionRate: 74 },
    { id: 'CRS-502', title: 'Data Analytics', duration: '18 weeks', modules: 9, activeStudents: 176, completionRate: 69 },
    { id: 'CRS-503', title: 'UI/UX Design', duration: '16 weeks', modules: 8, activeStudents: 94, completionRate: 81 },
  ],
  batches: [
    { id: 'BAT-701', name: 'FS-26-A', course: 'Full Stack Development', trainer: 'Meera Nair', schedule: 'Mon-Wed-Fri', students: 48, status: 'Active' },
    { id: 'BAT-702', name: 'DA-26-B', course: 'Data Analytics', trainer: 'Arjun Pillai', schedule: 'Tue-Thu-Sat', students: 42, status: 'Active' },
    { id: 'BAT-703', name: 'UI-26-A', course: 'UI/UX Design', trainer: 'Nisha Verma', schedule: 'Weekend', students: 36, status: 'Upcoming' },
  ],
  assessments: [
    { id: 'ASM-301', title: 'React Capstone Review', course: 'Full Stack Development', dueDate: '2026-07-14', submissions: 41, averageScore: 82 },
    { id: 'ASM-302', title: 'Dashboard Case Study', course: 'Data Analytics', dueDate: '2026-07-12', submissions: 37, averageScore: 78 },
    { id: 'ASM-303', title: 'Portfolio Critique', course: 'UI/UX Design', dueDate: '2026-07-18', submissions: 29, averageScore: 86 },
  ],
  certificates: [
    { id: 'CERT-001', certificateNo: 'HX-CERT-2026-0001', student: 'Ananya Rao', type: 'Course Completion', course: 'Full Stack Development', issuedOn: '2026-06-28', verified: true },
    { id: 'CERT-002', certificateNo: 'HX-CERT-2026-0002', student: 'Sara Khan', type: 'Merit', course: 'UI/UX Design', issuedOn: '2026-06-30', verified: true },
    { id: 'CERT-003', certificateNo: 'HX-CERT-2026-0003', student: 'Rohan Mehta', type: 'Skill Assessment', course: 'Data Analytics', issuedOn: '2026-07-02', verified: false },
  ],
  careerProfile: {
    careerId: 'HX-2026-000001',
    studentName: 'Ananya Rao',
    skills: ['React', 'Node.js', 'SQL', 'REST APIs'],
    courses: ['Full Stack Development', 'Git Collaboration'],
    assessments: ['React Capstone Review', 'API Integration Practical'],
    certificates: ['Course Completion Certificate', 'Skill Assessment Certificate'],
    achievements: ['Top 5% attendance', 'Capstone distinction'],
  },
};

export const institutionCapabilityMap = [
  { icon: ShieldCheck, label: 'Role based workspaces', text: 'Super Admin, Institute Admin, Trainer and Student views are kept in one module boundary.' },
  { icon: GraduationCap, label: 'Career ID registry', text: 'Every learner receives a Hiresnix Career ID such as HX-2026-000001.' },
  { icon: FileText, label: 'Certificate verification', text: 'Certificate numbers, QR verification, PDF download and print flows are represented.' },
  { icon: CheckCircle2, label: 'Internship boundary', text: 'Only eligibility status is exposed. No internship workflow is built here.' },
  { icon: BookOpen, label: 'Academic operations', text: 'Courses, batches, attendance, assignments and assessments are modeled separately.' },
  { icon: TrendingUp, label: 'Analytics ready', text: 'Dashboards and reports consume service-shaped data for future API replacement.' },
];
