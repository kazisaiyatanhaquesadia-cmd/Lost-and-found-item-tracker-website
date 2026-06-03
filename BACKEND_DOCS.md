# GigaGirls Reunite - Backend Documentation

**Developer:** Meftahul Jannat
**Role:** Backend Developer
**ID:** 0802410105101024
**Branch:** `feature/backend-database`

---

## Overview

This project uses **Supabase** as its complete backend (BaaS - Backend as a Service). There is no traditional backend server. Everything runs on Supabase cloud.

**Supabase Project:** `rreggyuaxxciyehhqnne`
**Dashboard URL:** https://supabase.com/dashboard/project/rreggyuaxxciyehhqnne

---

## Database Schema (7 Tables)

All tables are in `public` schema. Created via `supabase_setup.sql`.

### 1. `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | References auth.users |
| full_name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| avatar_url | TEXT | |
| is_admin | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 2. `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| name | TEXT | UNIQUE |
| description | TEXT | |
| icon | TEXT | Lucide icon name |
| created_at | TIMESTAMPTZ | |

10 default categories seeded: Electronics, Keys & Wallet, Clothing, Documents, Jewelry, Bags, Pets, Books, Sports, Other.

### 3. `items` (Core Table)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | References auth.users |
| type | TEXT | 'lost' or 'found' |
| title | TEXT | NOT NULL |
| description | TEXT | NOT NULL |
| category_id | UUID | References categories |
| location | TEXT | |
| date_lost_found | DATE | |
| image_urls | TEXT[] | Array of URLs |
| contact_email | TEXT | |
| contact_phone | TEXT | |
| status | TEXT | active, pending_claim, claimed, returned, inactive |
| tags | TEXT[] | |
| reward_offered | DECIMAL | |
| security_question | TEXT | |
| security_answer | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4. `item_likes`
- item_id (FK) + user_id (FK) with UNIQUE constraint

### 5. `item_comments`
- item_id (FK) + user_id (FK) + content

### 6. `claims`
- item_id (FK) + claimant_id (FK) with status: pending, approved, rejected, verified

### 7. `reports`
- item_id (FK) + reporter_id (FK) with status: pending, reviewed, resolved

---

## Row Level Security (RLS)

All tables have RLS enabled with policies:

| Table | Policy |
|-------|--------|
| profiles | Anyone can SELECT, owner can UPDATE/INSERT |
| categories | Anyone can SELECT |
| items | Anyone can SELECT active, owner CRUD |
| item_likes | Anyone SELECT, owner INSERT/DELETE |
| item_comments | Anyone SELECT, owner CRUD |
| claims | Claimant/item-owner/admin SELECT, claimant INSERT, item-owner/admin UPDATE |
| reports | Admin SELECT/UPDATE, anyone INSERT |

---

## Triggers & Functions

1. **handle_new_user()** — Auto-creates profile when user signs up
2. **update_updated_at_column()** — Auto-updates `updated_at` on changes
   - Applied to: profiles, items, item_comments, claims

---

## Storage

**Bucket:** `item-images` (public)
- Anyone can view images
- Authenticated users can upload
- Users can only update/delete their own images

---

## Supabase Client Configuration

**File:** `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rreggyuaxxciyehhqnne.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## Database Types

**File:** `src/integrations/supabase/types.ts`
Contains TypeScript type definitions for all database tables, auto-generated from Supabase schema.

---

## Files Created/Modified (Backend)

| # | File | Description |
|---|------|-------------|
| 1 | `supabase_setup.sql` | Complete database schema, RLS, triggers, storage, seed data |
| 2 | `supabase/migrations/` (8 files) | SQL migration history |
| 3 | `supabase/create_tables.sql` | Table creation scripts |
| 4 | `src/integrations/supabase/client.ts` | Supabase client connection config |
| 5 | `src/integrations/supabase/types.ts` | TypeScript database types |
| 6 | `.env` | Supabase URL and anon key |
| 7 | `src/.env` | Same env vars for Vite build |

---

## How to Apply Changes

If database changes are needed:
1. Write SQL in `supabase_setup.sql`
2. Run it in Supabase Dashboard → SQL Editor
3. Update `src/integrations/supabase/types.ts` if schema changes
4. Commit to `feature/backend-database` branch

---

## Demo Credentials

| Email | Password | Status |
|-------|----------|--------|
| sadia@demo.com | Pass@123 | Pre-confirmed |
| demo@test.com | Demo@123 | Auto-confirmed |

---

## Git Commands Reference

```bash
# Switch to backend branch
git checkout feature/backend-database

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "feat: database schema, RLS, triggers, storage setup"

# Push to remote
git push origin feature/backend-database
```
