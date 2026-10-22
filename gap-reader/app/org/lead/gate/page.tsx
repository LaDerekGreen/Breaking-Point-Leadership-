import { Page, Card, Table, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { GATE_MESSAGE } from "@/lib/ai/prompts";
import { getSettings } from "@/lib/org/settings";

export const metadata = { title: "Outside the Gap Reader" };

export default async function Gate() {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const [events, settings] = await Promise.all([orgDb.gateEvent.findMany({ orderBy: { firedAt: "desc" } }), getSettings()]);
  return (
    <Page title="Outside the Gap Reader" back={{ href: "/org/lead", label: "Program lead console" }}>
      <Card tone="warn">
        <p className="font-medium">{GATE_MESSAGE}</p>
        <p className="mt-2 text-sm">The Gap Reader keeps only the date and the record IDs below. It created no finding, routed nothing, and stored no analysis. There is no investigation or case workflow here, by design.</p>
      </Card>
      <Card title="Your organization's own reporting channels">
        <p className="whitespace-pre-line">{settings.reportingChannels || "Not configured. Add them in Settings."}</p>
      </Card>
      <Table caption="Gate events" head={["Date", "Record IDs"]} rows={events.map((e) => [fmtDate(e.firedAt), <code key="c" className="break-all text-xs">{e.recordIds.join(", ")}</code>])} />
    </Page>
  );
}
