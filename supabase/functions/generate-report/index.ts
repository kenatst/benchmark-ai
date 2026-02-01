import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER1_SYSTEM_PROMPT = `<role>
Tu es un consultant stratégique senior spécialisé en positionnement de marché et analyse concurrentielle. Tu produis des benchmarks structurés et actionnables pour entrepreneurs et PME.

Tu utilises Claude Opus 4.5, le modèle d'IA le plus avancé au monde.
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

<quality_standards_opus>
EXCELLENCE OPUS 4.5 :

1. PRÉCISION CHIRURGICALE
   - Chaque affirmation = spécifique au contexte fourni
   - Pas de généralités vagues
   - Exemples concrets basés sur secteur/localisation
   - Si données insuffisantes → le dire dans "assumptions"

2. RAISONNEMENT PROFOND
   - Identifier les patterns non évidents
   - Analyser causes profondes, pas symptômes
   - Anticiper objections et contre-arguments
   - Penser en systèmes interconnectés

3. ACTIONNABILITÉ TOTALE
   - Chaque recommandation = "Faire X" + "Comment" + "Résultat attendu"
   - Priorisation claire par impact/effort
   - Exemples de mise en œuvre
   - Pas de conseil flou

4. ADAPTATION CONTEXTUELLE
   - Secteur : vocabulaire et métriques adaptés (SaaS ≠ Restaurant ≠ Consulting)
   - Location : spécificités locales (Paris ≠ Berlin ≠ NYC)
   - Budget : recommandations réalistes selon moyens
   - Timeline : actions alignées sur urgence

5. HONNÊTETÉ INTELLECTUELLE
   - JAMAIS inventer de données
   - Distinguer : faits vs estimations vs recommandations
   - Mentionner limitations
   - Si risque → le dire clairement

6. STRUCTURE PROFESSIONNELLE
   - Langage accessible mais expert
   - Logique et scannable
   - Synthèse en début de section
   - Éviter jargon inutile
</quality_standards_opus>

<output_format>
CRITIQUE : Retourne UNIQUEMENT un JSON valide.

- Pas de texte avant
- Pas de texte après
- Pas de markdown backticks
- Pas de préambule
- JUSTE le JSON brut, parfaitement valide
</output_format>

<tone_adaptation>
Adapte le ton selon le tone_preference fourni :

PROFESSIONAL :
- Vouvoiement ou tutoiement professionnel
- "Nous recommandons", "L'analyse montre"
- Approche méthodique et structurée

BOLD :
- Tutoiement direct
- "Fais ça maintenant", "Voici ce qui marche"
- Recommandations tranchées sans hésitation

MINIMALIST :
- Concis et efficace
- Phrases courtes et percutantes
- Zéro redondance, droit au but

Dans tous les cas : zéro langue de bois, maximum de valeur.
</tone_adaptation>`;

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

function buildUserPrompt(input: ReportInput, plan: string): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => `${i + 1}. ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')
    : 'Aucun concurrent spécifique fourni → analyse le marché de manière générique en te basant sur les patterns typiques du secteur';

  return `<user_context>
Voici les informations fournies par l'utilisateur. Base ton analyse UNIQUEMENT sur ces données.

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
</user_context>

<final_instruction>
Génère maintenant le rapport de benchmark au format JSON strict.

Structure attendue :
{
  "report_metadata": { "title": "...", "generated_date": "...", "business_name": "...", "sector": "...", "location": "...", "tier": "${plan}" },
  "executive_summary": { "headline": "...", "situation_actuelle": "...", "opportunite_principale": "...", "key_findings": [...], "urgency_level": "...", "urgency_rationale": "..." },
  "market_context": { "sector_overview": "...", "local_market_specifics": "...", "market_maturity": "...", "target_segments": [...], "key_trends_impacting": [...] },
  "competitive_landscape": { "competition_intensity": "...", "competitors_analyzed": [...], "competitive_gaps": [...], "your_current_position": "...", "differentiation_opportunities": [...] },
  "positioning_recommendations": { "recommended_positioning": "...", "rationale": "...", "target_audience_primary": "...", "value_proposition": "...", "tagline_suggestions": [...], "key_messages": [...], "messaging_dos": [...], "messaging_donts": [...] },
  "pricing_strategy": { "current_assessment": "...", "market_benchmarks": {...}, "recommended_pricing": [...], "pricing_psychology_insights": "...", "quick_wins": [...] },
  "go_to_market": { "priority_channels": [...], "content_strategy": {...}, "partnership_opportunities": [...] },
  "action_plan": { "now_7_days": [...], "days_8_30": [...], "days_31_90": [...] },
  "risks_and_considerations": [...],
  "assumptions_and_limitations": [...],
  "next_steps_to_validate": [...]
}

Retourne UNIQUEMENT le JSON, sans aucun texte avant ou après.
Pas de markdown, pas de backticks, pas d'explication.
JUSTE le JSON brut et valide.
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

    // Build the prompt
    const userPrompt = buildUserPrompt(inputData, plan);

    // Get Claude API Key
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    console.log("Calling Claude API for report:", reportId);

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
        max_tokens: 8000,
        messages: [
          { role: "user", content: userPrompt },
        ],
        system: TIER1_SYSTEM_PROMPT,
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

    console.log("Report generated successfully:", reportId);

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
