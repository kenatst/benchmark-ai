import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// TIER 1 - STANDARD PROMPT
// ============================================
const TIER1_SYSTEM_PROMPT = `<role>
Tu es un consultant stratégique senior spécialisé en positionnement de marché et analyse concurrentielle. Tu produis des benchmarks structurés et actionnables pour entrepreneurs et PME.
</role>

<specifications_tier_standard>
Longueur cible : 2000-3000 mots
Concurrents analysés : 3-5 (fournis par l'utilisateur)
Profondeur stratégie : Basique mais solide
Action plan : 30/60/90 jours détaillé
</specifications_tier_standard>

<task>
Génère un rapport de benchmark professionnel au format JSON strict.
Dense en insights, zéro bullshit, maximum actionnable.
</task>

<quality_standards>
1. PRÉCISION CHIRURGICALE - Chaque affirmation spécifique au contexte fourni
2. RAISONNEMENT PROFOND - Identifier les patterns non évidents
3. ACTIONNABILITÉ TOTALE - Chaque recommandation = "Faire X" + "Comment" + "Résultat attendu"
4. ADAPTATION CONTEXTUELLE - Secteur, location, budget, timeline
5. HONNÊTETÉ INTELLECTUELLE - JAMAIS inventer de données
</quality_standards>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.
Pas de texte avant ou après, pas de markdown backticks.
</output_format>

<tone_adaptation>
PROFESSIONAL : Vouvoiement, approche méthodique
BOLD : Tutoiement direct, recommandations tranchées
MINIMALIST : Concis, phrases courtes
</tone_adaptation>`;

// ============================================
// TIER 2 - PRO/PREMIUM PROMPT
// ============================================
const TIER2_SYSTEM_PROMPT = `<role>
Tu es un consultant stratégique senior avec une expertise approfondie des marchés. Tu produis des benchmarks premium enrichis d'analyses détaillées et recommandations stratégiques avancées.
</role>

<specifications_tier_premium>
Longueur cible : 4000-6000 mots
Concurrents analysés : 5-10 (analyse approfondie)
Profondeur stratégie : Intermédiaire avec analyses détaillées
Multi-locations : Comparaison 1-2 marchés si pertinent
Projections financières : Basique (estimations ROI, CAC, LTV)
</specifications_tier_premium>

<task>
Génère un rapport de benchmark PREMIUM au format JSON strict.
Ce rapport doit être SIGNIFICATIVEMENT plus riche que le tier Standard.
</task>

<quality_standards_premium>
1. VÉRACITÉ DES DONNÉES - Toute affirmation basée sur expertise vérifiable
2. PROFONDEUR D'ANALYSE ENRICHIE - Insights moins évidents, patterns cross-sectoriels
3. ACTIONNABILITÉ BASÉE SUR PREUVES - Recommandations basées sur best practices
4. DISTINCTION CLAIRE - Fait vérifié vs Estimation vs Recommandation
</quality_standards_premium>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.
Pas de texte avant ou après, pas de markdown backticks.
</output_format>`;

