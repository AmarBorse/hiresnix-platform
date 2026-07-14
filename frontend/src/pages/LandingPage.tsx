// src/pages/LandingPage.tsx
import FloatingDots from '../components/FloatingDots';
import { HiresnixChatbot } from '../components/HiresnixChatbot';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

// ── Enquiry Form (preserved from original) ────────────────────────
const ENQUIRY_RESPONSE_TIMEOUT_MS = 8000;

function EnquiryForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: 'Software Development', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, padding: '3rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h3 className="lp-font-d" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8edf5', marginBottom: '0.75rem' }}>Message Received!</h3>
      <p style={{ color: '#6b7a99', marginBottom: '1.5rem' }}>Thank you! Our team will get back to you within 24 hours.</p>
      <button className="lp-btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', interest: 'Software Development', message: '' }); }}>
        Send Another
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="lp-grid-1">
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Mobile Number" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Interested In</label>
              <select value={form.interest} onChange={e => set('interest', e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                {['Software Development','AI Solutions','SaaS Product','Web Development','Mobile App','UI/UX Design','Internship Platform','Partnership','Other'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Message *</label>
            <textarea required rows={4} value={form.message} onChange={e => set('message', e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: '#e8edf5', fontSize: '0.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              placeholder="Tell us about your project or requirement..." />
          </div>
          <button type="submit" disabled={loading} className="lp-btn-glow" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Sending...' : '🚀 Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const countersRef = useRef<HTMLDivElement>(null);
  const countersAnimated = useRef(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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

  const TECH_STACK = ['React', 'Next.js', 'Node.js', 'Python', 'Java', 'Supabase', 'PostgreSQL', 'AWS', 'Docker', 'OpenAI', 'Gemini'];

  const SERVICES = [
    { icon: '⚡', title: 'Custom Software Development', desc: 'End-to-end software built for your exact business needs — from architecture to deployment.' },
    { icon: '🌐', title: 'Web Development', desc: 'Fast, responsive, and scalable web applications using modern frameworks and best practices.' },
    { icon: '📱', title: 'Mobile App Development', desc: 'Cross-platform mobile apps that deliver seamless user experiences on iOS and Android.' },
    { icon: '🤖', title: 'AI & Machine Learning', desc: 'Intelligent systems, NLP solutions, predictive models, and AI integrations for your product.' },
    { icon: '☁️', title: 'SaaS Development', desc: 'Multi-tenant SaaS platforms with subscription management, dashboards, and scalable infrastructure.' },
    { icon: '🎨', title: 'UI/UX Design', desc: 'Design-first approach — wireframes, prototypes, and pixel-perfect interfaces that convert.' },
    { icon: '🔗', title: 'API Development', desc: 'RESTful and GraphQL APIs built for performance, security, and third-party integrations.' },
    { icon: '🛡️', title: 'Cloud Solutions', desc: 'Cloud architecture, migration, and DevOps pipelines for reliable, scalable deployments.' },
    { icon: '🔧', title: 'Maintenance & Support', desc: 'Ongoing technical support, performance monitoring, and product iteration after launch.' },
  ];

  const PRODUCTS = [
    {
      icon: '🎓',
      tag: 'Platform',
      title: 'Internship Platform',
      subtitle: 'Hiresnix Internship',
      desc: 'Project-based internship programs connecting students with real-world tech experience, certificates, and career outcomes.',
      features: ['16+ Domains', 'Certificate & LOR', 'Job Portal', 'Admin Dashboard'],
      gradient: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(99,102,241,0.08))',
      border: 'rgba(59,130,246,0.3)',
      accent: '#60a5fa',
    },
    {
      icon: '🧠',
      tag: 'AI Product',
      title: 'AI Academy',
      subtitle: 'Hiresnix AI Academy',
      desc: 'AI-powered learning platform with voice mentor, live code execution, quizzes, and personalized AI teacher for each course.',
      features: ['AI Teacher (Groq)', 'Voice Mentor', 'Live Code Runner', 'AI Mentor Chat'],
      gradient: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(168,85,247,0.08))',
      border: 'rgba(139,92,246,0.3)',
      accent: '#a78bfa',
    },
    {
      icon: '🏫',
      tag: 'B2B SaaS',
      title: 'Institution Portal',
      subtitle: 'Institution Management',
      desc: 'Complete college and training institute management — student batches, course tracking, certificate issuance, and career IDs.',
      features: ['Batch Management', 'Bulk CSV Import', 'Certificate PDF', 'Academy Access'],
      gradient: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))',
      border: 'rgba(16,185,129,0.3)',
      accent: '#34d399',
    },
    {
      icon: '🎯',
      tag: 'AI Tool',
      title: 'AI Mock Interview',
      subtitle: 'Interview Prep',
      desc: 'Realistic AI-driven technical and HR interview practice with voice interaction and detailed performance feedback.',
      features: ['Technical Rounds', 'HR Interviews', 'Voice Input/Output', 'AI Feedback'],
      gradient: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.06))',
      border: 'rgba(245,158,11,0.25)',
      accent: '#fbbf24',
    },
  ];

  const INDUSTRIES = [
    { icon: '🎓', name: 'Education' },
    { icon: '🏥', name: 'Healthcare' },
    { icon: '🛍️', name: 'Retail' },
    { icon: '🏭', name: 'Manufacturing' },
    { icon: '💰', name: 'Finance' },
    { icon: '🚀', name: 'Startups' },
    { icon: '🛒', name: 'E-Commerce' },
  ];

  const WHY_US = [
    { icon: '🤖', title: 'AI-Powered Solutions', desc: 'We integrate AI at the core — not as an afterthought.' },
    { icon: '👥', title: 'Experienced Team', desc: 'Senior engineers and designers with proven delivery track records.' },
    { icon: '📐', title: 'Scalable Architecture', desc: 'Systems built to grow with your business from day one.' },
    { icon: '⚡', title: 'Modern Technologies', desc: 'React, Node.js, Python, PostgreSQL, Docker, and more.' },
    { icon: '🚀', title: 'Fast Delivery', desc: 'Agile sprints with regular demos and transparent updates.' },
    { icon: '🛡️', title: 'Long-Term Support', desc: 'We stay engaged post-launch for maintenance and improvements.' },
  ];

  const WORKFLOW = [
    { num: '01', title: 'Requirement Discussion', desc: 'Deep-dive into your goals, constraints, and vision.' },
    { num: '02', title: 'Planning', desc: 'Architecture, timeline, and technology stack finalized.' },
    { num: '03', title: 'Design', desc: 'Wireframes and UI prototypes reviewed and approved.' },
    { num: '04', title: 'Development', desc: 'Agile sprints with weekly demos and code reviews.' },
    { num: '05', title: 'Testing', desc: 'QA, performance, and security testing before launch.' },
    { num: '06', title: 'Deployment', desc: 'CI/CD pipeline setup with cloud infrastructure.' },
    { num: '07', title: 'Support', desc: 'Ongoing monitoring, updates, and feature additions.' },
  ];

  const MARQUEE_ITEMS = ['⚡ Custom Software', '🤖 AI Solutions', '☁️ SaaS Products', '🌐 Web Development', '📱 Mobile Apps', '🎨 UI/UX Design', '🔗 API Development', '🛡️ Cloud & DevOps'];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#060910', color: '#e8edf5', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');
        body { margin: 0; background-color: #060910; }
        .lp-readonly, .lp-readonly * { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
        .lp-readonly input, .lp-readonly textarea, .lp-readonly select { -webkit-user-select:auto; user-select:auto; }
        .lp-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(.16,1,.3,1), transform 0.65s cubic-bezier(.16,1,.3,1); }
        .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }
        .lp-d1 { transition-delay: 0.08s; } .lp-d2 { transition-delay: 0.16s; }
        .lp-d3 { transition-delay: 0.24s; } .lp-d4 { transition-delay: 0.32s; }
        .lp-font-d { font-family: 'Sora', system-ui, sans-serif; }
        .lp-font-m { font-family: 'JetBrains Mono', monospace; }
        .lp-btn-glow { display:inline-flex;align-items:center;gap:8px;background:#3b82f6;color:#fff;padding:0.85rem 1.75rem;border-radius:12px;font-weight:700;font-size:0.95rem;text-decoration:none;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 0 30px rgba(59,130,246,0.3); }
        .lp-btn-glow:hover { background:#2563eb;transform:translateY(-2px);box-shadow:0 0 50px rgba(59,130,246,0.5); }
        .lp-btn-outline { display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.15);color:#e8edf5;padding:0.85rem 1.75rem;border-radius:12px;font-weight:600;font-size:0.95rem;text-decoration:none;background:transparent;cursor:pointer;transition:all 0.3s; }
        .lp-btn-outline:hover { background:rgba(255,255,255,0.06);border-color:#3b82f6;color:#60a5fa; }
        .lp-glass-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;backdrop-filter:blur(12px);transition:all 0.4s; }
        .lp-glass-card:hover { border-color:rgba(59,130,246,0.35);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(59,130,246,0.1); }
        .lp-service-card { background:#0d1524;border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:1.75rem;transition:all 0.35s;position:relative;overflow:hidden; }
        .lp-service-card::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(59,130,246,0.06),transparent 60%);opacity:0;transition:opacity 0.4s; }
        .lp-service-card:hover { border-color:rgba(59,130,246,0.3);transform:translateY(-5px);box-shadow:0 20px 50px rgba(0,0,0,0.45); }
        .lp-service-card:hover::before { opacity:1; }
        .lp-orb { position:absolute;border-radius:50%;filter:blur(100px);opacity:0.1;animation:lpOrbFloat 10s ease-in-out infinite; }
        @keyframes lpOrbFloat { 0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-25px) scale(1.04);} }
        @keyframes lpPulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
        .lp-marquee-track { display:flex;gap:3rem;animation:lpMarquee 30s linear infinite;width:max-content; }
        .lp-marquee-track:hover { animation-play-state:paused; }
        @keyframes lpMarquee { from{transform:translateX(0);}to{transform:translateX(-50%);} }
        .lp-navbar { position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:68px;background:rgba(6,9,16,0.85);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.06);transition:all 0.3s; }
        .lp-nav-link { color:#8892a4;text-decoration:none;font-size:0.875rem;font-weight:500;transition:color 0.2s;letter-spacing:0.01em; }
        .lp-nav-link:hover { color:#e8edf5; }
        .lp-section-label { font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:#3b82f6;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:0.7rem; }
        .lp-section-title { font-family:'Sora',sans-serif;font-size:clamp(1.8rem,3.5vw,2.9rem);font-weight:800;letter-spacing:-0.025em;line-height:1.12;margin-bottom:1rem; }
        .lp-tech-pill { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:0.5rem 1.1rem;font-size:0.82rem;color:#8892a4;font-family:'JetBrains Mono',monospace;transition:all 0.25s;cursor:default; }
        .lp-tech-pill:hover { background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.4);color:#60a5fa; }
        .lp-workflow-step { position:relative;display:flex;flex-direction:column;align-items:center;gap:0.5rem; }
        .lp-workflow-step::after { content:'';position:absolute;top:18px;left:calc(50% + 22px);width:calc(100% - 44px);height:1px;background:linear-gradient(to right,rgba(59,130,246,0.4),rgba(59,130,246,0.1));z-index:0; }
        .lp-workflow-step:last-child::after { display:none; }
        .lp-industry-chip { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.25rem;text-align:center;transition:all 0.3s;cursor:default; }
        .lp-industry-chip:hover { background:rgba(59,130,246,0.07);border-color:rgba(59,130,246,0.25);transform:translateY(-3px); }
        .lp-product-card { border-radius:24px;padding:2rem;transition:all 0.4s;position:relative;overflow:hidden; }
        .lp-product-card:hover { transform:translateY(-8px);box-shadow:0 30px 70px rgba(0,0,0,0.5); }
        .lp-feature-tag { font-family:'JetBrains Mono',monospace;font-size:0.68rem;padding:3px 10px;border-radius:6px;background:rgba(255,255,255,0.06);color:#6b7a99;border:1px solid rgba(255,255,255,0.08); }
        .lp-why-card { background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:1.6rem;transition:all 0.35s; }
        .lp-why-card:hover { background:rgba(59,130,246,0.06);border-color:rgba(59,130,246,0.25);transform:translateY(-4px); }
        @keyframes lpGridShift { 0%,100%{opacity:0.4;}50%{opacity:0.7;} }
        .lp-grid-bg { animation:lpGridShift 8s ease-in-out infinite; }
        @media(max-width:768px){
          .lp-hide-mobile{display:none!important;}
          .lp-stack{flex-direction:column!important;}
          .lp-grid-1{grid-template-columns:1fr!important;}
          .lp-grid-2{grid-template-columns:1fr!important;}
          .lp-workflow-step::after{display:none;}
        }
        @media(max-width:480px){
          .lp-grid-3{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="lp-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="lp-hide-mobile">
          {[['#services', 'Services'], ['#products', 'Products'], ['#industries', 'Industries'], ['#about', 'About'], ['#contact', 'Contact']].map(([href, label]) => (
            <a key={href} href={href} className="lp-nav-link">{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button className="lp-btn-outline lp-hide-mobile" style={{ padding: '0.45rem 1.1rem', fontSize: '0.83rem' }} onClick={() => navigate('/auth')}>Login</button>
          <button className="lp-btn-glow" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }} onClick={() => navigate('/auth')}>Get Started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', overflow: 'hidden' }}>
        {/* Orbs */}
        <div className="lp-orb" style={{ width: 700, height: 700, background: '#3b82f6', top: -250, right: -150, animationDelay: '0s' }} />
        <div className="lp-orb" style={{ width: 500, height: 500, background: '#7c3aed', bottom: -150, left: -150, animationDelay: '-4s' }} />
        <div className="lp-orb" style={{ width: 350, height: 350, background: '#0ea5e9', top: '35%', left: '45%', animationDelay: '-7s' }} />
        {/* Grid */}
        <div className="lp-grid-bg" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black 0%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, textAlign: 'center', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem', animation: 'lpOrbFloat 7s ease-in-out infinite' }}>
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 130, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 60px rgba(59,130,246,0.6)) drop-shadow(0 0 120px rgba(59,130,246,0.15))' }} />
          </div>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', padding: '6px 18px', borderRadius: 100, fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace", color: '#60a5fa', marginBottom: '2rem', letterSpacing: '0.06em' }}>
            <span style={{ animation: 'lpPulse 2s ease-in-out infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
            AI-Powered Technology Company · Shirpur, Maharashtra
          </div>

          {/* Title */}
          <h1 className="lp-font-d" style={{ fontWeight: 800, fontSize: 'clamp(2.4rem,6.5vw,4.5rem)', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', color: '#e8edf5' }}>AI-Powered Software</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#60a5fa 0%,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Development &
            </span>
            <span style={{ display: 'block', color: '#e8edf5' }}>Technology Solutions</span>
          </h1>

          {/* Tagline */}
          <p className="lp-font-d" style={{ fontSize: '0.95rem', color: '#60a5fa', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '1.25rem', opacity: 0.85 }}>
            Building Intelligent Software. Developing Future Talent.
          </p>

          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: '#6b7a99', lineHeight: 1.75, maxWidth: 620, margin: '0 auto 2.75rem', fontWeight: 300 }}>
            We build scalable software, AI solutions and digital products for startups, businesses and educational institutions — while empowering future professionals through our technology ecosystem.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn-glow" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }} onClick={() => { document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Get Free Consultation</button>
            <button className="lp-btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }} onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore Products →</button>
          </div>

          {/* Stats */}
          <div ref={countersRef} style={{ display: 'flex', justifyContent: 'center', gap: '3.5rem', marginTop: '4.5rem', flexWrap: 'wrap' }}>
            {[['500', '+', 'Students Trained'], ['50', '+', 'Clients Served'], ['16', '+', 'Tech Domains'], ['95', '%', 'Client Satisfaction']].map(([count, suffix, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="lp-font-d" style={{ fontSize: '2.1rem', fontWeight: 800, background: 'linear-gradient(135deg,#e8edf5,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  data-count={count} data-suffix={suffix}>0{suffix}</div>
                <div style={{ color: '#6b7a99', fontSize: '0.72rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH MARQUEE ── */}
      <div style={{ overflow: 'hidden', padding: '1.1rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080d18' }}>
        <div className="lp-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#4a5568', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>
              <span style={{ color: '#3b82f6', opacity: 0.7 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: '8rem 5%', background: '#0a0f1e' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-label lp-reveal">What We Build</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Our Services</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>End-to-end technology services from ideation to deployment and beyond.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
            {SERVICES.map((s, i) => (
              <div key={s.title} className={`lp-service-card lp-reveal lp-d${Math.min((i % 4) + 1, 4)}`}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.1rem', position: 'relative', zIndex: 1 }}>{s.icon}</div>
                <h3 className="lp-font-d" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>{s.title}</h3>
                <p style={{ color: '#6b7a99', fontSize: '0.83rem', lineHeight: 1.65, position: 'relative', zIndex: 1 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY HIRESNIX ── */}
      <section id="about" style={{ padding: '7rem 5%', background: '#060910' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="lp-section-label lp-reveal">Why Us</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Why Choose Hiresnix</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>We combine deep technical expertise with a product mindset to deliver lasting value.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.1rem' }}>
            {WHY_US.map((w, i) => (
              <div key={w.title} className={`lp-why-card lp-reveal lp-d${Math.min((i % 3) + 1, 4)}`}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.85rem' }}>{w.icon}</div>
                <h3 className="lp-font-d" style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{w.title}</h3>
                <p style={{ color: '#6b7a99', fontSize: '0.82rem', lineHeight: 1.6 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" style={{ padding: '8rem 5%', background: '#0a0f1e' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-label lp-reveal">Built by Hiresnix</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Our Products</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>A suite of AI-powered platforms and tools built on our own technology — available for institutions, students, and businesses.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.5rem' }}>
            {PRODUCTS.map((p, i) => (
              <div key={p.title} className={`lp-product-card lp-reveal lp-d${Math.min(i + 1, 4)}`} style={{ background: p.gradient, border: `1px solid ${p.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2rem' }}>{p.icon}</div>
                  <span className="lp-font-m" style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', color: p.accent, border: `1px solid ${p.border}` }}>{p.tag}</span>
                </div>
                <div className="lp-section-label" style={{ color: p.accent, marginBottom: '0.3rem' }}>{p.subtitle}</div>
                <h3 className="lp-font-d" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>{p.title}</h3>
                <p style={{ color: '#8892a4', fontSize: '0.84rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>{p.desc}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.features.map(f => (
                    <span key={f} className="lp-feature-tag" style={{ borderColor: `${p.border}`, color: p.accent }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section id="industries" style={{ padding: '7rem 5%', background: '#060910' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="lp-section-label lp-reveal">Who We Serve</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Industries We Work In</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 450, margin: '0 auto' }}>We build solutions for diverse industries with tailored approaches and domain expertise.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '1rem' }} className="lp-grid-3">
            {INDUSTRIES.map((ind, i) => (
              <div key={ind.name} className={`lp-industry-chip lp-reveal lp-d${Math.min((i % 4) + 1, 4)}`}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{ind.icon}</div>
                <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ind.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ padding: '6rem 5%', background: '#0a0f1e', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="lp-section-label lp-reveal">Technology</div>
          <h2 className="lp-section-title lp-reveal lp-d1" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)' }}>Our Tech Stack</h2>
          <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '0.95rem', marginBottom: '2.5rem' }}>Modern, battle-tested technologies for every layer of your product.</p>
          <div className="lp-reveal lp-d3" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {TECH_STACK.map(tech => (
              <span key={tech} className="lp-tech-pill">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section style={{ padding: '8rem 5%', background: '#060910' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-label lp-reveal">Process</div>
            <h2 className="lp-section-title lp-reveal lp-d1">How We Work</h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 460, margin: '0 auto' }}>A clear, structured process from the first call to post-launch support.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="lp-reveal lp-d2">
            {WORKFLOW.map((step, i) => (
              <div key={step.num} className="lp-workflow-step" style={{ minWidth: 120 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: i === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                  <span className="lp-font-m" style={{ fontSize: '0.7rem', color: i === 0 ? '#60a5fa' : '#6b7a99' }}>{step.num}</span>
                </div>
                <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.3, color: '#c8d1e0' }}>{step.title}</div>
                <div style={{ color: '#4a5568', fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CLIENTS CHOOSE US ── */}
      <section style={{ padding: '7rem 5%', background: '#0a0f1e' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }} className="lp-grid-1">
            <div>
              <div className="lp-section-label lp-reveal">Client Trust</div>
              <h2 className="lp-section-title lp-reveal lp-d1">Why Clients<br />Choose Us</h2>
              <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', marginBottom: '2rem' }}>We're not just a vendor — we're a technology partner invested in your success.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  ['✦', 'High Quality Code', 'Clean, documented, and maintainable codebases built to last.'],
                  ['✦', 'Scalable Solutions', 'Architecture designed to scale from MVP to enterprise.'],
                  ['✦', 'Transparent Communication', 'Regular updates, demos, and honest timelines — always.'],
                  ['✦', 'Dedicated Support', 'A real team that responds fast and actually cares.'],
                  ['✦', 'Modern Tech Stack', 'We use the right tools — not the easiest or cheapest ones.'],
                ].map(([icon, title, desc], i) => (
                  <div key={title} className={`lp-reveal lp-d${Math.min(i + 1, 4)}`} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, alignItems: 'flex-start', transition: 'all 0.3s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(59,130,246,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; }}>
                    <span style={{ color: '#3b82f6', fontSize: '0.8rem', marginTop: 2 }}>{icon}</span>
                    <div>
                      <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</div>
                      <div style={{ color: '#6b7a99', fontSize: '0.8rem', lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Visual card */}
            <div className="lp-reveal lp-d2">
              <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, padding: '2.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle,rgba(59,130,246,0.12),transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, background: 'radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)', borderRadius: '50%' }} />
                {/* Mock project card */}
                <div style={{ background: '#111827', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.85rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🚀</div>
                    <div>
                      <div className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Project: EduTech SaaS</div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7a99' }}>React + Node.js + Supabase</div>
                    </div>
                    <span className="lp-font-m" style={{ marginLeft: 'auto', fontSize: '0.62rem', padding: '3px 9px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>Live</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
                    {[['98%', '#10b981', 'Uptime'], ['1.2s', '#60a5fa', 'Load Time'], ['A+', '#f59e0b', 'Lighthouse']].map(([val, color, label]) => (
                      <div key={label} style={{ background: '#0d1420', borderRadius: 10, padding: '0.65rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="lp-font-d" style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{val}</div>
                        <div style={{ fontSize: '0.6rem', color: '#6b7a99', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                  {['AI Integration ✓', 'Cloud Deploy ✓', 'API Docs ✓'].map(item => (
                    <span key={item} style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)', fontFamily: "'JetBrains Mono',monospace" }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT / CTA ── */}
      <section id="contact" style={{ padding: '8rem 5%', background: '#060910' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="lp-section-label lp-reveal">Get In Touch</div>
            <h2 className="lp-section-title lp-reveal lp-d1">Ready to Build Your<br /><span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Next Software Product?</span></h2>
            <p className="lp-reveal lp-d2" style={{ color: '#6b7a99', fontSize: '1rem', maxWidth: 480, margin: '0 auto 3rem' }}>Tell us about your project and let's figure out the best way to bring it to life.</p>
          </div>
          <EnquiryForm />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '7rem 5%', background: '#0a0f1e', textAlign: 'center' }}>
        <div className="lp-reveal" style={{ maxWidth: 760, margin: '0 auto', background: 'linear-gradient(135deg,rgba(59,130,246,0.07),rgba(139,92,246,0.07))', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 28, padding: '4.5rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 280, height: 280, background: 'radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)', borderRadius: '50%' }} />
          <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 72, objectFit: 'contain', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.4))', position: 'relative', zIndex: 1 }} />
          <h2 className="lp-font-d" style={{ fontSize: 'clamp(1.7rem,4vw,2.7rem)', fontWeight: 800, marginBottom: '0.85rem', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
            Let's Build Together.
          </h2>
          <p style={{ color: '#6b7a99', fontSize: '1rem', marginBottom: '2.25rem', position: 'relative', zIndex: 1 }}>From MVP to enterprise — we have the team, tools and experience to deliver.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <button className="lp-btn-glow" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }} onClick={() => { document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Book Consultation</button>
            <button className="lp-btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }} onClick={() => navigate('/auth')}>Login to Portal</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060910', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4rem 5% 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '3rem', maxWidth: 1100, margin: '0 auto 3rem' }} className="lp-grid-1">
          <div>
            <img src="/hiresnix-logo.png" alt="Hiresnix" style={{ height: 52, objectFit: 'contain', marginBottom: '1rem', filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.4))' }} />
            <p style={{ color: '#6b7a99', fontSize: '0.84rem', lineHeight: 1.75, marginBottom: '1.25rem', maxWidth: 300 }}>Building intelligent software and developing future-ready talent. AI-powered technology solutions for businesses and institutions across India.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="https://hiresnix.co.in" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a99', textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLAnchorElement).style.color = '#60a5fa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLAnchorElement).style.color = '#6b7a99'; }}>🌐</a>
              <a href="https://www.linkedin.com/company/hiresnix/" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a99', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'sans-serif', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLAnchorElement).style.color = '#60a5fa'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLAnchorElement).style.color = '#6b7a99'; }}>in</a>
            </div>
          </div>
          <div>
            <h4 className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.1rem', color: '#e8edf5' }}>Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Custom Software', 'Web Development', 'Mobile Apps', 'AI & ML', 'SaaS Products', 'UI/UX Design'].map(l => (
                <li key={l}><a href="#services" style={{ color: '#6b7a99', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.1rem', color: '#e8edf5' }}>Products</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Internship Platform', 'AI Academy', 'Institution Portal', 'AI Mock Interview'].map(l => (
                <li key={l}><a href="#products" style={{ color: '#6b7a99', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="lp-font-d" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.1rem', color: '#e8edf5' }}>Company</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                ['About Us', '/about-us'],
                ['Contact Us', '/contact-us'],
                ['Verify Certificate', '/verify'],
                ['Privacy Policy', '/privacy-policy'],
                ['Terms', '/terms-and-conditions'],
                ['Refund Policy', '/refund-policy'],
                ['Internship Policy', '/internship-policy'],
              ].map(([label, href]) => (
                <li key={href}><a href={href} style={{ color: '#6b7a99', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: '#4a5568', fontSize: '0.78rem', lineHeight: 1.7 }}>© 2020 <span style={{ color: '#60a5fa' }}>Hiresnix</span>. A Brand Operated by SR PATIL INFRASTRUCTURE PRIVATE LIMITED. CIN: U42909MH2024PTC429260. All Rights Reserved.</p>
          <p className="lp-font-m" style={{ fontSize: '0.68rem', color: '#4a5568' }}>v2.0.0</p>
        </div>
      </footer>

      <FloatingDots />
      <HiresnixChatbot />
    </div>
  );
}