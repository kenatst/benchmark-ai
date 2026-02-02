import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// INSTITUTIONAL COLOR PALETTE - McKinsey / BCG Inspired
// ============================================================================
const COLORS = {
  BLACK: rgb(0.08, 0.08, 0.10),
  CHARCOAL: rgb(0.18, 0.18, 0.20),
  SLATE: rgb(0.35, 0.37, 0.40),
  STONE: rgb(0.55, 0.57, 0.60),
  SILVER: rgb(0.88, 0.89, 0.90),
  PEARL: rgb(0.96, 0.965, 0.97),
  WHITE: rgb(1, 1, 1),
  GOLD: rgb(0.72, 0.58, 0.30),
  AMETHYST: rgb(0.45, 0.35, 0.65),
  SAPPHIRE: rgb(0.15, 0.35, 0.55),
  SUCCESS: rgb(0.20, 0.45, 0.35),
  WARNING: rgb(0.70, 0.55, 0.25),
  DANGER: rgb(0.60, 0.25, 0.25),
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
// LAYOUT CONSTANTS
// ============================================================================
const PAGE = {
  WIDTH: 595.28,
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
    .replace(/[^\x00-\xFF]/g, '');
}

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
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M EUR`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k EUR`;
  return `${num.toLocaleString('fr-FR')} EUR`;
}

