# Hard rules and where they are enforced

Every rule from the Gap Reader build brief, with the code that enforces it and the test that proves it. Where the book sets a rule, it is a hard constraint, not a setting.

## The first rule: the two products never share data

| Rule | Enforced in | Tested in |
| --- | --- | --- |
| Two schemas, two databases or Postgres schemas, separate credentials | `prisma/org/schema.prisma`, `prisma/personal/schema.prisma`, `db/setup.sql` | `tests/unit/separation.test.ts` |
| No foreign keys, views or joins across them | Schemas have no cross references; roles are refused each other's schema (`db/setup.sql`) | `tests/integration/separation.test.ts` ("no foreign keys or views") |
| A personal record cannot be queried from an org context | `gr_org` has no privilege on `personal`; `lib/org/db.ts` uses only the org client | `tests/integration/separation.test.ts` |
| No shared user IDs | Separate Auth.js instances: `lib/org/auth.ts`, `lib/personal/auth.ts` (own base path, cookies, tables) | `tests/integration/separation.test.ts` ("an org session token means nothing") |
| No shared code paths | Org code never imports personal code and the reverse | `tests/unit/separation.test.ts` |
| Personal records encrypted at rest under a key from the user's credentials; admins cannot read them | `lib/personal/crypto.ts` (PBKDF2 + AES-GCM, non-extractable key, in the browser), `lib/personal/vaultClient.ts`; server stores ciphertext only (`app/api/personal/*`) | `tests/unit/personal.test.ts`, `tests/integration/separation.test.ts` ("even a superuser sees only ciphertext") |
| Personal AI key stored encrypted under the personal key; publisher never sees personal conversations | `lib/personal/aiClient.ts` (browser to provider), settings saved as an encrypted record | `tests/unit/separation.test.ts` ("personal routes store ciphertext only") |
| No analytics pipeline reads personal data | No analytics dependency | `tests/unit/separation.test.ts` |
| An organization cannot enable, view or export Part B | No route, role or setting exists for it; DB role refused | `tests/integration/separation.test.ts` |

## A1. Notice before anything runs

| Rule | Enforced in |
| --- | --- |
| No analysis until a Notice is published | `lib/org/analysis.ts` (`runAnalysis` throws), `app/org/lead/analysis/page.tsx`, imports and surveys also refuse (`app/org/lead/import/page.tsx`, `app/api/org/import/[kind]/route.ts`, `app/org/lead/surveys/page.tsx`). Tested in `tests/integration/org-rules.test.ts`. |
| Default Notice text, editable by the program lead | `lib/org/notice.ts` (`DEFAULT_NOTICE`), `app/org/lead/notice/page.tsx` |
| Every account acknowledges before a survey or appearing in a report | `lib/org/session.ts` (`requireOrgUser` redirects to `/org/acknowledge`), `lib/org/surveyAdmin.ts` (`submitResponse`), `lib/org/analysis.ts` (only acknowledged leaders) |
| Acknowledgment stored with a timestamp | `NoticeAcknowledgment.acknowledgedAt` in `prisma/org/schema.prisma` |
| Notice permanently in the footer of every page | `components/NoticeFooter.tsx`, used by `app/org/layout.tsx`, `app/page.tsx`, `app/notice/page.tsx` |

## A2. Data the system may ingest

| Rule | Enforced in |
| --- | --- |
| Only decisions, promotions, evaluations, stretch assignments, performance complaints | `lib/org/importSchema.ts` (`ROW_SCHEMAS`, whitelisted columns), shared by CSV and API import (`lib/org/importer.ts`) |
| Hard-reject email bodies, chat, location, health, medical, mood, personal life | `FORBIDDEN_FIELD_PATTERNS` in `lib/org/importSchema.ts`; whole file rejected before any row is read |
| Log the rejection | `lib/org/importer.ts` (`import.rejected_forbidden_field`). Tested in `tests/integration/org-rules.test.ts`. |
| People by role and anonymous ID, never by name, in any report | Names only on `Person.displayName`; columns that look like names are rejected; reports and metrics use `anonId` (`lib/org/metrics.ts`, `lib/org/report.ts`). Tested in `tests/integration/org-rules.test.ts`. |
| Names never passed to the AI adapter | `lib/org/report.ts` (`reportInput` uses anonymous ID and computed metrics), `lib/org/gate.ts` (`redact` before the model check) |
| Ask before adding a data source | Documented in `lib/org/importSchema.ts` and the import page; not a setting |

## A3. Surveys

