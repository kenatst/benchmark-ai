import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportData {
  report_metadata: {
    title: string;
    generated_date: string;
    business_name: string;
    sector: string;
    location: string;
    tier: string;
    sources_count?: number;
  };
  executive_summary: {
    headline?: string;
    one_page_summary?: string;
    situation_actuelle: string;
    opportunite_principale: string;
    key_findings?: string[];
  };
  market_context?: {
    sector_overview: string;
    local_market_specifics: string;
    market_maturity: string;
    key_trends_impacting: string[];
  };
  competitive_landscape?: {
    competition_intensity: string;
    competitors_analyzed: Array<{
      name: string;
      positioning: string;
      strengths: string[];
      weaknesses: string[];
      threat_level: string;
    }>;
    your_current_position: string;
  };
  positioning_recommendations?: {
    recommended_positioning: string;
    rationale: string;
    value_proposition: string;
    tagline_suggestions: string[];
  };
  pricing_strategy?: {
    current_assessment: string;
    market_benchmarks: {
      budget_tier: string;
      mid_tier: string;
      premium_tier: string;
    };
  };
  action_plan?: {
    now_7_days: Array<{ action: string; owner: string; outcome: string }>;
    days_8_30: Array<{ action: string; owner: string; outcome: string }>;
    days_31_90: Array<{ action: string; owner: string; outcome: string }>;
  };
  sources?: Array<{ title: string; url: string }>;
}

// Colors
const PRIMARY = rgb(0.1, 0.1, 0.1);
const SECONDARY = rgb(0.4, 0.4, 0.4);
const ACCENT_STANDARD = rgb(0.96, 0.62, 0.04);
const ACCENT_PRO = rgb(0.55, 0.36, 0.96);
const ACCENT_AGENCY = rgb(0.05, 0.65, 0.91);
const LIGHT_BG = rgb(0.97, 0.97, 0.95);
const WHITE = rgb(1, 1, 1);

function getAccentColor(tier: string) {
  if (tier === 'pro') return ACCENT_PRO;
  if (tier === 'agency') return ACCENT_AGENCY;
  return ACCENT_STANDARD;
}

