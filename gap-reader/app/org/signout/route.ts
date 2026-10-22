import { signOut } from "@/lib/org/auth";

export async function POST() {
  await signOut({ redirectTo: "/org/signin" });
}
