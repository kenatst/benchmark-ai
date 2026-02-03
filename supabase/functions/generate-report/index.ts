// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
// @ts-ignore - Deno import
import { z } from "https://esm.sh/zod@3.23.8";

// FORCE REDEPLOY: 2026-02-03 14:15 UTC - Token limit fix
// Import shared constants (eliminates CORS header duplication across 10+ functions)
// @ts-ignore - Deno import
import { corsHeaders, getAuthContext } from "../_shared.ts";

// ============================================
// GPT-5.2 MODEL - PRODUCTION ANALYSIS ENGINE
// ============================================
// API calls use GPT-5.2 via OpenAI /v1/responses endpoint
// API key required: OPENAI_API_KEY environment variable

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
// Ensures generated reports conform to expected structure before DB save
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

// Shared fields across all tiers
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

// Standard tier schema - basic report structure
const StandardReportSchema = BaseReportSchema.extend({
  competitive_landscape: z.object({}).passthrough().optional(),
  positioning_strategy: z.object({}).passthrough().optional(),
}).passthrough();

// Pro tier schema - adds strategic analysis
const ProReportSchema = StandardReportSchema.extend({
  market_opportunities: z.object({}).passthrough().optional(),
  go_to_market: z.object({}).passthrough().optional(),
}).passthrough();

// Agency tier schema - most comprehensive
const AgencyReportSchema = ProReportSchema.extend({
  financial_projections: z.object({}).passthrough().optional(),
  risk_analysis: z.object({}).passthrough().optional(),
  implementation_roadmap: z.object({}).passthrough().optional(),
}).passthrough();

// Map tiers to their schemas
const REPORT_SCHEMAS: Record<string, z.ZodSchema> = {
  standard: StandardReportSchema,
  pro: ProReportSchema,
  agency: AgencyReportSchema,
};

