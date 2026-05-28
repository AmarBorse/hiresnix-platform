// src/pages/LandingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

const DOMAINS = [
  { icon: '💻', name: 'Web Development', duration: '8 Weeks', seats: 30, tags: ['React', 'Node.js'] },
  { icon: '🤖', name: 'AI / Machine Learning', duration: '10 Weeks', seats: 25, tags: ['Python', 'TensorFlow'] },
  { icon: '📊', name: 'Data Science', duration: '8 Weeks', seats: 30, tags: ['Python', 'SQL'] },
  { icon: '📱', name: 'App Development', duration: '8 Weeks', seats: 20, tags: ['React Native'] },
  { icon: '🎨', name: 'UI/UX Design', duration: '6 Weeks', seats: 20, tags: ['Figma', 'Research'] },
  { icon: '☁️', name: 'Cloud & DevOps', duration: '10 Weeks', seats: 15, tags: ['AWS', 'Docker'] },
];

const STEPS = [
  { step: '01', icon: '📝', title: 'Register & Login', desc: 'Create your account once — use same credentials for job portal and internship platform.' },
  { step: '02', icon: '🎯', title: 'Select Domain', desc: 'Choose from 12+ domains like Web Dev, AI/ML, Data Science. Apply with your details.' },
  { step: '03', icon: '✅', title: 'Get Approved', desc: 'Admin reviews your application and approves. Training begins immediately.' },
  { step: '04', icon: '📚', title: 'Train & Submit', desc: 'Access week-wise resources and assignments. Submit tasks to track progress.' },
  { step: '05', icon: '🏆', title: 'Get Certified', desc: 'Download Certificate, Completion Letter, and Letter of Recommendation as PDFs.' },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', role: 'SDE at TechStartup, Pune', text: 'The Web Dev internship was exactly what I needed. Real projects and the certificate helped me land my first job!', avatar: 'R', color: '#3b82f6' },
  { name: 'Priya Desai', role: 'MBA Student, NMIMS Mumbai', text: 'The LOR from Hiresnix made a huge difference in my MBA application. Very professional platform!', avatar: 'P', color: '#8b5cf6' },
  { name: 'Arjun Patil', role: 'Data Analyst at FinTech Co.', text: 'AI/ML domain was challenging but worth it. Got a Data Analyst role 2 weeks after completing!', avatar: 'A', color: '#10b981' },
];

const MARQUEE_ITEMS = [
  '💻 Web Development', '📊 Data Science', '🤖 AI / ML',
  '📱 App Development', '🎨 UI/UX Design', '☁️ Cloud Computing',
  '🔒 Cybersecurity', '📈 Digital Marketing',
];


