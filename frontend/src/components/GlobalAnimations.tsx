// src/components/GlobalAnimations.tsx
// Global animations for all pages — scroll fade, hover effects, page transitions

import { useEffect } from 'react';

export function GlobalAnimations() {
  useEffect(() => {
    // ── 1. Inject global CSS animations ──────────────────────────
    const style = document.createElement('style');
    style.id = 'hx-global-animations';
    style.textContent = `
      /* ── Page Load Fade In ── */
      @keyframes hxFadeIn {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes hxFadeInLeft {
        from { opacity: 0; transform: translateX(-24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes hxFadeInRight {
        from { opacity: 0; transform: translateX(24px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes hxScaleIn {
        from { opacity: 0; transform: scale(0.93); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes hxSlideDown {
        from { opacity: 0; transform: translateY(-16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes hxPulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        50%       { box-shadow: 0 0 16px 4px rgba(99,102,241,0.18); }
      }
      @keyframes hxSpin {
        to { transform: rotate(360deg); }
      }
      @keyframes hxFloat {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-6px); }
      }
      @keyframes hxShimmer {
        from { background-position: -200% center; }
        to   { background-position: 200% center; }
      }
      @keyframes hxBounceIn {
        0%   { opacity: 0; transform: scale(0.7); }
        60%  { opacity: 1; transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes hxCountUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Scroll Reveal ── */
      .hx-reveal {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.55s ease, transform 0.55s ease;
      }
      .hx-reveal.hx-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .hx-reveal-left {
        opacity: 0;
        transform: translateX(-24px);
        transition: opacity 0.55s ease, transform 0.55s ease;
      }
      .hx-reveal-left.hx-visible {
        opacity: 1;
        transform: translateX(0);
      }
      .hx-reveal-right {
        opacity: 0;
        transform: translateX(24px);
        transition: opacity 0.55s ease, transform 0.55s ease;
      }
      .hx-reveal-right.hx-visible {
        opacity: 1;
        transform: translateX(0);
      }

      /* ── Page Transition ── */
      .hx-page-enter {
        animation: hxFadeIn 0.35s ease both;
      }

      /* ── Card Hover ── */
      .hx-card-hover {
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }
      .hx-card-hover:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important;
      }

      /* ── Button Animations ── */
      button, a[role="button"] {
        transition: transform 0.15s ease, opacity 0.15s ease !important;
      }
      button:active, a[role="button"]:active {
        transform: scale(0.97) !important;
      }

      /* ── Table Row Hover ── */
      tbody tr {
        transition: background 0.15s ease !important;
      }

      /* ── Sidebar Nav Item ── */
      nav a {
        transition: background 0.18s ease, color 0.18s ease, transform 0.15s ease !important;
      }
      nav a:hover {
        transform: translateX(2px) !important;
      }

      /* ── Loading Skeleton ── */
      .hx-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% auto;
        animation: hxShimmer 1.4s linear infinite;
        border-radius: 6px;
      }

      /* ── Floating Badge ── */
      .hx-float {
        animation: hxFloat 3s ease-in-out infinite;
      }

      /* ── Stat Cards ── */
      .hx-stat-card {
        animation: hxScaleIn 0.4s ease both;
      }

      /* ── Modal Entrance ── */
      .hx-modal-enter {
        animation: hxBounceIn 0.32s ease both;
      }

      /* ── Stagger delays for lists ── */
      .hx-stagger > *:nth-child(1) { animation-delay: 0ms !important; }
      .hx-stagger > *:nth-child(2) { animation-delay: 60ms !important; }
      .hx-stagger > *:nth-child(3) { animation-delay: 120ms !important; }
      .hx-stagger > *:nth-child(4) { animation-delay: 180ms !important; }
      .hx-stagger > *:nth-child(5) { animation-delay: 240ms !important; }
      .hx-stagger > *:nth-child(6) { animation-delay: 300ms !important; }
      .hx-stagger > *:nth-child(7) { animation-delay: 360ms !important; }
      .hx-stagger > *:nth-child(8) { animation-delay: 420ms !important; }

      /* ── Smooth focus rings ── */
      input:focus, select:focus, textarea:focus {
        transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
      }

      /* ── Spinner ── */
      .hx-spin {
        animation: hxSpin 0.8s linear infinite;
      }

      /* ── Glow pulse (for badges/status) ── */
      .hx-pulse {
        animation: hxPulseGlow 2s ease-in-out infinite;
      }

      /* ── Toast slide in ── */
      [data-sonner-toast] {
        animation: hxFadeInRight 0.3s ease both !important;
      }
    `;
    document.head.appendChild(style);

    // ── 2. Scroll Reveal Observer ─────────────────────────────────
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hx-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Auto-tag cards, tables, stat boxes for scroll reveal
    const autoReveal = () => {
      const selectors = [
        '.bg-white.rounded-xl',
        '.bg-white.rounded-lg',
        'table',
        '.grid > div',
        '.space-y-4 > div',
        '.space-y-5 > div',
        '.space-y-6 > div',
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
          if (!el.classList.contains('hx-reveal') && !el.closest('[data-no-animate]')) {
            el.classList.add('hx-reveal');
            (el as HTMLElement).style.transitionDelay = `${Math.min(i * 40, 300)}ms`;
            revealObserver.observe(el);
          }
        });
      });
    };

    // Run on mount and after DOM changes
    autoReveal();
    const mutationObserver = new MutationObserver(() => autoReveal());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // ── 3. Page transition on route change ───────────────────────
    const main = document.querySelector('main');
    if (main) main.classList.add('hx-page-enter');

    // ── 4. Card hover on all white cards ─────────────────────────
    const addCardHover = () => {
      document.querySelectorAll('.bg-white.rounded-xl, .bg-white.rounded-lg').forEach(el => {
        if (!el.classList.contains('hx-card-hover') && !el.closest('[data-no-animate]')) {
          el.classList.add('hx-card-hover');
        }
      });
    };
    addCardHover();
    const cardObserver = new MutationObserver(() => addCardHover());
    cardObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.getElementById('hx-global-animations')?.remove();
      revealObserver.disconnect();
      mutationObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  return null; // No DOM output — pure side-effects
}
