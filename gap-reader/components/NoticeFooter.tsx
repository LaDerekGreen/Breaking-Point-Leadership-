import Link from "next/link";
import { currentNotice, DEFAULT_NOTICE, lines } from "@/lib/org/notice";

/** A1: the Notice, shown permanently in the footer of every Organizational Gap Reader page. */
export async function NoticeFooter() {
  const n = await currentNotice();
  const reads = lines(n?.reads ?? DEFAULT_NOTICE.reads);
  const never = lines(n?.neverReads ?? DEFAULT_NOTICE.neverReads);
  return (
    <footer className="mt-16 border-t border-line bg-card" aria-labelledby="notice-footer">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 id="notice-footer" className="font-semibold text-ink">
            Notice{n ? `, version ${n.version}` : ", not yet published"}
          </h2>
          {!n && <p className="text-muted">Nothing is analyzed until the program lead publishes this Notice.</p>}
        </div>
        <div>
          <h3 className="font-medium text-ink">The Gap Reader reads</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{reads.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <div>
          <h3 className="font-medium text-ink">It never</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{never.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <p className="text-muted sm:col-span-2">
          <Link href="/notice">Read the full Notice</Link>
        </p>
      </div>
    </footer>
  );
}
