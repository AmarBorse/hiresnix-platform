// src/pages/LandingPage.tsx
// Public landing page — two audiences: students (internships, AI Academy) and businesses (software services).
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';
import { HiresnixChatbot } from '../components/HiresnixChatbot';

const ENQUIRY_RESPONSE_TIMEOUT_MS = 8000;
const INTEREST_OPTIONS = ['Software Development', 'AI Solutions', 'SaaS Product', 'Web Development', 'Mobile App', 'UI/UX Design', 'Internship Platform', 'Partnership', 'Other'];

// ── Content ─────────────────────────────────────────────────────────
// Project paths are the real three-stage projects interns build on the platform.
const DOMAINS = [
  { id: 'fullstack', name: 'Full stack development', blurb: 'Build complete web apps with React, Node.js and PostgreSQL.',
    projects: [
      ['Personal Task Manager App', 'React.js, Node.js, MySQL, JWT'],
      ['Job Application Tracker', 'React.js, Node.js, PostgreSQL, Chart.js'],
      ['Multi-Tenant Project Management SaaS', 'React.js, Node.js, PostgreSQL, Socket.io, Stripe'],
    ] },
  { id: 'frontend', name: 'Front end development', blurb: 'Build fast, responsive interfaces in React.',
    projects: [
      ['Personal Portfolio Website', 'React.js, CSS3, EmailJS'],
      ['Job Board UI with Filters', 'React.js, Tailwind CSS, Context API'],
      ['Real-Time Collaborative Notes App', 'React.js, Socket.io, Tailwind, Quill.js'],
    ] },
  { id: 'datascience', name: 'Data science', blurb: 'Clean real datasets, find patterns and forecast what comes next.',
    projects: [
      ['COVID-19 India State Analysis', 'Python, Pandas, Plotly, Geopandas'],
      ['Indian Stock Market EDA & Forecast', 'Python, Pandas, yfinance, Prophet'],
      ['Social Mobility & Income Inequality Study', 'Python, Pandas, Geopandas, Scikit-learn'],
    ] },
  { id: 'analytics', name: 'Data analytics', blurb: 'Turn business data into reports and dashboards people use.',
    projects: [
      ['Superstore Sales Performance Report', 'Python, Pandas, Plotly, Power BI'],
      ['Retail Store Footfall Insights', 'Python, Pandas, Plotly, Power BI'],
      ['Real-Time Sales Command Center', 'Python, Streamlit, Plotly, SQL'],
    ] },
  { id: 'ml', name: 'Machine learning', blurb: 'Train models, measure them and ship them as working apps.',
    projects: [
      ['Iris Flower Species Classifier', 'Python, Scikit-learn, Pandas'],
      ['Crop Yield Prediction System', 'Python, XGBoost, Pandas, Streamlit'],
      ['Real-Time Pose Estimation Trainer', 'Python, MediaPipe, TensorFlow, Flask'],
    ] },
  { id: 'ai', name: 'Artificial intelligence', blurb: 'Build products on top of LLMs, agents and retrieval.',
    projects: [
      ['AI Recipe Generator from Ingredients', 'Python, Gemini API, Streamlit'],
      ['Agentic Research Assistant', 'Python, LangChain, Streamlit'],
      ['RAG Chatbot on Custom Knowledge Base', 'Python, LangChain, ChromaDB, Gemini API'],
    ] },
  { id: 'security', name: 'Cyber security', blurb: 'Scan, test and write up real security findings.',
    projects: [
      ['Network Vulnerability Scanner', 'Python, Nmap, Flask'],
      ['Password Strength Analyzer & Generator', 'Python, Flask, zxcvbn, React'],
      ['Web Application Penetration Testing Report', 'OWASP ZAP, Burp Suite'],
    ] },
  { id: 'cloud', name: 'Cloud & DevOps', blurb: 'Deploy, scale and recover applications on AWS.',
    projects: [
      ['Static Site Hosting with CDN on AWS', 'AWS S3, CloudFront, Route53'],
      ['Containerized Microservices on AWS', 'Docker, AWS ECS, ECR, ALB'],
      ['Multi-Region Disaster Recovery Setup', 'AWS Route53, RDS, S3, CloudFormation'],
    ] },
];
const LEVELS = ['Starter', 'Intermediate', 'Advanced'];

const INTERN_STEPS = [
  ['Apply', 'Create a student account, pick a domain and choose 1 to 6 months.'],
  ['Get your offer letter', 'Download it from your dashboard once you are enrolled.'],
  ['Build and log your work', 'Complete your three projects and submit a short daily log.'],
  ['Finish with proof', 'Download your certificate and letter of recommendation. Each has a QR code that opens our verification page.'],
];

const ACADEMY_COURSES = ['Python Programming', 'JavaScript', 'Java', 'C++', 'C Programming', 'DSA', 'SQL & Databases', 'Full Stack Web Dev', 'React.js', 'Node.js & Express', 'Data Science', 'Machine Learning', 'Git & GitHub', 'Docker & DevOps', 'Cybersecurity', 'Flutter & Dart'];

