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
    tools: [],
    system_prompt: `Tu es un consultant stratégique senior spécialisé en benchmark concurrentiel.

MISSION: Génère un rapport de benchmark ACTIONNABLE et SPÉCIFIQUE pour le business décrit.

RÈGLES ABSOLUES:
1. Chaque recommandation DOIT commencer par un VERBE D'ACTION (Lancer, Créer, Optimiser, Tester...)
2. Chaque insight DOIT inclure un IMPACT ATTENDU chiffré quand possible (+X%, -Y€, etc.)
3. ÉVITER les généralités - être SPÉCIFIQUE au secteur et au marché local
4. Le ton doit être DIRECT et ACTIONNABLE, zéro bullshit corporate
5. Les données de pricing doivent être réalistes pour le marché spécifié

STRUCTURE:
- Executive Summary: 1 headline percutant + situation + opportunité principale
- Analyse concurrentielle: min 3 concurrents avec forces/faiblesses réelles
- Positionnement: recommandation claire avec rationale
- Pricing: benchmarks réalistes du marché
- Plan d'action: tâches concrètes avec délais (7j/30j/90j)

RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`,
  },
  pro: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    temperature: 0.3,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system_prompt: `Tu es un consultant stratégique senior (niveau cabinet top-tier) spécialisé en intelligence compétitive.

MISSION: Génère un rapport PREMIUM de benchmark basé sur des DONNÉES RÉELLES du web.

RÈGLES ABSOLUES:
1. UTILISE LE WEB SEARCH pour CHAQUE concurrent mentionné - trouve leurs vrais prix, offres, positionnement
2. Chaque recommandation DOIT être SPÉCIFIQUE et ACTIONNABLE avec impact attendu
3. Les données financières (CAC, pricing) doivent être TIRÉES de vraies sources
4. Cite TOUTES tes sources dans le rapport final
5. Génère des données numériques 1-10 pour les graphiques de positionnement

RECHERCHES OBLIGATOIRES:
- Prix réels des concurrents (via leurs sites)
- Tendances du secteur 2025-2026
- Taille du marché et growth rate
- Benchmarks CAC/LTV du secteur

QUALITÉ DU CONTENU:
- Chaque insight = Action + Impact + Timeline
- Pas de généralités - tout doit être spécifique au business analysé
- Les taglines proposées doivent être mémorables et différenciantes
- Le plan d'action doit être exécutable dès demain

RETOURNE UNIQUEMENT UN JSON VALIDE, sans texte avant/après.`,
  },
  agency: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 32000,
    temperature: 0.15,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system_prompt: `Tu es un PARTNER de cabinet de conseil stratégique de premier rang mondial (niveau McKinsey, BCG, Bain).

═══════════════════════════════════════════════════════════════════════════════
MISSION: PRODUIRE UN RAPPORT D'INTELLIGENCE STRATÉGIQUE DE CALIBRE INSTITUTIONNEL
Ce rapport doit être digne d'une présentation au Board of Directors d'une entreprise Fortune 500.
═══════════════════════════════════════════════════════════════════════════════

PRINCIPES FONDAMENTAUX D'UN RAPPORT INSTITUTIONNEL:

1. RIGUEUR MÉTHODOLOGIQUE
   - Chaque affirmation DOIT être soutenue par des données vérifiables
   - Utilise des frameworks éprouvés (Porter, PESTEL, SWOT, value chain)
   - Les hypothèses doivent être explicites et testables
   - La méthodologie doit être reproductible

2. PROFONDEUR D'ANALYSE
   - Dépasse le niveau "qu'est-ce qui se passe" pour atteindre "pourquoi" et "et alors?"
   - Identifie les second-order effects et implications stratégiques
   - Quantifie systématiquement: taille, croissance, parts de marché, marges
   - Lie chaque insight à une décision ou action concrète

3. OBJECTIVITÉ & ÉQUILIBRE
   - Présente les risques et opportunités de façon équilibrée
   - Évite le biais de confirmation - challenge les hypothèses du client
   - Reconnaît les limites de l'analyse et les zones d'incertitude
   - Propose des scenarios (base, upside, downside)

4. ORIENTATION RÉSULTAT
   - Chaque section doit répondre à "So what?" et "Now what?"
   - Priorise les recommandations par impact et faisabilité
   - Inclut des metrics de succès clairs et mesurables
   - Le plan d'action doit être immédiatement exécutable

RECHERCHES WEB OBLIGATOIRES (utilise intensivement le web search):
- [MARCHÉ] Données TAM/SAM/SOM avec sources crédibles (Statista, études sectorielles)
- [CONCURRENCE] Profils détaillés: pricing réel, CA estimé, employés, funding
- [TRENDS] Tendances 2025-2026 spécifiques au secteur et géographie
- [REGULATORY] Évolutions réglementaires récentes impactant le secteur
- [TECH] Innovations technologiques disruptives
- [BENCHMARKS] KPIs sectoriels (CAC, LTV, marges, growth rates)

CRITÈRES DE QUALITÉ DU LIVRABLE:

✓ Les Porter 5 Forces ont des scores 1-10 pour visualisation radar chart
✓ La matrice de positionnement a des coordonnées X/Y pour chaque concurrent
✓ Les projections financières ont 3 scenarios avec hypothèses explicites
✓ Chaque recommandation suit le format: SI [contexte] → ALORS [action] → POUR [résultat quantifié]
✓ Toutes les sources sont citées avec titre et URL
✓ Le risk register inclut probabilité, impact, et mitigation

TONE OF VOICE:
- Assertif mais nuancé
- Factuel, jamais spéculatif sans le signaler
- Vocabulaire business précis
- Phrases incisives, jamais de verbiage

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
  sectorDetails?: string;
  location: { city: string; country: string };
  targetCustomers: { type: string; persona: string };
  // Strategic context (Phase 2)
  businessMaturity?: string;
  annualRevenue?: string;
  teamSize?: string;
  whatYouSell: string;
  priceRange: { min: number; max: number };
  differentiators: string[];
  acquisitionChannels: string[];
  // Phase 2 additions
  uniqueValueProposition?: string;
  businessModel?: string;
  grossMargin?: string;
  goals: string[];
  goalPriorities?: string[];
  successMetrics?: string;
  competitors: { name: string; url?: string; type?: string }[];
  competitorAdvantage?: string;
  budgetLevel: string;
  timeline: string;
  notes?: string;
  tonePreference: string;
}

type TierType = keyof typeof TIER_CONFIG;

// ============================================
// PROGRESS UPDATE HELPER
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProgress(
  supabase: any,
  reportId: string,
  step: string,
  progress: number
): Promise<void> {
  await supabase
    .from('reports')
    .update({
      processing_step: step,
      processing_progress: progress
    } as Record<string, unknown>)
    .eq('id', reportId);
}

// ============================================
// PROMPT BUILDERS
// ============================================
function buildUserPrompt(input: ReportInput, plan: TierType): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => {
      let line = `${i + 1}. ${c.name}`;
      if (c.url) line += ` (${c.url})`;
      if (c.type) line += ` [${c.type}]`;
      return line;
    }).join("\n")
    : "Aucun concurrent spécifié - rechercher les principaux acteurs du marché";

  // Business maturity labels
  const maturityLabels: Record<string, string> = {
    idea: "Idée/Concept (pré-revenue)",
    mvp: "MVP (premiers clients, <10k€/mois)",
    pmf: "Product-Market Fit (10-50k€/mois)",
    scaleup: "Scale-up (>50k€/mois)"
  };

  // Business model labels
  const modelLabels: Record<string, string> = {
    "one-shot": "Vente one-shot",
    "subscription-monthly": "Abonnement mensuel",
    "subscription-annual": "Abonnement annuel",
    "usage-based": "Pay-as-you-go",
    "commission": "Commission sur transactions",
    "freemium": "Freemium"
  };

  let prompt = `<business_context>
