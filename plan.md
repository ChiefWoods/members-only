# Members Only Implementation Plan

## Goals

- Build the Odin Members Only project requirements with a modern full-stack stack: React Router framework mode, React, Prisma, Better Auth, Vitest, and shadcn UI.
- Keep UI intentionally simple and functional while using shadcn components consistently.
- Implement authentication, membership/admin authorization, message CRUD, and conditional visibility exactly as required by the project brief.

Reference: [The Odin Project - Members Only](https://www.theodinproject.com/lessons/node-path-nodejs-members-only)

## Current Baseline

- Existing project is a minimal TypeScript/Bun scaffold with only [`package.json`](/Users/chiiyuen/the-odin-project/nodejs/members-only/package.json), [`index.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/index.ts), and TS config.
- No app router, DB schema, auth setup, tests, or UI component system are present yet.

## Implementation Steps

### 1) Bootstrap app foundation

- Replace current starter with React Router framework-mode project structure and scripts in [`package.json`](/Users/chiiyuen/the-odin-project/nodejs/members-only/package.json).
- Use React Router file-based routing (no central route map file), with route modules directly under `app/routes`.
- Add core app files and routing shell:
  - [`app/root.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/root.tsx)
  - [`app/routes/_index.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/_index.tsx) as home route
  - route modules like [`app/routes/sign-up.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/sign-up.tsx), [`app/routes/login.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/login.tsx), and [`app/routes/messages.new.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/messages.new.tsx)
- Add env and runtime config files (`.env.example`, React Router config, Vite config, TS paths).

### 2) Add Prisma data model + migrations

- Initialize Prisma and define schema in [`prisma/schema.prisma`](/Users/chiiyuen/the-odin-project/nodejs/members-only/prisma/schema.prisma).
- Create models aligned with assignment:
  - `User`: name, email/username, hashed auth fields handled by Better Auth, `isMember`, `isAdmin`.
  - `Message`: title, body, createdAt, author relation.
- Generate client and create first migration; add seed script for optional admin bootstrap in [`prisma/seed.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/prisma/seed.ts).

### 3) Integrate Better Auth

- Configure Better Auth server in [`app/lib/auth.server.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib/auth.server.ts) using Prisma adapter.
- Add auth endpoint route (catch-all) for framework mode in [`app/routes/api.auth.$.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/api.auth.$.ts).
- Add client helper in [`app/lib/auth.client.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib/auth.client.ts).
- Configure required env vars (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, DB URL) in [`.env.example`](/Users/chiiyuen/the-odin-project/nodejs/members-only/.env.example).
- Run Better Auth migrations/generation flow after config.

### 4) Build auth + authorization flows

- Implement pages/routes with loaders/actions and server-side guards:
  - Sign up: [`app/routes/sign-up.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/sign-up.tsx)
  - Login: [`app/routes/login.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/login.tsx)
  - Join club (secret passcode updates `isMember`): [`app/routes/join-club.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/join-club.tsx)
  - Admin grant path (secret passcode or signup checkbox) updates `isAdmin`: [`app/routes/become-admin.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/become-admin.tsx) or handled in sign-up action
  - Admin passcode management page/section (admins can rotate member/admin passcodes): [`app/routes/admin.passcodes.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/admin.passcodes.tsx)
  - New message (authenticated only): [`app/routes/messages.new.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/messages.new.tsx)
- Add shared auth/session helpers:
  - [`app/lib/session.server.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib/session.server.ts)
  - [`app/lib/guards.server.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib/guards.server.ts)
- Enforce sign-up form validation/sanitization including confirm-password parity before creating users.

### 4.1) Plan Zod-based form validation (no implementation yet)

- Add `zod` schemas per route form (sign-up, login, join-club, become-admin, new-message, admin-passcodes) in a shared module such as [`app/lib/validation.server.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib/validation.server.ts).
- Parse and validate `FormData` in each action through Zod (`safeParse`) before auth/DB calls.
- Return a consistent action error shape from validation:
  - `fieldErrors` for per-input messages
  - `formError` for global errors
- Reuse inferred TS types from schemas to keep action data strongly typed and reduce duplicated validation logic.
- Keep existing user-facing copy (for explicit missing-account login error, password mismatch, etc.) while centralizing rule definitions in Zod schemas.
- Add/adjust Vitest coverage for schema validation edge cases (missing fields, invalid email, short password, confirm-password mismatch, empty passcodes).

### 5) Implement home feed + role-based visibility

- In home route loader/component [`app/routes/_index.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/_index.tsx):
  - Show all message titles and bodies publicly.
  - Show author + date only when viewer is a member/admin.
  - Show delete action only when viewer is admin.
- Add admin-only delete action route in [`app/routes/messages.$id.delete.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/routes/messages.$id.delete.tsx).

### 6) Add shadcn with simple UI system

- Initialize shadcn config and global styles, then add only required components (e.g. Button, Card, Input, Label, Textarea, Alert).
- Keep layout minimal in [`app/root.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/root.tsx) and shared wrappers/components in:
  - [`app/components/layout.tsx`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/components/layout.tsx)
  - [`app/components/ui/*`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/components/ui)
- Ensure forms use accessible labels, validation messaging, and semantic color tokens.

### 6.1) Apply provided light/dark theme tokens

- Configure global CSS theme variables (in the app's main stylesheet used by shadcn tokens) with the following palette.
- Light mode tokens:
  - `--text: oklch(11.75% 0.004 325.83);`
  - `--background: oklch(96.92% 0.003 325.60);`
  - `--primary: oklch(58.66% 0.046 318.35);`
  - `--secondary: oklch(76.65% 0.022 337.83);`
  - `--accent: oklch(69.94% 0.026 344.73);`
- Dark mode tokens:
  - `--text: oklch(98.32% 0.002 325.59);`
  - `--background: oklch(14.33% 0.006 325.86);`
  - `--primary: oklch(57.26% 0.045 319.46);`
  - `--secondary: oklch(40.06% 0.024 339.51);`
  - `--accent: oklch(47.20% 0.029 345.30);`
- Map these to shadcn semantic tokens so UI components inherit them consistently in both modes.

### 7) Add Vitest coverage for critical behavior

- Configure Vitest in [`vitest.config.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/vitest.config.ts) and test setup file.
- Add tests for:
  - Membership visibility logic (author/date hidden or shown).
  - Guard functions (`requireUser`, member/admin checks).
  - Message create/delete permissions.
- Place tests under [`app/lib/*.test.ts`](/Users/chiiyuen/the-odin-project/nodejs/members-only/app/lib) and/or route-level tests.

### 8) Verification + developer docs

- Add scripts for dev, build, test, prisma migrate/seed in [`package.json`](/Users/chiiyuen/the-odin-project/nodejs/members-only/package.json).
- Document setup and runbook in [`README.md`](/Users/chiiyuen/the-odin-project/nodejs/members-only/README.md): env vars, DB setup, auth setup, passcodes, test commands.
- Validate full flow manually: signup -> login -> join club -> post message -> admin delete.
## Odin Requirements Coverage (1-10)

- **1. Data models**: Prisma `User` and `Message` models include full name, username/email, membership/admin status, title/body/timestamp, and message->author relation.
- **2. PostgreSQL + skeleton**: Configure Prisma with PostgreSQL and scaffold full React Router framework app structure before feature work.
- **3. Sign-up + secure credentials**: Build sign-up route with validation/sanitization and confirm-password check; passwords managed securely through Better Auth.
- **4. Join club passcode**: Add protected route/action to upgrade logged-in users to member status via secret code.
- **5. Login with auth framework**: Implement login flow and persistent sessions with Better Auth route handlers.
- **6. New message for logged-in users**: Show create-message nav/action only to authenticated users and enforce on server.
- **7. Home page visibility rules**: Show all messages publicly, but author/date only to members.
- **8. Admin delete ability**: Add `isAdmin` and admin-only delete action/button; include a practical way to mark admin users.
- **9. Final permissions matrix**: Verify anonymous, logged-in non-member, member, and admin experiences match assignment expectations.
- **10. Admin passcode management**: Provide an admin-only page or settings section to update the join-club/admin passcodes.

## Hierarchy and Permissions

- **Role hierarchy**: `anonymous` -> `authenticated` -> `member` -> `admin`.
- **Anonymous**:
  - Can view message list content (title/body) only.
  - Cannot create messages, join club, access admin routes, or see author/date metadata.
- **Authenticated (non-member)**:
  - Can create new messages.
  - Can attempt join-club flow via member passcode.
  - Cannot view author/date metadata until upgraded to member.
- **Member**:
  - Inherits authenticated permissions.
  - Can view message author and date metadata on home feed.
  - Cannot delete messages or manage passcodes unless also admin.
- **Admin**:
  - Inherits member permissions.
  - Can delete any message.
  - Can access admin passcode management and update member/admin passcodes.
- **Server-side enforcement policy**:
  - All sensitive operations enforced in route `loader`/`action` and shared guard helpers; UI visibility is secondary.
  - Delete message and passcode update actions require `requireAdmin`.
  - Metadata visibility computed server-side from session role flags (`isMember`/`isAdmin`).

## Acceptance Criteria

- App runs as React Router full-stack framework app.
- Prisma schema + migration exist and persist users/messages.
- Better Auth handles session/auth routes successfully.
- Sign-up validates/sanitizes fields and enforces confirm-password match.
- Form actions are backed by shared Zod schemas with consistent `fieldErrors`/`formError` handling.
- Join-club passcode flow upgrades users to member role.
- Public users see messages without author/date.
- Members/admin see author/date.
- Logged-in users can create messages.
- Only admins can delete messages.
- Admin role can be assigned through one explicit project-supported flow.
- Admins can update passcodes from an admin-only page/section.
- Vitest test suite covers core authz logic and passes.
- UI uses shadcn components and remains intentionally simple.
- Light/dark mode uses the provided OKLCH theme palette mapped to app/shadcn color tokens.
