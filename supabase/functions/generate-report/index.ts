// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
// @ts-ignore - Deno import
import { z } from "https://esm.sh/zod@3.23.8";

// FORCE REDEPLOY: 2026-02-05 - Remove Perplexity, GPT-5.2 only, quality-first prompts
// Import shared constants (eliminates CORS header duplication across 10+ functions)
// @ts-ignore - Deno import
import { corsHeaders, getAuthContext } from "../_shared.ts";

// ============================================
// GPT-5.2 MODEL - SOLE ANALYSIS ENGINE
// ============================================
// All analysis powered by GPT-5.2 via OpenAI /v1/responses endpoint
// No external research APIs - GPT-5.2's training data is the knowledge base

// ============================================
// SUPPORTED LANGUAGES FOR REPORT GENERATION
// ============================================
const LANGUAGE_CONFIG: Record<string, { name: string; code: string }> = {
  fr: { name: 'Français', code: 'fr' },
  en: { name: 'English', code: 'en' },
  es: { name: 'Español', code: 'es' },
  it: { name: 'Italiano', code: 'it' },
  de: { name: 'Deutsch', code: 'de' },
  ru: { name: 'Русский', code: 'ru' },
  zh: { name: '中文', code: 'zh' },
};

type TierType = 'standard' | 'pro' | 'agency';

// ============================================
// ZOD SCHEMAS FOR GPT-5.2 OUTPUT VALIDATION
// ============================================
const ReportMetadataSchema = z.object({
  title: z.string(),
  generated_date: z.string(),
  business_name: z.string(),
  sector: z.string(),
  location: z.string(),
  tier: z.enum(['standard', 'pro', 'agency']),
  sources_count: z.number().optional(),
  word_count: z.number().optional(),
});

const BaseReportSchema = z.object({
  report_metadata: ReportMetadataSchema,
  executive_summary: z.object({
    headline: z.string(),
    situation_actuelle: z.string(),
    opportunite_principale: z.string(),
  }).passthrough(),
  sources: z.array(z.union([
    z.string(),
    z.object({ title: z.string(), url: z.string() })
  ])).optional(),
}).passthrough();

const StandardReportSchema = BaseReportSchema.extend({
  competitive_landscape: z.object({}).passthrough().optional(),
  positioning_strategy: z.object({}).passthrough().optional(),
}).passthrough();

const ProReportSchema = StandardReportSchema.extend({
  market_opportunities: z.object({}).passthrough().optional(),
  go_to_market: z.object({}).passthrough().optional(),
}).passthrough();

const AgencyReportSchema = ProReportSchema.extend({
  financial_projections: z.object({}).passthrough().optional(),
  risk_analysis: z.object({}).passthrough().optional(),
  implementation_roadmap: z.object({}).passthrough().optional(),
}).passthrough();

const REPORT_SCHEMAS: Record<string, z.ZodSchema> = {
  standard: StandardReportSchema,
  pro: ProReportSchema,
  agency: AgencyReportSchema,
};

// ============================================
// PDF SPEC (for generate-pdf function)
// ============================================
const PDF_SPEC = {
  colorPalette: {
    primary: "#1a3a5c",
    secondary: "#7c6b9c",
    accent: "#b89456",
    success: "#2d7a5a",
    warning: "#b38f40",
    danger: "#9a4040",
  },
  typography: {
    headingFont: "Helvetica Neue",
    bodyFont: "Georgia",
    monoFont: "Courier",
  },
  layout: {
    margins: { top: 72, bottom: 72, left: 60, right: 60 },
    headerHeight: 40,
    footerHeight: 30,
  }
};

// ============================================
// SECTION PLANS (by tier) - NO WORD TARGETS
// ============================================
type SectionPlanItem = {
  key: string;
  label: string;
  valueType: 'object' | 'array';
};

