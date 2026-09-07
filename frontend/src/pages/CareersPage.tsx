// src/pages/CareersPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ══════════════════════════════════════════════════════════════
   HIRESNIX — Careers
   Same system as the landing page: ink navy · signal blue · seal gold
   Hero concept: an honest team roster with the empty seats showing
   ══════════════════════════════════════════════════════════════ */

const TEAM = [
  { seat: '01', name: 'Amar Borse', role: 'Founder, and the person who writes most of the code', filled: true },
  { seat: '02', name: 'Jayesh Badgujar', role: 'Program Director — runs the internships and signs the letters', filled: true },
  { seat: '03', name: 'Dhananjay Pawar', role: 'Design — interfaces, documents, everything students look at', filled: true },
  { seat: '04', name: null, role: 'Full stack engineer', filled: false },
  { seat: '05', name: null, role: 'Campus partnerships', filled: false },
  { seat: '06', name: null, role: 'Could be your idea', filled: false },
];

const ROLES = [
  {
    id: 'fullstack',
    title: 'Full Stack Engineer',
    type: 'Full-time',
    place: 'Remote, or Shirpur if you prefer',
    exp: '0–2 years',
    blurb:
      'You would own features end to end on the student portal — schema, API, screens, deploy. There is no ticket queue and nobody assigns you work in slices.',
    doing: [
      'Build features across React, Node and Postgres without handing off between layers',
      'Take a rough problem from a student complaint to something shipped that week',
      'Keep the internship pipeline running — offer letters, certificates, payments',
      'Review your own work before anyone else has to',
    ],
    need: [
      'You have built and deployed something real, even if only you used it',
      'Comfortable in JavaScript or TypeScript, React, and some backend',
      'You read error messages instead of pasting them straight into a chatbot',
      'You can explain a decision you made and why the other option was worse',
    ],
    nice: 'Worked with Supabase, Razorpay or any LLM API before.',
  },
  {
    id: 'design',
    title: 'Product Designer',
    type: 'Full-time or contract',
    place: 'Remote',
    exp: '0–3 years',
    blurb:
      'Everything a student sees — the portal, the offer letter PDF, the certificate — is a design surface. You would own all of it.',
    doing: [
      'Design flows in Figma and stay involved until they are actually built',
      'Work on print-style layouts too: letters, certificates, brochures',
      'Watch students use the portal and fix what confuses them',
      'Keep one visual system across five different portals',
    ],
    need: [
      'A portfolio with real screens, not only dribbble-style shots',
      'Fluent in Figma including components and variants',
      'You can write the words in your own designs',
      'You care about type and spacing more than about gradients',
    ],
    nice: 'Any front-end coding, even basic HTML and CSS.',
  },
  {
    id: 'campus',
    title: 'Campus Partnerships',
    type: 'Full-time',
    place: 'Maharashtra — travel to colleges',
    exp: '0–3 years',
    blurb:
      'Colleges in Tier-2 and Tier-3 towns want internship programmes for their students. Your job is to reach them and set the partnership up.',
    doing: [
      'Reach out to training and placement officers and get meetings',
      'Present Hiresnix to faculty and to full classrooms',
      'Take a college from first call to signed MOU to enrolled batch',
      'Stay with the college after onboarding so the batch actually finishes',
    ],
    need: [
      'You are comfortable speaking in front of a room of students',
      'Marathi, Hindi and English — you will need all three',
      'Willing to travel across Maharashtra',
      'You follow up without being asked to',
    ],
    nice: 'You have worked with a college placement cell before.',
  },
  {
    id: 'content',
    title: 'Content and Social',
    type: 'Part-time or full-time',
    place: 'Remote',
    exp: '0–2 years',
    blurb:
      'Most students find us on LinkedIn and Instagram. You would decide what they see there.',
    doing: [
      'Write and publish for LinkedIn, Instagram and the Hiresnix blog',
      'Turn student project work and completions into posts worth reading',
      'Handle the WhatsApp community — announcements, questions, momentum',
      'Write the copy inside the product when the interface needs words',
    ],
    need: [
      'You write clearly in English and can switch to Hindi when it lands better',
      'You have run a page or newsletter that people actually read',
      'You can produce a decent graphic yourself in Canva or Figma',
      'You understand what a final-year engineering student cares about',
    ],
    nice: 'Basic video editing for reels.',
  },
  {
    id: 'ambassador',
    title: 'Campus Ambassador',
    type: 'Part-time, paid per enrollment',
    place: 'Your own college',
    exp: 'Current students only',
    blurb:
      'Run Hiresnix inside your own campus while you study. This is the one role built for people still in college.',
    doing: [
      'Tell your batch and juniors about the internship programme',
      'Run a small session or a stall during college events',
      'Help classmates through the application if they get stuck',
      'Send us what students on your campus keep asking for',
    ],
    need: [
      'Currently enrolled in an engineering, BCA or MCA programme',
      'You are already the person people ask about opportunities',
      'Around five hours a week',
    ],
    nice: 'You have organised anything at college before — a fest, a club, a workshop.',
  },
];

