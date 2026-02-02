import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use STRIPE_TEST_KEY for testing, fallback to STRIPE_SECRET_KEY for production
  const stripeKey = Deno.env.get("STRIPE_TEST_KEY") || Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!stripeKey) {
    console.error("[Webhook] No Stripe API key configured");
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
  });

  // Create Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        // Use constructEventAsync for Deno/Edge runtime compatibility
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        console.log("[Webhook] Signature verified successfully");
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[Webhook] Signature verification failed:", errMessage);
        return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Webhook signature verification is REQUIRED
      console.error("[Webhook] Missing webhook signature or secret. Rejecting unsigned request.");
      return new Response(JSON.stringify({
        error: "Webhook verification required. Configure STRIPE_WEBHOOK_SECRET in environment."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[Webhook] Received event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("[Webhook] Checkout session completed:", session.id);
      console.log("[Webhook] Payment status:", session.payment_status);
      console.log("[Webhook] Metadata:", JSON.stringify(session.metadata));

      const reportId = session.metadata?.report_id;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan;

      if (!reportId || !userId) {
        console.error("[Webhook] Missing metadata - reportId:", reportId, "userId:", userId);
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update report status to 'paid'
      const { error: updateError } = await supabaseAdmin
        .from("reports")
        .update({
          status: "paid",
          stripe_payment_id: session.payment_intent as string,
          amount_paid: session.amount_total,
          plan: plan,
        })
        .eq("id", reportId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Webhook] Error updating report:", updateError);
        throw updateError;
      }

      console.log(`[Webhook] Report ${reportId} updated to paid status`);

      // Get user email for confirmation
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      const userEmail = profile?.email;
      console.log("[Webhook] User email:", userEmail);

      // Send payment confirmation email
      if (userEmail) {
        try {
          const emailResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: userEmail,
                type: "payment_confirmation",
                data: {
                  plan: plan,
                  amount: session.amount_total,
                },
              }),
            }
          );
          console.log("[Webhook] Payment confirmation email sent:", await emailResponse.text());
        } catch (emailError) {
          console.error("[Webhook] Failed to send payment confirmation email:", emailError);
        }
      }

      // Update status to processing before generation
      await supabaseAdmin
        .from("reports")
        .update({ status: "processing" })
        .eq("id", reportId);

      // Trigger report generation with retry logic
      console.log("[Webhook] Triggering report generation for:", reportId);
      
      const generateWithRetry = async (attempt = 1): Promise<boolean> => {
        const maxAttempts = 3;
        const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        
        try {
          console.log(`[Webhook] Generation attempt ${attempt}/${maxAttempts}`);
          
          const generateResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-report`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ reportId }),
            }
          );
          
          const generateResult = await generateResponse.json();
          console.log(`[Webhook] Generation attempt ${attempt} result:`, JSON.stringify(generateResult));
          
          if (generateResult.success) {
            return true;
          }
          
          if (attempt < maxAttempts) {
            console.log(`[Webhook] Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            return generateWithRetry(attempt + 1);
          }
          
          return false;
        } catch (error) {
          console.error(`[Webhook] Generation attempt ${attempt} error:`, error);
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            return generateWithRetry(attempt + 1);
          }
          return false;
        }
      };
      
      const generationSuccess = await generateWithRetry();
      console.log("[Webhook] Generation success:", generationSuccess);
      
      if (generationSuccess) {
        // Generate PDF
        try {
          console.log("[Webhook] Generating PDF...");
          const pdfResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-pdf`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ reportId }),
            }
          );
          const pdfResult = await pdfResponse.json();
          console.log("[Webhook] PDF generation result:", JSON.stringify(pdfResult));
        } catch (pdfError) {
          console.error("[Webhook] PDF generation failed:", pdfError);
        }
        
        // Send report ready email
        if (userEmail) {
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: userEmail,
                  type: "report_ready",
                  data: {
                    reportId: reportId,
                    reportTitle: `Rapport ${plan?.toUpperCase() || 'STANDARD'}`,
                    downloadUrl: `https://benchmarkai.app/app/reports/${reportId}`,
                  },
                }),
              }
            );
            console.log("[Webhook] Report ready email sent");
          } catch (emailError) {
            console.error("[Webhook] Failed to send report ready email:", emailError);
          }
        }
      } else {
        // Update report status to failed after all retries
        console.log("[Webhook] Marking report as failed");
        await supabaseAdmin
          .from("reports")
          .update({ status: "failed" })
          .eq("id", reportId);
        
        // Send failure notification email
        if (userEmail) {
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: userEmail,
                  type: "generation_failed",
                  data: {
                    reportId: reportId,
                    retryUrl: `https://benchmarkai.app/app/reports/${reportId}`,
                  },
                }),
              }
            );
            console.log("[Webhook] Failure email sent");
          } catch (emailError) {
            console.error("[Webhook] Failed to send failure email:", emailError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[Webhook] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
