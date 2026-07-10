import { SEO } from '../../components/common/SEO';
import { LegalLayout } from '../../components/legal/LegalLayout';
import { COMPANY, registeredOfficeText } from '../../lib/companyInfo';

const rows = [
  ['Legal Company Name', COMPANY.legalName],
  ['CIN', COMPANY.cin],
  ['ROC', COMPANY.roc],
  ['Date of Incorporation', COMPANY.incorporationDate],
  ['Company Type', COMPANY.companyType],
  ['Category', COMPANY.category],
  ['Status', COMPANY.status],
  ['Registered Office', "9V3M+JP3, Ambika Nagar, Shirpur, Maharashtra 425405, India" ],
  ['Official Email', COMPANY.email],
  ['Website', COMPANY.website],
];

export function CompanyInformation() {
  const description = 'Official company information for Hiresnix, operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED.';
  return (
    <LegalLayout>
      <SEO title="Company Information | Hiresnix" description={description} path="/company-information" structuredData={{ '@type': 'WebPage', name: 'Company Information', description }} />
      <section className="px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Company Records</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Company Information</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{description}</p>
          <div className="mt-10 overflow-hidden rounded-lg border border-white/10 bg-[#0b1120]">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-2 border-b border-white/10 p-5 last:border-b-0 sm:grid-cols-[240px_1fr]">
                <div className="text-sm font-semibold text-slate-500">{label}</div>
                <div className="text-sm font-semibold text-slate-200">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
