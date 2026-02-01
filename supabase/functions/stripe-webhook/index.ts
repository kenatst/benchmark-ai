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

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errMessage);
        return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For testing without webhook signature
      event = JSON.parse(body);
    }

    console.log("Received event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Checkout session completed:", session.id);
      console.log("Metadata:", session.metadata);

      const reportId = session.metadata?.report_id;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan;

      if (reportId && userId) {
        // Update report status to 'paid'
        const { error: updateError } = await supabaseAdmin
          .from("reports")
          .update({
            status: "paid",
            stripe_payment_id: session.payment_intent as string,
            amount_paid: session.amount_total,
          })
          .eq("id", reportId)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating report:", updateError);
          throw updateError;
        }

        console.log(`Report ${reportId} updated to paid status`);

        // Get user email for confirmation
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        // Send payment confirmation email
        if (profile?.email) {
          try {
            const emailResponse = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: profile.email,
                  type: "payment_confirmation",
                  data: {
                    plan: plan,
                    amount: session.amount_total,
                  },
                }),
              }
            );
            console.log("Payment confirmation email sent:", await emailResponse.json());
          } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
          }
        }

        // Trigger report generation
        console.log("Triggering report generation for:", reportId);
        
        try {
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
          console.log("Report generation triggered:", generateResult);

          // Send report ready email if generation succeeded
          if (generateResult.success && profile?.email) {
            try {
              await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    to: profile.email,
                    type: "report_ready",
                    data: {
                      reportId: reportId,
                      downloadUrl: `https://benchmarkai.app/app/reports/${reportId}`,
                    },
                  }),
                }
              );
              console.log("Report ready email sent");
            } catch (emailError) {
              console.error("Failed to send report ready email:", emailError);
            }
          }
        } catch (generateError) {
          console.error("Failed to trigger report generation:", generateError);
          // Don't throw - the payment was successful, generation can be retried
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
