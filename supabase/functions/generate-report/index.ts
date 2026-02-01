import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es BenchmarkAI, un expert en stratégie de positionnement et analyse concurrentielle. Tu génères des rapports de benchmark détaillés et actionnables pour les entrepreneurs.

Tu dois retourner un JSON structuré avec exactement ce format:

{
  "title": "Titre du rapport",
  "executiveSummary": ["Point clé 1", "Point clé 2", "Point clé 3", "Point clé 4", "Point clé 5"],
  "marketOverview": "Paragraphe d'analyse du marché de 150-200 mots",
  "targetSegments": ["Segment 1", "Segment 2", "Segment 3"],
  "competitorTable": [
    {
      "name": "Nom concurrent",
      "strengths": ["Force 1", "Force 2"],
      "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
      "priceRange": "€€-€€€"
    }
  ],
  "positioningMatrix": {
    "xAxisLabel": "Prix",
    "yAxisLabel": "Qualité",
    "points": [
      {"x": 30, "y": 70, "label": "Concurrent A", "isUser": false},
      {"x": 60, "y": 80, "label": "Votre position", "isUser": true}
    ]
  },
  "pricingRecommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
  "goToMarket": {
    "channels": ["Canal 1", "Canal 2", "Canal 3"],
    "messaging": ["Message clé 1", "Message clé 2"]
  },
  "risksAndChecks": ["Risque/vérification 1", "Risque/vérification 2", "Risque/vérification 3"],
  "actionPlan30_60_90": [
    {"timeframe": "30", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"]},
    {"timeframe": "60", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"]},
    {"timeframe": "90", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"]}
  ],
  "assumptionsAndQuestions": ["Hypothèse 1", "Hypothèse 2", "Question à valider 1"]
}

Adapte la profondeur selon le plan:
- Standard: 2000-3000 mots, 3-5 concurrents
- Pro: 4000-6000 mots, 5-10 concurrents, plus de détails
- Agence: 8000-12000 mots, 10-15 concurrents, analyse multi-marchés

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`;

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

    // Get the report
    const { data: report, error: fetchError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      throw new Error("Report not found");
    }

    // Update status to processing
    await supabaseAdmin
      .from("reports")
      .update({ status: "processing" })
      .eq("id", reportId);

    const inputData = report.input_data;
    const plan = report.plan;

    // Build the user prompt
    const userPrompt = `Génère un rapport de benchmark ${plan.toUpperCase()} pour:

**Entreprise:** ${inputData.businessName}
**Secteur:** ${inputData.sector}
**Localisation:** ${inputData.location?.city}, ${inputData.location?.country}
**Type de clients:** ${inputData.targetCustomers?.type} - ${inputData.targetCustomers?.persona}
**Offre:** ${inputData.whatYouSell}
**Fourchette de prix:** ${inputData.priceRange?.min}€ - ${inputData.priceRange?.max}€
**Différenciateurs:** ${inputData.differentiators?.join(", ") || "Non spécifiés"}
**Canaux d'acquisition:** ${inputData.acquisitionChannels?.join(", ") || "Non spécifiés"}
**Objectifs du benchmark:** ${inputData.goals?.join(", ") || "Analyse complète"}
**Concurrents connus:** ${inputData.competitors?.map((c: { name: string; url?: string }) => c.name + (c.url ? ` (${c.url})` : "")).join(", ") || "À identifier"}
**Budget:** ${inputData.budgetLevel}
**Timeline:** ${inputData.timeline}
**Notes additionnelles:** ${inputData.notes || "Aucune"}
**Ton préféré:** ${inputData.tonePreference}

Génère un rapport complet et actionnable.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway for report:", reportId);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded, please try again later");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required for AI services");
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response
    let outputData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outputData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Update report with output
    const { error: updateError } = await supabaseAdmin
      .from("reports")
      .update({
        status: "ready",
        output_data: outputData,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }

    console.log("Report generated successfully:", reportId);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Generate report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update report status to failed
    try {
      const { reportId } = await req.json().catch(() => ({}));
      if (reportId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseAdmin
          .from("reports")
          .update({ status: "failed" })
          .eq("id", reportId);
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
