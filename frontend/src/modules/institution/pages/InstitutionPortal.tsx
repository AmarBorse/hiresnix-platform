import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileText,
  GraduationCap,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { institutionCapabilityMap } from '../data/mockInstitutionData';
import { CertificatePreview, MetricCard, ProgressBar, SectionPanel } from '../components/InstitutionCards';
import { InstitutionShell } from '../components/InstitutionShell';
import { institutionService } from '../services/institutionService';
import type { InstitutionRole, InstitutionWorkspace, StudentRecord } from '../types';

function StatusBadge({ label }: { label: string }) {
  const tone = label === 'approved' || label === 'Active' || label === 'Present'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : label === 'pending' || label === 'Upcoming' || label === 'Late'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${tone}`}>{label}</span>;
}

function EmptyApiNotice() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <p className="font-black">API-ready architecture</p>
      <p className="mt-1 leading-6">This standalone module uses local services today. Replace `institutionService` with API adapters during the future Hiresnix merge.</p>
    </div>
  );
}

function StudentsTable({ students, onMakeEligible }: { students: StudentRecord[]; onMakeEligible: (student: StudentRecord) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <th className="py-3 pr-3">Student</th>
            <th className="py-3 pr-3">Career ID</th>
            <th className="py-3 pr-3">Course</th>
            <th className="py-3 pr-3">Attendance</th>
            <th className="py-3 pr-3">Progress</th>
            <th className="py-3 pr-3">Internship Eligibility</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-3">
                <p className="font-bold text-slate-950">{student.name}</p>
                <p className="text-xs text-slate-500">{student.batch}</p>
              </td>
              <td className="py-3 pr-3 font-semibold text-slate-700">{student.careerId}</td>
              <td className="py-3 pr-3 text-slate-600">{student.course}</td>
              <td className="py-3 pr-3"><ProgressBar value={student.attendance} /></td>
              <td className="py-3 pr-3"><ProgressBar value={student.progress} /></td>
              <td className="py-3 pr-3">
                {student.internshipEligible ? (
                  <Badge className="bg-emerald-50 text-emerald-700">Eligible</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onMakeEligible(student)}>
                    <CheckCircle2 size={14} /> Make Internship Eligible
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuperAdminView({ workspace }: { workspace: InstitutionWorkspace }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionPanel title="Institute Registration Requests" action={<Button size="sm"><UserPlus size={14} /> Register Institute</Button>}>
          <div className="space-y-3">
            {workspace.institutes.map((institute) => (
              <div key={institute.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="font-black text-slate-950">{institute.name}</p>
                  <p className="text-sm text-slate-500">{institute.city} - {institute.contact}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">{institute.submittedOn}</span>
                  <StatusBadge label={institute.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Certificate Verification" action={<Button size="sm" variant="outline"><Search size={14} /> Verify</Button>}>
          <div className="space-y-3">
            <Input placeholder="Enter certificate number" defaultValue="HX-CERT-2026-0001" />
            <CertificatePreview certificate={workspace.certificates[0]} />
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title="Reports">
        <div className="grid gap-3 md:grid-cols-3">
          {['Institute performance report', 'Student analytics export', 'Certificate audit log'].map((report) => (
            <button key={report} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-left font-bold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50">
              {report}
              <FileDown size={17} />
            </button>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}

function InstituteAdminView({ workspace, students, onMakeEligible }: { workspace: InstitutionWorkspace; students: StudentRecord[]; onMakeEligible: (student: StudentRecord) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <SectionPanel title="Student Management" action={<Button size="sm"><UserPlus size={14} /> Add Student</Button>}>
        <StudentsTable students={students} onMakeEligible={onMakeEligible} />
      </SectionPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionPanel title="Trainer Management">
          <div className="grid gap-3">
            {workspace.trainers.map((trainer) => (
              <div key={trainer.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{trainer.name}</p>
                    <p className="text-sm text-slate-500">{trainer.specialization}</p>
                  </div>
                  <Badge variant="outline">{trainer.rating} rating</Badge>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">{trainer.activeBatches} active batches - {trainer.students} students</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Batch Management">
          <div className="space-y-3">
            {workspace.batches.map((batch) => (
              <div key={batch.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-950">{batch.name}</p>
                  <StatusBadge label={batch.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{batch.course} - {batch.trainer}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{batch.schedule} - {batch.students} students</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionPanel title="Course Management">
          <div className="space-y-3">
            {workspace.courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-950">{course.title}</p>
                    <p className="text-sm text-slate-500">{course.duration} - {course.modules} modules</p>
                  </div>
                  <ProgressBar value={course.completionRate} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Notifications" action={<Button size="sm" variant="outline"><Send size={14} /> Send</Button>}>
          <div className="space-y-3">
            {['Assessment reminder sent to FS-26-A', 'Certificate approval pending for 3 learners', 'Attendance threshold alert for DA-26-B'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm font-semibold text-slate-700">
                <Bell size={16} className="text-amber-500" />
                {item}
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

function TrainerView({ workspace }: { workspace: InstitutionWorkspace }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.slice(1).map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionPanel title="My Students">
          <div className="space-y-3">
            {workspace.students.map((student) => (
              <div key={student.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.course}</p>
                  </div>
                  <ProgressBar value={student.progress} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Assessments & Assignments">
          <div className="space-y-3">
            {workspace.assessments.map((assessment) => (
              <div key={assessment.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{assessment.title}</p>
                    <p className="text-sm text-slate-500">{assessment.course} - due {assessment.dueDate}</p>
                  </div>
                  <Badge variant="outline">{assessment.averageScore}% average</Badge>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{assessment.submissions} submissions received</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
      <SectionPanel title="Attendance">
        <StudentsTable students={workspace.students} onMakeEligible={() => undefined} />
      </SectionPanel>
    </div>
  );
}

function StudentView({ workspace }: { workspace: InstitutionWorkspace }) {
  const profile = workspace.careerProfile;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">Hiresnix Career ID</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{profile.careerId}</h2>
            <p className="mt-1 text-slate-600">{profile.studentName} - Full Stack Development</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
            Internship Eligibility: <span className="text-emerald-700">Eligible</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionPanel title="Profile & Skills">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.achievements.map((achievement) => (
              <div key={achievement} className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{achievement}</div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="My Courses & Progress">
          <div className="space-y-3">
            {workspace.courses.slice(0, 2).map((course) => (
              <div key={course.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-black text-slate-950">{course.title}</p>
                <p className="mt-1 text-sm text-slate-500">{course.duration}</p>
                <div className="mt-3"><ProgressBar value={course.completionRate} /></div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionPanel title="Assessments">
          <div className="space-y-3">
            {profile.assessments.map((assessment) => (
              <div key={assessment} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 font-semibold text-slate-700">
                <FileText size={16} className="text-blue-600" />
                {assessment}
              </div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Certificates">
          <CertificatePreview certificate={workspace.certificates[0]} />
        </SectionPanel>
      </div>
    </div>
  );
}

export function InstitutionPortal() {
  const [role, setRole] = useState<InstitutionRole>('super-admin');
  const [workspace, setWorkspace] = useState<InstitutionWorkspace | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);

  useEffect(() => {
    institutionService.getWorkspace().then((data) => {
      setWorkspace(data);
      setStudents(data.students);
    });
  }, []);

  const activeView = useMemo(() => {
    if (!workspace) return null;
    if (role === 'super-admin') return <SuperAdminView workspace={workspace} />;
    if (role === 'institute-admin') return <InstituteAdminView workspace={workspace} students={students} onMakeEligible={(student) => setStudents((current) => current.map((item) => item.id === student.id ? institutionService.makeInternshipEligible(item) : item))} />;
    if (role === 'trainer') return <TrainerView workspace={{ ...workspace, students }} />;
    return <StudentView workspace={workspace} />;
  }, [role, students, workspace]);

  if (!workspace) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F7FB]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <GraduationCap className="mx-auto text-emerald-600" />
          <p className="mt-3 font-black text-slate-950">Loading Institution Portal</p>
        </div>
      </div>
    );
  }

  return (
    <InstitutionShell role={role} onRoleChange={setRole}>
      <div className="space-y-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                <Sparkles size={14} />
                Independent Hiresnix Ecosystem Module
              </div>
              <h2 className="mt-3 max-w-3xl text-3xl font-black text-slate-950 sm:text-4xl">Institution operations, certificates, and Career IDs in one modular portal.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage institutes, students, trainers, batches, courses, attendance, assessments, assignments, certificates, reports and profile data without bringing internship workflows into this module.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button><Building2 size={15} /> Manage Institutes</Button>
                <Button variant="outline"><Mail size={15} /> Notifications</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-4 lg:border-l lg:border-t-0">
              {institutionCapabilityMap.map(({ icon: Icon, label, text }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <Icon size={18} className="text-emerald-600" />
                  <p className="mt-2 text-sm font-black text-slate-950">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <EmptyApiNotice />
        {activeView}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            {[
              ['Certificate types', 'Course, Training, Skill Assessment, Merit'],
              ['Certificate assets', 'Institute logo, Hiresnix logo, QR, signature'],
              ['Future merge path', 'Student, Company, Internship, Institution, Admin portals'],
              ['Boundary rule', 'Eligibility only. No internships managed here.'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </InstitutionShell>
  );
}
