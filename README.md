# John Mitchell Preserve HOA Website

A membership website for the John Mitchell Preserve Homeowners Association: public pages (Home, Calendar, About, Contact), a members-only area (Directory, Community Wall, Documents, Survey, Dues), and an Admin area for managing content, users/roles, documents, calendar events, and committees.

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS**
- **Prisma** + **SQLite** (`prisma/dev.db`) for the database
- **Auth.js (NextAuth v5)** with email/password login
- **Tiptap** rich text editor for the admin content editor
- File uploads saved to `public/uploads/`
- **Nodemailer** for outgoing email (falls back to console logging if not configured)

## Getting started

```bash
npm install
npm run seed   # creates the first Admin login + starter content (only needs to run once)
npm run dev
```

Open http://localhost:3000. The first run of `npm run seed` writes admin login credentials to `SEED_CREDENTIALS.txt` in this folder — **log in, then change that password** (create yourself a new Admin account with a real password and remove the old one, or update it directly). Delete `SEED_CREDENTIALS.txt` once you've done that.

## Roles

- **Admin** — full access: assigns roles, edits Home/About/FAQ/Sponsors content and photos, manages all documents.
- **Membership Coordinator** — approves/rejects new registrations, removes members.
- **Board Member** — uploads to the Board documents folder, manages the calendar.
- **Architecture Committee / Social Committee** — upload to their own committee's documents folder, manage the calendar.
- **Member** — approved resident: directory, community wall, survey, documents (read), join-a-committee requests.

New registrations start as **Member / Pending** and need an Admin or Membership Coordinator to approve them in Admin → Members & Roles before they can log in.

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path (default is fine for a single small server) |
| `AUTH_SECRET` | **Change this before deploying** — `npx auth secret` generates one |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outgoing email for registration notices and the Contact Us form. Leave blank to just log messages to the console during local testing. |
| `BOARD_EMAIL` / `ARCHITECTURE_EMAIL` / `SOCIAL_EMAIL` | Where Contact Us messages are sent |
| `VENMO_HANDLE` / `DUES_PO_BOX` | Shown on the Pay Association Fees page |

## What this site does **not** do

- It does not process real payments. The "Pay Association Fees" page just displays your Venmo handle and mailing address as static text, per the original request.
- It does not send real email until you fill in `SMTP_*`. A Gmail account can be used with an **App Password** (Google Account → Security → 2-Step Verification → App passwords).

## Deploying it for real (www.JMPHOA.org)

This app needs a Node.js host, not a static file host. A straightforward, low-cost path:

1. **Register the domain** (e.g. at Namecheap, Google Domains successor, or your registrar of choice) — this has to be done by you, since it requires payment and an account.
2. **Push this project to a GitHub repository.**
3. **Deploy to [Vercel](https://vercel.com)** (has a free tier suitable for a site this size): import the GitHub repo, it auto-detects Next.js.
4. **Swap SQLite for a hosted database** before deploying — Vercel's filesystem is not persistent between deploys. Easiest options: [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres) (both have free tiers). Update `DATABASE_URL` and change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, then run `npx prisma migrate deploy`.
5. **Swap local file uploads for cloud storage** — `public/uploads` also won't persist on Vercel. [Vercel Blob](https://vercel.com/storage/blob) is the simplest drop-in; ask for help wiring this up when you're ready to deploy, since it needs its own account/API token.
6. In Vercel's project settings, set the same environment variables from `.env` (with real values, and a freshly generated `AUTH_SECRET`).
7. Point the domain's DNS at Vercel (Vercel's dashboard gives you the exact records once the domain is added there).

Ask your developer/assistant to help with steps 4–7 when you're ready — they involve creating additional accounts you'll need to own directly.
