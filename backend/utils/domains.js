const DOMAIN_OPTIONS = [
  'UI/UX Design',
  'Web Development',
  'Python Development',
  'Data Science',
  'Digital Marketing',
  'QA Testing',
];

const domainAliases = DOMAIN_OPTIONS.reduce((acc, domain) => {
  acc[domain.toLowerCase()] = domain;
  return acc;
}, {
  uiux: 'UI/UX Design',
  'ui ux': 'UI/UX Design',
  'ui/ux': 'UI/UX Design',
  python: 'Python Development',
  web: 'Web Development',
  qa: 'QA Testing',
});

const normalizeDomain = value => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return domainAliases[normalized.toLowerCase()] || normalized;
};

const isValidDomain = value => DOMAIN_OPTIONS.includes(normalizeDomain(value));

module.exports = { DOMAIN_OPTIONS, normalizeDomain, isValidDomain };
