import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Price IDs for the 3 plans - TEST MODE
const PRICE_IDS = {
  standard: "price_1Sw8SJBSuagSNrWjBnWWh7AZ", // 4.99€
  pro: "price_1Sw8SlBSuagSNrWjJUFGJqeT",      // 14.99€
  agency: "price_1Sw8TGBSuagSNrWjlSaKURKP",   // 29.00€
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get request body
    const { plan, reportId } = await req.json();

    console.log(`[Checkout] Plan: ${plan}, ReportId: ${reportId}`);

    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      throw new Error(`Invalid plan selected: ${plan}`);
    }

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user?.email) {
      console.error("[Checkout] Auth error:", authError);
      throw new Error("User not authenticated or email not available");
    }

    console.log(`[Checkout] User: ${user.email}, ID: ${user.id}`);

    // TEST MODE ONLY (as requested)
    const stripeKey = Deno.env.get("STRIPE_TEST_KEY");

    if (!stripeKey) {
      throw new Error("STRIPE_TEST_KEY not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Helpful debug signal (does not expose secrets)
    const account = await stripe.accounts.retrieve();
    console.log(`[Checkout] Stripe account: ${account.id} (livemode=${account.livemode})`);

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`[Checkout] Found existing customer: ${customerId}`);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://id-preview--d281c140-859f-42d4-bcb1-1a3462e3cb0f.lovable.app";

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    // Validate price exists in the Stripe account bound to STRIPE_TEST_KEY
    try {
      await stripe.prices.retrieve(priceId);
    } catch (e) {
      console.error(`[Checkout] Price not found in this Stripe account: ${priceId}`);
      throw new Error(`Stripe price not found for selected plan. Please ensure STRIPE_TEST_KEY matches the Stripe account where your TEST prices were created.`);
    }

    // Create a one-time payment session with Stripe Checkout
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
      success_url: `${origin}/app/reports/${reportId}?payment=success`,
      cancel_url: `${origin}/app/new?payment=cancelled`,
      metadata: {
        user_id: user.id,
        report_id: reportId,
        plan: plan,
      },
      // Enable automatic tax collection (optional)
      automatic_tax: { enabled: false },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: "auto",
      // Payment method types (Stripe will show the best options based on customer location)
      payment_method_types: ["card"],
      // Customize checkout appearance
      locale: "fr",
    });

    console.log(`[Checkout] Session created: ${session.id}, URL: ${session.url}`);

    // Update the report with the Stripe session ID using service role for reliability
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseAdmin
      .from("reports")
      .update({ 
        stripe_session_id: session.id,
        plan: plan,
        status: "draft"
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("[Checkout] Error updating report:", updateError);
      // Don't throw - the payment session is still valid
    } else {
      console.log(`[Checkout] Report ${reportId} updated with session ID`);
    }

    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[Checkout] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
