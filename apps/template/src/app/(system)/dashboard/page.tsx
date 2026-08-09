import { CiPage } from "@cloudigniter/next/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import { appBootstrap } from "@/kernel/server";
import { setup } from "./setup";

export default async function CPHomePage() {
  const context = await appBootstrap();
  const roleLabel =
    context.auth.user.primaryRole?.replaceAll("_", " ") ?? "Authenticated user";

  return (
    <CiPage
      name={"dashboard-homepage"}
      setup={{ showPageHeader: false }}
      context={context}
    >
      <CiNextDashboardOverview
        setup={setup}
        eyebrow="Administration workspace"
        title="Control center"
        description="A focused view of the people, policy, tenants, and platform services that keep your application operating securely."
        aside={
          <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Current access
            </p>
            <p className="mt-1 font-semibold capitalize text-foreground">
              {roleLabel.toLowerCase()}
            </p>
          </div>
        }
      />
    </CiPage>
  );
}
