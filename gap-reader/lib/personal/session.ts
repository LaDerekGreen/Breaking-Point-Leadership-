import "server-only";
import { auth } from "./auth";

/** The signed-in personal user's ID, from the personal session table only. */
export async function personalUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}