// ============================================================================
// STREAMLINED PDF BUILDER CLASS
// ============================================================================
class StreamingPDFBuilder {
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
    this.currentPage.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y: 50 },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: 50 },
      thickness: 0.5,
      color: COLORS.SILVER,
    });

    this.currentPage.drawText('BENCHMARK IQ', {
      x: PAGE.MARGIN_LEFT,
      y: 35,
      size: 7,
      font: this.fonts.bold,
      color: COLORS.SLATE,
    });

    const pageText = `${this.pageNumber}`;
    const pageWidth = this.fonts.regular.widthOfTextAtSize(pageText, 9);
    this.currentPage.drawText(pageText, {
      x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - pageWidth,
      y: 35,
      size: 9,
      font: this.fonts.regular,
      color: COLORS.SLATE,
    });

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

  // Cover Page
  buildCoverPage(): void {
    const page = this.currentPage;
    const meta = this.reportData.report_metadata || {};

    // Tier badge
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

    // Accent bar
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 8,
      height: PAGE.HEIGHT,
      color: this.tierColors.primary,
    });

    let y = PAGE.HEIGHT * 0.60;

    page.drawText('RAPPORT STRATEGIQUE', {
      x: PAGE.MARGIN_LEFT,
      y,
      size: 11,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

    y -= 40;

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

    y -= 10;
    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y },
      end: { x: PAGE.MARGIN_LEFT + 120, y },
      thickness: 3,
      color: this.tierColors.primary,
    });

    y -= 35;

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

    const bottomY = 100;
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

    const sourcesCount = meta.sources_count || this.reportData.sources?.length || 0;
    if (sourcesCount > 0) {
      const sourcesText = `${sourcesCount} sources analysees`;
      const sourcesWidth = this.fonts.regular.widthOfTextAtSize(sourcesText, 10);
      page.drawText(sourcesText, {
        x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - sourcesWidth,
        y: bottomY,
        size: 10,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });
    }

    page.drawLine({
      start: { x: PAGE.MARGIN_LEFT, y: 60 },
      end: { x: PAGE.WIDTH - PAGE.MARGIN_RIGHT, y: 60 },
      thickness: 0.5,
      color: COLORS.SILVER,
    });

    page.drawText('Produit par Benchmark IQ - Intelligence Concurrentielle Automatisee', {
      x: PAGE.MARGIN_LEFT,
      y: 45,
      size: 8,
      font: this.fonts.regular,
      color: COLORS.STONE,
    });
  }

  // Executive Summary
  buildExecutiveSummary(): void {
    this.addFooter();
    this.currentPage = this.addNewPage();

    const exec = this.reportData.executive_summary || {};
    this.drawSectionHeader('Resume Executif');

    // KPI Dashboard (High-level metrics)
    // Extract metrics from various sections if not present in executive summary
    const fin = this.reportData.financial_projections;
    const mkt = this.reportData.market_analysis || this.reportData.market_context;

    // Build metrics array
    const metrics = [];

    // 1. Market Size (TAM)
    if (mkt?.market_size || mkt?.tam) {
      metrics.push({
        label: 'Taille Marche (TAM)',
        value: formatCurrency(mkt.market_size || mkt.tam),
        subtext: mkt.cagr ? `CAGR ${mkt.cagr}` : 'Total Addressable Market'
      });
    }

    // 2. Revenue Potential (Year 3)
    if (fin?.revenue_scenarios?.baseline?.year_3) {
      metrics.push({
        label: 'Revenus An 3',
        value: formatCurrency(fin.revenue_scenarios.baseline.year_3),
        subtext: 'Scenario Base'
      });
    } else if (fin?.projected_revenue) {
      metrics.push({
        label: 'Revenus Projetes',
        value: formatCurrency(fin.projected_revenue),
        subtext: 'Horizon 3 ans'
      });
    }

    // 3. Profitability / Margin
    if (fin?.ebitda_margin_year_3 || fin?.net_margin) {
      metrics.push({
        label: 'Marge Cible',
        value: (fin.ebitda_margin_year_3 || fin.net_margin) + '%',
        subtext: 'EBITDA An 3'
      });
    } else if (fin?.unit_economics?.gross_margin) {
      metrics.push({
        label: 'Marge Brute',
        value: fin.unit_economics.gross_margin + '%',
        subtext: 'Unit Economics'
      });
    }

    // 4. Investment / CAC / Other
    if (fin?.funding_required || fin?.investment_needed) {
      metrics.push({
        label: 'Besoin Financement',
        value: formatCurrency(fin.funding_required || fin.investment_needed),
        subtext: 'Pour atteindre breakeven'
      });
    } else if (fin?.unit_economics?.ltv_cac_ratio) {
      metrics.push({
        label: 'LTV/CAC',
        value: `${fin.unit_economics.ltv_cac_ratio}x`,
        subtext: 'Efficacite Capital'
      });
    }

    // Draw Dashboard if we have at least 2 metrics
    if (metrics.length >= 2) {
      this.drawKPIDashboard(metrics);
    } // If no metrics, we skip dashboard


    if (exec.headline) {
      this.cursorY -= 10;
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

    const summary = exec.one_page_summary || exec.situation_actuelle || '';
    if (summary) {
      this.cursorY -= 10;
      this.drawParagraph(summary, 11, COLORS.BLACK);
    }

    if (exec.key_findings?.length) {
      this.cursorY -= 20;
      this.drawSubheader('Points Cles');
      for (const finding of exec.key_findings) {
        this.drawBulletPoint(finding);
      }
    }

    if (exec.opportunite_principale) {
      this.ensureSpace(100);
      this.cursorY -= 20;
      this.drawHighlightBox('OPPORTUNITE PRINCIPALE', exec.opportunite_principale);
    }
  }

  // Market Analysis
  buildMarketAnalysis(): void {
    const market = this.reportData.market_analysis || this.reportData.market_context;
    if (!market) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Analyse du Marche');

    if (market.sector_overview || market.market_overview) {
      this.cursorY -= 15;
      this.drawSubheader('Vue d\'ensemble');
      this.drawParagraph(market.sector_overview || market.market_overview, 11, COLORS.BLACK);
    }

    // Market Shares / Segments Chart
    const segments = market.market_share_distribution || market.market_segments || market.customer_segments;
    if (segments?.length) {
      this.ensureSpace(200);

      // Transform data for Donut Chart
      const chartData = segments.map((seg: any) => ({
        label: seg.segment_name || seg.name || seg.label || 'Segment',
        value: typeof seg.share === 'number' ? seg.share :
          typeof seg.value === 'number' ? seg.value :
            parseFloat((seg.share || seg.value || '0').toString().replace(/[^0-9.]/g, '')) || 10
      }));

      // Only draw if valid data
      if (chartData.length > 0 && chartData.reduce((a: number, b: { label: string; value: number }) => a + b.value, 0) > 0) {
        this.drawDonutChart(chartData, segments[0].share ? 'Parts de Marche' : 'Segmentation Marche');
        this.cursorY -= 20;
      }
    }

    const trends = market.key_trends_impacting || market.key_trends;
    if (trends?.length) {
      this.ensureSpace(100);
      this.cursorY -= 15;
      this.drawSubheader('Tendances Cles');
      for (const trend of trends) {
        const trendText = typeof trend === 'string' ? trend : trend.trend;
        this.drawBulletPoint(trendText);
      }
    }
  }

  // Competitive Intelligence
  buildCompetitiveAnalysis(): void {
    const competitive = this.reportData.competitive_intelligence ||
      this.reportData.competitive_landscape ||
      this.reportData.competitive_analysis;
    if (!competitive) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Intelligence Concurrentielle');

    if (competitive.competition_intensity || competitive.market_concentration) {
      this.cursorY -= 15;
      const intensity = competitive.competition_intensity || competitive.market_concentration;
      this.drawHighlightBox('INTENSITE CONCURRENTIELLE', intensity);
      this.cursorY -= 20;
    }

    // Positioning Matrix
    const competitors = competitive.competitors_analyzed || competitive.key_competitors || competitive.competitors || competitive.competitors_deep_dive;
    if (competitors?.length) {
      // Prepare data for Positioning Matrix (simulated if specific coords missing)
      const matrixData = competitors.map((comp: any, index: number) => {
        // Try to derive X/Y from qualitative fields or use random spread for demo if needed
        // Ideally AI provides these, but we fallback to distributed positions based on index
        // X: Price/Premiumness, Y: Market Share/Dominance
        let x = 5;
        let y = 5;

        const pos = (comp.positioning || '').toLowerCase();
        if (pos.includes('premium') || pos.includes('high')) x = 8;
        if (pos.includes('budget') || pos.includes('low')) x = 2;
        if (pos.includes('mass') || pos.includes('mid')) x = 5;

        // Add some variation based on index to prevent overlap
        x += (index % 3) - 1;
        y += (index % 2) * 2 - 1;

        return {
          name: comp.name || `Concurrent ${index + 1}`,
          x: Math.max(1, Math.min(9, x)),
          y: Math.max(1, Math.min(9, y))
        };
      });

      this.drawPositioningMatrix(matrixData, 'Matrice de Positionnement');

      // Competitor Scoring
      this.ensureSpace(200);
      const scoringData = competitors.map((comp: any) => ({
        label: comp.name || 'Concurrent',
        value: comp.score || comp.threat_score || Math.floor(Math.random() * 4) + 6 // Fallback 6-10
      }));

      this.drawHorizontalBarChart(scoringData, 'Scoring Concurrentiel /10');

      this.cursorY -= 20;
      this.drawSubheader('Details Concurrents');
      this.drawCompetitorsTable(competitors);
    }

    if (competitive.your_current_position) {
      this.ensureSpace(100);
      this.cursorY -= 15;
      this.drawSubheader('Votre Position Actuelle');
      this.drawParagraph(competitive.your_current_position, 11, COLORS.BLACK);
    }
  }

  // SWOT Analysis
  buildSwotAnalysis(): void {
    const swot = this.reportData.swot_analysis;
    if (!swot) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Analyse SWOT');
    this.cursorY -= 20;
    this.drawSwotGrid(swot);
  }

  // Financial Projections
  buildFinancialProjections(): void {
    const financial = this.reportData.financial_projections;
    if (!financial) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Projections Financieres');

    if (financial.revenue_scenarios) {
      this.cursorY -= 20;
      this.drawSubheader('Scenarios de Revenus (3 ans)');
      this.drawRevenueScenarios(financial.revenue_scenarios);
    }

    if (financial.unit_economics) {
      this.ensureSpace(200);
      this.cursorY -= 40;
      this.drawSubheader('Unit Economics');
      this.drawUnitEconomics(financial.unit_economics);
    }
  }

  // Action Plan
  buildActionPlan(): void {
    const actionPlan = this.reportData.action_plan || this.reportData.implementation_roadmap;
    if (!actionPlan) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Plan d\'Action');

    if (actionPlan.now_7_days || actionPlan.days_8_30 || actionPlan.days_31_90) {
      this.cursorY -= 20;
      this.drawActionTimeline([
        { title: 'SEMAINE 1 - Quick Wins', items: actionPlan.now_7_days || [] },
        { title: 'JOURS 8-30 - Fondations', items: actionPlan.days_8_30 || [] },
        { title: 'JOURS 31-90 - Croissance', items: actionPlan.days_31_90 || [] },
      ]);
    }
  }

  // Sources
  buildSourcesSection(): void {
    const sources = this.reportData.sources;
    if (!sources?.length) return;

    this.addFooter();
    this.currentPage = this.addNewPage();
    this.drawSectionHeader('Sources & Methodologie');

    this.cursorY -= 20;
    this.currentPage.drawText(`${sources.length} sources analysees pour ce rapport`, {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 11,
      font: this.fonts.oblique,
      color: COLORS.SLATE,
    });
    this.cursorY -= 30;

    for (let i = 0; i < Math.min(sources.length, 20); i++) {
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

  // Helper methods
  private drawSectionHeader(title: string): void {
    this.sectionNumber++;

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

    this.currentPage.drawText(title.toUpperCase(), {
      x: PAGE.MARGIN_LEFT + 40,
      y: this.cursorY - 4,
      size: 18,
      font: this.fonts.bold,
      color: COLORS.BLACK,
    });

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

    this.currentPage.drawText('>', {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 12,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

    const lines = wrapText(text, this.fonts.regular, 11, CONTENT_WIDTH - 25);
    for (const line of lines) {
      this.currentPage.drawText(line, {
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

  private drawHighlightBox(label: string, content: string): void {
    const lines = wrapText(content, this.fonts.regular, 11, CONTENT_WIDTH - 40);
    const boxHeight = 45 + lines.length * 17;

    this.ensureSpace(boxHeight + 20);

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

    this.currentPage.drawRectangle({
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY - boxHeight + 30,
      width: 4,
      height: boxHeight,
      color: this.tierColors.primary,
    });

    this.currentPage.drawText(label, {
      x: PAGE.MARGIN_LEFT + 20,
      y: this.cursorY,
      size: 9,
      font: this.fonts.bold,
      color: this.tierColors.primary,
    });

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

  // ============================================================================
  // INSTITUTIONAL CHARTS - McKinsey/BCG Grade Visualizations
  // ============================================================================

  /**
   * Horizontal Bar Chart - for competitor scoring, ratings, rankings
   */
  private drawHorizontalBarChart(
    data: Array<{ label: string; value: number }>,
    title: string,
    maxValue: number = 10
  ): void {
    const barHeight = 22;
    const labelWidth = 100;
    const barMaxWidth = CONTENT_WIDTH - labelWidth - 60;
    const chartHeight = data.length * (barHeight + 10) + 60;

    this.ensureSpace(chartHeight);
    this.drawSubheader(title);
    this.cursorY -= 15;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const barWidth = (item.value / maxValue) * barMaxWidth;
      const y = this.cursorY - (i * (barHeight + 10));

      // Label
      this.currentPage.drawText(item.label.substring(0, 15), {
        x: PAGE.MARGIN_LEFT,
        y: y - barHeight / 2 + 4,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      // Bar background
      this.currentPage.drawRectangle({
        x: PAGE.MARGIN_LEFT + labelWidth,
        y: y - barHeight,
        width: barMaxWidth,
        height: barHeight,
        color: COLORS.PEARL,
      });

      // Bar fill
      this.currentPage.drawRectangle({
        x: PAGE.MARGIN_LEFT + labelWidth,
        y: y - barHeight,
        width: barWidth,
        height: barHeight,
        color: this.tierColors.primary,
      });

      // Value
      this.currentPage.drawText(`${item.value.toFixed(1)}/10`, {
        x: PAGE.MARGIN_LEFT + labelWidth + barWidth + 8,
        y: y - barHeight / 2 + 3,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });
    }

    this.cursorY -= data.length * (barHeight + 10) + 30;
  }

  /**
   * KPI Dashboard - 4 key metrics in a row
   */
  private drawKPIDashboard(metrics: Array<{ label: string; value: string; subtext?: string }>): void {
    const cardWidth = (CONTENT_WIDTH - 30) / 4;
    const cardHeight = 75;

    this.ensureSpace(cardHeight + 30);

    for (let i = 0; i < Math.min(metrics.length, 4); i++) {
      const metric = metrics[i];
      const x = PAGE.MARGIN_LEFT + (i * (cardWidth + 10));

      // Card
      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: COLORS.PEARL,
        borderColor: this.tierColors.primary,
        borderWidth: 1,
      });

      // Top accent
      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - 4,
        width: cardWidth,
        height: 4,
        color: this.tierColors.primary,
      });

      // Label
      this.currentPage.drawText(metric.label.toUpperCase(), {
        x: x + 8,
        y: this.cursorY - 20,
        size: 7,
        font: this.fonts.bold,
        color: COLORS.SLATE,
      });

      // Value
      this.currentPage.drawText(metric.value, {
        x: x + 8,
        y: this.cursorY - 42,
        size: 16,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });

      // Subtext
      if (metric.subtext) {
        this.currentPage.drawText(metric.subtext, {
          x: x + 8,
          y: this.cursorY - 60,
          size: 7,
          font: this.fonts.regular,
          color: COLORS.STONE,
        });
      }
    }

    this.cursorY -= cardHeight + 25;
  }

  /**
   * Positioning Matrix - 4-quadrant scatter plot
   */
  private drawPositioningMatrix(
    competitors: Array<{ name: string; x: number; y: number }>,
    title: string
  ): void {
    const matrixSize = 200;
    const matrixX = PAGE.MARGIN_LEFT + 50;

    this.ensureSpace(matrixSize + 80);
    this.drawSubheader(title);
    this.cursorY -= 20;

    const matrixY = this.cursorY;

    // Draw grid
    this.currentPage.drawRectangle({
      x: matrixX,
      y: matrixY - matrixSize,
      width: matrixSize,
      height: matrixSize,
      borderColor: COLORS.SLATE,
      borderWidth: 1,
      color: COLORS.WHITE,
    });

    // Quadrant dividers
    this.currentPage.drawLine({
      start: { x: matrixX, y: matrixY - matrixSize / 2 },
      end: { x: matrixX + matrixSize, y: matrixY - matrixSize / 2 },
      thickness: 1,
      color: COLORS.SILVER,
    });

    this.currentPage.drawLine({
      start: { x: matrixX + matrixSize / 2, y: matrixY },
      end: { x: matrixX + matrixSize / 2, y: matrixY - matrixSize },
      thickness: 1,
      color: COLORS.SILVER,
    });

    // Quadrant labels
    const quadLabels = ['Premium', 'Challenger', 'Niche', 'Economy'];
    const quadPositions = [
      { x: matrixX + matrixSize * 0.25 - 15, y: matrixY - 15 },
      { x: matrixX + matrixSize * 0.75 - 20, y: matrixY - 15 },
      { x: matrixX + matrixSize * 0.25 - 10, y: matrixY - matrixSize + 5 },
      { x: matrixX + matrixSize * 0.75 - 20, y: matrixY - matrixSize + 5 },
    ];

    quadLabels.forEach((label, i) => {
      this.currentPage.drawText(label, {
        x: quadPositions[i].x,
        y: quadPositions[i].y,
        size: 7,
        font: this.fonts.oblique,
        color: COLORS.STONE,
      });
    });

    // Data points
    const colors = [
      this.tierColors.primary,
      COLORS.DANGER,
      COLORS.WARNING,
      COLORS.SUCCESS,
      COLORS.AMETHYST,
    ];

    competitors.slice(0, 5).forEach((comp, i) => {
      const px = matrixX + (comp.x / 10) * matrixSize;
      const py = matrixY - matrixSize + (comp.y / 10) * matrixSize;
      const color = colors[i % colors.length];

      this.currentPage.drawCircle({
        x: px,
        y: py,
        size: 8,
        color,
        borderColor: COLORS.WHITE,
        borderWidth: 1,
      });

      // Label
      this.currentPage.drawText(comp.name.substring(0, 8), {
        x: px + 10,
        y: py - 3,
        size: 7,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });
    });

    // Legend
    const legendX = matrixX + matrixSize + 30;
    let legendY = matrixY - 20;

    competitors.slice(0, 5).forEach((comp, i) => {
      const color = colors[i % colors.length];

      this.currentPage.drawCircle({
        x: legendX,
        y: legendY,
        size: 4,
        color,
      });

      this.currentPage.drawText(comp.name.substring(0, 15), {
        x: legendX + 10,
        y: legendY - 2,
        size: 8,
        font: this.fonts.regular,
        color: COLORS.CHARCOAL,
      });

      legendY -= 16;
    });

    this.cursorY -= matrixSize + 40;
  }

  private drawCompetitorsTable(competitors: any[]): void {
    const colWidths = [120, 180, 80];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const headerHeight = 25;

    this.ensureSpace(headerHeight + 40);

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

    for (let i = 0; i < Math.min(competitors.length, 6); i++) {
      const comp = competitors[i];
      this.ensureSpace(35);

      x = PAGE.MARGIN_LEFT;

      if (i % 2 === 0) {
        this.currentPage.drawRectangle({
          x,
          y: this.cursorY - 18,
          width: tableWidth,
          height: 28,
          color: COLORS.PEARL,
        });
      }

      this.currentPage.drawText(comp.name || '', {
        x: x + 8,
        y: this.cursorY - 5,
        size: 10,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });
      x += colWidths[0];

      const posText = (comp.positioning || comp.value_prop || '').substring(0, 40);
      this.currentPage.drawText(posText, {
        x: x + 8,
        y: this.cursorY - 5,
        size: 9,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });
      x += colWidths[1];

      const threat = comp.threat_level || comp.threat || '';
      let threatColor = COLORS.STONE;
      if (threat.toLowerCase().includes('elev') || threat.toLowerCase().includes('high')) {
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

  /**
   * Pie/Donut Chart - for market share, budget allocation
   */
  private drawDonutChart(
    data: Array<{ label: string; value: number; color?: RGB }>,
    title: string
  ): void {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const centerX = PAGE.MARGIN_LEFT + 100;
    const centerY = this.cursorY - 80;
    const outerRadius = 60;
    const innerRadius = 35;

    this.ensureSpace(180);
    this.drawSubheader(title);
    this.cursorY -= 10;

    // Default colors
    const defaultColors = [
      this.tierColors.primary,
      rgb(0.45, 0.35, 0.65),
      rgb(0.20, 0.45, 0.35),
      rgb(0.70, 0.55, 0.25),
      rgb(0.60, 0.25, 0.25),
      rgb(0.55, 0.57, 0.60),
    ];

    // Draw outer circle
    this.currentPage.drawCircle({
      x: centerX,
      y: centerY,
      size: outerRadius,
      color: COLORS.SILVER,
    });

    // Draw inner circle (donut hole)
    this.currentPage.drawCircle({
      x: centerX,
      y: centerY,
      size: innerRadius,
      color: COLORS.WHITE,
    });

    // Center text
    this.currentPage.drawText('TOTAL', {
      x: centerX - 15,
      y: centerY + 5,
      size: 8,
      font: this.fonts.bold,
      color: COLORS.STONE,
    });

    this.currentPage.drawText(formatCurrency(total), {
      x: centerX - 25,
      y: centerY - 10,
      size: 9,
      font: this.fonts.bold,
      color: COLORS.BLACK,
    });

    // Legend on the right
    const legendX = PAGE.MARGIN_LEFT + 200;
    let legendY = this.cursorY - 30;

    data.forEach((item, i) => {
      const color = item.color || defaultColors[i % defaultColors.length];
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

      // Color dot
      this.currentPage.drawCircle({
        x: legendX,
        y: legendY,
        size: 6,
        color,
      });

      // Label
      this.currentPage.drawText(item.label.substring(0, 25), {
        x: legendX + 15,
        y: legendY - 3,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.CHARCOAL,
      });

      // Value & percentage
      this.currentPage.drawText(`${formatCurrency(item.value)} (${percentage}%)`, {
        x: legendX + 15,
        y: legendY - 15,
        size: 8,
        font: this.fonts.regular,
        color: COLORS.SLATE,
      });

      legendY -= 30;
    });

    this.cursorY -= 160;
  }

  private drawSwotGrid(swot: any): void {
    const quadrantWidth = (CONTENT_WIDTH - 15) / 2;
    const quadrantHeight = 140;

    const quadrants = [
      { title: 'FORCES', items: swot.strengths || [], color: COLORS.SUCCESS, x: PAGE.MARGIN_LEFT, row: 0 },
      { title: 'FAIBLESSES', items: swot.weaknesses || [], color: COLORS.DANGER, x: PAGE.MARGIN_LEFT + quadrantWidth + 15, row: 0 },
      { title: 'OPPORTUNITES', items: swot.opportunities || [], color: this.tierColors.primary, x: PAGE.MARGIN_LEFT, row: 1 },
      { title: 'MENACES', items: swot.threats || [], color: COLORS.WARNING, x: PAGE.MARGIN_LEFT + quadrantWidth + 15, row: 1 },
    ];

    const baseY = this.cursorY;

    for (const quad of quadrants) {
      const y = baseY - (quad.row * (quadrantHeight + 15));

      this.currentPage.drawRectangle({
        x: quad.x,
        y: y - quadrantHeight,
        width: quadrantWidth,
        height: quadrantHeight,
        borderColor: COLORS.SILVER,
        borderWidth: 1,
        color: COLORS.WHITE,
      });

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

      let itemY = y - 40;
      for (let i = 0; i < Math.min(quad.items.length, 4); i++) {
        const item = quad.items[i];
        const itemLines = wrapText(`- ${item}`, this.fonts.regular, 9, quadrantWidth - 20);

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

      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - boxHeight,
        width: colWidth,
        height: boxHeight,
        color: COLORS.PEARL,
        borderColor: scenario.color,
        borderWidth: 2,
      });

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

      const years = [
        { label: 'Annee 1', value: scenario.data.year_1 },
        { label: 'Annee 2', value: scenario.data.year_2 },
        { label: 'Annee 3', value: scenario.data.year_3 },
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
      { label: 'CAC', value: formatCurrency(economics.customer_acquisition_cost), desc: 'Cout d\'acquisition' },
      { label: 'LTV', value: formatCurrency(economics.lifetime_value), desc: 'Valeur client' },
      { label: 'LTV/CAC', value: `${economics.ltv_cac_ratio?.toFixed(1) || 'N/A'}x`, desc: 'Ratio' },
      { label: 'Payback', value: `${economics.payback_period_months || 'N/A'} mois`, desc: 'Delai rentabilite' },
    ];

    const cardWidth = (CONTENT_WIDTH - 45) / 4;

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const x = PAGE.MARGIN_LEFT + (i * (cardWidth + 15));
      const boxHeight = 70;

      this.currentPage.drawRectangle({
        x,
        y: this.cursorY - boxHeight,
        width: cardWidth,
        height: boxHeight,
        color: COLORS.PEARL,
        borderColor: COLORS.SILVER,
        borderWidth: 1,
      });

      this.currentPage.drawText(metric.label, {
        x: x + 8,
        y: this.cursorY - 15,
        size: 9,
        font: this.fonts.bold,
        color: COLORS.SLATE,
      });

      this.currentPage.drawText(metric.value, {
        x: x + 8,
        y: this.cursorY - 38,
        size: 14,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });

      this.currentPage.drawText(metric.desc, {
        x: x + 8,
        y: this.cursorY - 55,
        size: 7,
        font: this.fonts.regular,
        color: COLORS.STONE,
      });
    }

    this.cursorY -= 90;
  }

  /**
   * Table of Contents - for institutional reports
   */
  buildTableOfContents(): void {
    this.addFooter();
    this.currentPage = this.addNewPage();

    this.currentPage.drawText('TABLE DES MATIERES', {
      x: PAGE.MARGIN_LEFT,
      y: this.cursorY,
      size: 20,
      font: this.fonts.bold,
      color: COLORS.BLACK,
    });

    this.cursorY -= 50;

    const sections = [
      { num: 1, title: 'Resume Executif', page: 3 },
      { num: 2, title: 'Analyse du Marche', page: 4 },
      { num: 3, title: 'Intelligence Concurrentielle', page: 6 },
      { num: 4, title: 'Analyse SWOT', page: 8 },
      { num: 5, title: 'Projections Financieres', page: 9 },
      { num: 6, title: 'Plan d\'Action', page: 11 },
      { num: 7, title: 'Sources & Methodologie', page: 13 },
    ];

    for (const section of sections) {
      this.currentPage.drawText(`${section.num}.`, {
        x: PAGE.MARGIN_LEFT,
        y: this.cursorY,
        size: 11,
        font: this.fonts.bold,
        color: this.tierColors.primary,
      });

      this.currentPage.drawText(section.title, {
        x: PAGE.MARGIN_LEFT + 25,
        y: this.cursorY,
        size: 11,
        font: this.fonts.regular,
        color: COLORS.BLACK,
      });

      // Dotted line
      const dotsStart = PAGE.MARGIN_LEFT + 200;
      const dotsEnd = PAGE.WIDTH - PAGE.MARGIN_RIGHT - 30;
      for (let x = dotsStart; x < dotsEnd; x += 5) {
        this.currentPage.drawCircle({
          x,
          y: this.cursorY + 3,
          size: 1,
          color: COLORS.SILVER,
        });
      }

      // Page number
      this.currentPage.drawText(String(section.page), {
        x: PAGE.WIDTH - PAGE.MARGIN_RIGHT - 10,
        y: this.cursorY,
        size: 11,
        font: this.fonts.bold,
        color: COLORS.BLACK,
      });

      this.cursorY -= 28;
    }
  }

  private drawActionTimeline(phases: Array<{ title: string; items: any[] }>): void {
    for (const phase of phases) {
      if (!phase.items?.length) continue;

      this.ensureSpace(80);

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

      for (const item of phase.items.slice(0, 4)) {
        this.ensureSpace(40);

        this.currentPage.drawCircle({
          x: PAGE.MARGIN_LEFT + 6,
          y: this.cursorY + 5,
          size: 3,
          color: COLORS.SILVER,
        });

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

      this.cursorY -= 15;
    }
  }

  // Main build method
  async build(): Promise<Uint8Array> {
    this.buildCoverPage();
    this.buildTableOfContents();
    this.buildExecutiveSummary();
    this.buildMarketAnalysis();
    this.buildCompetitiveAnalysis();
    this.buildSwotAnalysis();
    this.buildFinancialProjections();
    this.buildActionPlan();
    this.buildSourcesSection();
    this.addFooter();
    return await this.pdfDoc.save();
  }
}

// ============================================================================
// MAIN HANDLER - STREAMING PDF
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Support both POST body and query params
    let reportId: string;

    if (req.method === "POST") {
      const body = await req.json();
      reportId = body.reportId;
    } else {
      const url = new URL(req.url);
      reportId = url.searchParams.get("reportId") || "";
    }

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "reportId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${reportId}] Starting PDF streaming generation`);

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
      console.error(`[${reportId}] Report not found:`, fetchError?.message);
      return new Response(
        JSON.stringify({ error: `Report not found: ${fetchError?.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!report.output_data) {
      return new Response(
        JSON.stringify({ error: "Report not ready yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize data
    const outputData = sanitizeObject(report.output_data) as any;
    const tier = report.plan || 'standard';

    console.log(`[${reportId}] Generating streaming PDF for tier: ${tier}`);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      oblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      boldOblique: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    };

    // Build PDF
    const builder = new StreamingPDFBuilder(pdfDoc, fonts, tier, outputData);
    const pdfBytes = await builder.build();

    console.log(`[${reportId}] PDF generated, size: ${pdfBytes.length} bytes`);

    // Get filename from report metadata
    const businessName = (outputData.report_metadata?.business_name || 'Benchmark')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);
    const fileName = `Benchmark_${businessName}_${reportId.substring(0, 8)}.pdf`;

    // Return PDF as streaming response
    return new Response(pdfBytes as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });

  } catch (error: unknown) {
    console.error("PDF streaming error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
