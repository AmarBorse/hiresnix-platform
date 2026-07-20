import React from 'react';
import { GlobalAnimations } from './components/GlobalAnimations';
// src/App.tsx — Lazy loaded for performance
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useInstStudentStore } from './store/useInstStudentStore';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Role } from './types';

// ── Layouts (small, load eagerly) ────────────────────────────────
import { StudentLayout }     from './components/layout/StudentLayout';
import { CompanyLayout }     from './components/layout/CompanyLayout';
import { AdminLayout }       from './components/layout/AdminLayout';
import { InstitutionLayout } from './components/layout/InstitutionLayout';
import { InstStudentLayout } from './components/layout/InstStudentLayout';

// ── Auth pages (load eagerly — needed immediately) ────────────────
import { LandingPage }      from './pages/LandingPage';
import { AuthPage }         from './pages/auth/AuthPage';
import { InstStudentLogin } from './pages/instStudent/InstStudentLogin';

// ── Lazy load everything else ─────────────────────────────────────
const InstStudentDashboard    = lazy(() => import('./pages/instStudent/InstStudentDashboard').then(m => ({ default: m.InstStudentDashboard })));
const InstStudentProfile      = lazy(() => import('./pages/instStudent/InstStudentProfile').then(m => ({ default: m.InstStudentProfile })));
const InstStudentBatches      = lazy(() => import('./pages/instStudent/InstStudentBatches').then(m => ({ default: m.InstStudentBatches })));
const InstStudentCourses      = lazy(() => import('./pages/instStudent/InstStudentCourses').then(m => ({ default: m.InstStudentCourses })));
const InstStudentCertificates = lazy(() => import('./pages/instStudent/InstStudentCertificates').then(m => ({ default: m.InstStudentCertificates })));
const InstStudentInternship   = lazy(() => import('./pages/instStudent/InstStudentInternship').then(m => ({ default: m.InstStudentInternship })));

// AI Academy — single page module
const AcademyPage = lazy(() => import('./pages/instStudent/AcademyPage').then(m => ({ default: m.AcademyPage })));

const StudentDashboard    = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentJobs         = lazy(() => import('./pages/student/StudentJobs').then(m => ({ default: m.StudentJobs })));
const StudentApplications = lazy(() => import('./pages/student/StudentApplications').then(m => ({ default: m.StudentApplications })));
const StudentInternships  = lazy(() => import('./pages/student/StudentInternships').then(m => ({ default: m.StudentInternships })));
const StudentResources    = lazy(() => import('./pages/student/StudentResources').then(m => ({ default: m.StudentResources })));
const StudentCertificates = lazy(() => import('./pages/student/StudentCertificates').then(m => ({ default: m.StudentCertificates })));
const StudentProfile      = lazy(() => import('./pages/student/StudentProfile').then(m => ({ default: m.StudentProfile })));
const StudentMockInterview= lazy(() => import('./pages/student/StudentMockInterview').then(m => ({ default: m.StudentMockInterview })));
const StudentMockDashboard= lazy(() => import('./pages/student/StudentMockDashboard').then(m => ({ default: m.StudentMockDashboard })));
const StudentResumeBuilder= lazy(() => import('./pages/student/StudentResumeBuilder').then(m => ({ default: m.StudentResumeBuilder })));

// Academy

const CompanyDashboard  = lazy(() => import('./pages/company/CompanyDashboard').then(m => ({ default: m.CompanyDashboard })));
const CompanyJobs       = lazy(() => import('./pages/company/CompanyJobs').then(m => ({ default: m.CompanyJobs })));
const JobForm           = lazy(() => import('./pages/company/JobForm').then(m => ({ default: m.JobForm })));
const CompanyApplicants = lazy(() => import('./pages/company/CompanyApplicants').then(m => ({ default: m.CompanyApplicants })));
const CompanyProfile    = lazy(() => import('./pages/company/CompanyProfile').then(m => ({ default: m.CompanyProfile })));

