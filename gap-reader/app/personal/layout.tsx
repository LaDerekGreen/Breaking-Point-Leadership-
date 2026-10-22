export const dynamic = "force-dynamic";

export const metadata = { title: { default: "Personal Gap Reader", template: "%s · Personal Gap Reader" } };

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="mt-16 border-t border-line bg-card no-print">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
          <p>
            Private by design. Everything you write here is encrypted in your browser under your own passphrase before it is saved. Your AI conversations go from your browser to your own AI provider with your own key. Nothing here can reach any organization&apos;s Gap Reader: separate database, separate account, separate keys.
          </p>
        </div>
      </footer>
    </>
  );
}
