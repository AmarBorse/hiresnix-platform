// src/pages/LandingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ══════════════════════════════════════════════════════════════
   HIRESNIX — Landing Page
   Design: "the document is the product"
   Ink navy · signal blue · seal gold
   ══════════════════════════════════════════════════════════════ */

const DOMAINS = [
  'Data Science', 'Machine Learning', 'Artificial Intelligence',
  'Full Stack Development', 'Front End Development', 'Data Analyst',
  'Cloud Computing', 'DevOps', 'Cyber Security',
  'App Development', 'UI/UX Design', 'Software Testing',
  'Blockchain Development', 'HR Assistant', 'Python Development',
];

const STEPS = [
  {
    n: '1',
    title: 'Pick your domain',
    body: 'Fifteen tracks, from machine learning to UI/UX. Choose the one you want to build a career in.',
    time: '2 minutes',
  },
  {
    n: '2',
    title: 'Get approved instantly',
    body: 'No waiting for an admin to review. Your enrollment is confirmed the moment you submit the form.',
    time: 'Instant',
  },
  {
    n: '3',
    title: 'Download your offer letter',
    body: 'A signed PDF with your name, your domain and a QR code anyone can scan to verify it.',
    time: 'Same day',
  },
  {
    n: '4',
    title: 'Build, log, finish',
    body: 'Three staged projects and a daily work log. Finish the duration and your certificate generates itself.',
    time: '1–6 months',
  },
];

const TOOLS = [
  {
    name: 'Mock Interview',
    line: 'Speak your answers. An AI interviewer scores them and tells you which topics you keep fumbling.',
    tag: 'Voice',
  },
  {
    name: 'Resume AI',
    line: 'Fill in your details once. Get a resume that actually clears applicant tracking filters.',
    tag: 'PDF out',
  },
  {
    name: 'Career Roadmap',
    line: '29 roadmaps, 3,000+ topics. Tick things off as you learn them and watch the bar move.',
    tag: 'Progress',
  },
  {
    name: 'AI Academy',
    line: '16 courses where you write code in the browser and it runs. No local setup needed.',
    tag: 'Runs code',
  },
  {
    name: 'Logic Builder',
    line: 'A short problem every day. Think it through before you code — the AI checks your reasoning.',
    tag: 'Daily',
  },
  {
    name: 'Portfolio page',
    line: 'Your profile becomes a public link you can put on a resume. Projects, certificates, skills.',
    tag: 'Public URL',
  },
];

const FAQS = [
  {
    q: 'Is the internship paid?',
    a: 'No. Hiresnix internships are unpaid learning programmes. You get real projects, mentorship, verifiable documents and job-application support — not a stipend.',
  },
  {
    q: 'Is it remote?',
    a: 'Yes, fully remote with flexible hours. Most students spend about 15–20 hours a week on it alongside college.',
  },
  {
    q: 'Do I have to submit the projects to get a certificate?',
    a: 'Project submission is recommended but not mandatory. Your certificate, completion letter and LOR generate once the internship duration finishes.',
  },
  {
    q: 'Can an employer check if my certificate is real?',
    a: 'Every document carries a unique ID and a QR code. Scanning it opens a Hiresnix verification page that confirms the name, domain and dates.',
  },
  {
    q: 'What does it cost?',
    a: 'Applying, the offer letter, all AI tools and the portal are free for a year. There is a one-time ₹100 charge to unlock your three completion documents at the end.',
  },
  {
    q: 'My college wants to enroll a whole batch.',
    a: 'Institutions get their own dashboard with bulk enrollment, progress tracking and placement reports. Write to hr@hiresnix.co.in and we will set it up.',
  },
];

