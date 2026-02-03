import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers - allow all origins for development/preview compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// CLAUDE MODELS - USE HAIKU FOR TESTING (FASTER + CHEAPER)
// Switch to Opus for production when everything works
// ============================================
// Set to true to use fast/cheap Haiku 4.5, false for Opus 4.5
const USE_HAIKU_FOR_TESTING = true;

const CLAUDE_MODEL_OPUS = "claude-opus-4-5-20251101";
const CLAUDE_MODEL_HAIKU = "claude-3-5-haiku-20241022";

const CLAUDE_MODEL = USE_HAIKU_FOR_TESTING ? CLAUDE_MODEL_HAIKU : CLAUDE_MODEL_OPUS;

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

// ============================================
// CLAUDE API SKILLS - DOCUMENT GENERATION
// ============================================
// These skill triggers activate Claude Opus 4.5's native document handling
const CLAUDE_SKILLS = {
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
    excelSheets: CLAUDE_SKILLS.xlsx.sheets.agency,
    pptxSlides: CLAUDE_SKILLS.pptx.slides.agency,
    description: "Complete institutional package: PDF report + Excel data model + PowerPoint deck"
  }
};

// ============================================
// TIER CONFIGURATION - INSTITUTIONAL GRADE
// ============================================
const TIER_CONFIG = {
  standard: {
    max_tokens: 12000,
    temperature: 0.2,
    perplexity_searches: 0,
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
→ CONCURRENTS: Analyser 3-5 concurrents (ceux fournis par l'utilisateur uniquement)
→ SOURCES: Citer les URLs fournis par l'utilisateur, PAS de recherche web externe
→ SECTIONS OBLIGATOIRES:
  • Résumé Exécutif (headline + situation + opportunité + 3-5 points clés)
  • Contexte Marché (vue secteur + spécificités locales + maturité + segments)
  • Analyse Concurrentielle (intensité + profils concurrents + gaps + position)
  • Recommandations Positionnement (cible + proposition valeur + taglines + messages)
  • Stratégie Pricing (benchmarks + packages recommandés + quick wins)
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
    max_tokens: 24000,
    temperature: 0.15,
    perplexity_searches: 5,
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
  • Multi-localisation: analyse de 1-2 marchés géographiques

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
    max_tokens: 64000,
    temperature: 0.1,
    perplexity_searches: 12,
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
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `Tu es un analyste de recherche senior. Fournis des données FACTUELLES, QUANTIFIÉES et SOURCÉES.
Contexte de recherche: ${context}
IMPORTANT: Inclus des chiffres précis, des URLs, des noms d'entreprises, des dates.`
        },
        { role: 'user', content: query }
      ],
      search_recency_filter: 'year',
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

  const queries: string[] = [];

  if (tier === 'pro' || tier === 'agency') {
    const competitorNames = input.competitors?.map(c => c.name).join(', ') || 'principaux acteurs';
    queries.push(`Prix et tarifs de ${competitorNames} dans le secteur ${input.sector} en ${input.location.country} 2024 2025`);
    queries.push(`Tendances marché ${input.sector} ${input.location.country} 2025 2026 croissance prévisions`);
    queries.push(`Taille marché ${input.sector} ${input.location.country} TAM SAM milliards euros 2024 2025`);
    queries.push(`Benchmarks CAC LTV coût acquisition client ${input.sector} SaaS B2B B2C 2024`);
    queries.push(`${competitorNames} levée fonds employees chiffre affaires ${input.sector}`);
  }

  if (tier === 'agency') {
    queries.push(`Analyse PESTEL ${input.sector} ${input.location.country} réglementation politique économie 2024 2025`);
    queries.push(`Analyse Porter 5 forces ${input.sector} barrières entrée pouvoir négociation fournisseurs clients`);
    queries.push(`Innovation technologique disruption ${input.sector} IA automatisation 2025 startups`);
    queries.push(`Actualités récentes ${input.sector} ${input.location.country} acquisitions lancements 2024`);
    queries.push(`Unit economics ${input.sector} marge brute gross margin payback period benchmarks`);
  }

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

    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

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

  prompt += getJsonSchema(plan);

  return prompt;
}

