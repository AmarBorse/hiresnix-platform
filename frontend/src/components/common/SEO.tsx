import { useEffect } from 'react';
import { COMPANY, organizationSchema } from '../../lib/companyInfo';

type SEOProps = {
  title: string;
  description: string;
  path: string;
  type?: string;
  structuredData?: Record<string, unknown>;
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
};

export function SEO({ title, description, path, type = 'website', structuredData }: SEOProps) {
  useEffect(() => {
    const canonical = `${COMPANY.website}${path}`;
    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: COMPANY.brand });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    const previous = document.head.querySelector('script[data-hsx-schema="true"]');
    previous?.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.hsxSchema = 'true';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [organizationSchema, structuredData].filter(Boolean),
    });
    document.head.appendChild(script);
  }, [description, path, structuredData, title, type]);

  return null;
}
