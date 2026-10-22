# Architecture

## File structure

```
gap-reader/
├── db/
│   ├── setup.sql                 two schemas, two roles, each refused the other's schema
│   └── checks.sql                CHECK constraints appended to the org migration
├── prisma/
│   ├── org/schema.prisma         Organizational Gap Reader (ORG_DATABASE_URL, generated/org)
│   ├── org/migrations/
│   ├── personal/schema.prisma    Personal Gap Reader (PERSONAL_DATABASE_URL, generated/personal)
│   ├── personal/migrations/
│   └── seed.ts                   fictional organization, roles only
├── lib/
│   ├── ai/adapter.ts             the single provider-agnostic adapter (fetch only)
│   ├── ai/prompts.ts             every fixed prompt, verbatim
│   ├── book/                     book text shared by both products (no data)
│   ├── org/                      Organizational Gap Reader: rules, analysis, auth, db
│   │   ├── anonymity.ts          threshold and merging
│   │   ├── escalation.ts         the five steps state machine and visibility
│   │   ├── gate.ts               law-or-policy exclusion gate
│   │   ├── importSchema.ts       what may be ingested
│   │   ├── metrics.ts, patterns.ts, report.ts, analysis.ts
│   │   └── findings.ts, complaints.ts, reviewers.ts, surveyAdmin.ts, ...
│   ├── personal/                 Personal Gap Reader: crypto, vault client, crisis, auth, db
│   └── shared/                   email provider shape and flash helper (no data)
├── app/
│   ├── org/                      org pages (layout shows the Notice footer)
│   ├── personal/                 personal pages ((vault) group requires a personal session)
│   ├── api/auth/org, api/auth/personal     two Auth.js instances
│   ├── api/org/                  audit export, import API
│   └── api/personal/             ciphertext CRUD, vault parameters, rekey, delete account
├── components/                   UI; components/personal is client-side only
├── tests/unit, tests/integration
└── docs/rules.md, docs/architecture.md
```

## The org schema (`prisma/org/schema.prisma`)

* **Auth:** `User` (with `roles`: program_lead, leader, respondent, senior_reviewer, board_reviewer), `Account`, `Session`, `VerificationToken`
* **Setup:** `OrgSettings` (single row; threshold ≥ 8 and window ≥ 90 by CHECK), `Notice`, `NoticeAcknowledgment`
* **Admin directory:** `Person` (the only place a name exists; `anonId` is what analysis uses)
* **Records (A2):** `ImportBatch`, `DecisionRecord`, `PromotionRecord`, `Evaluation`, `StretchAssignment`, `Complaint`, `ComplaintComparison`
* **Survey (A3):** `SurveyCycle`, `SurveyInvitation` (who was asked), `SurveyResponse` (what was answered, with no link to who), `LeaderSelfRating`, `AvailabilityFlag` (a date only)
* **Escalation (A6):** `Finding`, `LeaderResponse`, `Judgment`, `ReviewerAssignment`
* **Gate (A5):** `GateEvent` (date and record IDs only)
* **Audit:** `AuditLog`

## The personal schema (`prisma/personal/schema.prisma`)

* **Auth:** `User` (role personal_user), `Account`, `Session`, `VerificationToken`
* **Vault:** salt, iteration count and a verifier. Never a key or passphrase.
* **Record:** `id`, `userId`, `kind`, `iv`, `ciphertext`, `updatedAt`. Every decision, plan, exercise, inquiry, conversation and the user's AI key are records, encrypted in the browser.

## Data flow

**Organizational:** import → schema check (A2) → records → `runAnalysis`: metrics in code → gate → persistence of open findings (system proposes) → new patterns → AI describes (anonymous metrics only) → `Finding` in Private Surfacing → leader opens → correction window → a person confirms each later step.

**Personal:** browser derives key from passphrase → encrypts → `PUT /api/personal/records/:id` stores ciphertext. AI: browser decrypts the user's key → calls the provider directly → the conversation is encrypted and saved. The server never holds plaintext.