const PROCESS = [
  {
    n: '1',
    t: 'You write to us',
    d: 'One email with your CV and a few lines on why this role. No form with twenty fields.',
    when: 'Day 0',
  },
  {
    n: '2',
    t: 'A real conversation',
    d: 'Thirty to forty minutes on a call. What you have built, what you want to build, what we are actually doing.',
    when: 'Within a week',
  },
  {
    n: '3',
    t: 'A small piece of real work',
    d: 'A short paid task from our actual backlog. Nothing throwaway and nothing that takes your weekend.',
    when: '3–5 days',
  },
  {
    n: '4',
    t: 'Offer',
    d: 'A call with Amar, then a written offer with the number, the scope and the start date on it.',
    when: 'Within two weeks',
  },
];

const TRUTHS = [
  {
    t: 'The team is four people',
    d: 'There is no layer between you and the founder. Nobody will translate your idea into a ticket for someone else to build.',
  },
  {
    t: 'We are not funded',
    d: 'Salaries are early-stage salaries. If you are optimising for the highest number this year, this is the wrong place and we would rather say so now.',
  },
  {
    t: 'Things ship the same week',
    d: 'A payment gate went from an idea to live in a day. Fast is the default here, which also means you will occasionally ship something broken.',
  },
  {
    t: 'Students use it immediately',
    d: 'Two hundred and seventy four of them. Whatever you build is in front of real people before the week ends, and they tell you when it is bad.',
  },
  {
    t: 'You choose where you sit',
    d: 'Remote, or the Shirpur office if you want a desk. We care that the work lands, not that you were online at nine.',
  },
  {
    t: 'The mission is narrow on purpose',
    d: 'Students in small towns rarely get a first internship. That one problem is what everything here is pointed at.',
  },
];