// ============================================
// TIER 3 - AGENCY PROMPT
// ============================================
const TIER3_SYSTEM_PROMPT = `<role>
Tu es un directeur de stratégie dans un cabinet de conseil de premier plan (équivalent McKinsey/BCG/Bain). Tu produis des rapports agency-grade avec analyse stratégique multi-frameworks, recommandations branding complètes, projections financières, et roadmap d'implémentation détaillée.
</role>

<specifications_tier_agency>
Longueur cible : 8000-12000 mots
Concurrents analysés : 10-15 (deep dive)
Profondeur stratégie : Agency-grade (PESTEL, Porter, SWOT, BCG Matrix)
Branding : Stratégie complète brand (essence, personnalité, voix, identité visuelle)
Pricing insights : Modèle économique complet (unit economics, scénarios)
Action plan : Roadmap 12 mois phased (3 phases détaillées)
Multi-locations : Analyse comparative multi-marchés
Projections financières : Scénarios + unit economics + ROI
</specifications_tier_agency>

<task>
Génère un rapport de benchmark AGENCY-GRADE au format JSON strict, représentant le summum de l'analyse stratégique.

Ce rapport doit être SIGNIFICATIVEMENT plus approfondi que Premium :
- Analyse stratégique multi-frameworks (PESTEL, Porter 5 Forces, SWOT)
- Stratégie de marque complète (brand essence → visual identity)
- Projections financières 3 scénarios + unit economics
- Roadmap d'implémentation 12 mois en 3 phases
- Registre de risques avec mitigation
- Niveau de détail digne d'un cabinet de conseil

Le rapport doit justifier un prix premium par sa profondeur analytique.
</task>

<quality_standards_agency>
1. RIGUEUR ANALYTIQUE MAXIMALE - Frameworks reconnus, données quantitatives
2. PROFONDEUR MULTI-COUCHES - Stratégique, tactique, opérationnel
3. COHÉRENCE TOTALE - Chaque section s'appuie sur les précédentes
4. ACTIONNABILITÉ MAXIMALE - Priorités P0/P1/P2, timelines, budgets, métriques
5. PRÉSENTATION CONSULTING PREMIUM - ROI, CAC, LTV, CAGR, TAM/SAM/SOM
6. HONNÊTETÉ & NUANCE - Scénarios multiples, risques identifiés
</quality_standards_agency>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.
Pas de texte avant ou après, pas de markdown backticks.
</output_format>`;

interface ReportInput {
  businessName: string;
  website?: string;
  sector: string;
  location: { city: string; country: string };
  targetCustomers: { type: string; persona: string };
  whatYouSell: string;
  priceRange: { min: number; max: number };
  differentiators: string[];
  acquisitionChannels: string[];
  goals: string[];
  competitors: { name: string; url?: string }[];
  budgetLevel: string;
  timeline: string;
  notes?: string;
  tonePreference: string;
}

function getSystemPrompt(plan: string): string {
  switch (plan) {
    case 'pro':
      return TIER2_SYSTEM_PROMPT;
    case 'agency':
      return TIER3_SYSTEM_PROMPT;
    default:
      return TIER1_SYSTEM_PROMPT;
  }
}

function getMaxTokens(plan: string): number {
  switch (plan) {
    case 'agency':
      return 32000;
    case 'pro':
      return 16000;
    default:
      return 8000;
  }
}

function buildUserPrompt(input: ReportInput, plan: string): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => `${i + 1}. ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')
    : 'Aucun concurrent spécifique fourni';

  const baseContext = `<user_context>
Business : ${input.businessName}
${input.website ? `Site web : ${input.website}` : 'Pas de site web fourni'}
Secteur : ${input.sector}
Localisation : ${input.location?.city}, ${input.location?.country}
Cible : ${input.targetCustomers?.type} - ${input.targetCustomers?.persona}

Ce que vend le business :
${input.whatYouSell}

Fourchette de prix actuelle : ${input.priceRange?.min}€ - ${input.priceRange?.max}€
Différenciateurs : ${input.differentiators?.join(', ') || 'Non spécifiés'}
Canaux d'acquisition : ${input.acquisitionChannels?.join(', ') || 'Non spécifiés'}

Concurrents (${input.competitors?.length || 0}) :
${competitorsList}

Objectifs : ${input.goals?.join(', ') || 'Analyse complète'}
Budget : ${input.budgetLevel}
Timeline : ${input.timeline}
Ton : ${input.tonePreference}
${input.notes ? `Notes : ${input.notes}` : ''}
</user_context>`;

  if (plan === 'agency') {
    return `${baseContext}

