// src/pages/public/LatexReportPublic.tsx
import { useEffect, useRef, useState } from 'react';

export function LatexReportPublic() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/latex-tool.html')
      .then(r => r.text())
      .then(html => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(html);
        doc.close();
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: loading ? 'none' : 'block',
        }}
        title="LaTeX Report Generator"
      />
    </div>
  );
}