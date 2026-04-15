# Shared Planz — Product Requirements Document

## Purpose
Shared Planz helps friend groups, couples and families stop debating and actually commit to plans.
Shared via iMessage link. Opens in iPhone Safari instantly. No app install. No signup friction.
Identity: name + emoji avatar + emoji password. Everything is real-time.

---

## Tech Stack (immutable)
- React 18 + Vite
- TypeScript strict mode — no `any` types
- Tailwind CSS v4 (via @tailwindcss/vite)
- @supabase/supabase-js
- React Router v6
- Framer Motion
- canvas-confetti
- react-hot-toast
- date-fns
- lucide-react (icons only — no other icon library)

---

## Data Models

### sessions
| col | type | notes |
|-----|------|-------|
| id | uuid pk | gen_random_uuid() |
| name | text | session display name |
| code | text unique | 6-char uppercase |
| created_at | timestamptz | default now() |

### participants
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| session_id | uuid fk→sessions | cascade delete |
| name | text | |
| emoji | text | avatar emoji |
| secret_emoji | text | identity password |
| joined_at | timestamptz | |
| UNIQUE | (session_id, name) | for upsert |

### plans
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| session_id | uuid fk→sessions | |
| added_by | text | participant name |
| added_by_emoji | text | participant avatar |
| title | text | |
| description | text nullable | |
| date_type | text | 'none'|'single'|'range'|'multi' |
| date_single | timestamptz nullable | |
| date_range_start | timestamptz nullable | |
| date_range_end | timestamptz nullable | |
| date_multi | text[] nullable | ISO date strings |
| created_at | timestamptz | |

### ratings
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| plan_id | uuid fk→plans | |
| participant_name | text | |
| score | int 1-5 | |
| UNIQUE | (plan_id, participant_name) | one per user |

### votes
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| session_id | uuid fk→sessions | |
| created_by | text | |
| question | text | |
| plan_ids | text[] | 2-3 plan IDs |
| is_active | boolean | |
| created_at | timestamptz | |

### vote_responses
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| vote_id | uuid fk→votes | |
| participant_name | text | |
| chosen_plan_id | uuid fk→plans | |
| UNIQUE | (vote_id, participant_name) | one vote per user |

### availability
| col | type | notes |
|-----|------|-------|
| id | uuid pk | |
| session_id | uuid fk→sessions | |
| participant_name | text | |
| participant_emoji | text | |
| free_dates | text[] | ISO date strings |
| updated_at | timestamptz | |
| UNIQUE | (session_id, participant_name) | |

---

## Feature List

### 1 — Identity System
- **New user (3 steps):** Name → Avatar emoji (4×5 grid, 20 emojis) → Secret emoji (2×5 grid, 10 emojis)
- Save to localStorage: sp_username, sp_emoji, sp_secret, sp_sessions[]
- Save to Supabase participants table
- **Returning (same device):** localStorage found → skip flow → "Welcome back [emoji] [name]! 👋" toast
- **Returning (new device):** name entered → Supabase lookup → if found: secret emoji challenge
  - Correct → restore identity + confetti + re-save localStorage
  - Wrong 3× → broadcast alert to all participants + offer "Join as new name"
- **Avatar emojis:** 🔥🎸🌸⚡🎯🍕🎬🌴🎉🦋🐻🎮🏄🎨🦄🌈🍦🎺🏆🌙
- **Secret emojis:** 🦊🐬🌵🎪🍉🔮🎲🦁🌋⭐

### 2 — Plans with Flexible Dates
- Date types: None 🤷 / Single day 📅 / Date range 📆 / Multiple days 🗓️
- All date fields optional — never crash on missing dates
- Date display: "Anytime 🤷" / "Sat Apr 12 · 7:00 PM" / "Apr 12–14" / "Apr 12, 14, 16"
- Added_by shows participant's emoji + name

### 3 — Rating System
- Stars 1–5, one per user per plan, updatable
- Bayesian average: `(v/(v+m))*R + (m/(v+m))*C` where m=3
- If v=0 → score=0 (not NaN)
- Final rank = 0.7×bayesian + 0.3×time_proximity (0–1 scale)
- time_proximity = 0 if no date, 0 if past, scales to 1 for dates within 30 days

### 4 — Sort Modes (segmented control)
1. Top Rated ⭐ (default — by rank score)
2. Soonest 📅 (nearest date first, no-date at bottom)
3. Most Voted 🗳️ (by rating count)
4. Newest ✨ (by created_at desc)
5. Not Rated 👀 (only unrated by current user)
- Rate nudge banner: "You haven't rated N plans yet 👀 — your vote matters!" → tapping → Not Rated mode

### 5 — Voting System
- "Start a Vote 🗳️" button in Plans tab
- Creator picks 2–3 plans + optional question → "Send Vote"
- Real-time interrupting modal for ALL participants (full-screen takeover)
- One tap to vote → live animated progress bars
- Dismiss only after voting OR 5-min timeout
- Vote-only shareable link: /vote/:voteId (2-step identity — name + avatar only)
- Votes archive in Decide tab

### 6 — Wheel Decide
- Two modes: Fair Spin 🎲 (equal) / Vibe Spin ✨ (weighted by rank score)
- Vibe weights: base=1.0 + rank_score×1.5, normalized
- Canvas-drawn, variable segment sizes in Vibe mode
- Realistic easing, bounce on land, winner modal + confetti in segment colour
- Active when 2+ plans exist

### 7 — Availability
- In People tab, collapsible
- Mini calendar — current + next month
- Tap days to toggle free/busy
- Multiple participants' dots stacked per day
- Days most people are free → green glow
- Saves to Supabase in real-time

### 8 — Share Flow
- "Invite Crew 🔗" button in header → bottom sheet
- Shows: session name, large code (copy), full URL (copy), native iMessage share
- Pre-filled message: "Join our planning session on Shared Planz! Tap the link or use code [CODE]: [URL]"

### 9 — Navigation
- Bottom tab bar 70px: Plans 📋 / Decide 🎯 / People 👥
- Session header: name + participant count badge + Share button

---

## Design System Tokens
```
Background:   #1A1025
Surface:      rgba(255,255,255,0.07) + blur(20px) + border rgba(255,255,255,0.10)
Primary:      #FF6B6B (coral)
Secondary:    #FFD93D (gold)
Tertiary:     #6BCB77 (mint)
Purple:       #A855F7
Text primary: #F9FAFB
Text muted:   #9CA3AF
Radius card:  16px
Radius btn:   12px
Radius sheet: 24px top
Tab height:   70px
Touch min:    44px
Input min:    16px font (prevents iOS zoom)
```

---

## Out of Scope (MVP)
- Apple Calendar / Google Calendar sync
- Push notifications
- Dice roll
- User accounts with email/password
- Admin roles
- Photo uploads
- Comments on plans
- Anything not listed above

---

## Done Definition Per Feature
- [ ] Identity: 3-step flow works on fresh device; returning device restores via secret; 3-fail broadcasts alert
- [ ] Plans: all 4 date types save + display correctly; no NaN/crash on missing dates
- [ ] Ratings: Bayesian score correct; live re-rank; star burst animation
- [ ] Sort modes: all 5 work; nudge banner shows; Not Rated filter correct
- [ ] Voting: vote creates + triggers interrupt on all devices; results live; vote-only link works
- [ ] Wheel: both modes spin; vibe segments proportional; winner confetti
- [ ] Availability: calendar renders; tapping days persists; dots show correctly
- [ ] Share: sheet opens; copy works; navigator.share fires on iOS
- [ ] Build: `npm run build` exits 0 with zero TypeScript errors
