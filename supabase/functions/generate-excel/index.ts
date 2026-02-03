import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// INSTITUTIONAL COLOR PALETTE - McKinsey/BCG Grade
// ============================================================================
const COLORS = {
  primary: "1A3A5C",      // Deep navy
  secondary: "7C6B9C",    // Muted purple
  accent: "B89456",       // Gold
  success: "2D7A5A",      // Forest green
  warning: "B38F40",      // Amber
  danger: "9A4040",       // Wine red
  lightBg: "F5F7F8",      // Pearl background
  headerBg: "2E2E33",     // Charcoal
};

// ============================================================================
// INSTITUTIONAL SHEET BUILDERS
// ============================================================================

function buildExecutiveSummarySheet(data: any): any[][] {
  const rows: any[][] = [
    ["RAPPORT BENCHMARK IQ", "", "", "RÉSUMÉ EXÉCUTIF"],
    [],
    ["Entreprise", data?.report_metadata?.business_name || "", "", "Secteur", data?.report_metadata?.sector || ""],
    ["Localisation", data?.report_metadata?.location || "", "", "Date", data?.report_metadata?.generated_date || ""],
    [],
    ["RECOMMANDATION PRINCIPALE"],
    [data?.executive_summary?.strategic_recommendation || ""],
    [],
    ["INVESTISSEMENT REQUIS", data?.executive_summary?.investment_required || "EUR", "ROI ATTENDU", data?.executive_summary?.expected_roi || "Mois"],
    [],
    ["FACTEURS CRITIQUES DE SUCCÈS"],
  ];

  const csf = data?.executive_summary?.critical_success_factors || [];
  csf.slice(0, 5).forEach((factor: string, i: number) => {
    rows.push([`${i + 1}. ${factor}`]);
  });

  rows.push([], ["MÉTRIQUES À SUIVRE"]);

  const metrics = data?.executive_summary?.key_metrics_to_track || [];
  metrics.slice(0, 5).forEach((metric: string, i: number) => {
    rows.push([`${i + 1}. ${metric}`]);
  });

  return rows;
}

function buildCompetitorScoringSheet(data: any): any[][] {
  const scoring = data?.scoring_matrix;
  const competitors = scoring?.competitors || [];
  const criteria = scoring?.criteria || [];

  const rows: any[][] = [
    ["MATRICE DE SCORING CONCURRENTIEL - DONNÉES POUR RADAR CHART"],
    [],
    ["Concurrent", ...criteria, "TOTAL"],
  ];

  competitors.forEach((comp: any) => {
    const row = [comp.name];
    criteria.forEach((criterion: string) => {
      const score = comp.scores?.[criterion] || 0;
      row.push(Math.min(10, Math.max(0, score)));
    });
    row.push(comp.total || 0);
    rows.push(row);
  });

  rows.push([], ["ANALYSE DE SENSIBILITÉ"]);

  const sensitivity = scoring?.sensitivity_analysis || [];
  sensitivity.forEach((analysis: any) => {
    rows.push([`${analysis.model}:`, ...(analysis.rankings || [])]);
  });

  rows.push([], ["INTERPRÉTATION"]);
  rows.push([scoring?.interpretation || ""]);

  return rows;
}

