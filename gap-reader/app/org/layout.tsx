import { OrgNav } from "@/components/OrgNav";
import { NoticeFooter } from "@/components/NoticeFooter";
import { currentOrgUser } from "@/lib/org/session";

export const dynamic = "force-dynamic";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const user = await currentOrgUser();
  return (
    <>
      <OrgNav user={user} />
      <main id="main">{children}</main>
      <NoticeFooter />
    </>
  );
}
