import { redirect } from "next/navigation";

/** Redirect back to a page with a short message, so forms work without client script. */
export function back(path: string, msg: string, kind: "msg" | "err" = "msg"): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
}

export type Flash = { msg?: string; err?: string };