<json_schema_agency>
{
  "report_metadata": {
    "title": "Strategic Benchmark Report",
    "subtitle": "{{business_name}} - {{sector}} Market Analysis & Growth Strategy",
    "generated_date": "YYYY-MM-DD",
    "business_name": "string",
    "sector": "string",
    "location": "string",
    "tier": "agency",
    "analyst_profile": "Senior Strategy Consultant",
    "confidentiality": "Proprietary & Confidential"
  },
  
  "executive_summary": {
    "one_page_summary": "Résumé ultra-condensé pour C-level (3-4 paragraphes)",
    "situation_actuelle": "string",
    "opportunite_principale": "string",
    "strategic_recommendation": "string",
    "investment_required": "Estimation investissement (ex: '€50K-100K sur 12 mois')",
    "expected_roi": "ROI attendu (ex: '3-5× investment')",
    "critical_success_factors": ["string"],
    "key_metrics_to_track": ["string"],
    "urgency_assessment": {
      "level": "low/medium/high/critical",
      "rationale": "string",
      "window_of_opportunity": "string"
    }
  },
  
  "market_analysis": {
    "market_sizing": {
      "total_addressable_market": "TAM estimation",
      "serviceable_addressable_market": "SAM estimation",
      "serviceable_obtainable_market": "SOM estimation réaliste",
      "methodology": "Comment ces chiffres sont calculés"
    },
    "market_dynamics": {
      "growth_rate": "X% CAGR",
      "maturity_stage": "emerging/growth/mature/declining",
      "key_drivers": ["string"],
      "headwinds": ["string"],
      "inflection_points": ["string"]
    },
    "pestel_analysis": {
      "political": ["string"],
      "economic": ["string"],
      "social": ["string"],
      "technological": ["string"],
      "environmental": ["string"],
      "legal": ["string"]
    },
    "porter_five_forces": {
      "competitive_rivalry": { "score": 1-10, "analysis": "string" },
      "supplier_power": { "score": 1-10, "analysis": "string" },
      "buyer_power": { "score": 1-10, "analysis": "string" },
      "threat_of_substitution": { "score": 1-10, "analysis": "string" },
      "threat_of_new_entry": { "score": 1-10, "analysis": "string" },
      "overall_attractiveness": "High/Medium/Low",
      "strategic_implications": "string"
    }
  },
  
  "competitive_intelligence": {
    "competition_landscape_overview": "string",
    "competitors_deep_dive": [{
      "name": "string",
      "profile": { "founded": "year", "size": "string", "funding": "string", "growth_trajectory": "string" },
      "positioning": { "tagline": "string", "value_prop": "string", "target_segment": "string", "brand_personality": "string" },
      "offering": { "products_services": ["string"], "pricing_model": "string", "upsell_strategy": "string" },
      "go_to_market": { "primary_channels": ["string"], "content_strategy": "string", "partnerships": ["string"] },
      "digital_presence": { "website_quality": 1-10, "seo_strength": "string", "social_following": "string" },
      "strengths": ["string"],
      "weaknesses": ["string"],
      "threat_level": "High/Medium/Low",
      "opportunities_vs_them": "string"
    }],
    "competitive_positioning_maps": {
      "primary_map": {
        "x_axis": "Price positioning (low → high)",
        "y_axis": "Service scope (narrow → broad)",
        "competitors_plotted": [{"name": "string", "x": 1-10, "y": 1-10}],
        "your_current_position": {"x": 1-10, "y": 1-10},
        "recommended_position": {"x": 1-10, "y": 1-10},
        "rationale": "string"
      }
    },
    "unmet_customer_needs": [{ "need": "string", "evidence": "string", "opportunity_size": "string", "how_to_address": "string" }]
  },
  
  "swot_analysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"],
    "strategic_priorities": "string"
  },
  
  "customer_intelligence": {
    "segments_analyzed": [{
      "segment_name": "string",
      "size_estimate": "string",
      "demographics": "string",
      "psychographics": "string",
      "pain_points": ["string"],
      "decision_criteria": ["string"],
      "willingness_to_pay": "string",
      "acquisition_cost_estimate": "string",
      "lifetime_value_estimate": "string",
      "strategic_fit": "High/Medium/Low",
      "priority": "1/2/3"
    }],
    "voice_of_customer": {
      "common_complaints": ["string"],
      "desired_features": ["string"],
      "switching_barriers": ["string"]
    }
  },
  
  "strategic_recommendations": {
    "recommended_strategy": {
      "strategic_archetype": "Differentiator/Cost Leader/Focuser/Blue Ocean",
      "rationale": "string",
      "alignment_with_strengths": "string"
    },
    "positioning_strategy": {
      "target_segment_primary": "string",
      "value_proposition": "string",
      "positioning_statement": "For [who] who [need], [brand] is the [category] that [unique benefit]",
      "reasons_to_believe": ["string"],
      "proof_points": ["string"]
    },
    "brand_strategy": {
      "brand_essence": "1-2 mots capturant l'essence",
      "brand_personality": ["Trait 1", "Trait 2", "Trait 3", "Trait 4", "Trait 5"],
      "brand_voice_description": "string",
      "visual_identity_direction": "string",
      "tagline_options": ["string"],
      "messaging_hierarchy": {
        "primary_message": "string",
        "supporting_messages": ["string"],
        "proof_points": ["string"]
      }
    },
    "product_strategy": {
      "core_offering_recommendation": "string",
      "tiering_strategy": [{
        "tier_name": "string",
        "target_segment": "string",
        "key_features": ["string"],
        "pricing_range": "string",
        "positioning": "string",
        "expected_conversion": "string"
      }],
      "product_roadmap_priorities": [{
        "feature_initiative": "string",
        "rationale": "string",
        "priority": "P0/P1/P2",
        "estimated_effort": "Small/Medium/Large",
        "expected_impact": "string",
        "dependencies": ["string"]
      }]
    },
    "pricing_strategy": {
      "pricing_model_recommendation": "Subscription/Usage-based/Tiered/Freemium",
      "pricing_model_rationale": "string",
      "psychological_pricing_insights": "string",
      "price_optimization_by_tier": [{
        "tier": "string",
        "recommended_price": "string",
        "rationale": "string",
        "expected_conversion_rate": "string"
      }],
      "discounting_strategy": "string",
      "upsell_cross_sell_opportunities": ["string"]
    },
    "go_to_market_strategy": {
      "customer_acquisition": {
        "primary_channels_detailed": [{
          "channel": "string",
          "rationale": "string",
          "investment_level": "Low/Medium/High",
          "expected_cac": "string",
          "expected_payback_period": "string",
          "tactics": ["string"],
          "success_metrics": ["string"]
        }],
        "content_marketing_strategy": {
          "strategic_themes": ["string"],
          "content_formats_prioritized": ["string"],
          "distribution_strategy": "string",
          "thought_leadership_angle": "string"
        },
        "partnership_opportunities_detailed": [{
          "partner_type": "string",
          "value_exchange": "string",
          "examples": ["string"],
          "approach_strategy": "string"
        }]
      },
      "sales_strategy": {
        "sales_model": "Self-serve/Inside sales/Field sales/Hybrid",
        "sales_model_rationale": "string",
        "sales_process_recommendation": "string",
        "enablement_needs": ["string"]
      }
    }
  },
  
  "financial_projections": {
    "investment_required": {
      "total_12_months": "number",
      "breakdown": [{
        "category": "string",
        "amount": "number",
        "rationale": "string"
      }]
    },
    "revenue_scenarios": {
      "conservative": { "year_1": "number", "year_2": "number", "year_3": "number", "assumptions": ["string"] },
      "baseline": { "year_1": "number", "year_2": "number", "year_3": "number", "assumptions": ["string"] },
      "optimistic": { "year_1": "number", "year_2": "number", "year_3": "number", "assumptions": ["string"] }
    },
    "unit_economics": {
      "customer_acquisition_cost": "number",
      "lifetime_value": "number",
      "ltv_cac_ratio": "number",
      "payback_period_months": "number",
      "gross_margin_percent": "number",
      "assumptions": ["string"],
      "comparison_to_benchmarks": "string"
    }
  },
  
  "implementation_roadmap": {
    "phase_1_foundation": {
      "timeline": "Months 1-3",
      "objectives": ["string"],
      "key_initiatives": [{
        "initiative": "string",
        "owner_role": "string",
        "budget_estimate": "string",
        "success_metrics": ["string"],
        "dependencies": ["string"],
        "milestones": ["string"]
      }]
    },
    "phase_2_growth": {
      "timeline": "Months 4-6",
      "objectives": ["string"],
      "key_initiatives": [...]
    },
    "phase_3_scale": {
      "timeline": "Months 7-12",
      "objectives": ["string"],
      "key_initiatives": [...]
    }
  },
  
  "risk_register": [{
    "risk": "string",
    "impact": "High/Medium/Low",
    "probability": "High/Medium/Low",
    "mitigation": "string",
    "contingency": "string"
  }],
  
  "assumptions_and_limitations": ["string"],
  
  "appendix": {
    "methodology": "string",
    "assumptions_to_validate": [{
      "assumption": "string",
      "validation_method": "string",
      "timeline": "string"
    }],
    "further_research_needed": ["string"],
    "definitions": { "CAC": "Customer Acquisition Cost", "LTV": "Lifetime Value" }
  }
}
</json_schema_agency>

