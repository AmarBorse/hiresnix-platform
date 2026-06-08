export const DOMAIN_OPTIONS = [
  'UI/UX Design',
  'Web Development',
  'Python Development',
  'Data Science',
  'Digital Marketing',
  'QA Testing',
] as const;

export type LearningDomain = typeof DOMAIN_OPTIONS[number];
