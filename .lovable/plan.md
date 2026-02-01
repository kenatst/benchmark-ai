# BenchAI - Guide de Déploiement Complet

## 🎯 Vue d'ensemble du projet

**BenchAI** est un générateur de benchmarks de positionnement qui permet aux entrepreneurs d'obtenir un diagnostic stratégique et un plan d'action en 10 minutes.

### État actuel ✅
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui ✅
- **Design**: Premium "god-tier" avec animations et couleurs pastels ✅
- **Pages**: Landing, Pricing, About, Example, Settings, Auth, Dashboard, Wizard, Reports ✅
- **État local**: localStorage pour mock data ✅
- **Paiement**: Mock (simulé) - prêt pour Stripe
- **Génération**: Mock (délai 5-10s) - prêt pour Claude API

### Tarification
| Plan | Prix | Contenu |
|------|------|---------|
| Standard | 4,99€ | 2000-3000 mots, 3-5 concurrents, PDF standard |
| Pro | 14,99€ | 4000-6000 mots, 5-10 concurrents, recherche web, PDF premium |
| Agence | 29€ | 8000-12000 mots, 10-15 concurrents, multi-marchés, PDF+Excel+Slides |

---

## 📋 Checklist de Déploiement Step-by-Step

### Phase 1: Backend & Base de données

#### 1.1 Activer Lovable Cloud
```
□ Cliquer sur "Enable Cloud" dans Lovable
□ Attendre la création du projet Supabase
□ Vérifier l'accès au dashboard Cloud
```

#### 1.2 Créer les tables de base de données
```sql
-- Table profiles (utilisateurs)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table reports (rapports générés)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'failed')),
  plan TEXT DEFAULT 'standard' CHECK (plan IN ('standard', 'pro', 'agency')),
  input_data JSONB NOT NULL,
  output_data JSONB,
  stripe_payment_id TEXT,
  amount_paid INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 1.3 Configurer l'authentification
```
□ Aller dans Cloud > Authentication
□ Activer Email/Password
□ (Optionnel) Désactiver "Confirm email" pour les tests
□ Configurer les URLs de redirection
```

---

### Phase 2: Intégration Stripe

#### 2.1 Créer un compte Stripe
```
□ Créer un compte sur stripe.com
□ Activer le mode Test
□ Récupérer les clés API (Dashboard > Developers > API keys)
```

#### 2.2 Créer les produits Stripe
```
□ Créer produit "BenchAI Standard" - 4.99€ (one-time)
   → price_id: price_xxx_standard
□ Créer produit "BenchAI Pro" - 14.99€ (one-time)  
   → price_id: price_xxx_pro
□ Créer produit "BenchAI Agence" - 29€ (one-time)
   → price_id: price_xxx_agency
```

#### 2.3 Ajouter les secrets dans Lovable
```
□ STRIPE_SECRET_KEY (sk_test_xxx ou sk_live_xxx)
□ STRIPE_WEBHOOK_SECRET (whsec_xxx)
□ STRIPE_PRICE_STANDARD (price_xxx)
□ STRIPE_PRICE_PRO (price_xxx)
□ STRIPE_PRICE_AGENCY (price_xxx)
```

#### 2.4 Edge Functions à créer
```
□ supabase/functions/create-checkout/index.ts
   - Crée une session Stripe Checkout
   - Retourne l'URL de paiement

□ supabase/functions/stripe-webhook/index.ts
   - Reçoit les événements Stripe
   - checkout.session.completed → déclenche génération
```

---

### Phase 3: Génération de rapports (Claude API)

#### 3.1 Obtenir une clé API Anthropic
```
□ Créer un compte sur console.anthropic.com
□ Générer une clé API
□ Ajouter ANTHROPIC_API_KEY dans les secrets Lovable
```

#### 3.2 Edge Function de génération
```
□ supabase/functions/generate-report/index.ts
   - Reçoit les données du questionnaire
   - Appelle Claude API avec prompt structuré
   - Sauvegarde le JSON dans reports.output_data
   - Met à jour status → "ready"
