import { Download, Printer, QrCode } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { CertificateRecord, InstitutionMetric } from '../types';

const toneMap: Record<InstitutionMetric['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
};

export function MetricCard({ metric }: { metric: InstitutionMetric }) {
  const Icon = metric.icon;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-lg border ${toneMap[metric.tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-slate-950">{metric.value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{metric.label}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">{metric.trend}</p>
    </div>
  );
}

export function SectionPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-700">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex min-w-32 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-bold text-slate-600">{value}%</span>
    </div>
  );
}

export function CertificatePreview({ certificate }: { certificate: CertificateRecord }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Certificate</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{certificate.type}</h3>
          <p className="mt-1 text-sm text-slate-600">{certificate.student} - {certificate.course}</p>
        </div>
        <div className="flex size-16 items-center justify-center rounded-lg border border-slate-300 bg-white">
          <QrCode size={34} className="text-slate-700" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Unique Number</p>
          <p className="font-bold text-slate-950">{certificate.certificateNo}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Issued On</p>
          <p className="font-bold text-slate-950">{certificate.issuedOn}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Digital Signature</p>
          <p className="font-bold text-slate-950">Institute Director</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm"><Download size={14} /> PDF</Button>
        <Button size="sm" variant="outline"><Printer size={14} /> Print</Button>
        <Button size="sm" variant="outline"><QrCode size={14} /> Verify</Button>
      </div>
    </div>
  );
}