const SERVICES = [
  ['Custom software', 'End-to-end software built for your exact business needs, from architecture to deployment.'],
  ['Web development', 'Fast, responsive and scalable web applications on modern frameworks.'],
  ['Mobile apps', 'Cross-platform apps that work smoothly on iOS and Android.'],
  ['AI & machine learning', 'NLP, predictive models and AI features built into your product.'],
  ['SaaS platforms', 'Multi-tenant products with subscriptions, dashboards and room to scale.'],
  ['UI/UX design', 'Wireframes, prototypes and interfaces designed to convert.'],
  ['APIs & integrations', 'REST and GraphQL APIs built for performance, security and third-party use.'],
  ['Cloud & DevOps', 'Cloud architecture, migration and deployment pipelines you can rely on.'],
  ['Maintenance & support', 'Monitoring, fixes and new features after launch.'],
];

const PROCESS = ['Requirements', 'Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Support'];

const NDA_CLIENTS = ['Digital marketing agency', 'E-commerce platform', 'HR tech startup', 'Mobile app company', 'EdTech platform'];

// SEO structured data (unchanged business details)
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': 'https://hiresnix.co.in/#organization', name: 'Hiresnix',
      legalName: 'SR Patil Infrastructure Private Limited', url: 'https://hiresnix.co.in', logo: 'https://hiresnix.co.in/hiresnix-logo.png',
      contactPoint: { '@type': 'ContactPoint', telephone: '+91-9529120977', contactType: 'customer service', email: 'hr@hiresnix.co.in', areaServed: 'IN', availableLanguage: ['English', 'Hindi'] },
      address: { '@type': 'PostalAddress', addressLocality: 'Shirpur', addressRegion: 'Maharashtra', postalCode: '425405', addressCountry: 'IN' },
      sameAs: [],
    },
    { '@type': 'WebSite', '@id': 'https://hiresnix.co.in/#website', url: 'https://hiresnix.co.in', name: 'Hiresnix',
      description: 'AI-powered EdTech & HR-Tech platform for students, institutions and companies', publisher: { '@id': 'https://hiresnix.co.in/#organization' } },
    { '@type': 'SoftwareApplication', name: 'Hiresnix Platform', applicationCategory: 'EducationApplication', operatingSystem: 'Web', url: 'https://hiresnix.co.in',
      description: 'AI-powered career platform offering internships, mock interviews, resume builder and AI academy for students',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, provider: { '@id': 'https://hiresnix.co.in/#organization' } },
  ],
};

const parseList = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string' || !v.trim()) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};

// ── Brand mark (arrow rising to a dot, as in the logo) ──────────────
function BrandMark() {
  return (
    <span className="hx-brand" aria-label="Hiresnix">
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <path d="M1 22 C 10 21, 17 16, 21 7" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 8 L22 4.5 L23.5 12.5" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="27" cy="3" r="2.6" fill="var(--accent)" />
      </svg>
      <span className="hx-brand-word">HIRESNIX</span>
    </span>
  );
}

