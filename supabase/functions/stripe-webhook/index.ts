import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared.ts";

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

      // ============================================
      // CRITICAL: ALL DATABASE OPERATIONS FIRST
      // Webhook must return 200 within 1 second
      // ============================================

      // 1. Update report status to 'paid' (ATOMIC)
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

      console.log(`[Webhook] Report ${reportId} updated to paid status - RETURNING 200 NOW`);

      // 2. Get user email (needed for background tasks)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      const userEmail = profile?.email;

      // ============================================
      // RETURN 200 IMMEDIATELY - Stripe is happy
      // ============================================
      const response = new Response(
        JSON.stringify({ received: true, reportId, timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

      // ============================================
      // BACKGROUND TASKS - Run asynchronously
      // Use EdgeRuntime.waitUntil() to keep function alive
      // Even if this fails, webhook already returned 200
      // ============================================
      const backgroundTasks = async () => {
        try {
          // Update to processing status AFTER returning 200
          await supabaseAdmin
            .from("reports")
            .update({ status: "processing", processing_step: "Initialisation...", processing_progress: 5 })
            .eq("id", reportId);

          // Send payment confirmation email (non-blocking)
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
                    type: "payment_confirmation",
                    data: {
                      plan: plan,
                      amount: session.amount_total,
                    },
                  }),
                }
              );
              console.log("[Webhook BG] Payment confirmation email sent");
            } catch (emailError) {
              console.error("[Webhook BG] Failed to send payment email:", emailError);
              // Don't fail if email fails - queue for retry later
            }
          }

          // Trigger report generation (long-running task)
          console.log("[Webhook BG] Triggering report generation...");
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

          if (!generateResponse.ok) {
            console.error("[Webhook BG] Generation trigger failed:", generateResponse.status);
            // Generation function handles its own retries
          } else {
            console.log("[Webhook BG] Generation triggered successfully");
          }
        } catch (bgError) {
          console.error("[Webhook BG] Background task error:", bgError);
          // Log for monitoring, but don't fail the webhook
          try {
            await supabaseAdmin
              .from("reports")
              .update({
                status: "failed",
                processing_step: "Erreur en arrière-plan du webhook"
              })
              .eq("id", reportId);
          } catch {
            // Already failed, can't update further
          }
        }
      };

      // Use EdgeRuntime.waitUntil if available, otherwise just log
      // @ts-ignore - EdgeRuntime is available in Deno Deploy / Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(backgroundTasks());
      } else {
        // Fallback for local development
        backgroundTasks().catch(err => console.error("[Webhook] Background task failed:", err));
      }

      return response;
    } else {
      // Not a checkout.session.completed event - ignore
      console.log("[Webhook] Ignoring event type:", event.type);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    console.error("[Webhook] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