// ============================================
// DOCUMENT FORMAT SPECIFICATIONS
// ============================================
// Configuration for institutional-grade PDF, Excel, and PowerPoint generation
const GPT_SKILLS = {
  // PDF Processing skill - comprehensive PDF manipulation
  pdf: {
    trigger: "PDF, .pdf, form, extract, merge, split",
    capabilities: [
      "Extract text and tables from PDF",
      "Create new PDFs with institutional styling",
      "Merge/split documents",
      "Handle forms and annotations"
    ],
    institutionalSpec: {
      colorPalette: {
        primary: "#1a3a5c",     // Deep navy (McKinsey-inspired)
        secondary: "#7c6b9c",   // Muted purple
        accent: "#b89456",      // Gold accent
        success: "#2d7a5a",     // Forest green
        warning: "#b38f40",     // Amber
        danger: "#9a4040",      // Wine red
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
    }
  },

  // Excel Spreadsheet skill - comprehensive .xlsx handling
  xlsx: {
    trigger: "Excel, spreadsheet, .xlsx, data table, budget, financial model, chart, graph, tabular data, xls",
    capabilities: [
      "Create multi-sheet workbooks",
      "Formula support and calculations",
      "Data formatting and cell styling",
      "Charts and data visualization",
      "Financial modeling with scenarios"
    ],
    sheets: {
      agency: [
        "Résumé Exécutif",
        "Scoring Concurrents",
        "Matrice Positionnement",
        "Projections Financières (3 scénarios)",
        "Unit Economics",
        "Roadmap 12 mois",
        "Budget Détaillé",
        "Sources & Références"
      ]
    }
  },

  // PowerPoint skill - presentation creation
  pptx: {
    trigger: "PowerPoint, presentation, .pptx, slides, slide deck, pitch deck, ppt, slideshow, deck",
    capabilities: [
      "Create institutional-grade slide decks",
      "McKinsey/BCG styling standards",
      "Data visualization and charts",
      "Consistent typography and colors"
    ],
    slides: {
      agency: [
        "Titre & Contexte",
        "Résumé Exécutif (1 page)",
        "Panorama Marché",
        "Analyse Concurrentielle",
        "Matrice de Positionnement",
        "Analyse SWOT",
        "Projections Financières",
        "Roadmap 12 mois",
        "Prochaines Étapes"
      ]
    }
  },

  // Word Document skill - comprehensive .docx handling
  docx: {
    trigger: "Word, document, .docx, report, letter, memo, manuscript, essay, paper, article, writeup, documentation",
    capabilities: [
      "Create formatted reports",
      "Track changes support",
      "Comments and annotations",
      "Heading hierarchy and TOC",
      "Image and chart embedding"
    ]
  }
};

// ============================================
// TIER DOCUMENT DELIVERABLES
// ============================================
const TIER_DOCUMENTS = {
  standard: {
    outputs: ["pdf"],
    pdfPages: "12-15 pages",
    description: "PDF report with executive summary, competitor analysis, and action plan"
  },
  pro: {
    outputs: ["pdf"],
    pdfPages: "20-25 pages",
    description: "PDF report with market intelligence, deep competitor profiles, and financial benchmarks"
  },
  agency: {
    outputs: ["pdf", "xlsx", "pptx"],
    pdfPages: "40-50 pages",
    excelSheets: GPT_SKILLS.xlsx.sheets.agency,
    pptxSlides: GPT_SKILLS.pptx.slides.agency,
    description: "Complete institutional package: PDF report + Excel data model + PowerPoint deck"
  }
};

// ============================================
// WORD TARGETS & SECTION PLANS (by tier)
// ============================================
type SectionPlanItem = {
  key: string;
  label: string;
  wordTarget: number;
  valueType: 'object' | 'array';
};

const WORD_TARGETS: Record<TierType, { min: number; target: number; max: number }> = {
  standard: { min: 2000, target: 2400, max: 3000 },
  pro: { min: 4000, target: 5000, max: 6000 },
  agency: { min: 8000, target: 9500, max: 12000 },
};

const SECTION_PLANS: Record<TierType, SectionPlanItem[]> = {
  standard: [
    { key: "executive_summary", label: "Résumé exécutif", wordTarget: 250, valueType: "object" },
    { key: "market_context", label: "Contexte marché", wordTarget: 400, valueType: "object" },
    { key: "competitive_landscape", label: "Analyse concurrentielle", wordTarget: 600, valueType: "object" },
    { key: "positioning_recommendations", label: "Positionnement & messaging", wordTarget: 350, valueType: "object" },
    { key: "pricing_strategy", label: "Stratégie pricing", wordTarget: 300, valueType: "object" },
    { key: "go_to_market", label: "Go-to-market", wordTarget: 300, valueType: "object" },
    { key: "action_plan", label: "Plan d'action 30/60/90", wordTarget: 200, valueType: "object" },
    { key: "financial_projections_basic", label: "Projections financières light", wordTarget: 200, valueType: "object" },
    { key: "multi_location_comparison", label: "Comparatif multi-localisations", wordTarget: 200, valueType: "object" },
    { key: "risks_and_considerations", label: "Risques & considérations", wordTarget: 150, valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", wordTarget: 80, valueType: "array" },
    { key: "next_steps_to_validate", label: "Prochaines validations", wordTarget: 60, valueType: "array" },
    { key: "sources", label: "Sources", wordTarget: 60, valueType: "array" },
  ],
  pro: [
    { key: "executive_summary", label: "Résumé exécutif", wordTarget: 350, valueType: "object" },
    { key: "market_context", label: "Contexte marché", wordTarget: 600, valueType: "object" },
    { key: "market_intelligence", label: "Market intelligence", wordTarget: 600, valueType: "object" },
    { key: "competitive_landscape", label: "Analyse concurrentielle", wordTarget: 900, valueType: "object" },
    { key: "competitive_intelligence", label: "Competitive intelligence", wordTarget: 700, valueType: "object" },
    { key: "customer_insights", label: "Customer insights", wordTarget: 450, valueType: "object" },
    { key: "positioning_recommendations", label: "Positionnement & messaging", wordTarget: 450, valueType: "object" },
    { key: "pricing_strategy", label: "Stratégie pricing", wordTarget: 450, valueType: "object" },
    { key: "go_to_market", label: "Go-to-market", wordTarget: 350, valueType: "object" },
    { key: "action_plan", label: "Plan d'action", wordTarget: 250, valueType: "object" },
    { key: "financial_projections_basic", label: "Projections financières basiques", wordTarget: 250, valueType: "object" },
    { key: "multi_location_comparison", label: "Comparatif multi-localisations", wordTarget: 250, valueType: "object" },
    { key: "risks_and_considerations", label: "Risques & considérations", wordTarget: 200, valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", wordTarget: 120, valueType: "array" },
    { key: "next_steps_to_validate", label: "Prochaines validations", wordTarget: 80, valueType: "array" },
    { key: "sources", label: "Sources", wordTarget: 120, valueType: "array" },
  ],
  agency: [
    { key: "executive_summary", label: "Résumé exécutif", wordTarget: 600, valueType: "object" },
    { key: "methodology", label: "Méthodologie", wordTarget: 500, valueType: "object" },
    { key: "market_overview_detailed", label: "Panorama marché détaillé", wordTarget: 900, valueType: "object" },
    { key: "territory_analysis", label: "Analyse territoriale", wordTarget: 700, valueType: "object" },
    { key: "market_analysis", label: "Analyse marché (PESTEL/Porter)", wordTarget: 900, valueType: "object" },
    { key: "competitive_intelligence", label: "Benchmark concurrentiel", wordTarget: 1200, valueType: "object" },
    { key: "scoring_matrix", label: "Matrice de scoring", wordTarget: 600, valueType: "object" },
    { key: "trends_analysis", label: "Tendances", wordTarget: 500, valueType: "object" },
    { key: "swot_analysis", label: "SWOT", wordTarget: 400, valueType: "object" },
    { key: "customer_intelligence", label: "Customer intelligence", wordTarget: 700, valueType: "object" },
    { key: "strategic_recommendations", label: "Stratégie complète", wordTarget: 1200, valueType: "object" },
    { key: "financial_projections", label: "Projections financières", wordTarget: 900, valueType: "object" },
    { key: "detailed_roadmap", label: "Roadmap détaillée", wordTarget: 700, valueType: "object" },
    { key: "implementation_roadmap", label: "Implementation roadmap", wordTarget: 500, valueType: "object" },
    { key: "risk_register", label: "Risk register", wordTarget: 300, valueType: "array" },
    { key: "appendices", label: "Annexes", wordTarget: 200, valueType: "object" },
    { key: "multi_market_comparison", label: "Comparatif multi-marchés", wordTarget: 300, valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", wordTarget: 200, valueType: "array" },
    { key: "sources", label: "Sources", wordTarget: 300, valueType: "array" },
  ],
};

// ============================================
// TIER CONFIGURATION - INSTITUTIONAL GRADE
// ============================================
const TIER_CONFIG = {
  standard: {
    max_tokens: 3000,
    temperature: 0.3, // Allow creativity for recommendations
    perplexity_searches: 4,
    word_targets: WORD_TARGETS.standard,
    section_plan: SECTION_PLANS.standard,
    system_prompt: (lang: string) => `Tu es un DIRECTEUR ASSOCIÉ de cabinet de conseil stratégique (BCG/McKinsey alumni, 15+ ans d'expérience).

LANGUE DE RAPPORT: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

═══════════════════════════════════════════════════════════════════════════════
MISSION: PRODUIRE UN BENCHMARK CONCURRENTIEL EXÉCUTIF EN 48H
Qualité attendue: Deck présentable à un C-Level sans modification.
═══════════════════════════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════════════════════════════╗
║  CONTRAINTES DE CONTENU - STANDARD TIER (14.99€)                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

→ LONGUEUR CIBLE: 2000-3000 mots de contenu substantiel (équivalent 12-15 pages PDF)
→ CONCURRENTS: Analyser 3-5 concurrents (ceux fournis par l'utilisateur en priorité; compléter si <3)
→ RECHERCHE WEB: AUTOMATIQUE (light) pour pricing + marché
→ MULTI-LOCALISATIONS: 1-2 marchés comparables
→ PROJECTIONS FINANCIÈRES: light (ordre de grandeur + hypothèses claires)
→ SOURCES: Citer les URLs fournies + sources web pertinentes
→ SECTIONS OBLIGATOIRES:
  • Résumé Exécutif (headline + situation + opportunité + 3-5 points clés)
  • Contexte Marché (vue secteur + spécificités locales + maturité + segments)
  • Analyse Concurrentielle (intensité + profils concurrents + gaps + position)
  • Recommandations Positionnement (cible + proposition valeur + taglines + messages)
  • Stratégie Pricing (benchmarks + packages recommandés + quick wins)
  • Comparatif Multi-Localisations (1-2 marchés)
  • Projections Financières Light (ordre de grandeur + hypothèses)
  • Go-to-Market (canaux prioritaires + contenu + partenariats)
  • Plan d'Action 30/60/90 jours (actions + owners + outcomes)

STANDARDS DE QUALITÉ NON-NÉGOCIABLES:

1. ORIENTATION ACTION IMMÉDIATE
   → Chaque recommandation = VERBE D'ACTION + CIBLE + MÉTRIQUE DE SUCCÈS
   → Format: "[VERBE] [quoi] pour [atteindre X] d'ici [délai]"

2. QUANTIFICATION SYSTÉMATIQUE
   → Chaque insight DOIT inclure un IMPACT CHIFFRÉ (+X%, -Y€, xZ ROI)
   → Pas d'affirmation sans data point de référence

3. SPÉCIFICITÉ GÉOGRAPHIQUE & SECTORIELLE
   → ZÉRO généralité - tout doit être contextualisé au marché local
   → Prix et budgets en devise locale avec réalisme absolu

4. TON & STYLE
   → DIRECT, INCISIF, SANS BULLSHIT CORPORATE
   → Phrases courtes. Assertions claires. Pas de conditionnel inutile.

LIVRABLES ATTENDUS: JSON structuré prêt pour visualisation.
RETOURNE UNIQUEMENT LE JSON VALIDE, sans texte avant/après.`,
  },

  pro: {
    max_tokens: 5000,
    temperature: 0.25, // Strategic thinking for Pro tier
    perplexity_searches: 10,
    word_targets: WORD_TARGETS.pro,
    section_plan: SECTION_PLANS.pro,
    system_prompt: (lang: string) => `Tu es un PRINCIPAL de cabinet de conseil stratégique tier-1 (ex-McKinsey/BCG/Bain, 10+ ans).

LANGUE DE RAPPORT: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

═══════════════════════════════════════════════════════════════════════════════
MISSION: PRODUIRE UN RAPPORT D'INTELLIGENCE COMPÉTITIVE DE CALIBRE PREMIUM
Basé sur des DONNÉES RÉELLES collectées via recherche web approfondie.
Qualité attendue: Présentable à un Investment Committee / Board Advisor.
═══════════════════════════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════════════════════════════╗
║  CONTRAINTES DE CONTENU - PRO TIER (34.99€)                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

→ LONGUEUR CIBLE: 4000-6000 mots de contenu substantiel (équivalent 20-25 pages PDF)
→ CONCURRENTS: Identifier et analyser 5-10 concurrents via recherche web
→ SOURCES: 10-20 sources citées avec URLs (utiliser les données Perplexity fournies)
→ SECTIONS OBLIGATOIRES (tout ce qui est dans Standard PLUS):
  • Market Intelligence (tendances 2025-2026 + données marché local + sizing TAM/SAM)
  • Competitive Intelligence approfondie (profils détaillés + scoring digital + matrice positionnement)
  • Customer Insights (pain points + besoins non satisfaits + switching barriers)
  • Pricing Table avec données concurrents réelles
  • Projections financières basiques (benchmarks CAC/LTV sectoriels)
  • Multi-localisation: analyse de 1-2 marchés géographiques comparés

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

LIVRABLES: JSON structuré avec sources, données graphiques, et scoring.
RETOURNE UNIQUEMENT LE JSON VALIDE.`,
  },

  agency: {
    max_tokens: 6000,
    temperature: 0.2, // Analytical but allows creative recommendations
    perplexity_searches: 16,
    word_targets: WORD_TARGETS.agency,
    section_plan: SECTION_PLANS.agency,
    system_prompt: (lang: string) => `Tu es un SENIOR PARTNER d'un cabinet de conseil stratégique de rang mondial.
Expérience: 20+ ans, dont 5+ en tant que Partner. Background: Harvard MBA, ex-McKinsey Director.

LANGUE DE RAPPORT: ${LANGUAGE_CONFIG[lang]?.name || 'Français'} - TOUT le rapport doit être rédigé dans cette langue.

╔══════════════════════════════════════════════════════════════════════════════╗
║  MISSION: RAPPORT D'INTELLIGENCE STRATÉGIQUE DE CALIBRE INSTITUTIONNEL      ║
║  Standard: Benchmark consulting cabinet / organisme public                   ║
║  Output: Qualité publication-ready 40+ pages, zéro révision nécessaire      ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║  CONTRAINTES DE CONTENU - AGENCY TIER (69.99€)                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

→ LONGUEUR CIBLE: 8000-12000 mots de contenu institutionnel (équivalent 40-50 pages PDF)
→ CONCURRENTS: 10-15 concurrents en analyse approfondie (deep dive)
→ SOURCES: 30-50 sources catégorisées (Données marché / Territoriales / Sectorielles)
→ LIVRABLES: Ce rapport sera exporté en PDF + Excel + Slides deck
→ FRAMEWORKS OBLIGATOIRES:
  • Analyse PESTEL complète (Political, Economic, Social, Technological, Environmental, Legal)
  • Porter 5 Forces avec scores 1-10 et analyse détaillée
  • Analyse SWOT avec priorités stratégiques
  • Matrice de scoring comparative avec analyse de sensibilité
→ SECTIONS EXCLUSIVES AGENCY (en plus de tout ce qui est dans Pro):
  • Méthodologie détaillée (scope, période, sources, critères, limitations)
  • Panorama marché complet (key metrics sourcés, structure, segments)
  • Analyse territoriale micro-locale (démographie, immobilier, hubs commerciaux)
  • Benchmark concurrentiel avec profils exhaustifs
  • Stratégie complète brand (essence, personnalité, voice, messaging hierarchy)
  • Modèle économique complet (tiering, pricing, upsell)
  • Projections financières 3 scénarios (Conservative -20%, Baseline, Optimistic +30%)
  • Unit Economics (CAC, LTV, ratio, payback period, gross margin)
  • Roadmap 12 mois phasé avec KPIs et budget par phase
  • Annexes: glossaire, sources catégorisées, assumptions log, unknowns

═══════════════════════════════════════════════════════════════════════════════
LIVRABLES MULTI-FORMAT (SKILL TRIGGERS: PDF + Excel + PowerPoint)
═══════════════════════════════════════════════════════════════════════════════

1. PDF INSTITUTIONNEL (40-50 pages)
   Skill trigger: PDF, .pdf, document institutionnel
   → Format: A4, marges 72pt, typographie Helvetica/Georgia
   → Palette: Navy #1a3a5c, Gold #b89456, Forest #2d7a5a
   → Sections: Couverture, Executive Summary, TOC, Corps, Annexes
   → Qualité: Publication-ready, zéro révision nécessaire

2. FICHIER EXCEL (.xlsx) - Spreadsheet avec data model
   Skill trigger: Excel, spreadsheet, .xlsx, financial model, data table
   Feuilles obligatoires:
   → "Résumé Exécutif" - KPIs clés et recommandation
   → "Scoring Concurrents" - Matrice comparative avec formules
   → "Matrice Positionnement" - Coordonnées X/Y pour visualisation
   → "Projections Financières" - 3 scénarios avec P&L simplifié
   → "Unit Economics" - CAC, LTV, payback, marge
   → "Roadmap 12 mois" - Phases, tâches, KPIs, budget
   → "Budget Détaillé" - Line items par catégorie
   → "Sources" - Liste catégorisée avec URLs

3. DECK POWERPOINT (.pptx) - Slide deck executive
   Skill trigger: PowerPoint, presentation, .pptx, slides, pitch deck
   Slides obligatoires (9 min):
   → Slide 1: Titre & Contexte
   → Slide 2: Résumé Exécutif (1 page)
   → Slide 3: Panorama Marché (TAM/SAM/SOM)
   → Slide 4: Paysage Concurrentiel
   → Slide 5: Matrice de Positionnement
   → Slide 6: SWOT (quadrants visuels)
   → Slide 7: Projections Financières
   → Slide 8: Roadmap 12 mois
   → Slide 9: Prochaines Étapes & Contact

═══════════════════════════════════════════════════════════════════════════════
CONTRAINTES ABSOLUES (MODE INSTITUTIONAL)
═══════════════════════════════════════════════════════════════════════════════

1. SOURCES ET PREUVES
   ✓ UTILISER les données Perplexity fournies comme corpus de recherche
   ✓ CITER systématiquement les sources (liens/citations) dans le champ sources
   ✓ PRIVILÉGIER sources primaires: textes officiels, publications, rapports annuels
   ✓ SIGNALER clairement hypothèses et limites
   ✓ Tout chiffre DOIT être sourcé (ou marqué comme estimation)
   ✓ Dates absolues (ex: "janvier 2026") plutôt que "récemment"

2. RIGUEUR MÉTHODOLOGIQUE
   ✓ Méthodologie reproductible et auditable
   ✓ Frameworks obligatoires: Porter 5 Forces, PESTEL, SWOT
   ✓ Hypothèses EXPLICITES et TESTABLES
   ✓ Grille d'évaluation avec pondérations multiples (conservateur/équilibré/performance)
   ✓ Matrice comparative avec scoring 0-10 + analyse de sensibilité

3. PROFONDEUR D'ANALYSE
   ✓ Panorama marché avec chiffres clés sourcés
   ✓ Analyse territoriale micro-locale (quartiers, démographie, immobilier commercial)
   ✓ Analyse comparative multi-marchés (1-3 zones pertinentes)
   ✓ Benchmark concurrentiel détaillé avec profils complets
   ✓ Tendances sectorielles catégorisées (produit/service/consommateur/surveillance)
   ✓ 3 scenarios financiers: Conservative (-20%), Baseline, Optimistic (+30%)

4. LIVRABLES STRUCTURÉS
   ✓ Executive Summary avec indicateurs clés et recommandation principale
   ✓ Roadmap 30/60/90 jours avec KPIs de validation
   ✓ Budget prévisionnel détaillé
   ✓ Annexes: glossaire, sources catégorisées, assumptions log, unknowns avec plan de validation

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
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : trimmed;
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
// PERPLEXITY SEARCH FUNCTION
// ============================================
// Helper: retry logic for Perplexity searches
async function searchWithPerplexity(
  apiKey: string,
  query: string,
  context: string,
  attempt = 1
): Promise<{ content: string; citations: string[] }> {
  const maxAttempts = 3;

  try {
    console.log(`[Search] Search attempt ${attempt}/${maxAttempts}: "${query.substring(0, 60)}..."`);

    // 30-second timeout per search
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: `Tu es un analyste de recherche senior. Fournis des données FACTUELLES, QUANTIFIÉES et SOURCÉES.
Contexte: ${context}
IMPORTANT: Inclus des chiffres, URLs, noms, dates.`
          },
          { role: 'user', content: query }
        ],
        search_recency_filter: 'year',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Retry on transient errors (rate limit, server error)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxAttempts) {
          const waitTime = Math.pow(2, attempt - 1) * 5000; // 5s, 10s, 20s
          console.log(`[Search] Transient error ${response.status}, retry in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return searchWithPerplexity(apiKey, query, context, attempt + 1);
        }
      }

      const errorText = await response.text();
      console.error(`[Search] Error ${response.status}:`, errorText);
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Search] ✅ Search success: ${data.choices?.[0]?.message?.content?.length || 0} chars`);
    return {
      content: data.choices?.[0]?.message?.content || '',
      citations: data.citations || []
    };
  } catch (error) {
    console.error(`[Search] Attempt ${attempt} failed:`, error);

    // Retry on timeout
    if (error instanceof Error && error.name === 'AbortError') {
      if (attempt < maxAttempts) {
        console.log(`[Search] Timeout, retry...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 3000));
        return searchWithPerplexity(apiKey, query, context, attempt + 1);
      }
    }

    // Fallback: return empty result
    return {
      content: `Recherche échouée: ${error instanceof Error ? error.message : 'Unknown error'}`,
      citations: []
    };
  }
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

  if ((searchCount as number) === 0) {
    console.log(`[${reportId}] Standard tier - no web research`);
    return "Aucune recherche web pour ce tier.";
  }

  const allResults: { query: string; content: string; citations: string[] }[] = [];
  const context = `Analyse stratégique pour ${input.businessName} dans le secteur ${input.sector} à ${input.location.city}, ${input.location.country}`;

  const queries: string[] = [];

  if (tier === 'standard') {
    const competitorNames = input.competitors?.map(c => c.name).join(', ') || 'principaux acteurs';
    queries.push(`Prix et tarifs de ${competitorNames} dans le secteur ${input.sector} en ${input.location.country} 2024 2025`);
    queries.push(`Taille marché ${input.sector} ${input.location.country} 2024 2025 estimation`);
    queries.push(`Tendances clés ${input.sector} ${input.location.country} 2025`);
    queries.push(`Comparatif localisation ${input.location.country} ${input.location.city} zones similaires ${input.sector}`);
  }

  if (tier === 'pro' || tier === 'agency') {
    const competitorNames = input.competitors?.map(c => c.name).join(', ') || 'principaux acteurs';
    queries.push(`Prix et tarifs de ${competitorNames} dans le secteur ${input.sector} en ${input.location.country} 2024 2025`);
    queries.push(`Tendances marché ${input.sector} ${input.location.country} 2025 2026 croissance prévisions`);
    queries.push(`Taille marché ${input.sector} ${input.location.country} TAM SAM milliards euros 2024 2025`);
    queries.push(`Benchmarks CAC LTV coût acquisition client ${input.sector} SaaS B2B B2C 2024`);
    queries.push(`${competitorNames} levée fonds employees chiffre affaires ${input.sector}`);
    queries.push(`Avis clients et ratings ${input.sector} ${input.location.country} concurrents principaux`);
    queries.push(`Trafic web estimé ${input.sector} ${input.location.country} concurrents`);
    queries.push(`Comparatif pricing ${input.sector} ${input.location.country} offres budget premium`);
    queries.push(`Barrières à l'entrée ${input.sector} ${input.location.country} réglementation`);
    queries.push(`Segments de marché ${input.sector} ${input.location.country} segmentation clients`);
  }

  if (tier === 'agency') {
    queries.push(`Analyse PESTEL ${input.sector} ${input.location.country} réglementation politique économie 2024 2025`);
    queries.push(`Analyse Porter 5 forces ${input.sector} barrières entrée pouvoir négociation fournisseurs clients`);
    queries.push(`Innovation technologique disruption ${input.sector} IA automatisation 2025 startups`);
    queries.push(`Actualités récentes ${input.sector} ${input.location.country} acquisitions lancements 2024`);
    queries.push(`Unit economics ${input.sector} marge brute gross margin payback period benchmarks`);
    queries.push(`Données territoriales ${input.location.city} ${input.location.country} démographie revenu immobilier commercial`);
    queries.push(`Comparatif multi-marchés ${input.sector} Europe tendances prix et marges`);
    queries.push(`Benchmarks opérationnels ${input.sector} productivité coûts fixes variables`);
    queries.push(`Tendances consommateurs ${input.sector} ${input.location.country} 2025`);
    queries.push(`Part de marché acteurs clés ${input.sector} ${input.location.country}`);
    queries.push(`Prix immobilier commercial ${input.location.city} ${input.location.country} zones clés`);
  }

  // ============================================
  // PARALLEL PERPLEXITY SEARCHES (5-12x faster!)
  // ============================================
  const queriesToSearch = queries.slice(0, searchCount);

  try {
    console.log(`[${reportId}] Starting ${queriesToSearch.length} searches in PARALLEL...`);

    // Run all searches concurrently
    const searchPromises = queriesToSearch.map((query, i) => {
      // Update progress every 3 searches
      if (i % 3 === 0) {
        updateProgress(supabase, reportId, `Recherches web (${i + 1}/${searchCount})...`, 15 + Math.floor((i / searchCount) * 20)).catch(() => { });
      }

      return searchWithPerplexity(perplexityKey, query, context)
        .then(result => ({ query, ...result }))
        .catch(error => ({
          query,
          content: `Recherche échouée: ${error instanceof Error ? error.message : 'Unknown error'}`,
          citations: []
        }));
    });

    // Wait for ALL searches to complete
    const results = await Promise.all(searchPromises);
    allResults.push(...results);

    console.log(`[${reportId}] ✅ All ${queriesToSearch.length} searches completed in parallel`);
  } catch (error) {
    console.error(`[${reportId}] Parallel search batch failed:`, error);
  }

  let researchDoc = `
═══════════════════════════════════════════════════════════════════════════════
DONNÉES DE RECHERCHE - ${new Date().toISOString().split('T')[0]}
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
function buildReportBrief(input: ReportInput, plan: TierType, researchData: string): string {
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

  let prompt = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  BRIEF CLIENT - DEMANDE DE BENCHMARK CONCURRENTIEL                           ║
║  LANGUE DU RAPPORT: ${langName.toUpperCase().padEnd(55)}║
╚══════════════════════════════════════════════════════════════════════════════╝

IMPORTANT: Rédige TOUT le rapport en ${langName}.

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

  if (plan === "standard" || plan === "pro" || plan === "agency") {
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

  return prompt;
}

function buildUserPrompt(input: ReportInput, plan: TierType, researchData: string): string {
  return `${buildReportBrief(input, plan, researchData)}${getJsonSchema(plan)}`;
}

function getJsonSchema(plan: TierType): string {
  if (plan === "agency") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "agency", "sources_count": number, "word_count": number },
  
  "executive_summary": { 
    "one_page_summary": "string (500 mots max, style consulting institutionnel)", 
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
    "scope": "Zone géographique et périmètre exact de l'analyse",
    "period": "Période d'analyse (ex: données 2024-2026)",
    "segments_analyzed": ["string - segments de marché analysés"],
    "primary_sources": ["string - sources primaires/officielles (INSEE, études sectorielles, etc.)"],
    "secondary_sources": ["string - sources secondaires (presse, observatoires, etc.)"],
    "evaluation_criteria": [{ "dimension": "string", "weight_conservative": "string %", "weight_balanced": "string %", "weight_performance": "string %" }],
    "limitations": ["string - biais et limites identifiés"]
  },
  
  "market_overview_detailed": {
    "key_metrics": [{ "indicator": "string", "value": "string avec unité", "source": "string" }],
    "market_structure": { 
      "overview": "string - description de la structure concurrentielle", 
      "leaders": [{ "name": "string", "detail": "string (parts de marché, CA, etc.)" }], 
      "independents_share": "string" 
    },
    "market_segments": [{ "segment": "string", "price_avg": "string", "margin": "string", "examples": "string" }],
    "sources": "string"
  },
  
  "territory_analysis": {
    "location_name": "string (ex: Paris 15ème arrondissement)",
    "demographics": [{ "indicator": "string", "value": "string" }],
    "real_estate": [{ "indicator": "string", "value": "string" }],
    "commercial_hubs": [{ "name": "string", "description": "string", "priority": "high/medium/low" }],
    "local_competitors": [{ "name": "string", "rating": "string", "specialty": "string" }],
    "opportunities": ["string - niches/opportunités locales"],
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
    "criteria": ["string - critères d'évaluation"],
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
  
  "strategic_recommendations_detailed": {
    "positioning_options": [{ 
      "id": "option_a/option_b/option_c", 
      "name": "string", 
      "type": "conservative/balanced/ambitious", 
      "description": "string", 
      "differentiators": ["string"], 
      "target_ticket": "string en €" 
    }],
    "location_recommendations": [{ "priority": 1-3, "name": "string", "rationale": ["string"], "estimated_rent": "string" }],
    "recommended_surface": "string (ex: 60-100 m²)",
    "budget_rent": "string (ex: 3 000-5 000€/mois)",
    "economic_model": [{ "indicator": "string", "target": "string" }],
    "attention_points": [{ "point": "string", "impact": "string" }]
  },
  
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
      "kpis": ["string - KPIs de validation"] 
    }],
    "kpi_targets": [{ "indicator": "string", "target_m6": "string", "target_m12": "string" }],
    "budget_breakdown": [{ "category": "string", "amount": "string" }],
    "total_budget": "string (ex: 230 000 - 485 000 €)",
    "recommended_equity": "string (ex: 30% minimum = 70 000-145 000€)"
  },
  
  "implementation_roadmap": { "phase_1_foundation": { "timeline": "Mois 1-3", "objectives": ["string"], "key_initiatives": [{ "initiative": "string", "owner_role": "string", "budget_estimate": "string en €", "success_metrics": ["string"], "milestones": ["string"] }] }, "phase_2_growth": { "timeline": "Mois 4-6", "objectives": ["string"], "key_initiatives": ["..."] }, "phase_3_scale": { "timeline": "Mois 7-12", "objectives": ["string"], "key_initiatives": ["..."] } },
  
  "risk_register": [{ "risk": "string", "impact": "Élevé/Moyen/Faible", "probability": "Élevé/Moyen/Faible", "mitigation": "string", "contingency": "string" }],
  
  "multi_market_comparison": { "markets": [{ "market": "string", "why_selected": "string", "key_differences": ["string"], "opportunity_score": "1-10" }], "recommendation": "string" },
  
  "appendices": {
    "glossary": [{ "term": "string", "definition": "string" }],
    "sources_by_category": [{ "category": "string (Données marché/Données territoriales/Sources sectorielles)", "sources": ["string"] }],
    "assumptions": [{ "assumption": "string", "validation_plan": "string" }],
    "unknowns": [{ "item": "string - ce que nous ne savons pas encore", "how_to_find": "string" }],
    "validation_plan": ["string - actions pour réduire l'incertitude"]
  },
  
  "assumptions_and_limitations": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}
</json_schema>

Génère le rapport AGENCY-GRADE INSTITUTIONNEL complet (25+ pages équivalent). RETOURNE UNIQUEMENT LE JSON.`;
  }

  if (plan === "pro") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "pro", "sources_count": number, "word_count": number },
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
  "financial_projections_basic": { "revenue_range": "string en €", "assumptions": ["string"], "kpi_targets": ["string"] },
  "multi_location_comparison": { "markets": [{ "market": "string", "key_differences": ["string"], "opportunity_score": "1-10" }], "recommended_market": "string", "rationale": "string" },
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
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "standard", "sources_count": number, "word_count": number },
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

