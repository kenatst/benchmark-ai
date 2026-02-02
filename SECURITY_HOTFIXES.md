# 🔴 SECURITY HOT FIXES - IMMEDIATE ACTIONS

**DO NOT DEPLOY WITHOUT THESE FIXES**

---

## Critical Issue #1: Stripe Webhook Accepts Unsigned Requests

**File:** `supabase/functions/stripe-webhook/index.ts:57-60`

### Current Code (VULNERABLE)
```typescript
} else {
  // For testing without webhook signature (NOT recommended for production)
  console.warn("[Webhook] No signature verification - TEST MODE");
  event = JSON.parse(body);
}
```

### Fixed Code
```typescript
} else {
  console.error("[Webhook] Webhook verification required but secret not configured");
  return new Response(JSON.stringify({
    error: "Webhook verification required. Configure STRIPE_WEBHOOK_SECRET."
  }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Why:** Any attacker can send unsigned webhook events and trigger payment processing without actual payment. This is a critical authorization bypass.

---

## Critical Issue #2: Environment Secrets in Git

**File:** `.env` (exposed in repository history)

### Action Steps:
```bash
# 1. Add to .gitignore IMMEDIATELY
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 2. Remove from git history (DESTRUCTIVE - do before pushing)
git filter-branch --tree-filter 'rm -f .env' HEAD

# 3. Regenerate ALL secrets in Supabase Console
#    - New JWT key
#    - New service role key
#    - New publishable key

# 4. Regenerate ALL secrets in Stripe Dashboard
#    - New test secret key
#    - New webhook signing secret

# 5. Update .env.example
cat > .env.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=your-project-id

# Stripe Configuration (set in Supabase env, not frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
EOF

# 6. Commit changes
git add .gitignore .env.example SECURITY_HOTFIXES.md
git commit -m "Security: Remove secrets from version control"
```

**Why:** Secrets in git history are accessible to anyone with repository access. They remain in the history even if deleted from current files.

---

## Critical Issue #3: Stripe Test Key Hardcoded

**File:** `src/lib/stripe.ts:5`

### Current Code (VULNERABLE)
```typescript
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51Sw0y9BlwVXDER87pHQRQvL3VrG2MH9CLFTqfHN7z7qKLpvWHRIcGQvxm7rAm8bLNJzLxQbZpA7CLfxPHqZjlGwc00cwlZHvHK';
```

### Fixed Code
```typescript
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error(
    'Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable. ' +
    'See .env.example for configuration.'
  );
}

export const stripe = new Stripe(stripePublishableKey);
```

**Why:** Hardcoded keys are visible in the compiled JavaScript bundle and git history. They should fail fast if not configured rather than falling back to test keys.

---

## High Priority Issue #4: CORS Wildcard

**File:** All Edge Functions (`supabase/functions/*/index.ts`)

### Search & Replace Pattern:
```typescript
// FIND:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

// REPLACE WITH:
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://benchmarkai.app",  // Or your domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
```

**Apply to:**
1. `stripe-webhook` (exception: webhooks need to accept from Stripe IP)
2. `verify-payment`
3. `create-embedded-checkout`
4. `generate-report`
5. `generate-pdf`
6. `generate-excel`
7. `generate-slides`
8. `stream-pdf`

**Why:** Wildcard CORS allows cross-site requests from any domain. Restrict to your frontend domain only.

---

## High Priority Issue #5: Memory Leaks in ReportDetail.tsx

**File:** `src/pages/ReportDetail.tsx:61-83`

### Current Code (VULNERABLE)
```typescript
useEffect(() => {
  const loadReport = async () => {
    if (id) {
      setIsLoading(true);
      let r = getReport(id);
      if (!r) {
        r = await refetchReport(id);
      }
      const checkInterval = setInterval(async () => {
        const updated = await refetchReport(id);
        setReport(updated);
      }, 2000);

      return () => {  // ❌ Cleanup inside async function
        clearInterval(checkInterval);
      };
    }
  };
  loadReport();
}, [id, getReport, refetchReport]);
```

### Fixed Code
```typescript
useEffect(() => {
  if (!id || status !== 'processing') {
    return;
  }

  let isMounted = true;

  // Initial load
  refetchReport(id).then((report) => {
    if (isMounted) setReport(report);
  });

  // Polling
  const checkInterval = setInterval(() => {
    refetchReport(id).then((report) => {
      if (isMounted) setReport(report);
    });
  }, 2000);

  // ✅ Cleanup at effect scope
  return () => {
    isMounted = false;
    clearInterval(checkInterval);
  };
}, [id, status]);
```

**Why:** Cleanup function inside async `loadReport()` may never be returned. Intervals continue running after component unmounts, consuming memory and making unnecessary requests.

---

## High Priority Issue #6: Memory Leaks in PaymentSuccess.tsx

**File:** `src/pages/PaymentSuccess.tsx:119-160`

### Current Code (VULNERABLE)
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    pollCount++;
    // ... polling
    if (pollCount > maxPolls) {
      clearInterval(interval);
    }
  }, 3000);
  // ❌ NO CLEANUP FUNCTION
}, [reportId]);
```

### Fixed Code
```typescript
useEffect(() => {
  let pollCount = 0;
  const maxPolls = 60; // 3 minutes maximum

  const interval = setInterval(async () => {
    try {
      pollCount++;

      // ... polling logic

      if (pollCount > maxPolls) {
        clearInterval(interval);
        setError('Report generation taking too long');
      }
    } catch (error) {
      console.error('Polling error:', error);
      setError('Failed to fetch report status');
      clearInterval(interval);
    }
  }, 3000);

  // ✅ Cleanup function
  return () => {
    clearInterval(interval);
  };
}, [reportId]);
```

**Why:** Without cleanup function, interval continues running indefinitely if component unmounts, causing memory leaks and unnecessary requests.

---

## High Priority Issue #7: Auth Hook Promise Without Error Handler

**File:** `src/hooks/useAuth.ts:21-25`

### Current Code (VULNERABLE)
```typescript
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
  setUser(session?.user ?? null);
  setLoading(false);
});
// ❌ If getSession fails, loading stays true forever
```

### Fixed Code
```typescript
useEffect(() => {
  let isMounted = true;

  supabase.auth.getSession()
    .then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    })
    .catch((error) => {
      if (isMounted) {
        console.error('Failed to load session:', error);
        setError('Failed to restore session. Please login again.');
      }
    })
    .finally(() => {
      if (isMounted) setLoading(false);
    });

  return () => {
    isMounted = false;
  };
}, []);
```

**Why:** Unhandled promise rejection leaves loading state stuck at true, blocking the entire application.

---

## Deployment Checklist

- [ ] Fix Stripe webhook signature verification (REQUIRED)
- [ ] Remove .env from git history and regenerate secrets (REQUIRED)
- [ ] Remove hardcoded Stripe key fallback (REQUIRED)
- [ ] Fix CORS headers on all Edge Functions (REQUIRED)
- [ ] Fix memory leaks in ReportDetail.tsx (REQUIRED)
- [ ] Fix memory leaks in PaymentSuccess.tsx (REQUIRED)
- [ ] Fix auth hook promise error handling (REQUIRED)
- [ ] Add .env to .gitignore (REQUIRED)
- [ ] Run npm audit fix (REQUIRED)
- [ ] Test all fixed functionality (REQUIRED)
- [ ] Review other sensitive files (useReports.ts, storage RLS) (RECOMMENDED)

---

**DO NOT MERGE TO MAIN UNTIL ALL CRITICAL ISSUES ARE FIXED**
