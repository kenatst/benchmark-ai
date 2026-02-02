import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// EXCEL BUILDER FOR AGENCY TIER
// ============================================================================
interface ExcelData {
    executive_summary?: any;
    competitive_intelligence?: any;
    financial_projections?: any;
    scoring_matrix?: any;
    implementation_roadmap?: any;
    detailed_roadmap?: any;
    market_analysis?: any;
    report_metadata?: any;
}

function buildExecutiveSummarySheet(data: any): any[][] {
    const rows: any[][] = [
        ["RAPPORT BENCHMARK IQ - RÉSUMÉ EXÉCUTIF"],
        [],
        ["Entreprise", data?.report_metadata?.business_name || ""],
        ["Secteur", data?.report_metadata?.sector || ""],
        ["Localisation", data?.report_metadata?.location || ""],
        ["Date", data?.report_metadata?.generated_date || ""],
        [],
        ["RECOMMANDATION STRATÉGIQUE"],
        [data?.executive_summary?.strategic_recommendation || ""],
        [],
        ["INVESTISSEMENT REQUIS", data?.executive_summary?.investment_required || ""],
        ["ROI ATTENDU", data?.executive_summary?.expected_roi || ""],
        [],
        ["FACTEURS CRITIQUES DE SUCCÈS"],
    ];

    const csf = data?.executive_summary?.critical_success_factors || [];
    csf.forEach((factor: string, i: number) => {
        rows.push([`${i + 1}. ${factor}`]);
    });

    rows.push([]);
    rows.push(["MÉTRIQUES CLÉS À SUIVRE"]);

    const metrics = data?.executive_summary?.key_metrics_to_track || [];
    metrics.forEach((metric: string, i: number) => {
        rows.push([`${i + 1}. ${metric}`]);
    });

    return rows;
}