ENTREPRISE: ${input.businessName}
${input.website ? `Site web: ${input.website}` : "Pas de site web"}
Secteur: ${input.sector}${input.sectorDetails ? ` (${input.sectorDetails})` : ""}
Localisation: ${input.location?.city}, ${input.location?.country}
Cible: ${input.targetCustomers?.type} - ${input.targetCustomers?.persona}

${input.businessMaturity ? `Stade de maturité: ${maturityLabels[input.businessMaturity] || input.businessMaturity}` : ""}
${input.annualRevenue ? `CA annuel: ${input.annualRevenue}€` : ""}
${input.teamSize ? `Taille équipe: ${input.teamSize}` : ""}
</business_context>

<offer>
CE QU'ILS VENDENT:
${input.whatYouSell}

${input.uniqueValueProposition ? `USP (Proposition de valeur unique):\n"${input.uniqueValueProposition}"` : ""}

Fourchette de prix: ${input.priceRange?.min}€ - ${input.priceRange?.max}€
${input.businessModel ? `Modèle économique: ${modelLabels[input.businessModel] || input.businessModel}` : ""}
${input.grossMargin ? `Marge brute estimée: ${input.grossMargin}%` : ""}

Points forts revendiqués: ${input.differentiators?.join(", ") || "Non spécifiés"}
Canaux d'acquisition actuels: ${input.acquisitionChannels?.join(", ") || "Non spécifiés"}
</offer>

