import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { orgDb } from "./db";
import { currentNotice, hasAcknowledgedCurrent } from "./notice";
import type { Role } from "./roles";

export type OrgUser = { id: string; email: string; name: string | null; roles: Role[]; personId: string | null };

export async function currentOrgUser(): Promise<OrgUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await orgDb.user.findUnique({ where: { id: session.user.id } });
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, roles: u.roles as Role[], personId: u.personId };
}

/** Signed in, and (unless it is the program lead setting up) the Notice acknowledged. */
export async function requireOrgUser(opts: { roles?: Role[]; skipNotice?: boolean } = {}): Promise<OrgUser> {
  const u = await currentOrgUser();
  if (!u) redirect("/org/signin");
  if (opts.roles && !opts.roles.some((r) => u.roles.includes(r))) redirect("/org?denied=1");
  if (!opts.skipNotice) {
    const notice = await currentNotice();
    if (!notice) {
      if (u.roles.includes("program_lead")) redirect("/org/lead/notice");
      redirect("/org/waiting");
    }
    if (!(await hasAcknowledgedCurrent(u.id))) redirect("/org/acknowledge");
  }
  return u;
}

/** For server actions: the same checks, thrown instead of redirected. */
export async function actionUser(roles?: Role[]): Promise<OrgUser> {
  const u = await currentOrgUser();
  if (!u) throw new Error("Please sign in.");
  if (roles && !roles.some((r) => u.roles.includes(r))) throw new Error("You do not have access to this.");
  return u;
}
