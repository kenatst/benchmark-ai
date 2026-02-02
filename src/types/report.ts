export type ReportStatus = 'draft' | 'paid' | 'processing' | 'ready' | 'failed';

export interface Competitor {
  name: string;
  url?: string;
  website?: string;
  type?: string;
  positioning?: string;
  pricing_found?: string;
  price_range?: string;
  strengths?: string[];
  weaknesses?: string[];
  threat_level?: string;
  priceRange?: string;
}

export interface PositioningPoint {
  x: number;
  y: number;
  label: string;
  name?: string;
  isUser?: boolean;
}

export interface ActionPlanItem {
  timeframe: '30' | '60' | '90';
  tasks: string[];
}

// New Claude output format - Standard tier
export interface StandardReportOutput {
  report_metadata: {
    title: string;
    generated_date: string;
    business_name: string;
    sector: string;
    location: string;
    tier: 'standard';
  };
  executive_summary: {
    headline: string;
    situation_actuelle: string;
    opportunite_principale: string;
    key_findings: string[];
    urgency_level: string;
    urgency_rationale: string;
  };
  market_context: {
    sector_overview: string;
    local_market_specifics: string;
    market_maturity: string;
    target_segments: Array<{
      segment_name: string;
      size_estimate: string;
      accessibility: string;
      value_potential: string;
      why_relevant: string;
    }>;
    key_trends_impacting: string[];
  };
  competitive_landscape: {
    competition_intensity: string;
    competitors_analyzed: Competitor[];
    competitive_gaps: string[];
    your_current_position: string;
    differentiation_opportunities: Array<{
      angle: string;
      feasibility: string;
      impact: string;
      description: string;
    }>;
  };
  positioning_recommendations: {
    recommended_positioning: string;
    rationale: string;
    target_audience_primary: string;
    value_proposition: string;
    tagline_suggestions: string[];
    key_messages: string[];
    messaging_dos: string[];
    messaging_donts: string[];
  };
  pricing_strategy: {
    current_assessment: string;
    market_benchmarks: {
      budget_tier: string;
      mid_tier: string;
      premium_tier: string;
    };
    recommended_pricing: Array<{
      package_name: string;
      suggested_price: string;
      what_includes: string[];
      rationale: string;
    }>;
    quick_wins: string[];
  };
  go_to_market: {
    priority_channels: Array<{
      channel: string;
      priority: string;
      why: string;
      first_action: string;
      expected_cac: string;
      expected_timeline: string;
    }>;
    content_strategy: {
      topics_to_own: string[];
      content_formats: string[];
      distribution_approach?: string;
    };
    partnership_opportunities: string[];
  };
  action_plan: {
    now_7_days: Array<{ action: string; owner: string; outcome: string }>;
    days_8_30: Array<{ action: string; owner: string; outcome: string }>;
    days_31_90: Array<{ action: string; owner: string; outcome: string }>;
    quick_wins_with_proof?: Array<{ action: string; why_now: string; expected_impact: string }>;
  };
  risks_and_considerations: Array<{ risk: string; impact: string; mitigation: string }> | {
    market_risks?: string[];
    competitive_threats?: string[];
    regulatory_considerations?: string[];
  };
  assumptions_and_limitations: string[];
  next_steps_to_validate: string[];
  sources?: Array<{ title: string; url: string }>;
}

// Pro tier extends standard with additional fields
export interface ProReportOutput extends Omit<StandardReportOutput, 'report_metadata' | 'executive_summary'> {
  report_metadata: {
    title: string;
    generated_date: string;
    business_name: string;
    sector: string;
    location: string;
    tier: 'pro';
    sources_count: number;
  };
  executive_summary: {
    headline: string;
    situation_actuelle: string;
    opportunite_principale: string;
    key_findings: string[];
    urgency_level: string;
    urgency_rationale: string;
    market_size_estimate: string;
    growth_rate: string;
  };
  market_intelligence: {
    sector_trends_2026: Array<{
      trend: string;
      impact_on_you: string;
      how_to_leverage: string;
    }>;
    local_market_data: {
      market_maturity: string;
      key_players_count: string;
      market_size_estimate: string;
      growth_rate: string;
      insights: string[];
    };
  };
  competitive_intelligence: {
    deep_competitor_profiles: Array<{
      name: string;
      positioning: string;
      digital_presence_score: number;
      strengths: string[];
      weaknesses: string[];
      threat_level: string;
    }>;
    competitive_matrix: {
      axes: { x_axis: string; y_axis: string };
      positions: Array<{ competitor: string; x: number; y: number }>;
    };
    white_spaces: string[];
  };
  customer_insights: {
    pain_points_identified: Array<{
      pain_point: string;
      evidence: string;
      opportunity: string;
    }>;
    unmet_needs: string[];
    switching_barriers: string[];
    decision_criteria: string[];
  };
}

