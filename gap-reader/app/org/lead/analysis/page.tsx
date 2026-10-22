import { Page, Card, Button, Flash } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { runAnalysis } from "@/lib/org/analysis";
import { currentNotice } from "@/lib/org/notice";
import { GATE_MESSAGE } from "@/lib/ai/prompts";
import { getSettings } from "@/lib/org/settings";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Run analysis" };
const PATH = "/org/lead/analysis";

async function run() {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  if (!(await currentNotice())) back(PATH, "Publish the Notice before any analysis runs.", "err");
  let s: Awaited<ReturnType<typeof runAnalysis>>;
  try {
    s = await runAnalysis(user.id);
  } catch (e) {
    back(PATH, (e as Error).message, "err");
  }
  const msg = `${s.leaders} leader${s.leaders === 1 ? "" : "s"} read. ${s.findingsDelivered} report${s.findingsDelivered === 1 ? "" : "s"} delivered privately to the leader concerned. ${s.proposals} proposal${s.proposals === 1 ? "" : "s"} waiting for a person to decide.${s.errors ? ` ${s.errors} could not be completed and will be tried again next time.` : ""}`;
  back(s.gateFired ? `${PATH}?gate=1` : PATH, msg);
}

export default async function Analysis({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; gate?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const [notice, settings] = await Promise.all([currentNotice(), getSettings()]);
  return (
    <Page
      title="Run analysis"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="Metrics are computed in code from the records. Then each pattern is described in plain language. Every report goes first, privately, to the leader it concerns. You will see that a report was delivered, not what it says."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {sp.gate && (
        <Card tone="warn">
          <p className="font-medium">{GATE_MESSAGE}</p>
          {settings.reportingChannels && <p className="mt-2 whitespace-pre-line text-sm">{settings.reportingChannels}</p>}
        </Card>
      )}
      <Card>
        <p>Only leaders who have acknowledged the current Notice are included. {settings.ceoReportsEnabled ? "The chief executive's own report is included, as the board has enabled it." : "The chief executive's report is not included until the board enables it."}</p>
        <p>Reports are described by {settings.hasAiKey ? "the organization's AI provider, from metrics and anonymous IDs only" : "a plain template, because no AI key is set"}.</p>
      </Card>
      <form action={run}>
        <Button type="submit" disabled={!notice}>Run analysis now</Button>
      </form>
    </Page>
  );
}
