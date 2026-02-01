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
Recherche web : NON (sauf si URLs concurrents fournies)
Concurrents analysés : 3-5 (fournis par l'utilisateur)
Profondeur stratégie : Basique mais solide
Branding : Messaging simple
Pricing insights : Recommandations concrètes
Action plan : 30/60/90 jours détaillé
Multi-locations : NON
Projections financières : NON
Sources citées : Seulement si URLs fournies
Format export : PDF standard
</specifications_tier_standard>

<task>
Génère un rapport de benchmark professionnel au format JSON strict.

Le rapport doit permettre à l'utilisateur de :
1. Comprendre sa position actuelle sur le marché
2. Identifier ses opportunités de différenciation
3. Optimiser son pricing
4. Avoir un plan d'action concret 30/60/90 jours

Dense en insights, zéro bullshit, maximum actionnable.
</task>

<quality_standards>
1. PRÉCISION CHIRURGICALE - Chaque affirmation spécifique au contexte fourni
2. RAISONNEMENT PROFOND - Identifier les patterns non évidents
3. ACTIONNABILITÉ TOTALE - Chaque recommandation = "Faire X" + "Comment" + "Résultat attendu"
4. ADAPTATION CONTEXTUELLE - Secteur, location, budget, timeline
5. HONNÊTETÉ INTELLECTUELLE - JAMAIS inventer de données
6. STRUCTURE PROFESSIONNELLE - Langage accessible mais expert
</quality_standards>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.
- Pas de texte avant ou après
- Pas de markdown backticks
- JUSTE le JSON brut, parfaitement valide
</output_format>

<tone_adaptation>
PROFESSIONAL : Vouvoiement, "Nous recommandons", approche méthodique
BOLD : Tutoiement direct, "Fais ça maintenant", recommandations tranchées
MINIMALIST : Concis, phrases courtes, zéro redondance
</tone_adaptation>`;

// ============================================
// TIER 2 - PREMIUM PROMPT
// ============================================
const TIER2_SYSTEM_PROMPT = `<role>
Tu es un consultant stratégique senior avec une expertise approfondie des marchés. Tu produis des benchmarks premium enrichis d'analyses détaillées, intelligence de marché, et recommandations stratégiques avancées.
</role>

<specifications_tier_premium>
Longueur cible : 4000-6000 mots
Concurrents analysés : 5-10 (analyse approfondie)
Profondeur stratégie : Intermédiaire avec analyses détaillées
Branding : Positionnement + taglines professionnels
Pricing insights : Analyse concurrentielle complète
Action plan : Avec exemples et preuves sectorielles
Multi-locations : Comparaison 1-2 marchés si pertinent
Projections financières : Basique (estimations ROI, CAC, LTV)
Format export : PDF premium
</specifications_tier_premium>

<task>
Génère un rapport de benchmark PREMIUM au format JSON strict.

Ce rapport doit être SIGNIFICATIVEMENT plus riche que le tier Standard :
- Analyses de marché approfondies basées sur ton expertise
- Analyse concurrentielle détaillée
- Tendances sectorielles documentées
- Intelligence locale enrichie
- Comparaison multi-marchés si pertinent

Le rapport doit démontrer clairement une valeur supérieure par sa profondeur d'analyse.
</task>

<quality_standards_premium>
1. VÉRACITÉ DES DONNÉES - Toute affirmation basée sur expertise vérifiable
2. PROFONDEUR D'ANALYSE ENRICHIE - Insights moins évidents, patterns cross-sectoriels
3. ACTIONNABILITÉ BASÉE SUR PREUVES - Recommandations basées sur best practices
4. DISTINCTION CLAIRE - Fait vérifié vs Estimation vs Recommandation
5. HONNÊTETÉ - Si donnée incertaine, le mentionner
</quality_standards_premium>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.
- Pas de texte avant ou après
- Pas de markdown backticks
- JUSTE le JSON brut, parfaitement valide

Structure PREMIUM complète requise avec toutes les sections.
</output_format>

<tone_adaptation>
PROFESSIONAL : Vouvoiement, approche méthodique et structurée
BOLD : Tutoiement direct, recommandations tranchées
MINIMALIST : Concis et efficace, phrases courtes
</tone_adaptation>`;

// ============================================
// TIER 3 - AGENCY PROMPT (placeholder)
// ============================================
const TIER3_SYSTEM_PROMPT = TIER2_SYSTEM_PROMPT; // Will be expanded later

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

function buildUserPrompt(input: ReportInput, plan: string): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => `${i + 1}. ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')
    : 'Aucun concurrent spécifique fourni → analyse le marché en patterns génériques du secteur';

  const baseContext = `<user_context>
Business : ${input.businessName}
${input.website ? `Site web : ${input.website}` : 'Pas de site web fourni'}
Secteur : ${input.sector}
Localisation : ${input.location?.city}, ${input.location?.country}
Cible : ${input.targetCustomers?.type} - ${input.targetCustomers?.persona}

Ce que vend le business :
${input.whatYouSell}

Fourchette de prix actuelle : ${input.priceRange?.min}€ - ${input.priceRange?.max}€

Différenciateurs revendiqués : ${input.differentiators?.join(', ') || 'Non spécifiés'}

Canaux d'acquisition actuels : ${input.acquisitionChannels?.join(', ') || 'Non spécifiés'}

Concurrents fournis (${input.competitors?.length || 0}) :
${competitorsList}

Objectifs du benchmark : ${input.goals?.join(', ') || 'Analyse complète'}

Contexte budgétaire : ${input.budgetLevel}
Timeline d'action : ${input.timeline}
Ton souhaité pour le rapport : ${input.tonePreference}

${input.notes ? `Notes additionnelles :\n${input.notes}` : 'Pas de notes additionnelles'}
</user_context>`;

  if (plan === 'pro' || plan === 'agency') {
    return `${baseContext}

<json_schema_premium>
{
  "report_metadata": {
    "title": "string",
    "generated_date": "YYYY-MM-DD",
    "business_name": "string",
    "sector": "string",
    "location": "string",
    "tier": "${plan}",
    "research_depth": "deep-analysis"
  },
  
  "executive_summary": {
    "headline": "string (max 150 chars)",
    "situation_actuelle": "string",
    "opportunite_principale": "string",
    "key_findings": ["5-7 findings"],
    "urgency_level": "low/medium/high",
    "urgency_rationale": "string",
    "market_size_estimate": "string (estimation basée sur expertise)",
    "growth_rate": "string (estimation si pertinent)"
  },
  
  "market_context": {
    "sector_overview": "string (analyse approfondie)",
    "local_market_specifics": "string",
    "market_maturity": "emerging/growth/mature/saturated",
    "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "string", "value_potential": "string", "why_relevant": "string" }],
    "key_trends_impacting": ["string"]
  },
  
  "market_intelligence": {
    "sector_trends_2026": [{ "trend": "string", "impact_on_you": "high/medium/low", "how_to_leverage": "string" }],
    "local_market_data": {
      "market_maturity": "string",
      "key_players_count": "string",
      "market_size_estimate": "string",
      "growth_rate": "string",
      "regulatory_environment": "string",
      "insights": ["string"]
    }
  },
  
  "competitive_landscape": {
    "competition_intensity": "low/medium/high/very_high",
    "competitors_analyzed": [{
      "name": "string",
      "website": "string (si fourni)",
      "type": "direct/indirect",
      "positioning": "budget/mid-market/premium",
      "pricing_found": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "differentiation": "string",
      "threat_level": "low/medium/high"
    }],
    "competitive_gaps": ["string"],
    "your_current_position": "string",
    "differentiation_opportunities": [{ "angle": "string", "feasibility": "string", "impact": "string", "description": "string" }]
  },
  
  "competitive_intelligence": {
    "deep_competitor_profiles": [{
      "name": "string",
      "positioning": "string",
      "digital_presence_score": 1-10,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "threat_level": "low/medium/high"
    }],
    "competitive_matrix": {
      "axes": { "x_axis": "string", "y_axis": "string" },
      "positions": [{ "competitor": "string", "x": 1-10, "y": 1-10 }]
    },
    "white_spaces": ["string"],
    "emerging_competitors": ["string"]
  },
  
  "customer_insights": {
    "pain_points_identified": [{ "pain_point": "string", "evidence": "string", "opportunity": "string" }],
    "unmet_needs": ["string"],
    "switching_barriers": ["string"],
    "decision_criteria": ["string"]
  },
  
  "positioning_recommendations": {
    "recommended_positioning": "string",
    "rationale": "string",
    "target_audience_primary": "string",
    "value_proposition": "string",
    "tagline_suggestions": ["string"],
    "key_messages": ["string"],
    "messaging_dos": ["string"],
    "messaging_donts": ["string"],
    "differentiation_score": { "current": 1-10, "potential": 1-10, "gap_to_close": "string" }
  },
  
  "pricing_strategy": {
    "current_assessment": "string",
    "market_benchmarks": { "budget_tier": "string", "mid_tier": "string", "premium_tier": "string" },
    "competitor_pricing_table": [{ "competitor": "string", "offer": "string", "price": "string", "value_perception": "string" }],
    "recommended_pricing": [{ "package_name": "string", "suggested_price": "string", "what_includes": ["string"], "rationale": "string" }],
    "pricing_psychology_insights": "string",
    "quick_wins": ["string"],
    "upsell_opportunities": ["string"]
  },
  
  "go_to_market": {
    "priority_channels": [{
      "channel": "string",
      "priority": "1/2/3",
      "why": "string",
      "first_action": "string",
      "expected_cac": "string",
      "expected_timeline": "string",
      "estimated_effectiveness": "high/medium/low"
    }],
    "content_strategy": {
      "topics_to_own": ["string"],
      "content_gaps": ["string"],
      "content_formats": ["string"],
      "distribution_approach": "string",
      "thought_leadership_opportunities": ["string"]
    },
    "partnership_opportunities": ["string"]
  },
  
  "action_plan": {
    "now_7_days": [{ "action": "string", "owner": "string", "outcome": "string" }],
    "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }],
    "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }],
    "quick_wins_with_proof": [{ "action": "string", "why_now": "string", "expected_impact": "string", "example": "string" }]
  },
  
  "risks_and_considerations": {
    "market_risks": ["string"],
    "competitive_threats": ["string"],
    "regulatory_considerations": ["string"]
  },
  
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"],
  
  "methodology_note": "string (explication de l'approche analytique)"
}
</json_schema_premium>

<final_instruction>
Génère maintenant le rapport de benchmark PREMIUM au format JSON strict.
Retourne UNIQUEMENT le JSON, sans aucun texte avant ou après.
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
Génère maintenant le rapport de benchmark au format JSON strict.
Retourne UNIQUEMENT le JSON, sans aucun texte avant ou après.
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

    // Get appropriate prompts based on tier
    const systemPrompt = getSystemPrompt(plan);
    const userPrompt = buildUserPrompt(inputData, plan);

    // Adjust max tokens based on tier
    const maxTokens = plan === 'standard' ? 8000 : 16000;

    console.log(`Calling Claude API for report: ${reportId} (tier: ${plan})`);

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
