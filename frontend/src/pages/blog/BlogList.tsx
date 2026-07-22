// src/pages/blog/BlogList.tsx
import { Link } from 'react-router-dom';
import { BLOG_ARTICLES } from '../../data/blogData';

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Internships': { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  'Interview Prep': { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  'Resume Tips': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Career Tips': { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

export function BlogList() {
  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,5,8,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Hiresnix</span>
        </Link>
        <Link to="/auth" style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Get Started Free</Link>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 40px 40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <span style={{ fontSize: 12, padding: '5px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontWeight: 700, letterSpacing: 1 }}>HIRESNIX BLOG</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, color: '#fff', marginTop: 16, marginBottom: 12, letterSpacing: -1 }}>Career Resources for Students</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>Internship tips, interview prep, resume guides — sabkuch free</p>
      </div>

      {/* Articles Grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
          {BLOG_ARTICLES.map(article => {
            const cat = CATEGORY_COLORS[article.category] || { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' };
            return (
              <Link key={article.slug} to={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, height: '100%', transition: 'all 0.3s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: cat.bg, color: cat.color, fontWeight: 700 }}>{article.category}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{article.readTime} read</span>
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 10 }}>{article.title}</h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 16 }}>{article.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>Read more →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))', borderTop: '1px solid rgba(99,102,241,0.2)', padding: '48px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.5 }}>Ready to Start Your Career Journey?</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>Free AI Mock Interview, Resume Builder, Portfolio — sab ek jagah</p>
        <Link to="/auth" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
          Hiresnix pe Free Register Karein →
        </Link>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: 12, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © 2026 Hiresnix — SR Patil Infrastructure Private Limited
      </div>
    </div>
  );
}
