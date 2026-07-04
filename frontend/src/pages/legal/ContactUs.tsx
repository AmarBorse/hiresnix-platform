import { useState } from 'react';
import { Mail, MapPin, Globe2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '../../components/common/SEO';
import { LegalLayout } from '../../components/legal/LegalLayout';
import { COMPANY, registeredOfficeText } from '../../lib/companyInfo';

export function ContactUs() {
  const [sent, setSent] = useState(false);
  const description = 'Contact Hiresnix for internship, recruitment, support, HR, and company communication.';

  return (
    <LegalLayout>
      <SEO title="Contact Us | Hiresnix" description={description} path="/contact-us" structuredData={{ '@type': 'ContactPage', name: 'Contact Hiresnix', description }} />
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Contact</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Contact Us</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{description}</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              {[
                { icon: MapPin, label: 'Registered Office', value: registeredOfficeText },
                { icon: Mail, label: 'Official Email', value: COMPANY.email },
                { icon: Mail, label: 'HR Email', value: COMPANY.hrEmail },
                { icon: Globe2, label: 'Website', value: COMPANY.website },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-[#0b1120] p-5">
                  <item.icon className="text-blue-400" size={20} />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">{item.value}</p>
                </div>
              ))}
              <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-sm font-semibold text-slate-500">
                Google Map Placeholder
              </div>
            </div>

            <form
              className="rounded-lg border border-white/10 bg-white/[0.03] p-6"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
                toast.success('Message prepared. Please email support@hiresnix.co.in for official support.');
              }}
            >
              <h2 className="text-2xl font-bold text-white">Send a Message</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input required className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" placeholder="Full name" />
                <input required type="email" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" placeholder="Email address" />
                <input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" placeholder="Phone number" />
                <input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" placeholder="Subject" />
              </div>
              <textarea required rows={6} className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400" placeholder="How can we help?" />
              <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600" type="submit">
                <Send size={16} />
                {sent ? 'Message Noted' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
