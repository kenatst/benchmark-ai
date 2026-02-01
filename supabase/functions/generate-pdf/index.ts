import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    urgency_level?: string;
    urgency_rationale?: string;
  };
  market_context?: {
    sector_overview: string;
    local_market_specifics: string;
    market_maturity: string;
    target_segments: Array<{
      segment_name: string;
      size_estimate: string;
      accessibility: string;
      value_potential: string;
      why_relevant: string;
    }>;
    key_trends_impacting: string[];
  };
  competitive_landscape?: {
    competition_intensity: string;
    competitors_analyzed: Array<{
      name: string;
      type?: string;
      positioning: string;
      strengths: string[];
      weaknesses: string[];
      price_range?: string;
      pricing_found?: string;
      threat_level: string;
    }>;
    competitive_gaps: string[];
    your_current_position: string;
    differentiation_opportunities: Array<{
      angle: string;
      feasibility: string;
      impact: string;
      description: string;
    }>;
  };
  positioning_recommendations?: {
    recommended_positioning: string;
    rationale: string;
    target_audience_primary: string;
    value_proposition: string;
    tagline_suggestions: string[];
    key_messages: string[];
  };
  pricing_strategy?: {
    current_assessment: string;
    market_benchmarks: {
      budget_tier: string;
      mid_tier: string;
      premium_tier: string;
    };
    recommended_pricing: Array<{
      package_name: string;
      suggested_price: string;
      what_includes: string[];
      rationale: string;
    }>;
    quick_wins: string[];
  };
  go_to_market?: {
    priority_channels: Array<{
      channel: string;
      priority: string;
      why: string;
      first_action: string;
      expected_cac: string;
      expected_timeline: string;
    }>;
    content_strategy: {
      topics_to_own: string[];
      content_formats: string[];
    };
    partnership_opportunities: string[];
  };
  action_plan?: {
    now_7_days: Array<{ action: string; owner: string; outcome: string }>;
    days_8_30: Array<{ action: string; owner: string; outcome: string }>;
    days_31_90: Array<{ action: string; owner: string; outcome: string }>;
  };
  risks_and_considerations?: Array<{ risk: string; impact: string; mitigation: string }> | {
    market_risks?: string[];
    competitive_threats?: string[];
  };
  assumptions_and_limitations?: string[];
  sources?: Array<{ title: string; url: string }>;
}

