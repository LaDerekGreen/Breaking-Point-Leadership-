# Gap Reader

A web application built on the leadership model in **Breaking Point Leadership** (V28 manuscript). Two strictly separated products live in one codebase:

1. **The Organizational Gap Reader.** An organization runs it on records it already keeps. It shows each leader their own pattern privately, before that pattern costs anyone else.
2. **The Personal Gap Reader.** A private reflection tool for one leader: the Source Inquiry, the nine workbook exercises, a decision log, a weekly check-in and a ninety day plan.

**The first rule of the system: the two products never share data.** Nothing a person enters in the Personal Gap Reader can reach the Organizational Gap Reader. The separation is enforced by design, by schema, by database role and by test. See [Separation guarantees](#separation-guarantees).

Every hard rule from the build brief is listed with the code that enforces it in [docs/rules.md](docs/rules.md). The file structure and the two schemas are described in [docs/architecture.md](docs/architecture.md).

## Stack

* Next.js 15 (App Router, server actions, route handlers) and TypeScript
* PostgreSQL 14 or later with Prisma 6: **two Prisma schemas, two Postgres schemas, two database roles** (`org` / `gr_org` and `personal` / `gr_personal`). There are no foreign keys, views or joins across them. They can also run as two separate databases.
* Auth.js (next-auth v5): two separate instances. The org instance offers email magic links and optional OIDC single sign-on. The personal instance offers email magic links only.
* Tailwind CSS 4
* One provider-agnostic AI adapter (`lib/ai/adapter.ts`) with Anthropic API and OpenAI API implementations. The organization supplies its own key. Each personal user supplies their own key, which is encrypted under their passphrase and used only from their browser.
* Vitest for unit and integration tests

## Setup

### 1. Install

```sh
cd gap-reader
cp .env.example .env      # then fill it in (see below)
npm install               # also generates both Prisma clients
```

### 2. Create the two schemas and roles

Run once, as a Postgres superuser, against an empty database:

```sh
createdb gapreader
psql "postgresql://postgres@localhost:5432/gapreader" \
  -v org_password="'choose-one'" -v personal_password="'choose-another'" \
  -f db/setup.sql
```

This creates:

| Postgres schema | Role | Used by | Connection string |
| --- | --- | --- | --- |
| `org` | `gr_org` | Organizational Gap Reader | `ORG_DATABASE_URL` |
| `personal` | `gr_personal` | Personal Gap Reader | `PERSONAL_DATABASE_URL` |

Each role owns its own schema and is explicitly refused the other one. To use two separate databases instead, run the org half of `db/setup.sql` in one database and the personal half in the other, and point the two connection strings at them. The application does not care which.

### 3. Apply the migrations

```sh
npm run db:migrate
```

This applies `prisma/org/migrations` with the org role and `prisma/personal/migrations` with the personal role. The org migration also adds database CHECK constraints for the anonymity threshold (8 or higher), the correction window (90 days or longer) and the survey answer shape.

### 4. Seed sample data (optional)

```sh
npm run db:seed
```

The seed creates a fictional organization ("Harbor Point Distribution, sample") with people labeled by role only, and no real names. It publishes the Notice, runs two survey cycles, imports sample records through the same import path the console uses (including one complaint that trips the law-or-policy gate), and runs the analysis. Sign in as `lead@example.org` (program lead), `ops@example.org` (a leader with findings), `finance@example.org` (senior reviewer), `board@example.org` (board reviewer) or `analyst01@example.org` (respondent). In development the magic link is printed to the server log.

To start over: `./scripts/reset-dev-db.sh && npm run db:seed`. Restart the dev server after a reset, because Postgres type IDs change.

### 5. Run

```sh
npm run dev          # http://localhost:3000
npm run build && npm start
```

### Deploying

To deploy on Vercel with a managed Postgres (Neon or Supabase), follow [docs/deploy-vercel.md](docs/deploy-vercel.md). `vercel.json` and `scripts/vercel-build.sh` set the build: production builds apply both migrations first, and preview builds never touch the production database.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ORG_DATABASE_URL` | The `gr_org` role, `?schema=org`. Pooled on a hosted database. |
| `ORG_DIRECT_DATABASE_URL` | The same, unpooled, used for migrations. Locally, identical to `ORG_DATABASE_URL`. |
| `PERSONAL_DATABASE_URL` | The `gr_personal` role, `?schema=personal`. Pooled on a hosted database. |
| `PERSONAL_DIRECT_DATABASE_URL` | The same, unpooled, used for migrations. Locally, identical to `PERSONAL_DATABASE_URL`. |
| `DATABASE_ADMIN_URL` | Superuser connection, used only by `db/setup.sql`, the reset script and the integration tests. Never by the app. |
| `AUTH_SECRET` | Auth.js secret. Signs both auth instances' cookies, which have different names. |
| `APP_ENCRYPTION_KEY` | 32 random bytes, base64. Encrypts the organization's AI key at rest. Never used for personal data. |
| `APP_URL` | Public URL. `https://` turns on secure cookie names. |
| `SMTP_URL`, `EMAIL_FROM` | Magic link email. If `SMTP_URL` is empty in development, links go to the server log. In production it is required. |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_NAME` | Optional SSO for the Organizational Gap Reader only. |
| `BOOTSTRAP_PROGRAM_LEAD_EMAIL` | The first program lead. This address may sign in before the directory exists. |
| `IMPORT_API_TOKEN` | Bearer token for `POST /api/org/import/<kind>`. |

Only people in the org admin directory (or the bootstrap address) can sign in to the Organizational Gap Reader. Anyone can create a Personal Gap Reader account with a personal email.

## Running the tests

```sh
npm test                    # unit tests, no database needed
npm run test:integration    # needs Postgres; creates and drops a gapreader_test database
npm run test:all
```

The integration tests connect with `DATABASE_ADMIN_URL` (default `postgresql://postgres@localhost:5432/postgres`), create `gapreader_test`, create the same schemas and roles as `db/setup.sql`, and apply both migrations. Set `GR_ORG_PASSWORD` and `GR_PERSONAL_PASSWORD` if your roles use other passwords.

| Test | What it proves |
| --- | --- |
| `tests/unit/anonymity.test.ts` | No group under 8 is ever computed or shown; small groups merge into the next larger group; the threshold can be raised, never lowered; gaps are ordered largest first, with above-high and below-low first of all. |
| `tests/unit/escalation.test.ts` | The five steps run in order; none can be skipped; the window is 90 days or longer and is given in full; the system can only propose; contested findings wait for a person to read the contest; visibility widens one step at a time. |
| `tests/unit/gate.test.ts` | The exclusion gate fires on safety, discrimination, harassment, ethics and retaliation signals; returns only a boolean; redacts names before the model check; the codebase has no investigation, case or routing code. |
| `tests/unit/importSchema.test.ts` | Imports with email, chat, location, health, mood, personal life, monitoring or name fields are rejected at the schema level. |
| `tests/unit/prompts.test.ts` | Every fixed prompt in `lib/ai/prompts.ts` matches a full copy in the test. Changing a prompt without changing the test fails the build. |
| `tests/unit/separation.test.ts` | The two schemas, clients and code trees never reference each other; survey responses have no person link or timestamp; availability flags have no reason field; no analytics or monitoring packages. |
| `tests/unit/personal.test.ts` | Personal encryption round-trips only under the right passphrase, binds each record to its ID and kind, and the key cannot be exported. Crisis detection and email stripping. |
| `tests/integration/separation.test.ts` | **A personal record cannot be queried from an org context**: by qualified name, through the search path, or with org credentials pointed at the personal schema. An org session token means nothing to the personal product. Even a superuser sees only ciphertext. No cross-schema foreign keys or views. |
| `tests/integration/org-rules.test.ts` | Database CHECK constraints on the floors; no analysis before the Notice; forbidden-field rejection is logged; the gate wipes a harassment complaint and keeps only date and record ID; ordinary complaints go to the filer only; survey answers carry no person; a finding reaches the leader alone and the program lead sees status only; every finding and delivery is audited. |

## How it works

### Organizational Gap Reader (`/org`)

1. **Notice first.** The program lead publishes the Notice (`/org/lead/notice`). Until then nothing imports, surveys or runs. Every account must acknowledge the current Notice before taking a survey or appearing in a report. The Notice is shown in the footer of every page.
2. **Records.** CSV (`/org/lead/import`) or API (`POST /api/org/import/<kind>`) import of decision records, the promotion system of record, evaluations, stretch assignments and formal performance complaints. Leaders are referenced by directory ID. Everyone else appears by role and anonymous reference.
3. **The Three Vantage Point Survey.** Anonymous, eight statements and one open question. The leader rates themselves on the same statements. Results appear only after a cycle closes and only for groups of 8 or more.
4. **Analysis.** Metrics are computed in code (`lib/org/metrics.ts`), patterns are detected deterministically (`lib/org/patterns.ts`), the exclusion gate runs (`lib/org/gate.ts`), and only then does the AI describe the pattern from metrics and anonymous IDs. Without an AI key, a plain template writes the report. Every report ends with the three questions.
5. **Five Steps of Escalation.** Private Surfacing, Private Correction Window, Documented Record, Senior Human Review, Board and Outside Review (`lib/org/escalation.ts`). The leader sees, at every step, exactly who can see what.
6. **Complaints, both directions.** An ordinary performance complaint is placed beside the documented record and shown to the person who filed it. A concern about safety, discrimination, harassment or ethics trips the gate instead, and the filer is shown the organization's own reporting channels.

### Personal Gap Reader (`/personal`)

* Sign in with a personal email. Setup warns to use a personal device and account.
* Choose a passphrase. A key is derived from it **in the browser** (PBKDF2-SHA-256, 600,000 iterations, per-user salt) and is non-extractable. Every record is encrypted with AES-256-GCM in the browser before it is sent. The server stores salt, verifier and ciphertext only. Neither the publisher nor any organization's administrators can read a record, and a forgotten passphrase cannot be recovered.
* The user's own AI key is one of those encrypted records. AI calls go from the browser straight to the provider, so personal conversations never pass through this server and the publisher carries no AI cost.
* Gap Reader conversation (the first-run prompt, verbatim), decision log with monthly read-back, weekly check-in, Source Inquiry in five steps with the book's caution on every screen, nine workbook exercises, and a ninety day plan with no more than three commitments.
* If the user's input or the model's response indicates crisis, the 988 and 911 notice appears above the response and the session stops asking questions.
* Export as PDF (plan and log) or JSON (everything except the AI key). Delete everything with one action.

## Separation guarantees

* **No shared tables.** `prisma/org/schema.prisma` and `prisma/personal/schema.prisma` are separate schemas with separate generated clients (`generated/org`, `generated/personal`) and separate connection strings.
* **No shared access.** The `gr_org` role has no privilege on the `personal` schema and the reverse. This is enforced by Postgres, not by application code.
* **No shared user IDs.** Each product has its own Auth.js instance, base path, cookies, user table and session table. The same email in both products yields two unrelated identities.
* **No shared code paths.** Nothing under `lib/org`, `app/org` or `app/api/org` imports anything personal, and the reverse (tested).
* **No readable personal data on the server.** Ciphertext only, under a key the server never sees.
* **No analytics pipeline.** There is no analytics, telemetry or error-reporting package in the dependency list (tested).
* **An organization that deploys Part A cannot enable, view or export Part B data.** There is no setting, role, route or export for it, and the database refuses the org role.

## Out of scope, by design

The book's model works only if people can trust what the system will never do. These are **not** features waiting to be built, and requests for them should be declined:

* Sentiment or tone analysis of survey comments or any other text
* Keystroke, screen, location, calendar, email or chat integration
* Productivity scoring
* Facial or voice analysis
* Any investigation workflow, case management, or routing to HR or counsel. Matters that may involve a violation of law or policy leave the Gap Reader through the exclusion gate and are handled under the organization's own policies.
* Any decision about a person made or triggered by the AI

Adding a data source beyond the five in A2 needs the book owner's approval first. It is a code change in `lib/org/importSchema.ts`, never a setting.

## Known limits

* The crisis check and the name warning are cautious keyword checks, not classifiers. They err toward showing the notice and the warning.
* A database administrator with full access could, in principle, compare the physical order of survey responses with invitations to narrow down who answered. Responses carry no user ID, timestamp or sequential ID, and answering is deliberately not written to the audit log, but a deployment that needs protection against its own DBAs should restrict superuser access to the `org` schema.
* `kind` (for example `log` or `inquiry`) and record sizes are visible on the server for each personal record. Contents are not.
