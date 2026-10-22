import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Page, Card, Button, Field, Textarea, Select, Flash, Input, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { addLeaderResponse, applyEvent, FindingActionError, leaderOpened, loadFindingFor, recordJudgment, sharingPanel } from "@/lib/org/findings";
import { STEP_NAMES, STEPS, type State } from "@/lib/org/escalation";
import { PATTERN_TITLES, type PatternKey } from "@/lib/org/patterns";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Finding" };

const path = (id: string) => `/org/findings/${id}`;

async function respond(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  const id = String(formData.get("findingId"));
  const kind = String(formData.get("kind"));
  if (kind !== "context" && kind !== "contest" && kind !== "plan") back(path(id), "Choose what you are adding.", "err");
  try {
    await addLeaderResponse(id, user, kind as "context" | "contest" | "plan", String(formData.get("text") ?? ""));
  } catch (e) {
    if (e instanceof FindingActionError) back(path(id), e.message, "err");
    throw e;
  }
  revalidatePath(path(id));
  back(path(id), kind === "contest" ? "Your contest is recorded. This finding cannot advance until a person has read it." : "Saved. It travels with the finding and counts in your favor.");
}

async function judge(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  const id = String(formData.get("findingId"));
  try {
    await recordJudgment(id, user, String(formData.get("text") ?? ""));
  } catch (e) {
    if (e instanceof FindingActionError) back(path(id), e.message, "err");
    throw e;
  }
  back(path(id), "Your judgment is recorded.");
}

async function event(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  const id = String(formData.get("findingId"));
  const type = String(formData.get("type"));
  try {
    if (type === "MARK_CONTEST_READ") await applyEvent(id, { type, at: new Date() }, user);
    else if (type === "RESOLVE") await applyEvent(id, { type, at: new Date(), reason: String(formData.get("reason") ?? "") }, user);
    else back(path(id), "Unknown action.", "err");
  } catch (e) {
    if (e instanceof FindingActionError) back(path(id), e.message, "err");
    throw e;
  }
  back(path(id), "Recorded.");
}

const KIND_LABEL = { context: "Context", contest: "Contest", plan: "Plan" } as const;

