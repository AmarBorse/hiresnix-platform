// src/components/GlobalAnimations.tsx
// Global animations for all pages — scroll fade, hover effects, page transitions

import { useEffect } from 'react';

export function GlobalAnimations() {
  useEffect(() => {
    // ── 1. Inject global CSS animations ──────────────────────────
    const style = document.createElement('style');
    style.id = 'hx-global-animations';
    style.textContent = `
      /* ── Professional Background ── */
      body {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 70%, #0c1a2e 100%) !important;
        min-height: 100vh;
      }
      /* Light pages (student/admin dashboards) */
      .bg-\[\#F5F6FA\] {
        background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%) !important;
      }

      /* ── Glassmorphism / Mirror Cards ── */
      .glass-card,
      .bg-white.rounded-xl,
      .bg-white.rounded-2xl,
      .bg-white.rounded-lg {
        background: rgba(255,255,255,0.85) !important;
        backdrop-filter: blur(20px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
        border: 1px solid rgba(255,255,255,0.6) !important;
        box-shadow: 0 8px 32px rgba(99,102,241,0.08), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9) !important;
      }
      .bg-white.rounded-xl:hover,
      .bg-white.rounded-2xl:hover {
        background: rgba(255,255,255,0.92) !important;
        box-shadow: 0 16px 48px rgba(99,102,241,0.14), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1) !important;
        transform: translateY(-2px);
      }

      /* ── Admin/Institution dark sidebar glass ── */
      .bg-\[\#0F172A\] {
        background: linear-gradient(180deg, #0f172a 0%, #1a1040 100%) !important;
        border-right: 1px solid rgba(255,255,255,0.06) !important;
      }

      /* ── Stat cards glass ── */
      .bg-white.rounded-xl p,
      .bg-white.rounded-xl span {
        position: relative;
        z-index: 1;
      }

      /* ── Table glass ── */
      .bg-white.rounded-xl table,
      .bg-white.shadow-sm {
        background: transparent !important;
      }

      /* ── Input glass ── */
      input, select, textarea {
        background: rgba(255,255,255,0.8) !important;
        backdrop-filter: blur(8px) !important;
        border: 1px solid rgba(99,102,241,0.2) !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
      }
      input:focus, select:focus, textarea:focus {
        background: rgba(255,255,255,0.95) !important;
        border-color: rgba(99,102,241,0.5) !important;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
      }

      /* ── Modal glass ── */
      .fixed.inset-0 > div.bg-white {
        background: rgba(255,255,255,0.9) !important;
        backdrop-filter: blur(24px) !important;
        border: 1px solid rgba(255,255,255,0.7) !important;
        box-shadow: 0 32px 80px rgba(0,0,0,0.2), 0 8px 32px rgba(99,102,241,0.15) !important;
      }

      /* ── Page background mesh ── */
      main {
        position: relative;
      }
      main::before {
        content: '';
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 60% 10%, rgba(59,130,246,0.05) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
      }
      main > * {
        position: relative;
        z-index: 1;
      }

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

    // ── 2. Page transition ───────────────────────────────────────
    const main = document.querySelector('main');
    if (main) main.classList.add('hx-page-enter');

    // ── 3. Card hover — only on explicit .hx-card class ──────────
    // (Don't auto-add to prevent content disappearing)

    return () => {
      document.getElementById('hx-global-animations')?.remove();
    };
  }, []);

  return null; // No DOM output — pure side-effects
}