// ── Hero trajectory ────────────────────────────────────────────────
function Trajectory() {
  const milestones = [
    { x: 88.7, y: 385.2, label: 'Apply', sub: 'Pick a domain', lx: 70, ly: 350, anchor: 'start' as const },
    { x: 257, y: 329, label: 'Offer letter', sub: 'Day one', lx: 232, ly: 296, anchor: 'end' as const },
    { x: 373.4, y: 233.9, label: 'Three projects', sub: 'Starter to advanced', lx: 350, ly: 200, anchor: 'end' as const },
    { x: 442.4, y: 128.4, label: 'Certificate + LOR', sub: 'QR-verifiable', lx: 420, ly: 96, anchor: 'end' as const },
  ];
  return (
    <svg className="hx-traj" viewBox="0 0 500 420" role="img" aria-label="An intern's path: apply, receive an offer letter, build three projects, earn a certificate and letter of recommendation">
      <defs>
        <pattern id="hx-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.1" fill="var(--dots)" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="500" height="420" fill="url(#hx-dots)" />
      <path className="hx-traj-path" pathLength={1} d="M30 390 C 230 385, 390 270, 458 92" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      <path className="hx-traj-head" d="M430 108 L462 84 L466 124" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="hx-traj-dot" cx="482" cy="58" r="11" fill="var(--accent)" />
      {milestones.map((m, i) => (
        <g key={m.label} className="hx-traj-stop" style={{ animationDelay: `${0.35 + i * 0.3}s` }}>
          <circle cx={m.x} cy={m.y} r="7" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3" />
          <text x={m.lx} y={m.ly} textAnchor={m.anchor} className="hx-traj-label">{m.label}</text>
          <text x={m.lx} y={m.ly} dy="1.4em" textAnchor={m.anchor} className="hx-traj-sub">{m.sub}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Domain explorer ────────────────────────────────────────────────
function DomainExplorer({ onApply }: { onApply: () => void }) {
  const [active, setActive] = useState(DOMAINS[0].id);
  const domain = DOMAINS.find(d => d.id === active) || DOMAINS[0];

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = DOMAINS[(idx + dir + DOMAINS.length) % DOMAINS.length];
    setActive(next.id);
    document.getElementById(`hx-tab-${next.id}`)?.focus();
  };

  return (
    <div className="hx-explorer">
      <div className="hx-tabs" role="tablist" aria-label="Internship domains" aria-orientation="vertical">
        {DOMAINS.map((d, i) => (
          <button
            key={d.id} id={`hx-tab-${d.id}`} role="tab" type="button"
            aria-selected={d.id === active} aria-controls="hx-domain-panel" tabIndex={d.id === active ? 0 : -1}
            className="hx-tab" onClick={() => setActive(d.id)} onKeyDown={e => onKey(e, i)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className="hx-panel" id="hx-domain-panel" role="tabpanel" aria-labelledby={`hx-tab-${domain.id}`}>
        <h3 className="hx-panel-title">{domain.name}</h3>
        <p className="hx-panel-blurb">{domain.blurb}</p>
        <p className="hx-panel-note">Projects interns in this domain have built:</p>
        <ol className="hx-ladder">
          {domain.projects.map(([title, tech], i) => (
            <li key={title} className="hx-rung">
              <span className="hx-rung-level">{LEVELS[i]}</span>
              <span className="hx-rung-title">{title}</span>
              <span className="hx-rung-tech">{tech}</span>
            </li>
          ))}
        </ol>
        <button className="hx-btn hx-btn-primary" type="button" onClick={onApply}>Apply for {domain.name.toLowerCase()}</button>
      </div>
    </div>
  );
}

// ── Enquiry form (same submission behaviour as before) ─────────────
function EnquiryForm({ presetInterest }: { presetInterest: string }) {
  const empty = { name: '', email: '', phone: '', interest: 'Software Development', message: '' };
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (presetInterest) setForm(p => ({ ...p, interest: presetInterest })); }, [presetInterest]);
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const request = client.post('/public/enquiry', form);
      const timeout = new Promise<{ data: { success: true; message: string; timedOut: true } }>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve({ data: { success: true, message: 'Enquiry received. Our team will get back to you shortly.', timedOut: true } });
        }, ENQUIRY_RESPONSE_TIMEOUT_MS);
      });
      const { data } = await Promise.race([request, timeout]);
      if (data.success) { setSubmitted(true); toast.success(data.message || 'Enquiry sent successfully!'); }
      else { toast.error('Failed to send enquiry. Please try again.'); }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send enquiry. Please try again.');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="hx-form hx-form-done" role="status">
      <h3 className="hx-h3">Message received</h3>
      <p className="hx-muted">Thank you. Our team will get back to you within 24 hours.</p>
      <button className="hx-btn hx-btn-ghost" type="button" onClick={() => { setSubmitted(false); setForm(empty); }}>Send another message</button>
    </div>
  );

  return (
    <form className="hx-form" onSubmit={handleSubmit}>
      <div className="hx-form-grid">
        <label className="hx-field">
          <span>Full name</span>
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" autoComplete="name" />
        </label>
        <label className="hx-field">
          <span>Email</span>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="hx-field">
          <span>Phone <em>(optional)</em></span>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Mobile number" autoComplete="tel" />
        </label>
        <label className="hx-field">
          <span>Interested in</span>
          <select value={form.interest} onChange={e => set('interest', e.target.value)}>
            {INTEREST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>
      <label className="hx-field">
        <span>Message</span>
        <textarea required rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us about your project or requirement" />
      </label>
      <button type="submit" disabled={loading} className="hx-btn hx-btn-primary hx-btn-block">
        {loading ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingClients, setLandingClients] = useState<any[]>([]);
  const [presetInterest, setPresetInterest] = useState('');

  // Keep the existing copy/right-click protection on the marketing page
  useEffect(() => {
    const preventDefault = (event: Event) => event.preventDefault();
    const preventCopyShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 's', 'u', 'p'].includes(key)) event.preventDefault();
    };
    document.body.classList.add('lp-readonly');
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('keydown', preventCopyShortcuts);
    return () => {
      document.body.classList.remove('lp-readonly');
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', preventCopyShortcuts);
    };
  }, []);

  // Client case studies managed from the admin panel
  useEffect(() => {
    client.get('/clients')
      .then(r => setLandingClients(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, []);

  const goTo = (id: string) => {
    setMenuOpen(false);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const applyNow = () => navigate('/auth?tab=register');
  const contactFor = (interest: string) => { setPresetInterest(interest); goTo('contact'); };

  const publicClients = landingClients.filter((c: any) => !c.nda_protected);
  const ndaClients = [...NDA_CLIENTS, ...landingClients.filter((c: any) => c.nda_protected).map((c: any) => c.industry || 'NDA client')];

  const NAV: [string, string][] = [['internships', 'Internships'], ['academy', 'AI Academy'], ['services', 'Services'], ['work', 'Work'], ['contact', 'Contact']];

  return (
    <div className="hx-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <style>{CSS}</style>

      {/* ── Navigation ── */}
      <header className="hx-nav">
        <div className="hx-wrap hx-nav-inner">
          <a href="#top" className="hx-nav-brand" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0 }); }}><BrandMark /></a>
          <nav className="hx-nav-links" aria-label="Main">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); goTo(id); }}>{label}</a>
            ))}
          </nav>
          <div className="hx-nav-actions">
            <button className="hx-btn hx-btn-ghost hx-hide-sm" type="button" onClick={() => navigate('/auth')}>Log in</button>
            <button className="hx-btn hx-btn-primary" type="button" onClick={() => goTo('internships')}>Explore internships</button>
            <button className="hx-menu-btn" type="button" aria-expanded={menuOpen} aria-controls="hx-mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="hx-mobile-menu" className="hx-mobile-menu" aria-label="Mobile">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); goTo(id); }}>{label}</a>
            ))}
            <button className="hx-btn hx-btn-ghost hx-btn-block" type="button" onClick={() => navigate('/auth')}>Log in</button>
          </nav>
        )}
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className="hx-hero">
          <div className="hx-wrap hx-hero-grid">
            <div className="hx-hero-copy">
              <h1 className="hx-h1">Software for businesses. Internships for students.</h1>
              <p className="hx-lead">
                Hiresnix is a technology company in Shirpur, Maharashtra. We build web, mobile and AI products for clients,
                and we train students on real projects in eight domains.
              </p>
              <div className="hx-hero-ctas">
                <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => goTo('internships')}>Explore internships</button>
                <button className="hx-btn hx-btn-ghost hx-btn-lg" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
              </div>
              <p className="hx-hero-login">Already an intern? <a href="/auth" onClick={e => { e.preventDefault(); navigate('/auth'); }}>Log in to your dashboard</a></p>
            </div>
            <div className="hx-hero-visual"><Trajectory /></div>
          </div>
          <div className="hx-wrap">
            <dl className="hx-facts">
              <div><dt>Students trained</dt><dd>500+</dd></div>
              <div><dt>Internship domains</dt><dd>8</dd></div>
              <div><dt>AI Academy courses</dt><dd>16</dd></div>
              <div><dt>Clients served</dt><dd>50+</dd></div>
            </dl>
          </div>
        </section>

        {/* ── Internships ── */}
        <section id="internships" className="hx-section hx-section-panel">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Internships</h2>
              <p className="hx-lead">
                Choose a domain and a duration from 1 to 6 months. You build three projects that get harder as you go,
                log your daily work, and finish with documents anyone can verify.
              </p>
            </div>

            <DomainExplorer onApply={applyNow} />

            <h3 className="hx-h3 hx-steps-title">How the internship works</h3>
            <ol className="hx-steps">
              {INTERN_STEPS.map(([title, desc], i) => (
                <li key={title}>
                  <span className="hx-step-n" aria-hidden="true">{i + 1}</span>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </li>
              ))}
            </ol>

            <div className="hx-cta-row">
              <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={applyNow}>Apply for an internship</button>
              <a className="hx-link" href="/verify" onClick={e => { e.preventDefault(); navigate('/verify'); }}>Verify a certificate</a>
            </div>
          </div>
        </section>

        {/* ── AI Academy + Institution portal ── */}
        <section id="academy" className="hx-section">
          <div className="hx-wrap hx-split">
            <div>
              <h2 className="hx-h2">AI Academy</h2>
              <p className="hx-lead">
                Sixteen self-paced courses with an AI teacher that explains every lesson, a code runner in the browser and a quiz at the end.
                It is free for every Hiresnix student, and each finished course comes with a certificate.
              </p>
              <ul className="hx-courses" aria-label="Courses">
                {ACADEMY_COURSES.map(c => <li key={c}>{c}</li>)}
              </ul>
              <button className="hx-btn hx-btn-primary" type="button" onClick={() => navigate('/auth')}>Open AI Academy</button>
            </div>
            <aside className="hx-aside">
              <h3 className="hx-h3">For colleges and institutes</h3>
              <p className="hx-muted">
                The institution portal lets you manage batches, import students from a CSV file, track attendance and
                issue certificates your students can verify online. Each student gets a Career ID to log in with.
              </p>
              <button className="hx-btn hx-btn-ghost" type="button" onClick={() => contactFor('Partnership')}>Talk to us about your institute</button>
            </aside>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="hx-section hx-section-panel">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Software development</h2>
              <p className="hx-lead">
                We design, build and maintain software for startups, businesses and institutions, with AI built in where it helps.
              </p>
            </div>
            <dl className="hx-services">
              {SERVICES.map(([t, d]) => (
                <div key={t}><dt>{t}</dt><dd>{d}</dd></div>
              ))}
            </dl>
            <p className="hx-industries">
              Industries we have worked in: education, healthcare, retail, manufacturing, finance, e-commerce and startups.
            </p>

            <h3 className="hx-h3 hx-steps-title">How a project runs</h3>
            <ol className="hx-process">
              {PROCESS.map((p, i) => (
                <li key={p}><span className="hx-step-n" aria-hidden="true">{i + 1}</span>{p}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Client work ── */}
        <section id="work" className="hx-section">
          <div className="hx-wrap">
            <div className="hx-section-head">
              <h2 className="hx-h2">Client work</h2>
              <p className="hx-lead">Software we have delivered for growing businesses across India.</p>
            </div>

            <article className="hx-case">
              <header className="hx-case-head">
                <div>
                  <h3 className="hx-h3">Focktix Limited</h3>
                  <p className="hx-muted">Digital marketing agency, Maharashtra</p>
                </div>
                <span className="hx-badge">Delivered</span>
              </header>
              <div className="hx-case-built">
                <div><strong>Custom CRM system</strong><p>Client and lead management built around the agency's workflow.</p></div>
                <div><strong>Campaign dashboard</strong><p>Live analytics for ad performance across platforms.</p></div>
                <div><strong>AI lead scoring</strong><p>Machine learning that ranks leads so the team calls the best ones first.</p></div>
              </div>
              <p className="hx-case-stack">Built with React.js, Node.js, PostgreSQL, Groq AI, REST APIs and Vercel.</p>
              <dl className="hx-case-results">
                <div><dd>3×</dd><dt>lead conversion</dt></div>
                <div><dd>60%</dd><dt>less manual work</dt></div>
                <div><dd>99.9%</dd><dt>uptime</dt></div>
              </dl>
            </article>

            {publicClients.map((c: any) => {
              const built = parseList(c.what_we_built);
              const stack = parseList(c.tech_stack).filter(Boolean);
              const results = parseList(c.results);
              return (
                <article key={c.id} className="hx-case">
                  <header className="hx-case-head">
                    <div>
                      <h3 className="hx-h3">{c.name}</h3>
                      <p className="hx-muted">{[c.industry, c.location].filter(Boolean).join(', ')}</p>
                    </div>
                    <span className="hx-badge">Delivered</span>
                  </header>
                  {built.length > 0 && (
                    <div className="hx-case-built">
                      {built.map((w: any, i: number) => <div key={i}><strong>{w.title}</strong><p>{w.desc}</p></div>)}
                    </div>
                  )}
                  {stack.length > 0 && <p className="hx-case-stack">Built with {stack.join(', ')}.</p>}
                  {results.length > 0 && (
                    <dl className="hx-case-results">
                      {results.map((r: any, i: number) => <div key={i}><dd>{r.value}</dd><dt>{r.label}</dt></div>)}
                    </dl>
                  )}
                </article>
              );
            })}

            <p className="hx-nda">
              <strong>Other clients, under NDA:</strong> {ndaClients.join(', ')}.
            </p>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="hx-section hx-section-panel">
          <div className="hx-wrap hx-split">
            <div>
              <h2 className="hx-h2">Start a project</h2>
              <p className="hx-lead">Tell us what you need built. We reply within 24 hours.</p>
              <p className="hx-muted hx-contact-alt">
                Prefer email? Write to <a className="hx-link" href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a> or call{' '}
                <a className="hx-link" href="tel:+919529120977">+91 95291 20977</a>.
              </p>
            </div>
            <EnquiryForm presetInterest={presetInterest} />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="hx-footer">
        <div className="hx-wrap hx-footer-grid">
          <div>
            <BrandMark />
            <p className="hx-muted hx-footer-blurb">Building software for businesses and real-project experience for students.</p>
            <a className="hx-link" href="https://www.linkedin.com/company/hiresnix/" target="_blank" rel="noopener noreferrer">Hiresnix on LinkedIn</a>
          </div>
          <div>
            <h4>Students</h4>
            <ul>
              <li><a href="#internships" onClick={e => { e.preventDefault(); goTo('internships'); }}>Internships</a></li>
              <li><a href="#academy" onClick={e => { e.preventDefault(); goTo('academy'); }}>AI Academy</a></li>
              <li><a href="/verify">Verify a certificate</a></li>
              <li><a href="/internship-policy">Internship policy</a></li>
              <li><a href="/auth">Log in</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/about-us">About us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact-us">Contact us</a></li>
              <li><a href="/company-information">Company information</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacy-policy">Privacy policy</a></li>
              <li><a href="/terms-and-conditions">Terms</a></li>
              <li><a href="/refund-policy">Refund policy</a></li>
              <li><a href="/disclaimer">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="hx-wrap hx-footer-legal">
          © 2020 Hiresnix. A brand operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED. CIN: U42909MH2024PTC429260. All rights reserved.
        </div>
      </footer>

      <HiresnixChatbot />
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');

.hx-root{
  --paper:#FFFFFF; --mist:#F6F7F5; --line:#E4E6E2; --dots:#D9DCD6;
  --ink:#15171A; --text:#2B2E33; --muted:#62666D;
  --accent:#0B7A55; --accent-press:#08613F; --accent-soft:#E8F4EE;
  --display:'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif;
  --body:'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
  background:var(--paper); color:var(--text); font-family:var(--body); font-size:17px; line-height:1.6;
  overflow-x:clip; -webkit-font-smoothing:antialiased;
}
body{margin:0;background:#FFFFFF;}
/* The app adds a tinted mesh behind every page (GlobalAnimations); keep the landing page pure white */
body.lp-readonly{background:#FFFFFF !important;}
body.lp-readonly::before{display:none !important;}
.lp-readonly, .lp-readonly *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.lp-readonly input, .lp-readonly textarea, .lp-readonly select{-webkit-user-select:auto;user-select:auto;}
.hx-root *{box-sizing:border-box;}
.hx-root a{color:inherit;}
.hx-root :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}
html{scroll-padding-top:84px;}

.hx-wrap{width:100%;max-width:1160px;margin:0 auto;padding:0 24px;}

/* Type */
.hx-h1{font-family:var(--display);font-weight:700;color:var(--ink);font-size:clamp(2.4rem,5.6vw,4.3rem);line-height:1.02;letter-spacing:-0.035em;margin:0 0 24px;max-width:12ch;}
.hx-h2{font-family:var(--display);font-weight:700;color:var(--ink);font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-0.025em;margin:0 0 14px;}
.hx-h3{font-family:var(--display);font-weight:600;color:var(--ink);font-size:1.2rem;line-height:1.3;letter-spacing:-0.01em;margin:0 0 8px;}
.hx-lead{font-size:clamp(1.03rem,1.6vw,1.16rem);color:var(--text);max-width:62ch;margin:0;}
.hx-muted{color:var(--muted);margin:0;}
.hx-link{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;}
.hx-link:hover{color:var(--accent-press);text-decoration-thickness:2px;}

/* Buttons */
.hx-btn{font-family:var(--body);font-weight:600;font-size:0.95rem;border-radius:999px;padding:10px 20px;cursor:pointer;border:1px solid transparent;line-height:1.2;transition:background-color .15s ease,border-color .15s ease,color .15s ease;white-space:nowrap;}
.hx-btn-lg{font-size:1.02rem;padding:14px 26px;}
.hx-btn-block{width:100%;}
.hx-btn-primary{background:var(--accent);color:#fff;}
.hx-btn-primary:hover{background:var(--accent-press);}
.hx-btn-primary:disabled{opacity:.6;cursor:progress;}
.hx-btn-ghost{background:var(--paper);color:var(--ink);border-color:#CFD2CC;}
.hx-btn-ghost:hover{border-color:var(--ink);}

/* Nav */
.hx-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
.hx-nav-inner{display:flex;align-items:center;gap:28px;height:68px;}
.hx-nav-brand{text-decoration:none;display:flex;}
.hx-brand{display:inline-flex;align-items:center;gap:10px;}
.hx-brand-word{font-family:var(--display);font-weight:700;font-size:1rem;letter-spacing:0.16em;color:var(--ink);}
.hx-nav-links{display:flex;gap:26px;margin-left:8px;}
.hx-nav-links a{text-decoration:none;color:var(--muted);font-size:0.95rem;font-weight:500;}
.hx-nav-links a:hover{color:var(--ink);}
.hx-nav-actions{display:flex;gap:10px;align-items:center;margin-left:auto;}
.hx-menu-btn{display:none;width:42px;height:42px;border-radius:999px;border:1px solid #CFD2CC;background:var(--paper);cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:4px;}
.hx-menu-btn span{display:block;width:16px;height:2px;background:var(--ink);border-radius:2px;}
.hx-mobile-menu{display:flex;flex-direction:column;gap:2px;padding:12px 24px 20px;border-top:1px solid var(--line);background:var(--paper);}
.hx-mobile-menu a{text-decoration:none;padding:10px 0;font-weight:500;color:var(--ink);}
.hx-mobile-menu .hx-btn{margin-top:8px;}

/* Hero */
.hx-hero{padding:80px 0 0;}
.hx-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:40px;align-items:center;}
.hx-hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;}
.hx-hero-login{margin:20px 0 0;color:var(--muted);font-size:0.95rem;}
.hx-hero-login a{color:var(--accent);font-weight:600;}
.hx-traj{width:100%;height:auto;display:block;}
.hx-traj-label{font-family:var(--body);font-weight:700;font-size:16px;fill:var(--ink);}
.hx-traj-sub{font-family:var(--body);font-size:13px;fill:var(--muted);}
.hx-traj-path{stroke-dasharray:1;stroke-dashoffset:1;animation:hxDraw 1.5s cubic-bezier(.45,.05,.25,1) .15s forwards;}
.hx-traj-head,.hx-traj-dot{opacity:0;animation:hxFade .4s ease 1.55s forwards;}
.hx-traj-stop{opacity:0;animation:hxFade .45s ease forwards;}
@keyframes hxDraw{to{stroke-dashoffset:0;}}
@keyframes hxFade{to{opacity:1;}}

.hx-facts{display:grid;grid-template-columns:repeat(4,1fr);margin:64px 0 0;border-top:1px solid var(--line);}
.hx-facts > div{padding:26px 0 34px;display:flex;flex-direction:column-reverse;gap:2px;}
.hx-facts > div + div{padding-left:24px;border-left:1px solid var(--line);}
.hx-facts dd{margin:0;font-family:var(--display);font-weight:700;font-size:clamp(1.7rem,2.8vw,2.3rem);letter-spacing:-0.02em;color:var(--ink);}
.hx-facts dt{color:var(--muted);font-size:0.93rem;}

/* Sections */
.hx-section{padding:100px 0;}
.hx-section-panel{background:var(--mist);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.hx-section-head{margin-bottom:44px;}
.hx-split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:56px;align-items:start;}

/* Domain explorer */
.hx-explorer{display:grid;grid-template-columns:260px minmax(0,1fr);border:1px solid var(--line);border-radius:20px;background:var(--paper);overflow:hidden;}
.hx-tabs{display:flex;flex-direction:column;border-right:1px solid var(--line);padding:10px;}
.hx-tab{all:unset;cursor:pointer;padding:11px 14px;border-radius:12px;color:var(--muted);font-weight:500;font-size:0.96rem;}
.hx-tab:hover{color:var(--ink);}
.hx-tab[aria-selected="true"]{color:var(--accent-press);background:var(--accent-soft);font-weight:600;}
.hx-tab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;}
.hx-panel{padding:34px 38px;}
.hx-panel-title{font-family:var(--display);font-weight:700;color:var(--ink);font-size:1.6rem;letter-spacing:-0.02em;margin:0 0 6px;}
.hx-panel-blurb{color:var(--text);margin:0 0 24px;}
.hx-panel-note{color:var(--muted);font-size:0.92rem;margin:0 0 10px;}
.hx-ladder{list-style:none;margin:0 0 28px;padding:0;position:relative;}
.hx-ladder::before{content:"";position:absolute;left:7px;top:20px;bottom:20px;width:2px;background:var(--line);}
.hx-rung{position:relative;padding:12px 0 12px 32px;display:grid;grid-template-columns:120px minmax(0,1fr);column-gap:16px;row-gap:2px;}
.hx-rung::before{content:"";position:absolute;left:1px;top:19px;width:14px;height:14px;border-radius:50%;background:var(--paper);border:3px solid #B9BDB5;}
.hx-rung:last-child::before{border-color:var(--accent);background:var(--accent);}
.hx-rung-level{color:var(--muted);font-size:0.9rem;grid-row:span 2;padding-top:2px;}
.hx-rung-title{font-weight:700;color:var(--ink);}
.hx-rung-tech{color:var(--muted);font-size:0.9rem;}

.hx-steps-title{margin-top:68px;margin-bottom:20px;}
.hx-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:28px;}
.hx-steps li{border-top:1px solid #CFD2CC;padding-top:18px;}
.hx-steps strong{display:block;margin:12px 0 6px;font-size:1.03rem;color:var(--ink);}
.hx-steps p{margin:0;color:var(--muted);font-size:0.95rem;}
.hx-step-n{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-weight:700;font-size:0.82rem;}
.hx-cta-row{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:44px;}

/* Academy */
.hx-courses{list-style:none;padding:0;margin:28px 0 32px;display:flex;flex-wrap:wrap;gap:8px;}
.hx-courses li{border:1px solid var(--line);background:var(--paper);border-radius:999px;padding:6px 14px;font-size:0.9rem;color:var(--text);}
.hx-aside{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--mist);}
.hx-aside .hx-muted{margin:0 0 22px;}

/* Services */
.hx-services{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0;border-top:1px solid var(--line);}
.hx-services > div{padding:26px 28px 26px 0;border-bottom:1px solid var(--line);}
.hx-services > div:not(:nth-child(3n+1)){padding-left:28px;border-left:1px solid var(--line);}
.hx-services dt{font-weight:700;color:var(--ink);margin-bottom:6px;}
.hx-services dd{margin:0;color:var(--muted);font-size:0.95rem;}
.hx-industries{color:var(--text);margin:28px 0 0;}
.hx-process{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:14px 30px;}
.hx-process li{display:flex;align-items:center;gap:10px;font-weight:600;color:var(--ink);}

/* Client work */
.hx-case{border:1px solid var(--line);border-radius:20px;padding:34px;margin-bottom:20px;background:var(--paper);}
.hx-case-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;}
.hx-badge{font-size:0.82rem;font-weight:600;color:var(--accent-press);background:var(--accent-soft);border-radius:999px;padding:5px 12px;white-space:nowrap;}
.hx-case-built{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:20px;}
.hx-case-built strong{display:block;margin-bottom:4px;color:var(--ink);}
.hx-case-built p{margin:0;color:var(--muted);font-size:0.94rem;}
.hx-case-stack{color:var(--muted);font-size:0.94rem;margin:0 0 20px;}
.hx-case-results{display:flex;flex-wrap:wrap;gap:44px;margin:0;padding-top:22px;border-top:1px solid var(--line);}
.hx-case-results > div{display:flex;flex-direction:column;}
.hx-case-results dd{margin:0;font-family:var(--display);font-weight:700;font-size:1.8rem;letter-spacing:-0.02em;color:var(--ink);}
.hx-case-results dt{color:var(--muted);font-size:0.9rem;}
.hx-nda{color:var(--muted);margin:28px 0 0;max-width:80ch;}
.hx-nda strong{color:var(--ink);font-weight:600;}

/* Form */
.hx-form{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--paper);}
.hx-form-done .hx-muted{margin:0 0 20px;}
.hx-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.hx-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.hx-form-grid .hx-field{margin-bottom:0;}
.hx-field > span{font-size:0.9rem;font-weight:600;color:var(--ink);}
.hx-field em{font-style:normal;color:var(--muted);font-weight:400;}
.hx-field input,.hx-field select,.hx-field textarea{font:inherit;font-size:0.96rem;color:var(--ink);background:var(--paper);border:1px solid #CFD2CC;border-radius:12px;padding:11px 13px;outline:none;width:100%;}
.hx-field input,.hx-field select{min-height:46px;}
.hx-field textarea{resize:vertical;}
.hx-field input::placeholder,.hx-field textarea::placeholder{color:#9A9EA5;}
.hx-field input:focus,.hx-field select:focus,.hx-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(11,122,85,.15);}
.hx-contact-alt{margin-top:20px;}

/* Footer */
.hx-footer{border-top:1px solid var(--line);padding:60px 0 32px;background:var(--paper);}
.hx-footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:32px;}
.hx-footer-blurb{margin:14px 0 12px;max-width:34ch;font-size:0.95rem;}
.hx-footer h4{font-size:0.95rem;font-weight:700;color:var(--ink);margin:0 0 12px;}
.hx-footer ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.hx-footer ul a{text-decoration:none;color:var(--muted);font-size:0.94rem;}
.hx-footer ul a:hover{color:var(--ink);}
.hx-footer-legal{margin-top:40px;padding-top:24px;border-top:1px solid var(--line);color:var(--muted);font-size:0.85rem;}

/* Responsive */
@media (max-width: 960px){
  .hx-nav-links{display:none;}
  .hx-menu-btn{display:inline-flex;}
  .hx-hero-grid{grid-template-columns:1fr;}
  .hx-hero-visual{max-width:520px;}
  .hx-split{grid-template-columns:1fr;gap:40px;}
  .hx-steps{grid-template-columns:1fr 1fr;}
  .hx-services{grid-template-columns:1fr 1fr;}
  .hx-services > div{padding:22px 20px 22px 0 !important;border-left:none !important;}
  .hx-services > div:nth-child(2n){padding-left:20px !important;border-left:1px solid var(--line) !important;}
  .hx-footer-grid{grid-template-columns:1fr 1fr;}
}
@media (max-width: 720px){
  .hx-root{font-size:16px;}
  .hx-hide-sm{display:none;}
  .hx-traj-label{font-size:21px;}
  .hx-traj-sub{font-size:17px;}
  .hx-hero{padding-top:44px;}
  .hx-section{padding:72px 0;}
  .hx-facts{grid-template-columns:1fr 1fr;}
  .hx-facts > div:nth-child(3){padding-left:0;border-left:none;}
  .hx-facts > div:nth-child(n+3){border-top:1px solid var(--line);}
  .hx-explorer{grid-template-columns:1fr;}
  .hx-tabs{flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid var(--line);scrollbar-width:none;}
  .hx-tab{white-space:nowrap;}
  .hx-panel{padding:24px 20px;}
  .hx-rung{grid-template-columns:1fr;}
  .hx-rung-level{grid-row:auto;}
  .hx-steps{grid-template-columns:1fr;}
  .hx-services{grid-template-columns:1fr;}
  .hx-services > div,.hx-services > div:nth-child(2n){padding:20px 0 !important;border-left:none !important;}
  .hx-form-grid{grid-template-columns:1fr;}
  .hx-case{padding:24px 20px;}
  .hx-footer-grid{grid-template-columns:1fr;}
}
@media (max-width: 420px){
  .hx-nav-actions .hx-btn-primary{padding:9px 14px;font-size:0.88rem;}
  .hx-brand-word{display:none;}
}
@media (prefers-reduced-motion: reduce){
  .hx-traj-path{animation:none;stroke-dashoffset:0;}
  .hx-traj-head,.hx-traj-dot,.hx-traj-stop{animation:none;opacity:1;}
  .hx-btn{transition:none;}
}
`;