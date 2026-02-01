import { LegacyReportOutput } from '@/types/report';

export const mockReportOutput: LegacyReportOutput = {
  title: "Benchmark Report: Your Business",
  executiveSummary: [
    "Your market position shows strong differentiation potential in the mid-tier segment",
    "Primary competitors focus on price, leaving quality-focused positioning underserved",
    "Recommended pricing strategy: value-based pricing with tiered packages",
    "Immediate opportunity: local market penetration through digital channels",
    "Key risk: new market entrants with VC funding in adjacent categories"
  ],
  marketOverview: "The market is experiencing 12% YoY growth with increasing demand for premium solutions. Digital transformation is accelerating buyer sophistication, creating opportunities for specialized providers. Local markets remain underserved by national players, presenting a strategic entry point.",
  targetSegments: [
    "Small business owners (10-50 employees) seeking efficiency gains",
    "Mid-market companies expanding into new territories",
    "Enterprise departments with autonomous budget authority",
    "Agencies and consultants serving the above segments"
  ],
  competitorTable: [
    {
      name: "Competitor A",
      url: "https://competitor-a.com",
      strengths: ["Brand recognition", "Large sales team", "Enterprise features"],
      weaknesses: ["Slow innovation", "Complex pricing", "Poor SMB support"],
      priceRange: "$99-499/mo"
    },
    {
      name: "Competitor B",
      url: "https://competitor-b.com",
      strengths: ["Low pricing", "Easy onboarding", "Modern UI"],
      weaknesses: ["Limited features", "No phone support", "Startup risk"],
      priceRange: "$29-149/mo"
    },
    {
      name: "Competitor C",
      url: "https://competitor-c.com",
      strengths: ["Industry expertise", "Strong integrations", "Local presence"],
      weaknesses: ["Dated interface", "Slow updates", "Hidden fees"],
      priceRange: "$149-599/mo"
    }
  ],
  positioningMatrix: {
    xAxisLabel: "Price (Low → High)",
    yAxisLabel: "Features (Basic → Advanced)",
    points: [
      { x: 30, y: 70, label: "Competitor A", isUser: false },
      { x: 20, y: 35, label: "Competitor B", isUser: false },
      { x: 60, y: 55, label: "Competitor C", isUser: false },
      { x: 45, y: 75, label: "Your Position", isUser: true }
    ]
  },
  pricingRecommendations: [
    "Starter tier at $79/mo to capture price-sensitive buyers",
    "Professional tier at $199/mo as the anchor offering",
    "Enterprise tier at $499/mo with custom features and SLA",
    "Annual billing discount of 20% to improve cash flow",
    "Consider usage-based component for scalability alignment"
  ],
  goToMarket: {
    channels: [
      "Content marketing: SEO-optimized blog targeting buyer keywords",
      "LinkedIn: Thought leadership and targeted ads to decision-makers",
      "Partnerships: Integration partners and reseller network",
      "Events: Local business meetups and industry conferences",
      "Referral program: Incentivize existing customers"
    ],
    messaging: [
      "Lead with outcomes, not features",
      "Emphasize local expertise and personalized service",
      "Use social proof from similar businesses",
      "Address switching costs and migration support",
      "Highlight ROI with concrete metrics"
    ]
  },
  risksAndChecks: [
    "Market timing: Verify buyer budget cycles and procurement timelines",
    "Competitive response: Monitor for pricing or feature matching",
    "Regulatory changes: Track industry compliance requirements",
    "Technology shifts: Assess AI/automation impact on value proposition",
    "Team capacity: Ensure resources match growth ambitions"
  ],
  actionPlan30_60_90: [
    {
      timeframe: "30",
      tasks: [
        "Finalize positioning statement and messaging framework",
        "Launch updated website with clear value proposition",
        "Set up analytics and conversion tracking",
        "Create 3 cornerstone content pieces",
        "Identify and reach out to 10 potential partners"
      ]
    },
    {
      timeframe: "60",
      tasks: [
        "Launch first paid advertising campaigns",
        "Publish case study from early customer",
        "Attend 2 industry events for networking",
        "Implement referral program",
        "Optimize pricing based on early feedback"
      ]
    },
    {
      timeframe: "90",
      tasks: [
        "Review and optimize all marketing channels",
        "Expand content production cadence",
        "Launch partnership co-marketing initiatives",
        "Assess product gaps based on competitor analysis",
        "Plan next quarter strategy based on results"
      ]
    }
  ],
  assumptionsAndQuestions: [
    "Assumption: Target market has budget authority for solutions in your price range",
    "Assumption: Competitors will not significantly change pricing in next 6 months",
    "Question: What is your current customer acquisition cost?",
    "Question: Do you have case studies or testimonials ready?",
    "Question: What is your timeline for team expansion?",
    "Validate: Confirm competitor URLs are current and pricing is accurate"
  ],
  sources: [
    "Industry reports and market sizing data",
    "Competitor website analysis",
    "Pricing page screenshots captured on analysis date",
    "User-provided business information"
  ]
};