function buildFinancialProjectionsSheet(data: any): any[][] {
  const financial = data?.financial_projections;
  const scenarios = financial?.revenue_scenarios;
  const unitEcon = financial?.unit_economics;

  const rows: any[][] = [
    ["PROJECTIONS FINANCIÈRES"],
    [],
    ["INVESTISSEMENT REQUIS (12 mois)", financial?.investment_required?.total_12_months || ""],
    [],
    ["RÉPARTITION BUDGÉTAIRE (Pie Chart)"],
    ["Catégorie", "Montant (EUR)", "%"],
  ];

  const breakdown = financial?.investment_required?.breakdown || [];
  const totalBudget = breakdown.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);

  breakdown.forEach((item: any) => {
    const amount = parseFloat(item.amount) || 0;
    const percentage = totalBudget > 0 ? ((amount / totalBudget) * 100).toFixed(1) : 0;
    rows.push([item.category, amount, percentage]);
  });

  rows.push([], ["SCÉNARIOS DE REVENUS (Line/Column Chart)"]);
  rows.push(["Scénario", "Année 1 (EUR)", "Année 2 (EUR)", "Année 3 (EUR)"]);

  if (scenarios?.conservative) {
    rows.push(["Conservateur", scenarios.conservative.year_1 || 0, scenarios.conservative.year_2 || 0, scenarios.conservative.year_3 || 0]);
  }
  if (scenarios?.baseline) {
    rows.push(["Base", scenarios.baseline.year_1 || 0, scenarios.baseline.year_2 || 0, scenarios.baseline.year_3 || 0]);
  }
  if (scenarios?.optimistic) {
    rows.push(["Optimiste", scenarios.optimistic.year_1 || 0, scenarios.optimistic.year_2 || 0, scenarios.optimistic.year_3 || 0]);
  }

  rows.push([], ["UNIT ECONOMICS - KPIs"]);
  rows.push(["Métrique", "Valeur", "Benchmark Secteur"]);

  if (unitEcon) {
    rows.push(["CAC", unitEcon.customer_acquisition_cost || 0, "Variable"]);
    rows.push(["LTV", unitEcon.lifetime_value || 0, "3-5x CAC"]);
    rows.push(["LTV/CAC", unitEcon.ltv_cac_ratio || 0, "> 3"]);
    rows.push(["Payback", unitEcon.payback_period_months || 0, "< 12 mois"]);
    rows.push(["Marge Brute %", unitEcon.gross_margin_percent || 0, "40-60%"]);
  }

  return rows;
}

function buildPositioningMatrixSheet(data: any): any[][] {
  const matrixData = data?.competitive_intelligence?.competitive_positioning_maps?.primary_map || {};
  const competitors = matrixData.positions || matrixData.competitors_plotted || [];

  const xAxis = matrixData.x_axis || "Prix";
  const yAxis = matrixData.y_axis || "Qualité";

  const rows: any[][] = [
    ["MATRICE DE POSITIONNEMENT - Scatter Plot Data"],
    [],
    [xAxis, yAxis, "Concurrent"],
  ];

  competitors.slice(0, 8).forEach((comp: any) => {
    rows.push([comp.x || 0, comp.y || 0, comp.name || comp.competitor || ""]);
  });

  if (matrixData.recommended_position) {
    rows.push([], ["POSITION RECOMMANDÉE"]);
    rows.push([matrixData.recommended_position.x, matrixData.recommended_position.y, "Cible"]);
  }

  return rows;
}

function buildSWOTSheet(data: any): any[][] {
  const swot = data?.swot_analysis || {};

  const strengths = (swot.strengths || []).slice(0, 4);
  const weaknesses = (swot.weaknesses || []).slice(0, 4);
  const opportunities = (swot.opportunities || []).slice(0, 4);
  const threats = (swot.threats || []).slice(0, 4);
  const maxRows = Math.max(strengths.length, weaknesses.length, opportunities.length, threats.length);

  const rows: any[][] = [
    ["ANALYSE SWOT STRATÉGIQUE"],
    [],
    ["FORCES", "FAIBLESSES"],
  ];

  for (let i = 0; i < maxRows; i++) {
    rows.push([
      strengths[i] ? `• ${strengths[i]}` : "",
      weaknesses[i] ? `• ${weaknesses[i]}` : ""
    ]);
  }

  rows.push([], ["OPPORTUNITÉS", "MENACES"]);

  for (let i = 0; i < maxRows; i++) {
    rows.push([
      opportunities[i] ? `• ${opportunities[i]}` : "",
      threats[i] ? `• ${threats[i]}` : ""
    ]);
  }

  rows.push([], ["PRIORITÉS STRATÉGIQUES"]);
  const priorities = swot.strategic_priorities || [];
  priorities.forEach((p: string, i: number) => {
    rows.push([`${i + 1}. ${p}`]);
  });

  return rows;
}

