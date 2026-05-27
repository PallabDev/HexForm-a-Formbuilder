# HexForm

**A production-style form builder SaaS** — create dynamic forms, publish shareable links, collect responses, and review analytics from one workspace.

Built on the [tRPC Turborepo starter](https://github.com/piyushgarg-dev/trpc-monorepo) and extended into a Typeform-style product for hackathon submission.

---

## Live demo

| Resource | URL |
|----------|-----|
| **Web app** | [https://hexform.pallabdev.in](https://hexform.pallabdev.in) |
| **Sign in** | [https://hexform.pallabdev.in/signin](https://hexform.pallabdev.in/signin) |
| **Explore (public forms)** | [https://hexform.pallabdev.in/explore](https://hexform.pallabdev.in/explore) |
| **Pricing** | [https://hexform.pallabdev.in/pricing](https://hexform.pallabdev.in/pricing) |
| **API docs (Scalar)** | `https://<your-api-host>/docs` (local: [http://localhost:8600/docs](http://localhost:8600/docs)) |
| **OpenAPI JSON** | `https://<your-api-host>/openapi.json` (local: [http://localhost:8600/openapi.json](http://localhost:8600/openapi.json)) |

### Demo credentials (creator dashboard)

Use these to sign in and review the full creator experience (builder, analytics, billing, exports).

| Field | Value |
|-------|-------|
| **Email** | `pallabcode@gmail.com` |
| **Password** | `Demo@Cred1234` |

> **Important:** Replace the values above with your real demo account if you use different credentials on the deployed instance.

**Judge-friendly walkthrough (no manual DB setup):**

1. Sign in at [/signin](https://hexform.pallabdev.in/signin) with the demo credentials.
2. On the **Dashboard**, click **Seed sample forms** to load three themed forms with sample responses and analytics.
3. Open any form → **Builder** to edit fields, validations, and rich-text description.
4. Use **Share** to copy the public link or download a QR code.
5. Open a public form (examples below) to test the respondent flow without logging in.

### Sample public form links

After seeding (or if already published on the demo account):

| Form | Visibility | URL |
|------|------------|-----|
| Customer Satisfaction Survey | Public | [/f/customer-satisfaction-survey](https://hexform.pallabdev.in/f/customer-satisfaction-survey) |
| Product Feature Request Questionnaire | Public | [/f/product-feature-requests](https://hexform.pallabdev.in/f/product-feature-requests) |
| Candidate Job Application | Unlisted (direct link only) | [/f/candidate-job-application](https://hexform.pallabdev.in/f/candidate-job-application) |

---

## What HexForm does

HexForm lets **creators** build surveys and intake forms with a visual builder, publish or unpublish them, and share links with respondents. **Respondents** fill forms without an account, with validation enforced before submit and a clear thank-you / receipt screen.

### Core features

- **Authentication** — Email/password signup, sign-in, email verification, forgot/reset password, JWT session cookies
- **Creator dashboard** — Create, edit, publish, unpublish, and archive forms
- **Dynamic form schema** — Fields, validation rules, required/optional, reorder via drag-and-drop
- **Field types** — Short text, long text, email, number, single/multi select, checkbox, yes/no, date, rating (1–5), file upload (Cloudinary)
- **Visibility modes**
  - **Public** — Listed on Explore; anyone can open and submit
  - **Unlisted** — Published but hidden from Explore; only direct link works
  - **Draft / unpublished** — Does not accept public submissions
- **Public fill experience** — Multi-step UI, draft resume, progress bar, confetti on success, optional preview mode (`?preview=true`)
- **Rich text form description** — TipTap editor in builder; read-only renderer on public welcome screen
- **Responses & analytics** — Submission list, per-day charts, plan-based response limits
- **CSV export** — Download responses from the analytics workspace
- **Email flows** — Verification, password reset, payment receipt (Resend)
- **Spam protection** — Honeypot field + in-memory rate limiting on public submit
- **SaaS surfaces** — Landing page, pricing page, billing/subscriptions (Razorpay-ready)
- **API documentation** — OpenAPI via `trpc-to-openapi` + Scalar UI
- **Sample data** — One-click seed of 3 themed forms with responses (dashboard)

### Bonus features implemented

- Form preview before publishing (`/f/{slug}?preview=true`)
- Custom form slugs
- QR code sharing (PNG download)
- Public Explore page
- CSV export
- Charts / analytics dashboard
- Archive forms
- Multi-page (step-by-step) respondent experience
- File uploads with signed Cloudinary payloads
- Auto-save in form builder
- Simulated / Razorpay payment checkout flow

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Monorepo | [Turborepo](https://turbo.build/) + pnpm workspaces |
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Express 5 (separate app) |
| API | [tRPC](https://trpc.io/) v11 + REST/OpenAPI bridge |
| Validation | [Zod](https://zod.dev/) |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) |
| API docs | [Scalar](https://scalar.com/) (`@scalar/express-api-reference`) |
| Rich text | TipTap |
| Email | Resend |
| File storage | Cloudinary |
| Payments | Razorpay (optional) |

---

## Monorepo structure

```
HexForm/
├── apps/
│   ├── api/          # Express server — tRPC, OpenAPI, Scalar docs
│   └── web/          # Next.js frontend — marketing, dashboard, public forms
├── packages/
│   ├── database/     # Drizzle schema, migrations, DB client
│   ├── trpc/         # Shared tRPC routers, Zod models, context
│   ├── services/     # Auth, email, Cloudinary, user service
│   ├── logger/       # Shared logging
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.yml
├── ecosystem.config.js   # PM2 config for production
└── turbo.json
```

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9.0.0 --activate`)
- **Docker** (for local PostgreSQL) or an existing Postgres instance

---

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd HexForm
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Default connection: `postgresql://postgres:postgres@localhost:5432/dev`

### 3. Environment variables

Create a **root** `.env` file (used by `dotenv-cli` for Turbo tasks). Minimum required variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev

# Auth
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# API server
NODE_ENV=development
PORT=8600
BASE_URL=http://localhost:8600
ALLOWED_ORIGIN=http://localhost:5600

# Frontend → API (production builds)
NEXT_PUBLIC_API_URL=http://localhost:8600/trpc

# App URLs (emails, redirects)
FRONTEND_URL=http://localhost:5600

# Email (optional — skipped gracefully if missing)
RESEND_API_KEY=
RESEND_FROM=HexForm <onboarding@yourdomain.com>

# File uploads (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments (optional — required only for live Razorpay checkout)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 4. Run migrations

```bash
pnpm db:migrate
```

### 5. Start development

```bash
pnpm dev
```

| App | URL |
|-----|-----|
| **Frontend** | [http://localhost:5600](http://localhost:5600) |
| **API health** | [http://localhost:8600/health](http://localhost:8600/health) |
| **tRPC** | [http://localhost:8600/trpc](http://localhost:8600/trpc) |
| **Scalar API docs** | [http://localhost:8600/docs](http://localhost:8600/docs) |
| **Drizzle Studio** | `pnpm --filter @repo/database dev` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development (Turbo) |
| `pnpm build` | Production build for all packages/apps |
| `pnpm lint` | Lint across the monorepo |
| `pnpm check-types` | Typecheck across the monorepo |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes |
| `pnpm db:migrate` | Apply migrations |

---

## API documentation

HexForm exposes type-safe **tRPC** procedures and auto-generated **OpenAPI** routes.

- **Scalar UI:** `/docs` on the API server
- **OpenAPI spec:** `/openapi.json`
- **tRPC batch endpoint:** `/trpc`
- **REST (OpenAPI) bridge:** `/api/*`

Main routers:

| Router | Purpose |
|--------|---------|
| `auth` | Signup, sign-in, verify email, password reset, session |
| `form` | CRUD, publish/unpublish, fields, public get/submit, analytics, seed |
| `product` | Pricing plans, checkout, subscription |
| `health` | Health check |

---

## Form visibility & access control

| Status | Explore listing | Direct link | Accepts responses |
|--------|-----------------|-------------|-------------------|
| **Published + Public** | Yes | Yes | Yes (if accepting) |
| **Published + Unlisted** | No | Yes | Yes (if accepting) |
| **Draft** | No | Preview only | No |
| **Archived** | No | No | No |

Invalid or unavailable slugs show a graceful error state on the public form page.

---

## Field types & validation

Supported field types: `TEXT`, `LONG_TEXT`, `EMAIL`, `NUMBER`, `SELECT` (single/multiple), `CHECKBOX`, `YES_NO`, `DATE`, `RATING`, `FILE_URL`.

Validation (per field, via Zod on API + client checks) includes:

- Required / optional
- Text min/max length
- Number min/max and digit rules
- Email format
- Select option constraints
- File type and size limits (50 MB; jpeg, png, pdf, mp4)

---

## Seeding sample data

After signing in locally or on the demo:

1. Go to **Dashboard**
2. Click **Seed sample forms**

This creates three published forms (2 public, 1 unlisted) with realistic sample responses and populates analytics charts — no manual SQL required.

---

## Production deployment

The repo includes `ecosystem.config.js` for [PM2](https://pm2.keymetrics.io/) to run:

- `hexform-frontend` — `pnpm --filter web start` (port `5600` by default)
- `hexform-backend` — `pnpm --filter @repo/api start` (port `8600` by default)

Typical production steps:

```bash
pnpm install
pnpm build
pnpm db:migrate
pm2 start ecosystem.config.js
```

Point your reverse proxy at the frontend and API ports. Set `NEXT_PUBLIC_API_URL` to your public tRPC URL (e.g. `https://api.yourdomain.com/trpc`) and `ALLOWED_ORIGIN` to your frontend origin.

---

## Security notes

- Creator routes use **authenticated** tRPC procedures with JWT cookies
- Public submit uses **rate limiting** (12 requests / minute / IP+slug)
- **Honeypot** field on submit rejects bots
- Passwords are salted and hashed server-side
- File uploads use **signed** Cloudinary parameters scoped per form field

---

## Hackathon compliance checklist

| Requirement | Status |
|-------------|--------|
| Turborepo monorepo | Yes |
| Separate frontend & backend apps | Yes |
| tRPC + Zod | Yes |
| Drizzle ORM | Yes |
| Scalar API docs | Yes |
| Creator authentication | Yes |
| Public / unlisted visibility | Yes |
| Public submit without login | Yes |
| Dynamic fields + validation | Yes |
| Landing + pricing pages | Yes |
| Deployed demo + README credentials | See [Live demo](#live-demo) |
| Sample seeded forms (≥3) | Yes (dashboard seed) |
| Rate limiting + spam protection | Yes |

---

## License

Private hackathon submission. All rights reserved by the author unless otherwise stated.

---

## Acknowledgements

- Starter: [piyushgarg-dev/trpc-monorepo](https://github.com/piyushgarg-dev/trpc-monorepo)
- UI components: [shadcn/ui](https://ui.shadcn.com/)