// Agency tier has the most comprehensive output
export interface AgencyReportOutput {
  report_metadata: {
    title: string;
    generated_date: string;
    business_name: string;
    sector: string;
    location: string;
    tier: 'agency';
    sources_count: number;
  };
  executive_summary: {
    one_page_summary: string;
    situation_actuelle: string;
    opportunite_principale: string;
    strategic_recommendation: string;
    investment_required: string;
    expected_roi: string;
    critical_success_factors: string[];
    key_metrics_to_track: string[];
    urgency_assessment: {
      level: string;
      rationale: string;
      window_of_opportunity: string;
    };
  };
  market_analysis: {
    market_sizing: {
      total_addressable_market: string;
      serviceable_addressable_market: string;
      serviceable_obtainable_market: string;
      methodology: string;
    };
    market_dynamics: {
      growth_rate: string;
      maturity_stage: string;
      key_drivers: string[];
      headwinds: string[];
      inflection_points: string[];
    };
    pestel_analysis: {
      political: string[];
      economic: string[];
      social: string[];
      technological: string[];
      environmental: string[];
      legal: string[];
    };
    porter_five_forces: {
      competitive_rivalry: { score: number; analysis: string };
      supplier_power: { score: number; analysis: string };
      buyer_power: { score: number; analysis: string };
      threat_of_substitution: { score: number; analysis: string };
      threat_of_new_entry: { score: number; analysis: string };
      overall_attractiveness: string;
      strategic_implications: string;
    };
  };
  competitive_intelligence: {
    competition_landscape_overview: string;
    competitors_deep_dive: Array<{
      name: string;
      profile: { size: string; growth_trajectory: string };
      positioning: { value_prop: string; target_segment: string };
      offering: { products_services: string[]; pricing_model: string };
      strengths: string[];
      weaknesses: string[];
      threat_level: string;
      opportunities_vs_them: string;
    }>;
    competitive_positioning_maps: {
      primary_map: {
        x_axis: string;
        y_axis: string;
        competitors_plotted: Array<{ name: string; x: number; y: number }>;
        your_current_position: { x: number; y: number };
        recommended_position: { x: number; y: number };
        rationale: string;
      };
    };
    unmet_customer_needs: Array<{ need: string; evidence: string; how_to_address: string }>;
  };
  swot_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    strategic_priorities: string;
  };
  customer_intelligence: {
    segments_analyzed: Array<{
      segment_name: string;
      size_estimate: string;
      pain_points: string[];
      decision_criteria: string[];
      willingness_to_pay: string;
      acquisition_cost_estimate: string;
      lifetime_value_estimate: string;
      priority: string;
    }>;
    voice_of_customer: {
      common_complaints: string[];
      desired_features: string[];
      switching_barriers: string[];
    };
  };
  strategic_recommendations: {
    recommended_strategy: { strategic_archetype: string; rationale: string };
    positioning_strategy: {
      target_segment_primary: string;
      value_proposition: string;
      positioning_statement: string;
      reasons_to_believe: string[];
    };
    brand_strategy: {
      brand_essence: string;
      brand_personality: string[];
      brand_voice_description: string;
      tagline_options: string[];
      messaging_hierarchy: { primary_message: string; supporting_messages: string[] };
    };
    product_strategy: {
      core_offering_recommendation: string;
      tiering_strategy: Array<{
        tier_name: string;
        target_segment: string;
        key_features: string[];
        pricing_range: string;
      }>;
      product_roadmap_priorities: Array<{
        feature_initiative: string;
        priority: string;
        expected_impact: string;
      }>;
    };
    pricing_strategy: {
      pricing_model_recommendation: string;
      price_optimization_by_tier: Array<{
        tier: string;
        recommended_price: string;
        rationale: string;
      }>;
      upsell_cross_sell_opportunities: string[];
    };
    go_to_market_strategy: {
      customer_acquisition: {
        primary_channels_detailed: Array<{
          channel: string;
          rationale: string;
          investment_level: string;
          expected_cac: string;
          tactics: string[];
        }>;
        content_marketing_strategy: {
          strategic_themes: string[];
          content_formats_prioritized: string[];
        };
        partnership_opportunities_detailed: Array<{
          partner_type: string;
          examples: string[];
        }>;
      };
      sales_strategy: { sales_model: string; sales_process_recommendation: string };
    };
  };
  financial_projections: {
    investment_required: {
      total_12_months: number;
      breakdown: Array<{ category: string; amount: number; rationale: string }>;
    };
    revenue_scenarios: {
      conservative: { year_1: number; year_2: number; year_3: number; assumptions: string[] };
      baseline: { year_1: number; year_2: number; year_3: number; assumptions: string[] };
      optimistic: { year_1: number; year_2: number; year_3: number; assumptions: string[] };
    };
    unit_economics: {
      customer_acquisition_cost: number;
      lifetime_value: number;
      ltv_cac_ratio: number;
      payback_period_months: number;
      gross_margin_percent: number;
      comparison_to_benchmarks: string;
    };
  };
  implementation_roadmap: {
    phase_1_foundation: {
      timeline: string;
      objectives: string[];
      key_initiatives: Array<{
        initiative: string;
        owner_role: string;
        budget_estimate: string;
        success_metrics: string[];
        milestones: string[];
      }>;
    };
    phase_2_growth: {
      timeline: string;
      objectives: string[];
      key_initiatives: Array<{
        initiative: string;
        owner_role: string;
        budget_estimate: string;
        success_metrics: string[];
        milestones: string[];
      }>;
    };
    phase_3_scale: {
      timeline: string;
      objectives: string[];
      key_initiatives: Array<{
        initiative: string;
        owner_role: string;
        budget_estimate: string;
        success_metrics: string[];
        milestones: string[];
      }>;
    };
  };
  risk_register: Array<{
    risk: string;
    impact: string;
    probability: string;
    mitigation: string;
    contingency: string;
  }>;
  assumptions_and_limitations: string[];
  sources: Array<{ title: string; url: string }>;
}

