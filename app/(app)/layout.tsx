import { AppNav } from "@/components/app-nav";

// Every working page (new run, runs, outbox, accounts, search) shares the top bar with search.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pt-10">{children}</div>
    </>
  );
}