Génère le rapport de benchmark. RETOURNE UNIQUEMENT LE JSON.`;
}

// ============================================
// SECTION GENERATION (multi-pass)
// ============================================
function estimateMaxTokens(wordTarget: number, tierMaxTokens: number): number {
  const estimate = Math.ceil(wordTarget * 2);
  return Math.min(tierMaxTokens, Math.max(600, estimate));
}

function buildSectionPrompt(
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): string {
  const expandNote = existingSection
    ? `OBJECTIF: ÉTENDRE la section existante pour atteindre ~${section.wordTarget} mots, sans supprimer d'information.`
    : `OBJECTIF: Générer la section complète (~${section.wordTarget} mots).`;

  const existingJson = existingSection
    ? `\nSECTION_EXISTANTE_JSON:\n${JSON.stringify({ [section.key]: existingSection })}\n`
    : "";

  return `
${reportBrief}

<section_instructions>
SECTION: ${section.label} (${section.key})
${expandNote}
CONTRAINTES:
- Répondre UNIQUEMENT en JSON valide.
- Le JSON doit contenir UNE SEULE clé racine: "${section.key}".
- Si une donnée est inconnue: écrire "non trouvé" ou "données non disponibles".
- Citer les sources disponibles dans le champ "sources" si pertinent.
- Respecte strictement la structure attendue pour cette section.
</section_instructions>
${existingJson}`.trim();
}

