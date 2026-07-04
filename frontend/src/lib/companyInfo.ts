export const COMPANY = {
  brand: 'Hiresnix',
  legalName: 'SR PATIL INFRASTRUCTURE PRIVATE LIMITED',
  cin: 'U42909MH2024PTC429260',
  registeredOffice: [
    'S. No.171, Plot No.52A',
    'Bansilal Nagar',
    'Shirpur',
    'Dhule',
    'Maharashtra - 425405',
  ],
  email: 'support@hiresnix.co.in',
  hrEmail: 'hr@hiresnix.co.in',
  website: 'https://hiresnix.co.in',
  roc: 'ROC Mumbai',
  incorporationDate: '2024',
  companyType: 'Private Limited Company',
  category: 'Company limited by shares',
  status: 'Active',
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY.legalName,
  alternateName: COMPANY.brand,
  brand: COMPANY.brand,
  url: COMPANY.website,
  email: COMPANY.email,
  legalName: COMPANY.legalName,
  identifier: COMPANY.cin,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'S. No.171, Plot No.52A, Bansilal Nagar',
    addressLocality: 'Shirpur',
    addressRegion: 'Maharashtra',
    postalCode: '425405',
    addressCountry: 'IN',
  },
};

export const registeredOfficeText = COMPANY.registeredOffice.join(', ');