/* ── Team roster artifact ──────────────────────────────────── */
function Roster() {
  return (
    <div className="cr-roster" aria-hidden="true">
      <div className="cr-roster__head">
        <span>Hiresnix team</span>
        <span className="cr-roster__count">3 filled · 3 open</span>
      </div>
      <ul className="cr-roster__list">
        {TEAM.map(m => (
          <li key={m.seat} className={m.filled ? 'is-filled' : 'is-open'}>
            <span className="cr-roster__seat">{m.seat}</span>
            <span className="cr-roster__body">
              {m.filled ? (
                <>
                  <strong>{m.name}</strong>
                  <em>{m.role}</em>
                </>
              ) : (
                <>
                  <strong className="cr-roster__vacant">{m.role}</strong>
                  <em>Open</em>
                </>
              )}
            </span>
            {m.filled
              ? <span className="cr-roster__dot" />
              : <span className="cr-roster__plus" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Role accordion ────────────────────────────────────────── */
function RoleList() {
  const [open, setOpen] = useState<string | null>(ROLES[0].id);

  return (
    <div className="cr-roles">
      {ROLES.map(r => {
        const isOpen = open === r.id;
        return (
          <article key={r.id} className={`cr-role ${isOpen ? 'is-open' : ''}`}>
            <button
              className="cr-role__bar"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : r.id)}
            >
              <span className="cr-role__title">{r.title}</span>
              <span className="cr-role__meta">
                <em>{r.type}</em>
                <em>{r.place}</em>
              </span>
              <i className="cr-role__mark" />
            </button>

            <div className="cr-role__panel">
              <div className="cr-role__inner">
                <p className="cr-role__blurb">{r.blurb}</p>

                <div className="cr-role__cols">
                  <div>
                    <h4>What you would do</h4>
                    <ul>{r.doing.map(x => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <h4>What we are looking for</h4>
                    <ul>{r.need.map(x => <li key={x}>{x}</li>)}</ul>
                  </div>
                </div>

                <p className="cr-role__nice">
                  <span>Helps but not required</span> {r.nice}
                </p>

                <div className="cr-role__foot">
                  <span className="cr-role__exp">Experience: {r.exp}</span>
                  <a
                    className="cr-btn cr-btn--gold"
                    href={`mailto:hr@hiresnix.co.in?subject=${encodeURIComponent(
                      `Application — ${r.title}`
                    )}&body=${encodeURIComponent(
                      `Hi Hiresnix team,\n\nI'd like to apply for the ${r.title} role.\n\nWhy this role:\n\n\nWhat I've built:\n\n\nMy CV / portfolio:\n\n\nThanks,\n`
                    )}`}
                  >
                    Apply for this role
                  </a>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */
export function CareersPage() {
  const [navSolid, setNavSolid] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="cr">
      <style>{CSS}</style>

      {/* ── Nav ───────────────────────────────────────────── */}
      <header className={`cr-nav ${navSolid ? 'is-solid' : ''}`}>
        <div className="cr-nav__in">
          <Link to="/" className="cr-logo">
            <ArrowMark />
            <span>Hiresnix</span>
          </Link>

          <nav className="cr-nav__links">
            <Link to="/">Home</Link>
            <a href="#truth">What it's like</a>
            <a href="#roles">Open roles</a>
            <a href="#process">Hiring</a>
          </nav>

          <div className="cr-nav__cta">
            <a href="#roles" className="cr-btn cr-btn--gold">See open roles</a>
          </div>

          <button
            className="cr-burger"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu(m => !m)}
          >
            <span /><span /><span />
          </button>
        </div>

        {menu && (
          <div className="cr-mobilemenu">
            <Link to="/" onClick={() => setMenu(false)}>Home</Link>
            <a href="#truth" onClick={() => setMenu(false)}>What it's like</a>
            <a href="#roles" onClick={() => setMenu(false)}>Open roles</a>
            <a href="#process" onClick={() => setMenu(false)}>Hiring</a>
            <a href="#roles" className="cr-btn cr-btn--gold" onClick={() => setMenu(false)}>
              See open roles
            </a>
          </div>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="cr-hero">
        <div className="cr-hero__in">
          <div className="cr-hero__copy">
            <p className="cr-kicker">Careers at Hiresnix</p>

            <h1 className="cr-hero__h1">
              There are three of us.
              <br />
              We are looking for the fourth.
            </h1>

            <p className="cr-hero__sub">
              Hiresnix runs remote internships for engineering students in small
              towns across India — the ones who rarely get a first opportunity.
              Two hundred and seventy four of them are on the platform. Three
              people built it. If you join now, whatever you make goes in front of
              all of them within the week.
            </p>

            <div className="cr-hero__actions">
              <a href="#roles" className="cr-btn cr-btn--gold cr-btn--lg">
                See the five open roles
              </a>
              <a href="#truth" className="cr-btn cr-btn--outline cr-btn--lg">
                What it's actually like
              </a>
            </div>
          </div>

          <div className="cr-hero__art">
            <Roster />
          </div>
        </div>
      </section>

      {/* ── Truths ────────────────────────────────────────── */}
      <section className="cr-sec cr-sec--ink" id="truth">
        <div className="cr-wrap">
          <header className="cr-sechead cr-sechead--light">
            <h2>Read this before you apply</h2>
            <p>
              Every careers page says fast-paced and high-ownership. Here is what
              those words actually mean at a company this size.
            </p>
          </header>

          <div className="cr-truths">
            {TRUTHS.map(x => (
              <article className="cr-truth" key={x.t}>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ─────────────────────────────────────────── */}
      <section className="cr-sec" id="roles">
        <div className="cr-wrap">
          <header className="cr-sechead">
            <h2>Open roles</h2>
            <p>
              Five of them. Open one to read what the work is and apply from
              inside it.
            </p>
          </header>

          <RoleList />
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────── */}
      <section className="cr-sec cr-sec--tint" id="process">
        <div className="cr-wrap">
          <header className="cr-sechead">
            <h2>How hiring works here</h2>
            <p>
              Two weeks from your email to a written offer. No aptitude test and
              no unpaid take-home that eats your weekend.
            </p>
          </header>

          <ol className="cr-steps">
            {PROCESS.map(s => (
              <li className="cr-step" key={s.n}>
                <div className="cr-step__n">{s.n}</div>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <span className="cr-step__when">{s.when}</span>
                </div>
              </li>
            ))}
          </ol>

          <p className="cr-note">
            You hear back either way. If it is a no, you get a reason.
          </p>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────── */}
      <section className="cr-sec">
        <div className="cr-wrap">
          <div className="cr-split">
            <article className="cr-panel">
              <h3>What we can offer</h3>
              <ul>
                <li>Work that reaches real users the same week</li>
                <li>Remote by default, Shirpur office if you want one</li>
                <li>Hours you set yourself, judged on output</li>
                <li>Direct access to the founder on everything</li>
                <li>Your name on the work, publicly</li>
                <li>Budget for courses and tools you actually need</li>
              </ul>
            </article>

            <article className="cr-panel cr-panel--ink">
              <h3>What we cannot offer</h3>
              <ul>
                <li>A market-rate salary at a funded company</li>
                <li>A manager who plans your quarter for you</li>
                <li>A defined scope that never moves</li>
                <li>A large team to absorb a bad week</li>
                <li>Health insurance, yet</li>
              </ul>
              <p className="cr-panel__close">
                We would rather you know this on the careers page than in month
                two.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Open application ──────────────────────────────── */}
      <section className="cr-final">
        <div className="cr-wrap">
          <h2>None of these five fit you?</h2>
          <p>
            Write anyway. Tell us what you would build here and why it matters to
            a student in a small town. If it is good, we will make the role.
          </p>
          <a
            className="cr-btn cr-btn--gold cr-btn--lg"
            href={`mailto:hr@hiresnix.co.in?subject=${encodeURIComponent(
              'Open application'
            )}&body=${encodeURIComponent(
              'Hi Hiresnix team,\n\nThe role I think you need:\n\n\nWhy it matters:\n\n\nWhat I have built before:\n\n\nMy CV / portfolio:\n\n\nThanks,\n'
            )}`}
          >
            Write to us
          </a>
          <span className="cr-final__fine">
            hr@hiresnix.co.in — Amar reads every one of these.
          </span>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="cr-foot">
        <div className="cr-wrap cr-foot__in">
          <div className="cr-foot__brand">
            <Link to="/" className="cr-logo cr-logo--light">
              <ArrowMark />
              <span>Hiresnix</span>
            </Link>
            <p>
              Remote internships, AI career tools and verifiable documents for
              students across India.
            </p>
            <p className="cr-foot__co">
              Operated by SR Patil Infrastructure Private Limited<br />
              Shirpur, Maharashtra
            </p>
          </div>

          <div className="cr-foot__col">
            <h4>Company</h4>
            <Link to="/">Home</Link>
            <a href="#roles">Careers</a>
            <Link to="/verification">Verify a document</Link>
          </div>

          <div className="cr-foot__col">
            <h4>Students</h4>
            <Link to="/auth">Apply for an internship</Link>
            <Link to="/auth">Sign in</Link>
          </div>

          <div className="cr-foot__col">
            <h4>Contact</h4>
            <a href="mailto:hr@hiresnix.co.in">hr@hiresnix.co.in</a>
            <a href="tel:+919322690710">+91 93226 90710</a>
            <a
              href="https://www.linkedin.com/company/hiresnix/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="cr-foot__bar">
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
    <svg viewBox="0 0 32 32" className="cr-mark" aria-hidden="true">
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

.cr{
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
.cr *{box-sizing:border-box;}
.cr h1,.cr h2,.cr h3,.cr h4{font-family:var(--display);margin:0;letter-spacing:-.02em;}
.cr p{margin:0;}
.cr a{color:inherit;text-decoration:none;}
.cr ul,.cr ol{margin:0;padding:0;list-style:none;}
.cr :focus-visible{outline:2.5px solid var(--blue);outline-offset:3px;border-radius:4px;}

.cr-wrap{max-width:1140px;margin:0 auto;padding:0 24px;}

/* ── Buttons ─────────────────────────────────────────── */
.cr-btn{
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--text);font-weight:600;font-size:14.5px;
  padding:11px 20px;border-radius:8px;border:1.5px solid transparent;
  cursor:pointer;transition:background .16s,color .16s,border-color .16s;
  white-space:nowrap;
}
.cr-btn--lg{padding:15px 30px;font-size:16px;}
.cr-btn--gold{background:var(--gold);color:#20180B;border-color:var(--gold);}
.cr-btn--gold:hover{background:#B8931F;border-color:#B8931F;}
.cr-btn--outline{border-color:var(--line);color:var(--ink);background:transparent;}
.cr-btn--outline:hover{border-color:var(--ink);background:var(--mist);}

/* ── Nav ─────────────────────────────────────────────── */
.cr-nav{position:sticky;top:0;z-index:60;transition:background .2s,border-color .2s;
  border-bottom:1px solid transparent;background:rgba(255,255,255,0);}
.cr-nav.is-solid{background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom-color:var(--line);}
.cr-nav__in{max-width:1140px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:28px;}
.cr-logo{display:flex;align-items:center;gap:9px;font-family:var(--display);
  font-weight:800;font-size:20px;letter-spacing:-.03em;color:var(--ink);}
.cr-logo--light{color:#fff;}
.cr-mark{width:26px;height:26px;color:var(--blue);flex:none;}
.cr-logo--light .cr-mark{color:var(--gold);}
.cr-nav__links{display:flex;gap:26px;margin-left:auto;font-size:14.5px;color:var(--body);font-weight:500;}
.cr-nav__links a:hover{color:var(--ink);}
.cr-nav__cta{display:flex;gap:8px;align-items:center;}
.cr-burger{display:none;margin-left:auto;background:none;border:0;padding:8px;cursor:pointer;}
.cr-burger span{display:block;width:22px;height:2px;background:var(--ink);margin:4px 0;border-radius:2px;}
.cr-mobilemenu{display:none;flex-direction:column;gap:4px;padding:8px 24px 20px;
  background:#fff;border-bottom:1px solid var(--line);}
.cr-mobilemenu a{padding:11px 0;font-weight:500;color:var(--body);border-bottom:1px solid var(--mist);}
.cr-mobilemenu .cr-btn{margin-top:12px;border-bottom:0;}

/* ── Hero ────────────────────────────────────────────── */
.cr-hero{padding:76px 0 84px;
  background:radial-gradient(900px 420px at 86% 8%, #EEF3FB 0%, rgba(238,243,251,0) 62%);}
.cr-hero__in{max-width:1140px;margin:0 auto;padding:0 24px;
  display:grid;grid-template-columns:1.06fr .94fr;gap:56px;align-items:center;}
.cr-kicker{font-size:13px;font-weight:600;color:var(--body);
  padding-left:14px;border-left:2.5px solid var(--gold);margin-bottom:22px;}
.cr-hero__h1{font-size:clamp(36px,5vw,58px);line-height:1.04;font-weight:800;}
.cr-hero__sub{margin-top:22px;font-size:17px;line-height:1.65;color:var(--body);max-width:56ch;}
.cr-hero__actions{margin-top:30px;display:flex;gap:11px;flex-wrap:wrap;}

/* ── Roster ──────────────────────────────────────────── */
.cr-roster{background:#fff;border:1px solid var(--line);border-radius:12px;
  box-shadow:0 24px 60px rgba(10,22,40,.11);overflow:hidden;}
.cr-roster__head{display:flex;justify-content:space-between;align-items:center;
  gap:12px;padding:15px 20px;background:var(--ink);color:#fff;
  border-bottom:2.5px solid var(--gold);
  font-family:var(--display);font-weight:700;font-size:14px;}
.cr-roster__count{font-family:var(--text);font-weight:600;font-size:11.5px;color:var(--gold-soft);}
.cr-roster__list li{display:flex;align-items:center;gap:14px;
  padding:15px 20px;border-bottom:1px solid var(--line);}
.cr-roster__list li:last-child{border-bottom:0;}
.cr-roster__list li.is-open{background:
  repeating-linear-gradient(-45deg,#FBFCFE 0 8px,#F5F8FC 8px 16px);}
.cr-roster__seat{font-family:var(--display);font-weight:700;font-size:12px;
  color:#93A6C2;flex:none;width:20px;}
.cr-roster__body{flex:1;min-width:0;}
.cr-roster__body strong{display:block;font-size:15px;font-weight:700;color:var(--ink);}
.cr-roster__body em{display:block;font-style:normal;font-size:12.5px;
  color:var(--body);margin-top:2px;line-height:1.4;}
.cr-roster__vacant{color:var(--gold) !important;}
.cr-roster__dot{width:7px;height:7px;border-radius:50%;background:#22C55E;flex:none;}
.cr-roster__plus{position:relative;width:15px;height:15px;flex:none;}
.cr-roster__plus::before,.cr-roster__plus::after{content:'';position:absolute;background:var(--gold);border-radius:2px;}
.cr-roster__plus::before{left:0;top:6.5px;width:15px;height:2px;}
.cr-roster__plus::after{left:6.5px;top:0;width:2px;height:15px;}

/* ── Sections ────────────────────────────────────────── */
.cr-sec{padding:84px 0;}
.cr-sec--tint{background:var(--mist);}
.cr-sec--ink{background:var(--ink);color:#fff;}
.cr-sechead{max-width:660px;margin-bottom:44px;}
.cr-sechead h2{font-size:clamp(28px,3.6vw,40px);line-height:1.1;font-weight:800;}
.cr-sechead p{margin-top:14px;font-size:16.5px;line-height:1.65;color:var(--body);}
.cr-sechead--light p{color:#93A6C2;}

/* ── Truths ──────────────────────────────────────────── */
.cr-truths{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);
  border-radius:10px;overflow:hidden;}
.cr-truth{background:var(--ink);padding:26px 22px;}
.cr-truth h3{font-size:17px;font-weight:700;color:#fff;
  padding-left:14px;border-left:2.5px solid var(--gold);}
.cr-truth p{margin-top:11px;font-size:14.5px;line-height:1.65;color:#93A6C2;}

/* ── Roles ───────────────────────────────────────────── */
.cr-roles{border-top:1px solid var(--line);}
.cr-role{border-bottom:1px solid var(--line);}
.cr-role__bar{width:100%;display:flex;align-items:center;gap:20px;
  padding:22px 0;background:none;border:0;cursor:pointer;text-align:left;}
.cr-role__title{font-family:var(--display);font-size:21px;font-weight:700;
  color:var(--ink);flex:none;}
.cr-role__meta{display:flex;gap:20px;margin-left:auto;flex-wrap:wrap;}
.cr-role__meta em{font-style:normal;font-size:13px;color:var(--body);}
.cr-role__mark{position:relative;width:15px;height:15px;flex:none;}
.cr-role__mark::before,.cr-role__mark::after{content:'';position:absolute;
  background:var(--gold);border-radius:2px;transition:transform .2s;}
.cr-role__mark::before{left:0;top:6.5px;width:15px;height:2px;}
.cr-role__mark::after{left:6.5px;top:0;width:2px;height:15px;}
.cr-role.is-open .cr-role__mark::after{transform:scaleY(0);}

.cr-role__panel{max-height:0;overflow:hidden;transition:max-height .3s ease;}
.cr-role.is-open .cr-role__panel{max-height:900px;}
.cr-role__inner{padding-bottom:30px;}
.cr-role__blurb{font-size:16px;line-height:1.65;color:var(--body);max-width:70ch;}
.cr-role__cols{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:26px;}
.cr-role__cols h4{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:12px;}
.cr-role__cols li{font-size:14.5px;line-height:1.6;color:var(--body);
  padding-left:20px;position:relative;margin-bottom:9px;}
.cr-role__cols li::before{content:'';position:absolute;left:0;top:9px;
  width:9px;height:2px;background:var(--gold);}
.cr-role__nice{margin-top:22px;font-size:14px;color:var(--body);
  background:var(--mist);padding:13px 16px;border-radius:8px;}
.cr-role__nice span{font-weight:700;color:var(--ink);}
.cr-role__foot{margin-top:24px;display:flex;align-items:center;
  justify-content:space-between;gap:16px;flex-wrap:wrap;}
.cr-role__exp{font-size:13.5px;color:var(--body);}

/* ── Process ─────────────────────────────────────────── */
.cr-steps{display:grid;grid-template-columns:repeat(4,1fr);
  border-top:1px solid var(--line);}
.cr-step{display:block;padding:26px 22px 26px 0;border-right:1px solid var(--line);}
.cr-step:last-child{border-right:0;}
.cr-step:not(:first-child){padding-left:22px;}
.cr-step__n{font-family:var(--display);font-weight:800;font-size:14px;
  color:var(--gold);margin-bottom:12px;}
.cr-step h3{font-size:18px;font-weight:700;line-height:1.25;}
.cr-step p{margin-top:9px;font-size:14.5px;line-height:1.6;color:var(--body);}
.cr-step__when{display:inline-block;margin-top:14px;font-size:12px;font-weight:600;
  color:var(--body);background:#fff;border:1px solid var(--line);
  padding:4px 10px;border-radius:20px;}
.cr-note{margin-top:26px;font-size:15px;color:var(--body);
  padding-left:16px;border-left:2.5px solid var(--gold);}

/* ── Split panels ────────────────────────────────────── */
.cr-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.cr-panel{border:1px solid var(--line);border-radius:12px;padding:34px;}
.cr-panel--ink{background:var(--ink);border-color:var(--ink);color:#fff;}
.cr-panel h3{font-size:24px;font-weight:800;}
.cr-panel ul{margin-top:20px;display:grid;gap:11px;}
.cr-panel li{font-size:15px;line-height:1.55;color:var(--body);
  padding-left:22px;position:relative;}
.cr-panel--ink li{color:#C3D2E6;}
.cr-panel li::before{content:'';position:absolute;left:0;top:9px;
  width:9px;height:2px;background:var(--gold);}
.cr-panel__close{margin-top:22px;font-size:14px;line-height:1.6;color:#93A6C2;
  padding-top:18px;border-top:1px solid rgba(255,255,255,.12);}

/* ── Final ───────────────────────────────────────────── */
.cr-final{background:var(--ink);color:#fff;padding:88px 0;text-align:center;}
.cr-final h2{font-size:clamp(28px,4vw,42px);line-height:1.12;font-weight:800;}
.cr-final > .cr-wrap > p{margin:16px auto 30px;max-width:56ch;
  font-size:17px;line-height:1.65;color:#93A6C2;}
.cr-final__fine{display:block;margin-top:18px;font-size:13px;color:#6E82A0;}

/* ── Footer ──────────────────────────────────────────── */
.cr-foot{background:#060E1A;color:#93A6C2;padding:56px 0 0;}
.cr-foot__in{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;padding-bottom:44px;}
.cr-foot__brand p{margin-top:16px;font-size:14.5px;line-height:1.65;max-width:34ch;}
.cr-foot__co{margin-top:16px !important;font-size:12.5px !important;color:#5E7191;}
.cr-foot__col h4{font-size:13px;font-weight:700;color:#fff;margin-bottom:14px;}
.cr-foot__col a{display:block;font-size:14px;padding:5px 0;}
.cr-foot__col a:hover{color:var(--gold);}
.cr-foot__bar{border-top:1px solid rgba(255,255,255,.08);
  max-width:1140px;margin:0 auto;padding:20px 24px;
  display:flex;justify-content:space-between;gap:16px;font-size:12.5px;color:#5E7191;}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width:1000px){
  .cr-hero__in{grid-template-columns:1fr;gap:56px;}
  .cr-hero__art{max-width:460px;}
  .cr-truths{grid-template-columns:1fr 1fr;}
  .cr-steps{grid-template-columns:1fr 1fr;}
  .cr-step{border-bottom:1px solid var(--line);}
  .cr-step:nth-child(odd){padding-left:0;border-right:1px solid var(--line);}
  .cr-step:nth-child(even){padding-left:22px;border-right:0;}
  .cr-foot__in{grid-template-columns:1fr 1fr;}
}
@media (max-width:760px){
  .cr-nav__links,.cr-nav__cta{display:none;}
  .cr-burger{display:block;}
  .cr-mobilemenu{display:flex;}
  .cr-hero{padding:48px 0 64px;}
  .cr-sec{padding:60px 0;}
  .cr-truths{grid-template-columns:1fr;}
  .cr-steps{grid-template-columns:1fr;}
  .cr-step,.cr-step:nth-child(odd),.cr-step:nth-child(even){
    padding:22px 0;border-right:0;}
  .cr-role__bar{flex-wrap:wrap;gap:8px;}
  .cr-role__title{font-size:19px;flex:1;}
  .cr-role__meta{width:100%;margin-left:0;gap:14px;order:3;}
  .cr-role__cols{grid-template-columns:1fr;gap:24px;}
  .cr-role.is-open .cr-role__panel{max-height:1600px;}
  .cr-split{grid-template-columns:1fr;}
  .cr-panel{padding:26px;}
  .cr-foot__in{grid-template-columns:1fr;gap:30px;}
  .cr-foot__bar{flex-direction:column;}
}
@media (prefers-reduced-motion:reduce){
  .cr *{animation:none !important;transition:none !important;}
}
`;

/* Works with either import style:
   import CareersPage from './CareersPage'
   import { CareersPage } from './CareersPage'  */
export default CareersPage;