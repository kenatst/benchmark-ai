// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
// @ts-ignore - Deno import
import { z } from "https://esm.sh/zod@3.23.8";

// FORCE REDEPLOY: 2026-02-06 - Fix JSON bloat, reduce max_tokens, remove repair loops, compact prompts
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
    max_tokens: 4000,
    temperature: 0.3,
    section_plan: SECTION_PLANS.standard,
    section_system_prompt: (lang: string) => `Consultant stratégique senior. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Produis UNE section de benchmark concurrentiel en JSON valide.
Règles: spécifique au secteur/localisation, quantifié, actionnable, concis.
Donnée inconnue = "non disponible". Jamais inventer. JSON UNIQUEMENT.`,
    system_prompt: (lang: string) => `Consultant stratégique senior. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Benchmark concurrentiel de calibre professionnel. Spécifique, quantifié, actionnable.
Phrases courtes. Données incertaines = "estimation". Inconnues = "non disponible".
JSON VALIDE UNIQUEMENT.`,
  },

  pro: {
    max_tokens: 4000,
    temperature: 0.25,
    section_plan: SECTION_PLANS.pro,
    section_system_prompt: (lang: string) => `Consultant stratégique tier-1. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Produis UNE section d'intelligence compétitive premium en JSON valide.
Règles: profils concurrents détaillés, scoring 1-10, white spaces, quantifié.
Donnée inconnue = "non disponible". Jamais inventer. JSON UNIQUEMENT.`,
    system_prompt: (lang: string) => `Consultant stratégique tier-1. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Rapport d'intelligence compétitive premium. Profils détaillés, scoring, white spaces.
Quantifié, factuel, actionnable. Inconnues = "non disponible".
JSON VALIDE UNIQUEMENT.`,
  },

  agency: {
    max_tokens: 5000,
    temperature: 0.2,
    section_plan: SECTION_PLANS.agency,
    section_system_prompt: (lang: string) => `Senior Partner conseil stratégique. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Produis UNE section d'un rapport institutionnel en JSON valide.
Règles: PESTEL/Porter/SWOT si pertinent, scoring 1-10, 3 scénarios financiers, micro-local.
Valeurs courtes (1-2 phrases max). Inconnues = "non disponible". JSON UNIQUEMENT.`,
    system_prompt: (lang: string) => `Senior Partner conseil stratégique. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.
Rapport d'intelligence stratégique institutionnel. Frameworks (Porter, PESTEL, SWOT).
Scoring, scénarios, unit economics, roadmap. Quantifié, rigoureux.
Inconnues = "non disponible". JSON VALIDE UNIQUEMENT.`,
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

// buildUserPrompt and getJsonSchema removed - section-by-section generation
// uses buildSectionPrompt instead, which is far more token-efficient.

// getJsonSchema removed - was dead code (175+ lines of JSON schemas).
// Section-by-section generation uses buildSectionPrompt instead.

// ============================================
// SECTION GENERATION
// ============================================
function estimateMaxTokens(sectionKey: string, _tierMaxTokens: number): number {
  // Keep sections COMPACT to avoid bloated JSON and truncation.
  // 4000 tokens ~= 3000 words of JSON which is MORE than enough for any section.
  const largeSections = new Set([
    'competitive_intelligence', 'strategic_recommendations', 'market_analysis',
    'financial_projections', 'competitive_landscape', 'market_overview_detailed',
    'customer_intelligence', 'detailed_roadmap', 'implementation_roadmap',
  ]);
  const mediumSections = new Set([
    'market_context', 'market_intelligence', 'scoring_matrix', 'trends_analysis',
    'swot_analysis', 'positioning_recommendations', 'pricing_strategy',
    'go_to_market', 'action_plan', 'customer_insights', 'multi_market_comparison',
    'multi_location_comparison', 'risk_register', 'appendices', 'territory_analysis',
    'methodology',
  ]);

  if (largeSections.has(sectionKey)) return 4000;
  if (mediumSections.has(sectionKey)) return 3000;
  return 2000;
}

function buildSectionPrompt(
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): string {
  const expandNote = existingSection
    ? `ENRICHIR la section existante. Ne rien supprimer.`
    : `Générer la section complète.`;

  const existingJson = existingSection
    ? `\nEXISTANT:\n${JSON.stringify({ [section.key]: existingSection }).substring(0, 3000)}\n`
    : "";

  return `${reportBrief}

<section>
SECTION: ${section.label} ("${section.key}")
${expandNote}

RÈGLES JSON CRITIQUES:
- UNE SEULE clé racine: "${section.key}"
- Valeurs COURTES: max 1-2 phrases par champ string. Pas de paragraphes.
- Arrays: max 3-5 éléments. Pas de listes interminables.
- Si donnée inconnue: "non disponible" (3 mots, pas une explication).
- SPÉCIFIQUE au secteur et localisation du client. Quantifie (prix, %, scores).
- AUCUN texte hors JSON. Retourne UNIQUEMENT le JSON.
</section>${existingJson}`.trim();
}

// repairSectionJson and isJsonTruncated removed - was causing infinite repair
// loops that consumed massive tokens. json_object mode + compact prompts prevent
// truncation. On parse failure, we return empty fallback instead of repair loop.

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
          const waitTime = Math.pow(2, attempt - 1) * 10000;
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
