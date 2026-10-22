import { SCALE } from "@/lib/org/survey";

/** Eight statements on a one to five scale, each with a comment box. Plain radios, keyboard friendly. */
export function SurveyQuestions({ statements, withComments, defaults }: { statements: readonly string[]; withComments: boolean; defaults?: number[] }) {
  return (
    <ol className="space-y-6">
      {statements.map((s, i) => (
        <li key={i} className="rounded-lg border border-line bg-card p-4">
          <fieldset>
            <legend className="font-medium text-ink">{i + 1}. {s}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {SCALE.map((o) => (
                <label key={o.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="radio" name={`q${i}`} value={o.value} required defaultChecked={defaults?.[i] === o.value} />
                  <span>{o.value}. {o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {withComments && (
            <div className="mt-3">
              <label htmlFor={`c${i}`} className="text-sm text-muted">Comment (optional)</label>
              <textarea id={`c${i}`} name={`c${i}`} rows={2} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-ink" />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export function readAnswers(formData: FormData): number[] {
  return Array.from({ length: 8 }, (_, i) => Number(formData.get(`q${i}`)));
}

export function readComments(formData: FormData): string[] {
  return Array.from({ length: 8 }, (_, i) => String(formData.get(`c${i}`) ?? ""));
}
