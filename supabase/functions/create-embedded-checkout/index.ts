import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Import shared CORS headers (eliminates duplication)
// @ts-ignore - Deno import
import { corsHeaders } from "../_shared.ts";

// Price IDs for the 3 plans - TEST MODE
const PRICE_IDS = {
  standard: "price_1Sw8hjBlwVXDER871XEMv04h", // tier 1
  pro: "price_1Sw8icBlwVXDER87uAVufweT",      // tier 2
  agency: "price_1Sw8jBBlwVXDER87uehhluPB",   // tier 3
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase clients
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get request body
    const { plan, reportId } = await req.json();

    console.log(`[EmbeddedCheckout] Plan: ${plan}, ReportId: ${reportId}`);

    // SECURITY: Authenticate user FIRST (before any validation)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user?.id || !user?.email) {
      console.error("[EmbeddedCheckout] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[EmbeddedCheckout] User verified: ${user.email}, ID: ${user.id}`);

    // VALIDATION: Validate plan
    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan selected: ${plan}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VALIDATION: Verify reportId exists and belongs to user
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "Report ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("id, user_id, status")
      .eq("id", reportId)
      .eq("user_id", user.id) // ← Ownership check
      .single();

    if (reportError || !report) {
      console.error("[EmbeddedCheckout] Report not found or unauthorized:", reportError);
      return new Response(
        JSON.stringify({ error: "Report not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow checkout if report is in draft state (hasn't been paid yet)
    if (report.status !== "draft") {
      return new Response(
        JSON.stringify({
          error: `Report has already been paid for (status: ${report.status})`,
          alreadyPaid: true,
          reportId: reportId,
          reportStatus: report.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use STRIPE_TEST_KEY for test mode
    const stripeKey = Deno.env.get("STRIPE_TEST_KEY");

    if (!stripeKey) {
      throw new Error("STRIPE_TEST_KEY not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`[EmbeddedCheckout] Found existing customer: ${customerId}`);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || Deno.env.get("FRONTEND_URL") || "https://benchmarkai.app";

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    // Create a one-time payment session with Embedded UI mode
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      customer_creation: customerId ? undefined : "always",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      // Stripe Embedded Checkout does NOT always redirect automatically after payment.
      // Force redirect so users land on the generation/progress page.
      redirect_on_completion: "always",
      return_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        report_id: reportId,
        plan: plan,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: "auto",
      // Payment method types
      payment_method_types: ["card"],
      // Customize checkout appearance
      locale: "fr",
    });

    console.log(`[EmbeddedCheckout] Session created: ${session.id}, clientSecret available: ${!!session.client_secret}`);

    // Update the report with the Stripe session ID
    const { error: updateError } = await supabaseAdmin
      .from("reports")
      .update({ 
        stripe_session_id: session.id,
        plan: plan,
        status: "draft"
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("[EmbeddedCheckout] Error updating report:", updateError);
      // Non-blocking: session was already created, so log but continue
      // The webhook or verify-payment will handle updating the report
    } else {
      console.log(`[EmbeddedCheckout] Report ${reportId} updated with session ID`);
    }

    return new Response(JSON.stringify({ 
      clientSecret: session.client_secret,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[EmbeddedCheckout] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