<final_instruction>
Génère le rapport AGENCY-GRADE au format JSON strict.
Le rapport doit avoir la qualité d'un livrable de cabinet de conseil à €5K-10K.
Retourne UNIQUEMENT le JSON, sans texte avant/après.
</final_instruction>`;
  }

  if (plan === 'pro') {
    return `${baseContext}

<json_schema_premium>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "pro", "research_depth": "deep-analysis" },
  
  "executive_summary": { "headline": "string (max 150 chars)", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["5-7 findings"], "urgency_level": "low/medium/high", "urgency_rationale": "string", "market_size_estimate": "string", "growth_rate": "string" },
  
  "market_context": { "sector_overview": "string (analyse approfondie)", "local_market_specifics": "string", "market_maturity": "emerging/growth/mature/saturated", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "string", "value_potential": "string", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  
  "market_intelligence": { "sector_trends_2026": [{ "trend": "string", "impact_on_you": "high/medium/low", "how_to_leverage": "string" }], "local_market_data": { "market_maturity": "string", "key_players_count": "string", "market_size_estimate": "string", "growth_rate": "string", "regulatory_environment": "string", "insights": ["string"] } },
  
  "competitive_landscape": { "competition_intensity": "low/medium/high/very_high", "competitors_analyzed": [{ "name": "string", "website": "string", "type": "direct/indirect", "positioning": "budget/mid-market/premium", "pricing_found": "string", "strengths": ["string"], "weaknesses": ["string"], "differentiation": "string", "threat_level": "low/medium/high" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "string", "impact": "string", "description": "string" }] },
  
  "competitive_intelligence": { "deep_competitor_profiles": [{ "name": "string", "positioning": "string", "digital_presence_score": 1-10, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "low/medium/high" }], "competitive_matrix": { "axes": { "x_axis": "string", "y_axis": "string" }, "positions": [{ "competitor": "string", "x": 1-10, "y": 1-10 }] }, "white_spaces": ["string"], "emerging_competitors": ["string"] },
  
  "customer_insights": { "pain_points_identified": [{ "pain_point": "string", "evidence": "string", "opportunity": "string" }], "unmet_needs": ["string"], "switching_barriers": ["string"], "decision_criteria": ["string"] },
  
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"], "differentiation_score": { "current": 1-10, "potential": 1-10, "gap_to_close": "string" } },
  
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string", "mid_tier": "string", "premium_tier": "string" }, "competitor_pricing_table": [{ "competitor": "string", "offer": "string", "price": "string", "value_perception": "string" }], "recommended_pricing": [{ "package_name": "string", "suggested_price": "string", "what_includes": ["string"], "rationale": "string" }], "pricing_psychology_insights": "string", "quick_wins": ["string"], "upsell_opportunities": ["string"] },
  
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string", "expected_cac": "string", "expected_timeline": "string", "estimated_effectiveness": "high/medium/low" }], "content_strategy": { "topics_to_own": ["string"], "content_gaps": ["string"], "content_formats": ["string"], "distribution_approach": "string", "thought_leadership_opportunities": ["string"] }, "partnership_opportunities": ["string"] },
  
  "action_plan": { "now_7_days": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }], "quick_wins_with_proof": [{ "action": "string", "why_now": "string", "expected_impact": "string", "example": "string" }] },
  
  "risks_and_considerations": { "market_risks": ["string"], "competitive_threats": ["string"], "regulatory_considerations": ["string"] },
  
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"],
  "methodology_note": "string"
}
</json_schema_premium>

