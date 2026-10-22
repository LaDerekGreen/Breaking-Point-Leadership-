import { Page, Card, Button, Flash } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { SURVEY_STATEMENTS, selfStatement } from "@/lib/org/survey";
import { SurveyQuestions, readAnswers } from "@/components/SurveyQuestions";
import { SurveyResultView } from "@/components/SurveyResultView";
import { submitSelfRating } from "@/lib/org/surveyAdmin";
import { leaderSurveyResult } from "@/lib/org/leaderData";
import { getSettings } from "@/lib/org/settings";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Survey results" };
const PATH = "/org/leader/survey";

async function rate(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["leader"] });
  try {
    await submitSelfRating(String(formData.get("cycleId")), user, readAnswers(formData));
  } catch (e) {
    back(PATH, (e as Error).message, "err");
  }
  back(PATH, "Your self rating is saved. You can change it until the cycle closes.");
}

export default async function LeaderSurvey({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string; by?: string }> }) {
  const user = await requireOrgUser({ roles: ["leader"] });
  const sp = await searchParams;
  if (!user.personId) return <Page title="Survey results"><Card>Your account is not linked to the directory yet.</Card></Page>;
  const by = sp.by === "jobLevel" ? "jobLevel" : "vantage";
  const { anonymityThreshold } = await getSettings();
  const [open, closed] = await Promise.all([
    orgDb.surveyCycle.findMany({ where: { status: "open" }, orderBy: { number: "desc" } }),
    orgDb.surveyCycle.findMany({ where: { status: "closed" }, orderBy: { number: "desc" } }),
  ]);
  const selfRatings = await orgDb.leaderSelfRating.findMany({ where: { leaderId: user.personId, cycleId: { in: open.map((c) => c.id) } } });
  const results = await Promise.all(closed.map(async (c) => ({ c, r: await leaderSurveyResult(c.id, user.personId!, anonymityThreshold, by) })));
  return (
    <Page title="Three Vantage Point Survey" back={{ href: "/org/leader", label: "My reports" }} intro="How the people above you, beside you and below you experience your leadership, and how that compares with how you see yourself.">
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {open.map((c) => (
        <form key={c.id} action={rate} className="space-y-4">
          <h2 className="text-xl font-semibold">Rate yourself: {c.name}</h2>
          <p className="text-muted">The same eight statements, about yourself. Answer as you honestly see it.</p>
          <input type="hidden" name="cycleId" value={c.id} />
          <SurveyQuestions statements={SURVEY_STATEMENTS.map(selfStatement)} withComments={false} defaults={selfRatings.find((s) => s.cycleId === c.id)?.answers} />
          <Button type="submit">Save my self rating</Button>
        </form>
      ))}
      <p className="text-sm">
        View by: {by === "vantage" ? <strong>vantage point</strong> : <a href={`${PATH}?by=vantage`}>vantage point</a>} ·{" "}
        {by === "jobLevel" ? <strong>job level</strong> : <a href={`${PATH}?by=jobLevel`}>job level</a>}
      </p>
      {results.length === 0 && <Card>No cycle has closed yet. Results appear when a cycle closes.</Card>}
      {results.map(({ c, r }) => <SurveyResultView key={c.id} result={r} title={c.name} />)}
      <Card title="Step five: tell people what you learned">
        Within two weeks of receiving the results, tell everyone who answered what you heard and one thing you will change. You do not need to share every score. You do need to show that answering mattered.
      </Card>
    </Page>
  );
}
