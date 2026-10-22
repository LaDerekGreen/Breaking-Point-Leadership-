import { redirect } from "next/navigation";
import { personalUserId } from "@/lib/personal/session";
import { VaultProvider } from "@/components/personal/VaultProvider";
import { PersonalNav } from "@/components/personal/PersonalNav";

export default async function VaultLayout({ children }: { children: React.ReactNode }) {
  if (!(await personalUserId())) redirect("/personal/signin");
  return (
    <VaultProvider>
      <PersonalNav />
      <main id="main">{children}</main>
    </VaultProvider>
  );
}
