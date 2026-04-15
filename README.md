# Shared Planz

Group decisions, made easy. Share a link, add options, rate them, and let the app pick — no more "I don't know, what do you want to do?"

## Features

- Create or join a session with a 6-character code
- Add plans with title, description, and optional date/time
- Rate plans 1–5 stars — one rating per person, always updatable
- Bayesian ranking + time proximity scoring
- Spin wheel and dice roll for the indecisive
- Real-time updates across all devices via Supabase
- Mobile-first, dark-mode, feels native on iPhone Safari

## Tech Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres + real-time)
- Framer Motion
- React Router v6

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd SharedPlanz
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Supabase schema

In your Supabase dashboard → SQL Editor, paste and run the contents of `schema.sql`.

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy

```bash
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or any static host
```

## Project Structure

```
src/
  components/   Shared UI components
  context/      React Context (session state)
  hooks/        Custom hooks (useSession, usePlans, etc.)
  lib/          Supabase client + utilities
  pages/        Route-level page components
  types/        TypeScript interfaces
```

## Sharing

Sessions are shareable via URL: `https://yourapp.com/session/ABC123`

Tap "Share Link" in the session header to copy to clipboard, then paste into iMessage.