function getJsonSchema(plan: TierType): string {
  if (plan === "agency") {
    return `

<json_schema>
{
  "report_metadata": { "title": "string", "generated_date": "YYYY-MM-DD", "business_name": "string", "sector": "string", "location": "string", "tier": "agency", "sources_count": number },
  
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
// CLAUDE OPUS 4.5 API CALL WITH RETRY LOGIC
// ============================================
async function callClaudeOpus(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number,
  maxRetries: number = 3
): Promise<string> {
  const modelName = USE_HAIKU_FOR_TESTING ? "Haiku 4.5 (TEST MODE)" : "Opus 4.5";
  console.log(`[Claude] Calling ${modelName} (${CLAUDE_MODEL}) with ${maxTokens} max tokens`);
  console.log(`[Claude] Prompt length: ${userPrompt.length} chars`);

  // Reduce max_tokens for Haiku to speed up response
  const effectiveMaxTokens = USE_HAIKU_FOR_TESTING ? Math.min(maxTokens, 8000) : maxTokens;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Create an AbortController for timeout
    // Haiku is much faster, use shorter timeout
    const timeoutMs = USE_HAIKU_FOR_TESTING ? 120000 : 300000; // 2 min for Haiku, 5 min for Opus
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Claude] Request timeout after ${timeoutMs/1000}s (attempt ${attempt})`);
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: effectiveMaxTokens,
          temperature: temperature,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Claude] API error ${response.status} (attempt ${attempt}):`, errorText);
        
        // Rate limit - retry with exponential backoff
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 30000; // 30s, 60s, 120s
          console.log(`[Claude] Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Rate limit exceeded after all retries. Please try again in a few minutes.");
          break;
        }
        
        // Overloaded - retry with backoff
        if (response.status === 529) {
          const waitTime = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s
          console.log(`[Claude] API overloaded. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          lastError = new Error("Claude API overloaded after all retries. Please retry later.");
          break;
        }
        
        if (response.status === 401) throw new Error("Invalid Claude API key");
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Claude] Response received, stop_reason: ${data.stop_reason}`);

      let content = "";
      for (const block of data.content) {
        if (block.type === "text") {
          content += block.text;
        }
      }

      console.log(`[Claude] Content length: ${content.length} chars`);
      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error("Claude API request timed out after 5 minutes");
        if (attempt < maxRetries) {
          console.log(`[Claude] Timeout. Retrying ${attempt}/${maxRetries}...`);
          continue;
        }
        break;
      }
      
      lastError = error as Error;
      break;
    }
  }

  throw lastError || new Error("Claude API call failed after all retries");
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
    const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
    if (!CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is not configured");
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY && (plan === "pro" || plan === "agency")) {
      throw new Error("PERPLEXITY_API_KEY is required for Pro and Agency tiers");
    }

    const tierConfig = TIER_CONFIG[plan];
    const reportLang = inputData.reportLanguage || 'fr';

    console.log(`[${reportId}] Starting report generation`);
    console.log(`[${reportId}] Tier: ${plan} | Model: ${CLAUDE_MODEL} | Language: ${reportLang}`);

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
    let userPrompt = buildUserPrompt(inputData, plan, researchData);
    
    // Add strict JSON enforcement for Haiku model (it tends to ask clarifying questions)
    if (USE_HAIKU_FOR_TESTING) {
      userPrompt += `

═══════════════════════════════════════════════════════════════════════════════
⚠️ INSTRUCTION ABSOLUE - À SUIVRE IMMÉDIATEMENT ⚠️
═══════════════════════════════════════════════════════════════════════════════

TU DOIS GÉNÉRER LE JSON MAINTENANT. NE POSE AUCUNE QUESTION.
TU AS TOUTES LES INFORMATIONS NÉCESSAIRES CI-DESSUS.

RÈGLES STRICTES:
1. RETOURNE UNIQUEMENT UN OBJET JSON VALIDE
2. NE COMMENCE PAS PAR "Je comprends" ou "Avant de générer" ou toute autre phrase
3. COMMENCE DIRECTEMENT PAR L'ACCOLADE OUVRANTE: {
4. TERMINE PAR L'ACCOLADE FERMANTE: }
5. PAS DE COMMENTAIRES, PAS DE QUESTIONS, PAS DE TEXTE EXPLICATIF

SI TU NE GÉNÈRES PAS DE JSON IMMÉDIATEMENT, L'UTILISATEUR PERD SON ARGENT.

GÉNÈRE LE JSON MAINTENANT:`;
    }

    // Step 3: Call analysis engine
    await updateProgress(supabaseAdmin, reportId, "Analyse stratégique en cours...", 55);

    const systemPrompt = tierConfig.system_prompt(reportLang);
    const content = await callClaudeOpus(
      CLAUDE_API_KEY,
      systemPrompt,
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
    console.log(`[${reportId}] Tier: ${plan} | Sources: ${outputData?.sources?.length || 0}`);

    // Step 6: Generate PDF
    await updateProgress(supabaseAdmin, reportId, "Génération du PDF...", 95);

    try {
      const pdfResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ reportId }),
      });

      if (!pdfResponse.ok) {
        console.error(`[${reportId}] PDF generation failed: ${pdfResponse.status}`);
      } else {
        console.log(`[${reportId}] ✅ PDF generated successfully`);
      }
    } catch (pdfError) {
      console.error(`[${reportId}] PDF generation error:`, pdfError);
      // Don't fail the report if PDF fails
    }

    // Final update
    await supabaseAdmin
      .from("reports")
      .update({
        processing_step: "Rapport prêt",
        processing_progress: 100
      } as Record<string, unknown>)
      .eq("id", reportId);

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
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const reportId = body.reportId;

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

    // Check if already processing or ready
    if (report.status === "processing") {
      return new Response(JSON.stringify({ success: true, message: "Report already processing", reportId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
