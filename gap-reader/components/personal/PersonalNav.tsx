"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVault } from "./VaultProvider";

const LINKS = [
  { href: "/personal", label: "Home" },
  { href: "/personal/log", label: "Decision log" },
  { href: "/personal/checkin", label: "Weekly check-in" },
  { href: "/personal/inquiry", label: "Source Inquiry" },
  { href: "/personal/workbook", label: "Workbook" },
  { href: "/personal/plan", label: "Ninety day plan" },
  { href: "/personal/export", label: "Export and delete" },
  { href: "/personal/settings", label: "Settings" },
];

export function PersonalNav() {
  const path = usePathname();
  const { status, lock } = useVault();
  return (
    <header className="border-b border-line bg-card no-print">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/personal" className="font-serif text-lg text-ink no-underline">Personal Gap Reader</Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined} className={path === l.href ? "font-semibold" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3 text-sm">
          {status === "unlocked" && <button onClick={() => void lock()} className="text-muted underline underline-offset-2">Lock</button>}
          <form action="/personal/signout" method="post"><button className="text-muted underline underline-offset-2">Sign out</button></form>
        </div>
      </div>
    </header>
  );
}