// Union type for all report outputs
export type ReportOutput = StandardReportOutput | ProReportOutput | AgencyReportOutput;

// Legacy output format for backward compatibility
export interface LegacyReportOutput {
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
  sectorDetails?: string; // Used when sector is "Other"
  location: {
    city: string;
    country: string;
  };
  targetCustomers: {
    type: 'B2B' | 'B2C' | 'Both';
    persona: string;
  };
  // Strategic context (Phase 2 additions)
  businessMaturity?: 'idea' | 'mvp' | 'pmf' | 'scaleup';
  annualRevenue?: '<10k' | '10-50k' | '50-200k' | '200k+';
  teamSize?: 'solo' | '2-5' | '6-20' | '20+';

  // Step 2 - Offer & Pricing
  whatYouSell: string;
  priceRange: {
    min: number;
    max: number;
  };
  differentiators: string[];
  acquisitionChannels: string[];
  // Strategic context (Phase 2 additions)
  uniqueValueProposition?: string;
  businessModel?: 'one-shot' | 'subscription-monthly' | 'subscription-annual' | 'usage-based' | 'commission' | 'freemium';
  grossMargin?: '<20' | '20-50' | '50-70' | '70+';

  // Step 3 - Benchmark Goals
  goals: string[];
  goalPriorities?: string[]; // Ordered by priority
  successMetrics?: string;

  // Step 4 - Competitors
  competitors: { name: string; url?: string; type?: 'direct' | 'indirect' | 'substitute' }[];
  competitorAdvantage?: string; // Why competitors win

  // Step 5 - Constraints & Context
  budgetLevel: 'low' | 'medium' | 'high';
  timeline: 'now' | '30days' | '90days';
  notes?: string;
  tonePreference: 'professional' | 'bold' | 'minimalist';
  reportLanguage?: string; // fr, en, es, it, de, ru, zh
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
