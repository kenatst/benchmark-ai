import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// INSTITUTIONAL COLOR PALETTE - McKinsey / BCG Inspired
// ============================================================================
const COLORS = {
  // Primary palette - Deep, sophisticated tones
  BLACK: rgb(0.08, 0.08, 0.10),           // #141418 - Near black for text
  CHARCOAL: rgb(0.18, 0.18, 0.20),        // #2E2E33 - Dark headers
  SLATE: rgb(0.35, 0.37, 0.40),           // #5A5E66 - Secondary text
  STONE: rgb(0.55, 0.57, 0.60),           // #8C9199 - Tertiary text
  SILVER: rgb(0.88, 0.89, 0.90),          // #E1E3E6 - Borders, dividers
  PEARL: rgb(0.96, 0.965, 0.97),          // #F5F7F8 - Light backgrounds
  WHITE: rgb(1, 1, 1),                     // #FFFFFF

  // Accent colors by tier - Refined, muted tones
  GOLD: rgb(0.72, 0.58, 0.30),            // #B8944D - Standard tier
  AMETHYST: rgb(0.45, 0.35, 0.65),        // #7359A6 - Pro tier
  SAPPHIRE: rgb(0.15, 0.35, 0.55),        // #26598C - Agency tier

  // Semantic colors - Muted, professional
  SUCCESS: rgb(0.20, 0.45, 0.35),         // #337359 - Green
  WARNING: rgb(0.70, 0.55, 0.25),         // #B38C40 - Amber
  DANGER: rgb(0.60, 0.25, 0.25),          // #994040 - Red
};

function getTierColors(tier: string): { primary: RGB; secondary: RGB; name: string } {
  switch (tier) {
    case 'agency':
      return { primary: COLORS.SAPPHIRE, secondary: rgb(0.25, 0.45, 0.65), name: 'AGENCY' };
    case 'pro':
      return { primary: COLORS.AMETHYST, secondary: rgb(0.55, 0.45, 0.75), name: 'PRO' };
    default:
      return { primary: COLORS.GOLD, secondary: rgb(0.82, 0.68, 0.40), name: 'STANDARD' };
  }
}

// ============================================================================
// LAYOUT CONSTANTS - Precise institutional typography
// ============================================================================
const PAGE = {
  WIDTH: 595.28,   // A4
  HEIGHT: 841.89,
  MARGIN_TOP: 72,
  MARGIN_BOTTOM: 72,
  MARGIN_LEFT: 60,
  MARGIN_RIGHT: 60,
};

const CONTENT_WIDTH = PAGE.WIDTH - PAGE.MARGIN_LEFT - PAGE.MARGIN_RIGHT;

// ============================================================================
// TYPOGRAPHY HELPERS
// ============================================================================

// Sanitize text for WinAnsi encoding (remove unsupported characters)
function sanitizeText(text: unknown): string {
  if (!text) return '';
  const str = typeof text === 'string' ? text : String(text);
  return str
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/•/g, '-')
    .replace(/✓/g, 'V')
    .replace(/✗/g, 'X')
    .replace(/═/g, '=')
    .replace(/║/g, '|')
    .replace(/╔/g, '+')
    .replace(/╗/g, '+')
    .replace(/╚/g, '+')
    .replace(/╝/g, '+')
    .replace(/─/g, '-')
    .replace(/│/g, '|')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/€/g, 'EUR')
    .replace(/[^\x00-\xFF]/g, ''); // Remove any remaining non-Latin1 characters
}

// Recursively sanitize all strings in an object
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const sanitized = sanitizeText(text);
  const words = sanitized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M€`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k€`;
  return `${num.toLocaleString('fr-FR')}€`;
}

// ============================================================================
// PDF BUILDER CLASS - Institutional grade document generator
// ============================================================================
class InstitutionalPDFBuilder {
  private pdfDoc: PDFDocument;
  private currentPage: PDFPage;
  private cursorY: number;
  private pageNumber: number;
  private sectionNumber: number;
  private fonts: {
    regular: PDFFont;
    bold: PDFFont;
    oblique: PDFFont;
    boldOblique: PDFFont;
  };
  private tierColors: { primary: RGB; secondary: RGB; name: string };
  private reportData: any;
  private tocItems: Array<{ title: string; page: number }> = [];

  constructor(pdfDoc: PDFDocument, fonts: any, tier: string, reportData: any) {
    this.pdfDoc = pdfDoc;
    this.fonts = fonts;
    this.tierColors = getTierColors(tier);
    this.reportData = reportData;
    this.pageNumber = 0;
    this.sectionNumber = 0;
    this.currentPage = this.addNewPage();
    this.cursorY = PAGE.HEIGHT - PAGE.MARGIN_TOP;
  }

  // Safe text drawing that sanitizes all input
  private safeDrawText(text: unknown, x: number, y: number, options: { size: number; font: PDFFont; color: RGB }): void {
    const safeText = sanitizeText(text);
    if (!safeText) return;
    this.currentPage.drawText(safeText, { x, y, ...options });
  }

  private addNewPage(): PDFPage {
    this.pageNumber++;
    const page = this.pdfDoc.addPage([PAGE.WIDTH, PAGE.HEIGHT]);
    this.cursorY = PAGE.HEIGHT - PAGE.MARGIN_TOP;
    return page;
  }

  private ensureSpace(needed: number): void {
    if (this.cursorY < PAGE.MARGIN_BOTTOM + needed) {
      this.addFooter();
      this.currentPage = this.addNewPage();
    }
  }

