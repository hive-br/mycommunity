# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm i` — install dependencies (use pnpm, lockfile is `pnpm-lock.yaml`)
- `pnpm dev` — run Next.js dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — Next.js/ESLint

No test runner is configured.

## Environment

App is configured via `NEXT_PUBLIC_*` env vars (see README.md). Key ones:
- `NEXT_PUBLIC_THEME` — selects a theme from `themes/` (bluesky / cannabis / forest / hacker / hivebr / nounish / windows95).
- `NEXT_PUBLIC_HIVE_COMMUNITY_TAG` / `NEXT_PUBLIC_HIVE_SEARCH_TAG` — Hive community identifier (e.g. `hive-173115`).
- `NEXT_PUBLIC_THREAD_AUTHOR` / `NEXT_PUBLIC_THREAD_PERMLINK` — the root Hive post whose replies form the "snaps" short-form feed.
- `NEXT_PUBLIC_HIVE_USER` + `HIVE_POSTING_KEY` — dummy Hive account used server-side to sign image uploads.
- `NEXT_PUBLIC_SITE_TYPE=business` — enables the store section; empty hides it.

## Architecture

This is a Next.js 14 App Router frontend for a Hive-blockchain community site. There is no custom backend — data comes from Hive nodes (via `@hiveio/dhive`) and optionally Supabase.

**Routing** is driven almost entirely by a single catch-all route `app/[...slug]/page.tsx` which dispatches client-side based on slug shape:
- `@username` → `ProfilePage`
- `@username/wallet` → `MainWallet`
- `@username/notifications` → `NotificationsComp`
- `@username/permlink` (or 3-segment variant) → `PostPage`

The homepage (`app/page.tsx`) renders the community feed + "Conversation" (snaps) UI. Other top-level routes: `app/blog`, `app/compose`, `app/settings`.

**Providers** (`app/providers.tsx`, wrapped in `app/layout.tsx`):
- `ThemeProvider` (`app/themeProvider.tsx`) picks a Chakra theme from `themes/` based on `NEXT_PUBLIC_THEME`.
- `ChakraProvider` supplies design tokens (`background`, `text`, etc.) consumed throughout components.
- `AiohaProvider` wraps `@aioha/aioha` with Keychain, Ledger, PeakVault, HiveAuth adapters for Hive login/signing. User auth state flows through `contexts/UserContext.tsx`.

**Hive integration** (`lib/hive/`):
- `hiveclient.tsx` — shared dhive client.
- `client-functions.ts` / `server-functions.ts` — read/write helpers split by environment. Server-functions use `HIVE_POSTING_KEY` to sign uploads; client-functions use the logged-in user's keychain via Aioha.
- `hivekeychain.tsx` — direct keychain-sdk fallbacks.

**Data hooks** (`hooks/`): `usePosts`, `useSnaps`, `useComments`, `useHiveAccount` encapsulate fetching from Hive. "Snaps" are short-form posts modeled as replies to the configured thread root (`THREAD_AUTHOR`/`THREAD_PERMLINK`).

**Components** are grouped by feature: `homepage/`, `blog/`, `profile/`, `wallet/`, `notifications/`, `layout/`. Content rendering uses `@hiveio/content-renderer` + `react-markdown` + `rehype-raw` with DOMPurify sanitization (see `lib/utils/MarkdownRenderer.ts`, `TransforContent.ts`).

**Themes** (`themes/*.ts`) are Chakra `extendTheme` objects exported through `themes/index.ts`; adding a theme means creating a file and registering it there + in `themeProvider`.

## Conventions

- Path alias `@/*` → repo root (see `tsconfig.json`).
- Most components are `'use client'` — this app is almost entirely client-rendered because it hits Hive nodes directly from the browser and uses wallet extensions.
- Use Chakra's semantic tokens (`bg="background"`, `color="text"`, etc.) rather than hardcoding colors, so themes swap cleanly.
