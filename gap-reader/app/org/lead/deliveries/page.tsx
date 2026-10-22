import Link from "next/link";
import { Page, Card, Button, Input, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { applyEvent, deliveryStatus, FindingActionError } from "@/lib/org/findings";
import { STEP_NAMES, type State } from "@/lib/org/escalation";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Delivery status" };
const PATH = "/org/lead/deliveries";

const EVENTS = ["CONFIRM_RECORD", "BEGIN_SENIOR_REVIEW", "BEGIN_BOARD_REVIEW", "RESOLVE"] as const;

async function decide(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const type = String(formData.get("type")) as (typeof EVENTS)[number];
  if (!EVENTS.includes(type)) back(PATH, "Unknown action.", "err");
  try {
    await applyEvent(String(formData.get("findingId")), { type, at: new Date(), reason: String(formData.get("reason") ?? "") }, user);
  } catch (e) {
    if (e instanceof FindingActionError) back(PATH, e.message, "err");
    throw e;
  }
  back(PATH, "Recorded.");
}

function Decision({ id, type, label, variant = "primary" }: { id: string; type: (typeof EVENTS)[number]; label: string; variant?: "primary" | "secondary" }) {
  return (
    <form action={decide} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="findingId" value={id} />
      <input type="hidden" name="type" value={type} />
      <label className="sr-only" htmlFor={`r-${id}-${type}`}>Reason</label>
      <Input id={`r-${id}-${type}`} name="reason" placeholder="Reason (required)" required className="max-w-xs" />
      <Button type="submit" variant={variant}>{label}</Button>
    </form>
  );
}

export default async function Deliveries({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const rows = await deliveryStatus();
  const now = new Date();
  return (
    <Page
      title="Delivery status"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="That a report was delivered, and where it stands. Not its contents. You can read a finding only from the Documented Record onward, or when you must read a leader's contest before it can advance."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {rows.length === 0 && <Card>No reports have been delivered.</Card>}
      {rows.map((r) => {
        const state = r.state as State;
        const windowOver = !!r.windowEndsAt && r.windowEndsAt <= now;
        const mustReadContest = state === "CORRECTION_WINDOW" && r.contested && !r.contestReadAt && r.proposal === "advance";
        const canView = ["DOCUMENTED_RECORD", "SENIOR_REVIEW", "BOARD_REVIEW"].includes(state) || (state === "CORRECTION_WINDOW" && r.contested && r.proposal === "advance") || (state === "RESOLVED" && r.resolvedFromState && r.resolvedFromState !== "PRIVATE_SURFACING" && r.resolvedFromState !== "CORRECTION_WINDOW");
        return (
          <Card key={r.id} title={`${r.leader?.displayName ?? "Unknown"}: ${STEP_NAMES[state]}`}>
            <ul className="space-y-1 text-sm">
              <li>Delivered {fmtDate(r.deliveredAt)}. {r.firstOpenedAt ? `Opened by the leader ${fmtDate(r.firstOpenedAt)}.` : "Not opened yet. The correction window starts when the leader opens it."}</li>
              {r.windowEndsAt && <li>Correction window {windowOver ? "ended" : "ends"} {fmtDate(r.windowEndsAt)}.</li>}
              {r.contested && <li>The leader has contested this finding.{r.contestReadAt ? ` The contest was read ${fmtDate(r.contestReadAt)}.` : ""}</li>}
              {r.patternPersists !== null && <li>Next cycle: the pattern {r.patternPersists ? "persisted" : "did not persist"}.</li>}
              {r.proposal && <li className="font-medium">The system proposes: {r.proposal === "advance" ? "enter the Documented Record" : "resolve privately"}. A person must decide.</li>}
            </ul>
            <div className="mt-4 space-y-3">
              {canView && <p><Link href={`/org/findings/${r.id}`}>{mustReadContest ? "Read the contest" : "Open the record"}</Link></p>}
              {state === "CORRECTION_WINDOW" && r.proposal === "advance" && !mustReadContest && <Decision id={r.id} type="CONFIRM_RECORD" label="Confirm into the Documented Record" />}
              {state === "CORRECTION_WINDOW" && windowOver && <Decision id={r.id} type="RESOLVE" label="Resolve privately" variant="secondary" />}
              {state === "DOCUMENTED_RECORD" && <Decision id={r.id} type="BEGIN_SENIOR_REVIEW" label="Open Senior Human Review" />}
              {state === "DOCUMENTED_RECORD" && <Decision id={r.id} type="RESOLVE" label="Resolve" variant="secondary" />}
              {state === "SENIOR_REVIEW" && <Decision id={r.id} type="BEGIN_BOARD_REVIEW" label="Open Board and Outside Review" />}
              {state === "SENIOR_REVIEW" && <Decision id={r.id} type="RESOLVE" label="Resolve" variant="secondary" />}
            </div>
          </Card>
        );
      })}
    </Page>
  );
}