/* ── Offer letter artifact ─────────────────────────────────── */
function OfferLetterCard() {
  const NAMES = ['Neha Lohar', 'Snehal Mankar', 'Rohan Patil', 'Aarti Deshmukh'];
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setTyped(NAMES[0]); return; }

    const full = NAMES[idx];
    if (paused) {
      const t = setTimeout(() => {
        setPaused(false);
        setTyped('');
        setIdx(i => (i + 1) % NAMES.length);
      }, 2600);
      return () => clearTimeout(t);
    }
    if (typed.length < full.length) {
      const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 65);
      return () => clearTimeout(t);
    }
    setPaused(true);
  }, [typed, idx, paused]);

  return (
    <div className="hx-doc-stack" aria-hidden="true">
      <div className="hx-doc hx-doc--back2" />
      <div className="hx-doc hx-doc--back1" />
      <div className="hx-doc hx-doc--front">
        <div className="hx-doc__head">
          <div>
            <div className="hx-doc__brand">HIRESNIX</div>
            <div className="hx-doc__brandsub">Empowering future professionals</div>
          </div>
          <div className="hx-doc__kind">Internship offer letter</div>
        </div>

        <div className="hx-doc__meta">
          <div>
            <span>Offer letter ID</span>
            <strong>HSH-INT-2026-8DE8</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>07 / 08 / 2026</strong>
          </div>
        </div>

        <div className="hx-doc__to">
          To,
          <strong className="hx-doc__name">
            {typed}
            <i className="hx-caret" />
          </strong>
        </div>

        <p className="hx-doc__body">
          We are pleased to offer you the position of <b>Data Science Intern</b> at
          Hiresnix. Your internship details are as follows:
        </p>

        <div className="hx-doc__grid">
          <div><span>Position</span><strong>Data Science Intern</strong></div>
          <div><span>Start date</span><strong>10 / 08 / 2026</strong></div>
          <div><span>Duration</span><strong>6 Months</strong></div>
          <div><span>Mode</span><strong>Remote</strong></div>
        </div>

        <div className="hx-doc__foot">
          <div className="hx-doc__sign">
            <div className="hx-doc__signline" />
            <strong>Jayesh Badgujar</strong>
            <span>Program Director</span>
          </div>
          <div className="hx-doc__qr">
            <QrGlyph />
            <span>Scan to verify</span>
          </div>
        </div>
      </div>

      <div className="hx-seal">
        <span className="hx-seal__top">Verified</span>
        <span className="hx-seal__mid">QR</span>
        <span className="hx-seal__bot">on every document</span>
      </div>
    </div>
  );
}

function QrGlyph() {
  // deterministic pseudo-QR
  const cells: boolean[] = [];
  let s = 7;
  for (let i = 0; i < 121; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    cells.push((s >> 16) % 100 > 46);
  }
  const finder = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
  return (
    <svg viewBox="0 0 11 11" className="hx-qr" role="img" aria-label="QR code">
      {cells.map((on, i) => {
        const r = Math.floor(i / 11), c = i % 11;
        const show = finder(r, c) ? ((r + c) % 2 === 0 || (r < 3 && c < 3)) : on;
        return show ? <rect key={i} x={c} y={r} width="1" height="1" /> : null;
      })}
    </svg>
  );
}

/* ── Counter ───────────────────────────────────────────────── */
function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(value); return; }

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      const dur = 900, t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div className="hx-stat" ref={ref}>
      <div className="hx-stat__n">{n.toLocaleString('en-IN')}{suffix}</div>
      <div className="hx-stat__l">{label}</div>
    </div>
  );
}

