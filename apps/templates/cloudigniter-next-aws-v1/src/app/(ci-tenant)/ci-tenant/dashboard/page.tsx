import { CiPage } from "@cloudigniter/next/client";

import { appBootstrap } from "@/kernel/server";

/**
 * Temporary Tenant route placeholder.
 *
 * Remove this once concrete Tenant-scoped pages are implemented.
 */
export default async function CiTenantDashboardPage() {
  const context = await appBootstrap();

  return (
    <CiPage
      name="tenant-dashboard-homepage"
      setup={{ showPageHeader: false }}
      context={context}
    >
      <main className="flex min-h-full flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Workspace dashboard
          </p>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            View recent activity, manage your workspace, and access the tools
            available to your organization.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Quick Access
            </p>
            <p className="mt-3 text-2xl font-semibold">Dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your central workspace overview.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Notifications
            </p>
            <p className="mt-3 text-2xl font-semibold">0</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You are all caught up.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Getting started</h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this area to introduce the primary actions, reports, and tools
              available in your application.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <h3 className="font-medium">Explore your workspace</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review available modules and workspace settings.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <h3 className="font-medium">Manage your account</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update profile preferences and account access.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Recent activity</h2>

            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-primary pl-3">
                <p className="text-sm font-medium">
                  Workspace loaded successfully
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your dashboard is ready.
                </p>
              </div>

              <div className="border-l-2 border-muted pl-3">
                <p className="text-sm font-medium">No recent actions</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Activity will appear here as you use the application.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </CiPage>
  );
}
