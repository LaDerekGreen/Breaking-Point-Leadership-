import { signOut } from "@/lib/personal/auth";

export async function POST() {
  await signOut({ redirectTo: "/personal/signin" });
}
