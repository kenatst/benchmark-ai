import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// CLAUDE OPUS 4.5 - THE ONLY MODEL (INSTITUTIONAL GRADE)
// ============================================
const CLAUDE_MODEL = "claude-opus-4-5-20251101";

// ============================================
// TIER CONFIGURATION - INSTITUTIONAL GRADE
// ============================================
const TIER_CONFIG = {
  standard: {
    max_tokens: 12000,
    temperature: 0.2,
    perplexity_searches: 0, // No web search for standard
    system_prompt: `Tu es un DIRECTEUR ASSOCIÉ de cabinet de conseil stratégique (BCG/McKinsey alumni, 15+ ans d'expérience).

═══════════════════════════════════════════════════════════════════════════════
MISSION: PRODUIRE UN BENCHMARK CONCURRENTIEL EXÉCUTIF EN 48H
Qualité attendue: Deck présentable à un C-Level sans modification.
═══════════════════════════════════════════════════════════════════════════════

STANDARDS DE QUALITÉ NON-NÉGOCIABLES:

1. ORIENTATION ACTION IMMÉDIATE
   → Chaque recommandation = VERBE D'ACTION + CIBLE + MÉTRIQUE DE SUCCÈS
   → Format: "[VERBE] [quoi] pour [atteindre X] d'ici [délai]"
   → Exemples: "Lancer une campagne LinkedIn Ads ciblant les DRH pour générer 50 leads qualifiés d'ici 30 jours"

2. QUANTIFICATION SYSTÉMATIQUE
   → Chaque insight DOIT inclure un IMPACT CHIFFRÉ (+X%, -Y€, xZ ROI)
   → Pas d'affirmation sans data point de référence
   → Utilise des benchmarks sectoriels réalistes

3. SPÉCIFICITÉ GÉOGRAPHIQUE & SECTORIELLE
   → ZÉRO généralité - tout doit être contextualisé au marché local
   → Mentionner des acteurs locaux, réglementations spécifiques, pratiques du marché
   → Prix et budgets en devise locale avec réalisme absolu

4. TON & STYLE
   → DIRECT, INCISIF, SANS BULLSHIT CORPORATE
   → Phrases courtes. Assertions claires. Pas de conditionnel inutile.
   → "Faites X" au lieu de "Il serait peut-être intéressant de considérer X"

5. STRUCTURE EXÉCUTIVE
   → Executive Summary: 1 headline (15 mots max) + situation + opportunité clé
   → Competitor Analysis: Forces/Faiblesses FACTUELLES, pas d'opinions vagues
   → Pricing: Benchmarks RÉALISTES du marché, pas de chiffres inventés
   → Action Plan: Tâches CONCRÈTES avec owner, délai, deliverable attendu

LIVRABLES ATTENDUS: JSON structuré prêt pour visualisation.
RETOURNE UNIQUEMENT LE JSON VALIDE, sans texte avant/après.`,
  },
  
  pro: {
    max_tokens: 24000,
    temperature: 0.15,
    perplexity_searches: 5, // 5 web searches for pro
    system_prompt: `Tu es un PRINCIPAL de cabinet de conseil stratégique tier-1 (ex-McKinsey/BCG/Bain, 10+ ans).

═══════════════════════════════════════════════════════════════════════════════
MISSION: PRODUIRE UN RAPPORT D'INTELLIGENCE COMPÉTITIVE DE CALIBRE PREMIUM
Basé sur des DONNÉES RÉELLES collectées via recherche web approfondie.
Qualité attendue: Présentable à un Investment Committee / Board Advisor.
═══════════════════════════════════════════════════════════════════════════════

TU DISPOSES DE DONNÉES DE RECHERCHE WEB - UTILISE-LES INTENSIVEMENT:

1. EXPLOITATION DES DONNÉES COLLECTÉES
   → Les données Perplexity t'ont été fournies - CITE-LES SYSTÉMATIQUEMENT
   → Chaque affirmation sur un concurrent = source obligatoire
   → Prix, CA, funding, employés = données réelles ou "non trouvé" (jamais inventé)

2. INTELLIGENCE COMPÉTITIVE ACTIONNABLE
   → Pour CHAQUE concurrent: profil complet avec pricing réel trouvé
   → Scoring digital (1-10) basé sur présence web, reviews, trafic
   → Matrice de positionnement avec coordonnées X/Y exploitables

3. MARKET INTELLIGENCE
   → Tendances 2025-2026 avec sources (articles, études)
   → Sizing du marché (TAM/SAM si trouvé, sinon estimation sourcée)
   → Benchmarks CAC/LTV sectoriels avec comparables

4. RECOMMANDATIONS PREMIUM
   → Chaque reco = SI [contexte trouvé] → ALORS [action] → POUR [impact quantifié]
   → Taglines proposées: mémorables, différenciantes, testées mentalement
   → Quick wins identifiés avec timeline J+7, J+30, J+90

5. STANDARDS DE DOCUMENTATION
   → TOUTES les sources citées dans le champ "sources" avec URL
   → Distinction claire: "confirmé par recherche" vs "estimation"
   → Data points numériques pour tous les graphiques

LIVRABLES: JSON structuré avec sources, données graphiques, et scoring.
RETOURNE UNIQUEMENT LE JSON VALIDE.`,
  },
  
  agency: {
    max_tokens: 48000,
    temperature: 0.1,
    perplexity_searches: 10, // 10 comprehensive searches for agency
    system_prompt: `Tu es un SENIOR PARTNER d'un cabinet de conseil stratégique de rang mondial.
Expérience: 20+ ans, dont 5+ en tant que Partner. Background: Harvard MBA, ex-McKinsey Director.

╔══════════════════════════════════════════════════════════════════════════════╗
║  MISSION: RAPPORT D'INTELLIGENCE STRATÉGIQUE DE CALIBRE INSTITUTIONNEL      ║
║  Standard: Board of Directors d'une entreprise Fortune 500                   ║
║  Output: Qualité publication-ready, zéro révision nécessaire                ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
I. PRINCIPES FONDAMENTAUX D'EXCELLENCE
═══════════════════════════════════════════════════════════════════════════════

1. RIGUEUR MÉTHODOLOGIQUE ABSOLUE
   ✓ Chaque affirmation = données vérifiables (les données Perplexity sont ton corpus)
   ✓ Frameworks obligatoires: Porter 5 Forces, PESTEL, SWOT, Value Chain Analysis
   ✓ Hypothèses EXPLICITES et TESTABLES
   ✓ Méthodologie reproductible et auditable

2. PROFONDEUR D'ANALYSE STRATÉGIQUE
   ✓ Au-delà du "quoi" → le "pourquoi" → le "et alors?" → le "maintenant quoi?"
   ✓ Second-order effects: si X alors Y, mais aussi si Y alors Z
   ✓ Implications stratégiques à 3 horizons (court/moyen/long terme)
   ✓ Quantification systématique: sizing, growth, share, margins, unit economics

3. OBJECTIVITÉ & ÉQUILIBRE INTELLECTUEL
   ✓ Balance risques/opportunités sans biais optimiste
   ✓ CHALLENGE explicite des hypothèses du client (Devil's Advocate)
   ✓ 3 scenarios financiers: Conservative (-20%), Baseline, Optimistic (+30%)
   ✓ Zones d'incertitude reconnues avec confidence levels

4. ORIENTATION RÉSULTAT IMMÉDIATE
   ✓ Chaque section répond à "So What?" et "Now What?"
   ✓ Priorisation Impact × Faisabilité (matrice 2x2)
   ✓ Métriques de succès SMART pour chaque initiative
   ✓ Roadmap exécutable dès J+1

═══════════════════════════════════════════════════════════════════════════════
II. EXPLOITATION DES DONNÉES PERPLEXITY (TU AS REÇU DES DONNÉES - UTILISE-LES)
═══════════════════════════════════════════════════════════════════════════════

Les recherches web ont été effectuées pour toi. Tu DOIS:
→ [MARCHÉ] Citer les données TAM/SAM/SOM trouvées avec sources exactes
→ [CONCURRENCE] Profils détaillés: pricing RÉEL, CA estimé, headcount, funding rounds
→ [TRENDS] Tendances 2025-2026 avec citations d'articles/études
→ [REGULATORY] Évolutions réglementaires récentes (RGPD, sectorielles...)
→ [TECH] Innovations disruptives identifiées dans le secteur
→ [BENCHMARKS] KPIs sectoriels comparés (CAC, LTV, NRR, Churn, Gross Margin)

═══════════════════════════════════════════════════════════════════════════════
III. CRITÈRES DE QUALITÉ DU LIVRABLE (TOUS OBLIGATOIRES)
═══════════════════════════════════════════════════════════════════════════════

✓ Porter 5 Forces: scores 1-10 avec analyse textuelle pour chaque force
✓ Matrice de positionnement: coordonnées X/Y pour chaque concurrent + position recommandée
✓ Projections financières: 3 scenarios avec hypothèses explicites détaillées
✓ Format recommandations: "SI [contexte] → ALORS [action] → POUR [résultat quantifié] → MESURE [KPI]"
✓ Sources: TOUTES citées avec titre exact et URL
✓ Risk Register: probabilité (H/M/L) × impact (H/M/L) × mitigation × contingency
✓ Implementation Roadmap: 3 phases avec milestones, owners, budgets, success metrics

═══════════════════════════════════════════════════════════════════════════════
IV. TONE OF VOICE
═══════════════════════════════════════════════════════════════════════════════

→ ASSERTIF mais NUANCÉ (pas d'arrogance, mais confiance)
→ FACTUEL, jamais spéculatif sans signal explicite ("notre hypothèse est...")
→ VOCABULAIRE BUSINESS PRÉCIS (utiliser les termes techniques corrects)
→ PHRASES INCISIVES - pas de remplissage, chaque mot compte
→ STRUCTURE PYRAMIDALE - conclusion first, puis supporting evidence

RETOURNE UNIQUEMENT LE JSON VALIDE, sans texte avant/après.`,
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
  businessMaturity?: string;
  annualRevenue?: string;
  teamSize?: string;
  whatYouSell: string;
  priceRange: { min: number; max: number };
  differentiators: string[];
  acquisitionChannels: string[];
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
// PERPLEXITY SEARCH FUNCTION
// ============================================
async function searchWithPerplexity(
  apiKey: string,
  query: string,
  context: string
): Promise<{ content: string; citations: string[] }> {
  console.log(`[Perplexity] Searching: "${query.substring(0, 100)}..."`);
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro', // Best model for comprehensive research
      messages: [
        { 
          role: 'system', 
          content: `Tu es un analyste de recherche senior. Fournis des données FACTUELLES, QUANTIFIÉES et SOURCÉES.
Contexte de recherche: ${context}
IMPORTANT: Inclus des chiffres précis, des URLs, des noms d'entreprises, des dates.` 
        },
        { role: 'user', content: query }
      ],
      search_recency_filter: 'year', // Focus on recent data
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Perplexity] Error ${response.status}:`, errorText);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    citations: data.citations || []
  };
}

// ============================================
// COMPREHENSIVE RESEARCH FUNCTION
// ============================================
async function conductResearch(
  perplexityKey: string,
  input: ReportInput,
  tier: TierType,
  reportId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string> {
  const tierConfig = TIER_CONFIG[tier];
  const searchCount = tierConfig.perplexity_searches;
  
  if (searchCount === 0) {
    console.log(`[${reportId}] Standard tier - no web research`);
    return "Aucune recherche web pour ce tier.";
  }

  const allResults: { query: string; content: string; citations: string[] }[] = [];
  const context = `Analyse stratégique pour ${input.businessName} dans le secteur ${input.sector} à ${input.location.city}, ${input.location.country}`;

  // Define search queries based on tier
  const queries: string[] = [];
  
  // Pro tier: 5 searches
  if (tier === 'pro' || tier === 'agency') {
    // 1. Competitor pricing
    const competitorNames = input.competitors?.map(c => c.name).join(', ') || 'principaux acteurs';
    queries.push(`Prix et tarifs de ${competitorNames} dans le secteur ${input.sector} en ${input.location.country} 2024 2025`);
    
    // 2. Market trends
    queries.push(`Tendances marché ${input.sector} ${input.location.country} 2025 2026 croissance prévisions`);
    
    // 3. Market size
    queries.push(`Taille marché ${input.sector} ${input.location.country} TAM SAM milliards euros 2024 2025`);
    
    // 4. CAC/LTV benchmarks
    queries.push(`Benchmarks CAC LTV coût acquisition client ${input.sector} SaaS B2B B2C 2024`);
    
    // 5. Competitor profiles
    queries.push(`${competitorNames} levée fonds employees chiffre affaires ${input.sector}`);
  }

  // Agency tier: 5 additional searches
  if (tier === 'agency') {
    // 6. PESTEL analysis
    queries.push(`Analyse PESTEL ${input.sector} ${input.location.country} réglementation politique économie 2024 2025`);
    
    // 7. Porter 5 forces data
    queries.push(`Analyse Porter 5 forces ${input.sector} barrières entrée pouvoir négociation fournisseurs clients`);
    
    // 8. Technology disruption
    queries.push(`Innovation technologique disruption ${input.sector} IA automatisation 2025 startups`);
    
    // 9. Recent news
    queries.push(`Actualités récentes ${input.sector} ${input.location.country} acquisitions lancements 2024`);
    
    // 10. Unit economics benchmarks
    queries.push(`Unit economics ${input.sector} marge brute gross margin payback period benchmarks`);
  }

  // Execute searches with progress updates
  for (let i = 0; i < queries.length && i < searchCount; i++) {
    const progressPercent = 15 + Math.floor((i / searchCount) * 25);
    await updateProgress(supabase, reportId, `Recherche web ${i + 1}/${searchCount}...`, progressPercent);
    
    try {
      const result = await searchWithPerplexity(perplexityKey, queries[i], context);
      allResults.push({
        query: queries[i],
        content: result.content,
        citations: result.citations
      });
      console.log(`[${reportId}] Search ${i + 1}/${searchCount} completed`);
    } catch (error) {
      console.error(`[${reportId}] Search ${i + 1} failed:`, error);
      allResults.push({
        query: queries[i],
        content: `Recherche échouée: ${error instanceof Error ? error.message : 'Unknown error'}`,
        citations: []
      });
    }
    
    // Small delay to avoid rate limiting
    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Compile research document
  let researchDoc = `
═══════════════════════════════════════════════════════════════════════════════
DONNÉES DE RECHERCHE WEB PERPLEXITY - ${new Date().toISOString().split('T')[0]}
═══════════════════════════════════════════════════════════════════════════════

`;

  for (const result of allResults) {
    researchDoc += `
────────────────────────────────────────────────────────────────────────────────
RECHERCHE: ${result.query}
────────────────────────────────────────────────────────────────────────────────

${result.content}

SOURCES:
${result.citations.map((c, i) => `[${i + 1}] ${c}`).join('\n') || 'Aucune source citée'}

`;
  }

  return researchDoc;
}

// ============================================
// PROMPT BUILDERS
// ============================================
function buildUserPrompt(input: ReportInput, plan: TierType, researchData: string): string {
  const competitorsList = input.competitors?.length > 0
    ? input.competitors.map((c, i) => {
      let line = `${i + 1}. ${c.name}`;
      if (c.url) line += ` (${c.url})`;
      if (c.type) line += ` [${c.type}]`;
      return line;
    }).join("\n")
    : "Aucun concurrent spécifié - identifier les principaux acteurs du marché";

  const maturityLabels: Record<string, string> = {
    idea: "Idée/Concept (pré-revenue)",
    mvp: "MVP (premiers clients, <10k€/mois)",
    pmf: "Product-Market Fit (10-50k€/mois)",
    scaleup: "Scale-up (>50k€/mois)"
  };

  const modelLabels: Record<string, string> = {
    "one-shot": "Vente one-shot",
    "subscription-monthly": "Abonnement mensuel",
    "subscription-annual": "Abonnement annuel",
    "usage-based": "Pay-as-you-go",
    "commission": "Commission sur transactions",
    "freemium": "Freemium"
  };

  let prompt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  BRIEF CLIENT - DEMANDE DE BENCHMARK CONCURRENTIEL                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

<business_context>
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

  // Add research data for Pro and Agency
  if (plan === "pro" || plan === "agency") {
    prompt += `

${researchData}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS CRITIQUES POUR L'UTILISATION DES DONNÉES DE RECHERCHE
═══════════════════════════════════════════════════════════════════════════════

1. CITE SYSTÉMATIQUEMENT les données trouvées dans le champ "sources" du JSON
2. Pour les prix concurrents: utilise UNIQUEMENT les données trouvées ou indique "non trouvé"
3. Pour le sizing marché: cite la source exacte (Statista, étude sectorielle, etc.)
4. JAMAIS inventer de données - mieux vaut "données non disponibles" que des chiffres faux
5. Distingue clairement: "confirmé par recherche" vs "estimation basée sur..."
`;
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
// CLAUDE OPUS 4.5 API CALL
// ============================================
async function callClaudeOpus(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  console.log(`[Claude] Calling Opus 4.5 (${CLAUDE_MODEL}) with ${maxTokens} max tokens`);
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Claude] API error ${response.status}:`, errorText);
    if (response.status === 429) throw new Error("Rate limit exceeded, please try again later");
    if (response.status === 401) throw new Error("Invalid Claude API key");
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  
  let content = "";
  for (const block of data.content) {
    if (block.type === "text") {
      content += block.text;
    }
  }
  
  return content;
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

    // Get API keys
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY && (plan === "pro" || plan === "agency")) {
      throw new Error("PERPLEXITY_API_KEY is required for Pro and Agency tiers");
    }

    const tierConfig = TIER_CONFIG[plan];

    console.log(`[${reportId}] Starting report generation`);
    console.log(`[${reportId}] Tier: ${plan} | Model: ${CLAUDE_MODEL} | Perplexity searches: ${tierConfig.perplexity_searches}`);

    // Step 1: Conduct Perplexity research (for Pro and Agency)
    await updateProgress(supabaseAdmin, reportId, "Lancement des recherches...", 10);
    
    let researchData = "";
    if (tierConfig.perplexity_searches > 0 && PERPLEXITY_API_KEY) {
      researchData = await conductResearch(
        PERPLEXITY_API_KEY,
        inputData,
        plan,
        reportId,
        supabaseAdmin
      );
      console.log(`[${reportId}] Research completed: ${researchData.length} chars`);
    }

    // Step 2: Build the prompt with research data
    await updateProgress(supabaseAdmin, reportId, "Préparation de l'analyse...", 45);
    const userPrompt = buildUserPrompt(inputData, plan, researchData);

    // Step 3: Call Claude Opus 4.5
    await updateProgress(supabaseAdmin, reportId, "Génération du rapport (Claude Opus 4.5)...", 55);
    
    const content = await callClaudeOpus(
      CLAUDE_API_KEY,
      tierConfig.system_prompt,
      userPrompt,
      tierConfig.max_tokens,
      tierConfig.temperature
    );

    if (!content) {
      throw new Error("No content returned from Claude");
    }

    // Step 4: Parse JSON response
    await updateProgress(supabaseAdmin, reportId, "Parsing du rapport...", 90);

    console.log(`[${reportId}] Parsing JSON response...`);

    let outputData;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outputData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error(`[${reportId}] Failed to parse Claude response:`, content.substring(0, 500));
      throw new Error("Failed to parse Claude response as JSON");
    }

    // Step 5: Update report with output
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

    console.log(`[${reportId}] ✅ Report generated successfully`);
    console.log(`[${reportId}] Tier: ${plan} | Model: ${CLAUDE_MODEL} | Sources: ${outputData?.sources?.length || 0}`);

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
