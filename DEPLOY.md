# Regulaton — Deployment Guide

## Stack in production
- **Frontend + API**: Vercel
- **Database**: Neon (Postgres, serverless)
- **Auth**: NextAuth JWT (no separate auth server needed)
- **Payments**: Stripe
- **Email**: Resend

---

## 1. Database — Neon

1. Go to neon.tech → create a project → name it `regulaton-prod`
2. In the dashboard, copy the **connection string** (pooled version for serverless)
3. It looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. Keep this for the Vercel env vars step

---

## 2. Stripe setup

### Create products
1. Go to dashboard.stripe.com → Products → Add product
2. Create three products:
   - **Regulaton Solo** — €29/month recurring
   - **Regulaton SMB** — €79/month recurring
   - **Regulaton Business** — €199/month recurring
3. Copy the **Price ID** for each (starts with `price_`)

### Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Webhook signing secret** (starts with `whsec_`)

### Local testing (optional)
```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook secret it prints — use in .env.local
```

---

## 3. Resend (email)

1. Go to resend.com → sign up → Create API key
2. Add your domain and verify DNS records (or use the sandbox for testing)
3. Copy your API key (starts with `re_`)

---

## 4. GitHub OAuth — production app

You'll need a separate GitHub OAuth app for production (different callback URL).

1. github.com/settings/applications/new
2. **Homepage URL**: `https://yourdomain.vercel.app`
3. **Callback URL**: `https://yourdomain.vercel.app/api/auth/callback/github`
4. Copy Client ID and generate Client Secret

---

## 5. Deploy to Vercel

### First deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

Or connect via the Vercel dashboard: Import Git Repository → select your repo.

### Environment variables
Set all of these in Vercel → Project → Settings → Environment Variables:

```
# Database
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
NEXTAUTH_URL=https://yourdomain.vercel.app

# GitHub OAuth (production app)
GITHUB_ID=your-prod-github-client-id
GITHUB_SECRET=your-prod-github-client-secret

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=ConformHQ <hello@yourdomain.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SMB_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

### Run migrations on production DB
After setting env vars, run once from your local machine with the production DATABASE_URL:

```bash
DATABASE_URL="postgresql://...neon.tech/..." npx prisma db push
DATABASE_URL="postgresql://...neon.tech/..." npm run db:seed
```

---

## 6. Custom domain (optional)

Vercel → Project → Settings → Domains → Add your domain.
Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to match.
Update GitHub OAuth callback URL to match.
Update Stripe webhook URL to match.

---

## 7. Post-deploy checklist

- [ ] Sign in with GitHub works
- [ ] Onboarding wizard completes and redirects to dashboard
- [ ] Documents generate and download as .docx
- [ ] Stripe checkout opens (use test cards: `4242 4242 4242 4242`)
- [ ] Stripe webhook receives events (check Vercel logs + Stripe dashboard)
- [ ] Training records save correctly
- [ ] Compliance score updates after finalising documents

---

## Vercel-specific notes

### Serverless function timeout
Vercel free plan has a 10s function timeout. Document generation and onboarding 
complete are the heaviest endpoints — both should complete well within 10s.
If you hit limits, upgrade to Vercel Pro (60s timeout).

### Prisma on Vercel
The `postinstall` script in package.json should run `prisma generate` automatically.
Add this to package.json scripts if not present:
```json
"postinstall": "prisma generate"
```

### Edge middleware
Our middleware.ts runs on Vercel's Edge Network — fast, no cold starts.
The `getToken` call reads from the JWT cookie with no database hit.
