# Workers Committee & Employees App

A full-stack app for a workplace Workers Committee: dashboard, announcements,
member directory, complaint tracking, meetings with QR attendance, documents/
labour laws, finance/accounts module, and more — built entirely on free-tier
services so there's no cost to run at small-to-medium scale.

## Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────────────┐
│  React Frontend │  HTTP  │  FastAPI Backend  │  API   │  Supabase (free)   │
│  (Vite + CSS)   │───────▶│  (Python)         │───────▶│  Postgres + Auth   │
│  + Capacitor    │        │  business logic,  │        │  + Storage         │
│  → Android APK  │        │  PDF/Excel export, │        │                    │
└─────────────────┘        │  push notifications│        └────────────────────┘
                            └──────────────────┘
```

- **Frontend**: React 18 + Vite, plain CSS design system (mobile-first, works
  as a responsive web app AND wraps into an Android APK via Capacitor).
- **Backend**: FastAPI (Python) — handles login flows, admin actions, PDF/Excel
  report generation, and push notification fan-out. Talks to Supabase using
  the service-role key for privileged actions, and the user's own token for
  normal reads/writes (so Postgres Row Level Security applies correctly).
- **Database & Auth & Storage**: Supabase free tier —
  Postgres database, built-in Auth (email/password + phone OTP), and Storage
  (documents, photos, receipts). Free tier limits: 500MB database, 1GB file
  storage, 50,000 monthly active users — comfortably enough for a workplace
  committee app.
- **Push notifications**: Firebase Cloud Messaging (completely free, unlimited).

## Repository layout
```
worker-committee-app/
├── database/
│   ├── schema.sql            # Run first in Supabase SQL Editor
│   └── storage_setup.sql     # Run after creating Storage buckets
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── core/              # config, supabase client, auth dependency
│   │   └── routers/           # auth, members, announcements, complaints,
│   │                          # meetings, documents, finance, notifications
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard, Login, Complaints, Finance, ...
│   │   ├── components/        # BottomNav
│   │   ├── context/           # AuthContext (session + dark mode + role)
│   │   ├── services/          # supabase.js, api.js
│   │   ├── i18n/               # en.json, ta.json (Tamil + English)
│   │   └── styles/global.css   # design system (teal/amber palette)
│   ├── package.json
│   └── .env.example
└── docs/
    └── android-apk-guide.md    # Capacitor → APK → Play Store steps
```

## Step-by-step setup

### 1. Create the Supabase project (free)
1. Go to https://supabase.com → New project (free tier)
2. Once created, open **SQL Editor** → paste and run `database/schema.sql`
3. Go to **Storage** → create 5 buckets: `avatars` (public), `documents`,
   `receipts`, `complaint-files`, `salary-slips` (all private)
4. Back in **SQL Editor**, run `database/storage_setup.sql`
5. Enable **Phone Auth** (Authentication → Providers → Phone) if you want
   OTP login — Supabase's free tier uses a Twilio trial account, or you can
   connect your own Twilio/MSG91 account for production SMS volume
6. Copy your **Project URL**, **anon public key**, and **service_role key**
   from Project Settings → API — you'll need these next

### 2. Run the backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then fill in your Supabase keys
uvicorn app.main:app --reload --port 8000
```
Visit http://localhost:8000/docs for interactive Swagger API docs.

**Deploying the backend for free**: Render.com and Railway.app both offer
free tiers well-suited to a small FastAPI app (Render's free web service
sleeps after inactivity but wakes on request — fine for an internal tool).

### 3. Run the frontend
```bash
cd frontend
npm install
cp .env.example .env        # fill in Supabase URL/anon key + your backend URL
npm run dev                 # http://localhost:5173
```

**Deploying the frontend for free**: Vercel or Netlify free tiers are ideal
for a Vite/React app — connect your Git repo and it auto-deploys on push.

### 4. Create your first admin account
The first member must be added manually since no one is an admin yet:
1. In Supabase Dashboard → Authentication → Users → **Add user** (set an
   email + password)