export default async function FindingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireOrgUser();
  const { id } = await params;
  const sp = await searchParams;
  let loaded = await loadFindingFor(id, user);
  if (!loaded) notFound();
  if (loaded.as === "leader" && loaded.finding.state === "PRIVATE_SURFACING") {
    // Opening the finding starts the full correction window.
    await leaderOpened(id, user);
    loaded = (await loadFindingFor(id, user))!;
  }
  const { finding: f, as } = loaded;
  const state = f.state as State;
  const panel = await sharingPanel(id);
  const title = PATTERN_TITLES[f.patternKey as PatternKey] ?? "Finding";
  const backLink = as === "leader" ? { href: "/org/leader", label: "My reports" } : as === "program_lead" ? { href: "/org/lead/deliveries", label: "Delivery status" } : as === "board_reviewers" ? { href: "/org/board", label: "Board" } : { href: "/org/review", label: "Senior review" };

  return (
    <Page title={title} back={backLink} intro={as === "board_reviewers" ? "Presented to the board as a matter of fiduciary risk: a documented pattern that persisted through private correction and independent senior review." : undefined}>
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />

      <nav aria-label="Steps of escalation">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((s, i) => {
            const current = state === s || (state === "RESOLVED" && f.resolvedFromState === s);
            return (
              <li key={s} aria-current={current ? "step" : undefined} className={`rounded-full border px-3 py-1 ${current ? "border-accent bg-accent-soft font-semibold" : "border-line text-muted"}`}>
                {i + 1}. {STEP_NAMES[s]}
              </li>
            );
          })}
          {state === "RESOLVED" && <li className="rounded-full border border-accent bg-accent-soft px-3 py-1 font-semibold">Resolved</li>}
        </ol>
      </nav>

      {as === "leader" && state === "CORRECTION_WINDOW" && f.windowEndsAt && (
        <Card tone="accent">
          Your private correction window runs until {fmtDate(f.windowEndsAt)}. Nothing has entered your file. You can add context, contest this finding, or record a plan. Everything you write here is kept as your own context and counts in your favor.
        </Card>
      )}

      <Card title="The report">
        <div className="whitespace-pre-line">{f.report}</div>
        <p className="mt-4 text-sm text-muted">Delivered {fmtDate(f.deliveredAt)}. Computed from records. The AI described the pattern; it decided nothing.</p>
      </Card>

      <details className="rounded-lg border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">The metrics behind it</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(f.metrics, null, 2)}</pre>
      </details>

      <Card title="What has been shared, and with whom">
        <p className="text-sm text-muted">Current step: {panel.step}.</p>
        <ul className="mt-2 space-y-2">
          {panel.rows.map((r) => <li key={r.who}><span className="font-medium">{r.who}:</span> {r.what}</li>)}
        </ul>
      </Card>

      <Card title={as === "leader" ? "Your context, contest and plans" : "The leader's own responses"}>
        {f.responses.length === 0 ? (
          <p className="text-muted">Nothing written yet.</p>
        ) : (
          <ul className="space-y-3">
            {f.responses.map((r) => (
              <li key={r.id} className="border-l-4 border-accent pl-3">
                <p className="text-sm text-muted">{KIND_LABEL[r.kind]}, {fmtDate(r.createdAt)}</p>
                <p className="whitespace-pre-line">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
        {f.contested && <p className="mt-3 text-sm">Contested.{f.contestReadAt ? ` A person read the contest on ${fmtDate(f.contestReadAt)}.` : " No one has read the contest yet, so this finding cannot advance."}</p>}
      </Card>

      {f.judgments.length > 0 && (
        <Card title="Independent judgments">
          <ul className="space-y-3">
            {f.judgments.map((j) => (
              <li key={j.id}>
                <p className="text-sm text-muted">{STEP_NAMES[j.stage as State]}, {fmtDate(j.createdAt)}</p>
                <p className="whitespace-pre-line">{j.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {as === "leader" && state !== "RESOLVED" && (
        <form action={respond} className="space-y-4">
          <input type="hidden" name="findingId" value={f.id} />
          <Field id="kind" label="Add">
            <Select id="kind" name="kind">
              <option value="context">Context the record is missing</option>
              <option value="plan">A plan: what I will do about it</option>
              <option value="contest">A contest: why this finding is wrong</option>
            </Select>
          </Field>
          <Field id="text" label="In your own words"><Textarea id="text" name="text" rows={6} required /></Field>
          <Button type="submit">Save</Button>
        </form>
      )}

      {as !== "leader" && f.contested && !f.contestReadAt && (
        <form action={event}>
          <input type="hidden" name="findingId" value={f.id} />
          <input type="hidden" name="type" value="MARK_CONTEST_READ" />
          <Button type="submit">I have read the leader&apos;s contest</Button>
        </form>
      )}

      {((as === "senior_reviewer" && state === "SENIOR_REVIEW") || (as === "board_reviewers" && state === "BOARD_REVIEW")) && (
        <form action={judge} className="space-y-4">
          <input type="hidden" name="findingId" value={f.id} />
          <Field id="judgment" label="Your independent judgment" hint="Read the same report the leader saw and the leader's own responses. Write your judgment in your own words. The AI produces nothing at this step.">
            <Textarea id="judgment" name="text" rows={8} required />
          </Field>
          <Button type="submit">Record my judgment</Button>
        </form>
      )}

      {((as === "senior_reviewer" && state === "SENIOR_REVIEW" && f.judgments.some((j) => j.stage === "SENIOR_REVIEW")) ||
        (as === "board_reviewers" && state === "BOARD_REVIEW" && f.judgments.some((j) => j.stage === "BOARD_REVIEW"))) && (
        <form action={event} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="findingId" value={f.id} />
          <input type="hidden" name="type" value="RESOLVE" />
          <label htmlFor="reason" className="sr-only">Reason</label>
          <Input id="reason" name="reason" placeholder="Reason (required)" required className="max-w-sm" />
          <Button type="submit" variant="secondary">Resolve this finding</Button>
        </form>
      )}
    </Page>
  );
}
