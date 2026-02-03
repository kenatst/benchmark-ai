// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
// @ts-ignore - Deno import
import PptxGenJS from "https://esm.sh/pptxgenjs@3.12.0";
// @ts-ignore - Deno import
import { getAuthContext } from "../_shared.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// SLIDE DECK BUILDER FOR AGENCY TIER
// ============================================================================

interface SlideData {
    executive_summary?: any;
    competitive_intelligence?: any;
    financial_projections?: any;
    market_analysis?: any;
    swot_analysis?: any;
    strategic_recommendations?: any;
    implementation_roadmap?: any;
    detailed_roadmap?: any;
    report_metadata?: any;
}

// Color palette - McKinsey-inspired
const COLORS = {
    PRIMARY: "1a3a5c",
    SECONDARY: "7c6b9c",
    ACCENT: "b89456",
    SUCCESS: "2d7a5a",
    WARNING: "b38f40",
    DANGER: "9a4040",
    DARK: "1d1d23",
    LIGHT: "f5f5f7",
    WHITE: "FFFFFF",
};

function sanitizeText(text: unknown): string {
    if (!text) return "";
    return String(text)
        .replace(/[^\x00-\xFF]/g, "")
        .substring(0, 500);
}

function buildTitleSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();

    // Background
    slide.background = { color: COLORS.PRIMARY };

    // Title
    slide.addText(sanitizeText(data.report_metadata?.title || "Rapport Benchmark"), {
        x: 0.5,
        y: 2,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: COLORS.WHITE,
        fontFace: "Helvetica",
    });

    // Business name
    slide.addText(sanitizeText(data.report_metadata?.business_name || ""), {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 24,
        color: COLORS.ACCENT,
        fontFace: "Helvetica",
    });

    // Sector and location
    const subInfo = `${sanitizeText(data.report_metadata?.sector)} | ${sanitizeText(data.report_metadata?.location)}`;
    slide.addText(subInfo, {
        x: 0.5,
        y: 4.1,
        w: 9,
        h: 0.4,
        fontSize: 16,
        color: COLORS.LIGHT,
        fontFace: "Helvetica",
    });

    // Date and tier badge
    slide.addText(`AGENCY TIER | ${sanitizeText(data.report_metadata?.generated_date)}`, {
        x: 0.5,
        y: 5.2,
        w: 9,
        h: 0.3,
        fontSize: 12,
        color: COLORS.LIGHT,
        fontFace: "Helvetica",
    });

    // Footer
    slide.addText("Produit par Benchmark AI", {
        x: 0.5,
        y: 6.8,
        w: 5,
        h: 0.3,
        fontSize: 10,
        color: COLORS.LIGHT,
        fontFace: "Helvetica",
    });
}

function buildExecutiveSummarySlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();
    const exec = data.executive_summary || {};

    // Header
    slide.addText("RESUME EXECUTIF", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: COLORS.PRIMARY,
        fontFace: "Helvetica",
    });

    // Strategic recommendation box
    slide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 1,
        w: 9,
        h: 1.2,
        fill: { color: COLORS.PRIMARY },
    });

    slide.addText(sanitizeText(exec.strategic_recommendation || exec.headline || "Recommandation principale"), {
        x: 0.7,
        y: 1.1,
        w: 8.6,
        h: 1,
        fontSize: 16,
        color: COLORS.WHITE,
        fontFace: "Helvetica",
        valign: "middle",
    });

    // KPIs row
    const kpis = [
        { label: "Investissement", value: sanitizeText(exec.investment_required) },
        { label: "ROI Attendu", value: sanitizeText(exec.expected_roi) },
        { label: "Sources", value: `${data.report_metadata?.sources_count || 0}` },
    ];

    kpis.forEach((kpi, i) => {
        const x = 0.5 + i * 3.1;
        slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 2.4,
            w: 2.9,
            h: 1,
            fill: { color: COLORS.LIGHT },
            line: { color: COLORS.PRIMARY, width: 1 },
        });
        slide.addText(kpi.label, { x, y: 2.5, w: 2.9, h: 0.3, fontSize: 10, color: COLORS.DARK, align: "center" });
        slide.addText(kpi.value || "N/A", { x, y: 2.8, w: 2.9, h: 0.5, fontSize: 14, bold: true, color: COLORS.PRIMARY, align: "center" });
    });

    // Critical success factors
    slide.addText("Facteurs Critiques de Succes", {
        x: 0.5,
        y: 3.6,
        w: 9,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: COLORS.DARK,
    });

    const csf = exec.critical_success_factors || [];
    const csfText = csf.slice(0, 5).map((f: string) => `• ${sanitizeText(f)}`).join("\n");
    slide.addText(csfText || "• Points a definir", {
        x: 0.5,
        y: 4,
        w: 9,
        h: 2,
        fontSize: 11,
        color: COLORS.DARK,
        valign: "top",
    });
}

function buildMarketAnalysisSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();
    const market = data.market_analysis || {};

    // Accent bar at top
    slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.05,
        h: 7.5,
        fill: { color: COLORS.ACCENT },
        line: { type: "none" }
    });

    slide.addText("ANALYSE DU MARCHE", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: COLORS.PRIMARY,
    });

    // Market sizing
    const sizing = market.market_sizing || {};
    const sizingData = [
        { label: "TAM", value: sanitizeText(sizing.total_addressable_market) },
        { label: "SAM", value: sanitizeText(sizing.serviceable_addressable_market) },
        { label: "SOM", value: sanitizeText(sizing.serviceable_obtainable_market) },
    ];

    sizingData.forEach((item, i) => {
        const x = 0.5 + i * 3.1;
        slide.addShape(pptx.ShapeType.rect, { x, y: 1, w: 2.9, h: 1.2, fill: { color: COLORS.SECONDARY } });
        slide.addText(item.label, { x, y: 1.1, w: 2.9, h: 0.4, fontSize: 12, color: COLORS.WHITE, align: "center", bold: true });
        slide.addText(item.value || "N/A", { x, y: 1.5, w: 2.9, h: 0.5, fontSize: 14, color: COLORS.WHITE, align: "center" });
    });

    // Market dynamics
    const dynamics = market.market_dynamics || {};
    slide.addText(`Croissance: ${sanitizeText(dynamics.growth_rate) || "N/A"} | Maturite: ${sanitizeText(dynamics.maturity_stage) || "N/A"}`, {
        x: 0.5,
        y: 2.4,
        w: 9,
        h: 0.4,
        fontSize: 12,
        color: COLORS.DARK,
    });

    // Key drivers
    slide.addText("Moteurs de Croissance", { x: 0.5, y: 2.9, w: 4.3, h: 0.4, fontSize: 14, bold: true, color: COLORS.SUCCESS });
    const drivers = (dynamics.key_drivers || []).slice(0, 4).map((d: string) => `• ${sanitizeText(d)}`).join("\n");
    slide.addText(drivers || "• A definir", { x: 0.5, y: 3.3, w: 4.3, h: 2, fontSize: 10, color: COLORS.DARK });

    // Headwinds
    slide.addText("Freins", { x: 5.2, y: 2.9, w: 4.3, h: 0.4, fontSize: 14, bold: true, color: COLORS.DANGER });
    const headwinds = (dynamics.headwinds || []).slice(0, 4).map((h: string) => `• ${sanitizeText(h)}`).join("\n");
    slide.addText(headwinds || "• A definir", { x: 5.2, y: 3.3, w: 4.3, h: 2, fontSize: 10, color: COLORS.DARK });
}

function buildSWOTSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();
    const swot = data.swot_analysis || {};

    slide.addText("ANALYSE SWOT", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: COLORS.PRIMARY,
    });

    const quadrants = [
        { title: "FORCES", items: swot.strengths || [], color: COLORS.SUCCESS, x: 0.5, y: 1 },
        { title: "FAIBLESSES", items: swot.weaknesses || [], color: COLORS.DANGER, x: 5, y: 1 },
        { title: "OPPORTUNITES", items: swot.opportunities || [], color: COLORS.PRIMARY, x: 0.5, y: 3.5 },
        { title: "MENACES", items: swot.threats || [], color: COLORS.WARNING, x: 5, y: 3.5 },
    ];

    quadrants.forEach((quad) => {
        // Background rectangle
        slide.addShape(pptx.ShapeType.rect, {
            x: quad.x,
            y: quad.y,
            w: 4.3,
            h: 2.3,
            fill: { color: COLORS.LIGHT },
            line: { color: quad.color, width: 2 },
        });

        // Title bar
        slide.addShape(pptx.ShapeType.rect, {
            x: quad.x,
            y: quad.y,
            w: 4.3,
            h: 0.4,
            fill: { color: quad.color },
        });

        slide.addText(quad.title, {
            x: quad.x,
            y: quad.y,
            w: 4.3,
            h: 0.4,
            fontSize: 11,
            bold: true,
            color: COLORS.WHITE,
            align: "center",
            valign: "middle",
        });

        // Items
        const content = quad.items.slice(0, 4).map((item: string) => `• ${sanitizeText(item)}`).join("\n");
        slide.addText(content || "• A definir", {
            x: quad.x + 0.1,
            y: quad.y + 0.5,
            w: 4.1,
            h: 1.7,
            fontSize: 9,
            color: COLORS.DARK,
            valign: "top",
        });
    });
}

function buildFinancialsSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();
    const financial = data.financial_projections || {};
    const scenarios = financial.revenue_scenarios || {};

    slide.addText("PROJECTIONS FINANCIERES", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: COLORS.PRIMARY,
    });

    // Revenue scenarios table
    const tableData = [
        [{ text: "Scenario", options: { bold: true, fill: { color: COLORS.PRIMARY }, color: COLORS.WHITE } },
        { text: "Annee 1", options: { bold: true, fill: { color: COLORS.PRIMARY }, color: COLORS.WHITE } },
        { text: "Annee 2", options: { bold: true, fill: { color: COLORS.PRIMARY }, color: COLORS.WHITE } },
        { text: "Annee 3", options: { bold: true, fill: { color: COLORS.PRIMARY }, color: COLORS.WHITE } }],
        ["Conservateur", scenarios.conservative?.year_1?.toLocaleString() || "N/A", scenarios.conservative?.year_2?.toLocaleString() || "N/A", scenarios.conservative?.year_3?.toLocaleString() || "N/A"],
        ["Base", scenarios.baseline?.year_1?.toLocaleString() || "N/A", scenarios.baseline?.year_2?.toLocaleString() || "N/A", scenarios.baseline?.year_3?.toLocaleString() || "N/A"],
        ["Optimiste", scenarios.optimistic?.year_1?.toLocaleString() || "N/A", scenarios.optimistic?.year_2?.toLocaleString() || "N/A", scenarios.optimistic?.year_3?.toLocaleString() || "N/A"],
    ];

    slide.addTable(tableData, { x: 0.5, y: 1, w: 9, fontSize: 11, colW: [2.25, 2.25, 2.25, 2.25] });

    // Unit economics
    const unitEcon = financial.unit_economics || {};
    slide.addText("UNIT ECONOMICS", { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 16, bold: true, color: COLORS.SECONDARY });

    const metrics = [
        { label: "CAC", value: unitEcon.customer_acquisition_cost?.toLocaleString() || "N/A" },
        { label: "LTV", value: unitEcon.lifetime_value?.toLocaleString() || "N/A" },
        { label: "LTV/CAC", value: `${unitEcon.ltv_cac_ratio?.toFixed(1) || "N/A"}x` },
        { label: "Payback", value: `${unitEcon.payback_period_months || "N/A"} mois` },
    ];

    metrics.forEach((metric, i) => {
        const x = 0.5 + i * 2.3;
        slide.addShape(pptx.ShapeType.rect, { x, y: 4.1, w: 2.1, h: 1, fill: { color: COLORS.LIGHT }, line: { color: COLORS.SECONDARY, width: 1 } });
        slide.addText(metric.label, { x, y: 4.2, w: 2.1, h: 0.3, fontSize: 9, color: COLORS.DARK, align: "center" });
        slide.addText(metric.value, { x, y: 4.5, w: 2.1, h: 0.5, fontSize: 12, bold: true, color: COLORS.PRIMARY, align: "center" });
    });
}

function buildRoadmapSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();
    const roadmap = data.detailed_roadmap || data.implementation_roadmap || {};

    slide.addText("ROADMAP 12 MOIS", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 28,
        bold: true,
        color: COLORS.PRIMARY,
    });

    const phases = roadmap.phases || [
        { phase: "Phase 1", timeline: "Mois 1-3", title: "Fondations", tasks: roadmap.phase_1_foundation?.objectives || [] },
        { phase: "Phase 2", timeline: "Mois 4-6", title: "Croissance", tasks: roadmap.phase_2_growth?.objectives || [] },
        { phase: "Phase 3", timeline: "Mois 7-12", title: "Scale", tasks: roadmap.phase_3_scale?.objectives || [] },
    ];

    phases.forEach((phase: any, i: number) => {
        const x = 0.5 + i * 3.1;

        // Phase header
        slide.addShape(pptx.ShapeType.rect, { x, y: 1, w: 2.9, h: 0.5, fill: { color: COLORS.SECONDARY } });
        slide.addText(`${phase.phase || `Phase ${i + 1}`}`, { x, y: 1, w: 2.9, h: 0.5, fontSize: 12, bold: true, color: COLORS.WHITE, align: "center", valign: "middle" });

        // Timeline
        slide.addText(phase.timeline || "", { x, y: 1.55, w: 2.9, h: 0.3, fontSize: 10, color: COLORS.DARK, align: "center" });

        // Title
        slide.addText(phase.title || "", { x, y: 1.85, w: 2.9, h: 0.4, fontSize: 11, bold: true, color: COLORS.PRIMARY, align: "center" });

        // Tasks box
        slide.addShape(pptx.ShapeType.rect, { x, y: 2.3, w: 2.9, h: 3, fill: { color: COLORS.LIGHT } });

        const tasks = (phase.tasks || phase.objectives || []).slice(0, 5).map((t: string) => `• ${sanitizeText(t)}`).join("\n");
        slide.addText(tasks || "• A definir", { x: x + 0.1, y: 2.4, w: 2.7, h: 2.8, fontSize: 9, color: COLORS.DARK, valign: "top" });
    });

    // Budget summary
    if (roadmap.total_budget) {
        slide.addText(`Budget Total: ${sanitizeText(roadmap.total_budget)}`, {
            x: 0.5,
            y: 5.5,
            w: 9,
            h: 0.4,
            fontSize: 14,
            bold: true,
            color: COLORS.ACCENT,
        });
    }
}

