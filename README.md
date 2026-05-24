# HexForm // Tactical Form Ops SaaS

HexForm is a highly stylized, production-style dynamic form builder SaaS themed around a **modern Valorant combat interface**. Built on a high-performance Monorepo stack, it allows creators to draft tactical forms, configure rich validation protocols, toggle public/unlisted visibilities, and acquire robust response analytics.

---

## 🎮 Visual Theme: Valorant Game UI
HexForm adopts a premium military-grade gaming HUD aesthetic:
- **Core Palette**: Deep charcoal-black (`#0f1923`), tactical signal red (`#ff4655`), ice-cyan (`#00f0ff`), and monospaced indicators.
- **Visual Design**: Chamfered angular edges, diagonal grid backing patterns, glowing text active input shadows, and crosshair overlays.
- **Sync Signals**: A neon green/amber top HUD broadcast indicator displaying `[SYSTEM STATUS: ONLINE / SYNCED]` reassuring users that every keypress auto-saves seamlessly.

---

## 🚀 Key Features

1. **Auto-Saving Command Center**: Text inputs, titles, descriptions, checkboxes, and rating limits save automatically in the background using debounced typing triggers and focus-blur sync pipelines.
2. **Tactical Question Reordering**: Change order indexes on-the-fly using Up (`▲`) and Down (`▼`) arrow shifting buttons. Synced safely on the database layer avoiding unique constraints.
3. **Typeform-Style Respondent Flow**: Sleek single-sector slide animations with dynamic keyboard ENTER navigation, star combat ranks, checklist selectors, and receipt envelope logs at the end.
4. **Combat Intel Analytics**: Line graphs showing submission counts over time, monospace records of detailed captured submissions, and instant CSV spreadsheet extraction.
5. **One-Click Demo Seeder**: Instantly populate the creator deck with 3 premium pre-configured themed forms and rich historical captures.

---

## 🔑 Demo Credentials

Judges can instantly log in to review all dashboard components using these default credentials:
- **Email Address**: `judge@hexform.com`
- **Access Password**: `password123`

*(Alternatively, you can register a new custom account using the sign-up panel)*

---

## 📊 API Documentation & Scalar Specs
The backend routes are fully documentable under OpenAPI specification and served interactively by a Scalar HUD console:
- **Scalar Interface Link**: [http://localhost:3001/docs](http://localhost:3001/docs)
- **Raw OpenAPI JSON**: [http://localhost:3001/openapi.json](http://localhost:3001/openapi.json)

---

## 📁 Monorepo Workspace Directory
The repository runs in a Turborepo environment with split applications and shared packages:
- **`apps/web`**: Next.js App Router frontend dashboard and public respondent flows.
- **`apps/api`**: Express backend serving type-safe OpenAPI endpoints and trpc handlers.
- **`packages/database`**: Drizzle schema definitions and database connection models.
- **`packages/trpc`**: Client/Server safe type definitions and validation schemas.

---

## 🛠️ Local Setup Instructions

1. **Environment Setup**:
   Execute the link copy setup script to configure symlinks and copy default variables:
   ```bash
   ./setup.sh
   ```

2. **Acquire Dependencies**:
   Install monorepo package workspace dependencies:
   ```bash
   pnpm install
   ```

3. **Database Migration**:
   Generate and deploy local PostgreSQL schemas:
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

4. **Launch Development Command Deck**:
   Execute the turborepo concurrent servers (web served on `:3000` and API served on `:3001`):
   ```bash
   pnpm run dev
   ```

5. **Seed Demo Data**:
   Log in with `judge@hexform.com` / `password123` and click the **ONE-CLICK SEED DEMO DECK** button inside the System Health panel to instantly fill the registry!