const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminStudents     = lazy(() => import('./pages/admin/AdminStudents').then(m => ({ default: m.AdminStudents })));
const AdminCompanies    = lazy(() => import('./pages/admin/AdminCompanies').then(m => ({ default: m.AdminCompanies })));
const AdminJobs         = lazy(() => import('./pages/admin/AdminJobs').then(m => ({ default: m.AdminJobs })));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications').then(m => ({ default: m.AdminApplications })));
const AdminInternships  = lazy(() => import('./pages/admin/AdminInternships').then(m => ({ default: m.AdminInternships })));
const AdminResources    = lazy(() => import('./pages/admin/AdminResources').then(m => ({ default: m.AdminResources })));
const AdminCertificates = lazy(() => import('./pages/admin/AdminCertificates').then(m => ({ default: m.AdminCertificates })));
const AdminAnalytics    = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminIPlatform    = lazy(() => import('./pages/admin/AdminIPlatform').then(m => ({ default: m.AdminIPlatform })));
const AdminEnquiries    = lazy(() => import('./pages/admin/AdminEnquiries').then(m => ({ default: m.AdminEnquiries })));
const AdminDocuments    = lazy(() => import('./pages/admin/AdminDocuments').then(m => ({ default: m.AdminDocuments })));
const AdminInstitutions = lazy(() => import('./pages/admin/AdminInstitutions').then(m => ({ default: m.AdminInstitutions })));

const InstitutionDashboard    = lazy(() => import('./pages/institution/InstitutionDashboard').then(m => ({ default: m.InstitutionDashboard })));
const InstitutionStudents     = lazy(() => import('./pages/institution/InstitutionStudents').then(m => ({ default: m.InstitutionStudents })));
const InstitutionBatches      = lazy(() => import('./pages/institution/InstitutionBatches').then(m => ({ default: m.InstitutionBatches })));
const InstitutionCourses      = lazy(() => import('./pages/institution/InstitutionCourses').then(m => ({ default: m.InstitutionCourses })));
const InstitutionCertificates = lazy(() => import('./pages/institution/InstitutionCertificates').then(m => ({ default: m.InstitutionCertificates })));
const InstitutionProfile      = lazy(() => import('./pages/institution/InstitutionProfile').then(m => ({ default: m.InstitutionProfile })));

