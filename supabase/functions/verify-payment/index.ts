import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://benchmarkai.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing session ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[VerifyPayment] Verifying session: ${sessionId}`);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_TEST_KEY") || Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log(`[VerifyPayment] Session status: ${session.status}, payment_status: ${session.payment_status}`);
    console.log(`[VerifyPayment] Metadata:`, session.metadata);

    const reportId = session.metadata?.report_id;
    const plan = session.metadata?.plan;

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "No report ID in session metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if payment was successful
    if (session.payment_status === "paid" || session.status === "complete") {
      // Get current report status
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .select("status, plan")
        .eq("id", reportId)
        .single();

      if (reportError) {
        console.error(`[VerifyPayment] Error fetching report:`, reportError);
        return new Response(
          JSON.stringify({ error: "Report not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If report is still in draft, update it to paid (webhook might not have fired yet)
      if (report.status === "draft") {
        console.log(`[VerifyPayment] Updating report ${reportId} to paid status`);
        
        await supabaseAdmin
          .from("reports")
          .update({
            status: "paid",
            stripe_payment_id: session.payment_intent as string,
            amount_paid: session.amount_total,
            plan: plan,
          })
          .eq("id", reportId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentStatus: "paid",
          reportId: reportId,
          reportStatus: report.status === "draft" ? "paid" : report.status,
          plan: plan,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: session.payment_status,
          error: "Payment not completed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[VerifyPayment] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
