import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get request body
    const { plan, reportId } = await req.json();

    console.log(`[EmbeddedCheckout] Plan: ${plan}, ReportId: ${reportId}`);

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
      console.error("[EmbeddedCheckout] Auth error:", authError);
      throw new Error("User not authenticated or email not available");
    }

    console.log(`[EmbeddedCheckout] User: ${user.email}, ID: ${user.id}`);

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
    const origin = req.headers.get("origin") || "https://id-preview--d281c140-859f-42d4-bcb1-1a3462e3cb0f.lovable.app";

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
      console.error("[EmbeddedCheckout] Error updating report:", updateError);
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
