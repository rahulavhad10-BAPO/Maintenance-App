# Builder Post-Possession Maintenance Management System

> **Google Antigravity + React + TypeScript + Supabase + Future n8n & WhatsApp V2 Integration**

A full-stack web application designed for real estate developers and property builders who provide free maintenance services to flat owners after possession handover.

---

## 🌟 Executive Overview (For Founders)

As a founder demonstrating this system to real estate builders, you can show the entire post-possession lifecycle:

1. **Flat Owner Complaint Intake:** A resident logs in, selects their linked flat, and registers an issue with defect photos and descriptions.
2. **Automated Warranty Coverage:** The system checks the flat's possession date and project maintenance period (e.g. 24 months) to calculate whether the issue is covered under warranty or requires review.
3. **Contractor Assignment:** A maintenance manager assigns an eligible vendor based on trade specialization (Plumbing, Electrical, Waterproofing).
4. **Site Inspection:** The contractor records technical findings and indicates whether a formal repair quotation is required.
5. **Configurable Quotation Approval Threshold:**
   - If quotation total is **below the threshold** (e.g., ₹3,400 ≤ ₹5,000 threshold), it is expedited as **Approved Under Threshold**.
   - If quotation total **strictly exceeds the threshold** (e.g., ₹7,800 > ₹5,000), it automatically triggers an executive sign-off queue for the Builder Admin.
   - Contractors **cannot approve their own quotations**, and rejections require a mandatory reason.
6. **Work Progress & Completion Evidence:** The contractor updates progress and uploads completion notes and evidence.
7. **Resident Sign-off or Dispute:** The flat owner verifies repairs, provides a 1–5 star rating and feedback to close the ticket, or reports the issue unresolved to reopen the job.
8. **Real-time KPI Dashboard & Reports:** Executive metrics, category breakdowns, contractor workload, and master CSV export.

---

## 🚀 Quick Start (Local Run in 1 Minute)

The application includes an **in-memory and localStorage persistent engine with sample data** matching the production SQL schema. You can run and demonstrate every single role immediately without waiting for Supabase credentials!

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

### 3. Interactive Persona Switcher (Top Right Bar)
You can test each stakeholder journey with one click:
- **Builder Admin:** Vikram Malhotra (`admin@apexhorizon.com`) — Executive dashboard, project policies, contractor assignment, and quotation approvals.
- **Resident (Flat Owner):** Rahul Verma (`rahul.resident@gmail.com`) — Linked flat A-402, 3-step complaint wizard, and completion sign-off.
- **Contractor:** Rajesh Kumar (`contractor@voltpro.com`) — Focused work queue, site visit logging, line-item quotation builder, and completion proof.
- **Helpdesk Receptionist:** Ananya Sharma (`receptionist@apexhorizon.com`) — Ticket registration on behalf of residents.
- **Super Admin:** Alex Mercer (`superadmin@antigravity.dev`) — Multi-tenant organization manager.

---

## 🗄️ Supabase Cloud Deployment Guide

When you are ready to connect a live Supabase project:

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Note your **Project URL** and **Anon Public Key** in `Project Settings -> API`.

### Step 2: Execute SQL Migrations
Open the **SQL Editor** in your Supabase dashboard and run the migrations in order:
1. `supabase/migrations/001_initial_schema.sql` (Creates all tables, constraints, foreign keys, and indexes).
2. `supabase/migrations/002_rls_and_security.sql` (Enables Row Level Security on every table).
3. `supabase/migrations/003_functions_and_triggers.sql` (Automated triggers for warranty end dates, complaint reference generation, and audit logging).
4. `supabase/migrations/004_seed_data.sql` (Sample projects, towers, flats, and complaints).

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Restart the development server (`npm run dev`). The status badge in the header will switch to **⚡ Supabase Connected**!

---

## 🧪 Automated Testing

Run the test suite:
```bash
npm test
```

Verified test suites:
- **1. Maintenance End Date & Possession Calculations:** Verifies 12/24-month duration addition and leap-year handovers.
- **2. Maintenance Coverage Rule Evaluation:** Tests active warranty, expired dates, excluded categories, and review flags.
- **3. Quotation Threshold & Approval Rules:** Validates `amount > threshold` alerts, `approved_under_threshold` guardrails, mandatory rejection reasons, and self-approval prevention.
- **4. Complete 12-Step Lifecycle Execution:** End-to-end integration test from complaint registration to closure.

---

## 📡 Version 2 Automation Specifications

The system is designed with clean architectural boundaries for Version 2:
- **n8n Specification:** See [`docs/N8N_INTEGRATION_SPEC.md`](./docs/N8N_INTEGRATION_SPEC.md) for event contracts (`complaint.created`, `quotation.submitted`, `quotation.decision`) and idempotent retry architecture.
- **WhatsApp Specification:** See [`docs/WHATSAPP_V2_SPEC.md`](./docs/WHATSAPP_V2_SPEC.md) for phone verification (`channel_identities`) and conversational session tracking (`channel_conversations`).

---

## 📋 Deliverables Summary

| Deliverable | Location | Status |
|---|---|---|
| Complete React + TypeScript Codebase | `src/` | ✓ Complete |
| SQL Migrations (Schema, RLS, Triggers) | `supabase/migrations/` | ✓ Complete |
| Seed Dataset with Realistic Scenarios | `supabase/migrations/004_seed_data.sql` | ✓ Complete |
| Admin, Contractor, Resident Portals | `src/components/` | ✓ Complete |
| Configurable Quotation Thresholds | `src/components/admin/QuotationApprovals.tsx` | ✓ Complete |
| Automated Test Suite | `src/__tests__/maintenance.test.ts` | ✓ 13/13 Passing |
| n8n & WhatsApp V2 Specifications | `docs/` | ✓ Documented |
