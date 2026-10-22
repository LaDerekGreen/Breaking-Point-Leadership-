import { CAUTION, CRISIS_NOTICE } from "@/lib/personal/crisis";
import { Card } from "@/components/ui";

/** The book's caution, shown on every Source Inquiry screen. */
export function SourceInquiryCaution() {
  return (
    <Card tone="warn" title={CAUTION.heading}>
      <ul className="list-disc space-y-1 pl-5">{CAUTION.lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </Card>
  );
}

export function CrisisNotice() {
  return (
    <div role="alert">
      <Card tone="danger" title={CRISIS_NOTICE.heading}>
        <ul className="list-disc space-y-1 pl-5 text-lg">{CRISIS_NOTICE.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        <p className="mt-3 text-lg"><a href="tel:988">Call 988</a> · <a href="sms:988">Text 988</a> · <a href="tel:911">Call 911</a></p>
      </Card>
    </div>
  );
}
