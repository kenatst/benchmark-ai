import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  subject?: string;
  type: "report_ready" | "payment_confirmation" | "welcome" | "generation_failed";
  data: {
    reportId?: string;
    reportTitle?: string;
    downloadUrl?: string;
    retryUrl?: string;
    userName?: string;
    amount?: number;
    plan?: string;
  };
}

const getEmailTemplate = (type: string, data: EmailRequest["data"]) => {
  switch (type) {
    case "report_ready":
      return {
        subject: `Votre rapport BenchmarkAI est prêt ! 📊`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; }
              .card { background: #f8f7f4; border-radius: 16px; padding: 30px; margin: 20px 0; }
              .button { display: inline-block; background: #1a1a1a; color: white !important; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">⚡ BenchmarkAI</div>
              
              <h1 style="font-size: 28px; margin-bottom: 10px;">Votre rapport est prêt !</h1>
              <p style="color: #666; font-size: 18px;">Bonne nouvelle, votre benchmark est terminé.</p>
              
              <div class="card">
                <h2 style="margin-top: 0;">${data.reportTitle || "Votre rapport de benchmark"}</h2>
                <p>Votre analyse complète est maintenant disponible. Vous y trouverez :</p>
                <ul>
                  <li>Résumé exécutif avec insights clés</li>
                  <li>Analyse détaillée de vos concurrents</li>
                  <li>Recommandations tarifaires</li>
                  <li>Plan d'action 30/60/90 jours</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.downloadUrl || '#'}" class="button">Consulter mon rapport →</a>
              </p>
              
              <div class="footer">
                <p>BenchmarkAI - Votre outil de benchmark intelligent</p>
                <p style="font-size: 12px;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "payment_confirmation":
      return {
        subject: `Confirmation de paiement - BenchmarkAI`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; }
              .card { background: #f8f7f4; border-radius: 16px; padding: 30px; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">⚡ BenchmarkAI</div>
              
              <h1 style="font-size: 28px; margin-bottom: 10px;">Merci pour votre achat ! 🎉</h1>
              
              <div class="card">
                <h3 style="margin-top: 0;">Récapitulatif</h3>
                <p><strong>Plan:</strong> ${data.plan || "Standard"}</p>
                <p><strong>Montant:</strong> ${(data.amount || 0) / 100}€</p>
              </div>
              
              <p>Votre rapport est en cours de génération et sera prêt dans quelques instants. Vous recevrez un email dès qu'il sera disponible.</p>
              
              <div class="footer">
                <p>BenchmarkAI - Votre outil de benchmark intelligent</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "welcome":
      return {
        subject: `Bienvenue sur BenchmarkAI ! 👋`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; }
              .button { display: inline-block; background: #1a1a1a; color: white !important; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">⚡ BenchmarkAI</div>
              
              <h1 style="font-size: 28px; margin-bottom: 10px;">Bienvenue ${data.userName || ""} !</h1>
              <p style="color: #666; font-size: 18px;">Prêt à révolutionner votre positionnement ?</p>
              
              <p>Avec BenchmarkAI, obtenez en 10 minutes :</p>
              <ul>
                <li>Un diagnostic stratégique complet</li>
                <li>Une analyse de vos concurrents</li>
                <li>Un plan d'action 30/60/90 jours</li>
              </ul>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://benchmarkai.app/app/new" class="button">Créer mon premier benchmark →</a>
              </p>
              
              <div class="footer">
                <p>BenchmarkAI - Votre outil de benchmark intelligent</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "generation_failed":
      return {
        subject: `Un problème est survenu - BenchmarkAI`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; }
              .card { background: #fef2f2; border-radius: 16px; padding: 30px; margin: 20px 0; border: 1px solid #fecaca; }
              .button { display: inline-block; background: #1a1a1a; color: white !important; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">⚡ BenchmarkAI</div>
              
              <h1 style="font-size: 28px; margin-bottom: 10px;">Oups, un problème est survenu 😔</h1>
              
              <div class="card">
                <p>La génération de votre rapport a rencontré un problème technique. Pas de panique, notre équipe est sur le coup !</p>
                <p>Vous pouvez réessayer la génération en cliquant sur le bouton ci-dessous.</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.retryUrl || '#'}" class="button">Réessayer la génération →</a>
              </p>
              
              <p style="color: #666;">Si le problème persiste, répondez à cet email et nous vous aiderons dans les plus brefs délais.</p>
              
              <div class="footer">
                <p>BenchmarkAI - Votre outil de benchmark intelligent</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error("Unknown email type");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailRequest = await req.json();

    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    const template = getEmailTemplate(type, data);

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BenchmarkAI <noreply@benchmarkai.app>",
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${emailResponse.status}`);
    }

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, id: responseData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Send email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
