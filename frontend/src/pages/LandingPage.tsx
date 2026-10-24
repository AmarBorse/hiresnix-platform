// src/pages/LandingPage.tsx
// Public landing page — Hiresnix as an AI-powered software development company.
// Hero: interactive animated scene of the Hiresnix arrow (pause, scrub, pointer tilt).
// Each nav item also has its own page (see pages/marketing/MarketingPages.tsx);
// the shared layout, sections and styles live in pages/marketing/site.tsx.
import { useState } from 'react';
import {
  SiteLayout, HeroScene, FactsStrip, ClientsBand, ServicesSection, AISection, ProcessSection,
  WorkSection, ProductsSection, InternshipsSection, ContactSection, useSiteClients, scrollToId,
} from './marketing/site';

export function LandingPage() {
  const [presetInterest, setPresetInterest] = useState('');
  const { landingClients, publicClients, ndaClients, allClients } = useSiteClients();

  // On the landing page "Start a project" buttons scroll down to the contact form
  const contactFor = (interest: string) => { setPresetInterest(interest); scrollToId('contact'); };

  return (
    <SiteLayout revealKey={landingClients.length} onStartProject={() => contactFor('Software Development')}>
      {/* ── Hero ── */}
      <section className="hx-hero">
        <div className="hx-wrap hx-hero-grid">
          <div className="hx-hero-copy">
            <h1 className="hx-h1">AI-powered software development for growing businesses.</h1>
            <p className="hx-lead">
              Hiresnix designs, builds and maintains web apps, mobile apps and AI products for startups, businesses
              and institutions across India, from the first sketch to support after launch.
            </p>
            <div className="hx-hero-ctas">
              <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
              <button className="hx-btn hx-btn-ghost hx-btn-lg" type="button" onClick={() => scrollToId('services')}>See our services</button>
            </div>
            <p className="hx-hero-login">
              Looking for an internship? <a href="#internships" onClick={e => { e.preventDefault(); scrollToId('internships'); }}>Explore internships</a>
            </p>
          </div>
          <div className="hx-hero-visual"><HeroScene /></div>
        </div>
        <div className="hx-wrap"><FactsStrip /></div>
        <ClientsBand clients={allClients} />
      </section>

      <ServicesSection onContact={contactFor} />
      <AISection onContact={contactFor} />
      <ProcessSection />
      <WorkSection publicClients={publicClients} ndaClients={ndaClients} />
      <ProductsSection onContact={contactFor} />
      <InternshipsSection />
      <ContactSection presetInterest={presetInterest} />
    </SiteLayout>
  );
}