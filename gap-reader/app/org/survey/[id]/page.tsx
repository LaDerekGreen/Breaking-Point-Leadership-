import { notFound, redirect } from "next/navigation";
import { Page, Card, Button, Field, Input, Textarea, Flash } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { OPEN_QUESTION, SURVEY_STATEMENTS, VANTAGES } from "@/lib/org/survey";
import { SurveyQuestions, readAnswers, readComments } from "@/components/SurveyQuestions";
import { submitResponse } from "@/lib/org/surveyAdmin";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Answer the survey" };

async function submit(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  const id = String(formData.get("invitationId"));
  try {
    await submitResponse(id, user, {
      vantage: String(formData.get("vantage")) as "above" | "beside" | "below",
      jobLevel: String(formData.get("jobLevel") ?? ""),
      answers: readAnswers(formData),
      comments: readComments(formData),
      openAnswer: String(formData.get("open") ?? ""),
    });
  } catch (e) {
    back(`/org/survey/${id}`, (e as Error).message, "err");
  }
  redirect("/org/survey?msg=" + encodeURIComponent("Thank you. Your answers are stored with no link to you."));
}

export default async function TakeSurvey({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  const user = await requireOrgUser();
  const { id } = await params;
  const sp = await searchParams;
  const inv = await orgDb.surveyInvitation.findUnique({ where: { id }, include: { cycle: true } });
  if (!inv || inv.userId !== user.id) notFound();
  if (inv.completed) redirect("/org/survey");
  const leader = await orgDb.person.findUnique({ where: { id: inv.leaderId } });
  return (
    <Page title={`About ${leader?.displayName ?? "this leader"}`} back={{ href: "/org/survey", label: "Surveys" }} intro="Answer honestly. Your name is not stored with your answers, and nothing is shown to the leader for any group smaller than eight people.">
      <Flash message={sp.err} tone="danger" />
      <form action={submit} className="space-y-6">
        <input type="hidden" name="invitationId" value={inv.id} />
        <Card title="Your vantage point">
          <fieldset>
            <legend className="sr-only">Your vantage point relative to this leader</legend>
            <div className="space-y-2">
              {VANTAGES.map((v) => (
                <label key={v.value} className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="vantage" value={v.value} required /> {v.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4">
            <Field id="jobLevel" label="Job level (optional)"><Input id="jobLevel" name="jobLevel" /></Field>
          </div>
        </Card>
        <SurveyQuestions statements={SURVEY_STATEMENTS} withComments />
        <Field id="open" label={OPEN_QUESTION}><Textarea id="open" name="open" rows={4} /></Field>
        <Button type="submit">Submit anonymously</Button>
      </form>
    </Page>
  );
}