// ── Enquiry Form ─────────────────────────────────────────────────
function EnquiryForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: 'Internship', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Using the configured client instance
      const { data } = await client.post('/public/enquiry', form);
      if (data.success) {
        setSubmitted(true);
        toast.success(data.message || "Enquiry sent successfully!");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send enquiry. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, padding: '3rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h3 className="lp-font-d" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5', marginBottom: '0.75rem' }}>Enquiry Received!</h3>
      <p style={{ color: '#6b7a99', marginBottom: '1.5rem' }}>Thank you! Our team will get back to you within 24 hours.</p>
      <button className="lp-btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', interest: 'Internship', message: '' }); }}>
        Send Another
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="lp-section-label">Contact Us</div>
        <h2 className="lp-section-title lp-font-d">Have Questions? Enquire Now</h2>
        <p style={{ color: '#6b7a99', fontSize: '1rem' }}>Fill the form and our team will reach out to you shortly.</p>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="9876543210" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>I am interested in</label>
              <select value={form.interest} onChange={e => set('interest', e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                {['Internship','Job Portal','Both','Partnership','Other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Message *</label>
            <textarea required rows={4} value={form.message} onChange={e => set('message', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              placeholder="Tell us what you're looking for..." />
          </div>
          <button type="submit" disabled={loading} className="lp-btn-glow" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Sending...' : '🚀 Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const countersRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    const el = countersRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !countersAnimated.current) {
        countersAnimated.current = true;
        el.querySelectorAll('[data-count]').forEach(node => {
          const counter = node as HTMLElement;
          const target = parseInt(counter.dataset.count || '0');
          const suffix = counter.dataset.suffix || '';
          let current = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            counter.textContent = Math.floor(current) + suffix;
          }, 20);
        });
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#060910', color: '#e8edf5', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        body { margin: 0; background-color: #060910; }
        .lp-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
        .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }
        .lp-d1 { transition-delay: 0.1s; } .lp-d2 { transition-delay: 0.2s; }
        .lp-d3 { transition-delay: 0.3s; } .lp-d4 { transition-delay: 0.4s; }
        .lp-font-d { font-family: 'Sora', system-ui, sans-serif; }
        .lp-font-m { font-family: 'JetBrains Mono', monospace; }
        .lp-btn-glow { display:inline-flex;align-items:center;gap:8px;background:#3b82f6;color:#fff;padding:0.85rem 1.75rem;border-radius:12px;font-weight:700;font-size:0.95rem;text-decoration:none;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 0 30px rgba(59,130,246,0.3); }
        .lp-btn-glow:hover { background:#2563eb;transform:translateY(-2px);box-shadow:0 0 50px rgba(59,130,246,0.5); }
        .lp-btn-outline { display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.15);color:#e8edf5;padding:0.85rem 1.75rem;border-radius:12px;font-weight:600;font-size:0.95rem;text-decoration:none;background:transparent;cursor:pointer;transition:all 0.3s; }
        .lp-btn-outline:hover { background:rgba(255,255,255,0.07);border-color:#3b82f6;color:#60a5fa; }
        .lp-card { background:#141d2e;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.75rem;transition:all 0.4s;cursor:pointer; }
        .lp-card:hover { border-color:rgba(59,130,246,0.4);transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,0.4); }
        .lp-domain-card { background:#141d2e;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.75rem;transition:all 0.4s;position:relative;overflow:hidden; }
        .lp-domain-card::after { content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(to right,#3b82f6,#8b5cf6);transform:scaleX(0);transition:transform 0.4s;transform-origin:left; }
        .lp-domain-card:hover { transform:translateY(-8px);border-color:rgba(59,130,246,0.3);box-shadow:0 24px 60px rgba(0,0,0,0.5); }
        .lp-domain-card:hover::after { transform:scaleX(1); }
        .lp-orb { position:absolute;border-radius:50%;filter:blur(80px);opacity:0.12;animation:lpOrbFloat 8s ease-in-out infinite; }
        @keyframes lpOrbFloat { 0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-28px) scale(1.05);} }
        .lp-marquee-track { display:flex;gap:2.5rem;animation:lpMarquee 25s linear infinite;width:max-content; }
        .lp-marquee-track:hover { animation-play-state:paused; }
        @keyframes lpMarquee { from{transform:translateX(0);}to{transform:translateX(-50%);} }
        .lp-cert-doc:hover { border-color:#f59e0b!important;background:rgba(245,158,11,0.04)!important;transform:translateX(6px); }
        .lp-cert-doc { transition:all 0.3s; }
        .lp-navbar { position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:70px;background:rgba(6,9,16,0.8);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.07);transition:all 0.3s; }
        .lp-section-label { font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:#3b82f6;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.6rem; }
        .lp-section-title { font-family:'Sora',sans-serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.02em;line-height:1.15;margin-bottom:0.85rem; }
        .lp-testimonial:hover { border-color:rgba(59,130,246,0.3)!important;transform:translateY(-4px); }
        .lp-testimonial { transition:all 0.3s; }
        .lp-benefit:hover { border-color:rgba(59,130,246,0.3)!important; }
        .lp-benefit { transition:all 0.3s; }
        @media(max-width:768px){.lp-hide-mobile{display:none!important;}.lp-stack{flex-direction:column!important;}.lp-grid-1{grid-template-columns:1fr!important;}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="lp-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 42, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="lp-hide-mobile">
          {[['#how', 'How It Works'], ['#features', 'Features'], ['#domains', 'Domains'], ['#companies', 'For Companies']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#6b7a99', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="lp-btn-outline lp-hide-mobile" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none' }} onClick={() => navigate('/verify')}>Verify Certificate</button>
          <button className="lp-btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => navigate('/auth')}>Login</button>
          <button className="lp-btn-glow" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }} onClick={() => navigate('/auth')}>Get Started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', overflow: 'hidden' }}>
        {/* Orbs */}
        <div className="lp-orb" style={{ width: 600, height: 600, background: '#3b82f6', top: -200, right: -100, animationDelay: '0s' }} />
        <div className="lp-orb" style={{ width: 400, height: 400, background: '#8b5cf6', bottom: -100, left: -100, animationDelay: '-3s' }} />
        <div className="lp-orb" style={{ width: 300, height: 300, background: '#f59e0b', top: '40%', left: '40%', animationDelay: '-6s' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%,black 0%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, textAlign: 'center', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', animation: 'lpOrbFloat 6s ease-in-out infinite' }}>
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 140, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 50px rgba(59,130,246,0.6)) drop-shadow(0 0 100px rgba(59,130,246,0.2))' }} />
          </div>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 18px', borderRadius: 100, fontSize: '0.78rem', fontFamily: "'JetBrains Mono',monospace", color: '#60a5fa', marginBottom: '1.75rem', letterSpacing: '0.05em' }}>
            <span style={{ animation: 'lpOrbFloat 1.5s ease-in-out infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
            Elevating Talent. Empowering Futures.
          </div>

          {/* Title */}
          <h1 className="lp-font-d" style={{ fontWeight: 800, fontSize: 'clamp(2.6rem,7vw,5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            <span style={{ display: 'block', color: '#e8edf5' }}>Learn, Apply &</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#60a5fa,#8b5cf6,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Get Placed
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem,2vw,1.15rem)', color: '#6b7a99', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 2.5rem', fontWeight: 300 }}>
            Hiresnix connects students with real internship training programs and startup job opportunities — complete with certificates, LORs, and career support.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn-glow" onClick={() => navigate('/auth')}>🎓 Start Internship</button>
            <button className="lp-btn-outline" onClick={() => navigate('/auth')}>💼 Browse Jobs →</button>
          </div>

          {/* Stats */}
          <div ref={countersRef} style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[['500', '+', 'Students Trained'], ['50', '+', 'Startups Onboarded'], ['12', '+', 'Domains Available'], ['95', '%', 'Placement Rate']].map(([count, suffix, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="lp-font-d" style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg,#e8edf5,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  data-count={count} data-suffix={suffix}>0{suffix}</div>
                <div style={{ color: '#6b7a99', fontSize: '0.75rem', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow: 'hidden', padding: '1.25rem 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0b1120' }}>
        <div className="lp-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#6b7a99', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>
              <span style={{ color: '#60a5fa' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '7rem 5%', background: '#0b1120' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="lp-section-label lp-reveal">How It Works</div>
          <h2 className="lp-section-title lp-reveal lp-d1">Simple 5-Step Journey</h2>
          <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>From applying to getting certified — everything happens on one platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', maxWidth: 1100, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.step} className={`lp-card lp-reveal lp-d${Math.min(i + 1, 4)}`}>
              <div className="lp-font-m" style={{ fontSize: '0.68rem', color: '#3b82f6', letterSpacing: '0.1em', marginBottom: '0.85rem' }}>STEP {s.step}</div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1rem' }}>{s.icon}</div>
              <h3 className="lp-font-d" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ color: '#6b7a99', fontSize: '0.83rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERNSHIP DOMAINS ── */}
      <section id="domains" style={{ padding: '7rem 5%', background: '#060910' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem', maxWidth: 1100, margin: '0 auto 3rem' }}>
          <div>
            <div className="lp-section-label lp-reveal">Internship Domains</div>
            <h2 className="lp-section-title lp-reveal lp-d1">12+ Domains to Master</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem' }}>Industry-relevant programs with real-world projects.</p>
          </div>
          <button className="lp-btn-glow lp-reveal" onClick={() => navigate('/auth')} style={{ whiteSpace: 'nowrap' }}>Explore All →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem', maxWidth: 1100, margin: '0 auto' }}>
          {DOMAINS.map((d, i) => (
            <div key={d.name} className={`lp-domain-card lp-reveal lp-d${Math.min(i + 1, 4)}`}>
              <div style={{ fontSize: '2.4rem', marginBottom: '0.85rem', display: 'block' }}>{d.icon}</div>
              <h3 className="lp-font-d" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>{d.name}</h3>
              <p style={{ color: '#6b7a99', fontSize: '0.83rem', lineHeight: 1.6, marginBottom: '1rem' }}>Industry-curated curriculum with hands-on projects and weekly mentorship sessions.</p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="lp-font-m" style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', color: '#6b7a99' }}>{d.duration}</span>
                <span className="lp-font-m" style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', color: '#6b7a99' }}>{d.seats} Seats</span>
                {d.tags.map(t => <span key={t} className="lp-font-m" style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', color: '#6b7a99' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CERTIFICATES ── */}
      <section id="features" style={{ padding: '7rem 5%', background: '#0b1120' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }} className="lp-grid-1">
          <div>
            <div className="lp-section-label lp-reveal">Documents</div>
            <h2 className="lp-section-title lp-reveal lp-d1">3 Professional Documents<br />on Completion</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', marginBottom: '2rem' }}>All documents are professionally designed PDFs with Hiresnix branding and authorized signatures.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🏆', title: 'Certificate of Completion', desc: 'Landscape A4 · Gold border · Certificate No · Signature' },
                { icon: '📄', title: 'Internship Completion Letter', desc: 'Official letterhead · Start & end dates · Admin remarks' },
                { icon: '✉️', title: 'Letter of Recommendation', desc: 'Personalized · Performance rating · Program Director signed' },
              ].map((doc, i) => (
                <div key={doc.title} className={`lp-cert-doc lp-reveal lp-d${i + 1}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.4rem', background: '#141d2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                  <span style={{ fontSize: '1.7rem' }}>{doc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{doc.title}</div>
                    <div style={{ color: '#6b7a99', fontSize: '0.78rem' }}>{doc.desc}</div>
                  </div>
                  <span style={{ color: '#6b7a99', fontSize: '1.1rem' }}>→</span>
                </div>
              ))}
            </div>
          </div>
          {/* Certificate Preview */}
          <div className="lp-reveal lp-d2">
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', border: '2px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(245,158,11,0.12)', borderRadius: 14 }} />
              <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 70, objectFit: 'contain', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))' }} />
              <div className="lp-font-m" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Internship Certificate</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>This is to certify that</div>
              <div className="lp-font-d" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.3rem' }}>Jayesh Badjugar</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginBottom: '0.3rem' }}>has successfully completed</div>
              <div className="lp-font-d" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Certificate of Completion</div>
              <div style={{ height: 1, background: 'linear-gradient(to right,transparent,rgba(245,158,11,0.4),transparent)', margin: '1rem 0' }} />
              <div className="lp-font-m" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>Web Development · CERT-HRX2024 · hiresnix.co.in</div>
              <div style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: 6, marginTop: '1rem' }}>✦ ✦ ✦</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1.5rem' }}>
                {['CEO, Hiresnix', 'Program Director'].map(r => (
                  <div key={r} style={{ textAlign: 'center' }}>
                    <div style={{ width: 80, height: 1, background: 'rgba(245,158,11,0.35)', margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>{r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '7rem 5%', background: '#060910' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="lp-section-label lp-reveal">Testimonials</div>
          <h2 className="lp-section-title lp-reveal lp-d1">What Students Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', maxWidth: 1100, margin: '0 auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className={`lp-testimonial lp-reveal lp-d${i + 1}`} style={{ background: '#141d2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '1.75rem' }}>
              <div style={{ color: '#fbbf24', fontSize: '0.78rem', marginBottom: '0.75rem' }}>★★★★★</div>
              <div style={{ fontFamily: 'serif', color: '#60a5fa', fontSize: '1.8rem', lineHeight: 1, marginBottom: '0.75rem' }}>"</div>
              <p style={{ color: '#6b7a99', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${t.color}22`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Sora',sans-serif" }}>{t.avatar}</div>
                <div>
                  <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.name}</div>
                  <div style={{ color: '#6b7a99', fontSize: '0.75rem' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOR COMPANIES ── */}
      <section id="companies" style={{ padding: '7rem 5%', background: '#0b1120' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }} className="lp-grid-1">
          <div>
            <div className="lp-section-label lp-reveal">For Startups & Companies</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Post Jobs &<br />Find Top Talent</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', marginBottom: '2rem' }}>Get access to pre-screened, trained students ready for real work. Post jobs, review applications, and hire faster.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                ['01', 'Register & Get Verified', 'Quick onboarding. Admin verifies your company within 24 hours.'],
                ['02', 'Post Jobs in Minutes', 'Set CGPA filters, allowed branches, salary range, and deadlines.'],
                ['03', 'Review & Hire', 'View applications, schedule interviews, mark selected candidates.'],
              ].map(([num, title, desc], i) => (
                <div key={num} className={`lp-benefit lp-reveal lp-d${i + 1}`} style={{ display: 'flex', gap: '1rem', padding: '1.1rem 1.3rem', background: '#141d2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                  <div className="lp-font-m" style={{ fontSize: '0.65rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{num}</div>
                  <div>
                    <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.2rem' }}>{title}</div>
                    <div style={{ color: '#6b7a99', fontSize: '0.82rem', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="lp-btn-glow lp-reveal lp-d4" style={{ marginTop: '1.75rem' }} onClick={() => navigate('/auth')}>Register Company →</button>
          </div>
          {/* Dashboard mock */}
          <div className="lp-reveal lp-d2">
            <div style={{ background: '#141d2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#111827', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span className="lp-font-m" style={{ fontSize: '0.72rem', color: '#6b7a99', marginLeft: '0.4rem' }}>Company Dashboard</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {[['24', '#60a5fa', 'Applications'], ['8', '#10b981', 'Shortlisted'], ['3', '#f59e0b', 'Selected']].map(([num, color, label]) => (
                    <div key={label} style={{ background: '#111827', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
                      <div className="lp-font-d" style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{num}</div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7a99', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="lp-font-m" style={{ fontSize: '0.68rem', color: '#6b7a99', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>RECENT APPLICATIONS</div>
                {[['R','Rahul Sharma','#3b82f6','rgba(59,130,246,0.15)','Selected','rgba(16,185,129,0.15)','#10b981'],
                  ['P','Priya Desai','#8b5cf6','rgba(139,92,246,0.15)','Under Review','rgba(245,158,11,0.15)','#f59e0b'],
                  ['A','Arjun Patil','#10b981','rgba(16,185,129,0.15)','Applied','rgba(59,130,246,0.15)','#60a5fa']].map(([av, name, ac, bg, status, sbg, sc]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: bg as string, color: ac as string, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>{av}</div>
                    <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>{name}</div>
                    <div className="lp-font-m" style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 6, background: sbg as string, color: sc as string }}>{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── ENQUIRY FORM ── */}
      <section style={{ padding: '7rem 5%', background: '#060910' }}>
        <EnquiryForm />
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '8rem 5%', background: '#060910', textAlign: 'center' }}>
        <div className="lp-reveal" style={{ maxWidth: 780, margin: '0 auto', background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 28, padding: '4.5rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, background: 'radial-gradient(circle,rgba(59,130,246,0.12),transparent 70%)', borderRadius: '50%' }} />
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 80, objectFit: 'contain', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))' }} />
          <h2 className="lp-font-d" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, marginBottom: '0.85rem', lineHeight: 1.2 }}>
            Ready to Start Your<br />
            <span style={{ background: 'linear-gradient(135deg,#60a5fa,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tech Career Journey?</span>
          </h2>
          <p style={{ color: '#6b7a99', fontSize: '1.05rem', marginBottom: '2.25rem' }}>Join hundreds of students already training and getting placed through Hiresnix</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <button className="lp-btn-glow" onClick={() => navigate('/auth')}>🎓 Start Internship Free</button>
            <button className="lp-btn-outline" onClick={() => navigate('/auth')}>💼 Browse Jobs</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060910', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '3.5rem 5% 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem', maxWidth: 1100, margin: '0 auto 2.5rem' }} className="lp-grid-1">
          <div>
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 56, objectFit: 'contain', marginBottom: '0.85rem', filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.4))' }} />
            <p style={{ color: '#6b7a99', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>Elevating talent. Empowering futures. Connecting students with real internship training and startup jobs across India.</p>
          </div>
          {[['Platform', ['Job Portal', 'Internship Portal', 'Browse Domains', 'Browse Jobs']],
            ['Students', ['How to Apply', 'Training Process', 'Certificates', 'Success Stories']],
            ['Companies', ['Register Company', 'Post a Job', 'Hire Interns', 'Contact Us']]].map(([title, links]) => (
            <div key={title as string}>
              <h4 className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '1.1rem' }}>{title as string}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {(links as string[]).map(l => <li key={l}><a href="#" style={{ color: '#6b7a99', textDecoration: 'none', fontSize: '0.83rem', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: '#6b7a99', fontSize: '0.8rem' }}>© 2026 <span style={{ color: '#60a5fa' }}>Hiresnix</span>. All rights reserved. Made with ❤️ in Pune, India.</p>
          <p className="lp-font-m" style={{ fontSize: '0.72rem', color: '#6b7a99' }}>v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}
