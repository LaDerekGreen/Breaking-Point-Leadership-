import Link from "next/link";
import { NoticeFooter } from "@/components/NoticeFooter";

export default function Home() {
  return (
    <>
      <main id="main" className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm uppercase tracking-wide text-muted">From Breaking Point Leadership</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Gap Reader</h1>
        <p className="mt-4 text-lg text-muted">
          The gap between the leader you say you are and the leader the record shows. Two separate tools, which never share data.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <section className="rounded-lg border border-line bg-card p-6">
            <h2 className="text-xl font-semibold text-ink">Organizational Gap Reader</h2>
            <p className="mt-2 text-muted">
              For an organization. It reads records the organization already keeps and shows each leader their own pattern privately, before it costs anyone else.
            </p>
            <p className="mt-4"><Link href="/org" className="font-medium">Sign in with your work account</Link></p>
          </section>
          <section className="rounded-lg border border-line bg-card p-6">
            <h2 className="text-xl font-semibold text-ink">Personal Gap Reader</h2>
            <p className="mt-2 text-muted">
              For one leader, alone. The Source Inquiry, the workbook and your own decision log, encrypted under a passphrase only you know.
            </p>
            <p className="mt-4"><Link href="/personal" className="font-medium">Open with a personal account</Link></p>
          </section>
        </div>
        <p className="mt-10 text-sm text-muted">
          Nothing you enter in the Personal Gap Reader can reach the Organizational Gap Reader. They use separate databases, separate accounts and separate keys.
        </p>
      </main>
      <NoticeFooter />
    </>
  );
}
