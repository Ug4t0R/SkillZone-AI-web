---
description: SkillZone AI Web project rules & conventions
---

# SkillZone AI Web — Project Rules

## Stack
- **React 19** + **TypeScript** + **Vite** (port 1336)
- **Tailwind CSS v4** (not v3 — uses `@tailwindcss/postcss`)
- **Supabase** for DB + Auth + Realtime
- **Google Gemini** (`@google/genai`) for AI chatbot "Skiller"
- **Lucide React** for icons

## Communication & Workflow
- **Komunikuj česky**, kód a komentáře v kódu anglicky.
- **Lokální práce** — Nepushuj na GitHub, dokud uživatel neřekne. Pracujeme lokálně.
- Dev server běží na portu **1336**.
- **Deploy**: Cloud Run přes GitHub Actions (`deploy.yml`).

## Language & Translations
- **Primary language: Czech (cs)**. All hardcoded text and data defaults are in Czech.
- Translations live in `translations/<lang>.ts` (cs, en, sk, de, ru, ua, pl, vi).
- All UI strings use the `t()` function from `useAppContext()`.
- When adding new UI text, add the Czech key first, then translations can be auto-generated later.
- Do NOT write English into components as default text — always use Czech.
- Skiller (AI chatbot) phrases are Czech-first in `SkillerAvatar.tsx`.

## Architecture
- **Single-page app**: `App.tsx` manages all routing via `AppView` type + `renderView()` switch.
- **No React Router**: URL routing is manual via `services/routeConfig.ts` + `pushRoute()`.
- **DevMenu**: Admin panel opened via hidden trigger. Tabs defined in `DevMenu.tsx`:
  - `TabId` union type, `TAB_GROUPS` config array, `renderTabContent()` switch.
  - Each tab is a separate component in `components/devmenu/`.
  - Tabs use `DevMenuTabProps` interface (`addLog` prop).
- **Lazy loading**: Almost all components are `React.lazy()` imported.

## Supabase / Data Layer
- All tables prefixed with `web_` (e.g. `web_history`, `web_events`).
- Table names registered in `services/webDataService.ts` → `TABLES` object.
- Generic CRUD: `fetchAll`, `upsertRow`, `deleteRow` from `webDataService.ts`.
- Key-value settings in `web_settings` table via `getSetting`/`setSetting`.
- Data storage utils are in `utils/storage/` (chat, customData, profiles, etc.).

## Component Conventions
- Components are in `components/` root or `components/<feature>/` subdirs.
- DevMenu tabs: `components/devmenu/<Name>Tab.tsx`, exported from `components/devmenu/index.ts`.
- Use `font-orbitron` for headings/titles (the brand font).
- Red accent color: `sz-red` (`#e31e24`).
- Dark mode is the primary mode; light mode supported via `dark:` prefixes.

## Skiller Avatar
- `SkillerAvatar.tsx` = behavior/logic (walking, bubbles, shoot-down).
- `skilleravatar/SkillerCharacter.tsx` = SVG pixel-art rendering.
- Has multiple variants (default, cyberpunk, ghost, arcade, ninja, mage).
- Do NOT refactor the character rendering without checking all variants still work.

## Testing
- Vitest for unit tests (`tests/` directory).
- Run: `npm test` or `npx vitest run`.
- TypeScript check: `npx tsc --noEmit`.

## Important Notes
- Admin email: `tomas@skillzone.cz` (hardcoded in `App.tsx`).
- Supabase prod URL is hardcoded in `supabaseClient.ts` as default.
- The `sections` system (via `SectionsTab`) toggles which homepage sections are visible.
- LiveFeed bar is at the very bottom of the viewport (fixed position, `h-8` = 32px).

