import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// TIER SYSTEM PROMPTS
// ============================================
const TIER1_SYSTEM_PROMPT = `Tu es un consultant stratégique senior. Génère un benchmark JSON structuré de 2000-3000 mots.
Analyse 3-5 concurrents, plan d'action 30/60/90 jours. Dense en insights, zéro bullshit, maximum actionnable.
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`;

const TIER2_SYSTEM_PROMPT = `Tu es un consultant stratégique senior. Génère un benchmark PREMIUM JSON structuré de 4000-6000 mots.
Analyse 5-10 concurrents, market intelligence enrichi, customer insights, competitive matrix.
UTILISE LES DONNÉES DE RECHERCHE WEB FOURNIES pour enrichir l'analyse.
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`;

const TIER3_SYSTEM_PROMPT = `Tu es un directeur de stratégie (niveau McKinsey/BCG). Génère un rapport AGENCY-GRADE JSON de 8000-12000 mots.
Inclus: PESTEL, Porter 5 Forces, SWOT, brand strategy complète, projections financières 3 scénarios, roadmap 12 mois.
UTILISE LES DONNÉES DE RECHERCHE WEB FOURNIES pour enrichir l'analyse.
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`;

// ============================================
// TYPES
// ============================================
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

interface PerplexityResult {
  marketData: string;
  competitorData: string;
  trendData: string;
  customerData: string;
  citations: string[];
}

// ============================================
// PERPLEXITY WEB RESEARCH
// ============================================
async function searchWithPerplexity(
  query: string, 
  apiKey: string
): Promise<{ content: string; citations: string[] }> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "Tu es un analyste de marché. Fournis des données factuelles, chiffrées et sourcées. Sois concis et précis." },
        { role: "user", content: query }
      ],
      search_recency_filter: "month",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Perplexity error:", response.status, error);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}

async function performWebResearch(
  input: ReportInput,
  plan: string,
  apiKey: string
): Promise<PerplexityResult> {
  const { sector, location, businessName, competitors } = input;
  const city = location?.city || "";
  const country = location?.country || "";

  console.log(`Starting Perplexity research for ${plan} tier...`);

  // Define searches based on tier
  const searches: { type: string; query: string }[] = [];

  // Market data search
  searches.push({
    type: "market",
    query: `Analyse du marché ${sector} en ${country} 2025-2026: taille du marché, croissance CAGR, tendances principales, acteurs majeurs. Données chiffrées.`
  });

  // Competitor search
  const competitorNames = competitors?.filter(c => c.name).map(c => c.name).join(", ") || "";
  if (competitorNames) {
    searches.push({
      type: "competitors",
      query: `Analyse concurrentielle ${sector}: ${competitorNames}. Positionnement, pricing, forces et faiblesses de chaque concurrent. ${city ? `Focus marché ${city} ${country}.` : ""}`
    });
  } else {
    searches.push({
      type: "competitors",
      query: `Top 10 concurrents dans le secteur ${sector} en ${country}. Positionnement, pricing estimé, parts de marché.`
    });
  }

  // Trend search
  searches.push({
    type: "trends",
    query: `Tendances et innovations ${sector} 2025-2026: technologies émergentes, changements comportement consommateurs, disruptions à venir.`
  });

  // Customer insights (for Pro and Agency)
  if (plan === "pro" || plan === "agency") {
    searches.push({
      type: "customers",
      query: `Pain points et besoins clients ${sector}: avis clients, plaintes récurrentes, fonctionnalités demandées, critères de décision d'achat.`
    });
  }

  // Additional agency searches
  if (plan === "agency") {
    searches.push({
      type: "market",
      query: `Analyse PESTEL ${sector} ${country} 2026: facteurs politiques, économiques, sociaux, technologiques, environnementaux, légaux impactant le marché.`
    });
    searches.push({
      type: "market",
      query: `Benchmarks financiers ${sector}: CAC moyen, LTV, marge brute, taux de conversion typiques, pricing models.`
    });
  }

  // Execute searches in parallel
  const results = await Promise.all(
    searches.map(async (search) => {
      try {
        const result = await searchWithPerplexity(search.query, apiKey);
        return { type: search.type, ...result };
      } catch (error) {
        console.error(`Search failed for ${search.type}:`, error);
        return { type: search.type, content: "", citations: [] };
      }
    })
  );

  // Aggregate results
  const aggregated: PerplexityResult = {
    marketData: "",
    competitorData: "",
    trendData: "",
    customerData: "",
    citations: [],
  };

  for (const result of results) {
    if (result.citations) {
      aggregated.citations.push(...result.citations);
    }
    switch (result.type) {
      case "market":
        aggregated.marketData += result.content + "\n\n";
        break;
      case "competitors":
        aggregated.competitorData += result.content + "\n\n";
        break;
      case "trends":
        aggregated.trendData += result.content + "\n\n";
        break;
      case "customers":
        aggregated.customerData += result.content + "\n\n";
        break;
    }
  }

  // Deduplicate citations
  aggregated.citations = [...new Set(aggregated.citations)];

  console.log(`Perplexity research complete: ${aggregated.citations.length} sources found`);
  return aggregated;
}

