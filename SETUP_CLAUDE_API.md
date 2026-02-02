# 🔧 SETUP - Configuration Claude API & Secrets

## ⚠️ CRITICAL: This is why reports aren't generating!

The report generation fails silently if `CLAUDE_API_KEY` is not configured in Supabase Edge Function secrets.

---

## ✅ STEP 1: Get API Keys

### Claude API Key
1. Go to https://console.anthropic.com/account/keys
2. Create or copy your API key starting with `sk-ant-`
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
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Sw0y9BlwVXDER87pHQRQvL3VrG2MH9CLFTqfHN7z7qKLpvWHRIcGQvxm7rAm8bLNJzLxQbZpA7CLfxPHqZjlGwc00cwlZHvHK
```

**IMPORTANT:** Never put secret keys in `.env` - only publishable keys!

---

## ✅ STEP 3: Configure Supabase Edge Function Secrets

Go to https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/settings/functions

### Add these secrets:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `CLAUDE_API_KEY` | `sk-ant-...` | **REQUIRED** - Report generation needs this |
| `PERPLEXITY_API_KEY` | `pplx-...` | Required for Pro/Agency tiers (5-12 searches) |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Secret key for payment processing |
| `STRIPE_TEST_KEY` | `sk_test_...` | Test key (webhook will use this if available) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production webhook secret |
| `STRIPE_WEBHOOK_SECRET_TEST` | `whsec_test_...` | Test webhook secret |
| `RESEND_API_KEY` | `re_...` | For sending emails |

Steps to add:
1. Click "New secret"
2. Enter name and value
3. Click "Add"
4. Function redeploys automatically

---

## ✅ STEP 4: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL:
   ```
   https://phmhzbmlszbontpfeddk.supabase.co/functions/v1/stripe-webhook
   ```
4. Events to listen for:
   - `checkout.session.completed` (REQUIRED)
   - `charge.failed` (optional, for error handling)
5. Click "Add endpoint"
6. Get "Signing secret" (starts with `whsec_`)
7. Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET_TEST` (test) or `STRIPE_WEBHOOK_SECRET` (production)

---

## 🧪 TEST: Verify Setup Works

### Test 1: Check Claude API Key is Set
```bash
# Go to Supabase Functions logs
# https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/functions

# Look for: "[Claude] Calling Opus 4.5"
# If you see: "CLAUDE_API_KEY is not configured" → Key not set!
```

### Test 2: Create a Test Report
1. Go to https://benchmarkai.app/app/new
2. Fill the wizard (any test data)
3. Select **Standard** plan
4. Complete checkout
5. Watch the `/payment-success` page for progress

**Expected flow:**
```
Vérification du paiement... →
Paiement confirmé ! →
Génération en cours... →
(progress bar fills 0-100) →
Votre benchmark est prêt !
```

### Test 3: Check Logs for Errors
1. Go to https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/functions
2. Click `generate-report` function
3. Click "Logs" tab
4. Look for errors:
   - `CLAUDE_API_KEY is not configured` → Go back to STEP 3
   - `Invalid Claude API key` → API key is wrong
   - `Claude API request timed out` → API is slow, wait or retry

---

## 🐛 DEBUGGING

### Problem: "Report generating takes a long time"
- Check logs: https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/functions
- Look for:
  - `[Claude] Calling Opus 4.5...` = Claude is being called ✅
  - `[Claude] Response received` = Claude replied ✅
  - `[${reportId}] ✅ Report generated successfully` = Generation worked ✅

### Problem: "Generation keeps failing"
Check Supabase Edge Function logs for:
- `CLAUDE_API_KEY is not configured` = Not set, add to secrets
- `Invalid Claude API key` = Key is wrong, check Anthropic console
- `Rate limit exceeded` = API limit hit, wait 1 minute and retry
- `Claude API overloaded` = Anthropic's API is down, retry later

### Problem: "Perplexity research not happening"
- Pro/Agency tiers require `PERPLEXITY_API_KEY`
- If missing, report generation skips to Claude without research
- Check: https://supabase.com/dashboard/project/phmhzbmlszbontpfeddk/functions logs

### Problem: "Stripe webhook not triggering generation"
1. Verify webhook endpoint is reachable:
   ```bash
   curl -X POST \
     https://phmhzbmlszbontpfeddk.supabase.co/functions/v1/stripe-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "request"}'
   # Should get: 401 (missing signature) = Good, webhook exists!
   ```

2. Check webhook logs in Stripe:
   - https://dashboard.stripe.com/webhooks
   - Click your endpoint
   - "Logs" tab shows each event

---

## ✅ VERIFICATION CHECKLIST

Before you go live:

- [ ] `.env` file exists with Supabase credentials
- [ ] `CLAUDE_API_KEY` is set in Supabase secrets
- [ ] `PERPLEXITY_API_KEY` is set (if using Pro/Agency)
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] Stripe webhook endpoint is configured
- [ ] Test report generation works end-to-end
- [ ] `.env` is in `.gitignore` ✅ (fixed!)
- [ ] `.env` is NOT in git history (check earlier commits)

---

## 🚀 NEXT STEPS

1. **Set Claude API Key now** - without this, nothing generates!
2. Create a test report to verify it works
3. Check the logs if it fails
4. Monitor `/payment-success` page during generation

---

**Support:** If generation still fails after following this guide, check the Supabase Edge Function logs for specific error messages.