// Generate premium HTML template
function generateHTML(data: ReportData, plan: string): string {
  const tierColors = {
    standard: { primary: '#1a1a1a', accent: '#f59e0b' },
    pro: { primary: '#1a1a1a', accent: '#8b5cf6' },
    agency: { primary: '#1a1a1a', accent: '#0ea5e9' },
  };
  
  const colors = tierColors[plan as keyof typeof tierColors] || tierColors.standard;
  const tierBadge = plan === 'agency' ? 'AGENCY' : plan === 'pro' ? 'PRO' : 'STANDARD';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.report_metadata?.title || 'Benchmark Report'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      font-size: 11pt;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 40px;
      background: white;
      min-height: 297mm;
    }
    
    /* Cover Page */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      background: linear-gradient(135deg, #faf9f6 0%, #f5f3ef 100%);
      padding: 60px;
      page-break-after: always;
    }
    
    .cover-badge {
      display: inline-block;
      padding: 8px 24px;
      background: ${colors.accent};
      color: white;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 2px;
      border-radius: 30px;
      margin-bottom: 40px;
    }
    
    .cover h1 {
      font-size: 42px;
      font-weight: 800;
      color: ${colors.primary};
      margin-bottom: 20px;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 20px;
      color: #666;
      margin-bottom: 40px;
    }
    
    .cover-meta {
      display: flex;
      gap: 30px;
      justify-content: center;
      color: #888;
      font-size: 14px;
    }
    
    .cover-meta span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Section Styles */
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${colors.accent};
    }
    
    .section-number {
      width: 32px;
      height: 32px;
      background: ${colors.accent};
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: ${colors.primary};
    }
    
    /* Cards */
    .card {
      background: #f8f7f4;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
    }
    
    .card-accent {
      border-left: 4px solid ${colors.accent};
    }
    
    .card h3 {
      font-size: 16px;
      font-weight: 600;
      color: ${colors.primary};
      margin-bottom: 12px;
    }
    
    /* Lists */
    ul {
      list-style: none;
      padding-left: 0;
    }
    
    ul li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 8px;
    }
    
    ul li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: ${colors.accent};
      font-weight: 600;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
    }
    
    th {
      background: ${colors.primary};
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    tr:nth-child(even) {
      background: #f8f7f4;
    }
    
    /* Action Plan Grid */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .action-column {
      background: #f8f7f4;
      border-radius: 12px;
      padding: 20px;
    }
    
    .action-column h4 {
      font-size: 14px;
      font-weight: 700;
      color: ${colors.accent};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.accent};
    }
    
    .action-item {
      padding: 10px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .action-item:last-child {
      border-bottom: none;
    }
    
    .action-item strong {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .action-item span {
      font-size: 10pt;
      color: #666;
    }
    
    /* Highlight Box */
    .highlight {
      background: linear-gradient(135deg, ${colors.accent}15 0%, ${colors.accent}05 100%);
      border: 1px solid ${colors.accent}30;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .highlight h3 {
      color: ${colors.accent};
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #888;
      font-size: 10pt;
    }
    
    /* Print Styles */
    @media print {
      .page { padding: 20mm; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <span class="cover-badge">RAPPORT ${tierBadge}</span>
    <h1>${data.report_metadata?.title || 'Benchmark Stratégique'}</h1>
    <p class="cover-subtitle">${data.report_metadata?.business_name} • ${data.report_metadata?.sector}</p>
    <div class="cover-meta">
      <span>📍 ${data.report_metadata?.location}</span>
      <span>📅 ${data.report_metadata?.generated_date}</span>
      ${data.report_metadata?.sources_count ? `<span>📚 ${data.report_metadata.sources_count} sources</span>` : ''}
    </div>
  </div>
  
  <div class="page">
    <!-- Executive Summary -->
    <div class="section">
      <div class="section-header">
        <span class="section-number">1</span>
        <h2 class="section-title">Résumé Exécutif</h2>
      </div>
      
      ${data.executive_summary?.one_page_summary ? `
        <div class="card card-accent">
          <p>${data.executive_summary.one_page_summary}</p>
        </div>
      ` : ''}
      
      <div class="highlight">
        <h3>🎯 Situation Actuelle</h3>
        <p>${data.executive_summary?.situation_actuelle || 'Non disponible'}</p>
      </div>
      
      <div class="highlight">
        <h3>💡 Opportunité Principale</h3>
        <p>${data.executive_summary?.opportunite_principale || 'Non disponible'}</p>
      </div>
      
      ${data.executive_summary?.key_findings ? `
        <div class="card">
          <h3>Points Clés</h3>
          <ul>
            ${data.executive_summary.key_findings.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    
    <!-- Market Context -->
    ${data.market_context ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">2</span>
        <h2 class="section-title">Contexte Marché</h2>
      </div>
      
      <div class="card">
        <h3>Vue d'ensemble du secteur</h3>
        <p>${data.market_context.sector_overview}</p>
      </div>
      
      <div class="card">
        <h3>Spécificités locales</h3>
        <p>${data.market_context.local_market_specifics}</p>
        <p><strong>Maturité:</strong> ${data.market_context.market_maturity}</p>
      </div>
      
      ${data.market_context.key_trends_impacting?.length ? `
        <div class="card card-accent">
          <h3>Tendances clés</h3>
          <ul>
            ${data.market_context.key_trends_impacting.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Competitive Landscape -->
    ${data.competitive_landscape ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">3</span>
        <h2 class="section-title">Paysage Concurrentiel</h2>
      </div>
      
      <div class="card">
        <h3>Intensité concurrentielle: ${data.competitive_landscape.competition_intensity}</h3>
        <p><strong>Votre position:</strong> ${data.competitive_landscape.your_current_position}</p>
      </div>
      
      ${data.competitive_landscape.competitors_analyzed?.length ? `
        <table>
          <thead>
            <tr>
              <th>Concurrent</th>
              <th>Positionnement</th>
              <th>Forces</th>
              <th>Faiblesses</th>
              <th>Menace</th>
            </tr>
          </thead>
          <tbody>
            ${data.competitive_landscape.competitors_analyzed.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.positioning}</td>
                <td>${c.strengths?.slice(0, 2).join(', ') || '-'}</td>
                <td>${c.weaknesses?.slice(0, 2).join(', ') || '-'}</td>
                <td>${c.threat_level}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${data.competitive_landscape.differentiation_opportunities?.length ? `
        <div class="highlight">
          <h3>🚀 Opportunités de différenciation</h3>
          <ul>
            ${data.competitive_landscape.differentiation_opportunities.map(d => `
              <li><strong>${d.angle}</strong> (${d.feasibility} / ${d.impact}) - ${d.description}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Positioning -->
    ${data.positioning_recommendations ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">4</span>
        <h2 class="section-title">Recommandations de Positionnement</h2>
      </div>
      
      <div class="card card-accent">
        <h3>Positionnement recommandé</h3>
        <p><strong>${data.positioning_recommendations.recommended_positioning}</strong></p>
        <p>${data.positioning_recommendations.rationale}</p>
      </div>
      
      <div class="highlight">
        <h3>💎 Proposition de valeur</h3>
        <p>${data.positioning_recommendations.value_proposition}</p>
        <p><strong>Cible principale:</strong> ${data.positioning_recommendations.target_audience_primary}</p>
      </div>
      
      ${data.positioning_recommendations.tagline_suggestions?.length ? `
        <div class="card">
          <h3>Suggestions de taglines</h3>
          <ul>
            ${data.positioning_recommendations.tagline_suggestions.map(t => `<li>"${t}"</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.positioning_recommendations.key_messages?.length ? `
        <div class="card">
          <h3>Messages clés</h3>
          <ul>
            ${data.positioning_recommendations.key_messages.map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Pricing Strategy -->
    ${data.pricing_strategy ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">5</span>
        <h2 class="section-title">Stratégie Tarifaire</h2>
      </div>
      
      <div class="card">
        <h3>Évaluation actuelle</h3>
        <p>${data.pricing_strategy.current_assessment}</p>
      </div>
      
      <div class="card">
        <h3>Benchmarks marché</h3>
        <table>
          <tr><td><strong>Budget</strong></td><td>${data.pricing_strategy.market_benchmarks.budget_tier}</td></tr>
          <tr><td><strong>Milieu de gamme</strong></td><td>${data.pricing_strategy.market_benchmarks.mid_tier}</td></tr>
          <tr><td><strong>Premium</strong></td><td>${data.pricing_strategy.market_benchmarks.premium_tier}</td></tr>
        </table>
      </div>
      
      ${data.pricing_strategy.recommended_pricing?.length ? `
        <div class="highlight">
          <h3>💰 Pricing recommandé</h3>
          ${data.pricing_strategy.recommended_pricing.map(p => `
            <div style="margin-bottom: 16px;">
              <strong>${p.package_name}: ${p.suggested_price}</strong>
              <p>${p.rationale}</p>
              <ul>${p.what_includes.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Go to Market -->
    ${data.go_to_market ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">6</span>
        <h2 class="section-title">Stratégie Go-to-Market</h2>
      </div>
      
      ${data.go_to_market.priority_channels?.length ? `
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th>Priorité</th>
              <th>Pourquoi</th>
              <th>Première action</th>
              <th>CAC estimé</th>
            </tr>
          </thead>
          <tbody>
            ${data.go_to_market.priority_channels.map(c => `
              <tr>
                <td><strong>${c.channel}</strong></td>
                <td>${c.priority}</td>
                <td>${c.why}</td>
                <td>${c.first_action}</td>
                <td>${c.expected_cac}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${data.go_to_market.content_strategy?.topics_to_own?.length ? `
        <div class="card">
          <h3>Stratégie de contenu</h3>
          <p><strong>Thèmes à dominer:</strong></p>
          <ul>
            ${data.go_to_market.content_strategy.topics_to_own.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Action Plan -->
    ${data.action_plan ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">7</span>
        <h2 class="section-title">Plan d'Action 30/60/90 Jours</h2>
      </div>
      
      <div class="action-grid">
        <div class="action-column">
          <h4>📅 J1-7 : Quick Wins</h4>
          ${data.action_plan.now_7_days?.map(a => `
            <div class="action-item">
              <strong>${a.action}</strong>
              <span>👤 ${a.owner} → ${a.outcome}</span>
            </div>
          `).join('') || '<p>Non défini</p>'}
        </div>
        
        <div class="action-column">
          <h4>📅 J8-30 : Fondations</h4>
          ${data.action_plan.days_8_30?.map(a => `
            <div class="action-item">
              <strong>${a.action}</strong>
              <span>👤 ${a.owner} → ${a.outcome}</span>
            </div>
          `).join('') || '<p>Non défini</p>'}
        </div>
        
        <div class="action-column">
          <h4>📅 J31-90 : Croissance</h4>
          ${data.action_plan.days_31_90?.map(a => `
            <div class="action-item">
              <strong>${a.action}</strong>
              <span>👤 ${a.owner} → ${a.outcome}</span>
            </div>
          `).join('') || '<p>Non défini</p>'}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Risks -->
    ${data.risks_and_considerations ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">8</span>
        <h2 class="section-title">Risques & Considérations</h2>
      </div>
      
      ${Array.isArray(data.risks_and_considerations) ? `
        <table>
          <thead>
            <tr>
              <th>Risque</th>
              <th>Impact</th>
              <th>Mitigation</th>
            </tr>
          </thead>
          <tbody>
            ${data.risks_and_considerations.map(r => `
              <tr>
                <td>${r.risk}</td>
                <td>${r.impact}</td>
                <td>${r.mitigation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="card">
          ${data.risks_and_considerations.market_risks?.length ? `
            <h3>Risques marché</h3>
            <ul>${data.risks_and_considerations.market_risks.map(r => `<li>${r}</li>`).join('')}</ul>
          ` : ''}
          ${data.risks_and_considerations.competitive_threats?.length ? `
            <h3>Menaces concurrentielles</h3>
            <ul>${data.risks_and_considerations.competitive_threats.map(r => `<li>${r}</li>`).join('')}</ul>
          ` : ''}
        </div>
      `}
    </div>
    ` : ''}
    
    <!-- Assumptions -->
    ${data.assumptions_and_limitations?.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">9</span>
        <h2 class="section-title">Hypothèses & Limitations</h2>
      </div>
      
      <div class="card">
        <ul>
          ${data.assumptions_and_limitations.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}
    
    <!-- Sources -->
    ${data.sources?.length ? `
    <div class="section">
      <div class="section-header">
        <span class="section-number">10</span>
        <h2 class="section-title">Sources</h2>
      </div>
      
      <div class="card">
        <ol style="padding-left: 20px; list-style-type: decimal;">
          ${data.sources.slice(0, 20).map(s => `
            <li style="padding-left: 0; margin-bottom: 8px;">
              <strong>${s.title || 'Source'}</strong><br/>
              <a href="${s.url}" style="color: ${colors.accent}; font-size: 10pt;">${s.url}</a>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <p>Rapport généré par <strong>BenchmarkAI</strong></p>
      <p>${data.report_metadata?.generated_date} • Rapport ${tierBadge}</p>
      <p style="margin-top: 10px; font-size: 9pt;">© ${new Date().getFullYear()} BenchmarkAI. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { reportId } = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    console.log(`[${reportId}] Generating PDF...`);

    // Get the report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      throw new Error("Report not found");
    }

    if (!report.output_data) {
      throw new Error("Report has no output data");
    }

    const outputData = report.output_data as ReportData;
    const plan = report.plan || "standard";

    // Generate HTML
    const html = generateHTML(outputData, plan);

    // For now, we'll store the HTML and return a data URL
    // In production, you would use a PDF generation service like:
    // - Puppeteer (via Docker/Cloud Run)
    // - wkhtmltopdf
    // - PDFShift API
    // - DocRaptor
    // - Prince XML
    
    // Store HTML as temporary solution
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const htmlBuffer = await htmlBlob.arrayBuffer();
    const htmlBytes = new Uint8Array(htmlBuffer);
    
    // Upload to storage
    const fileName = `reports/${reportId}/report-${plan}.html`;
    
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('reports')
      .upload(fileName, htmlBytes, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[${reportId}] Upload error:`, uploadError);
      // Don't throw - continue without storage
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('reports')
      .getPublicUrl(fileName);

    const pdfUrl = urlData?.publicUrl || null;

    // Update report with PDF URL
    if (pdfUrl) {
      await supabaseAdmin
        .from("reports")
        .update({ pdf_url: pdfUrl })
        .eq("id", reportId);
    }

    console.log(`[${reportId}] PDF generated: ${pdfUrl}`);

    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl,
      htmlPreview: html.substring(0, 500) + '...',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Generate PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
