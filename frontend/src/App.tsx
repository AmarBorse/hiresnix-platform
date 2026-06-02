// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { StudentLayout }  from './components/layout/StudentLayout';
import { CompanyLayout }  from './components/layout/CompanyLayout';
import { AdminLayout }    from './components/layout/AdminLayout';
import { LandingPage }         from './pages/LandingPage';
import { AuthPage }            from './pages/auth/AuthPage';
import { StudentDashboard }    from './pages/student/StudentDashboard';
import { StudentJobs }         from './pages/student/StudentJobs';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentInternships }  from './pages/student/StudentInternships';
import { StudentResources }    from './pages/student/StudentResources';
import { StudentCertificates } from './pages/student/StudentCertificates';
import { StudentProfile }      from './pages/student/StudentProfile';
import { StudentMockInterview } from './pages/student/StudentMockInterview';
import { CompanyDashboard }  from './pages/company/CompanyDashboard';
import { CompanyJobs }       from './pages/company/CompanyJobs';
import { JobForm }           from './pages/company/JobForm';
import { CompanyApplicants } from './pages/company/CompanyApplicants';
import { CompanyProfile }    from './pages/company/CompanyProfile';
import { AdminDashboard }    from './pages/admin/AdminDashboard';
import { AdminStudents }     from './pages/admin/AdminStudents';
import { AdminCompanies }    from './pages/admin/AdminCompanies';
import { AdminJobs }         from './pages/admin/AdminJobs';
import { AdminApplications } from './pages/admin/AdminApplications';
import { AdminInternships }  from './pages/admin/AdminInternships';
import { AdminResources }    from './pages/admin/AdminResources';
import { AdminCertificates } from './pages/admin/AdminCertificates';
import { AdminAnalytics }    from './pages/admin/AdminAnalytics';
import { AdminSettings }     from './pages/admin/AdminSettings';
import { AdminIPlatform }    from './pages/admin/AdminIPlatform';
import { AdminEnquiries }    from './pages/admin/AdminEnquiries';
import { VerifyCertificate } from './pages/VerifyCertificate';
import { Role } from './types';

function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />;
  const role = user.role as Role;
  if (role === 'student' && user.emailVerified === false) {
    return <Navigate to="/auth" state={{ message: 'Please verify your email before accessing your account.' }} replace />;
  }
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (role === 'company') return <Navigate to="/company/dashboard" replace />;
  if (role === 'admin')   return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/auth" replace />;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        {/* Landing */}
        <Route path="/" element={
          isAuthenticated && user
            ? <AuthRedirect />
            : <LandingPage />
        } />

        {/* Public Certificate Verification */}
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:id" element={<VerifyCertificate />} />

        {/* Auth */}
        <Route
          path="/auth"
          element={
            isAuthenticated && user && !(user.role === 'student' && user.emailVerified === false)
              ? <AuthRedirect />
              : <AuthPage />
          }
        />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"      element={<StudentDashboard />} />
          <Route path="internships"    element={<StudentInternships />} />
          <Route path="jobs"           element={<StudentJobs />} />
          <Route path="applications"   element={<StudentApplications />} />
          <Route path="resources"      element={<StudentResources />} />
          <Route path="mock-interview" element={<StudentMockInterview />} />
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
          <Route path="jobs"         element={<AdminJobs />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="internships"  element={<AdminInternships />} />
          <Route path="resources"    element={<AdminResources />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="enquiries"    element={<AdminEnquiries />} />
          <Route path="analytics"    element={<AdminAnalytics />} />
          <Route path="settings"     element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