<final_instruction>
Génère le rapport PREMIUM au format JSON strict.
Retourne UNIQUEMENT le JSON, sans texte avant/après.
</final_instruction>`;
  }

  // Standard tier
  return `${baseContext}

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "standard" },
  "executive_summary": { "headline": "string", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string"], "urgency_level": "low/medium/high", "urgency_rationale": "string" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "string", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "string", "value_potential": "string", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "competitive_landscape": { "competition_intensity": "string", "competitors_analyzed": [{ "name": "string", "type": "string", "positioning": "string", "strengths": ["string"], "weaknesses": ["string"], "price_range": "string", "differentiation": "string", "threat_level": "string" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "string", "impact": "string", "description": "string" }] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"] },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string", "mid_tier": "string", "premium_tier": "string" }, "recommended_pricing": [{ "package_name": "string", "suggested_price": "string", "what_includes": ["string"], "rationale": "string", "expected_perception": "string" }], "pricing_psychology_insights": "string", "quick_wins": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "string", "why": "string", "first_action": "string", "expected_cac": "string", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_formats": ["string"], "distribution_approach": "string" }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }] },
  "risks_and_considerations": [{ "risk": "string", "impact": "string", "mitigation": "string" }],
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"]
}
</json_schema>

<final_instruction>
Génère le rapport de benchmark au format JSON strict.
Retourne UNIQUEMENT le JSON, sans texte avant/après.
</final_instruction>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let reportId: string | undefined;

  try {
    const body = await req.json();
    reportId = body.reportId;

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Get the report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      throw new Error("Report not found");
    }

    // Update status to processing
    await supabaseAdmin
      .from("reports")
      .update({ status: "processing" })
      .eq("id", reportId);

    const inputData = report.input_data as ReportInput;
    const plan = report.plan || "standard";

    // Get Claude API Key
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    // Get appropriate prompts and settings based on tier
    const systemPrompt = getSystemPrompt(plan);
    const userPrompt = buildUserPrompt(inputData, plan);
    const maxTokens = getMaxTokens(plan);

    console.log(`Calling Claude API for report: ${reportId} (tier: ${plan}, max_tokens: ${maxTokens})`);

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [
          { role: "user", content: userPrompt },
        ],
        system: systemPrompt,
        temperature: 0.7,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);
      
      if (claudeResponse.status === 429) {
        throw new Error("Rate limit exceeded, please try again later");
      }
      if (claudeResponse.status === 401) {
        throw new Error("Invalid Claude API key");
      }
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      throw new Error("No content returned from Claude");
    }

    console.log("Claude response received, parsing JSON...");

    // Parse the JSON response
    let outputData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outputData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content.substring(0, 500));
      throw new Error("Failed to parse Claude response as JSON");
    }

    // Update report with output
    const { error: updateError } = await supabaseAdmin
      .from("reports")
      .update({
        status: "ready",
        output_data: outputData,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Report generated successfully: ${reportId} (tier: ${plan})`);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Generate report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update report status to failed
    if (reportId) {
      try {
        await supabaseAdmin
          .from("reports")
          .update({ status: "failed" })
          .eq("id", reportId);
      } catch {
        console.error("Failed to update report status to failed");
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