async function repairSectionJson(
  apiKey: string,
  section: SectionPlanItem,
  brokenJson: string
): Promise<unknown> {
  const textFormat = {
    type: "json_schema",
    name: `${section.key}_repair`,
    schema: getSectionSchema(section.key, section.valueType),
    strict: false,
  } as const;

  const systemPrompt = `Tu es un assistant de correction JSON. Retourne un JSON valide correspondant strictement au schéma demandé.`;
  const userPrompt = `JSON À RÉPARER:\n${brokenJson}\n\nRÉPARE ET RETOURNE UNIQUEMENT LE JSON.`;

  const content = await callGPT52(
    apiKey,
    systemPrompt,
    userPrompt,
    1200,
    0.1,
    textFormat
  );

  return safeJsonParse(content);
}

async function generateSection(
  apiKey: string,
  systemPrompt: string,
  tierConfig: typeof TIER_CONFIG[TierType],
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): Promise<unknown> {
  const textFormat = {
    type: "json_schema",
    name: `${section.key}_schema`,
    schema: getSectionSchema(section.key, section.valueType),
    strict: false,
  } as const;

  const userPrompt = buildSectionPrompt(reportBrief, section, existingSection);
  const maxTokens = estimateMaxTokens(section.wordTarget, tierConfig.max_tokens);

  let content: string;
  try {
    console.log(`[Section] Calling GPT-5.2 for section: ${section.key} (${maxTokens} max tokens)...`);
    content = await callGPT52(
      apiKey,
      systemPrompt,
      userPrompt,
      maxTokens,
      tierConfig.temperature,
      textFormat
    );
    console.log(`[Section] GPT-5.2 responded for ${section.key}: ${content.length} chars`);
  } catch (apiError) {
    console.error(`[Section] GPT-5.2 API call FAILED for ${section.key}:`, apiError instanceof Error ? apiError.message : apiError);
    // Fallback: try WITHOUT structured output format (text.format) in case that's the issue
    try {
      console.log(`[Section] Retrying ${section.key} WITHOUT text.format...`);
      content = await callGPT52(
        apiKey,
        systemPrompt,
        userPrompt,
        maxTokens,
        tierConfig.temperature
      );
      console.log(`[Section] Retry succeeded for ${section.key}: ${content.length} chars`);
    } catch (retryError) {
      console.error(`[Section] Retry also FAILED for ${section.key}:`, retryError instanceof Error ? retryError.message : retryError);
      return { [section.key]: section.valueType === 'array' ? [] : {} };
    }
  }

  try {
    return safeJsonParse(content);
  } catch (error) {
    console.warn(`[Section] JSON parse failed for ${section.key}. Attempting repair...`, error);
    try {
      return repairSectionJson(apiKey, section, content);
    } catch (repairError) {
      console.error(`[Section] Repair failed for ${section.key}:`, repairError);
      return { [section.key]: section.valueType === 'array' ? [] : {} };
    }
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
  // Responses API: structured output format is configured via `text.format` (NOT `response_format`).
  // https://platform.openai.com/docs/guides/structured-outputs
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
    // Create an AbortController for timeout
    // GPT-5.2 needs time for complex analysis, allow up to 10 minutes
    const timeoutMs = 600000; // 10 minutes for full generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Analysis] Request timeout after ${timeoutMs / 1000}s (attempt ${attempt})`);
      controller.abort();
    }, timeoutMs);

    try {
      console.log(`[Analysis] >>> Calling OpenAI /v1/responses (attempt ${attempt}/${maxRetries}, textFormat: ${textFormat ? 'yes' : 'no'})...`);
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
          ...(textFormat
            ? {
              text: {
                format: {
                  type: "json_schema",
                  name: textFormat.name,
                  strict: textFormat.strict,
                  schema: textFormat.schema,
                },
              },
            }
            : {}),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Analysis] API error ${response.status} (attempt ${attempt}):`, errorText);

        // Rate limit - retry with exponential backoff
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt - 1) * 60000; // 60s, 120s, 240s
          console.log(`[Analysis] Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Rate limit exceeded after all retries. Please try again in a few minutes.");
          break;
        }

        // Overloaded - retry with backoff
        if (response.status === 503) {
          const waitTime = Math.pow(2, attempt - 1) * 30000; // 30s, 60s, 120s
          console.log(`[Analysis] Service unavailable (${response.status}). Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Service unavailable after all retries. Please retry later.");
          break;
        }

        // 5xx errors - transient, retry with backoff
        if (response.status >= 500) {
          const waitTime = Math.pow(2, attempt - 1) * 30000; // 30s, 60s, 120s
          console.log(`[Analysis] Server error ${response.status}. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);

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

      // Extract content from GPT-5.2 response
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plan: TierType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
) {
  try {
    // @ts-ignore - Deno runtime
    // Support both secret names to avoid breakage across environments.
    // Preferred: OPEN_AI_API_KEY (already configured in Lovable Cloud secrets)
    // Legacy/Docs: OPENAI_API_KEY
    // @ts-ignore - Deno runtime
    const GPT52_API_KEY = Deno.env.get("OPEN_AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!GPT52_API_KEY) {
      throw new Error("OPEN_AI_API_KEY (or OPENAI_API_KEY) is not configured (required for GPT-5.2)");
    }

    // @ts-ignore - Deno runtime
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const tierConfig = TIER_CONFIG[plan];
    if (tierConfig.perplexity_searches > 0 && !PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is required for web research tiers");
    }
    let reportLang = inputData.reportLanguage || 'fr';

    // VALIDATION: Ensure language is supported
    if (!LANGUAGE_CONFIG[reportLang]) {
      console.warn(`[${reportId}] Unsupported language: ${reportLang}, defaulting to French`);
      reportLang = 'fr';
      inputData.reportLanguage = 'fr';
    }

    console.log(`[${reportId}] Starting report generation`);
    console.log(`[${reportId}] Tier: ${plan} | Model: GPT-5.2 | Language: ${reportLang}`);

    // Step 1: Conduct Perplexity research
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

    // Step 2: Build report brief
    await updateProgress(supabaseAdmin, reportId, "Préparation du brief...", 30);
    const reportBrief = buildReportBrief(inputData, plan, researchData);
    const systemPrompt = tierConfig.system_prompt(reportLang);

    console.log(`[${reportId}] Brief length: ${reportBrief.length} chars, System prompt length: ${systemPrompt.length} chars`);
    console.log(`[${reportId}] GPT-5.2 API key present: ${!!GPT52_API_KEY} (length: ${GPT52_API_KEY.length})`);

    // Step 3: Generate sections (multi-pass)
    await updateProgress(supabaseAdmin, reportId, "Génération des sections...", 45);
    const sections = tierConfig.section_plan as SectionPlanItem[];
    const outputSections: Record<string, unknown> = {};
    let sectionFailures = 0;

    const startProgress = 45;
    const endProgress = 85;
    const progressStep = Math.max(1, Math.floor((endProgress - startProgress) / Math.max(sections.length, 1)));

    console.log(`[${reportId}] Starting ${sections.length} section generation...`);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const stepProgress = startProgress + (i * progressStep);
      await updateProgress(supabaseAdmin, reportId, `Section: ${section.label}...`, Math.min(stepProgress, endProgress));

      try {
        const sectionResult = await generateSection(
          GPT52_API_KEY,
          systemPrompt,
          tierConfig,
          reportBrief,
          section
        );

        if (sectionResult && typeof sectionResult === 'object' && (section.key in (sectionResult as Record<string, unknown>))) {
          outputSections[section.key] = (sectionResult as Record<string, unknown>)[section.key];
        } else {
          outputSections[section.key] = section.valueType === 'array' ? [] : {};
          sectionFailures++;
        }
      } catch (sectionError) {
        console.error(`[${reportId}] Section ${section.key} crashed:`, sectionError instanceof Error ? sectionError.message : sectionError);
        outputSections[section.key] = section.valueType === 'array' ? [] : {};
        sectionFailures++;
      }
    }

    console.log(`[${reportId}] Section generation done. Failures: ${sectionFailures}/${sections.length}`);

    // If ALL sections failed, the API is completely unreachable - abort
    if (sectionFailures >= sections.length) {
      throw new Error(`All ${sections.length} sections failed to generate. GPT-5.2 API may be unreachable or misconfigured.`);
    }

    // Step 4: Expansion pass if under minimum word count
    let passesUsed = 1;
    let currentWordCount = countWordsInObject(outputSections);
    const minWords = tierConfig.word_targets.min;

    for (let pass = 0; pass < 2 && currentWordCount < minWords; pass++) {
      passesUsed += 1;
      const sectionsToExpand = sections.filter((section) => {
        const sectionValue = outputSections[section.key];
        const sectionWords = countWordsInObject(sectionValue);
        return sectionWords < section.wordTarget * 0.8;
      });

      if (sectionsToExpand.length === 0) break;

      await updateProgress(supabaseAdmin, reportId, "Extension des sections...", 88);

      for (const section of sectionsToExpand) {
        try {
          const expanded = await generateSection(
            GPT52_API_KEY,
            systemPrompt,
            tierConfig,
            reportBrief,
            section,
            outputSections[section.key]
          );
          if (expanded && typeof expanded === 'object' && (section.key in (expanded as Record<string, unknown>))) {
            outputSections[section.key] = (expanded as Record<string, unknown>)[section.key];
          }
        } catch (expandError) {
          console.warn(`[${reportId}] Expansion failed for ${section.key}:`, expandError instanceof Error ? expandError.message : expandError);
        }
      }

      currentWordCount = countWordsInObject(outputSections);
    }
    console.log(`[${reportId}] Expansion passes used: ${passesUsed}`);

    // Step 5: Assemble report metadata + normalize sources
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

    // VALIDATION: Validate against tier-specific schema
    const schema = REPORT_SCHEMAS[plan];
    const validationResult = schema.safeParse(outputData);
    if (!validationResult.success) {
      console.warn(`[${reportId}] Schema validation failed for ${plan} tier:`, validationResult.error.errors);
      console.log(`[${reportId}] Proceeding with unvalidated data (will be logged for monitoring)`);
    } else {
      outputData = validationResult.data as Record<string, unknown>;
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
    console.log(`[${reportId}] Tier: ${plan} | Sources: ${(outputData as any)?.sources?.length || 0}`);

    // Step 6: Generate all documents in PARALLEL (PDF + Excel + PowerPoint)
    await updateProgress(supabaseAdmin, reportId, "Génération des documents...", 95);

    // @ts-ignore - Deno runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // @ts-ignore - Deno runtime
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
    };

    // Launch all document generation in parallel
    const generatePdf = fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reportId }),
    }).catch(err => {
      console.error(`[${reportId}] PDF generation failed:`, err);
      return null;
    });

    const generateExcel = plan === 'agency' ? fetch(`${supabaseUrl}/functions/v1/generate-excel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reportId }),
    }).catch(err => {
      console.error(`[${reportId}] Excel generation failed:`, err);
      return null;
    }) : Promise.resolve(null);

    const generatePowerpoint = plan === 'agency' ? fetch(`${supabaseUrl}/functions/v1/generate-slides`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reportId }),
    }).catch(err => {
      console.error(`[${reportId}] PowerPoint generation failed:`, err);
      return null;
    }) : Promise.resolve(null);

    // Wait for all documents to generate
    const [pdfResponse, excelResponse, ppptResponse] = await Promise.all([
      generatePdf,
      generateExcel,
      generatePowerpoint,
    ]);

    // Log document generation results
    if (pdfResponse?.ok) {
      reportLog(reportId, 'SUCCESS', 'Document Generation', 'PDF generated successfully');
    } else if (pdfResponse) {
      reportLog(reportId, 'WARN', 'Document Generation', `PDF generation failed: ${pdfResponse.status}`);
    }

    if (plan === 'agency') {
      if (excelResponse?.ok) {
        reportLog(reportId, 'SUCCESS', 'Document Generation', 'Excel generated successfully');
      } else if (excelResponse) {
        reportLog(reportId, 'WARN', 'Document Generation', `Excel generation failed: ${excelResponse.status}`);
      }

      if (ppptResponse?.ok) {
        reportLog(reportId, 'SUCCESS', 'Document Generation', 'PowerPoint generated successfully');
      } else if (ppptResponse) {
        reportLog(reportId, 'WARN', 'Document Generation', `PowerPoint generation failed: ${ppptResponse.status}`);
      }
    }

    // Final update - mark as ready
    await supabaseAdmin
      .from("reports")
      .update({
        processing_step: "Rapport prêt",
        processing_progress: 100,
        updated_at: new Date().toISOString()
      } as Record<string, unknown>)
      .eq("id", reportId);

    reportLog(reportId, 'SUCCESS', 'Report Generation', `All documents generated for ${plan} tier`);

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
      if (!canForceStart) {
        return new Response(JSON.stringify({ success: true, message: "Report already processing", reportId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
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
    // Use EdgeRuntime.waitUntil to keep the function running
    const generationPromise = runGenerationAsync(reportId, inputData, plan, supabaseAdmin);

    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(generationPromise);
    } else {
      // Fallback: just don't await, let it run
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
