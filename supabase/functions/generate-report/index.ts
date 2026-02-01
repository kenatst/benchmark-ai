import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// TIER CONFIGURATION WITH WEB SEARCH
// ============================================
const TIER_CONFIG = {
  standard: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    temperature: 0.3,
    tools: [], // No web search for standard tier
    system_prompt: `Tu es un consultant stratégique senior. Génère un benchmark JSON structuré de 2000-3000 mots.
Analyse 3-5 concurrents, plan d'action 30/60/90 jours. Dense en insights, zéro bullshit, maximum actionnable.
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`,
  },
  pro: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    temperature: 0.3,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system_prompt: `Tu es un consultant stratégique senior. Génère un benchmark PREMIUM JSON structuré de 4000-6000 mots.
Analyse 5-10 concurrents, market intelligence enrichi, customer insights, competitive matrix.
UTILISE LE WEB SEARCH pour rechercher des données marché récentes, infos concurrents, et tendances.
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`,
  },
  agency: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 32000,
    temperature: 0.2,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system_prompt: `Tu es un directeur de stratégie (niveau McKinsey/BCG). Génère un rapport AGENCY-GRADE JSON de 8000-12000 mots.
Inclus: PESTEL, Porter 5 Forces, SWOT, brand strategy complète, projections financières 3 scénarios, roadmap 12 mois.
UTILISE LE WEB SEARCH EXTENSIVEMENT pour rechercher:
- Données marché et sizing
- Profils détaillés des concurrents
- Tendances sectorielles
- Benchmarks financiers (CAC, LTV, marges)
- Analyses PESTEL récentes
RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`,
  },
} as const;

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

type TierType = keyof typeof TIER_CONFIG;

// ============================================
// PROMPT BUILDERS
// ============================================
function buildUserPrompt(input: ReportInput, plan: TierType): string {
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

  // Add web search instructions for Pro and Agency tiers
  if (plan === "pro" || plan === "agency") {
    prompt += `

<recherche_instructions>
IMPORTANT: Tu as accès au web search. Utilise-le pour:
1. Rechercher des données marché récentes pour "${input.sector}" en "${input.location?.country}"
2. Trouver des infos sur les concurrents: ${input.competitors?.map(c => c.name).join(", ") || "principaux acteurs du marché"}
3. Identifier les tendances 2025-2026 du secteur
${plan === "agency" ? `4. Rechercher des benchmarks financiers (CAC, LTV, marges)
5. Trouver des données PESTEL pour l'analyse macro` : ""}

Cite tes sources dans le rapport final.
</recherche_instructions>`;
  }

  // Add JSON schema based on tier
  prompt += getJsonSchema(plan);

  return prompt;
}

function getJsonSchema(plan: TierType): string {
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
  "implementation_roadmap": { "phase_1_foundation": { "timeline": "Months 1-3", "objectives": ["string"], "key_initiatives": [{ "initiative": "string", "owner_role": "string", "budget_estimate": "string", "success_metrics": ["string"], "milestones": ["string"] }] }, "phase_2_growth": { "timeline": "Months 4-6", "objectives": ["string"], "key_initiatives": ["..."] }, "phase_3_scale": { "timeline": "Months 7-12", "objectives": ["string"], "key_initiatives": ["..."] } },
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
// CLAUDE API WITH WEB SEARCH (AGENTIC LOOP)
// ============================================
async function callClaudeWithTools(
  apiKey: string,
  config: typeof TIER_CONFIG[TierType],
  userPrompt: string,
  reportId: string
): Promise<string> {
  console.log(`[${reportId}] Starting Claude API call with ${config.tools.length > 0 ? "web search enabled" : "no tools"}`);

  let messages: Array<{ role: string; content: unknown }> = [
    { role: "user", content: userPrompt }
  ];

  let finalResponse = "";
  let iterationCount = 0;
  const maxIterations = 10; // Safety limit

  while (iterationCount < maxIterations) {
    iterationCount++;
    console.log(`[${reportId}] Claude iteration ${iterationCount}`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        system: config.system_prompt,
        tools: config.tools.length > 0 ? config.tools : undefined,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${reportId}] Claude API error:`, response.status, errorText);
      if (response.status === 429) throw new Error("Rate limit exceeded, please try again later");
      if (response.status === 401) throw new Error("Invalid Claude API key");
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${reportId}] Claude stop_reason: ${data.stop_reason}`);

    // Check if Claude wants to use a tool
    if (data.stop_reason === "tool_use") {
      // Find tool use blocks
      const toolUseBlocks = data.content.filter((block: { type: string }) => block.type === "tool_use");
      
      if (toolUseBlocks.length > 0) {
        console.log(`[${reportId}] Claude is using ${toolUseBlocks.length} tool(s)`);
        
        // Add assistant message with tool use
        messages.push({ role: "assistant", content: data.content });

        // For web_search, we don't need to provide results - Claude handles it internally
        // Just continue the loop
        const toolResults = toolUseBlocks.map((toolUse: { id: string; name: string }) => ({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: "Search completed" // Web search results are handled by Claude internally
        }));

        messages.push({ role: "user", content: toolResults });
        continue;
      }
    }

    // Extract text content from response
    for (const block of data.content) {
      if (block.type === "text") {
        finalResponse += block.text;
      }
    }

    // If stop_reason is "end_turn", we're done
    if (data.stop_reason === "end_turn") {
      break;
    }
  }

  if (iterationCount >= maxIterations) {
    console.warn(`[${reportId}] Reached max iterations limit`);
  }

  console.log(`[${reportId}] Claude completed in ${iterationCount} iteration(s)`);
  return finalResponse;
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
    const plan = (report.plan || "standard") as TierType;

    // Validate plan
    if (!TIER_CONFIG[plan]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Get API key
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    // Get tier config
    const tierConfig = TIER_CONFIG[plan];

    // Build user prompt
    const userPrompt = buildUserPrompt(inputData, plan);

    console.log(`[${reportId}] Generating report (tier: ${plan}, model: ${tierConfig.model}, web_search: ${tierConfig.tools.length > 0})`);

    // Call Claude with agentic loop for web search
    const content = await callClaudeWithTools(CLAUDE_API_KEY, tierConfig, userPrompt, reportId);

    if (!content) {
      throw new Error("No content returned from Claude");
    }

    console.log(`[${reportId}] Parsing JSON response...`);

    // Parse JSON response
    let outputData;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outputData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error(`[${reportId}] Failed to parse Claude response:`, content.substring(0, 500));
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

    console.log(`[${reportId}] Report generated successfully (tier: ${plan})`);

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