const SECTION_PLANS: Record<TierType, SectionPlanItem[]> = {
  standard: [
    { key: "executive_summary", label: "Résumé exécutif", valueType: "object" },
    { key: "market_context", label: "Contexte marché", valueType: "object" },
    { key: "competitive_landscape", label: "Analyse concurrentielle", valueType: "object" },
    { key: "positioning_recommendations", label: "Positionnement & messaging", valueType: "object" },
    { key: "pricing_strategy", label: "Stratégie pricing", valueType: "object" },
    { key: "go_to_market", label: "Go-to-market", valueType: "object" },
    { key: "action_plan", label: "Plan d'action 30/60/90", valueType: "object" },
    { key: "financial_projections_basic", label: "Projections financières", valueType: "object" },
    { key: "multi_location_comparison", label: "Comparatif multi-localisations", valueType: "object" },
    { key: "risks_and_considerations", label: "Risques & considérations", valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", valueType: "array" },
    { key: "next_steps_to_validate", label: "Prochaines validations", valueType: "array" },
    { key: "sources", label: "Sources", valueType: "array" },
  ],
  pro: [
    { key: "executive_summary", label: "Résumé exécutif", valueType: "object" },
    { key: "market_context", label: "Contexte marché", valueType: "object" },
    { key: "market_intelligence", label: "Market intelligence", valueType: "object" },
    { key: "competitive_landscape", label: "Analyse concurrentielle", valueType: "object" },
    { key: "competitive_intelligence", label: "Competitive intelligence", valueType: "object" },
    { key: "customer_insights", label: "Customer insights", valueType: "object" },
    { key: "positioning_recommendations", label: "Positionnement & messaging", valueType: "object" },
    { key: "pricing_strategy", label: "Stratégie pricing", valueType: "object" },
    { key: "go_to_market", label: "Go-to-market", valueType: "object" },
    { key: "action_plan", label: "Plan d'action", valueType: "object" },
    { key: "financial_projections_basic", label: "Projections financières", valueType: "object" },
    { key: "multi_location_comparison", label: "Comparatif multi-localisations", valueType: "object" },
    { key: "risks_and_considerations", label: "Risques & considérations", valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", valueType: "array" },
    { key: "next_steps_to_validate", label: "Prochaines validations", valueType: "array" },
    { key: "sources", label: "Sources", valueType: "array" },
  ],
  agency: [
    { key: "executive_summary", label: "Résumé exécutif", valueType: "object" },
    { key: "methodology", label: "Méthodologie", valueType: "object" },
    { key: "market_overview_detailed", label: "Panorama marché détaillé", valueType: "object" },
    { key: "territory_analysis", label: "Analyse territoriale", valueType: "object" },
    { key: "market_analysis", label: "Analyse marché (PESTEL/Porter)", valueType: "object" },
    { key: "competitive_intelligence", label: "Benchmark concurrentiel", valueType: "object" },
    { key: "scoring_matrix", label: "Matrice de scoring", valueType: "object" },
    { key: "trends_analysis", label: "Tendances", valueType: "object" },
    { key: "swot_analysis", label: "SWOT", valueType: "object" },
    { key: "customer_intelligence", label: "Customer intelligence", valueType: "object" },
    { key: "strategic_recommendations", label: "Stratégie complète", valueType: "object" },
    { key: "financial_projections", label: "Projections financières", valueType: "object" },
    { key: "detailed_roadmap", label: "Roadmap détaillée", valueType: "object" },
    { key: "implementation_roadmap", label: "Implementation roadmap", valueType: "object" },
    { key: "risk_register", label: "Risk register", valueType: "array" },
    { key: "appendices", label: "Annexes", valueType: "object" },
    { key: "multi_market_comparison", label: "Comparatif multi-marchés", valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", valueType: "array" },
    { key: "sources", label: "Sources", valueType: "array" },
  ],
};

// ============================================
// TIER CONFIGURATION - QUALITY-FIRST
// ============================================
const TIER_CONFIG = {
  standard: {
    max_tokens: 16000,
    temperature: 0.3,
    section_plan: SECTION_PLANS.standard,
    section_system_prompt: (lang: string) => `Tu es un DIRECTEUR ASSOCIÉ de cabinet de conseil stratégique (BCG/McKinsey alumni, 15+ ans).
LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - Rédige dans cette langue.
MISSION: Produire UNE SECTION d'un benchmark concurrentiel de calibre C-Level.

PRINCIPES D'EXCELLENCE:
- Chaque insight DOIT être SPÉCIFIQUE au secteur et à la géolocalisation du client.
- Zéro généralité. Si tu ne sais pas → "données non disponibles" (jamais inventer).
- Chaque recommandation = VERBE D'ACTION + CIBLE + MÉTRIQUE DE SUCCÈS.
- Quantifie: fourchettes de prix, pourcentages, ordres de grandeur.
- Style: direct, incisif, phrases courtes, assertions claires.
- Retourne UNIQUEMENT du JSON valide, sans texte/markdown avant ou après.`,
    system_prompt: (lang: string) => `Tu es un DIRECTEUR ASSOCIÉ de cabinet de conseil stratégique (BCG/McKinsey alumni, 15+ ans).

LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

MISSION: Produire un BENCHMARK CONCURRENTIEL de calibre institutionnel.
Qualité attendue: présentable à un comité de direction sans modification. Comme un vrai livrable de cabinet.

PRINCIPES NON-NÉGOCIABLES:
1. SPÉCIFICITÉ LOCALE: Chaque insight contextualisé au marché LOCAL et au secteur PRÉCIS du client. Nomme les acteurs, les quartiers, les dynamiques réelles. Zéro généralité.
2. QUANTIFICATION SYSTÉMATIQUE: Chaque affirmation accompagnée d'un ordre de grandeur (prix, %, ratio, fourchette). Si estimation: "estimation basée sur [base]".
3. RECOMMANDATIONS ACTIONNABLES: Chaque recommandation = VERBE D'ACTION + CIBLE PRÉCISE + RÉSULTAT MESURABLE ATTENDU.
4. CONCURRENTS RÉELS: Analyse des concurrents réels du marché, pas des exemples génériques. Inclure nom, positionnement, prix constatés, forces/faiblesses spécifiques.
5. HONNÊTETÉ INTELLECTUELLE: Si une donnée est incertaine → "Estimation basée sur..." ou "Non disponible". Jamais inventer.
6. STYLE: Direct, incisif, professionnel. Phrases courtes. Assertions claires. Aucun conditionnel inutile. Aucun buzzword vide.

RETOURNE UNIQUEMENT LE JSON VALIDE.`,
  },

  pro: {
    max_tokens: 32000,
    temperature: 0.25,
    section_plan: SECTION_PLANS.pro,
    section_system_prompt: (lang: string) => `Tu es un PRINCIPAL de cabinet de conseil stratégique tier-1 (ex-McKinsey/BCG/Bain, 10+ ans).
LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - Rédige dans cette langue.
MISSION: Produire UNE SECTION d'un rapport d'intelligence compétitive de calibre Investment Committee.

PRINCIPES D'EXCELLENCE:
- Analyse en profondeur: ne survole pas. Décortique chaque dimension avec rigueur.
- Chaque concurrent analysé = profil détaillé avec forces, faiblesses, positionnement, pricing connu.
- Quantifie systématiquement: parts de marché estimées, fourchettes de CA, scoring digital.
- Identifie les WHITE SPACES (opportunités non exploitées par la concurrence).
- Si une donnée est incertaine: "estimation" ou "non disponible". Jamais inventer.
- Style: factuel, quantifié, actionnable.
- Retourne UNIQUEMENT du JSON valide, sans texte/markdown avant ou après.`,
    system_prompt: (lang: string) => `Tu es un PRINCIPAL de cabinet de conseil stratégique tier-1 (ex-McKinsey/BCG/Bain, 10+ ans).

LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

MISSION: Produire un RAPPORT D'INTELLIGENCE COMPÉTITIVE de calibre premium.
Qualité attendue: présentable à un Investment Committee / Board Advisor.

PRINCIPES NON-NÉGOCIABLES:
1. PROFONDEUR: Analyse chaque dimension en détail. Pas de survol. Décortique les dynamiques de marché.
2. CONCURRENTS: Profils détaillés avec positionnement, pricing, forces/faiblesses, scoring digital 1-10.
3. QUANTIFICATION: Parts de marché, fourchettes CA, TAM/SAM, benchmarks CAC/LTV sectoriels.
4. WHITE SPACES: Identifie systématiquement les opportunités non exploitées par la concurrence.
5. HONNÊTETÉ: Données incertaines = "estimation basée sur..." ou "non disponible". Jamais inventer.
6. STYLE: Direct, factuel, quantifié. Qualité publication-ready.

RETOURNE UNIQUEMENT LE JSON VALIDE.`,
  },

  agency: {
    max_tokens: 32000,
    temperature: 0.2,
    section_plan: SECTION_PLANS.agency,
    section_system_prompt: (lang: string) => `Tu es un SENIOR PARTNER d'un cabinet de conseil stratégique de rang mondial (20+ ans, Harvard MBA).
LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - Rédige dans cette langue.
MISSION: Produire UNE SECTION d'un rapport d'intelligence stratégique de calibre institutionnel.

PRINCIPES D'EXCELLENCE:
- Rigueur méthodologique: frameworks obligatoires (Porter, PESTEL, SWOT) appliqués avec précision.
- Profondeur d'analyse: chaque concurrent = deep dive (profil, positionnement, forces/faiblesses, pricing, menace).
- Quantification systématique: scoring 1-10, fourchettes €, ratios, parts de marché estimées.
- Analyse territoriale micro-locale: démographie, immobilier commercial, hubs, dynamiques de quartier.
- 3 scénarios financiers: Conservative (-20%), Baseline, Optimistic (+30%) avec hypothèses explicites.
- Hypothèses EXPLICITES et TESTABLES. Tout chiffre incertain = "estimation" + base de l'estimation.
- Si donnée inconnue: "non disponible" (jamais inventer).
- Dates absolues (ex: "janvier 2026") plutôt que "récemment".
- Retourne UNIQUEMENT du JSON valide, sans texte/markdown avant ou après.`,
    system_prompt: (lang: string) => `Tu es un SENIOR PARTNER d'un cabinet de conseil stratégique de rang mondial (20+ ans, Harvard MBA).

LANGUE: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

MISSION: RAPPORT D'INTELLIGENCE STRATÉGIQUE DE CALIBRE INSTITUTIONNEL.
Standard: Benchmark consulting cabinet / organisme public. Qualité publication-ready.

PRINCIPES NON-NÉGOCIABLES:
1. RIGUEUR MÉTHODOLOGIQUE: Frameworks Porter 5 Forces, PESTEL, SWOT appliqués avec précision et scoring.
2. PROFONDEUR: 10-15 concurrents en deep dive. Profils exhaustifs. Matrice comparative avec scoring 0-10.
3. TERRITORIAL: Analyse micro-locale (quartiers, démographie, immobilier commercial, hubs).
4. FINANCIER: 3 scénarios (Conservative -20%, Baseline, Optimistic +30%). Unit Economics complets.
5. STRATÉGIE: Brand essence, messaging hierarchy, tiering pricing, roadmap 12 mois phasé avec KPIs.
6. HYPOTHÈSES: Explicites et testables. Tout chiffre incertain = "estimation basée sur..." + source.
7. HONNÊTETÉ: Jamais inventer. "Non disponible" si inconnu. Distinguer "confirmé" vs "estimation".
8. STYLE: Institutionnel, rigoureux, quantifié, actionnable.

RETOURNE UNIQUEMENT LE JSON VALIDE.`,
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
  reportLanguage?: string;
}


// ============================================
// STRUCTURED LOGGING HELPER
// ============================================
interface LogEntry {
  timestamp: string;
  reportId: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  step: string;
  message: string;
  duration?: number;
}

function formatLog(entry: LogEntry): string {
  const timestamp = entry.timestamp;
  const level = entry.level.padEnd(7);
  const step = entry.step.padEnd(30);
  const duration = entry.duration ? ` [${entry.duration}ms]` : '';
  return `[${timestamp}] ${level} [${step}] ${entry.message}${duration}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reportLog(reportId: string, level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', step: string, message: string, duration?: number) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    reportId,
    level,
    step,
    message,
    duration
  };
  console.log(formatLog(entry));
}

// ============================================
// JSON & TEXT HELPERS
// ============================================
function extractTextFromResponse(data: unknown): string {
  if (!data) return "";
  const anyData = data as any;

  if (typeof anyData.output_text === 'string') return anyData.output_text;

  if (Array.isArray(anyData.output)) {
    const chunks: string[] = [];
    for (const item of anyData.output) {
      if (typeof item === 'string') {
        chunks.push(item);
        continue;
      }
      if (typeof item?.content === 'string') {
        chunks.push(item.content);
        continue;
      }
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c === 'string') {
            chunks.push(c);
          } else if (c?.type === 'output_text' && typeof c?.text === 'string') {
            chunks.push(c.text);
          } else if (typeof c?.text === 'string') {
            chunks.push(c.text);
          }
        }
      }
    }
    if (chunks.length > 0) return chunks.join("\n");
  }

  if (typeof anyData.content === 'string') return anyData.content;
  if (anyData.choices && Array.isArray(anyData.choices) && anyData.choices.length > 0) {
    const choice = anyData.choices[0];
    if (choice.message?.content) return choice.message.content;
    if (choice.text) return choice.text;
  }

  if (typeof anyData === 'string') return anyData;
  return "";
}

function extractJsonString(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  const objIdx = trimmed.indexOf('{');
  const arrIdx = trimmed.indexOf('[');

  let start = -1;
  if (objIdx === -1) start = arrIdx;
  else if (arrIdx === -1) start = objIdx;
  else start = Math.min(objIdx, arrIdx);

  if (start === -1) return trimmed;

  const openChar = trimmed[start];
  const closeChar = openChar === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;

    if (depth === 0 && i >= start) {
      return trimmed.slice(start, i + 1);
    }
  }

  return trimmed.slice(start);
}

function safeJsonParse(content: string): unknown {
  const clean = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const json = extractJsonString(clean);
  return JSON.parse(json);
}

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, acc);
  }
  return acc;
}

function countWordsInObject(value: unknown): number {
  const strings = collectStrings(value, []);
  const combined = strings.join(" ").trim();
  if (!combined) return 0;
  return combined.split(/\s+/).filter(Boolean).length;
}

function getSectionSchema(sectionKey: string, valueType: 'object' | 'array'): Record<string, unknown> {
  const valueSchema = valueType === 'array'
    ? { type: "array", items: {} }
    : { type: "object", additionalProperties: true };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      [sectionKey]: valueSchema,
    },
    required: [sectionKey],
  };
}

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
      processing_progress: progress,
      updated_at: new Date().toISOString()
    } as Record<string, unknown>)
    .eq('id', reportId);
}

// ============================================
// PROMPT BUILDERS
// ============================================
function buildReportBrief(input: ReportInput, plan: TierType): string {
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

  const reportLang = input.reportLanguage || 'fr';
  const langName = LANGUAGE_CONFIG[reportLang]?.name || 'Français';

  // Build context lines conditionally (skip empty optional fields to save tokens)
  const contextLines: string[] = [
    `ENTREPRISE: ${input.businessName}`,
    input.website ? `Site web: ${input.website}` : '',
    `Secteur: ${input.sector}${input.sectorDetails ? ` (${input.sectorDetails})` : ''}`,
    `Localisation: ${input.location?.city}, ${input.location?.country}`,
    `Cible: ${input.targetCustomers?.type} - ${input.targetCustomers?.persona}`,
    input.businessMaturity ? `Maturité: ${maturityLabels[input.businessMaturity] || input.businessMaturity}` : '',
    input.annualRevenue ? `CA annuel: ${input.annualRevenue}€` : '',
    input.teamSize ? `Équipe: ${input.teamSize}` : '',
  ].filter(Boolean);

  const offerLines: string[] = [
    input.whatYouSell,
    input.uniqueValueProposition ? `USP: "${input.uniqueValueProposition}"` : '',
    `Prix: ${input.priceRange?.min}€ - ${input.priceRange?.max}€`,
    input.businessModel ? `Modèle: ${modelLabels[input.businessModel] || input.businessModel}` : '',
    input.grossMargin ? `Marge brute: ${input.grossMargin}%` : '',
    input.differentiators?.length > 0 ? `Points forts: ${input.differentiators.join(", ")}` : '',
    input.acquisitionChannels?.length > 0 ? `Canaux: ${input.acquisitionChannels.join(", ")}` : '',
  ].filter(Boolean);

  const objectiveLines: string[] = [
    `Objectifs: ${input.goalPriorities?.join(" > ") || input.goals?.join(", ") || "Analyse complète"}`,
    input.successMetrics ? `Métriques: ${input.successMetrics}` : '',
  ].filter(Boolean);

  const constraintLines: string[] = [
    input.budgetLevel ? `Budget: ${input.budgetLevel}` : '',
    input.timeline ? `Timeline: ${input.timeline}` : '',
    input.tonePreference ? `Ton: ${input.tonePreference}` : '',
    input.notes ? `Notes: ${input.notes}` : '',
  ].filter(Boolean);

  return `BRIEF CLIENT - BENCHMARK CONCURRENTIEL
LANGUE: ${langName.toUpperCase()}

<business>
${contextLines.join("\n")}
</business>

<offer>
${offerLines.join("\n")}
</offer>

<competitors count="${input.competitors?.length || 0}">
${competitorsList}${input.competitorAdvantage ? `\nFaiblesses vs concurrents: ${input.competitorAdvantage}` : ''}
</competitors>

<objectives>
${objectiveLines.join("\n")}
</objectives>${constraintLines.length > 0 ? `

<constraints>
${constraintLines.join("\n")}
</constraints>` : ''}`;
}

function buildUserPrompt(input: ReportInput, plan: TierType): string {
  return `${buildReportBrief(input, plan)}${getJsonSchema(plan)}`;
}

function getJsonSchema(plan: TierType): string {
  if (plan === "agency") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "agency", "sources_count": number },

  "executive_summary": {
    "one_page_summary": "string (synthèse dense, style consulting institutionnel)",
    "situation_actuelle": "string",
    "opportunite_principale": "string",
    "strategic_recommendation": "string (recommandation principale en 2-3 phrases)",
    "investment_required": "string (ex: 300 000 - 400 000 €)",
    "expected_roi": "string (ex: 24-36 mois)",
    "key_profitability_indicators": [{ "indicator": "string", "value": "string" }],
    "critical_success_factors": ["string"],
    "key_metrics_to_track": ["string"],
    "urgency_assessment": { "level": "Critique/Élevé/Modéré", "rationale": "string", "window_of_opportunity": "string" }
  },

  "methodology": {
    "scope": "Zone géographique et périmètre exact",
    "period": "Période d'analyse (ex: données 2024-2026)",
    "segments_analyzed": ["string"],
    "primary_sources": ["string"],
    "secondary_sources": ["string"],
    "evaluation_criteria": [{ "dimension": "string", "weight_conservative": "string %", "weight_balanced": "string %", "weight_performance": "string %" }],
    "limitations": ["string"]
  },

  "market_overview_detailed": {
    "key_metrics": [{ "indicator": "string", "value": "string avec unité", "source": "string" }],
    "market_structure": {
      "overview": "string",
      "leaders": [{ "name": "string", "detail": "string" }],
      "independents_share": "string"
    },
    "market_segments": [{ "segment": "string", "price_avg": "string", "margin": "string", "examples": "string" }],
    "sources": "string"
  },

  "territory_analysis": {
    "location_name": "string",
    "demographics": [{ "indicator": "string", "value": "string" }],
    "real_estate": [{ "indicator": "string", "value": "string" }],
    "commercial_hubs": [{ "name": "string", "description": "string", "priority": "high/medium/low" }],
    "local_competitors": [{ "name": "string", "rating": "string", "specialty": "string" }],
    "opportunities": ["string"],
    "sources": "string"
  },

  "market_analysis": {
    "market_sizing": { "total_addressable_market": "string avec €", "serviceable_addressable_market": "string avec €", "serviceable_obtainable_market": "string avec €", "methodology": "string" },
    "market_dynamics": { "growth_rate": "string %", "maturity_stage": "string", "key_drivers": ["string"], "headwinds": ["string"], "inflection_points": ["string"] },
    "pestel_analysis": { "political": ["string"], "economic": ["string"], "social": ["string"], "technological": ["string"], "environmental": ["string"], "legal": ["string"] },
    "porter_five_forces": { "competitive_rivalry": { "score": 1-10, "analysis": "string" }, "supplier_power": { "score": 1-10, "analysis": "string" }, "buyer_power": { "score": 1-10, "analysis": "string" }, "threat_of_substitution": { "score": 1-10, "analysis": "string" }, "threat_of_new_entry": { "score": 1-10, "analysis": "string" }, "overall_attractiveness": "string", "strategic_implications": "string" }
  },

  "competitive_intelligence": {
    "competition_landscape_overview": "string",
    "competitors_deep_dive": [{ "name": "string", "profile": { "size": "string", "growth_trajectory": "string" }, "positioning": { "value_prop": "string", "target_segment": "string" }, "offering": { "products_services": ["string"], "pricing_model": "string" }, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible", "opportunities_vs_them": "string" }],
    "competitive_positioning_maps": { "primary_map": { "x_axis": "Prix", "y_axis": "Qualité Perçue", "competitors_plotted": [{ "name": "string", "x": 1-10, "y": 1-10 }], "your_current_position": { "x": 1-10, "y": 1-10 }, "recommended_position": { "x": 1-10, "y": 1-10 }, "rationale": "string" } },
    "unmet_customer_needs": [{ "need": "string", "evidence": "string", "how_to_address": "string" }]
  },

  "scoring_matrix": {
    "criteria": ["string"],
    "competitors": [{ "name": "string", "scores": { "critere1": 1-10, "critere2": 1-10 }, "total": number }],
    "sensitivity_analysis": [{ "model": "Conservateur/Équilibré/Performance", "rankings": ["1er", "2ème", "3ème"] }],
    "interpretation": "string"
  },

  "trends_analysis": {
    "period": "string (ex: 2025-2026)",
    "categories": [{ "category": "string", "icon": "product/service/consumer/watch", "trends": ["string"] }],
    "key_insights": ["string"]
  },

  "swot_analysis": { "strengths": ["string"], "weaknesses": ["string"], "opportunities": ["string"], "threats": ["string"], "strategic_priorities": "string" },

  "customer_intelligence": { "segments_analyzed": [{ "segment_name": "string", "size_estimate": "string", "pain_points": ["string"], "decision_criteria": ["string"], "willingness_to_pay": "string", "acquisition_cost_estimate": "string en €", "lifetime_value_estimate": "string en €", "priority": "1/2/3" }], "voice_of_customer": { "common_complaints": ["string"], "desired_features": ["string"], "switching_barriers": ["string"] } },

  "strategic_recommendations": { "recommended_strategy": { "strategic_archetype": "string", "rationale": "string" }, "positioning_strategy": { "target_segment_primary": "string", "value_proposition": "string", "positioning_statement": "string", "reasons_to_believe": ["string"] }, "brand_strategy": { "brand_essence": "string", "brand_personality": ["string"], "brand_voice_description": "string", "tagline_options": ["string"], "messaging_hierarchy": { "primary_message": "string", "supporting_messages": ["string"] } }, "product_strategy": { "core_offering_recommendation": "string", "tiering_strategy": [{ "tier_name": "string", "target_segment": "string", "key_features": ["string"], "pricing_range": "string en €" }], "product_roadmap_priorities": [{ "feature_initiative": "string", "priority": "P0/P1/P2", "expected_impact": "string" }] }, "pricing_strategy": { "pricing_model_recommendation": "string", "price_optimization_by_tier": [{ "tier": "string", "recommended_price": "string en €", "rationale": "string" }], "upsell_cross_sell_opportunities": ["string"] }, "go_to_market_strategy": { "customer_acquisition": { "primary_channels_detailed": [{ "channel": "string", "rationale": "string", "investment_level": "string en €", "expected_cac": "string en €", "tactics": ["string"] }], "content_marketing_strategy": { "strategic_themes": ["string"], "content_formats_prioritized": ["string"] }, "partnership_opportunities_detailed": [{ "partner_type": "string", "examples": ["string"] }] }, "sales_strategy": { "sales_model": "string", "sales_process_recommendation": "string" } } },

  "financial_projections": {
    "investment_required": { "total_12_months": number, "breakdown": [{ "category": "string", "amount": number, "rationale": "string" }] },
    "revenue_scenarios": { "conservative": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "baseline": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] }, "optimistic": { "year_1": number, "year_2": number, "year_3": number, "assumptions": ["string"] } },
    "unit_economics": { "customer_acquisition_cost": number, "lifetime_value": number, "ltv_cac_ratio": number, "payback_period_months": number, "gross_margin_percent": number, "comparison_to_benchmarks": "string" }
  },

  "detailed_roadmap": {
    "phases": [{
      "phase": "string (J1-J30/J31-J60/J61-J90)",
      "timeline": "string",
      "title": "string",
      "tasks": ["string"],
      "kpis": ["string"]
    }],
    "kpi_targets": [{ "indicator": "string", "target_m6": "string", "target_m12": "string" }],
    "budget_breakdown": [{ "category": "string", "amount": "string" }],
    "total_budget": "string (ex: 230 000 - 485 000 €)",
    "recommended_equity": "string"
  },

  "implementation_roadmap": { "phase_1_foundation": { "timeline": "Mois 1-3", "objectives": ["string"], "key_initiatives": [{ "initiative": "string", "owner_role": "string", "budget_estimate": "string en €", "success_metrics": ["string"], "milestones": ["string"] }] }, "phase_2_growth": { "timeline": "Mois 4-6", "objectives": ["string"], "key_initiatives": ["..."] }, "phase_3_scale": { "timeline": "Mois 7-12", "objectives": ["string"], "key_initiatives": ["..."] } },

  "risk_register": [{ "risk": "string", "impact": "Élevé/Moyen/Faible", "probability": "Élevé/Moyen/Faible", "mitigation": "string", "contingency": "string" }],

  "multi_market_comparison": { "markets": [{ "market": "string", "why_selected": "string", "key_differences": ["string"], "opportunity_score": "1-10" }], "recommendation": "string" },

  "appendices": {
    "glossary": [{ "term": "string", "definition": "string" }],
    "sources_by_category": [{ "category": "string", "sources": ["string"] }],
    "assumptions": [{ "assumption": "string", "validation_plan": "string" }],
    "unknowns": [{ "item": "string", "how_to_find": "string" }],
    "validation_plan": ["string"]
  },

  "assumptions_and_limitations": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport AGENCY-GRADE INSTITUTIONNEL complet. Sois EXHAUSTIF et SPÉCIFIQUE. RETOURNE UNIQUEMENT LE JSON.`;
  }

  if (plan === "pro") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "pro", "sources_count": number },
  "executive_summary": { "headline": "string - accroche impactante", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string - 3-5 points clés actionnables"], "urgency_level": "Critique/Élevé/Modéré", "urgency_rationale": "string", "market_size_estimate": "string avec €", "growth_rate": "string %" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "string", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "Facile/Moyen/Difficile", "value_potential": "Élevé/Moyen/Faible", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "market_intelligence": { "sector_trends_2026": [{ "trend": "string", "impact_on_you": "string", "how_to_leverage": "string action concrète" }], "local_market_data": { "market_maturity": "string", "key_players_count": "string", "market_size_estimate": "string avec €", "growth_rate": "string %", "insights": ["string"] } },
  "competitive_landscape": { "competition_intensity": "Élevée/Moyenne/Faible", "competitors_analyzed": [{ "name": "string", "website": "string", "type": "Direct/Indirect/Substitut", "positioning": "string", "pricing_found": "string en €", "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "Facile/Moyen/Difficile", "impact": "Élevé/Moyen/Faible", "description": "string" }] },
  "competitive_intelligence": { "deep_competitor_profiles": [{ "name": "string", "positioning": "string", "digital_presence_score": 1-10, "strengths": ["string"], "weaknesses": ["string"], "threat_level": "Élevé/Moyen/Faible" }], "competitive_matrix": { "axes": { "x_axis": "Prix", "y_axis": "Qualité Perçue" }, "positions": [{ "competitor": "string", "x": 1-10, "y": 1-10 }] }, "white_spaces": ["string"] },
  "customer_insights": { "pain_points_identified": [{ "pain_point": "string", "evidence": "string", "opportunity": "string" }], "unmet_needs": ["string"], "switching_barriers": ["string"], "decision_criteria": ["string par ordre d'importance"] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string - 3 options"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"], "differentiation_score": { "current": 1-10, "potential": 1-10, "gap_to_close": "string" } },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string en €", "mid_tier": "string en €", "premium_tier": "string en €" }, "competitor_pricing_table": [{ "competitor": "string", "offer": "string", "price": "string en €" }], "recommended_pricing": [{ "package_name": "string", "suggested_price": "string en €", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string"], "upsell_opportunities": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string", "expected_cac": "string en €", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_gaps": ["string"], "content_formats": ["string"], "thought_leadership_opportunities": ["string"] }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string commençant par verbe", "owner": "string rôle", "outcome": "string" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }], "quick_wins_with_proof": [{ "action": "string", "why_now": "string", "expected_impact": "string chiffré" }] },
  "financial_projections_basic": { "revenue_range": "string en €", "assumptions": ["string"], "kpi_targets": ["string"] },
  "multi_location_comparison": { "markets": [{ "market": "string", "key_differences": ["string"], "opportunity_score": "1-10" }], "recommended_market": "string", "rationale": "string" },
  "risks_and_considerations": { "market_risks": ["string"], "competitive_threats": ["string"], "regulatory_considerations": ["string"] },
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport PREMIUM complet. Sois EXHAUSTIF et SPÉCIFIQUE. RETOURNE UNIQUEMENT LE JSON.`;
  }

  // Standard tier
  return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "standard", "sources_count": number },
  "executive_summary": { "headline": "string - accroche impactante max 15 mots", "situation_actuelle": "string", "opportunite_principale": "string", "key_findings": ["string - 3-5 points clés"], "urgency_level": "Critique/Élevé/Modéré", "urgency_rationale": "string" },
  "market_context": { "sector_overview": "string", "local_market_specifics": "string", "market_maturity": "Émergent/En croissance/Mature/Saturé", "target_segments": [{ "segment_name": "string", "size_estimate": "string", "accessibility": "Facile/Moyen/Difficile", "value_potential": "Élevé/Moyen/Faible", "why_relevant": "string" }], "key_trends_impacting": ["string"] },
  "competitive_landscape": { "competition_intensity": "Élevée/Moyenne/Faible", "competitors_analyzed": [{ "name": "string", "type": "Direct/Indirect/Substitut", "positioning": "string", "strengths": ["string max 3"], "weaknesses": ["string max 3"], "price_range": "string en €", "differentiation": "string", "threat_level": "Élevé/Moyen/Faible" }], "competitive_gaps": ["string"], "your_current_position": "string", "differentiation_opportunities": [{ "angle": "string", "feasibility": "Facile/Moyen/Difficile", "impact": "Élevé/Moyen/Faible", "description": "string" }] },
  "positioning_recommendations": { "recommended_positioning": "string", "rationale": "string", "target_audience_primary": "string", "value_proposition": "string", "tagline_suggestions": ["string - 3 options"], "key_messages": ["string"], "messaging_dos": ["string"], "messaging_donts": ["string"] },
  "pricing_strategy": { "current_assessment": "string", "market_benchmarks": { "budget_tier": "string en €", "mid_tier": "string en €", "premium_tier": "string en €" }, "recommended_pricing": [{ "package_name": "string", "suggested_price": "string en €", "what_includes": ["string"], "rationale": "string" }], "quick_wins": ["string"] },
  "go_to_market": { "priority_channels": [{ "channel": "string", "priority": "1/2/3", "why": "string", "first_action": "string action concrète", "expected_cac": "string", "expected_timeline": "string" }], "content_strategy": { "topics_to_own": ["string"], "content_formats": ["string"], "distribution_approach": "string" }, "partnership_opportunities": ["string"] },
  "action_plan": { "now_7_days": [{ "action": "string commençant par verbe d'action", "owner": "string", "outcome": "string résultat attendu" }], "days_8_30": [{ "action": "string", "owner": "string", "outcome": "string" }], "days_31_90": [{ "action": "string", "owner": "string", "outcome": "string" }] },
  "financial_projections_basic": { "revenue_range": "string en €", "assumptions": ["string"], "kpi_targets": ["string"] },
  "multi_location_comparison": { "markets": [{ "market": "string", "key_differences": ["string"], "opportunity_score": "1-10" }], "recommended_market": "string", "rationale": "string" },
  "risks_and_considerations": [{ "risk": "string", "impact": "Élevé/Moyen/Faible", "mitigation": "string" }],
  "assumptions_and_limitations": ["string"],
  "next_steps_to_validate": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport de benchmark complet. Sois SPÉCIFIQUE au secteur et à la localisation. RETOURNE UNIQUEMENT LE JSON.`;
}

// ============================================
// SECTION GENERATION
// ============================================
function estimateMaxTokens(sectionKey: string, tierMaxTokens: number): number {
  // Large sections that need more room
  const largeSections = new Set([
    'competitive_intelligence', 'strategic_recommendations', 'market_analysis',
    'financial_projections', 'executive_summary', 'competitive_landscape',
    'market_overview_detailed', 'customer_intelligence', 'detailed_roadmap',
    'implementation_roadmap', 'territory_analysis', 'methodology',
  ]);
  // Medium sections
  const mediumSections = new Set([
    'market_context', 'market_intelligence', 'scoring_matrix', 'trends_analysis',
    'swot_analysis', 'positioning_recommendations', 'pricing_strategy',
    'go_to_market', 'action_plan', 'customer_insights', 'multi_market_comparison',
    'multi_location_comparison', 'risk_register', 'appendices',
  ]);

  let estimate: number;
  if (largeSections.has(sectionKey)) {
    estimate = Math.min(tierMaxTokens, 16000);
  } else if (mediumSections.has(sectionKey)) {
    estimate = Math.min(tierMaxTokens, 8000);
  } else {
    estimate = Math.min(tierMaxTokens, 4000);
  }

  return Math.max(3000, estimate);
}

function buildSectionPrompt(
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): string {
  const expandNote = existingSection
    ? `OBJECTIF: ENRICHIR et APPROFONDIR la section existante. Ajouter des détails, des chiffres, des exemples concrets. Ne supprimer aucune information existante.`
    : `OBJECTIF: Générer la section complète avec un niveau de détail INSTITUTIONNEL.`;

  const existingJson = existingSection
    ? `\nSECTION_EXISTANTE_JSON:\n${JSON.stringify({ [section.key]: existingSection })}\n`
    : "";

  return `
${reportBrief}

<section_instructions>
SECTION À PRODUIRE: ${section.label} (clé JSON: "${section.key}")
${expandNote}

QUALITÉ ATTENDUE:
- Sois EXHAUSTIF: couvre chaque dimension en profondeur.
- Sois SPÉCIFIQUE: chaque insight doit être contextualisé au secteur et à la localisation du client.
- Sois QUANTIFIÉ: fourchettes de prix, pourcentages, scores, ordres de grandeur.
- Sois HONNÊTE: si une donnée est incertaine, dis-le. "Estimation" ou "non disponible" - jamais inventer.
- Sois ACTIONNABLE: chaque recommandation = action concrète + résultat attendu.

FORMAT: Retourne UNIQUEMENT un JSON valide avec UNE SEULE clé racine: "${section.key}".
</section_instructions>
${existingJson}`.trim();
}

async function repairSectionJson(
  apiKey: string,
  section: SectionPlanItem,
  brokenJson: string
): Promise<unknown> {
  const systemPrompt = `Tu es un assistant de correction JSON.
Objectif: retourner un JSON STRICTEMENT VALIDE.
Contraintes:
- Retourne UNIQUEMENT du JSON, sans backticks, sans texte.
- Le JSON DOIT contenir UNE SEULE clé racine: "${section.key}".
- Si une valeur est inconnue: utilise "non disponible".
- Conserve au maximum les champs existants.`;

  const truncatedBroken = brokenJson.length > 8000 ? brokenJson.substring(0, 8000) + "\n...(tronqué)" : brokenJson;
  const userPrompt = `JSON À RÉPARER:\n${truncatedBroken}\n\nRÉPARE ET RETOURNE UNIQUEMENT LE JSON VALIDE.`;

  const repairTokens = Math.max(2000, Math.min(8000, Math.ceil(brokenJson.length / 3)));

  const content = await callGPT52(
    apiKey,
    systemPrompt,
    userPrompt,
    repairTokens,
    0.1
  );

  return safeJsonParse(content);
}

/**
 * Checks if a JSON string appears truncated (unbalanced braces/brackets).
 */
function isJsonTruncated(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar !== '}' && lastChar !== ']') return true;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
  }
  return depth !== 0;
}

async function generateSection(
  apiKey: string,
  systemPrompt: string,
  tierConfig: typeof TIER_CONFIG[TierType],
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): Promise<unknown> {
  const userPrompt = buildSectionPrompt(reportBrief, section, existingSection);
  const maxTokens = estimateMaxTokens(section.key, tierConfig.max_tokens);

  let content: string;
  try {
    console.log(`[Section] Calling GPT-5.2 for section: ${section.key} (${maxTokens} max tokens, prompt: ${userPrompt.length} chars)...`);
    // Use json_object format to guarantee valid JSON output - NO repair loop needed
    content = await callGPT52(
      apiKey,
      systemPrompt,
      userPrompt,
      maxTokens,
      tierConfig.temperature,
      undefined, // use default json_object format
      2 // max 2 retries for network errors only
    );
    console.log(`[Section] GPT-5.2 responded for ${section.key}: ${content.length} chars`);
  } catch (apiError) {
    console.error(`[Section] GPT-5.2 API call FAILED for ${section.key}:`, apiError instanceof Error ? apiError.message : apiError);
    return { [section.key]: section.valueType === 'array' ? [] : {} };
  }

  try {
    return safeJsonParse(content);
  } catch {
    // json_object mode should prevent this, but fallback gracefully
    console.warn(`[Section] JSON parse failed for ${section.key}. Using empty fallback.`);
    return { [section.key]: section.valueType === 'array' ? [] : {} };
  }
}

function normalizeSources(value: unknown): Array<{ title: string; url: string }> {
  if (!Array.isArray(value)) return [];

  const normalized: Array<{ title: string; url: string }> = [];

  for (const item of value) {
    if (!item) continue;
    if (typeof item === 'string') {
      const urlMatch = item.match(/https?:\/\/\S+/);
      const url = urlMatch?.[0] || "";
      const title = item.replace(url, "").trim() || url || "Source";
      normalized.push({ title, url });
      continue;
    }
    if (typeof item === 'object') {
      const anyItem = item as any;
      const title = typeof anyItem.title === 'string' ? anyItem.title : 'Source';
      const url = typeof anyItem.url === 'string' ? anyItem.url : '';
      normalized.push({ title, url });
    }
  }
  return normalized;
}

function mergeSources(
  primary: Array<{ title: string; url: string }>,
  secondary: Array<{ title: string; url: string }>
): Array<{ title: string; url: string }> {
  const map = new Map<string, { title: string; url: string }>();
  for (const s of [...primary, ...secondary]) {
    const key = s.url || s.title;
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
}

function buildUserSources(input: ReportInput): Array<{ title: string; url: string }> {
  const sources: Array<{ title: string; url: string }> = [];
  if (input.website) {
    sources.push({ title: input.businessName, url: input.website });
  }
  for (const c of input.competitors || []) {
    if (c.url) sources.push({ title: c.name, url: c.url });
  }
  return sources;
}

// ============================================
// GPT-5.2 API CALL WITH RETRY LOGIC
// ============================================
async function callGPT52(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number,
  textFormat?: {
    type: "json_schema";
    name: string;
    schema: Record<string, unknown>;
    strict: boolean;
  },
  maxRetries: number = 3
): Promise<string> {
  console.log(`[Analysis] Processing with ${maxTokens} max tokens (GPT-5.2)`);
  console.log(`[Analysis] Prompt length: ${userPrompt.length} chars`);

  const effectiveMaxTokens = maxTokens;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const timeoutMs = 600000; // 10 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Analysis] Request timeout after ${timeoutMs / 1000}s (attempt ${attempt})`);
      controller.abort();
    }, timeoutMs);

    try {
      console.log(`[Analysis] >>> Calling OpenAI /v1/responses (attempt ${attempt}/${maxRetries})...`);
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          input: [
            {
              role: "developer",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          temperature: temperature,
          max_output_tokens: effectiveMaxTokens,
          text: textFormat
            ? {
              format: {
                type: "json_schema",
                name: textFormat.name,
                strict: textFormat.strict,
                schema: textFormat.schema,
              },
            }
            : {
              format: {
                type: "json_object",
              },
            },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Analysis] API error ${response.status} (attempt ${attempt}):`, errorText);

        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt - 1) * 60000;
          console.log(`[Analysis] Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Rate limit exceeded after all retries.");
          break;
        }

        if (response.status === 503) {
          const waitTime = Math.pow(2, attempt - 1) * 30000;
          console.log(`[Analysis] Service unavailable. Waiting ${waitTime / 1000}s...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Service unavailable after all retries.");
          break;
        }

        if (response.status >= 500) {
          const waitTime = Math.pow(2, attempt - 1) * 30000;
          console.log(`[Analysis] Server error ${response.status}. Waiting ${waitTime / 1000}s...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error(`Service error (${response.status}) after all retries`);
          break;
        }

        if (response.status === 401) throw new Error("Invalid API configuration");
        if (response.status === 400) throw new Error(`Bad request (400): ${errorText.substring(0, 300)}`);
        throw new Error(`Service error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Analysis] Response received from GPT-5.2`);

      const content = extractTextFromResponse(data);

      if (!content) {
        throw new Error("No content in GPT-5.2 response: " + JSON.stringify(data).substring(0, 200));
      }

      console.log(`[Analysis] Content length: ${content.length} chars`);
      return content;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error("Request timed out after 10 minutes");
        if (attempt < maxRetries) {
          console.log(`[Analysis] Timeout. Retrying ${attempt}/${maxRetries}...`);
          continue;
        }
        break;
      }

      lastError = error as Error;
      break;
    }
  }

  throw lastError || new Error("Analysis failed after all retries");
}