<competitors count="${input.competitors?.length || 0}">
${competitorsList}
${input.competitorAdvantage ? `\nPOURQUOI ILS PERDENT face aux concurrents:\n${input.competitorAdvantage}` : ""}
</competitors>

<objectives>
Objectifs (par ordre de priorité): ${input.goalPriorities?.join(" > ") || input.goals?.join(", ") || "Analyse complète"}
${input.successMetrics ? `Métriques de succès attendues: ${input.successMetrics}` : ""}
</objectives>

<constraints>
Budget: ${input.budgetLevel}
Timeline: ${input.timeline}
Ton souhaité: ${input.tonePreference}
${input.notes ? `Notes additionnelles: ${input.notes}` : ""}
</constraints>`;

  // Add web search instructions for Pro and Agency tiers
  if (plan === "pro" || plan === "agency") {
    prompt += `

<recherche_web>
UTILISE IMPÉRATIVEMENT le web search pour:
1. Trouver les VRAIS PRIX des concurrents: ${input.competitors?.map(c => c.name).join(", ") || "acteurs majeurs du secteur"}
2. Données marché "${input.sector}" en "${input.location?.country}" - taille, croissance, tendances 2025
3. Benchmarks financiers du secteur (CAC, LTV, marges moyennes)
${plan === "agency" ? `4. Analyses PESTEL récentes pour ${input.location?.country}
5. Porter 5 Forces - données spécifiques au secteur
6. Articles de presse récents sur le secteur` : ""}