```

#### 3.3 Modèle recommandé
```
Standard: claude-3-haiku (rapide, économique)
Pro/Agence: claude-3-5-sonnet (plus détaillé)
```

---

### Phase 4: Génération PDF

#### Option A: HTML → PDF avec Puppeteer
```
□ supabase/functions/generate-pdf/index.ts
   - Génère HTML depuis output_data
   - Convertit en PDF avec Puppeteer
   - Upload dans Supabase Storage
```

#### Option B: Service externe (PDFShift, DocRaptor)
```
□ Ajouter clé API du service
□ Appeler l'API avec le HTML
```

---

### Phase 5: Stockage des fichiers

```
□ Créer bucket "reports" dans Supabase Storage
□ Configurer comme privé
□ Ajouter policy: users peuvent télécharger leurs propres fichiers
```

---

### Phase 6: Emails transactionnels

#### Configurer Resend
```
□ Créer compte Resend
□ Vérifier domaine (benchai.app)
□ Ajouter RESEND_API_KEY
```

#### Emails à configurer
```
□ Confirmation de paiement
□ Rapport prêt (avec lien temporaire)
□ (Optionnel) Onboarding, rappels
```

---

### Phase 7: Déploiement Production

#### 7.1 Stripe Production
```
□ Activer mode Live
□ Compléter vérification compte
□ Mettre à jour clés (sk_live_xxx)
□ Recréer webhooks avec URL production
```

#### 7.2 Publier
```
□ Cliquer "Publish" dans Lovable
□ Configurer domaine personnalisé
□ Vérifier certificat SSL
```

#### 7.3 Tests finaux
```
□ Flow complet de paiement
□ Génération de rapport
□ Téléchargement PDF
□ Emails reçus
```

---

## 🔧 Secrets à configurer

| Secret | Description | Source |
|--------|-------------|--------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | stripe.com/dashboard |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook | stripe.com/webhooks |
| `ANTHROPIC_API_KEY` | Clé Claude API | console.anthropic.com |
| `RESEND_API_KEY` | Clé emails | resend.com |

---

## 💰 Coûts estimés

| Service | Coût |
|---------|------|
| Lovable Cloud | Inclus |
| Stripe | 1.4% + 0.25€/transaction |
| Claude API | ~0.01€/rapport (haiku), ~0.05€ (sonnet) |
| Resend | Gratuit < 3000 emails/mois |
| **Total fixe mensuel** | **~0€** |

---

## 🎯 Ordre de priorité

1. ⚡ **Activer Cloud** - Bloque tout le reste
2. 💳 **Intégrer Stripe** - Revenus
3. 🤖 **Connecter Claude** - Vrais rapports
4. 📄 **Génération PDF** - Livrable final
5. 📧 **Emails** - Expérience complète

---

## 📱 Fonctionnalités actuelles

### Pages publiques
- `/` - Landing page premium
- `/pricing` - Plans et FAQ
- `/about` - Mission et méthodologie
- `/example` - Aperçu d'un rapport type
- `/legal` - CGV et mentions légales

### Pages app (authentifié)
- `/auth` - Connexion/Inscription
- `/app` - Dashboard utilisateur
- `/app/new` - Wizard de création (6 étapes)
- `/app/reports` - Liste des rapports
- `/app/reports/:id` - Détail d'un rapport
- `/settings` - Paramètres utilisateur

### Wizard (6 étapes)
1. **Business** - Nom, secteur, localisation
2. **Offre** - Description, pricing, différenciateurs
3. **Objectifs** - Ce que l'utilisateur veut obtenir
4. **Concurrents** - URLs optionnelles
5. **Contexte** - Budget, timeline, ton
6. **Finaliser** - Résumé et paiement
