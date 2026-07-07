import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock3,
  FileDown,
  QrCode,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CertificatePreview, MetricCard, ProgressBar, SectionPanel } from '../../modules/institution/components/InstitutionCards';
import { institutionService } from '../../modules/institution/services/institutionService';
import type { InstituteRequest, InstitutionWorkspace } from '../../modules/institution/types';

function StatusBadge({ status }: { status: InstituteRequest['status'] }) {
  const config = {
    pending: { icon: Clock3, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { icon: XCircle, className: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${config.className}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

export function AdminInstitutions() {
  const [workspace, setWorkspace] = useState<InstitutionWorkspace | null>(null);

  useEffect(() => {
    institutionService.getWorkspace().then(setWorkspace);
  }, []);

  const requestCounts = useMemo(() => {
    const institutes = workspace?.institutes || [];
    return {
      pending: institutes.filter((item) => item.status === 'pending').length,
      approved: institutes.filter((item) => item.status === 'approved').length,
      rejected: institutes.filter((item) => item.status === 'rejected').length,
    };
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-center shadow-sm">
          <Building2 className="mx-auto text-emerald-600" />
          <p className="mt-3 font-black text-gray-900">Loading institutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl bg-[#0F172A] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">Admin Module</p>
            <h1 className="mt-2 text-2xl font-black">Institution Management</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              Review institution registration requests, monitor students, verify certificates and manage institute analytics inside the existing admin panel.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary"><FileDown size={14} /> Export</Button>
            <Button size="sm"><ShieldCheck size={14} /> Settings</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">Pending</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{requestCounts.pending}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Approved</p>
          <p className="mt-2 text-3xl font-black text-emerald-900">{requestCounts.approved}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-rose-700">Rejected</p>
          <p className="mt-2 text-3xl font-black text-rose-900">{requestCounts.rejected}</p>
        </div>
      </div>

      <SectionPanel title="Institution Registration Requests" action={<Button size="sm"><Building2 size={14} /> Add Institute</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <th className="py-3 pr-3">Institute</th>
                <th className="py-3 pr-3">Contact</th>
                <th className="py-3 pr-3">Submitted</th>
                <th className="py-3 pr-3">Students</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {workspace.institutes.map((institute) => (
                <tr key={institute.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-black text-slate-950">{institute.name}</p>
                    <p className="text-xs text-slate-500">{institute.city} - {institute.id}</p>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{institute.contact}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-600">{institute.submittedOn}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-600">{institute.students}</td>
                  <td className="py-3 pr-3"><StatusBadge status={institute.status} /></td>
                  <td className="py-3 pr-3">
                    {institute.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="xs"><CheckCircle2 size={12} /> Approve</Button>
                        <Button size="xs" variant="outline"><XCircle size={12} /> Reject</Button>
                      </div>
                    ) : (
                      <Button size="xs" variant="outline">View</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionPanel title="Student Analytics">
          <div className="space-y-3">
            {workspace.students.map((student) => (
              <div key={student.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.careerId} - {student.course}</p>
                  </div>
                  <Badge className={student.internshipEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                    {student.internshipEligible ? 'Internship Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ProgressBar value={student.attendance} />
                  <ProgressBar value={student.progress} />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Certificate Verification" action={<Button size="sm" variant="outline"><QrCode size={14} /> QR Verify</Button>}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Enter certificate number" defaultValue={workspace.certificates[0]?.certificateNo} />
            </div>
            {workspace.certificates[0] && <CertificatePreview certificate={workspace.certificates[0]} />}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title="Institution Academic Modules">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Courses', workspace.courses.length, Award],
            ['Batches', workspace.batches.length, Building2],
            ['Students', workspace.students.length, Users],
            ['Certificates', workspace.certificates.length, QrCode],
          ].map(([label, value, Icon]) => {
            const ModuleIcon = Icon as typeof Award;
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
