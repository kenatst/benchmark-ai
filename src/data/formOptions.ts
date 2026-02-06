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
  { id: 'competitors', label: 'Carte concurrentielle', description: 'Identifier et analyser vos concurrents' },
  { id: 'pricing', label: 'Stratégie tarifaire', description: 'Optimiser vos prix et packages' },
  { id: 'positioning', label: 'Positionnement & messaging', description: 'Différencier votre marque' },
  { id: 'gtm', label: 'Plan go-to-market', description: 'Planifier votre entrée sur le marché' },
  { id: 'risks', label: 'Risques & conformité', description: 'Identifier les défis potentiels' },
  { id: 'growth', label: 'Opportunités de croissance', description: 'Trouver de nouveaux leviers de revenu' }
];

export const DIFFERENTIATORS = [
  'Prix',
  'Qualité',
  'Rapidité',
  'Service client',
  'Technologie',
  'Expertise locale',
  'Spécialisation',
  'Expérience',
  'Garantie',
  'Sur-mesure'
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

// Phase 2: New strategic options
export const BUSINESS_MATURITY = [
  { id: 'idea', label: 'Idée / Concept', description: 'Validation en cours' },
  { id: 'mvp', label: 'MVP', description: 'Premiers clients, <10k€/mois' },
  { id: 'pmf', label: 'Product-Market Fit', description: 'Croissance stable, 10-50k€/mois' },
  { id: 'scaleup', label: 'Scale-up', description: 'Accélération, >50k€/mois' }
];

export const ANNUAL_REVENUE = [
  { id: '<10k', label: '< 10 000 €' },
  { id: '10-50k', label: '10 000 - 50 000 €' },
  { id: '50-200k', label: '50 000 - 200 000 €' },
  { id: '200k+', label: '> 200 000 €' }
];

export const TEAM_SIZE = [
  { id: 'solo', label: 'Solo founder' },
  { id: '2-5', label: '2-5 personnes' },
  { id: '6-20', label: '6-20 personnes' },
  { id: '20+', label: '> 20 personnes' }
];

export const BUSINESS_MODELS = [
  { id: 'one-shot', label: 'One-shot / Projet', description: 'Paiement unique' },
  { id: 'subscription-monthly', label: 'Abonnement mensuel', description: 'Revenus récurrents mensuels' },
  { id: 'subscription-annual', label: 'Abonnement annuel', description: 'Paiement annuel upfront' },
  { id: 'usage-based', label: 'À l\'usage', description: 'Pay-as-you-go' },
  { id: 'commission', label: 'Commission', description: 'Pourcentage des transactions' },
  { id: 'freemium', label: 'Freemium', description: 'Gratuit + premium payant' }
];

export const GROSS_MARGINS = [
  { id: '<20', label: '< 20%', description: 'Hardware, retail' },
  { id: '20-50', label: '20-50%', description: 'Services, agency' },
  { id: '50-70', label: '50-70%', description: 'SaaS, logiciel' },
  { id: '70+', label: '> 70%', description: 'Infoproduits, digital' }
];

export const COMPETITOR_TYPES = [
  { id: 'direct', label: 'Direct', description: 'Même offre, même cible' },
  { id: 'indirect', label: 'Indirect', description: 'Offre différente, même besoin' },
  { id: 'substitute', label: 'Substitut', description: 'Alternative radicalement différente' }
];

export const initialFormData: ReportInput = {
  businessName: '',
  website: '',
  sector: '',
  sectorDetails: '',
  location: { city: '', country: '' },
  targetCustomers: { type: 'B2B', persona: '' },
  businessMaturity: undefined,
  annualRevenue: undefined,
  teamSize: undefined,
  whatYouSell: '',
  priceRange: { min: 0, max: 1000 },
  differentiators: [],
  acquisitionChannels: [],
  uniqueValueProposition: '',
  businessModel: undefined,
  grossMargin: undefined,
  goals: [],
  goalPriorities: [],
  successMetrics: '',
  competitors: [],
  competitorAdvantage: '',
  budgetLevel: 'medium',
  timeline: 'now',
  notes: '',
  tonePreference: 'professional',
  reportLanguage: 'fr'
};
