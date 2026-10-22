import { Page, Card, Button, Field, Input, Textarea, Select, Flash } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { getSettings } from "@/lib/org/settings";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";
import { seal } from "@/lib/org/secretbox";
import { back } from "@/lib/shared/flash";
import { ANONYMITY_FLOOR, validateThresholdChange } from "@/lib/org/anonymity";
import { CORRECTION_WINDOW_FLOOR_DAYS, validateWindowChange } from "@/lib/org/escalation";
import { PROVIDERS, isProviderId } from "@/lib/ai/adapter";

export const metadata = { title: "Settings" };
const PATH = "/org/lead/settings";

async function saveRules(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const threshold = Number(formData.get("threshold"));
  const windowDays = Number(formData.get("windowDays"));
  const reason = String(formData.get("reason") ?? "").trim();
  const e1 = validateThresholdChange(threshold);
  if (e1) back(PATH, e1, "err");
  const e2 = validateWindowChange(windowDays);
  if (e2) back(PATH, e2, "err");
  const before = await getSettings();
  await orgDb.orgSettings.update({
    where: { id: 1 },
    data: {
      anonymityThreshold: threshold,
      correctionWindowDays: windowDays,
      organizationName: String(formData.get("organizationName") ?? "").trim() || before.organizationName,
      reportingChannels: String(formData.get("reportingChannels") ?? "").trim(),
    },
  });
  await audit({
    actorUserId: user.id,
    action: "settings.updated",
    entityType: "OrgSettings",
    reason: reason || null,
    meta: { anonymityThreshold: [before.anonymityThreshold, threshold], correctionWindowDays: [before.correctionWindowDays, windowDays] },
  });
  back(PATH, "Saved.");
}

async function saveAI(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const provider = String(formData.get("provider") ?? "");
  const key = String(formData.get("apiKey") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  if (provider === "none") {
    await orgDb.orgSettings.update({ where: { id: 1 }, data: { aiProvider: null, aiModel: null, aiKeyCiphertext: null } });
    await audit({ actorUserId: user.id, action: "settings.ai_removed", entityType: "OrgSettings" });
    back(PATH, "AI removed. Reports will use the plain template.");
  }
  if (!isProviderId(provider)) back(PATH, "Choose a provider.", "err");
  await orgDb.orgSettings.update({
    where: { id: 1 },
    data: { aiProvider: provider, aiModel: model || null, ...(key ? { aiKeyCiphertext: seal(key) } : {}) },
  });
  await audit({ actorUserId: user.id, action: "settings.ai_updated", entityType: "OrgSettings", meta: { provider, model: model || null, keyChanged: !!key } });
  back(PATH, "AI settings saved. The key is stored encrypted and is never shown again.");
}

export default async function Settings({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const s = await getSettings();
  return (
    <Page title="Settings" back={{ href: "/org/lead", label: "Program lead console" }}>
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      <form action={saveRules} className="space-y-5">
        <Card title="Hard rules">
          <div className="space-y-5">
            <Field id="threshold" label="Anonymity threshold" hint={`No result is ever shown for a group smaller than this. It can be raised, never set below ${ANONYMITY_FLOOR}.`}>
              <Input id="threshold" name="threshold" type="number" min={ANONYMITY_FLOOR} step={1} defaultValue={s.anonymityThreshold} required />
            </Field>
            <Field id="windowDays" label="Correction window, in days" hint={`Starts when the leader opens a finding. It can be lengthened, never set below ${CORRECTION_WINDOW_FLOOR_DAYS}.`}>
              <Input id="windowDays" name="windowDays" type="number" min={CORRECTION_WINDOW_FLOOR_DAYS} step={1} defaultValue={s.correctionWindowDays} required />
            </Field>
          </div>
        </Card>
        <Card title="Organization">
          <div className="space-y-5">
            <Field id="organizationName" label="Organization name">
              <Input id="organizationName" name="organizationName" defaultValue={s.organizationName} />
            </Field>
            <Field id="reportingChannels" label="Your own reporting channels" hint="Shown whenever something falls outside the Gap Reader: for example your ethics line, HR contact and safety reporting. The Gap Reader does not route anything to them.">
              <Textarea id="reportingChannels" name="reportingChannels" rows={4} defaultValue={s.reportingChannels} />
            </Field>
            <Field id="reason" label="Reason for this change (for the audit log)">
              <Input id="reason" name="reason" />
            </Field>
          </div>
        </Card>
        <Button type="submit">Save</Button>
      </form>

      <form action={saveAI} className="space-y-5">
        <Card title="AI provider">
          <p className="text-sm text-muted">
            The organization supplies its own key. Metrics are computed in code first. The AI only describes them, using anonymous IDs, never names and never free text. It never decides anything. Without a key, reports use a plain template.
          </p>
          <div className="mt-4 space-y-5">
            <Field id="provider" label="Provider">
              <Select id="provider" name="provider" defaultValue={s.aiProvider ?? "none"}>
                <option value="none">None (plain template)</option>
                {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
              </Select>
            </Field>
            <Field id="model" label="Model" hint="Leave blank for the provider's default.">
              <Input id="model" name="model" defaultValue={s.aiModel ?? ""} />
            </Field>
            <Field id="apiKey" label="API key" hint={s.hasAiKey ? "A key is stored. Leave blank to keep it." : "Stored encrypted. Never shown again."}>
              <Input id="apiKey" name="apiKey" type="password" autoComplete="off" />
            </Field>
          </div>
        </Card>
        <Button type="submit">Save AI settings</Button>
      </form>
    </Page>
  );
}