  private addFooter(): void {
    // Elegant footer line
    this.currentPage.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y: 50 },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: 50 },
      thickness: 0.5,
      color: COLORS.SILVER,
    });

    // Company name - left
    this.currentPage.drawText('BENCHMARK IQ', {
      x: PAGE.MARGIN_LEFT,
      y: 35,
      size: 7,
      font: this.fonts.bold,
      color: COLORS.SLATE,
    });

    // Page number - right
    const pageText = `${this.pageNumber}`;
    const pageWidth = this.fonts.regular.widthOfTextAtSize(pageText, 9);
    this.currentPage.drawText(pageText, {
      x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - pageWidth,
      y: 35,
      size: 9,
      font: this.fonts.regular,
      color: COLORS.SLATE,
    });

    // Confidentiality notice - center
    const confText = 'CONFIDENTIEL';
    const confWidth = this.fonts.regular.widthOfTextAtSize(confText, 6);
    this.currentPage.drawText(confText, {
      x: (PAGE.WIDTH - confWidth) / 2,
      y: 35,
      size: 6,
      font: this.fonts.regular,
      color: COLORS.STONE,
    });
  }

  // =========================================================================
  // COVER PAGE - Ultra-premium McKinsey-style
  // =========================================================================
  buildCoverPage(): void {
    const page = this.currentPage;
    const meta = this.reportData.report_metadata || {};

    // Tier badge - top right corner, subtle
    const tierBadgeWidth = 80;
    const tierBadgeHeight = 24;
    page.drawRectangle({
      x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - tierBadgeWidth,
      y: PAGE.HEIGHT - 50,
      width: tierBadgeWidth,
      height: tierBadgeHeight,
      color: this.tierColors.primary,
    });

    const tierTextWidth = this.fonts.bold.widthOfTextAtSize(this.tierColors.name, 8);
    page.drawText(this.tierColors.name, {
      x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - tierBadgeWidth + (tierBadgeWidth - tierTextWidth) / 2,
      y: PAGE.HEIGHT - 43,
      size: 8,
      font: this.fonts.bold,
      color: COLORS.WHITE,
    });

    // Vertical accent bar - left side
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 8,
      height: PAGE.HEIGHT,
      color: this.tierColors.primary,
    });

    // Main title area - starting at 60% from top
    let y = PAGE.HEIGHT * 0.60;

    // Document type label
    page.drawText('RAPPORT STRATÉGIQUE', {
      x: PAGE.MARGIN_LEFT,
      y,
      size: 11,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

    y -= 40;

    // Main title - Large, bold, commanding
    const title = meta.title || 'Benchmark Concurrentiel';
    const titleLines = wrapText(title, this.fonts.bold, 32, CONTENT_WIDTH);
    for (const line of titleLines) {
      page.drawText(line, {
        x: PAGE.MARGIN_LEFT,
        y,
        size: 32,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });
      y -= 42;
    }

    // Divider line
    y -= 10;
    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y },
      end: { x: PAGE.MARGIN_LEFT + 120, y },
      thickness: 3,
      color: this.tierColors.primary,
    });

    y -= 35;

    // Business name
    const businessName = sanitizeText(meta.business_name || '');
    if (businessName) {
      page.drawText(businessName.toUpperCase(), {
        x: PAGE.MARGIN_LEFT,
        y,
        size: 14,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });
      y -= 28;
    }

    // Sector
    const sector = sanitizeText(meta.sector || '');
    if (sector) {
      page.drawText(sector, {
        x: PAGE.MARGIN_LEFT,
        y,
        size: 12,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });
      y -= 24;
    }

    // Location
    const location = sanitizeText(meta.location || '');
    if (location) {
      page.drawText(location, {
        x: PAGE.MARGIN_LEFT,
        y,
        size: 11,
        font: this.fonts.regular,
        color: COLORS.STONE,
      });
    }

    // Bottom metadata section
    const bottomY = 100;

    // Date - left
    const date = meta.generated_date || new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    page.drawText(date, {
      x: PAGE.MARGIN_LEFT,
      y: bottomY,
      size: 10,
      font: this.fonts.regular,
      color: COLORS.SLATE,
    });

    // Sources count - right
    const sourcesCount = meta.sources_count || this.reportData.sources?.length || 0;
    if (sourcesCount > 0) {
      const sourcesText = `${sourcesCount} sources analysées`;
      const sourcesWidth = this.fonts.regular.widthOfTextAtSize(sourcesText, 10);
      page.drawText(sourcesText, {
        x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - sourcesWidth,
        y: bottomY,
        size: 10,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });
    }

    // Branding line at very bottom
    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y: 60 },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: 60 },
      thickness: 0.5,
      color: COLORS.SILVER,
    });

    page.drawText('Produit par Benchmark IQ™ — Intelligence Concurrentielle Automatisée', {
      x: PAGE.MARGIN_LEFT,
      y: 45,
      size: 8,
      font: this.fonts.regular,
      color: COLORS.STONE,
    });
  }

  // =========================================================================
  // EXECUTIVE SUMMARY PAGE - The money shot
  // =========================================================================
  buildExecutiveSummary(): void {
    this.addFooter();
    this.currentPage = this.addNewPage();

    const exec = this.reportData.executive_summary || {};

    // Section header
    this.drawSectionHeader('Résumé Exécutif');
    this.tocItems.push({ title: 'Résumé Exécutif', page: this.pageNumber });

    // One-line headline if available
    if (exec.headline) {
      this.cursorY -= 20;
      const headlineLines = wrapText(exec.headline, this.fonts.boldOblique, 16, CONTENT_WIDTH);
      for (const line of headlineLines) {
        this.currentPage.drawText(line, {
          x: PAGE.MARGIN_LEFT,
          y: this.cursorY,
          size: 16,
          font: this.fonts.boldOblique,
          color: this.tierColors.primary,
        });
        this.cursorY -= 24;
      }
      this.cursorY -= 10;
    }

    // One-page summary - The executive overview
    const summary = exec.one_page_summary || exec.situation_actuelle || '';
    if (summary) {
      this.cursorY -= 10;
      this.drawParagraph(summary, 11, COLORS.BLACK);
    }

    // Key metrics cards - Investment & ROI
    if (exec.investment_required || exec.expected_roi) {
      this.cursorY -= 30;
      const cardWidth = (CONTENT_WIDTH - 20) / 2;

      if (exec.investment_required) {
        this.drawMetricCard(
          'INVESTISSEMENT REQUIS',
          exec.investment_required,
          PAGE.MARGIN_LEFT,
          this.cursorY,
          cardWidth
        );
      }

      if (exec.expected_roi) {
        this.drawMetricCard(
          'ROI ATTENDU',
          exec.expected_roi,
          PAGE.MARGIN_LEFT + cardWidth + 20,
          this.cursorY,
          cardWidth
        );
      }

      this.cursorY -= 90;
    }

    // Key findings as bullet points
    if (exec.key_findings?.length) {
      this.cursorY -= 20;
      this.drawSubheader('Points Clés');

      for (const finding of exec.key_findings) {
        this.drawBulletPoint(finding);
      }
    }

    // Opportunity highlight box
    if (exec.opportunite_principale) {
      this.ensureSpace(100);
      this.cursorY -= 20;
      this.drawHighlightBox('OPPORTUNITÉ PRINCIPALE', exec.opportunite_principale);
    }
  }

  // =========================================================================
  // MARKET ANALYSIS SECTION
  // =========================================================================
  buildMarketAnalysis(): void {
    const market = this.reportData.market_analysis || this.reportData.market_context;
    if (!market) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Analyse du Marché');
    this.tocItems.push({ title: 'Analyse du Marché', page: this.pageNumber });

    // Market overview
    if (market.sector_overview || market.market_overview) {
      this.cursorY -= 15;
      this.drawSubheader('Vue d\'ensemble');
      this.drawParagraph(market.sector_overview || market.market_overview, 11, COLORS.BLACK);
    }

    // Market size data if available (Agency tier)
    if (market.market_sizing) {
      this.cursorY -= 25;
      this.drawSubheader('Taille du Marché');

      const sizing = market.market_sizing;
      const metrics = [
        { label: 'TAM (Marché Total)', value: sizing.tam },
        { label: 'SAM (Marché Accessible)', value: sizing.sam },
        { label: 'SOM (Marché Capturable)', value: sizing.som },
      ].filter(m => m.value);

      if (metrics.length) {
        const cardWidth = (CONTENT_WIDTH - 40) / 3;
        let xPos = PAGE.MARGIN_LEFT;

        for (const metric of metrics) {
          this.ensureSpace(100);
          this.drawMetricCard(metric.label, metric.value, xPos, this.cursorY, cardWidth);
          xPos += cardWidth + 20;
        }
        this.cursorY -= 100;
      }
    }

    // Porter Five Forces if available
    if (market.porter_five_forces) {
      this.cursorY -= 30;
      this.drawSubheader('Analyse Porter (5 Forces)');
      this.drawPorterForces(market.porter_five_forces);
    }

    // PESTEL if available (Agency tier)
    if (market.pestel_analysis) {
      this.ensureSpace(200);
      this.cursorY -= 30;
      this.drawSubheader('Analyse PESTEL');
      this.drawPestelAnalysis(market.pestel_analysis);
    }

    // Key trends
    const trends = market.key_trends_impacting || market.key_trends;
    if (trends?.length) {
      this.ensureSpace(100);
      this.cursorY -= 25;
      this.drawSubheader('Tendances Clés');
      for (const trend of trends) {
        const trendText = typeof trend === 'string' ? trend : trend.trend;
        this.drawBulletPoint(trendText);
      }
    }
  }

  // =========================================================================
  // COMPETITIVE INTELLIGENCE SECTION  
  // =========================================================================
  buildCompetitiveAnalysis(): void {
    const competitive = this.reportData.competitive_intelligence ||
      this.reportData.competitive_landscape ||
      this.reportData.competitive_analysis;
    if (!competitive) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Intelligence Concurrentielle');
    this.tocItems.push({ title: 'Intelligence Concurrentielle', page: this.pageNumber });

    // Competition intensity summary
    if (competitive.competition_intensity || competitive.market_concentration) {
      this.cursorY -= 15;
      const intensity = competitive.competition_intensity || competitive.market_concentration;
      this.drawHighlightBox('INTENSITÉ CONCURRENTIELLE', intensity);
      this.cursorY -= 20;
    }

    // Your current position
    if (competitive.your_current_position) {
      this.cursorY -= 15;
      this.drawSubheader('Votre Position Actuelle');
      this.drawParagraph(competitive.your_current_position, 11, COLORS.BLACK);
    }

    // Competitors table/cards
    const competitors = competitive.competitors_analyzed || competitive.key_competitors || competitive.competitors;
    if (competitors?.length) {
      this.cursorY -= 30;
      this.drawSubheader('Concurrents Analysés');
      this.drawCompetitorsTable(competitors);
    }

    // Competitive positioning map data
    if (competitive.competitive_positioning_maps?.primary_map) {
      this.ensureSpace(150);
      this.cursorY -= 30;
      this.drawSubheader('Matrice de Positionnement');
      this.drawPositioningMatrix(competitive.competitive_positioning_maps.primary_map);
    }
  }

  // =========================================================================
  // SWOT ANALYSIS
  // =========================================================================
  buildSwotAnalysis(): void {
    const swot = this.reportData.swot_analysis;
    if (!swot) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Analyse SWOT');
    this.tocItems.push({ title: 'Analyse SWOT', page: this.pageNumber });

    this.cursorY -= 20;
    this.drawSwotGrid(swot);
  }

  // =========================================================================
  // FINANCIAL PROJECTIONS
  // =========================================================================
  buildFinancialProjections(): void {
    const financial = this.reportData.financial_projections;
    if (!financial) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Projections Financières');
    this.tocItems.push({ title: 'Projections Financières', page: this.pageNumber });

    // Revenue scenarios
    if (financial.revenue_scenarios) {
      this.cursorY -= 20;
      this.drawSubheader('Scénarios de Revenus (3 ans)');
      this.drawRevenueScenarios(financial.revenue_scenarios);
    }

    // Unit Economics
    if (financial.unit_economics) {
      this.ensureSpace(200);
      this.cursorY -= 40;
      this.drawSubheader('Unit Economics');
      this.drawUnitEconomics(financial.unit_economics);
    }
  }

  // =========================================================================
  // PRICING STRATEGY
  // =========================================================================
  buildPricingStrategy(): void {
    const pricing = this.reportData.pricing_strategy || this.reportData.pricing_analysis;
    if (!pricing) return;

    this.ensureSpace(250);
    this.cursorY -= 40;
    this.drawSubheader('Stratégie Tarifaire');

    // Recommended pricing
    if (pricing.recommended_pricing) {
      this.drawHighlightBox('PRIX RECOMMANDÉ', pricing.recommended_pricing);
      this.cursorY -= 15;
    }

    // Market benchmarks
    const benchmarks = pricing.market_benchmarks || pricing.competitor_pricing_table;
    if (benchmarks) {
      this.cursorY -= 20;

      if (Array.isArray(benchmarks)) {
        // Competitor pricing table
        this.drawPricingTable(benchmarks);
      } else {
        // Tier-based benchmarks
        const tiers = [
          { label: 'Budget', value: benchmarks.budget_tier },
          { label: 'Milieu de gamme', value: benchmarks.mid_tier },
          { label: 'Premium', value: benchmarks.premium_tier },
        ].filter(t => t.value);

        for (const tier of tiers) {
          this.drawBulletPoint(`${tier.label}: ${tier.value}`);
        }
      }
    }
  }

  // =========================================================================
  // ACTION PLAN / ROADMAP
  // =========================================================================
  buildActionPlan(): void {
    const actionPlan = this.reportData.action_plan || this.reportData.implementation_roadmap;
    if (!actionPlan) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Plan d\'Action');
    this.tocItems.push({ title: 'Plan d\'Action', page: this.pageNumber });

    // Standard action plan format
    if (actionPlan.now_7_days || actionPlan.days_8_30 || actionPlan.days_31_90) {
      this.cursorY -= 20;
      this.drawActionTimeline([
        { title: 'SEMAINE 1 — Quick Wins', items: actionPlan.now_7_days || [] },
        { title: 'JOURS 8-30 — Fondations', items: actionPlan.days_8_30 || [] },
        { title: 'JOURS 31-90 — Croissance', items: actionPlan.days_31_90 || [] },
      ]);
    }

    // Agency roadmap format  
    if (actionPlan.phase_1_foundation || actionPlan.phase_2_growth || actionPlan.phase_3_scale) {
      this.cursorY -= 20;
      this.drawImplementationRoadmap(actionPlan);
    }
  }

  // =========================================================================
  // SOURCES
  // =========================================================================
  buildSourcesSection(): void {
    const sources = this.reportData.sources;
    if (!sources?.length) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Sources & Méthodologie');
    this.tocItems.push({ title: 'Sources', page: this.pageNumber });

    this.cursorY -= 20;
    this.currentPage.drawText(`${sources.length} sources analysées pour ce rapport`, {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 11,
      font: this.fonts.oblique,
      color: COLORS.SLATE,
    });
    this.cursorY -= 30;

    for (let i = 0; i < Math.min(sources.length, 15); i++) {
      const source = sources[i];
      this.ensureSpace(40);

      const num = `${i + 1}.`;
      this.currentPage.drawText(num, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.SLATE,
      });

      const title = source.title || source.url;
      const titleLines = wrapText(title, this.fonts.regular, 10, CONTENT_WIDTH - 30);
      for (const line of titleLines) {
        this.currentPage.drawText(line, {
          x: PAGE.MARGIN_LEFT + 25,
          y: this.cursorY,
          size: 10,
          font: this.fonts.regular,
          color: COLORS.CHARCOAL,
        });
        this.cursorY -= 14;
      }
      this.cursorY -= 8;
    }
  }

  // =========================================================================
  // HELPER DRAWING METHODS
  // =========================================================================

  private drawSectionHeader(title: string): void {
    this.sectionNumber++;

    // Section number circle
    const circleX = PAGE.MARGIN_LEFT + 14;
    const circleY = this.cursorY - 6;
    this.currentPage.drawCircle({
      x: circleX,
      y: circleY,
      size: 14,
      color: this.tierColors.primary,
    });

    this.currentPage.drawText(String(this.sectionNumber), {
      x: circleX - 4,
      y: circleY - 5,
      size: 12,
      font: this.fonts.bold,
      color: COLORS.WHITE,
    });

    // Section title
    this.currentPage.drawText(title.toUpperCase(), {
      x: PAGE.MARGIN_LEFT + 40,
      y: this.cursorY - 4,
      size: 18,
      font: this.fonts.bold,
      color: COLORS.BLACK,
    });

    // Underline
    this.currentPage.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y: this.cursorY - 25 },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: this.cursorY - 25 },
      thickness: 1.5,
      color: this.tierColors.primary,
    });

    this.cursorY -= 50;
  }

  private drawSubheader(title: string): void {
    this.ensureSpace(40);

    // Small accent bar
    this.currentPage.drawRectangle({
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY - 2,
      width: 4,
      height: 16,
      color: this.tierColors.primary,
    });

    this.currentPage.drawText(title, {
      x: PAGE.MARGIN_LEFT + 14,
      y: this.cursorY,
      size: 13,
      font: this.fonts.bold,
      color: COLORS.CHARCOAL,
    });

    this.cursorY -= 28;
  }

  private drawParagraph(text: string, fontSize: number, color: RGB): void {
    const lines = wrapText(text, this.fonts.regular, fontSize, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(fontSize + 8);
      this.currentPage.drawText(line, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: fontSize,
        font: this.fonts.regular,
        color,
      });
      this.cursorY -= fontSize + 6;
    }
    this.cursorY -= 8;
  }

  private drawBulletPoint(text: string): void {
    this.ensureSpace(30);

    // Bullet point (using simple dash for WinAnsi compatibility)
    this.currentPage.drawText('>', {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 12,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

    const lines = wrapText(text, this.fonts.regular, 11, CONTENT_WIDTH - 25);
    for (let i = 0; i < lines.length; i++) {
      this.currentPage.drawText(lines[i], {
        x: PAGE.MARGIN_LEFT + 20,
        y: this.cursorY,
        size: 11,
        font: this.fonts.regular,
        color: COLORS.BLACK,
      });
      this.cursorY -= 16;
    }
    this.cursorY -= 4;
  }

  private drawMetricCard(label: string, value: string, x: number, y: number, width: number): void {
    const height = 75;

    // Card background
    this.currentPage.drawRectangle({
      x,
      y: y - height + 20,
      width,
      height,
      color: COLORS.PEARL,
      borderColor: COLORS.SILVER,
      borderWidth: 1,
    });

    // Accent top bar
    this.currentPage.drawRectangle({
      x,
      y: y + 20 - 3,
      width,
      height: 3,
      color: this.tierColors.primary,
    });

    // Label
    this.currentPage.drawText(label, {
      x: x + 12,
      y: y - 5,
      size: 8,
      font: this.fonts.bold,
      color: COLORS.SLATE,
    });

    // Value
    const valueLines = wrapText(value, this.fonts.bold, 16, width - 24);
    let valueY = y - 30;
    for (const line of valueLines) {
      this.currentPage.drawText(line, {
        x: x + 12,
        y: valueY,
        size: 16,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });
      valueY -= 20;
    }
  }

  private drawHighlightBox(label: string, content: string): void {
    const lines = wrapText(content, this.fonts.regular, 11, CONTENT_WIDTH - 40);
    const boxHeight = 45 + lines.length * 17;

    this.ensureSpace(boxHeight + 20);

    // Box background
    this.currentPage.drawRectangle({
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY - boxHeight + 30,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: rgb(
        this.tierColors.primary.red * 0.1 + 0.9,
        this.tierColors.primary.green * 0.1 + 0.9,
        this.tierColors.primary.blue * 0.1 + 0.9
      ),
    });

    // Left accent bar
    this.currentPage.drawRectangle({
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY - boxHeight + 30,
      width: 4,
      height: boxHeight,
      color: this.tierColors.primary,
    });

    // Label
    this.currentPage.drawText(label, {
      x: PAGE.MARGIN_LEFT + 20,
      y: this.cursorY,
      size: 9,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

    // Content
    let contentY = this.cursorY - 22;
    for (const line of lines) {
      this.currentPage.drawText(line, {
        x: PAGE.MARGIN_LEFT + 20,
        y: contentY,
        size: 11,
        font: this.fonts.regular,
        color: COLORS.BLACK,
      });
      contentY -= 17;
    }

    this.cursorY -= boxHeight + 10;
  }

  private drawPorterForces(porter: any): void {
    const forces = [
      { label: 'Rivalité Concurrentielle', data: porter.competitive_rivalry },
      { label: 'Pouvoir Fournisseurs', data: porter.supplier_power },
      { label: 'Pouvoir Clients', data: porter.buyer_power },
      { label: 'Menace Substituts', data: porter.threat_of_substitution },
      { label: 'Menace Nouveaux Entrants', data: porter.threat_of_new_entry },
    ];

    for (const force of forces) {
      if (!force.data) continue;
      this.ensureSpace(60);

      const score = force.data.score || 5;
      const analysis = force.data.analysis || '';

      // Force name and score
      this.currentPage.drawText(`${force.label}`, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 11,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      // Score bar
      const barWidth = 100;
      const barHeight = 8;
      const barX = PAGE.MARGIN_LEFT + 180;

      // Background bar
      this.currentPage.drawRectangle({
        x: barX,
        y: this.cursorY - 2,
        width: barWidth,
        height: barHeight,
        color: COLORS.SILVER,
      });

      // Filled bar
      this.currentPage.drawRectangle({
        x: barX,
        y: this.cursorY - 2,
        width: (score / 10) * barWidth,
        height: barHeight,
        color: this.tierColors.primary,
      });

      // Score number
      this.currentPage.drawText(`${score}/10`, {
        x: barX + barWidth + 10,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      this.cursorY -= 20;

      // Analysis
      if (analysis) {
        const analysisLines = wrapText(analysis, this.fonts.regular, 10, CONTENT_WIDTH - 20);
        for (const line of analysisLines) {
          this.currentPage.drawText(line, {
            x: PAGE.MARGIN_LEFT + 15,
            y: this.cursorY,
            size: 10,
            font: this.fonts.regular,
            color: COLORS.SLATE,
          });
          this.cursorY -= 14;
        }
      }

      this.cursorY -= 10;
    }
  }

  private drawPestelAnalysis(pestel: any): void {
    const factors = [
      { label: 'Politique', data: pestel.political },
      { label: 'Économique', data: pestel.economic },
      { label: 'Social', data: pestel.social },
      { label: 'Technologique', data: pestel.technological },
      { label: 'Environnemental', data: pestel.environmental },
      { label: 'Légal', data: pestel.legal },
    ];

    for (const factor of factors) {
      if (!factor.data) continue;
      this.ensureSpace(40);

      this.currentPage.drawText(factor.label.toUpperCase(), {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: this.tierColors.primary,
      });
      this.cursorY -= 18;

      const content = factor.data.factors?.join('. ') || factor.data.summary || '';
      if (content) {
        const lines = wrapText(content, this.fonts.regular, 10, CONTENT_WIDTH - 15);
        for (const line of lines) {
          this.currentPage.drawText(line, {
            x: PAGE.MARGIN_LEFT + 15,
            y: this.cursorY,
            size: 10,
            font: this.fonts.regular,
            color: COLORS.BLACK,
          });
          this.cursorY -= 14;
        }
      }
      this.cursorY -= 8;
    }
  }

  private drawCompetitorsTable(competitors: any[]): void {
    const colWidths = [120, 180, 80];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const headerHeight = 25;

    this.ensureSpace(headerHeight + 40);

    // Table header
    let x = PAGE.MARGIN_LEFT;
    this.currentPage.drawRectangle({
      x,
      y: this.cursorY - headerHeight + 10,
      width: tableWidth,
      height: headerHeight,
      color: COLORS.CHARCOAL,
    });

    const headers = ['CONCURRENT', 'POSITIONNEMENT', 'MENACE'];
    for (let i = 0; i < headers.length; i++) {
      this.currentPage.drawText(headers[i], {
        x: x + 8,
        y: this.cursorY - 8,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.WHITE,
      });
      x += colWidths[i];
    }

    this.cursorY -= headerHeight + 5;

    // Table rows
    for (let i = 0; i < Math.min(competitors.length, 6); i++) {
      const comp = competitors[i];
      this.ensureSpace(35);

      x = PAGE.MARGIN_LEFT;

      // Alternating row background
      if (i % 2 === 0) {
        this.currentPage.drawRectangle({
          x,
          y: this.cursorY - 18,
          width: tableWidth,
          height: 28,
          color: COLORS.PEARL,
        });
      }

      // Name
      this.currentPage.drawText(comp.name || '', {
        x: x + 8,
        y: this.cursorY - 5,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });
      x += colWidths[0];

      // Positioning
      const posText = (comp.positioning || '').substring(0, 40);
      this.currentPage.drawText(posText, {
        x: x + 8,
        y: this.cursorY - 5,
        size: 9,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });
      x += colWidths[1];

      // Threat level
      const threat = comp.threat_level || comp.threat || '';
      let threatColor = COLORS.STONE;
      if (threat.toLowerCase().includes('élevé') || threat.toLowerCase().includes('high')) {
        threatColor = COLORS.DANGER;
      } else if (threat.toLowerCase().includes('moyen') || threat.toLowerCase().includes('medium')) {
        threatColor = COLORS.WARNING;
      }

      this.currentPage.drawText(threat, {
        x: x + 8,
        y: this.cursorY - 5,
        size: 9,
        font: this.fonts.bold,
        color: threatColor,
      });

      this.cursorY -= 30;
    }
  }

  private drawPositioningMatrix(mapData: any): void {
    // Simplified text-based representation of positioning map
    const positions = mapData.positions || mapData.competitors_plotted || [];
    const xAxis = mapData.x_axis || 'Prix';
    const yAxis = mapData.y_axis || 'Qualité';

    this.currentPage.drawText(`Axes: ${xAxis} (horizontal) × ${yAxis} (vertical)`, {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 10,
      font: this.fonts.oblique,
      color: COLORS.SLATE,
    });
    this.cursorY -= 25;

    for (const pos of positions.slice(0, 5)) {
      const name = pos.name || pos.competitor || '';
      const scoreText = `(${pos.x || 0}, ${pos.y || 0})`;

      this.currentPage.drawText(`• ${name}`, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      this.currentPage.drawText(scoreText, {
        x: PAGE.MARGIN_LEFT + 150,
        y: this.cursorY,
        size: 10,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });

      this.cursorY -= 18;
    }

    // Recommended position
    if (mapData.recommended_position) {
      this.cursorY -= 10;
      this.currentPage.drawText('> Position Recommandee:', {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: this.tierColors.primary,
      });

      this.currentPage.drawText(`(${mapData.recommended_position.x}, ${mapData.recommended_position.y})`, {
        x: PAGE.MARGIN_LEFT + 150,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: this.tierColors.primary,
      });
      this.cursorY -= 18;
    }
  }

  private drawSwotGrid(swot: any): void {
    const quadrantWidth = (CONTENT_WIDTH - 15) / 2;
    const quadrantHeight = 140;

    const quadrants = [
      { title: 'FORCES', items: swot.strengths || [], color: COLORS.SUCCESS, x: PAGE.MARGIN_LEFT, row: 0 },
      { title: 'FAIBLESSES', items: swot.weaknesses || [], color: COLORS.DANGER, x: PAGE.MARGIN_LEFT + quadrantWidth + 15, row: 0 },
      { title: 'OPPORTUNITÉS', items: swot.opportunities || [], color: this.tierColors.primary, x: PAGE.MARGIN_LEFT, row: 1 },
      { title: 'MENACES', items: swot.threats || [], color: COLORS.WARNING, x: PAGE.MARGIN_LEFT + quadrantWidth + 15, row: 1 },
    ];

    let baseY = this.cursorY;

    for (const quad of quadrants) {
      const y = baseY - (quad.row * (quadrantHeight + 15));

      // Quadrant box
      this.currentPage.drawRectangle({
        x: quad.x,
        y: y - quadrantHeight,
        width: quadrantWidth,
        height: quadrantHeight,
        borderColor: COLORS.SILVER,
        borderWidth: 1,
        color: COLORS.WHITE,
      });

      // Header bar
      this.currentPage.drawRectangle({
        x: quad.x,
        y: y - 25,
        width: quadrantWidth,
        height: 25,
        color: quad.color,
      });

      this.currentPage.drawText(quad.title, {
        x: quad.x + 10,
        y: y - 17,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.WHITE,
      });

      // Items
      let itemY = y - 40;
      for (let i = 0; i < Math.min(quad.items.length, 4); i++) {
        const item = quad.items[i];
        const itemLines = wrapText(`• ${item}`, this.fonts.regular, 9, quadrantWidth - 20);

        for (const line of itemLines) {
          this.currentPage.drawText(line, {
            x: quad.x + 10,
            y: itemY,
            size: 9,
            font: this.fonts.regular,
            color: COLORS.BLACK,
          });
          itemY -= 14;
        }
      }
    }

    this.cursorY = baseY - (2 * (quadrantHeight + 15)) - 20;
  }

  private drawRevenueScenarios(scenarios: any): void {
    const scenarioData = [
      { label: 'Conservateur', data: scenarios.conservative, color: COLORS.SLATE },
      { label: 'Base', data: scenarios.baseline, color: this.tierColors.primary },
      { label: 'Optimiste', data: scenarios.optimistic, color: COLORS.SUCCESS },
    ];

    const colWidth = (CONTENT_WIDTH - 30) / 3;

    for (let i = 0; i < scenarioData.length; i++) {
      const scenario = scenarioData[i];
      if (!scenario.data) continue;

      const x = PAGE.MARGIN_LEFT + (i * (colWidth + 15));
      const boxHeight = 120;

      // Box
      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - boxHeight,
        width: colWidth,
        height: boxHeight,
        color: COLORS.PEARL,
        borderColor: scenario.color,
        borderWidth: 2,
      });

      // Header
      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - 25,
        width: colWidth,
        height: 25,
        color: scenario.color,
      });

      this.currentPage.drawText(scenario.label.toUpperCase(), {
        x: x + 10,
        y: this.cursorY - 17,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.WHITE,
      });

      // Year values
      const years = [
        { label: 'Année 1', value: scenario.data.year_1 },
        { label: 'Année 2', value: scenario.data.year_2 },
        { label: 'Année 3', value: scenario.data.year_3 },
      ];

      let yPos = this.cursorY - 45;
      for (const year of years) {
        this.currentPage.drawText(year.label, {
          x: x + 10,
          y: yPos,
          size: 9,
          font: this.fonts.regular,
          color: COLORS.SLATE,
        });

        this.currentPage.drawText(formatCurrency(year.value), {
          x: x + colWidth - 10 - this.fonts.bold.widthOfTextAtSize(formatCurrency(year.value), 11),
          y: yPos,
          size: 11,
          font: this.fonts.bold,
          color: COLORS.BLACK,
        });

        yPos -= 22;
      }
    }

    this.cursorY -= 140;
  }

  private drawUnitEconomics(economics: any): void {
    const metrics = [
      { label: 'CAC', value: formatCurrency(economics.customer_acquisition_cost), desc: 'Coût d\'acquisition' },
      { label: 'LTV', value: formatCurrency(economics.lifetime_value), desc: 'Valeur client' },
      { label: 'LTV/CAC', value: `${economics.ltv_cac_ratio?.toFixed(1) || 'N/A'}x`, desc: 'Ratio' },
      { label: 'Payback', value: `${economics.payback_period_months || 'N/A'} mois`, desc: 'Délai rentabilité' },
    ];

    const cardWidth = (CONTENT_WIDTH - 45) / 4;

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const x = PAGE.MARGIN_LEFT + (i * (cardWidth + 15));
      const boxHeight = 70;

      // Card
      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - boxHeight,
        width: cardWidth,
        height: boxHeight,
        color: COLORS.PEARL,
        borderColor: COLORS.SILVER,
        borderWidth: 1,
      });

      // Label
      this.currentPage.drawText(metric.label, {
        x: x + 8,
        y: this.cursorY - 15,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.SLATE,
      });

      // Value
      this.currentPage.drawText(metric.value, {
        x: x + 8,
        y: this.cursorY - 38,
        size: 14,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });

      // Description
      this.currentPage.drawText(metric.desc, {
        x: x + 8,
        y: this.cursorY - 55,
        size: 7,
        font: this.fonts.regular,
        color: COLORS.STONE,
      });
    }

    this.cursorY -= 90;

    // Benchmark comparison
    if (economics.comparison_to_benchmarks) {
      this.cursorY -= 10;
      this.drawHighlightBox('COMPARAISON AUX BENCHMARKS', economics.comparison_to_benchmarks);
    }
  }

  private drawPricingTable(pricing: any[]): void {
    this.cursorY -= 10;

    for (const item of pricing.slice(0, 6)) {
      this.ensureSpace(30);

      this.currentPage.drawText(`• ${item.competitor || item.name}`, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      this.currentPage.drawText(item.price || item.pricing || '', {
        x: PAGE.MARGIN_LEFT + 200,
        y: this.cursorY,
        size: 10,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });

      this.cursorY -= 20;
    }
  }

  private drawActionTimeline(phases: Array<{ title: string; items: any[] }>): void {
    for (const phase of phases) {
      if (!phase.items?.length) continue;

      this.ensureSpace(80);

      // Phase header with timeline dot
      this.currentPage.drawCircle({
        x: PAGE.MARGIN_LEFT + 6,
        y: this.cursorY - 4,
        size: 6,
        color: this.tierColors.primary,
      });

      this.currentPage.drawText(phase.title, {
        x: PAGE.MARGIN_LEFT + 20,
        y: this.cursorY - 2,
        size: 12,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      this.cursorY -= 30;

      // Timeline line
      const lineStartY = this.cursorY + 15;

      for (const item of phase.items.slice(0, 4)) {
        this.ensureSpace(40);

        // Small dot on timeline
        this.currentPage.drawCircle({
          x: PAGE.MARGIN_LEFT + 6,
          y: this.cursorY + 5,
          size: 3,
          color: COLORS.SILVER,
        });

        // Action text
        const actionText = item.action || item;
        const actionLines = wrapText(actionText, this.fonts.regular, 10, CONTENT_WIDTH - 40);

        for (const line of actionLines) {
          this.currentPage.drawText(line, {
            x: PAGE.MARGIN_LEFT + 25,
            y: this.cursorY,
            size: 10,
            font: this.fonts.regular,
            color: COLORS.BLACK,
          });
          this.cursorY -= 14;
        }

        // Outcome
        if (item.outcome) {
          this.currentPage.drawText(`> ${sanitizeText(item.outcome)}`, {
            x: PAGE.MARGIN_LEFT + 25,
            y: this.cursorY,
            size: 9,
            font: this.fonts.oblique,
            color: COLORS.SLATE,
          });
          this.cursorY -= 14;
        }

        this.cursorY -= 8;
      }

      // Draw the timeline line
      this.currentPage.drawLine({
        start: { x: PAGE.MARGIN_LEFT + 6, y: lineStartY },
        end: { x: PAGE.MARGIN_LEFT + 6, y: this.cursorY + 20 },
        thickness: 1,
        color: COLORS.SILVER,
      });

      this.cursorY -= 15;
    }
  }

  private drawImplementationRoadmap(roadmap: any): void {
    const phases = [
      { title: 'PHASE 1 — Fondations', data: roadmap.phase_1_foundation },
      { title: 'PHASE 2 — Croissance', data: roadmap.phase_2_growth },
      { title: 'PHASE 3 — Échelle', data: roadmap.phase_3_scale },
    ];

    for (const phase of phases) {
      if (!phase.data) continue;

      this.ensureSpace(100);

      this.currentPage.drawText(phase.title, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 12,
        font: this.fonts.bold,
        color: this.tierColors.primary,
      });
      this.cursorY -= 25;

      const initiatives = phase.data.key_initiatives || [];
      for (const init of initiatives.slice(0, 3)) {
        this.ensureSpace(40);

        const initText = init.initiative || init;
        this.currentPage.drawText(`• ${initText}`, {
          x: PAGE.MARGIN_LEFT + 10,
          y: this.cursorY,
          size: 10,
          font: this.fonts.regular,
          color: COLORS.BLACK,
        });
        this.cursorY -= 18;
      }

      this.cursorY -= 20;
    }
  }

  // =========================================================================
  // MAIN BUILD METHOD
  // =========================================================================
  async build(): Promise<Uint8Array> {
    // Cover page
    this.buildCoverPage();

    // Executive Summary
    this.buildExecutiveSummary();

    // Market Analysis
    this.buildMarketAnalysis();

    // Competitive Intelligence
    this.buildCompetitiveAnalysis();

    // SWOT
    this.buildSwotAnalysis();

    // Financial Projections
    this.buildFinancialProjections();

    // Pricing Strategy
    this.buildPricingStrategy();

    // Action Plan
    this.buildActionPlan();

    // Sources
    this.buildSourcesSection();

    // Final footer on last page
    this.addFooter();

    return await this.pdfDoc.save();
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reportId } = await req.json();
    console.log(`[${reportId}] Starting INSTITUTIONAL-GRADE PDF generation`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get report data
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      throw new Error(`Report not found: ${fetchError?.message}`);
    }

    // Sanitize ALL data to ensure WinAnsi compatibility
    const outputData = sanitizeObject(report.output_data) as any;
    const tier = report.plan || 'standard';

    console.log(`[${reportId}] Generating McKinsey-grade PDF for tier: ${tier}`);

    // Create PDF with all fonts
    const pdfDoc = await PDFDocument.create();
    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      oblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      boldOblique: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    };

    // Build the institutional PDF
    const builder = new InstitutionalPDFBuilder(pdfDoc, fonts, tier, outputData);
    const pdfBytes = await builder.build();

    console.log(`[${reportId}] PDF generated, size: ${pdfBytes.length} bytes`);

    // Upload to storage
    const fileName = `report-${reportId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("reports")
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;
    console.log(`[${reportId}] PDF uploaded: ${pdfUrl}`);

    // Update report
    await supabase
      .from("reports")
      .update({ pdf_url: pdfUrl })
      .eq("id", reportId);

    return new Response(
      JSON.stringify({ success: true, pdf_url: pdfUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