// ============================================
// PROMPT BUILDERS
// ============================================
function getSystemPrompt(plan: string): string {
  switch (plan) {
    case "pro": return TIER2_SYSTEM_PROMPT;
    case "agency": return TIER3_SYSTEM_PROMPT;
    default: return TIER1_SYSTEM_PROMPT;
  }
}

function getMaxTokens(plan: string): number {
  switch (plan) {
    case "agency": return 32000;
    case "pro": return 16000;
    default: return 8000;
  }
}

function buildUserPrompt(
  input: ReportInput,
  plan: string,
  webResearch?: PerplexityResult
): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => `${i + 1}. ${c.name}${c.url ? ` (${c.url})` : ""}`).join("\n")
    : "Aucun concurrent spécifié";

  let prompt = `<user_context>
Business : ${input.businessName}
${input.website ? `Site web : ${input.website}` : "Pas de site web fourni"}
Secteur : ${input.sector}
Localisation : ${input.location?.city}, ${input.location?.country}
Cible : ${input.targetCustomers?.type} - ${input.targetCustomers?.persona}

Ce que vend le business :
${input.whatYouSell}

Fourchette de prix : ${input.priceRange?.min}€ - ${input.priceRange?.max}€
Différenciateurs : ${input.differentiators?.join(", ") || "Non spécifiés"}
Canaux d'acquisition : ${input.acquisitionChannels?.join(", ") || "Non spécifiés"}

Concurrents (${input.competitors?.length || 0}) :
${competitorsList}

Objectifs : ${input.goals?.join(", ") || "Analyse complète"}
Budget : ${input.budgetLevel}
Timeline : ${input.timeline}
Ton : ${input.tonePreference}
${input.notes ? `Notes : ${input.notes}` : ""}
</user_context>`;

  // Add web research data for Pro and Agency tiers
  if (webResearch && (plan === "pro" || plan === "agency")) {
    prompt += `

<web_research_data>
IMPORTANT: Utilise ces données de recherche web pour enrichir ton analyse. Cite les sources quand pertinent.

## DONNÉES MARCHÉ
${webResearch.marketData || "Pas de données marché disponibles"}

## ANALYSE CONCURRENTIELLE
${webResearch.competitorData || "Pas de données concurrentielles disponibles"}

## TENDANCES
${webResearch.trendData || "Pas de données tendances disponibles"}

${webResearch.customerData ? `## INSIGHTS CLIENTS\n${webResearch.customerData}` : ""}

## SOURCES (${webResearch.citations.length})
${webResearch.citations.slice(0, 30).map((url, i) => `${i + 1}. ${url}`).join("\n")}
</web_research_data>`;
  }

  // Add JSON schema based on tier
  prompt += getJsonSchema(plan);

  return prompt;
}

function getJsonSchema(plan: string): string {
  if (plan === "agency") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "agency", "sources_count": number },
  "executive_summary": { "one_page_summary": "string", "situation_actuelle": "string", "opportunite_principale": "string", "strategic_recommendation": "string", "investment_required": "string", "expected_roi": "string", "critical_success_factors": ["string"], "key_metrics_to_track": ["string"], "urgency_assessment": { "level": "string", "rationale": "string", "window_of_opportunity": "string" } },
  "market_analysis": { "market_sizing": { "total_addressable_market": "string", "serviceable_addressable_market": "string", "serviceable_obtainable_market": "string", "methodology": "string" }, "market_dynamics": { "growth_rate": "string", "maturity_stage": "string", "key_drivers": ["string"], "headwinds": ["string"], "inflection_points": ["string"] }, "pestel_analysis": { "political": ["string"], "economic": ["string"], "social": ["string"], "technological": ["string"], "environmental": ["string"], "legal": ["string"] }, "porter_five_forces": { "competitive_rivalry": { "score": 1-10, "analysis": "string" }, "supplier_power": { "score": 1-10, "analysis": "string" }, "buyer_power": { "score": 1-10, "analysis": "string" }, "threat_of_substitution": { "score": 1-10, "analysis": "string" }, "threat_of_new_entry": { "score": 1-10, "analysis": "string" }, "overall_attractiveness": "string", "strategic_implications": "string" } },
  "competitive_intelligence": { "competition_landscape_overview": "string", "competitors_deep_dive": [{ "name": "string", "profile": { "size": "string", "growth_trajectory": "string" }, "positioning": { "value_prop": "string", "target_segment": "string" }, "offering": { "products_services": ["string"], "pricing_model": "string" }, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "string", "opportunities_vs_them": "string" }], "competitive_positioning_maps": { "primary_map": { "x_axis": "string", "y_axis": "string", "competitors_plotted": [{ "name": "string", "x": 1-10, "y": 1-10 }], "your_current_position": { "x": 1-10, "y": 1-10 }, "recommended_position": { "x": 1-10, "y": 1-10 }, "rationale": "string" } }, "unmet_customer_needs": [{ "need": "string", "evidence": "string", "how_to_address": "string" }] },
  "swot_analysis": { "strengths": ["string"], "weaknesses": ["string"], "opportunities": ["string"], "threats": ["string"], "strategic_priorities": "string" },
  "customer_intelligence": { "segments_analyzed": [{ "segment_name": "string", "size_estimate": "string", "pain_points": ["string"], "decision_criteria": ["string"], "willingness_to_pay": "string", "acquisition_cost_estimate": "string", "lifetime_value_estimate": "string", "priority": "1/2/3" }], "voice_of_customer": { "common_complaints": ["string"], "desired_features": ["string"], "switching_barriers": ["string"] } },
  "strategic_recommendations": { "recommended_strategy": { "strategic_archetype": "string", "rationale": "string" }, "positioning_strategy": { "target_segment_primary": "string", "value_proposition": "string", "positioning_statement": "string", "reasons_to_believe": ["string"] }, "brand_strategy": { "brand_essence": "string", "brand_personality": ["string"], "brand_voice_description": "string", "tagline_options": ["string"], "messaging_hierarchy": { "primary_message": "string", "supporting_messages": ["string"] } }, "product_strategy": { "core_offering_recommendation": "string", "tiering_strategy": [{ "tier_name": "string", "target_segment": "string", "key_features": ["string"], "pricing_range": "string" }], "product_roadmap_priorities": [{ "feature_initiative": "string", "priority": "P0/P1/P2", "expected_impact": "string" }] }, "pricing_strategy": { "pricing_model_recommendation": "string", "price_optimization_by_tier": [{ "tier": "string", "recommended_price": "string", "rationale": "string" }], "upsell_cross_sell_opportunities": ["string"] }, "go_to_market_strategy": { "customer_acquisition": { "primary_channels_detailed": [{ "channel": "string", "rationale": "string", "investment_level": "string", "expected_cac": "string", "tactics": ["string"] }], "content_marketing_strategy": { "strategic_themes": ["string"], "content_formats_prioritized": ["string"] }, "partnership_opportunities_detailed": [{ "partner_type": "string", "examples": ["string"] }] }, "sales_strategy": { "sales_model": "string", "sales_process_recommendation": "string" } } },
  "financial_projections": { "investment_required": { "total_12_months": number, "breakdown": [{ "category": "string", "amount": number, "rationale": "string" }] }, "revenue_scenarios": { "conservative": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "baseline": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "optimistic": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] } }, "unit_economics": { "customer_acquisition_cost": number, "lifetime_value": number, "ltv_cac_ratio": number, "payback_period_months": number, "gross_margin_percent": number, "comparison_to_benchmarks": "string" } },
  "implementation_roadmap": { "phase_1_foundation": { "timeline": "Months 1-3", "objectives": ["string"], "key_initiatives": [{ "initiative": "string", "owner_role": "string", "budget_estimate": "string", "success_metrics": ["string"], "milestones": ["string"] }] }, "phase_2_growth": { "timeline": "Months 4-6", "objectives": ["string"], "key_initiatives": [...] }, "phase_3_scale": { "timeline": "Months 7-12", "objectives": ["string"], "key_initiatives": [...] } },
  "risk_register": [{ "risk": "string", "impact": "High/Medium/Low", "probability": "High/Medium/Low", "mitigation": "string", "contingency": "string" }],
  "assumptions_and_limitations": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport AGENCY-GRADE complet. RETOURNE UNIQUEMENT LE JSON.`;
  }

  if (plan === "pro") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "pro", "sources_count": number },
  "executive_summary": { "headline": "string", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string"], "urgency_level": "string", "urgency_rationale": "string", "market_size_estimate": "string", "growth_rate": "string" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "string", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "string", "value_potential": "string", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "market_intelligence": { "sector_trends_2026": [{ "trend": "string", "impact_on_you": "string", "how_to_leverage": "string" }], "local_market_data": { "market_maturity": "string", "key_players_count": "string", "market_size_estimate": "string", "growth_rate": "string", "insights": ["string"] } },
  "competitive_landscape": { "competition_intensity": "string", "competitors_analyzed": [{ "name": "string", "website": "string", "type": "string", "positioning": "string", "pricing_found": "string", "strengths": ["string"], "weaknesses": ["string"], "threat_level": "string" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "string", "impact": "string", "description": "string" }] },
  "competitive_intelligence": { "deep_competitor_profiles": [{ "name": "string", "positioning": "string", "digital_presence_score": 1-10, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "string" }], "competitive_matrix": { "axes": { "x_axis": "string", "y_axis": "string" }, "positions": [{ "competitor": "string", "x": 1-10, "y": 1-10 }] }, "white_spaces": ["string"] },
  "customer_insights": { "pain_points_identified": [{ "pain_point": "string", "evidence": "string", "opportunity": "string" }], "unmet_needs": ["string"], "switching_barriers": ["string"], "decision_criteria": ["string"] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"], "differentiation_score": { "current": 1-10, "potential": 1-10, "gap_to_close": "string" } },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string", "mid_tier": "string", "premium_tier": "string" }, "competitor_pricing_table": [{ "competitor": "string", "offer": "string", "price": "string" }], "recommended_pricing": [{ "package_name": "string", "suggested_price": "string", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string"], "upsell_opportunities": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string", "expected_cac": "string", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_gaps": ["string"], "content_formats": ["string"], "thought_leadership_opportunities": ["string"] }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }], "quick_wins_with_proof": [{ "action": "string", "why_now": "string", "expected_impact": "string" }] },
  "risks_and_considerations": { "market_risks": ["string"], "competitive_threats": ["string"], "regulatory_considerations": ["string"] },
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport PREMIUM complet. RETOURNE UNIQUEMENT LE JSON.`;
  }

  // Standard tier
  return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "standard" },
  "executive_summary": { "headline": "string", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string"], "urgency_level": "string", "urgency_rationale": "string" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "string", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "string", "value_potential": "string", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "competitive_landscape": { "competition_intensity": "string", "competitors_analyzed": [{ "name": "string", "type": "string", "positioning": "string", "strengths": ["string"], "weaknesses": ["string"], "price_range": "string", "differentiation": "string", "threat_level": "string" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "string", "impact": "string", "description": "string" }] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"] },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string", "mid_tier": "string", "premium_tier": "string" }, "recommended_pricing": [{ "package_name": "string", "suggested_price": "string", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "string", "why": "string", "first_action": "string", "expected_cac": "string", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_formats": ["string"], "distribution_approach": "string" }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }] },
  "risks_and_considerations": [{ "risk": "string", "impact": "string", "mitigation": "string" }],
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"]
}
</json_schema>

Génère le rapport de benchmark. RETOURNE UNIQUEMENT LE JSON.`;
}

// ============================================
// MAIN HANDLER
// ============================================
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

    // Get API keys
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    // Perform web research for Pro and Agency tiers
    let webResearch: PerplexityResult | undefined;
    if (plan === "pro" || plan === "agency") {
      const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
      if (PERPLEXITY_API_KEY) {
        try {
          webResearch = await performWebResearch(inputData, plan, PERPLEXITY_API_KEY);
        } catch (error) {
          console.error("Web research failed, continuing without:", error);
        }
      } else {
        console.warn("PERPLEXITY_API_KEY not configured, skipping web research");
      }
    }

    // Build prompts
    const systemPrompt = getSystemPrompt(plan);
    const userPrompt = buildUserPrompt(inputData, plan, webResearch);
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
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
        temperature: 0.7,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);
      if (claudeResponse.status === 429) throw new Error("Rate limit exceeded, please try again later");
      if (claudeResponse.status === 401) throw new Error("Invalid Claude API key");
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      throw new Error("No content returned from Claude");
    }

    console.log("Claude response received, parsing JSON...");

    // Parse JSON response
    let outputData;
    try {
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

    if (updateError) throw updateError;

    console.log(`Report generated successfully: ${reportId} (tier: ${plan})`);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Generate report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (reportId) {
      try {
        await supabaseAdmin.from("reports").update({ status: "failed" }).eq("id", reportId);
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
