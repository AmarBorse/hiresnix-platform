import { SEO } from '../common/SEO';
import { LegalLayout } from './LegalLayout';
import { COMPANY, registeredOfficeText } from '../../lib/companyInfo';

export type Section = {
  title: string;
  body: string[];
};

type Props = {
  title: string;
  eyebrow: string;
  description: string;
  path: string;
  sections: Section[];
};

export function LegalPage({ title, eyebrow, description, path, sections }: Props) {
  return (
    <LegalLayout>
      <SEO title={`${title} | ${COMPANY.brand}`} description={description} path={path} structuredData={{ '@type': 'WebPage', name: title, description }} />
      <section className="px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{description}</p>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            <p><span className="font-semibold text-slate-200">Operated by:</span> {COMPANY.legalName}</p>
            <p><span className="font-semibold text-slate-200">Registered Office:</span> {registeredOfficeText}</p>
            <p><span className="font-semibold text-slate-200">Email:</span> {COMPANY.email}</p>
          </div>
          <div className="mt-10 space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-lg border border-white/10 bg-[#0b1120] p-6">
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-400">
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
