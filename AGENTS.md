# Inventory App Instructions

## Project Snapshot
- Next.js 15 App Router app in TypeScript with React 18.
- Supabase handles auth and data access.
- Tailwind CSS, MUI, Radix UI, Lucide, and `motion` are all in use.

## Useful Commands
- `npm run dev` starts the local app.
- `npm run build` checks the production build.
- `npm start` runs the built app.
- `npm run lint` runs the configured Next.js lint command.
- No dedicated test runner is configured in this repo.

## Architecture And Boundaries
- Treat `src/app/layout.tsx` as the main auth-aware shell; it decides whether to render the signed-in or signed-out navigation.
- Keep route-level logic inside `src/app/<route>/page.tsx` and feature folders under `src/app/`.
- Put shared UI primitives in `src/components/ui/` and feature-specific UI in the corresponding feature folder.
- Keep Supabase browser/server concerns separated: browser client code lives in `src/app/utils/supabase/client.ts`, server code in `src/app/utils/supabase/server.ts`, and middleware in `middleware.ts` plus `src/app/utils/supabase/middleware.ts`.
- Keep SQL/data helper functions in `src/app/utils/sql/` and dashboard-specific helpers in `src/app/utils/dashboardsql/`.

## Conventions To Preserve
- Use the `@/*` path alias from `tsconfig.json` for imports rooted at `src/`.
- Most pages are async server components unless a file explicitly starts with `"use client"`.
- Client components commonly call Supabase from effects or event handlers; server actions are marked with `"use server"`.
- Preserve the existing image configuration in `next.config.ts` when working with Supabase-hosted images.
- Keep styles aligned with the existing Tailwind plus MUI mix instead of introducing a new styling system.

## High-Value References
- App shell and auth gating: [src/app/layout.tsx](src/app/layout.tsx)
- Route protection: [middleware.ts](middleware.ts)
- Supabase server client: [src/app/utils/supabase/server.ts](src/app/utils/supabase/server.ts)
- Supabase browser client: [src/app/utils/supabase/client.ts](src/app/utils/supabase/client.ts)
- Global styles: [src/app/globals.css](src/app/globals.css)
- App entry page: [src/app/page.tsx](src/app/page.tsx)
- Setup notes: [README.md](README.md)

## Editing Guidance
- Keep changes narrow and prefer the smallest file set that resolves the request.
- Do not rewrite unrelated styling or component structure when touching a feature file.
- Verify changes with `npm run build` or `npm run lint` when the change affects behavior or types.
