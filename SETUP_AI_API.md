# 🔧 SETUP - Configuration AI API & Secrets

## ⚠️ CRITICAL: This is why reports aren't generating!

The report generation fails silently if `OPENAI_API_KEY` is not configured in Supabase Edge Function secrets.

---

## ✅ STEP 1: Get API Keys

### GPT-5.2 (OpenAI) API Key
1. Go to https://platform.openai.com/api-keys
2. Create or copy your API key starting with `sk-`
3. Keep this secret - never share it!

### Perplexity API Key (for Pro/Agency tiers)
1. Go to https://www.perplexity.ai/settings/account
2. Get your API key
3. Keep this secret

### Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - **Test mode:**
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Production mode:**
     - Publishable key: `pk_live_...`
     - Secret key: `sk_live_...`
3. Get Webhook signing secret:
   - Go to https://dashboard.stripe.com/webhooks
   - Click your endpoint
   - Copy "Signing secret" starting with `whsec_`

---

## ✅ STEP 2: Configure Frontend (.env file)

Create or update `.env` file at root directory:

```env
# Supabase (from .env.example or your Supabase project)
VITE_SUPABASE_URL=https://phmhzbmlszbontpfeddk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=phmhzbmlszbontpfeddk

# Stripe Frontend Key (ONLY the publishable key, safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**IMPORTANT:** Never put secret keys in `.env` - only publishable keys!

---

## ✅ STEP 3: Configure Supabase Edge Function Secrets

Go to https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/settings/functions

### Add these secrets:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `OPENAI_API_KEY` | `sk-...` | **REQUIRED** - Report generation needs this |
| `PERPLEXITY_API_KEY` | `pplx-...` | Required for Pro/Agency tiers |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Secret key for payment processing |
| `STRIPE_TEST_KEY` | `sk_test_...` | Test key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production webhook secret |
| `RESEND_API_KEY` | `re_...` | For sending emails |

---

## ✅ STEP 4: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Events: `checkout.session.completed`

---

## 🧪 TEST: Verify Setup Works

### Test 1: Check OpenAI API Key is Set
Look for: `[GPT-5.2] Calling V1 Responses API...` in Supabase logs.

### Test 2: Create a Test Report
1. Go to https://benchmarkai.app/app/new
2. Fill the wizard
3. Select any plan
4. Complete checkout
5. Watch progress

---

## 🐛 DEBUGGING

### Problem: "Report generating takes a long time"
- Check logs for: `[GPT-5.2] Response received`

### Problem: "Generation keeps failing"
- `OPENAI_API_KEY is not configured` = Not set
- `Invalid API key` = Key is wrong
- `Rate limit exceeded` = OpenAI limit hit

---

## ✅ VERIFICATION CHECKLIST

- [ ] `OPENAI_API_KEY` is set in Supabase secrets
- [ ] `PERPLEXITY_API_KEY` is set
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] Test report generation works end-to-end