2. In SQL Editor, run:
   ```sql
   insert into members (id, employee_id, full_name, email, role)
   values ('<paste the new user's UUID>', 'EMP001', 'Committee Admin',
           'admin@example.com', 'super_admin');
   ```
3. Log in through the app with that email/password mapped to Employee ID
   `EMP001` — you can now use the Admin Features (add members, publish
   announcements, manage complaints, etc.)

### 5. Build the Android APK
See `docs/android-apk-guide.md` for the full Capacitor walkthrough.

## Feature coverage

| Requested feature | Where it lives |
|---|---|
| Dashboard | `frontend/src/pages/Dashboard.jsx` |
| Announcements/Notifications | `routers/announcements.py`, `routers/notifications.py` |
| Members Directory | `routers/members.py`, `pages/Members.jsx` |
| Complaint Registration & Tracking | `routers/complaints.py`, `pages/Complaints.jsx` |
| Meeting Schedule + QR Attendance | `routers/meetings.py`, `pages/Meetings.jsx`, `pages/MeetingScan.jsx` |
| Documents & Circulars / Labour Laws | `routers/documents.py`, `pages/Documents.jsx` |
| Birthday & Anniversary Wishes | `members.py: /birthdays-today`, shown on Dashboard |
| Emergency Contacts | `emergency_contacts` table (add a simple list page, same pattern as Documents) |
| Settings (language, dark mode, profile) | `pages/Settings.jsx` |
| Admin: add/remove members, publish, manage meetings/docs/complaints | Admin-only endpoints in each router, gated by `require_admin` |
| Employee ID login + OTP login | `routers/auth.py`, `pages/Login.jsx` |
| Tamil & English | `frontend/src/i18n/` |
| Dark Mode | CSS variables in `global.css`, toggle in `AuthContext` |
| QR Code Attendance | `qrcode.react` (display) + `html5-qrcode` (scan) |
| Google Drive Backup | see note below |
| PDF Download / Search | Documents page search + native browser PDF viewing |
| Finance module (income/expense, receipts, reports, PDF/Excel export) | `routers/finance.py`, `pages/Finance.jsx` |

### Future Enhancements — scaffolded in the database, ready to build UI for
The schema already includes tables for these so you can add screens later
without any migration work:
- **Wage Settlement / PF / ESI / Gratuity Calculators** — these are pure
  frontend calculators (no DB needed); add a `Calculators.jsx` page with
  the statutory formulas (PF 12%, ESI 0.75%, Gratuity = last drawn salary ×
  15/26 × years of service, etc.) — happy to build this out next.
- **Leave Tracker** — `leave_records` table + a request/approve flow mirroring
  the Complaints module.
- **Salary Slip** — `salary_slips` table; admin uploads a PDF per employee
  per month to the `salary-slips` bucket, employee downloads their own.
- **Voting / Poll System** — `polls` + `poll_votes` tables; a simple page
  showing open polls with radio options and a live results bar chart
  (Recharts is already in `package.json`).

### Google Drive Backup note
Supabase Storage already gives you durable, versioned backups of documents/
photos/receipts on the free tier. If you specifically want a *copy* mirrored
to Google Drive (e.g. for offline committee records), the cleanest free path
is a scheduled script using the Google Drive API with a service account,
run as a free cron job (e.g. GitHub Actions on a schedule) that lists new
Storage objects and uploads them to a shared Drive folder. This is a good
next task once the core app is live — let me know if you'd like it built.

## Security notes
- Row Level Security (RLS) is enabled on every table — members can only see
  their own complaints/leave/salary slips; admins see everything; the
  directory, announcements, documents, and finance transactions are
  read-visible to all logged-in members for transparency, write-restricted
  to admins.
- The Supabase **service_role key** must stay on the backend only — never
  ship it in the frontend or APK.
- Passwords and OTPs are handled entirely by Supabase Auth (industry-standard
  hashing, session/JWT management) — the backend never stores raw passwords.