// Word wrap helper
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.5;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reportId } = await req.json();
    console.log(`[${reportId}] Starting PDF generation with pdf-lib`);

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

    const outputData = report.output_data as ReportData;
    const plan = report.plan || 'standard';
    const accent = getAccentColor(plan);

    console.log(`[${reportId}] Generating PDF for tier: ${plan}`);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // ===== COVER PAGE =====
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 150;

    // Tier badge
    const tierLabel = plan.toUpperCase();
    page.drawRectangle({
      x: pageWidth / 2 - 50,
      y: y,
      width: 100,
      height: 24,
      color: accent,
    });
    page.drawText(tierLabel, {
      x: pageWidth / 2 - helveticaBold.widthOfTextAtSize(tierLabel, 10) / 2,
      y: y + 7,
      size: 10,
      font: helveticaBold,
      color: WHITE,
    });

    y -= 60;

    // Title
    const title = outputData.report_metadata?.title || 'Benchmark Stratégique';
    const titleLines = wrapText(title, contentWidth, 28);
    for (const line of titleLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 28,
        font: helveticaBold,
        color: PRIMARY,
      });
      y -= 36;
    }

    y -= 20;

    // Subtitle
    const subtitle = `${outputData.report_metadata?.business_name || ''} - ${outputData.report_metadata?.sector || ''}`;
    page.drawText(subtitle, {
      x: margin,
      y,
      size: 14,
      font: helvetica,
      color: SECONDARY,
    });

    y -= 40;

    // Meta info
    const location = outputData.report_metadata?.location || '';
    const date = outputData.report_metadata?.generated_date || new Date().toLocaleDateString('fr-FR');
    page.drawText(`${location} | ${date}`, {
      x: margin,
      y,
      size: 11,
      font: helvetica,
      color: SECONDARY,
    });

    // ===== CONTENT PAGES =====
    let sectionNumber = 1;

    const addNewPage = () => {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      return pageHeight - margin;
    };

    const drawSectionHeader = (title: string, currentY: number): number => {
      if (currentY < 150) currentY = addNewPage();
      
      // Section number box
      page.drawRectangle({
        x: margin,
        y: currentY - 4,
        width: 24,
        height: 24,
        color: accent,
      });
      page.drawText(String(sectionNumber), {
        x: margin + 9,
        y: currentY + 2,
        size: 12,
        font: helveticaBold,
        color: WHITE,
      });
      
      // Title
      page.drawText(title, {
        x: margin + 34,
        y: currentY,
        size: 16,
        font: helveticaBold,
        color: PRIMARY,
      });
      
      // Line
      page.drawLine({
        start: { x: margin, y: currentY - 12 },
        end: { x: pageWidth - margin, y: currentY - 12 },
        thickness: 2,
        color: accent,
      });
      
      sectionNumber++;
      return currentY - 40;
    };

    const drawParagraph = (text: string, currentY: number, fontSize = 11): number => {
      const lines = wrapText(text, contentWidth, fontSize);
      for (const line of lines) {
        if (currentY < 60) currentY = addNewPage();
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: helvetica,
          color: PRIMARY,
        });
        currentY -= fontSize + 6;
      }
      return currentY - 10;
    };

    const drawBulletPoint = (text: string, currentY: number): number => {
      if (currentY < 60) currentY = addNewPage();
      page.drawText('→', {
        x: margin,
        y: currentY,
        size: 11,
        font: helveticaBold,
        color: accent,
      });
      const lines = wrapText(text, contentWidth - 20, 11);
      for (let i = 0; i < lines.length; i++) {
        if (currentY < 60) currentY = addNewPage();
        page.drawText(lines[i], {
          x: margin + 18,
          y: currentY,
          size: 11,
          font: helvetica,
          color: PRIMARY,
        });
        currentY -= 17;
      }
      return currentY;
    };

    const drawCard = (title: string, content: string, currentY: number): number => {
      if (currentY < 120) currentY = addNewPage();
      
      const contentLines = wrapText(content, contentWidth - 40, 10);
      const cardHeight = 50 + contentLines.length * 16;
      
      page.drawRectangle({
        x: margin,
        y: currentY - cardHeight + 30,
        width: contentWidth,
        height: cardHeight,
        color: LIGHT_BG,
      });
      
      page.drawText(title, {
        x: margin + 15,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: PRIMARY,
      });
      
      currentY -= 24;
      for (const line of contentLines) {
        page.drawText(line, {
          x: margin + 15,
          y: currentY,
          size: 10,
          font: helvetica,
          color: SECONDARY,
        });
        currentY -= 16;
      }
      
      return currentY - 20;
    };

    // Start content
    y = addNewPage();

    // Executive Summary
    y = drawSectionHeader('Résumé Exécutif', y);
    
    if (outputData.executive_summary?.one_page_summary) {
      y = drawCard('Synthèse', outputData.executive_summary.one_page_summary, y);
    }
    
    if (outputData.executive_summary?.situation_actuelle) {
      y = drawCard('Situation Actuelle', outputData.executive_summary.situation_actuelle, y);
    }
    
    if (outputData.executive_summary?.opportunite_principale) {
      y = drawCard('Opportunité Principale', outputData.executive_summary.opportunite_principale, y);
    }
    
    if (outputData.executive_summary?.key_findings?.length) {
      y -= 10;
      page.drawText('Points Clés:', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: PRIMARY,
      });
      y -= 20;
      for (const finding of outputData.executive_summary.key_findings) {
        y = drawBulletPoint(finding, y);
      }
    }

    // Market Context
    if (outputData.market_context) {
      y = drawSectionHeader('Contexte Marché', y);
      y = drawParagraph(outputData.market_context.sector_overview, y);
      
      if (outputData.market_context.local_market_specifics) {
        y = drawCard('Spécificités Locales', outputData.market_context.local_market_specifics, y);
      }
      
      if (outputData.market_context.key_trends_impacting?.length) {
        page.drawText('Tendances Clés:', {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: PRIMARY,
        });
        y -= 20;
        for (const trend of outputData.market_context.key_trends_impacting) {
          y = drawBulletPoint(trend, y);
        }
      }
    }

    // Competitive Landscape
    if (outputData.competitive_landscape) {
      y = drawSectionHeader('Analyse Concurrentielle', y);
      
      y = drawCard(
        `Intensité: ${outputData.competitive_landscape.competition_intensity}`,
        outputData.competitive_landscape.your_current_position || '',
        y
      );
      
      if (outputData.competitive_landscape.competitors_analyzed?.length) {
        page.drawText('Concurrents Analysés:', {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: PRIMARY,
        });
        y -= 25;
        
        for (const comp of outputData.competitive_landscape.competitors_analyzed.slice(0, 5)) {
          if (y < 100) y = addNewPage();
          
          page.drawText(`• ${comp.name}`, {
            x: margin,
            y,
            size: 11,
            font: helveticaBold,
            color: PRIMARY,
          });
          y -= 16;
          
          page.drawText(`  Position: ${comp.positioning} | Menace: ${comp.threat_level}`, {
            x: margin,
            y,
            size: 10,
            font: helvetica,
            color: SECONDARY,
          });
          y -= 20;
        }
      }
    }

    // Positioning
    if (outputData.positioning_recommendations) {
      y = drawSectionHeader('Recommandations de Positionnement', y);
      
      y = drawCard('Positionnement Recommandé', outputData.positioning_recommendations.recommended_positioning, y);
      
      if (outputData.positioning_recommendations.value_proposition) {
        y = drawCard('Proposition de Valeur', outputData.positioning_recommendations.value_proposition, y);
      }
      
      if (outputData.positioning_recommendations.tagline_suggestions?.length) {
        page.drawText('Suggestions de Taglines:', {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: PRIMARY,
        });
        y -= 20;
        for (const tagline of outputData.positioning_recommendations.tagline_suggestions) {
          y = drawBulletPoint(`"${tagline}"`, y);
        }
      }
    }

    // Pricing Strategy
    if (outputData.pricing_strategy) {
      y = drawSectionHeader('Stratégie Tarifaire', y);
      
      if (outputData.pricing_strategy.current_assessment) {
        y = drawParagraph(outputData.pricing_strategy.current_assessment, y);
      }
      
      const benchmarks = outputData.pricing_strategy.market_benchmarks;
      if (benchmarks) {
        y -= 10;
        page.drawText('Benchmarks Marché:', {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: PRIMARY,
        });
        y -= 25;
        y = drawBulletPoint(`Budget: ${benchmarks.budget_tier}`, y);
        y = drawBulletPoint(`Milieu: ${benchmarks.mid_tier}`, y);
        y = drawBulletPoint(`Premium: ${benchmarks.premium_tier}`, y);
      }
    }

    // Action Plan
    if (outputData.action_plan) {
      y = drawSectionHeader('Plan d\'Action', y);
      
      const renderActions = (title: string, actions: Array<{ action: string; outcome: string }>) => {
        if (!actions?.length) return;
        if (y < 100) y = addNewPage();
        
        page.drawText(title, {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: accent,
        });
        y -= 20;
        
        for (const item of actions.slice(0, 4)) {
          y = drawBulletPoint(`${item.action} → ${item.outcome}`, y);
        }
        y -= 10;
      };
      
      renderActions('Semaine 1 (J1-7)', outputData.action_plan.now_7_days);
      renderActions('Jours 8-30', outputData.action_plan.days_8_30);
      renderActions('Jours 31-90', outputData.action_plan.days_31_90);
    }

    // Sources
    if (outputData.sources?.length) {
      y = drawSectionHeader('Sources', y);
      
      for (const source of outputData.sources.slice(0, 10)) {
        if (y < 60) y = addNewPage();
        const text = source.title || source.url;
        y = drawBulletPoint(text, y);
      }
    }

    // Footer on last page
    page.drawText('Généré par Benchmark IQ', {
      x: margin,
      y: 30,
      size: 9,
      font: helvetica,
      color: SECONDARY,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
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
