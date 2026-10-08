import type { Metadata } from "next";
import { CiPage } from "@cloudigniter/next/client";
import { CiNextResourceCatalogPage } from "@cloudigniter/next/ui/client";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import {
  createResourceDomainAction,
  deleteResourceCatalogRecordAction,
  saveResourceCatalogRecordAction,
  setResourceDomainStatusAction,
  setResourceStatusAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Resources Catalog | CloudIgniter",
  description:
    "Discover and manage the logical and operational resources registered with CloudIgniter.",
};

/** Lists CloudIgniter resources as a first-class dashboard capability. */
export default async function ResourcesCatalogPage() {
  const context = await appBootstrap();
  const resourceReader = appCreateSecurityAdministration(context);
  const definition = await resourceReader.loadDefinition();
  const resources = appCreateSecurityAdministration(context, definition);
  const capabilities = {
    ...resources.capabilities,
    // Route access already guarantees Dashboard read access. Resource catalog
    // discovery is intentionally broader than security administration.
    canRead: true,
  };

  const roleCounters = await resources.loadRoleCounters();
  const records = resources.buildRecords(definition, [], roleCounters);

  return (
    <CiPage
      name="resources-catalog"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Resources Catalog" },
        ],
      }}
      context={context}
    >
      <CiNextResourceCatalogPage
        title="Resources Catalog"
        description="Register CloudIgniter's stable vocabulary for logical and operational capabilities, including domains such as tenants and Org Units and services such as their managers and settings."
        records={records.resource}
        capabilities={capabilities}
        resourceDomains={resources.buildResourceDomains(definition)}
        onSave={saveResourceCatalogRecordAction}
        onDelete={deleteResourceCatalogRecordAction}
        onCreateResourceDomain={createResourceDomainAction}
        onSetResourceDomainStatus={setResourceDomainStatusAction}
        onSetResourceStatus={setResourceStatusAction}
      />
    </CiPage>
  );
}
