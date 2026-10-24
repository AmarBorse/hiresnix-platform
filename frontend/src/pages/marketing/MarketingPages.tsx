// src/pages/marketing/MarketingPages.tsx
// One page for each item in the site navigation. They reuse the landing page's
// sections and wording (pages/marketing/site.tsx) with a page header on top.
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SiteLayout, PageHeader, CtaBand, FactsStrip, ClientsBand, ServicesSection, AISection, ProcessSection,
  WorkSection, ProductsSection, InternshipsSection, ContactSection, useSiteClients, contactPath,
  SECTION_COPY, INTEREST_OPTIONS,
} from './site';

const useContact = () => {
  const navigate = useNavigate();
  return (interest: string) => navigate(contactPath(interest));
};

// /services
export function ServicesPage() {
  const contactFor = useContact();
  return (
    <SiteLayout title="Services | Hiresnix">
      <PageHeader crumb="Services" title={SECTION_COPY.services.title} lead={SECTION_COPY.services.lead}>
        <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => contactFor('Software Development')}>Start a project</button>
      </PageHeader>
      <ServicesSection head={false} onContact={contactFor} />
      <ProcessSection />
      <CtaBand interest="Software Development" />
    </SiteLayout>
  );
}

// /ai-solutions
export function AISolutionsPage() {
  const contactFor = useContact();
  return (
    <SiteLayout title="AI solutions | Hiresnix">
      <PageHeader crumb="AI solutions" title={SECTION_COPY.ai.title} lead={SECTION_COPY.ai.lead}>
        <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => contactFor('AI Solutions')}>Discuss an AI project</button>
      </PageHeader>
      <AISection head={false} onContact={contactFor} />
      <ProcessSection />
      <CtaBand interest="AI Solutions" />
    </SiteLayout>
  );
}

// /work
export function WorkPage() {
  const { landingClients, publicClients, ndaClients, allClients } = useSiteClients();
  return (
    <SiteLayout title="Client work | Hiresnix" revealKey={landingClients.length}>
      <PageHeader crumb="Work" title={SECTION_COPY.work.title} lead={SECTION_COPY.work.lead} />
      <div className="hx-wrap hx-page-facts"><FactsStrip /></div>
      <ClientsBand clients={allClients} />
      <WorkSection head={false} publicClients={publicClients} ndaClients={ndaClients} />
      <CtaBand interest="Software Development" />
    </SiteLayout>
  );
}

// /products
export function ProductsPage() {
  const contactFor = useContact();
  return (
    <SiteLayout title="Products | Hiresnix">
      <PageHeader crumb="Products" title={SECTION_COPY.products.title} lead={SECTION_COPY.products.lead} />
      <ProductsSection head={false} onContact={contactFor} />
      <CtaBand interest="Partnership" />
    </SiteLayout>
  );
}

// /internships
export function InternshipsPage() {
  const navigate = useNavigate();
  return (
    <SiteLayout title="Internships | Hiresnix">
      <PageHeader crumb="Internships" title={SECTION_COPY.internships.title} lead={SECTION_COPY.internships.lead}>
        <button className="hx-btn hx-btn-primary hx-btn-lg" type="button" onClick={() => navigate('/auth?tab=register')}>Apply for an internship</button>
        <button className="hx-btn hx-btn-ghost hx-btn-lg" type="button" onClick={() => navigate('/verify')}>Verify a certificate</button>
      </PageHeader>
      <InternshipsSection head={false} />
    </SiteLayout>
  );
}

// /contact  (accepts ?interest=… to pre-select "Interested in")
export function ContactPage() {
  const [params] = useSearchParams();
  const asked = params.get('interest') || '';
  const presetInterest = INTEREST_OPTIONS.includes(asked) ? asked : '';
  return (
    <SiteLayout title="Contact | Hiresnix">
      <PageHeader crumb="Contact" title={SECTION_COPY.contact.title} lead={SECTION_COPY.contact.lead} />
      <ContactSection head={false} presetInterest={presetInterest} />
    </SiteLayout>
  );
}