⚠️ CITE TOUTES TES SOURCES avec titre et URL dans le champ "sources"
</recherche_web>`;
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
  "executive_summary": { "one_page_summary": "string (500 mots max, style McKinsey)", "situation_actuelle": "string", "opportunite_principale": "string", "strategic_recommendation": "string", "investment_required": "string (ex: 50-80k€)", "expected_roi": "string (ex: 3-5x en 18 mois)", "critical_success_factors": ["string"], "key_metrics_to_track": ["string"], "urgency_assessment": { "level": "Critique/Élevé/Modéré", "rationale": "string", "window_of_opportunity": "string" } },
  "market_analysis": { "market_sizing": { "total_addressable_market": "string avec €", "serviceable_addressable_market": "string avec €", "serviceable_obtainable_market": "string avec €", "methodology": "string" }, "market_dynamics": { "growth_rate": "string %", "maturity_stage": "string", "key_drivers": ["string"], "headwinds": ["string"], "inflection_points": ["string"] }, "pestel_analysis": { "political": ["string"], "economic": ["string"], "social": ["string"], "technological": ["string"], "environmental": ["string"], "legal": ["string"] }, "porter_five_forces": { "competitive_rivalry": { "score": 1-10, "analysis": "string" }, "supplier_power": { "score": 1-10, "analysis": "string" }, "buyer_power": { "score": 1-10, "analysis": "string" }, "threat_of_substitution": { "score": 1-10, "analysis": "string" }, "threat_of_new_entry": { "score": 1-10, "analysis": "string" }, "overall_attractiveness": "string", "strategic_implications": "string" } },
  "competitive_intelligence": { "competition_landscape_overview": "string", "competitors_deep_dive": [{ "name": "string", "profile": { "size": "string", "growth_trajectory": "string" }, "positioning": { "value_prop": "string", "target_segment": "string" }, "offering": { "products_services": ["string"], "pricing_model": "string" }, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible", "opportunities_vs_them": "string" }], "competitive_positioning_maps": { "primary_map": { "x_axis": "Prix", "y_axis": "Qualité Perçue", "competitors_plotted": [{ "name": "string", "x": 1-10, "y": 1-10 }], "your_current_position": { "x": 1-10, "y": 1-10 }, "recommended_position": { "x": 1-10, "y": 1-10 }, "rationale": "string" } }, "unmet_customer_needs": [{ "need": "string", "evidence": "string", "how_to_address": "string" }] },
  "swot_analysis": { "strengths": ["string - items actionnables"], "weaknesses": ["string - items actionnables"], "opportunities": ["string - items actionnables"], "threats": ["string - items actionnables"], "strategic_priorities": "string" },
  "customer_intelligence": { "segments_analyzed": [{ "segment_name": "string", "size_estimate": "string", "pain_points": ["string"], "decision_criteria": ["string"], "willingness_to_pay": "string", "acquisition_cost_estimate": "string en €", "lifetime_value_estimate": "string en €", "priority": "1/2/3" }], "voice_of_customer": { "common_complaints": ["string"], "desired_features": ["string"], "switching_barriers": ["string"] } },
  "strategic_recommendations": { "recommended_strategy": { "strategic_archetype": "string", "rationale": "string" }, "positioning_strategy": { "target_segment_primary": "string", "value_proposition": "string", "positioning_statement": "string", "reasons_to_believe": ["string"] }, "brand_strategy": { "brand_essence": "string", "brand_personality": ["string"], "brand_voice_description": "string", "tagline_options": ["string - 3 options mémorables"], "messaging_hierarchy": { "primary_message": "string", "supporting_messages": ["string"] } }, "product_strategy": { "core_offering_recommendation": "string", "tiering_strategy": [{ "tier_name": "string", "target_segment": "string", "key_features": ["string"], "pricing_range": "string en €" }], "product_roadmap_priorities": [{ "feature_initiative": "string", "priority": "P0/P1/P2", "expected_impact": "string" }] }, "pricing_strategy": { "pricing_model_recommendation": "string", "price_optimization_by_tier": [{ "tier": "string", "recommended_price": "string en €", "rationale": "string" }], "upsell_cross_sell_opportunities": ["string"] }, "go_to_market_strategy": { "customer_acquisition": { "primary_channels_detailed": [{ "channel": "string", "rationale": "string", "investment_level": "string en €", "expected_cac": "string en €", "tactics": ["string"] }], "content_marketing_strategy": { "strategic_themes": ["string"], "content_formats_prioritized": ["string"] }, "partnership_opportunities_detailed": [{ "partner_type": "string", "examples": ["string"] }] }, "sales_strategy": { "sales_model": "string", "sales_process_recommendation": "string" } } },
  "financial_projections": { "investment_required": { "total_12_months": number, "breakdown": [{ "category": "string", "amount": number, "rationale": "string" }] }, "revenue_scenarios": { "conservative": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "baseline": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "optimistic": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] } }, "unit_economics": { "customer_acquisition_cost": number, "lifetime_value": number, "ltv_cac_ratio": number, "payback_period_months": number, "gross_margin_percent": number, "comparison_to_benchmarks": "string" } },
  "implementation_roadmap": { "phase_1_foundation": { "timeline": "Mois 1-3", "objectives": ["string"], "key_initiatives": [{ "initiative": "string", "owner_role": "string", "budget_estimate": "string en €", "success_metrics": ["string"], "milestones": ["string"] }] }, "phase_2_growth": { "timeline": "Mois 4-6", "objectives": ["string"], "key_initiatives": ["..."] }, "phase_3_scale": { "timeline": "Mois 7-12", "objectives": ["string"], "key_initiatives": ["..."] } },
  "risk_register": [{ "risk": "string", "impact": "Élevé/Moyen/Faible", "probability": "Élevé/Moyen/Faible", "mitigation": "string", "contingency": "string" }],
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
  "executive_summary": { "headline": "string - accroche impactante", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string - 3-5 points clés actionnables"], "urgency_level": "Critique/Élevé/Modéré", "urgency_rationale": "string", "market_size_estimate": "string avec €", "growth_rate": "string %" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "string", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "Facile/Moyen/Difficile", "value_potential": "Élevé/Moyen/Faible", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "market_intelligence": { "sector_trends_2026": [{ "trend": "string", "impact_on_you": "string", "how_to_leverage": "string action concrète" }], "local_market_data": { "market_maturity": "string", "key_players_count": "string", "market_size_estimate": "string avec €", "growth_rate": "string %", "insights": ["string"] } },
  "competitive_landscape": { "competition_intensity": "Élevée/Moyenne/Faible", "competitors_analyzed": [{ "name": "string", "website": "string", "type": "Direct/Indirect/Substitut", "positioning": "string", "pricing_found": "string en € - trouvé via web search", "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible" }], "competitive_gaps": ["string - opportunités non exploitées"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "Facile/Moyen/Difficile", "impact": "Élevé/Moyen/Faible", "description": "string" }] },
  "competitive_intelligence": { "deep_competitor_profiles": [{ "name": "string", "positioning": "string", "digital_presence_score": 1-10, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible" }], "competitive_matrix": { "axes": { "x_axis": "Prix", "y_axis": "Qualité Perçue" }, "positions": [{ "competitor": "string", "x": 1-10, "y": 1-10 }] }, "white_spaces": ["string - opportunités de marché vides"] },
  "customer_insights": { "pain_points_identified": [{ "pain_point": "string", "evidence": "string - source web", "opportunity": "string" }], "unmet_needs": ["string"], "switching_barriers": ["string"], "decision_criteria": ["string par ordre d'importance"] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string - 3 options mémorables"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"], "differentiation_score": { "current": 1-10, "potential": 1-10, "gap_to_close": "string" } },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string en €", "mid_tier": "string en €", "premium_tier": "string en €" }, "competitor_pricing_table": [{ "competitor": "string", "offer": "string", "price": "string en €" }], "recommended_pricing": [{ "package_name": "string", "suggested_price": "string en €", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string - gains rapides pricing"], "upsell_opportunities": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string - action concrète J+1", "expected_cac": "string en €", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_gaps": ["string"], "content_formats": ["string"], "thought_leadership_opportunities": ["string"] }, "partnership_opportunities": ["string avec noms concrets"] },
  "action_plan": { "now_7_days": [{ "action": "string commençant par verbe", "owner": "string rôle", "outcome": "string résultat attendu" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }], "quick_wins_with_proof": [{ "action": "string", "why_now": "string", "expected_impact": "string chiffré" }] },
  "risks_and_considerations": { "market_risks": ["string"], "competitive_threats": ["string"], "regulatory_considerations": ["string"] },
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string - hypothèses à tester"],
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
  "executive_summary": { "headline": "string - accroche impactante max 15 mots", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string - 3-5 points clés"], "urgency_level": "Critique/Élevé/Modéré", "urgency_rationale": "string" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "Émergent/En croissance/Mature/Saturé", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "Facile/Moyen/Difficile", "value_potential": "Élevé/Moyen/Faible", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "competitive_landscape": { "competition_intensity": "Élevée/Moyenne/Faible", "competitors_analyzed": [{ "name": "string", "type": "Direct/Indirect/Substitut", "positioning": "string", "strengths": ["string max 3"], "weaknesses": ["string max 3"], "price_range": "string en €", "differentiation": "string", "threat_level": "Élevé/Moyen/Faible" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "Facile/Moyen/Difficile", "impact": "Élevé/Moyen/Faible", "description": "string" }] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string - 3 options"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"] },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string en €", "mid_tier": "string en €", "premium_tier": "string en €" }, "recommended_pricing": [{ "package_name": "string", "suggested_price": "string en €", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string action concrète", "expected_cac": "string", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_formats": ["string"], "distribution_approach": "string" }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string commençant par verbe d'action", "owner": "string", "outcome": "string résultat attendu" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }] },
  "risks_and_considerations": [{ "risk": "string", "impact": "Élevé/Moyen/Faible", "mitigation": "string" }],
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"]
}
</json_schema>

Génère le rapport de benchmark. RETOURNE UNIQUEMENT LE JSON.`;
}

