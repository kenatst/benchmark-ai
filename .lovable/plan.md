

# AI Benchmark Generator - Full Build Plan

## Overview
A premium web application that generates AI-powered benchmark reports for businesses. Users complete a guided questionnaire, pay $4.99, and receive a beautifully formatted PDF report with competitor analysis, pricing strategies, and actionable 30/60/90 day plans.

---

## Design System

**Color Palette:** Soft grays + teal accents
- Background: Light warm gray (#F9FAFB)
- Cards: Pure white with subtle shadows
- Primary accent: Teal (#0D9488)
- Text: Charcoal gray (#1F2937)
- Muted text: Cool gray (#6B7280)

**Typography:** Clean, single font family (Inter) with 3 sizes
- Hero: 48px bold
- Section: 32px semibold  
- Body: 16px regular

**Style:** Premium, calm aesthetic with generous whitespace, soft shadows, subtle borders

---

## Pages & Features

### 1. Landing Page (/)
A high-converting page following the exact structure you specified:

**Navigation**
- Sticky navbar with: Product, Use Cases, Pricing, About
- Primary CTA button: "Generate my benchmark"

**Hero Section**
- Centered headline: "Get a premium benchmark report for your business in 10 minutes"
- 3 value bullets with icons
- Product screenshot mockup showing report preview
- Primary CTA + "See an example report" link

**Social Proof Section**
- 3 realistic testimonials with avatars
- Logo row (placeholder brands)
- Trust badges: "Instant delivery", "Secure payments", "Designed for decision-making"

**Problem → Solution Section**
- Left: 3 pain points with red indicators
- Right: 3 solutions with green indicators
- Clean illustration between

**Feature Cards (6 cards)**
- Smart questionnaire → No blank page
- Competitor comparison → Know where you win
- Local market angle → Regional relevance
- Pricing strategy → Package with confidence
- Positioning matrix → Clear differentiation
- Action plan → Execute step-by-step

**Visual Product Demo**
- Report preview with 3 toggleable tabs: Overview, Competitors, Action Plan
- Polished mock UI with blurred sample pages

**Secondary Proof**
- 2 additional testimonials
- Stats: "Average completion: 8-12 minutes"
- Guarantees: "Premium PDF format", "24-hour refund policy"

**Final CTA Section**
- "Ready to benchmark your market?"
- Large teal CTA button
- Price displayed: $4.99

**Footer**
- Links to legal pages, about, contact

---

### 2. Authentication (/auth)
- Clean login/signup page matching site design
- Toggle between Sign In and Sign Up
- Both options: Magic link OR email/password
- Password reset flow
- Automatic redirect after auth

---

### 3. Dashboard (/app)
- Overview of user's reports
- Quick stats: Reports generated, Last report date
- "Generate New Benchmark" prominent button
- Recent reports list with status indicators

---

### 4. Questionnaire Wizard (/app/new)
Multi-step form with progress bar, autosave, premium UX:

**Step 1 - Basics**
- Business name, website (optional)
- Sector with suggested chips
- Location (city, country picker)
- Target customers (B2B/B2C toggle + persona)

**Step 2 - Offer & Pricing**
- What you sell (textarea)
- Price range (min/max sliders)
- Differentiators (chips + custom)
- Acquisition channels (checkboxes)

**Step 3 - Benchmark Goals**
- Multi-select cards: Competitor map, Pricing strategy, Positioning, Go-to-market plan, Risks, Growth opportunities

**Step 4 - Competitors**
- Add 3-10 competitors (name + URL)
- Gentle nudge if less than 3
- Allow skip for MVP

**Step 5 - Constraints & Context**
- Budget level (toggle: Low/Medium/High)
- Timeline picker (Now/30/90 days)
- Notes textarea
- Tone preference (Professional/Bold/Minimalist)

**Step 6 - Review & Pay**
- Clean summary of all inputs
- Checklist of what report includes
- Price: $4.99
- "Pay & generate my benchmark" button
- Mock payment flow (simulates Stripe)

---

### 5. Reports List (/app/reports)
- Card grid of all user reports
- Status badges: Processing, Ready, Failed
- Date and sector displayed
- Click to view details

---

### 6. Report Detail (/app/reports/:id)
- Status indicator with progress animation
- **Processing state:** Animated loading (5-10 seconds)
- **Ready state:** 
  - Download PDF button (prominent)
  - Inline preview of key sections
  - Summary highlights
- **Failed state:** Error message + retry button
- Regenerate option (disabled for MVP)

---

### 7. Pricing Page (/pricing)
- Clean single-plan presentation: $4.99 per report
- Feature checklist included
- "Coming soon" add-on teaser: "With sources & competitor scraping"
- FAQ accordion
- CTA to start questionnaire

---

### 8. About Page (/about)
- Company story/mission
- Methodology accordion explaining:
  - What inputs are used
  - How AI structures the report
  - What users should validate
- Trust signals

---

### 9. Example Report (/example)
- Modal or dedicated page
- Sample PDF pages displayed
- Blurred sensitive sections
- CTA to generate own report

---

### 10. Legal Page (/legal)
- Terms of Service
- Privacy Policy
- Disclaimer: "Decision support, not official market research"
- Data handling explanation

---

## Backend (Mock Data Phase)

**Database Tables (Supabase)**
- `profiles` - User profile data
- `reports` - All benchmark reports with status, input payload, generated output

**Mock Report Generation**
- Simulated 5-10 second processing delay
- Pre-built mock JSON output following your schema
- Mock PDF preview displayed inline

**Report Data Structure (Mock)**
```
- title
- executive_summary (bullets)
- market_overview
- target_segments
- competitor_table (array)
- positioning_matrix
- pricing_recommendations
- go_to_market
- risks_and_checks
- action_plan_30_60_90
- assumptions_and_questions
- sources (when URLs provided)
```

**Mock Payment**
- Simulated checkout flow
- Success triggers processing animation
- No real Stripe integration yet

---

## Mobile Optimization
- Stack elements below 768px
- Full-width CTAs below 480px
- Shortened copy on mobile
- CTAs surface earlier in scroll
- Touch-friendly form elements
- Swipeable tabs for report preview

---

## Future Phase (After Mock)
- Stripe integration for real payments
- Claude API integration for AI generation
- HTML → PDF conversion
- Email delivery with Resend
- Regenerate functionality

---

## Trust & Safety Microcopy
Throughout the app:
- "We don't invent sources. If you provide competitor URLs, we cite them."
- "This is decision-support, not legal/financial advice."
- "If anything looks off, you can regenerate once."