function buildClosingSlide(pptx: any, data: SlideData): void {
    const slide = pptx.addSlide();

    slide.background = { color: COLORS.PRIMARY };

    slide.addText("PROCHAINES ETAPES", {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 0.8,
        fontSize: 36,
        bold: true,
        color: COLORS.WHITE,
        align: "center",
    });

    slide.addText("Rapport complet disponible en PDF et Excel", {
        x: 0.5,
        y: 3,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: COLORS.LIGHT,
        align: "center",
    });

    slide.addText("Contact: support@benchmarkai.app", {
        x: 0.5,
        y: 4.5,
        w: 9,
        h: 0.4,
        fontSize: 14,
        color: COLORS.ACCENT,
        align: "center",
    });

    slide.addText("Benchmark AI - Intelligence Concurrentielle Automatisée", {
        x: 0.5,
        y: 6.8,
        w: 9,
        h: 0.3,
        fontSize: 10,
        color: COLORS.LIGHT,
        align: "center",
    });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
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

        console.log(`[${reportId}] Starting Slides generation`);

        // @ts-ignore - Deno runtime
        const supabase = createClient(
            // @ts-ignore - Deno runtime
            Deno.env.get("SUPABASE_URL") || "",
            // @ts-ignore - Deno runtime
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );
        // @ts-ignore - Deno runtime
        const supabaseClient = createClient(
            // @ts-ignore - Deno runtime
            Deno.env.get("SUPABASE_URL") || "",
            // @ts-ignore - Deno runtime
            Deno.env.get("SUPABASE_ANON_KEY") || ""
        );

        const authContext = await getAuthContext(req, supabaseClient);
        if (authContext.authType === 'none') {
            return new Response(
                JSON.stringify({ error: authContext.error || "Not authenticated" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get report data
        const reportQuery = supabase
            .from("reports")
            .select("*")
            .eq("id", reportId);

        const { data: report, error: fetchError } = authContext.authType === 'user'
            ? await reportQuery.eq("user_id", authContext.userId).single()
            : await reportQuery.single();

        if (fetchError || !report) {
            return new Response(
                JSON.stringify({ error: `Report not found: ${fetchError?.message}` }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (authContext.authType === 'user' && report.status !== "ready") {
            return new Response(
                JSON.stringify({ error: "Report not ready" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (report.plan !== "agency") {
            return new Response(
                JSON.stringify({ error: "Slides export is only available for Agency tier" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const outputData = report.output_data as SlideData;

        // Create presentation
        const pptx = new PptxGenJS();
        pptx.layout = "LAYOUT_16x9";
        pptx.title = `Benchmark ${outputData?.report_metadata?.business_name || ""}`;
        pptx.author = "Benchmark AI";

        // Build slides
        buildTitleSlide(pptx, outputData);
        buildExecutiveSummarySlide(pptx, outputData);
        buildMarketAnalysisSlide(pptx, outputData);
        buildSWOTSlide(pptx, outputData);
        buildFinancialsSlide(pptx, outputData);
        buildRoadmapSlide(pptx, outputData);
        buildClosingSlide(pptx, outputData);

        // Generate PowerPoint buffer
        const pptxBuffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;
        const uint8Array = new Uint8Array(pptxBuffer);

        console.log(`[${reportId}] Slides generated, size: ${uint8Array.length} bytes`);

        const businessName = (outputData?.report_metadata?.business_name || "Benchmark")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 30);
        const fileName = `Benchmark_${businessName}_${reportId.substring(0, 8)}.pptx`;

        return new Response(uint8Array, {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": String(uint8Array.length),
            },
        });

    } catch (error: unknown) {
        console.error("Slides generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
