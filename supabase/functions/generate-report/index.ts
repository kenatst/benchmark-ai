// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
// @ts-ignore - Deno import
import { z } from "https://esm.sh/zod@3.23.8";

// FORCE REDEPLOY: 2026-02-07 - Replace Perplexity with GPT-5.2 web_search_preview, fix checkout
// Import shared constants (eliminates CORS header duplication across 10+ functions)
// @ts-ignore - Deno import
import { corsHeaders, getAuthContext } from "../_shared.ts";

// ============================================
// GPT-5.2 MODEL - SOLE ANALYSIS + SEARCH ENGINE
// ============================================
// All analysis + web research powered by GPT-5.2 via OpenAI /v1/responses endpoint
// Uses built-in web_search_preview tool for live market data (replaces Perplexity)

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
// SECTION PLANS (by tier) - BENCHMARK-QUALITY STRUCTURE
// ============================================
// Based on reference benchmark: 17-page Pro report with tables, scoring matrices,
// detailed competitor profiles, 30/60/90 roadmap, and budget projections.
type SectionPlanItem = {
  key: string;
  label: string;
  valueType: 'object' | 'array';
  jsonHint?: string; // Specific JSON structure hints for each section
};

const SECTION_PLANS: Record<TierType, SectionPlanItem[]> = {
  // ===== STANDARD (14.99€): ~8-10 pages PDF, essential benchmark =====
  standard: [
    { 
      key: "executive_summary", 
      label: "Résumé exécutif", 
      valueType: "object",
      jsonHint: `{
        "headline": "Phrase d'accroche du marché",
        "contexte_enjeux": "2-3 phrases sur le marché et enjeux",
        "constats_cles": ["constat1", "constat2", "constat3", "constat4"],
        "recommandation_principale": "Positionnement recommandé avec ticket moyen cible",
        "indicateurs_rentabilite": {
          "investissement_initial": "300 000 - 400 000 €",
          "ca_annuel_cible": "500 000 - 800 000 €",
          "marge_brute_cible": "60-65%",
          "marge_nette_cible": "15-20%",
          "seuil_rentabilite": "description courte",
          "roi_estime": "24-36 mois"
        }
      }`
    },
    { 
      key: "market_context", 
      label: "Panorama marché", 
      valueType: "object",
      jsonHint: `{
        "chiffres_cles": [
          { "indicateur": "CA marché", "valeur": "8,8 milliards €", "source": "EPSIMAS 2024" },
          { "indicateur": "Croissance 5 ans", "valeur": "+33%", "source": "..." }
        ],
        "structure_concurrentielle": "Texte sur leaders et parts de marché",
        "segmentation": [
          { "segment": "Fast-food", "prix_moyen": "5,70€", "marge_brute": "45-55%", "exemples": "McDonald's, BK" }
        ]
      }`
    },
    { 
      key: "competitive_landscape", 
      label: "Analyse concurrentielle", 
      valueType: "object",
      jsonHint: `{
        "competitors": [
          {
            "name": "Concurrent 1",
            "positionnement": "Description positionnement",
            "points_forts": ["atout1", "atout2"],
            "faiblesses": ["faiblesse1"],
            "prix": "Fourchette prix",
            "score_global": 8.2
          }
        ],
        "opportunites_identifiees": ["opportunité1", "opportunité2"]
      }`
    },
    { 
      key: "positioning_recommendations", 
      label: "Positionnement recommandé", 
      valueType: "object",
      jsonHint: `{
        "option_recommandee": {
          "nom": "Option A - Description courte",
          "description": "Détail du positionnement",
          "ticket_moyen_cible": "15-18€",
          "differenciateurs": ["diff1", "diff2"]
        },
        "taglines_suggerees": ["tagline1", "tagline2"],
        "emplacement_recommande": "Description zone géographique prioritaire"
      }`
    },
    { 
      key: "pricing_strategy", 
      label: "Stratégie tarifaire", 
      valueType: "object",
      jsonHint: `{
        "prix_psychologique_marche": "9,32€ max accepté",
        "positionnement_prix_recommande": "Description",
        "grille_tarifaire_suggeree": [
          { "produit": "Produit phare", "prix_suggere": "12-15€", "marge_estimee": "60%" }
        ],
        "modele_economique": {
          "food_cost_cible": "25-30%",
          "charges_personnel": "30-35%",
          "loyer_charges": "8-12%",
          "coefficient_multiplicateur": "x4 plats, x5-7 boissons"
        }
      }`
    },
    { 
      key: "action_plan", 
      label: "Plan d'action 30/60/90", 
      valueType: "object",
      jsonHint: `{
        "j1_j30": {
          "titre": "Validation et préparation",
          "actions": ["action1", "action2", "action3"],
          "kpi": "KPI de fin de phase"
        },
        "j31_j60": {
          "titre": "Installation",
          "actions": ["action1", "action2"],
          "kpi": "KPI de fin de phase"
        },
        "j61_j90": {
          "titre": "Lancement",
          "actions": ["action1", "action2"],
          "kpi": "KPI de fin de phase"
        }
      }`
    },
    { key: "risks_and_considerations", label: "Risques & considérations", valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", valueType: "array" },
    { key: "next_steps_to_validate", label: "Prochaines validations", valueType: "array" },
    { key: "sources", label: "Sources", valueType: "array" },
  ],

  // ===== PRO (34.99€): ~15-18 pages PDF, full benchmark like reference doc =====
  pro: [
    { 
      key: "executive_summary", 
      label: "1. Executive Summary", 
      valueType: "object",
      jsonHint: `{
        "contexte_enjeux": "Paragraphe sur le marché et enjeux clés",
        "constats_cles": [
          "Marché en phase de maturité : croissance ralentie, concurrence intense",
          "Prix psychologique en baisse : les consommateurs acceptent max X€",
          "Segment premium en croissance : ticket moyen X€ vs Y€ en fast-food",
          "Tendances fortes : liste des tendances clés"
        ],
        "recommandation_principale": "Positionnement recommandé avec détails (différenciation, ticket moyen cible, emplacement)",
        "indicateurs_rentabilite": [
          { "indicateur": "Investissement initial", "valeur_cible": "300 000 - 400 000 €" },
          { "indicateur": "CA annuel (année 2)", "valeur_cible": "500 000 - 800 000 €" },
          { "indicateur": "Marge brute cible", "valeur_cible": "60-65%" },
          { "indicateur": "Marge nette cible", "valeur_cible": "15-20%" },
          { "indicateur": "Seuil de rentabilité", "valeur_cible": "X unités/jour minimum" },
          { "indicateur": "ROI estimé", "valeur_cible": "24-36 mois" }
        ]
      }`
    },
    { 
      key: "methodology", 
      label: "2. Méthodologie", 
      valueType: "object",
      jsonHint: `{
        "perimetre_etude": {
          "zone_geographique": "Zone primaire (détail), zone secondaire, contexte national",
          "periode": "Données 2024-2026",
          "segments_analyses": ["segment1", "segment2"]
        },
        "sources_mobilisees": {
          "sources_primaires": ["INSEE", "Études sectorielles officielles"],
          "sources_secondaires": ["Plateformes avis", "Observatoires"]
        },
        "grille_evaluation": [
          { "dimension": "Qualité produit", "ponderation_standard": "30%", "ponderation_equilibree": "25%", "ponderation_performance": "20%" }
        ],
        "limites_biais": ["Biais de survie", "Variabilité des sources", "Données locales limitées"]
      }`
    },
    { 
      key: "market_overview", 
      label: "3. Panorama du marché", 
      valueType: "object",
      jsonHint: `{
        "chiffres_cles": [
          { "indicateur": "CA marché (segment)", "valeur": "X milliards €", "annee": "2024", "source": "..." },
          { "indicateur": "Part de marché", "valeur": "> X%", "source": "..." },
          { "indicateur": "Croissance 5 ans", "valeur": "+X%", "source": "..." },
          { "indicateur": "Consommation annuelle", "valeur": "X unités", "source": "..." },
          { "indicateur": "Prix psychologique max", "valeur": "X€", "source": "..." },
          { "indicateur": "Ticket moyen segment", "valeur": "X€", "source": "..." }
        ],
        "structure_concurrentielle": "Description des leaders et parts de marché",
        "segmentation_marche": [
          { "segment": "Nom segment", "prix_moyen": "X€", "marge_brute": "X-Y%", "exemples": "..." }
        ]
      }`
    },
    { 
      key: "territory_analysis", 
      label: "4. Analyse du territoire", 
      valueType: "object",
      jsonHint: `{
        "donnees_demographiques": [
          { "indicateur": "Population", "valeur": "X habitants", "source": "INSEE" },
          { "indicateur": "Rang/classement", "valeur": "...", "source": "..." },
          { "indicateur": "Revenu médian", "valeur": "X€/an", "source": "..." },
          { "indicateur": "Profil population", "valeur": "ratio cadres/employés, ménages", "source": "..." }
        ],
        "immobilier_commercial": [
          { "indicateur": "Loyer moyen", "valeur": "X€/m²/an" },
          { "indicateur": "Fourchette loyers", "valeur": "X - Y €/m²/an" },
          { "indicateur": "Prix achat murs", "valeur": "X€/m²" }
        ],
        "poles_commerciaux": [
          { "nom": "Zone 1", "caracteristiques": "fort flux, loyers X", "opportunite": "..." }
        ],
        "concurrence_locale": ["Concurrent local 1 (note X)", "Concurrent local 2"]
      }`
    },
    { 
      key: "competitive_intelligence", 
      label: "5. Benchmark concurrentiel détaillé", 
      valueType: "object",
      jsonHint: `{
        "enseignes_reference": [
          {
            "name": "Concurrent 1",
            "positionnement": "Description du positionnement",
            "points_forts": ["atout1", "atout2", "atout3"],
            "prix": "Fourchette X-Y€, formule Z€",
            "faiblesses": ["faiblesse1"],
            "reseau": "X restaurants, CA X€"
          }
        ],
        "enseignes_specialisees": [
          {
            "name": "Concurrent spécialisé",
            "positionnement": "...",
            "points_forts": ["..."],
            "prix": "...",
            "investissement_franchise": "X€ si applicable"
          }
        ]
      }`
    },
    { 
      key: "scoring_matrix", 
      label: "6. Matrice comparative et scoring", 
      valueType: "object",
      jsonHint: `{
        "matrice_multicriteres": [
          {
            "critere": "Qualité produit",
            "scores": { "concurrent1": 9, "concurrent2": 8, "concurrent3": 7 }
          }
        ],
        "scores_moyens": { "concurrent1": 8.2, "concurrent2": 7.5 },
        "analyse_sensibilite": {
          "modele_conservateur": ["1er: X", "2ème: Y"],
          "modele_equilibre": ["1er: X", "2ème: Y"],
          "modele_performance": ["1er: X", "2ème: Y"]
        },
        "interpretation": "Texte d'analyse des scores",
        "opportunites_marche_local": ["Niche 1 non couverte", "Segment 2 sous-représenté"]
      }`
    },
    { 
      key: "trends_analysis", 
      label: "7. Analyse des tendances", 
      valueType: "object",
      jsonHint: `{
        "tendances_produit": ["tendance1 avec données", "tendance2"],
        "tendances_service": ["livraison: projection X%", "digitalisation"],
        "tendances_consommateur": ["prix psychologique en baisse", "génération Z préfère..."],
        "tendances_a_surveiller": ["tendance émergente 1", "tendance 2"]
      }`
    },
    { 
      key: "strategic_recommendations", 
      label: "8. Recommandations stratégiques", 
      valueType: "object",
      jsonHint: `{
        "options_positionnement": [
          {
            "option": "A",
            "nom": "Option conservatrice",
            "description": "Détail du concept",
            "differenciateurs": ["diff1", "diff2"],
            "ticket_moyen": "15-18€"
          },
          {
            "option": "B",
            "nom": "Option équilibrée",
            "description": "...",
            "ticket_moyen": "13-16€"
          },
          {
            "option": "C",
            "nom": "Option ambitieuse",
            "description": "...",
            "ticket_moyen": "12-15€"
          }
        ],
        "emplacement_recommande": {
          "priorite_1": { "zone": "Zone 1", "caracteristiques": "...", "loyers": "X€/m²" },
          "priorite_2": { "zone": "Zone 2", "caracteristiques": "..." },
          "surface_recommandee": "X-Y m²",
          "budget_loyer_cible": "X-Y€/mois"
        },
        "modele_economique_cible": [
          { "poste": "Coût matières", "objectif": "25-30%" },
          { "poste": "Charges personnel", "objectif": "30-35%" },
          { "poste": "Loyer + charges", "objectif": "8-12%" },
          { "poste": "Marge brute", "objectif": "60-65%" },
          { "poste": "Marge nette", "objectif": "15-20%" }
        ],
        "points_attention": ["Point critique 1", "Point critique 2"]
      }`
    },
    { 
      key: "roadmap", 
      label: "9. Roadmap de mise en œuvre", 
      valueType: "object",
      jsonHint: `{
        "plan_30_60_90": {
          "j1_j30": {
            "titre": "Validation et préparation",
            "actions": ["Finalisation concept", "Recherche local (visiter X emplacements)", "Montage financier"],
            "kpi": "local identifié, financement validé"
          },
          "j31_j60": {
            "titre": "Installation",
            "actions": ["Signature bail", "Travaux (prévoir X mois)", "Recrutement équipe"],
            "kpi": "travaux lancés, équipe recrutée"
          },
          "j61_j90": {
            "titre": "Lancement",
            "actions": ["Tests et formation", "Communication pré-ouverture", "Soft opening"],
            "kpi": "ouverture réalisée, premiers retours"
          }
        },
        "kpi_suivi_annee1": [
          { "indicateur": "CA mensuel", "objectif_m6": "X€", "objectif_m12": "Y€" },
          { "indicateur": "Couverts/jour", "objectif_m6": "X", "objectif_m12": "Y" },
          { "indicateur": "Ticket moyen", "objectif_m6": "X€", "objectif_m12": "Y€" }
        ],
        "budget_previsionnel": [
          { "poste": "Droit au bail", "montant": "50 000 - 150 000 €" },
          { "poste": "Travaux", "montant": "80 000 - 150 000 €" },
          { "poste": "Équipements", "montant": "40 000 - 70 000 €" },
          { "poste": "TOTAL", "montant": "230 000 - 485 000 €" }
        ],
        "apport_recommande": "30% minimum du total"
      }`
    },
    { 
      key: "appendices", 
      label: "10. Annexes", 
      valueType: "object",
      jsonHint: `{
        "glossaire": [
          { "terme": "Food cost", "definition": "Coût matières premières / prix de vente" }
        ],
        "sources_bibliographie": {
          "donnees_marche": ["Source 1", "Source 2"],
          "donnees_territoriales": ["INSEE", "..."],
          "sources_sectorielles": ["..."]
        },
        "assumptions_log": ["Hypothèse 1 (les tendances nationales sont applicables)", "Hypothèse 2"],
        "incertitudes": ["Ce que nous ne savons pas 1", "Ce que nous ne savons pas 2"],
        "plan_reduction_incertitude": ["Action 1 (visite terrain)", "Action 2 (veille concurrentielle)"]
      }`
    },
    { key: "sources", label: "Sources", valueType: "array" },
  ],

  // ===== AGENCY (69.99€): ~25-30 pages PDF, institutional-grade report =====
  agency: [
    { 
      key: "executive_summary", 
      label: "1. Executive Summary", 
      valueType: "object",
      jsonHint: `{
        "contexte_enjeux": "Paragraphe institutionnel sur le marché et enjeux",
        "constats_cles": ["5-7 constats clés quantifiés"],
        "recommandation_principale": "Positionnement détaillé avec justification",
        "indicateurs_rentabilite": [
          { "indicateur": "...", "valeur_cible": "...", "hypotheses": "..." }
        ],
        "facteurs_critiques_succes": ["FCS 1", "FCS 2", "FCS 3"]
      }`
    },
    { key: "methodology", label: "2. Méthodologie", valueType: "object" },
    { key: "market_overview_detailed", label: "3. Panorama marché détaillé", valueType: "object" },
    { key: "territory_analysis", label: "4. Analyse territoriale micro-locale", valueType: "object" },
    { 
      key: "market_analysis", 
      label: "5. Analyse stratégique (PESTEL/Porter)", 
      valueType: "object",
      jsonHint: `{
        "pestel": {
          "politique": "...",
          "economique": "...",
          "social": "...",
          "technologique": "...",
          "environnemental": "...",
          "legal": "..."
        },
        "porter_5_forces": {
          "rivalite_concurrentielle": { "intensite": "Élevée", "score": 8, "details": "..." },
          "pouvoir_fournisseurs": { "intensite": "Moyenne", "score": 5, "details": "..." },
          "pouvoir_clients": { "intensite": "...", "score": 7, "details": "..." },
          "menace_substituts": { "intensite": "...", "score": 6, "details": "..." },
          "menace_nouveaux_entrants": { "intensite": "...", "score": 5, "details": "..." }
        }
      }`
    },
    { key: "competitive_intelligence", label: "6. Benchmark concurrentiel exhaustif", valueType: "object" },
    { 
      key: "scoring_matrix", 
      label: "7. Matrice de scoring avec sensibilité", 
      valueType: "object",
      jsonHint: `{
        "matrice_multicriteres": [...],
        "analyse_sensibilite": {
          "scenario_conservateur": {...},
          "scenario_equilibre": {...},
          "scenario_agressif": {...}
        },
        "interpretation_strategique": "..."
      }`
    },
    { key: "trends_analysis", label: "8. Tendances sectorielles", valueType: "object" },
    { 
      key: "swot_analysis", 
      label: "9. Analyse SWOT", 
      valueType: "object",
      jsonHint: `{
        "forces": ["force1", "force2"],
        "faiblesses": ["faiblesse1", "faiblesse2"],
        "opportunites": ["opportunite1", "opportunite2"],
        "menaces": ["menace1", "menace2"],
        "strategies_so": ["Stratégie exploitant Forces + Opportunités"],
        "strategies_wo": ["Stratégie minimisant Faiblesses via Opportunités"],
        "strategies_st": ["Stratégie utilisant Forces contre Menaces"],
        "strategies_wt": ["Stratégie défensive Faiblesses + Menaces"]
      }`
    },
    { key: "customer_intelligence", label: "10. Intelligence client", valueType: "object" },
    { key: "strategic_recommendations", label: "11. Recommandations stratégiques", valueType: "object" },
    { 
      key: "financial_projections", 
      label: "12. Projections financières 3 ans", 
      valueType: "object",
      jsonHint: `{
        "hypotheses_cles": ["hypothèse1", "hypothèse2"],
        "compte_resultat_previsionnel": {
          "annee_1": { "ca": "X€", "marge_brute": "X%", "resultat_net": "X€" },
          "annee_2": { "ca": "X€", "marge_brute": "X%", "resultat_net": "X€" },
          "annee_3": { "ca": "X€", "marge_brute": "X%", "resultat_net": "X€" }
        },
        "scenarios": {
          "pessimiste": { "ca_annee_2": "X€", "hypothese": "..." },
          "realiste": { "ca_annee_2": "X€", "hypothese": "..." },
          "optimiste": { "ca_annee_2": "X€", "hypothese": "..." }
        },
        "unit_economics": {
          "cout_acquisition_client": "X€",
          "valeur_vie_client": "X€",
          "ratio_ltv_cac": "X:1"
        },
        "seuil_rentabilite": { "unites_jour": "X", "ca_mensuel": "X€" }
      }`
    },
    { key: "detailed_roadmap", label: "13. Roadmap détaillée 12 mois", valueType: "object" },
    { 
      key: "risk_register", 
      label: "14. Registre des risques", 
      valueType: "array",
      jsonHint: `[
        {
          "id": "R1",
          "risque": "Description du risque",
          "probabilite": "Élevée/Moyenne/Faible",
          "impact": "Élevé/Moyen/Faible",
          "score": 8,
          "mitigation": "Plan d'atténuation",
          "responsable": "Rôle responsable"
        }
      ]`
    },
    { key: "appendices", label: "15. Annexes", valueType: "object" },
    { key: "assumptions_and_limitations", label: "Hypothèses & limites", valueType: "array" },
    { key: "sources", label: "Sources", valueType: "array" },
  ],
};

// ============================================
// TIER CONFIGURATION - BENCHMARK-QUALITY PROMPTS
// ============================================
const TIER_CONFIG = {
  standard: {
    max_tokens: 4000,
    temperature: 0.3,
    section_plan: SECTION_PLANS.standard,
    section_system_prompt: (lang: string) => `Tu es un consultant stratégique senior. Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.

MISSION: Produire UNE section de benchmark concurrentiel en JSON valide, de qualité professionnelle.

RÈGLES CRITIQUES:
1. SPÉCIFIQUE au secteur et localisation du client - pas de généralités
2. QUANTIFIÉ: prix en €, pourcentages, scores /10, délais
3. ACTIONNABLE: chaque insight doit mener à une décision
4. Donnée inconnue = "non disponible" (3 mots max)
5. Format: tableaux de données structurées quand pertinent

STRUCTURE JSON: Respecte exactement le hint de structure fourni.
RETOURNE UNIQUEMENT LE JSON, aucun texte avant/après.`,
    system_prompt: (lang: string) => `Consultant stratégique senior. Benchmark concurrentiel professionnel.
Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}. JSON VALIDE UNIQUEMENT.`,
  },

  pro: {
    max_tokens: 5000,
    temperature: 0.25,
    section_plan: SECTION_PLANS.pro,
    section_system_prompt: (lang: string) => `Tu es un consultant stratégique tier-1 (McKinsey/BCG level). Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.

MISSION: Produire UNE section d'un rapport d'intelligence compétitive premium (~15-18 pages total), avec la qualité d'un cabinet de conseil.

EXIGENCES BENCHMARK RÉFÉRENCE:
1. TABLEAUX DE DONNÉES: Chiffres clés, scoring matrices, budgets prévisionnels
2. PROFILS CONCURRENTS DÉTAILLÉS: Positionnement, forces, faiblesses, prix, réseau
3. MATRICE DE SCORING: Notes /10 par critère, analyse de sensibilité 3 scénarios
4. DONNÉES TERRITORIALES: Population, revenus, immobilier commercial, pôles
5. ROADMAP 30/60/90: Actions concrètes avec KPIs de fin de phase
6. BUDGET PRÉVISIONNEL: Postes détaillés avec fourchettes €

RÈGLES JSON:
- Respecte EXACTEMENT la structure hint fournie
- Tableaux = arrays d'objets avec clés cohérentes
- Scores /10, prix en €, pourcentages, sources citées
- Donnée inconnue = "non disponible"

RETOURNE UNIQUEMENT LE JSON VALIDE.`,
    system_prompt: (lang: string) => `Consultant tier-1 McKinsey/BCG. Rapport premium 15-18 pages.
Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}. JSON VALIDE UNIQUEMENT.`,
  },

  agency: {
    max_tokens: 6000,
    temperature: 0.2,
    section_plan: SECTION_PLANS.agency,
    section_system_prompt: (lang: string) => `Tu es un Senior Partner de cabinet de conseil stratégique (McKinsey/BCG/Bain). Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}.

MISSION: Produire UNE section d'un rapport institutionnel (~25-30 pages total), destiné à des investisseurs ou comités de direction.

STANDARDS INSTITUTIONNELS:
1. FRAMEWORKS STRATÉGIQUES: PESTEL complet, Porter 5 forces avec scores, SWOT avec stratégies croisées
2. ANALYSE MICRO-LOCALE: Données territoire au niveau quartier, flux piétons, loyers par zone
3. SCORING MATRICIEL: Multi-critères avec 3 pondérations (conservateur/équilibré/performance)
4. PROJECTIONS FINANCIÈRES 3 ANS: P&L prévisionnel, 3 scénarios, unit economics, seuil rentabilité
5. REGISTRE DES RISQUES: ID, description, probabilité/impact, score, plan mitigation
6. SOURCES PRIMAIRES: Citations avec URLs, données officielles (INSEE, études sectorielles)

EXIGENCES DE RIGUEUR:
- Répondre systématiquement à "So what?" et "Now what?" pour chaque insight
- Quantifier: €, %, scores /10, délais, ratios
- Citer les sources pour chaque fait majeur
- Distinguer "estimation" vs "donnée vérifiée"

RETOURNE UNIQUEMENT LE JSON VALIDE, structure exacte du hint.`,
    system_prompt: (lang: string) => `Senior Partner conseil stratégique. Rapport institutionnel 25-30 pages.
Langue: ${LANGUAGE_CONFIG[lang]?.name || 'Français'}. JSON VALIDE UNIQUEMENT.`,
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
// SECTION GENERATION - BENCHMARK-QUALITY
// ============================================
function estimateMaxTokens(sectionKey: string, tierMaxTokens: number): number {
  // Token budgets calibrated for benchmark-quality output:
  // - Large sections: detailed competitor profiles, financial projections, roadmaps
  // - Medium sections: market overview, scoring matrices, territory analysis
  // - Small sections: executive summary, sources, assumptions
  
  const largeSections = new Set([
    'competitive_intelligence', 'strategic_recommendations', 'market_analysis',
    'financial_projections', 'competitive_landscape', 'market_overview_detailed',
    'customer_intelligence', 'detailed_roadmap', 'roadmap', 'appendices',
    'scoring_matrix', 'market_overview', 'territory_analysis',
  ]);
  const mediumSections = new Set([
    'market_context', 'methodology', 'trends_analysis',
    'swot_analysis', 'positioning_recommendations', 'pricing_strategy',
    'action_plan', 'customer_insights', 'risk_register',
  ]);

  // Agency tier gets higher budgets for institutional quality
  const tierBonus = tierMaxTokens >= 6000 ? 1000 : tierMaxTokens >= 5000 ? 500 : 0;

  if (largeSections.has(sectionKey)) return 4500 + tierBonus;
  if (mediumSections.has(sectionKey)) return 3500 + tierBonus;
  return 2500;
}

function buildSectionPrompt(
  reportBrief: string,
  section: SectionPlanItem,
  existingSection?: unknown
): string {
  const expandNote = existingSection
    ? `ENRICHIR la section existante avec plus de détails. Ne rien supprimer.`
    : `Générer la section complète avec tous les détails demandés.`;

  const existingJson = existingSection
    ? `\nCONTENU EXISTANT À ENRICHIR:\n${JSON.stringify({ [section.key]: existingSection }).substring(0, 2000)}\n`
    : "";

  // Use the jsonHint if available for structured output
  const structureHint = section.jsonHint 
    ? `\nSTRUCTURE JSON ATTENDUE:\n${section.jsonHint}\n`
    : "";

  return `${reportBrief}

<section>
SECTION À GÉNÉRER: ${section.label} (clé JSON: "${section.key}")
${expandNote}

EXIGENCES QUALITÉ BENCHMARK:
1. Clé racine UNIQUE: "${section.key}"
2. DONNÉES CHIFFRÉES: prix en €, pourcentages, scores /10, délais, fourchettes
3. TABLEAUX: utilise des arrays d'objets avec clés cohérentes pour les données comparatives
4. SOURCES: cite les sources pour les faits majeurs (INSEE, études sectorielles, sites officiels)
5. SPÉCIFIQUE: adapté au secteur et localisation exacts du client, pas de généralités
6. Donnée non trouvée = "non disponible" (ne jamais inventer)
${structureHint}
RETOURNE UNIQUEMENT LE JSON VALIDE, aucun texte avant/après.
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
// WEB RESEARCH VIA GPT-5.2 web_search_preview
// ============================================
// Uses GPT-5.2's built-in web search tool to gather live market data
// before generating report sections. Same API key, no Perplexity needed.

interface WebResearchResult {
  summary: string;
  sources: Array<{ title: string; url: string }>;
}

async function performWebResearch(
  apiKey: string,
  input: ReportInput,
  plan: TierType,
  reportId: string,
): Promise<WebResearchResult> {
  const lang = input.reportLanguage || 'fr';
  const langName = LANGUAGE_CONFIG[lang]?.name || 'Français';

  const competitorNames = input.competitors?.map(c => c.name).join(', ') || 'concurrents principaux du secteur';
  const location = [input.location?.city, input.location?.country].filter(Boolean).join(', ') || 'marché national';

  // Enhanced search prompt based on reference benchmark structure
  const tierContext = plan === 'agency' 
    ? 'rapport institutionnel avec données officielles (INSEE, études sectorielles, rapports annuels)'
    : plan === 'pro' 
      ? 'benchmark premium avec scoring concurrentiel et données territoriales'
      : 'benchmark concurrentiel avec chiffres marché';

  const searchPrompt = `Tu prépares un ${tierContext} en ${langName}.

CONTEXTE CLIENT:
- Entreprise: ${input.businessName}
- Secteur: ${input.sector}${input.sectorDetails ? ` - ${input.sectorDetails}` : ''}
- Localisation: ${location}
- Concurrents identifiés: ${competitorNames}
- Fourchette prix: ${input.priceRange?.min}€ - ${input.priceRange?.max}€

RECHERCHE LES DONNÉES SUIVANTES:
1. CHIFFRES MARCHÉ ${new Date().getFullYear()}:
   - Taille du marché ${input.sector} (CA en milliards €)
   - Parts de marché des leaders
   - Croissance annuelle (%)
   - Prix psychologique moyen accepté par les consommateurs

2. DONNÉES CONCURRENTS (${competitorNames}):
   - Prix/tarifs publics de chaque concurrent
   - Nombre de points de vente / réseau
   - CA annuel si disponible
   - Positionnement et forces/faiblesses

3. DONNÉES TERRITORIALES (${location}):
   - Population et revenus médians
   - Loyers commerciaux moyens (€/m²/an)
   - Principaux pôles commerciaux

4. TENDANCES SECTORIELLES:
   - 3-5 tendances majeures du secteur
   - Comportements consommateurs récents
   - Innovations produit/service

Réponds en JSON avec la structure suivante:
{
  "research": {
    "market_data": {
      "market_size": "X milliards € (source)",
      "market_share_leaders": "Leader 1: X%, Leader 2: Y%",
      "annual_growth": "+X% (période)",
      "average_price_accepted": "X€ (source)"
    },
    "competitor_data": [
      {"name": "...", "pricing": "X-Y€", "network": "X points de vente", "revenue": "X M€", "positioning": "...", "source_url": "..."}
    ],
    "territory_data": {
      "population": "X habitants",
      "median_income": "X€/an",
      "commercial_rent": "X€/m²/an",
      "key_commercial_zones": ["zone1", "zone2"]
    },
    "trends": ["tendance 1 avec données chiffrées", "tendance 2", "tendance 3"],
    "key_insights": ["insight actionnable 1", "insight 2"]
  }
}
Valeurs non trouvées = "non disponible". Cite les sources.`;

  // Token budget based on tier
  const maxTokens = plan === 'agency' ? 4000 : plan === 'pro' ? 3000 : 2000;

  try {
    console.log(`[${reportId}] Starting web research via GPT-5.2 web_search_preview (${maxTokens} tokens)...`);
    const startTime = Date.now();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "user",
            content: searchPrompt,
          }
        ],
        temperature: 0.15,
        max_output_tokens: maxTokens,
        text: { format: { type: "json_object" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[${reportId}] Web research API error ${response.status}: ${errorText.substring(0, 200)}`);
      return { summary: "", sources: [] };
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    console.log(`[${reportId}] Web research completed in ${duration}ms`);

    // Extract text content from the response
    const content = extractTextFromResponse(data);
    if (!content) {
      console.warn(`[${reportId}] Web research returned empty content`);
      return { summary: "", sources: [] };
    }

    // Extract URL citations from the response output
    const sources: Array<{ title: string; url: string }> = [];
    const anyData = data as any;
    if (Array.isArray(anyData.output)) {
      for (const item of anyData.output) {
        // web_search_call results contain URLs
        if (item?.type === 'web_search_call') {
          continue; // search call itself, skip
        }
        // Look for citations in message content
        if (Array.isArray(item?.content)) {
          for (const c of item.content) {
            if (c?.type === 'output_text' && Array.isArray(c?.annotations)) {
              for (const ann of c.annotations) {
                if (ann?.type === 'url_citation' && ann?.url) {
                  sources.push({
                    title: ann.title || ann.url,
                    url: ann.url,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Deduplicate sources
    const uniqueSources = Array.from(
      new Map(sources.map(s => [s.url, s])).values()
    );

    console.log(`[${reportId}] Web research: ${content.length} chars, ${uniqueSources.length} sources cited`);

    return {
      summary: content,
      sources: uniqueSources,
    };
  } catch (err) {
    console.warn(`[${reportId}] Web research failed (non-blocking):`, err instanceof Error ? err.message : err);
    return { summary: "", sources: [] };
  }
}

function buildResearchBlock(research: WebResearchResult): string {
  if (!research.summary) return "";

  // Parse the research JSON to build a comprehensive data block for sections
  try {
    const parsed = safeJsonParse(research.summary) as any;
    const r = parsed?.research;
    if (!r) return `\n<research_data>\n${research.summary.substring(0, 3000)}\n</research_data>`;

    const lines: string[] = [
      `DONNÉES WEB COLLECTÉES (GPT-5.2 web search, ${new Date().toISOString().split('T')[0]}):`,
      ""
    ];

    // Market data (new enhanced format)
    if (r.market_data) {
      lines.push("═══ DONNÉES MARCHÉ ═══");
      if (r.market_data.market_size) lines.push(`  Taille marché: ${r.market_data.market_size}`);
      if (r.market_data.market_share_leaders) lines.push(`  Parts de marché: ${r.market_data.market_share_leaders}`);
      if (r.market_data.annual_growth) lines.push(`  Croissance: ${r.market_data.annual_growth}`);
      if (r.market_data.average_price_accepted) lines.push(`  Prix moyen accepté: ${r.market_data.average_price_accepted}`);
      lines.push("");
    }

    // Competitor data (new enhanced format)
    if (Array.isArray(r.competitor_data) && r.competitor_data.length > 0) {
      lines.push("═══ DONNÉES CONCURRENTS ═══");
      for (const cp of r.competitor_data.slice(0, 10)) {
        const details = [cp.pricing, cp.network, cp.revenue].filter(Boolean).join(' | ');
        lines.push(`  ${cp.name}: ${details}`);
        if (cp.positioning) lines.push(`    → Positionnement: ${cp.positioning}`);
        if (cp.source_url) lines.push(`    [Source: ${cp.source_url}]`);
      }
      lines.push("");
    }

    // Territory data (new)
    if (r.territory_data) {
      lines.push("═══ DONNÉES TERRITORIALES ═══");
      if (r.territory_data.population) lines.push(`  Population: ${r.territory_data.population}`);
      if (r.territory_data.median_income) lines.push(`  Revenu médian: ${r.territory_data.median_income}`);
      if (r.territory_data.commercial_rent) lines.push(`  Loyer commercial: ${r.territory_data.commercial_rent}`);
      if (Array.isArray(r.territory_data.key_commercial_zones)) {
        lines.push(`  Pôles commerciaux: ${r.territory_data.key_commercial_zones.join(', ')}`);
      }
      lines.push("");
    }

    // Legacy format support (competitor_pricing, market_size as separate fields)
    if (!r.competitor_data && Array.isArray(r.competitor_pricing) && r.competitor_pricing.length > 0) {
      lines.push("═══ PRIX CONCURRENTS ═══");
      for (const cp of r.competitor_pricing.slice(0, 8)) {
        lines.push(`  ${cp.name}: ${cp.pricing}${cp.source_url ? ` [${cp.source_url}]` : ''}`);
      }
      lines.push("");
    }

    if (!r.market_data?.market_size && r.market_size?.estimate && r.market_size.estimate !== 'non disponible') {
      lines.push(`TAILLE MARCHÉ: ${r.market_size.estimate}${r.market_size.source ? ` (${r.market_size.source})` : ''}`);
    }

    // Trends
    if (Array.isArray(r.trends) && r.trends.length > 0) {
      lines.push("═══ TENDANCES SECTORIELLES ═══");
      for (const trend of r.trends.slice(0, 6)) {
        lines.push(`  • ${trend}`);
      }
      lines.push("");
    }

    // Key insights
    if (Array.isArray(r.key_insights) && r.key_insights.length > 0) {
      lines.push("═══ INSIGHTS CLÉS ═══");
      for (const insight of r.key_insights.slice(0, 5)) {
        lines.push(`  → ${insight}`);
      }
      lines.push("");
    }

    // Legacy: key_facts
    if (!r.key_insights && Array.isArray(r.key_facts) && r.key_facts.length > 0) {
      lines.push("FAITS CLÉS: " + r.key_facts.slice(0, 5).join(" | "));
    }

    // Geographic insights (legacy)
    if (r.geographic_insights && r.geographic_insights !== 'non disponible') {
      lines.push(`GÉO: ${r.geographic_insights}`);
    }

    if (lines.length <= 2) return ""; // Only headers, no data

    return `\n<research_data>\n${lines.join("\n")}\n</research_data>`;
  } catch {
    // If JSON parsing fails, include raw summary (truncated)
    return `\n<research_data>\n${research.summary.substring(0, 2500)}\n</research_data>`;
  }
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

    // Step 1: Web research via GPT-5.2 built-in web_search_preview
    await updateProgress(supabaseAdmin, reportId, "Recherche web en cours...", 8);
    const webResearch = await performWebResearch(GPT52_API_KEY, inputData, plan, reportId);
    const researchBlock = buildResearchBlock(webResearch);

    // Step 2: Build report brief with research data
    await updateProgress(supabaseAdmin, reportId, "Analyse du brief client...", 12);
    const baseBrief = buildReportBrief(inputData, plan);
    const reportBrief = baseBrief + researchBlock;
    const tierConfig = TIER_CONFIG[plan];
    const sectionSystemPrompt = tierConfig.section_system_prompt(reportLang);

    console.log(`[${reportId}] Brief: ${reportBrief.length} chars (base: ${baseBrief.length}, research: ${researchBlock.length})`);
    console.log(`[${reportId}] Web research sources: ${webResearch.sources.length}`);
    console.log(`[${reportId}] Section system prompt: ${sectionSystemPrompt.length} chars`);

    // Step 3: Generate sections
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

    // Step 4: Assemble report metadata + normalize sources
    const userSources = buildUserSources(inputData);
    const modelSources = normalizeSources(outputSections.sources);
    const allSources = [...modelSources, ...webResearch.sources, ...userSources];
    const mergedSources = mergeSources(allSources, []);

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
    console.log(`[${reportId}] Tier: ${plan} | Word count: ${countWordsInObject(outputSections)} | Sources: ${mergedSources.length}`);

    // Step 6: Generate PDF
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