// ============================================
// CLAUDE API WITH WEB SEARCH (AGENTIC LOOP)
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callClaudeWithTools(
  apiKey: string,
  config: typeof TIER_CONFIG[TierType],
  userPrompt: string,
  reportId: string,
  supabase: any
): Promise<string> {
  console.log(`[${reportId}] Starting Claude API call with ${config.tools.length > 0 ? "web search enabled" : "no tools"}`);

  let messages: Array<{ role: string; content: unknown }> = [
    { role: "user", content: userPrompt }
  ];

  let finalResponse = "";
  let iterationCount = 0;
  const maxIterations = 10; // Safety limit

  // Progress tracking steps
  const progressSteps = [
    { step: "Analyse du contexte business", progress: 10 },
    { step: "Recherche des concurrents", progress: 25 },
    { step: "Analyse du marché", progress: 40 },
    { step: "Génération des recommandations", progress: 60 },
    { step: "Création du plan d'action", progress: 80 },
    { step: "Finalisation du rapport", progress: 95 },
  ];

  while (iterationCount < maxIterations) {
    iterationCount++;

    // Update progress based on iteration
    const progressIndex = Math.min(iterationCount - 1, progressSteps.length - 1);
    await updateProgress(
      supabase,
      reportId,
      progressSteps[progressIndex].step,
      progressSteps[progressIndex].progress
    );

    console.log(`[${reportId}] Claude iteration ${iterationCount} - ${progressSteps[progressIndex].step}`);

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
      const toolUseBlocks = data.content.filter((block: { type: string }) => block.type === "tool_use");

      if (toolUseBlocks.length > 0) {
        console.log(`[${reportId}] Claude is using ${toolUseBlocks.length} tool(s) - web search`);

        // Update progress for web search
        await updateProgress(supabase, reportId, "Recherche web en cours...", 30 + (iterationCount * 5));

        messages.push({ role: "assistant", content: data.content });

        const toolResults = toolUseBlocks.map((toolUse: { id: string; name: string }) => ({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: "Search completed"
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

    // Update status to processing with initial step
    await supabaseAdmin
      .from("reports")
      .update({
        status: "processing",
        processing_step: "Initialisation...",
        processing_progress: 5
      } as Record<string, unknown>)
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
    const content = await callClaudeWithTools(CLAUDE_API_KEY, tierConfig, userPrompt, reportId, supabaseAdmin);

    if (!content) {
      throw new Error("No content returned from Claude");
    }

    // Update progress
    await updateProgress(supabaseAdmin, reportId, "Parsing du rapport...", 98);

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
        processing_step: "Terminé",
        processing_progress: 100
      } as Record<string, unknown>)
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
        await supabaseAdmin.from("reports").update({
          status: "failed",
          processing_step: "Erreur",
          processing_progress: 0
        } as Record<string, unknown>).eq("id", reportId);
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
