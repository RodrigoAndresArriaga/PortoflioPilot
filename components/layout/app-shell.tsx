import type { Profile } from "@/types/database";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

type AppShellProps = {
  profile: Profile;
  email?: string | null;
  pageTitle?: string;
  children: React.ReactNode;
};

export function AppShell({
  profile,
  email,
  pageTitle = "Dashboard",
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav profile={profile} email={email} pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