function buildCompetitorScoringSheet(data: any): any[][] {
    const scoring = data?.scoring_matrix;
    const competitors = scoring?.competitors || [];
    const criteria = scoring?.criteria || [];

    const rows: any[][] = [
        ["MATRICE DE SCORING CONCURRENTIEL"],
        [],
    ];

    // Header row
    const headerRow = ["Concurrent", ...criteria, "TOTAL"];
    rows.push(headerRow);

    // Competitor rows
    competitors.forEach((comp: any) => {
        const row = [comp.name];
        criteria.forEach((criterion: string) => {
            row.push(comp.scores?.[criterion] || comp.scores?.[criterion.toLowerCase()] || 0);
        });
        row.push(comp.total || 0);
        rows.push(row);
    });

    rows.push([]);
    rows.push(["ANALYSE DE SENSIBILITÉ"]);

    const sensitivity = scoring?.sensitivity_analysis || [];
    sensitivity.forEach((analysis: any) => {
        rows.push([`${analysis.model}:`, ...(analysis.rankings || [])]);
    });

    rows.push([]);
    rows.push(["INTERPRÉTATION"]);
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
        ["RÉPARTITION DU BUDGET"],
        ["Catégorie", "Montant", "Justification"],
    ];

    const breakdown = financial?.investment_required?.breakdown || [];
    breakdown.forEach((item: any) => {
        rows.push([item.category, item.amount, item.rationale]);
    });

    rows.push([]);
    rows.push(["SCÉNARIOS DE REVENUS"]);
    rows.push(["Scénario", "Année 1", "Année 2", "Année 3"]);

    if (scenarios?.conservative) {
        rows.push(["Conservateur", scenarios.conservative.year_1, scenarios.conservative.year_2, scenarios.conservative.year_3]);
    }
    if (scenarios?.baseline) {
        rows.push(["Base", scenarios.baseline.year_1, scenarios.baseline.year_2, scenarios.baseline.year_3]);
    }
    if (scenarios?.optimistic) {
        rows.push(["Optimiste", scenarios.optimistic.year_1, scenarios.optimistic.year_2, scenarios.optimistic.year_3]);
    }

    rows.push([]);
    rows.push(["UNIT ECONOMICS"]);
    rows.push(["Métrique", "Valeur"]);

    if (unitEcon) {
        rows.push(["CAC (Coût d'Acquisition Client)", unitEcon.customer_acquisition_cost]);
        rows.push(["LTV (Valeur Vie Client)", unitEcon.lifetime_value]);
        rows.push(["Ratio LTV/CAC", unitEcon.ltv_cac_ratio]);
        rows.push(["Période de Payback (mois)", unitEcon.payback_period_months]);
        rows.push(["Marge Brute (%)", unitEcon.gross_margin_percent]);
        rows.push(["vs Benchmarks", unitEcon.comparison_to_benchmarks]);
    }

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
            (phase.tasks || []).forEach((task: string) => {
                rows.push(["", `• ${task}`]);
            });
            if (phase.kpis?.length) {
                rows.push(["KPIs:"]);
                phase.kpis.forEach((kpi: string) => {
                    rows.push(["", `• ${kpi}`]);
                });
            }
            rows.push([]);
        });
    } else {
        // Fallback to implementation_roadmap format
        const phases = [
            { name: "Phase 1: Fondations", data: roadmap?.phase_1_foundation },
            { name: "Phase 2: Croissance", data: roadmap?.phase_2_growth },
            { name: "Phase 3: Scale", data: roadmap?.phase_3_scale },
        ];

        phases.forEach(({ name, data: phaseData }) => {
            if (!phaseData) return;
            rows.push([name]);
            rows.push(["Timeline:", phaseData.timeline]);
            rows.push(["Objectifs:"]);
            (phaseData.objectives || []).forEach((obj: string) => {
                rows.push(["", `• ${obj}`]);
            });
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
        rows.push(["APPORT RECOMMANDÉ", roadmap.recommended_equity]);
    }

    if (roadmap?.kpi_targets) {
        rows.push([]);
        rows.push(["OBJECTIFS KPI"]);
        rows.push(["Indicateur", "Cible M6", "Cible M12"]);
        roadmap.kpi_targets.forEach((kpi: any) => {
            rows.push([kpi.indicator, kpi.target_m6, kpi.target_m12]);
        });
    }

    return rows;
}

function buildCompetitorDeepDiveSheet(data: any): any[][] {
    const competitors = data?.competitive_intelligence?.competitors_deep_dive || [];

    const rows: any[][] = [
        ["ANALYSE CONCURRENTIELLE APPROFONDIE"],
        [],
        ["Nom", "Taille", "Croissance", "Proposition de Valeur", "Segment Cible", "Niveau de Menace"],
    ];

    competitors.forEach((comp: any) => {
        rows.push([
            comp.name,
            comp.profile?.size || "",
            comp.profile?.growth_trajectory || "",
            comp.positioning?.value_prop || "",
            comp.positioning?.target_segment || "",
            comp.threat_level || "",
        ]);
    });

    rows.push([]);
    rows.push(["FORCES ET FAIBLESSES PAR CONCURRENT"]);
    rows.push(["Concurrent", "Forces", "Faiblesses", "Opportunités vs eux"]);

    competitors.forEach((comp: any) => {
        rows.push([
            comp.name,
            (comp.strengths || []).join("; "),
            (comp.weaknesses || []).join("; "),
            comp.opportunities_vs_them || "",
        ]);
    });

    return rows;
}

function buildPositioningMatrixSheet(data: any): any[][] {
    const matrixData = data?.competitive_intelligence?.positioning_matrix || data?.scoring_matrix;

    const rows: any[][] = [
        ["MATRICE DE POSITIONNEMENT"],
        [],
        ["Concurrent", "Axe X (Prix/Gamme)", "Axe Y (Qualité/Service)", "Quadrant", "Notes"],
    ];

    const competitors = matrixData?.competitors || [];
    competitors.forEach((comp: any) => {
        rows.push([
            comp.name,
            comp.x_axis || comp.price_positioning || 0,
            comp.y_axis || comp.quality_positioning || 0,
            comp.quadrant || "",
            comp.notes || ""
        ]);
    });

    rows.push([]);
    rows.push(["INTERPRÉTATION"]);
    rows.push([matrixData?.interpretation || ""]);

    rows.push([]);
    rows.push(["Utilisez ces coordonnées X/Y pour créer un graphique scatter dans Excel"]);

    return rows;
}

function buildSWOTSheet(data: any): any[][] {
    const swot = data?.swot_analysis || {};

    const rows: any[][] = [
        ["ANALYSE SWOT STRATÉGIQUE"],
        [],
        ["FORCES (STRENGTHS)", "", "FAIBLESSES (WEAKNESSES)"],
    ];

    const strengths = swot.strengths || [];
    const weaknesses = swot.weaknesses || [];
    const maxSW = Math.max(strengths.length, weaknesses.length, 1);

    for (let i = 0; i < maxSW; i++) {
        rows.push([
            strengths[i] ? `• ${strengths[i]}` : "",
            "",
            weaknesses[i] ? `• ${weaknesses[i]}` : ""
        ]);
    }

    rows.push([]);
    rows.push(["OPPORTUNITÉS (OPPORTUNITIES)", "", "MENACES (THREATS)"]);

    const opportunities = swot.opportunities || [];
    const threats = swot.threats || [];
    const maxOT = Math.max(opportunities.length, threats.length, 1);

    for (let i = 0; i < maxOT; i++) {
        rows.push([
            opportunities[i] ? `• ${opportunities[i]}` : "",
            "",
            threats[i] ? `• ${threats[i]}` : ""
        ]);
    }

    rows.push([]);
    rows.push(["PRIORITÉS STRATÉGIQUES"]);

    const priorities = swot.strategic_priorities || swot.priorities || [];
    priorities.forEach((priority: string, i: number) => {
        rows.push([`${i + 1}. ${priority}`]);
    });

    return rows;
}

function buildMarketAnalysisSheet(data: any): any[][] {
    const market = data?.market_analysis || {};
    const sizing = market.market_sizing || {};
    const dynamics = market.market_dynamics || {};

    const rows: any[][] = [
        ["ANALYSE DE MARCHÉ"],
        [],
        ["DIMENSIONNEMENT DU MARCHÉ"],
        ["TAM (Total Addressable Market)", sizing.total_addressable_market || ""],
        ["SAM (Serviceable Addressable Market)", sizing.serviceable_addressable_market || ""],
        ["SOM (Serviceable Obtainable Market)", sizing.serviceable_obtainable_market || ""],
        [],
        ["DYNAMIQUES DE MARCHÉ"],
        ["Taux de Croissance", dynamics.growth_rate || ""],
        ["Stade de Maturité", dynamics.maturity_stage || ""],
        ["Intensité Compétitive", dynamics.competitive_intensity || ""],
        [],
        ["MOTEURS DE CROISSANCE"],
    ];

    const drivers = dynamics.key_drivers || [];
    drivers.forEach((driver: string) => {
        rows.push([`• ${driver}`]);
    });

    rows.push([]);
    rows.push(["FREINS ET RISQUES"]);

    const headwinds = dynamics.headwinds || [];
    headwinds.forEach((headwind: string) => {
        rows.push([`• ${headwind}`]);
    });

    rows.push([]);
    rows.push(["TENDANCES CLÉS"]);

    const trends = market.trends || [];
    trends.forEach((trend: any) => {
        if (typeof trend === 'string') {
            rows.push([`• ${trend}`]);
        } else {
            rows.push([`• ${trend.name || trend.title}`, trend.impact || ""]);
        }
    });

    return rows;
}

function buildSourcesSheet(data: any): any[][] {
    const sources = data?.sources || [];
    const annexes = data?.annexes || {};

    const rows: any[][] = [
        ["SOURCES ET RÉFÉRENCES"],
        [],
        ["Catégorie", "Source", "URL", "Date d'accès"],
    ];

    // Add sources from main sources array
    sources.forEach((source: any) => {
        if (typeof source === 'string') {
            rows.push(["Web", source, source, ""]);
        } else {
            rows.push([
                source.category || "Web",
                source.title || source.name || "",
                source.url || "",
                source.access_date || ""
            ]);
        }
    });

    // Add categorized sources from annexes if available
    const categorizedSources = annexes.sources_categorized || {};
    Object.entries(categorizedSources).forEach(([category, sourceList]) => {
        if (Array.isArray(sourceList)) {
            sourceList.forEach((source: any) => {
                if (typeof source === 'string') {
                    rows.push([category, source, source, ""]);
                } else {
                    rows.push([
                        category,
                        source.title || source.name || "",
                        source.url || "",
                        source.access_date || ""
                    ]);
                }
            });
        }
    });

    rows.push([]);
    rows.push(["TOTAL SOURCES", rows.length - 4]); // Subtract header rows

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

        console.log(`[${reportId}] Starting Excel generation`);

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
            return new Response(
                JSON.stringify({ error: `Report not found: ${fetchError?.message}` }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (report.plan !== "agency") {
            return new Response(
                JSON.stringify({ error: "Excel export is only available for Agency tier" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const outputData = report.output_data as ExcelData;

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Executive Summary
        const summaryData = buildExecutiveSummarySheet(outputData);
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Résumé Exécutif");

        // Sheet 2: Competitor Scoring
        const scoringData = buildCompetitorScoringSheet(outputData);
        const scoringSheet = XLSX.utils.aoa_to_sheet(scoringData);
        XLSX.utils.book_append_sheet(workbook, scoringSheet, "Scoring Concurrents");

        // Sheet 3: Financial Projections
        const financialData = buildFinancialProjectionsSheet(outputData);
        const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
        XLSX.utils.book_append_sheet(workbook, financialSheet, "Projections Financières");

        // Sheet 4: Roadmap
        const roadmapData = buildRoadmapSheet(outputData);
        const roadmapSheet = XLSX.utils.aoa_to_sheet(roadmapData);
        XLSX.utils.book_append_sheet(workbook, roadmapSheet, "Roadmap");

        // Sheet 5: Competitor Deep Dive
        const competitorData = buildCompetitorDeepDiveSheet(outputData);
        const competitorSheet = XLSX.utils.aoa_to_sheet(competitorData);
        XLSX.utils.book_append_sheet(workbook, competitorSheet, "Concurrents Détail");

        // Sheet 6: Positioning Matrix
        const positioningData = buildPositioningMatrixSheet(outputData);
        const positioningSheet = XLSX.utils.aoa_to_sheet(positioningData);
        XLSX.utils.book_append_sheet(workbook, positioningSheet, "Matrice Position");

        // Sheet 7: SWOT Analysis
        const swotData = buildSWOTSheet(outputData);
        const swotSheet = XLSX.utils.aoa_to_sheet(swotData);
        XLSX.utils.book_append_sheet(workbook, swotSheet, "SWOT");

        // Sheet 8: Sources
        const sourcesData = buildSourcesSheet(outputData);
        const sourcesSheet = XLSX.utils.aoa_to_sheet(sourcesData);
        XLSX.utils.book_append_sheet(workbook, sourcesSheet, "Sources");

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        console.log(`[${reportId}] Excel generated, size: ${excelBuffer.length} bytes`);

        const businessName = (outputData?.report_metadata?.business_name || "Benchmark")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 30);
        const fileName = `Benchmark_${businessName}_${reportId.substring(0, 8)}.xlsx`;

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
