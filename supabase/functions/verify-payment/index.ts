import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Import shared CORS headers (eliminates duplication across functions)
// @ts-ignore - Deno import
import { corsHeaders } from "../_shared.ts";

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

    // SECURITY: Verify user is authenticated FIRST
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user?.id) {
      console.error("[VerifyPayment] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[VerifyPayment] User verified: ${user.id}`);

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
    const sessionUserId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "No report ID in session metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify that session belongs to authenticated user
    if (sessionUserId !== user.id) {
      console.error(`[VerifyPayment] Session user mismatch: ${sessionUserId} !== ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Session does not belong to user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if payment was successful
    if (session.payment_status === "paid" || session.status === "complete") {
      // SECURITY: Get report and verify user owns it
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .select("status, plan, user_id")
        .eq("id", reportId)
        .eq("user_id", user.id) // ← Ownership check
        .single();

      if (reportError || !report) {
        console.error(`[VerifyPayment] Error fetching report or unauthorized access:`, reportError);
        return new Response(
          JSON.stringify({ error: "Report not found or access denied" }),
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