| Rule | Enforced in |
| --- | --- |
| Anonymous; no names collected | `SurveyResponse` has no user ID, no timestamp, random UUID (`prisma/org/schema.prisma`); who answered (`SurveyInvitation`) is never linked to what they answered; answering is not audited (`lib/org/surveyAdmin.ts`). Tested in both separation tests and `org-rules.test.ts`. |
| Respondent selects vantage point; optional job level | `app/org/survey/[id]/page.tsx` |
| Default instrument, eight statements and the open question | `lib/book/survey.ts` |
| Anonymity threshold of 8, a hard rule; groups below it merge into the next larger group before anything is computed | `lib/org/anonymity.ts` (`mergeSmallGroups`, `computeSurveyResult`); DB CHECK in `db/checks.sql`. Tested in `tests/unit/anonymity.test.ts`, `tests/integration/org-rules.test.ts`. |
| The program lead may raise it, never lower it | `validateThresholdChange`, `effectiveThreshold` in `lib/org/anonymity.ts`; `app/org/lead/settings/page.tsx`; DB CHECK |
| The gap is its own finding; largest first, above-high and below-low first | `computeSurveyResult` gap ordering, `self_vs_team_gap` in `lib/org/patterns.ts` |
| Availability flag: timing only, no reason, no inference | `AvailabilityFlag` has only `waitUntil` (`prisma/org/schema.prisma`); `app/org/availability/page.tsx` does not store the choice; `app/org/leader/page.tsx` shows a timing suggestion only. Tested in `tests/unit/separation.test.ts`. |

## A4. Pattern analysis, deterministic first and AI second

| Rule | Enforced in |
| --- | --- |
| Metrics computed in code, not in the model | `lib/org/metrics.ts`, `lib/org/patterns.ts` |
| Only computed metrics and anonymous IDs go to the AI | `lib/org/report.ts` (`reportInput`) |
| Fixed system prompt: plain, no diagnosis, no motives, no discipline, no labels, ends with three questions | `ORG_REPORT_SYSTEM_PROMPT` in `lib/ai/prompts.ts`; `ensureThreeQuestions` and `reportIsClean` in `lib/org/report.ts`. Tested in `tests/unit/prompts.test.ts`. |
| The AI informs, never decides | The escalation state machine has no AI actor and the system actor may only propose (`lib/org/escalation.ts`); no code path reads the report text to make a decision. Tested in `tests/unit/escalation.test.ts`. |

## A5. The law-or-policy exclusion gate

| Rule | Enforced in |
| --- | --- |
| Runs before any finding is created, on metrics and complaint text; rules plus a model check | `lib/org/gate.ts` (`ruleCheck`, `runGate`), called in `lib/org/analysis.ts` and `lib/org/complaints.ts` |
| If it fires: no finding, no routing, no stored analysis | `runGate` returns a boolean only; `analysis.ts` skips the leader; `complaints.ts` empties the complaint text |
| Program lead sees one fixed message | `GATE_MESSAGE` in `lib/ai/prompts.ts`; `app/org/lead/analysis/page.tsx`, `app/org/lead/gate/page.tsx` |
| Logs only that it fired, the date and record IDs | `GateEvent` model (`firedAt`, `recordIds`). Tested in `tests/integration/org-rules.test.ts`. |
| No investigation workflow, case management or routing to HR or counsel | Absent by design. Tested in `tests/unit/gate.test.ts`. |

## A6. The Five Steps of Escalation

| Rule | Enforced in |
| --- | --- |
| Five states in order, none skipped | `lib/org/escalation.ts` (`advance` moves one step only) |
| Private Surfacing: the leader alone; nothing in the file; no one above notified; program lead sees delivery only | `audiences()` in `lib/org/escalation.ts`; `loadFindingFor` and `deliveryStatus` (never selects contents) in `lib/org/findings.ts` |
| Correction window: 90 days or longer, configurable upward only, starts when the leader opens it | `effectiveWindowDays`, `validateWindowChange`, `LEADER_OPENED`; DB CHECK |
| Leader's context counts in their favor; contested findings wait for a human to read the contest | `addLeaderResponse` (a new contest resets the read), `contestBlocks` in `escalation.ts` |
| Documented Record only if the pattern persists in the next cycle, and a human confirms | `measureOpenFindings` in `lib/org/analysis.ts` (system proposes), `CONFIRM_RECORD` (program lead, with reason) |
| Senior Human Review by someone with no reporting stake; AI produces nothing | `assignSeniorReviewer` in `lib/org/reviewers.ts` (excludes the reporting line above and below); `recordJudgment` in `lib/org/findings.ts` |
| Board and Outside Review; chief executive included when the board enables it | `BEGIN_BOARD_REVIEW`; `app/org/board/page.tsx` (toggle); `runAnalysis` excludes the chief executive until enabled |
| The leader sees what has been shared and with whom; responses travel with the finding | `sharingPanel` in `lib/org/findings.ts`, built from the same `audiences()` that authorizes access |
| Every escalation step and human decision audited, with who, when and why | `applyEvent` in `lib/org/findings.ts`; reasons required by the state machine |

