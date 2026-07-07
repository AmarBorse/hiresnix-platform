import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InstitutionRole } from '../types';

const roleLabels: Record<InstitutionRole, string> = {
  'super-admin': 'Super Admin',
  'institute-admin': 'Institute Admin',
  trainer: 'Trainer',
  student: 'Student',
};

const navigation = {
  'super-admin': [
    ['Dashboard', LayoutDashboard],
    ['Institute Requests', Building2],
    ['Institute Management', ShieldCheck],
    ['Student Analytics', BarChart3],
    ['Certificate Verification', QrCode],
    ['Reports', FileText],
    ['Settings', Settings],
  ],
  'institute-admin': [
    ['Dashboard', LayoutDashboard],
    ['Students', Users],
    ['Trainers', UserCheck],
    ['Batches', CalendarCheck],
    ['Courses', BookOpen],
    ['Attendance', ClipboardCheck],
    ['Assessments', FileText],
    ['Assignments', CheckCircle2],
    ['Certificates', Award],
    ['Reports', BarChart3],
    ['Notifications', Bell],
    ['Institute Profile', Building2],
  ],
  trainer: [
    ['Dashboard', LayoutDashboard],
    ['Students', Users],
    ['Attendance', ClipboardCheck],
    ['Assessments', FileText],
    ['Assignments', CheckCircle2],
  ],
  student: [
    ['Profile', Users],
    ['Career ID', GraduationCap],
    ['My Courses', BookOpen],
    ['Attendance', ClipboardCheck],
    ['Assessments', FileText],
    ['Certificates', Award],
    ['Progress', BarChart3],
  ],
} satisfies Record<InstitutionRole, [string, typeof LayoutDashboard][]>;

interface InstitutionShellProps {
  role: InstitutionRole;
  onRoleChange: (role: InstitutionRole) => void;
  children: ReactNode;
}

export function InstitutionShell({ role, onRoleChange, children }: InstitutionShellProps) {
  const [open, setOpen] = useState(false);
  const activeNavigation = useMemo(() => navigation[role], [role]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-950">
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/50 md:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#111827] text-white transition-transform duration-200 md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/hiresnix-logo.png" alt="Hiresnix" className="h-9 object-contain" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Institution</p>
              <p className="text-sm font-bold">Portal</p>
            </div>
          </div>
          <button aria-label="Close menu" className="md:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</label>
          <select
            value={role}
            onChange={(event) => onRoleChange(event.target.value as InstitutionRole)}
            className="h-10 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white outline-none"
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value} className="text-slate-950">{label}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {activeNavigation.map(([label, Icon], index) => (
            <button
              key={label}
              className={cn(
                'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition',
                index === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-xs font-semibold text-slate-300">Standalone module</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Prepared for future merge into the Hiresnix ecosystem.</p>
          </div>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button aria-label="Open menu" className="rounded-lg border border-slate-200 p-2 md:hidden" onClick={() => setOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{roleLabels[role]}</p>
              <h1 className="text-lg font-black text-slate-950 sm:text-xl">Hiresnix Institution Portal</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
            <CheckCircle2 size={14} />
            No internship workflow
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
