import type { Profile } from "@/types/database";
import type { PortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";

import { AppBanners } from "./app-banners";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

type AppShellProps = {
  profile: Profile;
  email?: string | null;
  pageTitle?: string;
  lifecycle?: PortfolioLifecycleSnapshot | null;
  children: React.ReactNode;
};

export function AppShell({
  profile,
  email,
  pageTitle = "Dashboard",
  lifecycle = null,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav profile={profile} email={email} pageTitle={pageTitle} />
        <AppBanners profile={profile} lifecycle={lifecycle} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