## A7. Complaints checked against the record, in both directions

| Rule | Enforced in |
| --- | --- |
| A performance complaint is placed beside the documented record and shown privately to the filer, who can add context or withdraw | `processNewComplaints`, `comparisonSnapshot`, `filerRespond` in `lib/org/complaints.ts`; `app/org/complaints/page.tsx` |
| Nothing enters anyone's record automatically | No finding is created from a complaint. Tested in `tests/integration/org-rules.test.ts`. |
| Safety, discrimination, harassment and ethics concerns are never checked against the person who raised them; the org's own channels are shown | Gate runs first in `processNewComplaints`; `app/org/complaints/page.tsx` shows `reportingChannels` |

## A8. Program lead console

| Rule | Enforced in |
| --- | --- |
| Notice, threshold (8+), window (90+), reviewers, imports, survey cycles, delivery status, audit export | `app/org/lead/*`, `app/api/org/audit/route.ts` |
| "First ninety days" checklist from the book's six lines | `lib/org/checklist.ts`, `app/org/lead/page.tsx` |

## Part B. Personal Gap Reader

| Rule | Enforced in |
| --- | --- |
| Personal email, own AI key, warning to use a personal device and account | `app/personal/signin/page.tsx`, `app/personal/(vault)/setup/Setup.tsx` |
| First-run system prompt, verbatim | `PERSONAL_GAP_READER_PROMPT` in `lib/ai/prompts.ts`; `tests/unit/prompts.test.ts` |
| Decision log with the book's columns; monthly read-back with the three questions | `app/personal/(vault)/log/DecisionLog.tsx`, `MONTHLY_READBACK_QUESTIONS` |
| Weekly check-in sends the log and the plan | `app/personal/(vault)/checkin/Checkin.tsx` |
| Describe people by role; strip emails; warn on names | `lib/personal/sanitize.ts`, `components/personal/SafeField.tsx`, `components/personal/Chat.tsx` |
| Source Inquiry in five steps; system prompt verbatim; caution on every screen | `app/personal/(vault)/inquiry/SourceInquiry.tsx`, `SOURCE_INQUIRY_PROMPT`, `components/personal/Caution.tsx` |
| Crisis: 988 and 911 notice above the response; stop asking in that session | `lib/personal/crisis.ts`; `components/personal/Chat.tsx` (stops and saves `stopped`); Source Inquiry stays stopped for the session |
| Nine exercises as forms; each sent to the AI one at a time with the fixed text | `lib/book/workbook.ts` (book text), `app/personal/(vault)/workbook/[id]/ExerciseForm.tsx`, `WORKBOOK_EXERCISE_PROMPT` |
| Three Vantage Point Survey is a self rating only in the personal tool | `selfRatingOnly` in `lib/book/workbook.ts` |
| Ninety day plan with no more than three commitments | `MAX_COMMITMENTS` in `lib/personal/types.ts`, `app/personal/(vault)/plan/PlanPage.tsx` |
| Export as PDF and JSON; delete everything in one action | `app/personal/(vault)/export/ExportPage.tsx`, `app/api/personal/account/route.ts` (cascade delete) |

## Deliverables

| Rule | Enforced in |
| --- | --- |
| Fixed prompts in `lib/ai/prompts.ts`; a test fails if any changes without the test | `tests/unit/prompts.test.ts` |
| One provider-agnostic adapter; the app names no AI vendor outside the adapter settings screens | `lib/ai/adapter.ts` (`PROVIDERS` labels used only in the two settings screens and setup); `tests/unit/prompts.test.ts` checks the book's prompts name no vendor |
| No monitoring features | `README.md` ("Out of scope, by design"); `tests/unit/separation.test.ts` |
| Accessibility: keyboard, WCAG AA contrast, phone | `app/globals.css` (contrast tokens, visible focus), native form controls, skip link in `app/layout.tsx`, 44px targets, responsive layouts |