const AboutUs           = lazy(() => import('./pages/legal/AboutUs').then(m => ({ default: m.AboutUs })));
const CompanyInformation= lazy(() => import('./pages/legal/CompanyInformation').then(m => ({ default: m.CompanyInformation })));
const ContactUs         = lazy(() => import('./pages/legal/ContactUs').then(m => ({ default: m.ContactUs })));
const VerificationPortal= lazy(() => import('./pages/legal/VerificationPortal').then(m => ({ default: m.VerificationPortal })));
const PrivacyPolicy     = lazy(() => import('./pages/legal/policyPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsAndConditions= lazy(() => import('./pages/legal/policyPages').then(m => ({ default: m.TermsAndConditions })));
const Disclaimer        = lazy(() => import('./pages/legal/policyPages').then(m => ({ default: m.Disclaimer })));
const RefundPolicy      = lazy(() => import('./pages/legal/policyPages').then(m => ({ default: m.RefundPolicy })));
const InternshipPolicy  = lazy(() => import('./pages/legal/policyPages').then(m => ({ default: m.InternshipPolicy })));

// ── Loading Spinner ───────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />;
  const role = user.role as Role;
  if (role === 'student' && user.emailVerified === false)
    return <Navigate to="/auth" state={{ message: 'Please verify your email.' }} replace />;
  if (role === 'student')     return <Navigate to="/student/dashboard" replace />;
  if (role === 'company')     return <Navigate to="/company/dashboard" replace />;
  if (role === 'admin')       return <Navigate to="/admin/dashboard" replace />;
  if (role === 'institution') return <Navigate to="/institution/dashboard" replace />;
  return <Navigate to="/auth" replace />;
}

function InstStudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useInstStudentStore();
  if (!isAuthenticated) return <Navigate to="/inst-login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
      <GlobalAnimations />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={isAuthenticated && user ? <AuthRedirect /> : <LandingPage />} />

          {/* Legal */}
          <Route path="/about-us"             element={<AboutUs />} />
          <Route path="/company-information"  element={<CompanyInformation />} />
          <Route path="/contact-us"           element={<ContactUs />} />
          <Route path="/privacy-policy"       element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/disclaimer"           element={<Disclaimer />} />
          <Route path="/refund-policy"        element={<RefundPolicy />} />
          <Route path="/internship-policy"    element={<InternshipPolicy />} />
          <Route path="/verification"         element={<VerificationPortal />} />
          <Route path="/verification/:type"   element={<VerificationPortal />} />
          <Route path="/verification/:type/:id" element={<VerificationPortal />} />
          <Route path="/verify"               element={<VerificationPortal defaultType="certificate" />} />
          <Route path="/verify/:id"           element={<VerificationPortal defaultType="certificate" />} />

          {/* Auth */}
          <Route path="/auth" element={
            isAuthenticated && user && !(user.role === 'student' && user.emailVerified === false)
              ? <AuthRedirect /> : <AuthPage />
          } />
          <Route path="/inst-login" element={<InstStudentLogin />} />

          {/* Institution Student */}
          <Route path="/inst-student" element={<InstStudentRoute><InstStudentLayout /></InstStudentRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<InstStudentDashboard />} />
            <Route path="profile"      element={<InstStudentProfile />} />
            <Route path="batches"      element={<InstStudentBatches />} />
            <Route path="courses"      element={<InstStudentCourses />} />
            <Route path="certificates" element={<InstStudentCertificates />} />
            <Route path="internship"   element={<InstStudentInternship />} />
          </Route>
          {/* AI Academy - full screen, outside layout */}
          <Route path="/inst-student/academy" element={<InstStudentRoute><AcademyPage /></InstStudentRoute>} />

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"      element={<StudentDashboard />} />
            <Route path="internships"    element={<StudentInternships />} />
            <Route path="jobs"           element={<StudentJobs />} />
            <Route path="applications"   element={<StudentApplications />} />
            <Route path="resources"      element={<StudentResources />} />
            <Route path="mock-interview" element={<StudentMockInterview />} />
            <Route path="resume-builder" element={<StudentResumeBuilder />} />
            <Route path="mock-dashboard" element={<StudentMockDashboard />} />
            <Route path="certificates"   element={<StudentCertificates />} />
            <Route path="profile"        element={<StudentProfile />} />
          </Route>

          {/* Company */}
          <Route path="/company" element={<ProtectedRoute allowedRoles={['company']}><CompanyLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<CompanyDashboard />} />
            <Route path="jobs"          element={<CompanyJobs />} />
            <Route path="jobs/create"   element={<JobForm />} />
            <Route path="jobs/edit/:id" element={<JobForm />} />
            <Route path="applicants"    element={<CompanyApplicants />} />
            <Route path="profile"       element={<CompanyProfile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<AdminDashboard />} />
            <Route path="iplatform"    element={<AdminIPlatform />} />
            <Route path="students"     element={<AdminStudents />} />
            <Route path="companies"    element={<AdminCompanies />} />
            <Route path="institutions" element={<AdminInstitutions />} />
            <Route path="jobs"         element={<AdminJobs />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="internships"  element={<AdminInternships />} />
            <Route path="resources"    element={<AdminResources />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="documents"    element={<AdminDocuments />} />
            <Route path="enquiries"    element={<AdminEnquiries />} />
            <Route path="analytics"    element={<AdminAnalytics />} />
            <Route path="settings"     element={<AdminSettings />} />
          </Route>

          {/* Institution */}
          <Route path="/institution" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"    element={<InstitutionDashboard />} />
            <Route path="students"     element={<InstitutionStudents />} />
            <Route path="batches"      element={<InstitutionBatches />} />
            <Route path="courses"      element={<InstitutionCourses />} />
            <Route path="certificates" element={<InstitutionCertificates />} />
            <Route path="profile"      element={<InstitutionProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}