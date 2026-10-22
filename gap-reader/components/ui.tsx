import Link from "next/link";
import type { ReactNode } from "react";

export function Page({ title, intro, children, back }: { title: string; intro?: ReactNode; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {back && (
        <p className="mb-4 text-sm">
          <Link href={back.href}>{back.label}</Link>
        </p>
      )}
      <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
      {intro && <div className="prose-plain mt-3 text-lg text-muted">{intro}</div>}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function Card({ title, children, tone = "plain" }: { title?: ReactNode; children: ReactNode; tone?: "plain" | "accent" | "warn" | "danger" }) {
  const tones = {
    plain: "bg-card border-line",
    accent: "bg-accent-soft border-accent/40",
    warn: "bg-warn-soft border-warn/40",
    danger: "bg-danger-soft border-danger/40",
  };
  return (
    <section className={`rounded-lg border p-5 ${tones[tone]}`}>
      {title && <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>}
      <div className="prose-plain text-ink">{children}</div>
    </section>
  );
}

export function Button({ children, variant = "primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const v = {
    primary: "bg-accent text-accent-ink border-accent hover:opacity-90",
    secondary: "bg-card text-ink border-line hover:border-accent",
    danger: "bg-card text-danger border-danger hover:bg-danger-soft",
  };
  return (
    <button {...rest} className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 font-medium disabled:opacity-50 ${v[variant]} ${rest.className ?? ""}`}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const v = { primary: "bg-accent text-accent-ink border-accent", secondary: "bg-card text-ink border-line" };
  return (
    <Link href={href} className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 font-medium no-underline ${v[variant]}`}>
      {children}
    </Link>
  );
}

export function Field({ label, hint, children, id }: { label: string; hint?: ReactNode; children: ReactNode; id: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium text-ink">
        {label}
      </label>
      {hint && <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p>}
      {children}
    </div>
  );
}

export const inputClass = "w-full rounded-md border border-line bg-card px-3 py-2 text-ink placeholder:text-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} min-h-11 ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} min-h-11 ${props.className ?? ""}`} />;
}

export function Flash({ message, tone = "accent" }: { message?: string | null; tone?: "accent" | "warn" | "danger" }) {
  if (!message) return null;
  return (
    <div role="status" className="whitespace-pre-line">
      <Card tone={tone}>{message}</Card>
    </div>
  );
}

export function Table({ head, rows, caption }: { head: ReactNode[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2 font-semibold text-ink">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={head.length} className="px-3 py-4 text-muted">Nothing yet.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0 align-top">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 text-ink">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
