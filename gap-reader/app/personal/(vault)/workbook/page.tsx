import Link from "next/link";
import { Page, Card } from "@/components/ui";
import { WORKBOOK } from "@/lib/book/workbook";

export const metadata = { title: "Workbook" };

export default function Workbook() {
  return (
    <Page title={WORKBOOK.title} intro={<>{WORKBOOK.intro.map((p) => <p key={p}>{p}</p>)}</>}>
      <ol className="space-y-3">
        {WORKBOOK.exercises.map((e) => (
          <li key={e.id}>
            <Link href={e.id === 9 ? "/personal/plan" : `/personal/workbook/${e.id}`} className="block rounded-lg border border-line bg-card p-4 no-underline hover:border-accent">
              <span className="font-semibold text-accent">Exercise {e.id}. {e.title}</span>
              <span className="mt-1 block text-sm text-muted">{e.time}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Card title="A final word">{WORKBOOK.finalWord.map((p) => <p key={p}>{p}</p>)}</Card>
    </Page>
  );
}