function buildRoadmapSheet(data: any): any[][] {
  const roadmap = data?.detailed_roadmap || data?.implementation_roadmap;

  const rows: any[][] = [
    ["ROADMAP 12 MOIS"],
    [],
  ];

  if (roadmap?.phases) {
    roadmap.phases.forEach((phase: any) => {
      rows.push([`${phase.phase} - ${phase.title}`]);
      rows.push(["Timeline:", phase.timeline]);
      rows.push(["Tâches:"]);
      (phase.tasks || []).slice(0, 3).forEach((task: string) => {
        rows.push(["", `• ${task}`]);
      });
      if (phase.kpis?.length) {
        rows.push(["KPIs:"]);
        phase.kpis.slice(0, 2).forEach((kpi: string) => {
          rows.push(["", `• ${kpi}`]);
        });
      }
      rows.push([]);
    });
  }

  if (roadmap?.budget_breakdown) {
    rows.push(["RÉPARTITION BUDGET"]);
    rows.push(["Catégorie", "Montant"]);
    roadmap.budget_breakdown.forEach((item: any) => {
      rows.push([item.category, item.amount]);
    });
    rows.push([]);
    rows.push(["BUDGET TOTAL", roadmap.total_budget]);
  }

  return rows;
}

function buildSourcesSheet(data: any): any[][] {
  const sources = data?.sources || [];

  const rows: any[][] = [
    ["SOURCES & RÉFÉRENCES"],
    [],
    ["Source", "URL"],
  ];

  sources.slice(0, 20).forEach((source: any) => {
    const title = typeof source === 'string' ? source : (source.title || source.url || "");
    const url = typeof source === 'string' ? source : (source.url || "");
    rows.push([title, url]);
  });

  rows.push([], ["TOTAL SOURCES", sources.length]);

  return rows;
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

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "reportId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${reportId}] Starting INSTITUTIONAL-GRADE Excel generation`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return new Response(
        JSON.stringify({ error: `Report not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (report.plan !== "agency") {
      return new Response(
        JSON.stringify({ error: "Excel export is only available for Agency tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const outputData = report.output_data;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Build sheets
    const sheets = [
      { name: "Résumé Exécutif", data: buildExecutiveSummarySheet(outputData) },
      { name: "Scoring Concurrents", data: buildCompetitorScoringSheet(outputData) },
      { name: "Projections Financières", data: buildFinancialProjectionsSheet(outputData) },
      { name: "Matrice Position", data: buildPositioningMatrixSheet(outputData) },
      { name: "SWOT", data: buildSWOTSheet(outputData) },
      { name: "Roadmap", data: buildRoadmapSheet(outputData) },
      { name: "Sources", data: buildSourcesSheet(outputData) },
    ];

    for (const sheet of sheets) {
      const wsSheet = XLSX.utils.aoa_to_sheet(sheet.data);

      // Set column widths for better readability
      wsSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }
      ];

      // Set default row heights
      wsSheet["!rows"] = sheet.data.map((_, i) => ({ hpx: i === 0 ? 26 : 20 }));

      XLSX.utils.book_append_sheet(workbook, wsSheet, sheet.name);
    }

    // Generate Excel with proper formatting
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    console.log(`[${reportId}] INSTITUTIONAL Excel generated, size: ${excelBuffer.length} bytes`);

    const businessName = (outputData?.report_metadata?.business_name || "Benchmark")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const fileName = `Benchmark_${businessName}_${reportId.substring(0, 8)}.xlsx`;

    // Return Excel bytes directly
    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(excelBuffer.length),
      },
    });

  } catch (error: unknown) {
    console.error("Excel generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
