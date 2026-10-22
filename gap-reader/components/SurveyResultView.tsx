import type { SurveyResult } from "@/lib/org/anonymity";
import { SURVEY_STATEMENTS } from "@/lib/org/survey";
import { Card, Table } from "./ui";

export function SurveyResultView({ result, title }: { result: SurveyResult; title: string }) {
  if (result.suppressed)
    return (
      <Card title={title}>
        Fewer than {result.threshold} people answered, even with every group combined, so no result can be shown. This protects everyone who answered.
      </Card>
    );
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">
        {result.totalResponses} people answered. Groups smaller than {result.threshold} were combined with the next larger group before anything was computed.
      </p>
      <Table
        caption="Average score by group"
        head={["Statement", ...result.groups.map((g) => `${g.label} (${g.n})`)]}
        rows={SURVEY_STATEMENTS.map((s, i) => [`${i + 1}. ${s}`, ...result.groups.map((g) => g.averages[i].toFixed(2))])}
      />
      {result.gaps.length > 0 && (
        <Card title="The gap: you compared with each group, largest first">
          <ul className="space-y-2">
            {result.gaps.filter((g) => Math.abs(g.gap) >= 0.5).slice(0, 10).map((g, i) => (
              <li key={i}>
                <span className="font-medium">{g.question}. {SURVEY_STATEMENTS[g.question - 1]}</span>
                <br />
                <span className="text-sm">You: {g.self}. {g.group}: {g.others.toFixed(2)}. Gap {g.gap > 0 ? "+" : ""}{g.gap.toFixed(2)}.{g.aboveHighBelowLow ? " Above rates this high and below rates it low." : ""}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Where the groups disagree by a point or more, you have found a blind spot. Pay closest attention where the people above you rate you high and the people below you rate you low.</p>
        </Card>
      )}
      {result.comments.length > 0 && (
        <Card title="Comments, combined and in no particular order">
          <ul className="list-disc space-y-1 pl-5">{result.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </Card>
      )}
    </div>
  );
}
