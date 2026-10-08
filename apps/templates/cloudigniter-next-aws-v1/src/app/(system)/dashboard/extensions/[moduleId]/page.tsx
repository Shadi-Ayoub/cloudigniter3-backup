import { forbidden, notFound } from "next/navigation";
import { CiPage } from "@cloudigniter/next/client";
import { appBootstrap } from "@/kernel/server";
import { appModules } from "@/kernel/server/modules/app-modules";
import { appExecuteModule } from "@/kernel/server/modules/app-module-actions";
import { ExtensionPage } from "./view";
import { dashboardBreadcrumbChildren } from "../../breadcrumb-menu";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const context = await appBootstrap();
  const result = await appModules(context).enabled();
  if (!result.ok && result.statusCode === 403) forbidden();
  if (!result.ok) throw new Error(result.body.error);
  const entry = result.body.find((item) => item.manifest.id === moduleId);
  if (!entry) notFound();
  return (
    <CiPage
      name={`module-${moduleId}`}
      context={context}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            i18nKey: "dashboard.title",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: entry.manifest.name },
        ],
      }}
    >
      <ExtensionPage
        id={moduleId}
        configuration={entry.configuration}
        execute={appExecuteModule.bind(null, moduleId)}
      />
    </CiPage>
  );
}
