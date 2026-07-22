// src/pages/blog/BlogPost.tsx
import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { BLOG_ARTICLES } from '../../data/blogData';

function renderMarkdown(content: string): string {
  return content
    .replace(/^## (.*$)/gm, '<h2 style="font-size:22px;font-weight:800;color:#fff;margin:32px 0 12px;letter-spacing:-0.5px">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size:17px;font-weight:700;color:#e2e8f0;margin:24px 0 10px">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#a5b4fc">$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(99,102,241,0.15);color:#a5b4fc;padding:2px 8px;border-radius:5px;font-family:monospace;font-size:13px">$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/, '').replace(/```$/, '');
      return `<pre style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;overflow-x:auto;margin:16px 0"><code style="font-family:monospace;font-size:13px;color:rgba(255,255,255,0.8);white-space:pre-wrap">${code}</code></pre>`;
    })
    .replace(/^\| (.*) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      return `<tr>${cells.map(c => `<td style="padding:10px 14px;border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.75);font-size:13px">${c.trim()}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.includes('<tr>'));
      const header = rows[0].replace(/td/g, 'th').replace(/color:rgba\(255,255,255,0\.75\)/g, 'color:#fff;font-weight:700');
      const body = rows.slice(2).join('\n');
      return `<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    })
    .replace(/^- (.*$)/gm, '<li style="color:rgba(255,255,255,0.7);margin:6px 0;font-size:15px;line-height:1.6">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, match => `<ul style="padding-left:20px;margin:12px 0">${match}</ul>`)
    .replace(/^(\d+)\. (.*$)/gm, '<li style="color:rgba(255,255,255,0.7);margin:6px 0;font-size:15px;line-height:1.6">$2</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#6366f1;text-decoration:none;font-weight:600" target="_blank">$1</a>')
    .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid #6366f1;padding:12px 16px;margin:16px 0;background:rgba(99,102,241,0.08);border-radius:0 8px 8px 0;color:rgba(255,255,255,0.7);font-style:italic">$1</blockquote>')
    .replace(/\n\n/g, '</p><p style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;margin:12px 0">')
    .replace(/^(?!<[h|u|o|l|t|b|p|d|c|h])(.+)$/gm, '<p style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.8;margin:12px 0">$1</p>');
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const article = BLOG_ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | Hiresnix Blog`;
      // Update meta description
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
      meta.setAttribute('content', article.description);
    }
    window.scrollTo(0, 0);
  }, [article]);

  if (!article) return (
    <div style={{ background: '#030508', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
      <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Article not found</h1>
      <Link to="/blog" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>← Back to Blog</Link>
    </div>
  );

  const CATEGORY_COLORS: Record<string, string> = {
    'Internships': '#22c55e',
    'Interview Prep': '#6366f1',
    'Resume Tips': '#f59e0b',
    'Career Tips': '#ef4444',
  };

  const catColor = CATEGORY_COLORS[article.category] || '#6366f1';
  const otherArticles = BLOG_ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,5,8,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Hiresnix</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/blog" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>← Blog</Link>
          <Link to="/auth" style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Get Started Free</Link>
        </div>
      </nav>

      {/* Article */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 60px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: `${catColor}22`, color: catColor, fontWeight: 700 }}>{article.category}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{article.readTime} read</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>By {article.author}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: -1, marginBottom: 16 }}>{article.title}</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{article.description}</p>

        {/* Content */}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />

        {/* Tags */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Tags</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>#{tag}</span>
            ))}
          </div>
        </div>

        {/* CTA Box */}
        <div style={{ marginTop: 48, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Hiresnix pe Free Shuru Karein 🚀</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>AI Mock Interview + Resume Builder + Portfolio — bilkul free</p>
          <Link to="/auth" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            Free Register Karein →
          </Link>
        </div>
      </div>

      {/* More Articles */}
      {otherArticles.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 40px 60px', maxWidth: 900, margin: '0 auto' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Aur Articles Padho</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {otherArticles.map(a => (
              <Link key={a.slug} to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, cursor: 'pointer' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>{a.title}</p>
                  <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: 12, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © 2026 Hiresnix — SR Patil Infrastructure Private Limited
      </div>
    </div>
  );
}
