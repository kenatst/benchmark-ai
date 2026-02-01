import { ReportInput } from '@/types/report';

export const SECTORS = [
  'SaaS / Software',
  'E-commerce',
  'Agency / Consulting',
  'Local Services',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Food & Beverage',
  'Travel & Hospitality',
  'Other'
];

export const ACQUISITION_CHANNELS = [
  'Organic Search (SEO)',
  'Paid Ads (Google/Meta)',
  'Social Media',
  'Content Marketing',
  'Email Marketing',
  'Referrals',
  'Partnerships',
  'Events/Networking',
  'Cold Outreach',
  'Marketplace/Platform'
];

export const BENCHMARK_GOALS = [
  { id: 'competitors', label: 'Competitor map', description: 'Understand who you\'re competing against' },
  { id: 'pricing', label: 'Pricing strategy', description: 'Optimize your pricing tiers' },
  { id: 'positioning', label: 'Positioning & messaging', description: 'Differentiate your brand' },
  { id: 'gtm', label: 'Go-to-market plan', description: 'Plan your market entry' },
  { id: 'risks', label: 'Risks & compliance', description: 'Identify potential challenges' },
  { id: 'growth', label: 'Growth opportunities', description: 'Find new revenue streams' }
];

export const DIFFERENTIATORS = [
  'Price',
  'Quality',
  'Speed',
  'Customer Service',
  'Technology',
  'Local Expertise',
  'Specialization',
  'Experience',
  'Warranty/Guarantee',
  'Customization'
];

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Sweden',
  'Norway',
  'Denmark',
  'Brazil',
  'Mexico',
  'Japan',
  'Singapore',
  'India',
  'Other'
];

export const initialFormData: ReportInput = {
  businessName: '',
  website: '',
  sector: '',
  sectorDetails: '',
  location: { city: '', country: '' },
  targetCustomers: { type: 'B2B', persona: '' },
  whatYouSell: '',
  priceRange: { min: 0, max: 1000 },
  differentiators: [],
  acquisitionChannels: [],
  goals: [],
  competitors: [],
  budgetLevel: 'medium',
  timeline: 'now',
  notes: '',
  tonePreference: 'professional'
};
