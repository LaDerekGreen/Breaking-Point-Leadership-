import Link from "next/link";
import type { OrgUser } from "@/lib/org/session";

export function OrgNav({ user }: { user: OrgUser | null }) {
  const links: { href: string; label: string }[] = [];
  if (user) {
    links.push({ href: "/org", label: "Home" });
    if (user.roles.includes("program_lead")) links.push({ href: "/org/lead", label: "Program lead" });
    if (user.roles.includes("leader")) links.push({ href: "/org/leader", label: "My reports" });
    links.push({ href: "/org/survey", label: "Surveys" });
    if (user.roles.includes("senior_reviewer")) links.push({ href: "/org/review", label: "Senior review" });
    if (user.roles.includes("board_reviewer")) links.push({ href: "/org/board", label: "Board" });
  }
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/org" className="font-serif text-lg text-ink no-underline">Organizational Gap Reader</Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
          {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        {user && (
          <form action="/org/signout" method="post">
            <button className="text-sm text-muted underline underline-offset-2">Sign out</button>
          </form>
        )}
      </div>
    </header>
  );
}
