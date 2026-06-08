## Goal

Make every record you import through the Community Source Importer available to **anyone** who opens the app, not just your browser. Today the importer writes to `localStorage`, so each user sees only their own queue and approvals.

To share data across users, the app needs a real backend. I'll enable **Lovable Cloud** (managed Postgres + auth + storage) and move the community dataset there.

## What changes for the user

- Anyone visiting the app sees the same approved cards, enemies, units, tiles, tactics, sites, heroes, skills.
- Sign in (optional) only if you want to *contribute* (queue URLs, edit drafts, approve). Reading is public.
- A clear "Published Community Dataset" vs "My Drafts" split, so unreviewed junk doesn't pollute the public set.

## Architecture

```text
Browser (any visitor)            Lovable Cloud (Postgres + Auth)
─────────────────────            ──────────────────────────────
  /community  ──────read────►   community_records   (public, RLS: read-all)
                                  └─ kind, fields, source_url,
                                     attribution, text_approved,
                                     automation_approved,
                                     published, created_by
  /community  ─auth + write─►   community_queue     (contributor-only)
                                  └─ url, status, parsed_payload
  /library, /new-game, /game  ──read─► community_records WHERE published=true
```

Tables (all in `public` schema with explicit GRANTs):

1. `community_records` — the shared dataset. One row per draft/approved item.
   - Public `SELECT` (anon + authenticated) when `published = true`.
   - `INSERT`/`UPDATE` restricted to authenticated contributors.
2. `community_queue` — URLs queued for parsing, parse status, raw payload.
   - Read/write restricted to authenticated users.
3. `community_sources` — registered source URLs + attribution + license note.
4. `user_roles` (separate table, `app_role` enum: `contributor`, `curator`) — gates who can flip `published = true`. Uses `has_role()` security-definer to avoid RLS recursion.

`published` flag = true only when **both** `text_approved` and `automation_approved` are set AND a curator marks it published. Strict-mode New Game keeps using the same gating it already has, just sourced from Postgres now.

## App changes

- Enable Lovable Cloud (creates Supabase project + auth).
- Add `src/integrations/supabase/*` clients (browser, auth-middleware, admin).
- Replace `communityStore.tsx` LocalStorage layer with TanStack Query + `createServerFn` reads/writes against the new tables. Keep the existing types so `/community`, `/library`, `/validation`, `/new-game`, `/game` keep working.
- Add a tiny auth screen (`/auth`) with email + Google sign-in for contributors. Anonymous visitors still get full read access.
- Add a "Publish to community" action on each approved draft (curator-only).
- Show contributor + source attribution on every record in the Library.
- Migrate any data currently in your browser's localStorage by uploading it once on first sign-in (one-click "Import my local drafts to Cloud").

## Open questions before I build

1. **Who can contribute?** Options:
   a. Anyone who signs up (open wiki style).
   b. Anyone signed in can queue + draft, but only curators you designate can `publish` to the shared dataset (recommended).
   c. Only you — single-admin mode; everyone else read-only.
2. **Anonymous reads OK?** I'm assuming yes (anyone visiting the URL sees the shared dataset without logging in). Confirm.
3. **Sign-in methods**: email/password + Google (default), or email-only?

If you don't answer, I'll proceed with **(1b) curator-gated publish**, **anonymous reads on**, **email + Google sign-in**.

## Technical notes

- Server functions for writes (`requireSupabaseAuth`); public reads via a server fn using `supabaseAdmin` with explicit `WHERE published = true` column projection (no broad `TO anon` policy).
- All new public tables get `GRANT SELECT ... TO anon` only where a policy permits, plus `GRANT ALL ... TO service_role`.
- Roles stored in dedicated `user_roles` table with `has_role()` SECURITY DEFINER — never on profiles.
- Dataset export/import JSON in the importer stays, but now exports the *Cloud* dataset, not localStorage.
