import { useEffect, useState } from 'react';
import { Award, Building2, CalendarDays, CheckCircle2, ClipboardCheck, Users } from 'lucide-react';
import { instituteApi } from '../../api/instituteWorkspace';
import { SectionPanel } from '../../modules/institution/components/InstitutionCards';

interface DashboardData {
  instituteName: string;
  totals: {
    students: number;
    batches: number;
    activeBatches: number;
    courses: number;
    certificates: number;
    internshipEligible: number;
  };
  avgAttendance: number;
  avgProgress: number;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-lg border ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

export function InstituteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    instituteApi.getDashboard().then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-center shadow-sm">
          <Building2 className="mx-auto text-emerald-600" />
          <p className="mt-3 font-black text-gray-900">Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl bg-[#0F172A] p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">Institute Dashboard</p>
        <h1 className="mt-2 text-2xl font-black">{data.instituteName}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
          Manage your students, batches, courses, assessments, assignments and certificates from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={data.totals.students} tone="bg-blue-50 text-blue-700 border-blue-100" />
        <StatCard icon={CalendarDays} label="Active Batches" value={`${data.totals.activeBatches}/${data.totals.batches}`} tone="bg-emerald-50 text-emerald-700 border-emerald-100" />
        <StatCard icon={Building2} label="Courses" value={data.totals.courses} tone="bg-violet-50 text-violet-700 border-violet-100" />
        <StatCard icon={Award} label="Certificates Issued" value={data.totals.certificates} tone="bg-amber-50 text-amber-700 border-amber-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Avg. Attendance</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.avgAttendance}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Avg. Progress</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.avgProgress}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Internship Eligible</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.totals.internshipEligible}</p>
        </div>
      </div>

      <SectionPanel title="Getting Started">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Course Management', 'Add the courses your institute offers before creating batches.'],
            ['Batch Management', 'Group students into batches and assign a trainer and schedule.'],
            ['Student Management', 'Add students, assign them to a batch, and track attendance & progress.'],
            ['Certificate Management', 'Issue certificates to students once a course is completed.'],
          ].map(([title, text]) => (
            <div key={title} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel title="Module Overview">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Students', data.totals.students, Users],
            ['Batches', data.totals.batches, CalendarDays],
            ['Courses', data.totals.courses, Building2],
            ['Certificates', data.totals.certificates, ClipboardCheck],
          ].map(([label, value, Icon]) => {
            const ModuleIcon = Icon as typeof Users;
            return (
              <div key={label as string} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <ModuleIcon size={18} className="text-emerald-600" />
                <p className="mt-3 text-2xl font-black text-slate-950">{value as number}</p>
                <p className="text-sm font-semibold text-slate-500">{label as string}</p>
              </div>
            );
          })}
        </div>
      </SectionPanel>
    </div>
  );
}
