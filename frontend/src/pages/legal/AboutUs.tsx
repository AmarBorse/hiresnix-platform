import { CheckCircle2, Target, Telescope, ShieldCheck } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { LegalLayout } from '../../components/legal/LegalLayout';
import { COMPANY, registeredOfficeText } from '../../lib/companyInfo';

const highlights = [
  'Structured internship programs across modern technology and business domains.',
  'Professional document generation for certificates, completion letters, offers, and recommendations.',
  'Recruitment workflows that help companies discover trained, motivated candidates.',
  'A transparent legal identity operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED.',
];

export function AboutUs() {
  const description = 'Learn about Hiresnix, an internship and recruitment platform operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED.';
  return (
    <LegalLayout>
      <SEO title="About Us | Hiresnix" description={description} path="/about-us" structuredData={{ '@type': 'AboutPage', name: 'About Hiresnix', description }} />
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">About Hiresnix</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">Building practical bridges between learning, internships, and hiring.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">
            Hiresnix is a professional internship and recruitment platform designed to help students gain practical exposure and help companies connect with emerging talent. The brand is operated by {COMPANY.legalName}.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Target, title: 'Mission', text: 'To make career readiness more practical, structured, and accessible through guided internships, real tasks, and trusted verification.' },
              { icon: Telescope, title: 'Vision', text: 'To become a reliable talent development and recruitment platform for students, colleges, startups, and employers across India.' },
              { icon: ShieldCheck, title: 'Trust', text: 'To maintain transparent company information, clear policies, and verifiable records for issued internship documents.' },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-[#0b1120] p-6">
                <item.icon className="text-blue-400" size={24} />
                <h2 className="mt-5 text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold text-white">Why Hiresnix</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-6 text-slate-400">
                    <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-6">
              <h2 className="text-xl font-bold text-white">Legal Company Information</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div><dt className="text-slate-500">Legal Company Name</dt><dd className="font-semibold text-slate-200">{COMPANY.legalName}</dd></div>
                <div><dt className="text-slate-500">CIN</dt><dd className="font-mono text-slate-200">{COMPANY.cin}</dd></div>
                <div><dt className="text-slate-500">Registered Office</dt><dd className="text-slate-300">{registeredOfficeText}</dd></div>
                <div><dt className="text-slate-500">Official Email</dt><dd className="text-slate-300">{COMPANY.email}</dd></div>
              </dl>
            </section>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