/* ── FAQ ───────────────────────────────────────────────────── */
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="hx-faq">
      {FAQS.map((f, i) => (
        <div key={f.q} className={`hx-faq__item ${open === i ? 'is-open' : ''}`}>
          <button
            className="hx-faq__q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{f.q}</span>
            <i className="hx-faq__mark" />
          </button>
          <div className="hx-faq__a"><p>{f.a}</p></div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const [navSolid, setNavSolid] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hx">
      <style>{CSS}</style>

      {/* ── Nav ───────────────────────────────────────────── */}
      <header className={`hx-nav ${navSolid ? 'is-solid' : ''}`}>
        <div className="hx-nav__in">
          <Link to="/" className="hx-logo">
            <ArrowMark />
            <span>Hiresnix</span>
          </Link>

          <nav className="hx-nav__links">
            <a href="#how">How it works</a>
            <a href="#domains">Domains</a>
            <a href="#tools">Tools</a>
            <a href="#partners">For colleges</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="hx-nav__cta">
            <Link to="/auth" className="hx-btn hx-btn--ghost">Sign in</Link>
            <Link to="/auth" className="hx-btn hx-btn--gold">Apply now</Link>
          </div>

          <button
            className="hx-burger"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu(m => !m)}
          >
            <span /><span /><span />
          </button>
        </div>

        {menu && (
          <div className="hx-mobilemenu">
            <a href="#how" onClick={() => setMenu(false)}>How it works</a>
            <a href="#domains" onClick={() => setMenu(false)}>Domains</a>
            <a href="#tools" onClick={() => setMenu(false)}>Tools</a>
            <a href="#partners" onClick={() => setMenu(false)}>For colleges</a>
            <a href="#faq" onClick={() => setMenu(false)}>FAQ</a>
            <Link to="/auth" className="hx-btn hx-btn--gold">Apply now</Link>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hx-hero">
        <div className="hx-hero__in">
          <div className="hx-hero__copy">
            <p className="hx-hero__kicker">
              Built in Shirpur for students everywhere in India
            </p>

            <h1 className="hx-hero__h1">
              Your first offer letter
              <br />
              takes about two minutes.
            </h1>

            <p className="hx-hero__sub">
              Hiresnix runs remote internships in fifteen technical domains. Pick a
              track, submit the form, and a signed offer letter with your name on it
              is ready to download. Finish the duration and your certificate, completion
              letter and recommendation generate on their own.
            </p>

            <div className="hx-hero__actions">
              <Link to="/auth" className="hx-btn hx-btn--gold hx-btn--lg">
                Apply for an internship
              </Link>
              <a href="#how" className="hx-btn hx-btn--outline hx-btn--lg">
                See how it works
              </a>
            </div>

            <ul className="hx-hero__proof">
              <li>Free for a year</li>
              <li>No interview to get in</li>
              <li>QR-verified documents</li>
            </ul>
          </div>

          <div className="hx-hero__art">
            <OfferLetterCard />
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────── */}
      <section className="hx-strip">
        <div className="hx-strip__in">
          <Stat value={274} suffix="+" label="students enrolled" />
          <Stat value={15} label="domains open" />
          <Stat value={235} suffix="+" label="projects assigned" />
          <Stat value={149} label="interns active now" />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="hx-sec" id="how">
        <div className="hx-wrap">
          <header className="hx-sechead">
            <h2>Four steps, no gatekeeping</h2>
            <p>
              Most internship portals make you wait weeks for someone to open your
              application. Nothing here waits on a human.
            </p>
          </header>

          <ol className="hx-steps">
            {STEPS.map(s => (
              <li className="hx-step" key={s.n}>
                <div className="hx-step__n">{s.n}</div>
                <div className="hx-step__body">
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <span className="hx-step__time">{s.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Documents ─────────────────────────────────────── */}
      <section className="hx-sec hx-sec--ink">
        <div className="hx-wrap">
          <header className="hx-sechead hx-sechead--light">
            <h2>Four documents you can actually show someone</h2>
            <p>
              Each one carries a unique ID and a QR code. A recruiter scans it and
              lands on a Hiresnix page confirming it is real.
            </p>
          </header>

          <div className="hx-docs">
            {[
              { t: 'Offer letter', d: 'Issued the day you apply. Position, dates, mode and working hours, signed by the Program Director.', when: 'Day one' },
              { t: 'Completion certificate', d: 'Generated automatically once your internship duration ends. Carries your domain and dates.', when: 'On finish' },
              { t: 'Completion letter', d: 'A formal letter on Hiresnix letterhead confirming what you worked on during the internship.', when: 'On finish' },
              { t: 'Letter of recommendation', d: 'Written against your performance, attendance and the projects you submitted.', when: 'On finish' },
            ].map(x => (
              <article className="hx-docitem" key={x.t}>
                <span className="hx-docitem__when">{x.when}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </article>
            ))}
          </div>

          <p className="hx-note">
            Applying, the portal and all AI tools stay free for a year. Unlocking your
            three completion documents at the end is a one-time&nbsp;₹100.
          </p>
        </div>
      </section>

      {/* ── Domains ───────────────────────────────────────── */}
      <section className="hx-sec" id="domains">
        <div className="hx-wrap">
          <header className="hx-sechead">
            <h2>Fifteen domains</h2>
            <p>
              Every domain comes with three staged projects — one simple, one
              intermediate, one that belongs in your portfolio.
            </p>
          </header>

          <ul className="hx-domains">
            {DOMAINS.map(d => (
              <li key={d}><Link to="/auth">{d}</Link></li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Tools ─────────────────────────────────────────── */}
      <section className="hx-sec hx-sec--tint" id="tools">
        <div className="hx-wrap">
          <header className="hx-sechead">
            <h2>The rest of the portal</h2>
            <p>
              The internship is the reason students sign up. These are the things that
              keep them logged in.
            </p>
          </header>

          <div className="hx-tools">
            {TOOLS.map(t => (
              <article className="hx-tool" key={t.name}>
                <div className="hx-tool__top">
                  <h3>{t.name}</h3>
                  <span>{t.tag}</span>
                </div>
                <p>{t.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ──────────────────────────────────────── */}
      <section className="hx-sec" id="partners">
        <div className="hx-wrap">
          <div className="hx-split">
            <article className="hx-panel">
              <h3>Colleges</h3>
              <p>
                Enroll a whole batch at once and watch progress from a single
                dashboard — who started, who is logging work, who finished.
              </p>
              <ul>
                <li>Bulk enrollment from a spreadsheet</li>
                <li>Live progress per student</li>
                <li>Institution-branded certificates</li>
                <li>Placement and completion reports</li>
                <li>No cost to the institution</li>
              </ul>
              <a className="hx-btn hx-btn--outline" href="mailto:hr@hiresnix.co.in?subject=Institution%20partnership">
                Talk to us about a batch
              </a>
            </article>

            <article className="hx-panel hx-panel--gold">
              <h3>Companies</h3>
              <p>
                Post a role and look through students who have already finished a
                domain internship, submitted projects and hold verified documents.
              </p>
              <ul>
                <li>Free job listings</li>
                <li>274+ profiles with real project work</li>
                <li>Filter by domain and skill</li>
                <li>Applications managed in one place</li>
                <li>No platform hiring fee</li>
              </ul>
              <a className="hx-btn hx-btn--ink" href="mailto:hr@hiresnix.co.in?subject=Hiring%20through%20Hiresnix">
                Post a role
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="hx-sec hx-sec--tint" id="faq">
        <div className="hx-wrap hx-wrap--narrow">
          <header className="hx-sechead">
            <h2>Questions students ask</h2>
          </header>
          <Faq />
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="hx-final">
        <div className="hx-wrap">
          <h2>Fifteen domains are open right now.</h2>
          <p>
            Pick one, fill the form, and download your offer letter before you close
            the tab.
          </p>
          <Link to="/auth" className="hx-btn hx-btn--gold hx-btn--lg">
            Apply for an internship
          </Link>
          <span className="hx-final__fine">
            Applying is free. The work is remote and the hours are yours to set.
          </span>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="hx-foot">
        <div className="hx-wrap hx-foot__in">
          <div className="hx-foot__brand">
            <Link to="/" className="hx-logo hx-logo--light">
              <ArrowMark />
              <span>Hiresnix</span>
            </Link>
            <p>
              Remote internships, AI career tools and verifiable documents for
              students across India.
            </p>
            <p className="hx-foot__co">
              Operated by SR Patil Infrastructure Private Limited<br />
              Shirpur, Maharashtra
            </p>
          </div>

          <div className="hx-foot__col">
            <h4>Students</h4>
            <Link to="/auth">Apply</Link>
            <Link to="/auth">Sign in</Link>
            <a href="#domains">Domains</a>
            <a href="#tools">Tools</a>
          </div>

          <div className="hx-foot__col">
            <h4>Organisations</h4>
            <a href="#partners">Colleges</a>
            <a href="#partners">Companies</a>
            <Link to="/careers">Careers</Link>
            <Link to="/verification">Verify a document</Link>
          </div>

          <div className="hx-foot__col">
            <h4>Contact</h4>
            <a href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a>
            <a href="tel:+919322690710">+91 93226 90710</a>
            <a href="https://www.linkedin.com/company/hiresnix/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>

        <div className="hx-foot__bar">
          <span>© {new Date().getFullYear()} SR Patil Infrastructure Private Limited</span>
          <span>Elevating talent. Empowering futures.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Logo mark ─────────────────────────────────────────────── */
function ArrowMark() {
  return (
    <svg viewBox="0 0 32 32" className="hx-mark" aria-hidden="true">
      <path
        d="M3 25c6-1.5 11-6 15.5-13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M15 9.5 L23 7 L21.5 15 Z" fill="currentColor" />
      <circle cx="26.5" cy="5.5" r="3.2" fill="currentColor" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap');

.hx{
  --ink:#0A1628;
  --ink-2:#132339;
  --paper:#FFFFFF;
  --mist:#F2F5F9;
  --line:#DFE5EE;
  --body:#43526A;
  --blue:#2563EB;
  --gold:#C9A227;
  --gold-soft:#F5E9C4;

  --display:'Bricolage Grotesque',system-ui,sans-serif;
  --text:'Inter',system-ui,sans-serif;

  background:var(--paper);
  color:var(--ink);
  font-family:var(--text);
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
.hx *{box-sizing:border-box;}
.hx h1,.hx h2,.hx h3,.hx h4{font-family:var(--display);margin:0;letter-spacing:-.02em;}
.hx p{margin:0;}
.hx a{color:inherit;text-decoration:none;}
.hx ul,.hx ol{margin:0;padding:0;list-style:none;}
.hx :focus-visible{outline:2.5px solid var(--blue);outline-offset:3px;border-radius:4px;}

.hx-wrap{max-width:1140px;margin:0 auto;padding:0 24px;}
.hx-wrap--narrow{max-width:780px;}

/* ── Buttons ─────────────────────────────────────────── */
.hx-btn{
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--text);font-weight:600;font-size:14.5px;
  padding:11px 20px;border-radius:8px;border:1.5px solid transparent;
  cursor:pointer;transition:background .16s,color .16s,border-color .16s;
  white-space:nowrap;
}
.hx-btn--lg{padding:15px 30px;font-size:16px;}
.hx-btn--gold{background:var(--gold);color:#20180B;border-color:var(--gold);}
.hx-btn--gold:hover{background:#B8931F;border-color:#B8931F;}
.hx-btn--ink{background:var(--ink);color:#fff;border-color:var(--ink);}
.hx-btn--ink:hover{background:var(--ink-2);}
.hx-btn--outline{border-color:var(--line);color:var(--ink);background:transparent;}
.hx-btn--outline:hover{border-color:var(--ink);background:var(--mist);}
.hx-btn--ghost{color:var(--body);background:transparent;}
.hx-btn--ghost:hover{color:var(--ink);}

/* ── Nav ─────────────────────────────────────────────── */
.hx-nav{position:sticky;top:0;z-index:60;transition:background .2s,box-shadow .2s,border-color .2s;
  border-bottom:1px solid transparent;background:rgba(255,255,255,0);}
.hx-nav.is-solid{background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom-color:var(--line);}
.hx-nav__in{max-width:1140px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:28px;}
.hx-logo{display:flex;align-items:center;gap:9px;font-family:var(--display);
  font-weight:800;font-size:20px;letter-spacing:-.03em;color:var(--ink);}
.hx-logo--light{color:#fff;}
.hx-mark{width:26px;height:26px;color:var(--blue);flex:none;}
.hx-logo--light .hx-mark{color:var(--gold);}
.hx-nav__links{display:flex;gap:26px;margin-left:auto;font-size:14.5px;color:var(--body);font-weight:500;}
.hx-nav__links a:hover{color:var(--ink);}
.hx-nav__cta{display:flex;gap:8px;align-items:center;}
.hx-burger{display:none;margin-left:auto;background:none;border:0;padding:8px;cursor:pointer;}
.hx-burger span{display:block;width:22px;height:2px;background:var(--ink);margin:4px 0;border-radius:2px;}
.hx-mobilemenu{display:none;flex-direction:column;gap:4px;padding:8px 24px 20px;
  background:#fff;border-bottom:1px solid var(--line);}
.hx-mobilemenu a{padding:11px 0;font-weight:500;color:var(--body);border-bottom:1px solid var(--mist);}
.hx-mobilemenu .hx-btn{margin-top:12px;}

/* ── Hero ────────────────────────────────────────────── */
.hx-hero{padding:76px 0 84px;background:
  radial-gradient(900px 420px at 88% 6%, #EEF3FB 0%, rgba(238,243,251,0) 62%);}
.hx-hero__in{max-width:1140px;margin:0 auto;padding:0 24px;
  display:grid;grid-template-columns:1.02fr .98fr;gap:56px;align-items:center;}
.hx-hero__kicker{font-size:13px;font-weight:600;color:var(--body);
  padding-left:14px;border-left:2.5px solid var(--gold);margin-bottom:22px;}
.hx-hero__h1{font-size:clamp(38px,5.2vw,60px);line-height:1.03;font-weight:800;}
.hx-hero__sub{margin-top:22px;font-size:17px;line-height:1.65;color:var(--body);max-width:56ch;}
.hx-hero__actions{margin-top:30px;display:flex;gap:11px;flex-wrap:wrap;}
.hx-hero__proof{margin-top:26px;display:flex;flex-wrap:wrap;gap:8px 22px;
  font-size:13.5px;color:var(--body);}
.hx-hero__proof li{display:flex;align-items:center;gap:8px;}
.hx-hero__proof li::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold);}

/* ── Offer letter artifact ───────────────────────────── */
.hx-hero__art{position:relative;}
.hx-doc-stack{position:relative;perspective:1400px;}
.hx-doc{position:absolute;inset:0;background:#fff;border:1px solid var(--line);border-radius:6px;}
.hx-doc--back2{transform:rotate(-4.5deg) translate(-14px,12px);opacity:.5;
  box-shadow:0 10px 30px rgba(10,22,40,.06);}
.hx-doc--back1{transform:rotate(-2deg) translate(-7px,6px);opacity:.75;
  box-shadow:0 12px 34px rgba(10,22,40,.07);}
.hx-doc--front{position:relative;transform:rotate(1.4deg);
  box-shadow:0 26px 64px rgba(10,22,40,.16);padding:0;overflow:hidden;}

.hx-doc__head{background:var(--ink);color:#fff;padding:16px 20px;
  display:flex;justify-content:space-between;align-items:flex-start;gap:12px;
  border-bottom:2.5px solid var(--gold);}
.hx-doc__brand{font-family:var(--display);font-weight:800;font-size:17px;letter-spacing:-.02em;}
.hx-doc__brandsub{font-size:9.5px;color:#8FA3BF;margin-top:1px;}
.hx-doc__kind{font-size:10px;font-weight:600;color:var(--gold-soft);text-align:right;max-width:110px;line-height:1.3;}

.hx-doc__meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;
  padding:13px 20px;background:var(--mist);border-bottom:1px solid var(--line);}
.hx-doc__meta span{display:block;font-size:8.5px;color:#7C8CA4;font-weight:600;margin-bottom:2px;}
.hx-doc__meta strong{font-size:11.5px;color:var(--ink);font-weight:700;}

.hx-doc__to{padding:16px 20px 0;font-size:11.5px;color:var(--body);}
.hx-doc__name{display:block;font-family:var(--display);font-weight:700;
  font-size:19px;color:var(--ink);margin-top:3px;min-height:24px;}
.hx-caret{display:inline-block;width:2px;height:16px;background:var(--blue);
  margin-left:2px;vertical-align:-2px;animation:hxblink 1s step-end infinite;}
@keyframes hxblink{50%{opacity:0}}

.hx-doc__body{padding:11px 20px 0;font-size:11.5px;line-height:1.6;color:var(--body);}
.hx-doc__body b{color:var(--ink);}

.hx-doc__grid{margin:14px 20px;display:grid;grid-template-columns:1fr 1fr;
  border:1px solid var(--line);border-radius:5px;overflow:hidden;}
.hx-doc__grid > div{padding:9px 12px;border-bottom:1px solid var(--line);}
.hx-doc__grid > div:nth-child(odd){border-right:1px solid var(--line);}
.hx-doc__grid > div:nth-last-child(-n+2){border-bottom:0;}
.hx-doc__grid span{display:block;font-size:8px;color:#7C8CA4;font-weight:600;margin-bottom:2px;}
.hx-doc__grid strong{font-size:11px;color:var(--ink);}

.hx-doc__foot{display:flex;justify-content:space-between;align-items:flex-end;
  padding:0 20px 18px;gap:16px;}
.hx-doc__signline{width:78px;height:22px;
  background:
    radial-gradient(circle at 12% 74%, var(--ink) 1.4px, transparent 1.5px),
    radial-gradient(circle at 34% 30%, var(--ink) 1.4px, transparent 1.5px),
    radial-gradient(circle at 58% 76%, var(--ink) 1.4px, transparent 1.5px),
    radial-gradient(circle at 82% 34%, var(--ink) 1.4px, transparent 1.5px);
  opacity:.5;margin-bottom:3px;}
.hx-doc__sign strong{display:block;font-size:11px;color:var(--ink);}
.hx-doc__sign span{font-size:9px;color:#7C8CA4;}
.hx-doc__qr{text-align:center;}
.hx-qr{width:44px;height:44px;fill:var(--ink);display:block;}
.hx-doc__qr span{display:block;font-size:7.5px;color:#7C8CA4;margin-top:3px;font-weight:600;}

.hx-seal{position:absolute;right:-14px;bottom:-22px;width:104px;height:104px;
  border-radius:50%;background:var(--gold);color:#20180B;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:10px;box-shadow:0 14px 34px rgba(201,162,39,.34);
  transform:rotate(-9deg);}
.hx-seal__top{font-size:9px;font-weight:700;letter-spacing:.04em;}
.hx-seal__mid{font-family:var(--display);font-weight:800;font-size:26px;line-height:1;margin:2px 0;}
.hx-seal__bot{font-size:8px;font-weight:600;line-height:1.25;opacity:.75;}

/* ── Stat strip ──────────────────────────────────────── */
.hx-strip{background:var(--ink);color:#fff;}
.hx-strip__in{max-width:1140px;margin:0 auto;padding:34px 24px;
  display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
.hx-stat__n{font-family:var(--display);font-weight:800;font-size:38px;
  line-height:1;color:var(--gold);letter-spacing:-.03em;}
.hx-stat__l{margin-top:6px;font-size:13px;color:#93A6C2;}

/* ── Sections ────────────────────────────────────────── */
.hx-sec{padding:84px 0;}
.hx-sec--tint{background:var(--mist);}
.hx-sec--ink{background:var(--ink);color:#fff;}
.hx-sechead{max-width:660px;margin-bottom:44px;}
.hx-sechead h2{font-size:clamp(28px,3.6vw,40px);line-height:1.1;font-weight:800;}
.hx-sechead p{margin-top:14px;font-size:16.5px;line-height:1.65;color:var(--body);}
.hx-sechead--light p{color:#93A6C2;}

/* ── Steps ───────────────────────────────────────────── */
.hx-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  border-top:1px solid var(--line);}
.hx-step{padding:26px 22px 26px 0;border-right:1px solid var(--line);}
.hx-step:last-child{border-right:0;}
.hx-step:not(:first-child){padding-left:22px;}
.hx-step__n{font-family:var(--display);font-weight:800;font-size:14px;
  color:var(--gold);margin-bottom:12px;}
.hx-step h3{font-size:18px;font-weight:700;line-height:1.25;}
.hx-step p{margin-top:9px;font-size:14.5px;line-height:1.6;color:var(--body);}
.hx-step__time{display:inline-block;margin-top:14px;font-size:12px;font-weight:600;
  color:var(--body);background:var(--mist);padding:4px 10px;border-radius:20px;}

/* ── Documents ───────────────────────────────────────── */
.hx-docs{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden;}
.hx-docitem{background:var(--ink);padding:26px 22px;}
.hx-docitem__when{display:inline-block;font-size:11px;font-weight:700;
  color:var(--gold);margin-bottom:12px;}
.hx-docitem h3{font-size:17px;font-weight:700;color:#fff;}
.hx-docitem p{margin-top:9px;font-size:14px;line-height:1.6;color:#93A6C2;}
.hx-note{margin-top:26px;font-size:14.5px;color:#93A6C2;padding-left:16px;
  border-left:2.5px solid var(--gold);}

/* ── Domains ─────────────────────────────────────────── */
.hx-domains{display:flex;flex-wrap:wrap;gap:9px;}
.hx-domains a{display:block;padding:11px 18px;border:1px solid var(--line);
  border-radius:30px;font-size:14.5px;font-weight:500;color:var(--ink);
  transition:border-color .15s,background .15s;}
.hx-domains a:hover{border-color:var(--ink);background:var(--ink);color:#fff;}

/* ── Tools ───────────────────────────────────────────── */
.hx-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.hx-tool{background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px;}
.hx-tool__top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
.hx-tool h3{font-size:17px;font-weight:700;}
.hx-tool__top span{font-size:11px;font-weight:600;color:var(--body);
  background:var(--mist);padding:3px 9px;border-radius:20px;flex:none;}
.hx-tool p{font-size:14.5px;line-height:1.6;color:var(--body);}

/* ── Split panels ────────────────────────────────────── */
.hx-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.hx-panel{border:1px solid var(--line);border-radius:12px;padding:34px;}
.hx-panel--gold{background:var(--ink);border-color:var(--ink);color:#fff;}
.hx-panel h3{font-size:24px;font-weight:800;}
.hx-panel > p{margin-top:12px;font-size:15.5px;line-height:1.65;color:var(--body);}
.hx-panel--gold > p{color:#93A6C2;}
.hx-panel ul{margin:22px 0 26px;display:grid;gap:10px;}
.hx-panel li{font-size:14.5px;color:var(--body);padding-left:22px;position:relative;}
.hx-panel--gold li{color:#C3D2E6;}
.hx-panel li::before{content:'';position:absolute;left:0;top:8px;
  width:9px;height:2px;background:var(--gold);}

/* ── FAQ ─────────────────────────────────────────────── */
.hx-faq{border-top:1px solid var(--line);}
.hx-faq__item{border-bottom:1px solid var(--line);}
.hx-faq__q{width:100%;display:flex;align-items:center;justify-content:space-between;
  gap:20px;padding:20px 0;background:none;border:0;cursor:pointer;
  font-family:var(--display);font-size:17px;font-weight:700;color:var(--ink);text-align:left;}
.hx-faq__mark{position:relative;width:14px;height:14px;flex:none;}
.hx-faq__mark::before,.hx-faq__mark::after{content:'';position:absolute;
  background:var(--gold);border-radius:2px;transition:transform .2s;}
.hx-faq__mark::before{left:0;top:6px;width:14px;height:2px;}
.hx-faq__mark::after{left:6px;top:0;width:2px;height:14px;}
.hx-faq__item.is-open .hx-faq__mark::after{transform:scaleY(0);}
.hx-faq__a{max-height:0;overflow:hidden;transition:max-height .26s ease;}
.hx-faq__item.is-open .hx-faq__a{max-height:280px;}
.hx-faq__a p{padding:0 40px 22px 0;font-size:15.5px;line-height:1.7;color:var(--body);}

/* ── Final CTA ───────────────────────────────────────── */
.hx-final{background:var(--ink);color:#fff;padding:88px 0;text-align:center;}
.hx-final h2{font-size:clamp(30px,4vw,44px);line-height:1.1;font-weight:800;}
.hx-final > .hx-wrap > p{margin:16px auto 30px;max-width:52ch;
  font-size:17px;line-height:1.65;color:#93A6C2;}
.hx-final__fine{display:block;margin-top:18px;font-size:13px;color:#6E82A0;}

/* ── Footer ──────────────────────────────────────────── */
.hx-foot{background:#060E1A;color:#93A6C2;padding:56px 0 0;}
.hx-foot__in{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;padding-bottom:44px;}
.hx-foot__brand p{margin-top:16px;font-size:14.5px;line-height:1.65;max-width:34ch;}
.hx-foot__co{margin-top:16px !important;font-size:12.5px !important;color:#5E7191;}
.hx-foot__col h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:14px;}
.hx-foot__col a{display:block;font-size:14px;padding:5px 0;}
.hx-foot__col a:hover{color:var(--gold);}
.hx-foot__bar{border-top:1px solid rgba(255,255,255,.08);
  max-width:1140px;margin:0 auto;padding:20px 24px;
  display:flex;justify-content:space-between;gap:16px;font-size:12.5px;color:#5E7191;}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width:1000px){
  .hx-hero__in{grid-template-columns:1fr;gap:64px;}
  .hx-hero__art{max-width:440px;}
  .hx-steps{grid-template-columns:1fr 1fr;}
  .hx-step{border-bottom:1px solid var(--line);}
  .hx-step:nth-child(2){border-right:0;}
  .hx-step:nth-child(3){padding-left:0;}
  .hx-step:nth-child(odd){padding-left:0;}
  .hx-step:nth-child(even){padding-left:22px;border-right:0;}
  .hx-docs{grid-template-columns:1fr 1fr;}
  .hx-tools{grid-template-columns:1fr 1fr;}
  .hx-foot__in{grid-template-columns:1fr 1fr;}
}
@media (max-width:760px){
  .hx-nav__links,.hx-nav__cta{display:none;}
  .hx-burger{display:block;}
  .hx-mobilemenu{display:flex;}
  .hx-hero{padding:48px 0 64px;}
  .hx-sec{padding:60px 0;}
  .hx-strip__in{grid-template-columns:1fr 1fr;gap:26px;padding:28px 24px;}
  .hx-stat__n{font-size:32px;}
  .hx-steps{grid-template-columns:1fr;}
  .hx-step,.hx-step:nth-child(even){padding:22px 0;border-right:0;}
  .hx-docs{grid-template-columns:1fr;}
  .hx-tools{grid-template-columns:1fr;}
  .hx-split{grid-template-columns:1fr;}
  .hx-panel{padding:26px;}
  .hx-foot__in{grid-template-columns:1fr;gap:30px;}
  .hx-foot__bar{flex-direction:column;}
  .hx-seal{width:82px;height:82px;right:-6px;bottom:-16px;}
  .hx-seal__mid{font-size:21px;}
}
@media (prefers-reduced-motion:reduce){
  .hx *{animation:none !important;transition:none !important;}
}
`;

/* Works with either import style:
   import LandingPage from './LandingPage'
   import { LandingPage } from './LandingPage'  */
export default LandingPage;