// ============================================
// ASYNC GENERATION FUNCTION (runs in background)
// ============================================
async function runGenerationAsync(
  reportId: string,
  inputData: ReportInput,
  plan: TierType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
) {
  try {
    // @ts-ignore - Deno runtime
    const GPT52_API_KEY = Deno.env.get("OPEN_AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!GPT52_API_KEY) {
      throw new Error("OPEN_AI_API_KEY (or OPENAI_API_KEY) is not configured (required for GPT-5.2)");
    }

    let reportLang = inputData.reportLanguage || 'fr';

    if (!LANGUAGE_CONFIG[reportLang]) {
      console.warn(`[${reportId}] Unsupported language: ${reportLang}, defaulting to French`);
      reportLang = 'fr';
      inputData.reportLanguage = 'fr';
    }

    console.log(`[${reportId}] Starting report generation`);
    console.log(`[${reportId}] Tier: ${plan} | Model: GPT-5.2 | Language: ${reportLang}`);

    // Reset status to processing (handles retry from failed state)
    await supabaseAdmin
      .from('reports')
      .update({
        status: 'processing',
        processing_step: 'Démarrage de la génération...',
        processing_progress: 5,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', reportId);

    // Step 1: Build report brief (GPT-5.2 uses its own knowledge - no external research)
    await updateProgress(supabaseAdmin, reportId, "Analyse du brief client...", 10);
    const reportBrief = buildReportBrief(inputData, plan);
    const tierConfig = TIER_CONFIG[plan];
    const sectionSystemPrompt = tierConfig.section_system_prompt(reportLang);

    console.log(`[${reportId}] Brief: ${reportBrief.length} chars`);
    console.log(`[${reportId}] Section system prompt: ${sectionSystemPrompt.length} chars`);

    // Step 2: Generate sections one by one
    await updateProgress(supabaseAdmin, reportId, "Génération des sections...", 15);
    const sections = tierConfig.section_plan as SectionPlanItem[];
    const outputSections: Record<string, unknown> = {};
    let sectionFailures = 0;

    const startProgress = 15;
    const endProgress = 90;
    const progressStep = Math.max(1, Math.floor((endProgress - startProgress) / Math.max(sections.length, 1)));

    console.log(`[${reportId}] Starting ${sections.length} section generation (batched parallel)...`);

    // Process sections in parallel batches of 3 for much faster generation
    const BATCH_SIZE = 3;
    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      const batch = sections.slice(i, i + BATCH_SIZE);
      const batchLabels = batch.map(s => s.label).join(', ');
      const stepProgress = startProgress + (i * progressStep);

      await updateProgress(supabaseAdmin, reportId, `Sections: ${batchLabels}...`, Math.min(stepProgress, endProgress));

      const batchResults = await Promise.allSettled(
        batch.map(section =>
          generateSection(
            GPT52_API_KEY,
            sectionSystemPrompt,
            tierConfig,
            reportBrief,
            section
          )
        )
      );

      for (let j = 0; j < batch.length; j++) {
        const section = batch[j];
        const result = batchResults[j];

        if (result.status === 'fulfilled' && result.value && typeof result.value === 'object' && (section.key in (result.value as Record<string, unknown>))) {
          outputSections[section.key] = (result.value as Record<string, unknown>)[section.key];
        } else {
          if (result.status === 'rejected') {
            console.error(`[${reportId}] Section ${section.key} crashed:`, result.reason);
          }
          outputSections[section.key] = section.valueType === 'array' ? [] : {};
          sectionFailures++;
        }
      }
    }

    console.log(`[${reportId}] Section generation done. Failures: ${sectionFailures}/${sections.length}`);

    // If ALL sections failed, the API is unreachable - abort
    if (sectionFailures >= sections.length) {
      throw new Error(`All ${sections.length} sections failed to generate. GPT-5.2 API may be unreachable or misconfigured.`);
    }

    // Step 3: Assemble report metadata + normalize sources
    const userSources = buildUserSources(inputData);
    const modelSources = normalizeSources(outputSections.sources);
    const mergedSources = mergeSources(modelSources, userSources);

    outputSections.sources = mergedSources;

    let outputData: Record<string, unknown> = {
      report_metadata: {
        title: `Rapport ${plan} - ${inputData.businessName}`,
        generated_date: new Date().toISOString().split('T')[0],
        business_name: inputData.businessName,
        sector: inputData.sector,
        location: `${inputData.location?.city}, ${inputData.location?.country}`,
        tier: plan,
        sources_count: mergedSources.length,
        word_count: countWordsInObject(outputSections),
      },
      ...outputSections,
    };

    // Validate against tier-specific schema
    const schema = REPORT_SCHEMAS[plan];
    const validationResult = schema.safeParse(outputData);
    if (!validationResult.success) {
      console.warn(`[${reportId}] Schema validation failed for ${plan} tier:`, validationResult.error.errors);
      console.log(`[${reportId}] Proceeding with unvalidated data`);
    } else {
      outputData = validationResult.data as Record<string, unknown>;
    }

    // Step 4: Update report with output
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
    console.log(`[${reportId}] Tier: ${plan} | Word count: ${countWordsInObject(outputSections)} | Sources: ${mergedSources.length}`);

    // Step 5: Generate PDF
    await updateProgress(supabaseAdmin, reportId, "Génération du PDF...", 95);

    // @ts-ignore - Deno runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore - Deno runtime
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
    };

    try {
      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reportId }),
      });

      if (pdfResponse?.ok) {
        reportLog(reportId, 'SUCCESS', 'Document Generation', 'PDF generated successfully');
      } else {
        reportLog(reportId, 'WARN', 'Document Generation', `PDF generation returned: ${pdfResponse?.status}`);
      }
    } catch (pdfErr) {
      console.error(`[${reportId}] PDF generation failed:`, pdfErr);
      reportLog(reportId, 'WARN', 'Document Generation', `PDF generation error: ${pdfErr instanceof Error ? pdfErr.message : 'unknown'}`);
    }

    // Final update
    await supabaseAdmin
      .from("reports")
      .update({
        processing_step: "Rapport prêt",
        processing_progress: 100,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>)
      .eq("id", reportId);

    reportLog(reportId, 'SUCCESS', 'Report Generation', `Report generated for ${plan} tier`);

  } catch (error: unknown) {
    console.error(`[${reportId}] Generation error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    try {
      await supabaseAdmin.from("reports").update({
        status: "failed",
        processing_step: `Erreur: ${errorMessage}`,
        processing_progress: 0
      } as Record<string, unknown>).eq("id", reportId);
    } catch { /* ignore */ }
  }
}

// ============================================
// MAIN HANDLER - Returns immediately, runs generation async
// ============================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // @ts-ignore - Deno runtime
  const supabaseAdmin = createClient(
    // @ts-ignore - Deno runtime
    Deno.env.get("SUPABASE_URL") ?? "",
    // @ts-ignore - Deno runtime
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const reportId = body.reportId;

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    const authContext = await getAuthContext(req, supabaseClient);
    if (authContext.authType === 'none') {
      throw new Error(authContext.error || "Not authenticated");
    }

    console.log(`[${reportId}] Authenticated: ${authContext.authType}${authContext.userId ? ` (${authContext.userId})` : ''}`);

    // Get the report
    const reportQuery = supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId);

    const { data: report, error: fetchError } = authContext.authType === 'user'
      ? await reportQuery.eq("user_id", authContext.userId).single()
      : await reportQuery.single();

    if (fetchError || !report) {
      console.error(`[${reportId}] Report not found or unauthorized:`, fetchError);
      throw new Error("Report not found or access denied");
    }

    const forbiddenStatuses = new Set(["draft", "abandoned"]);

    if (forbiddenStatuses.has(String(report.status))) {
      throw new Error("Report not eligible for generation");
    }

     // Check if already processing or ready
     if (report.status === "processing") {
       const canForceStart = authContext.authType === 'service_role' && (report.processing_progress ?? 0) <= 5;

       const updatedAtMs = (() => {
         const raw = (report as any)?.updated_at;
         const d = raw ? new Date(raw) : null;
         const t = d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
         return t;
       })();
       const STALE_MS = 12 * 60 * 1000; // 12 minutes
       const isStale = updatedAtMs > 0 ? (Date.now() - updatedAtMs) > STALE_MS : false;

       if (!canForceStart && !isStale) {
         return new Response(JSON.stringify({ success: true, message: "Report already processing", reportId }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
           status: 200,
         });
       }

       if (isStale) {
         console.warn(`[${reportId}] Processing appears stale (updated_at too old). Allowing restart.`);
       }
     }

    if (report.status === "ready") {
      return new Response(JSON.stringify({ success: true, message: "Report already ready", reportId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update status to processing immediately
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

    // Security: ensure only paid/processing/ready/failed can run
    if (authContext.authType === 'user' && !["paid", "processing", "ready", "failed"].includes(String(report.status))) {
      throw new Error("Report not eligible for generation");
    }

    // Validate plan
    if (!TIER_CONFIG[plan]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Start generation in background (don't await)
    const generationPromise = runGenerationAsync(reportId, inputData, plan, supabaseAdmin);

    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(generationPromise);
    } else {
      generationPromise.catch(err => console.error("Background generation error:", err));
    }

    // Return immediately
    return new Response(JSON.stringify({ success: true, message: "Generation started", reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    console.error("Generate report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
