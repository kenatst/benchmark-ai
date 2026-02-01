export type ReportStatus = 'draft' | 'paid' | 'processing' | 'ready' | 'failed';

export interface Competitor {
  name: string;
  url?: string;
  strengths?: string[];
  weaknesses?: string[];
  priceRange?: string;
}

export interface PositioningPoint {
  x: number;
  y: number;
  label: string;
  isUser?: boolean;
}

export interface ActionPlanItem {
  timeframe: '30' | '60' | '90';
  tasks: string[];
}

export interface ReportOutput {
  title: string;
  executiveSummary: string[];
  marketOverview: string;
  targetSegments: string[];
  competitorTable: Competitor[];
  positioningMatrix: {
    xAxisLabel: string;
    yAxisLabel: string;
    points: PositioningPoint[];
  };
  pricingRecommendations: string[];
  goToMarket: {
    channels: string[];
    messaging: string[];
  };
  risksAndChecks: string[];
  actionPlan30_60_90: ActionPlanItem[];
  assumptionsAndQuestions: string[];
  sources?: string[];
}

export interface ReportInput {
  // Step 1 - Basics
  businessName: string;
  website?: string;
  sector: string;
  location: {
    city: string;
    country: string;
  };
  targetCustomers: {
    type: 'B2B' | 'B2C' | 'Both';
    persona: string;
  };
  
  // Step 2 - Offer & Pricing
  whatYouSell: string;
  priceRange: {
    min: number;
    max: number;
  };
  differentiators: string[];
  acquisitionChannels: string[];
  
  // Step 3 - Benchmark Goals
  goals: string[];
  
  // Step 4 - Competitors
  competitors: { name: string; url?: string }[];
  
  // Step 5 - Constraints & Context
  budgetLevel: 'low' | 'medium' | 'high';
  timeline: 'now' | '30days' | '90days';
  notes?: string;
  tonePreference: 'professional' | 'bold' | 'minimalist';
}

export interface Report {
  id: string;
  userId: string;
  createdAt: string;
  status: ReportStatus;
  inputPayload: ReportInput;
  output?: ReportOutput;
  pdfUrl?: string;
  emailSent: boolean;
}
