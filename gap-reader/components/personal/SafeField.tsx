"use client";

import { nameWarning } from "@/lib/personal/sanitize";
import { Field, Input, Textarea } from "@/components/ui";

/** A text field that reminds the user to describe people by role and warns on likely names. */
export function SafeField({ id, label, hint, value, onChange, rows, required }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; required?: boolean }) {
  const warn = nameWarning(value);
  return (
    <Field id={id} label={label} hint={hint}>
      {rows && rows > 1 ? (
        <Textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} required={required} aria-describedby={warn ? `${id}-warn` : undefined} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} aria-describedby={warn ? `${id}-warn` : undefined} />
      )}
      {warn && <p id={`${id}-warn`} className="text-sm text-warn">{warn}</p>}
    </Field>
  );
}
