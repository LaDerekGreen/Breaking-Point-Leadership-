import { Page, Card, fmtDate } from "@/components/ui";
import { NoticeFooter } from "@/components/NoticeFooter";
import { currentNotice, lines } from "@/lib/org/notice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notice" };

export default async function NoticePage() {
  const n = await currentNotice();
  return (
    <>
      <main id="main">
        <Page title="Notice" intro="What the Organizational Gap Reader reads, and what it never reads. Nothing is analyzed before this Notice is published.">
          {!n ? (
            <Card tone="warn">The program lead has not published the Notice yet. Until it is published, the Gap Reader reads nothing.</Card>
          ) : (
            <>
              <p className="text-sm text-muted">Version {n.version}, published {fmtDate(n.publishedAt)}.</p>
              <Card title="It reads">
                <ul className="list-disc space-y-2 pl-5">{lines(n.reads).map((l) => <li key={l}>{l}</li>)}</ul>
              </Card>
              <Card title="It never reads, and never does">
                <ul className="list-disc space-y-2 pl-5">{lines(n.neverReads).map((l) => <li key={l}>{l}</li>)}</ul>
              </Card>
            </>
          )}
        </Page>
      </main>
      <NoticeFooter />
    </>
  );
}
