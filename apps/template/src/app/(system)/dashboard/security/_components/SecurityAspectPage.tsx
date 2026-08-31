import { CiPage } from "@cloudigniter/next/client";
import { CiNextSecurityDataPage } from "@cloudigniter/next/ui/client";
import type { CiSecurityRecordKind } from "@cloudigniter/core/types";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";
import {
  deleteSecurityRecordAction,
  saveSecurityRecordAction,
  setSecurityRoleStatusAction,
} from "../actions";
import {
  dashboardBreadcrumbChildren,
  securityBreadcrumbChildren,
} from "../../breadcrumb-menu";

type SecurityAspectPageProps = {
  kind: Exclude<CiSecurityRecordKind, "resource">;
  title: string;
  description: string;
  providerLabel?: string;
};

/** Composes application data and actions with the provider-neutral security UI. */
export async function SecurityAspectPage({
  kind,
  title,
  description,
  providerLabel,
}: SecurityAspectPageProps) {
  const context = await appBootstrap();
  const securityReader = appCreateSecurityAdministration(context);
  const definition = await securityReader.loadDefinition();
  const security = appCreateSecurityAdministration(context, definition);
  const capabilities = security.capabilities;
  if (!capabilities.canRead) {
    throw new Error(
      "You do not have permission to view access-control administration."
    );
  }

  const [assignments, roleCounters] = await Promise.all([
    kind === "assignment" ? security.loadAssignments() : Promise.resolve([]),
    security.loadRoleCounters(),
  ]);
  const records = security.buildRecords(definition, assignments, roleCounters);

  return (
    <CiPage
      name={`security-${kind}`}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          {
            label: "Security",
            href: "/dashboard/security",
            children: securityBreadcrumbChildren,
          },
          { label: title },
        ],
      }}
      context={context}
    >
      <CiNextSecurityDataPage
        kind={kind}
        title={title}
        description={description}
        records={records[kind]}
        capabilities={capabilities}
        providerLabel={providerLabel}
        roleOptions={definition.roles.map((role) => ({
          id: role.id,
          label: `${role.title} (${role.id})`,
          inherits: [...(role.inherits ?? [])],
        }))}
        privilegeOptions={
          kind === "role"
            ? definition.roles.flatMap((role) =>
                role.privileges.map((privilege) => ({
                  id: `${role.id}:${privilege.id}`,
                  label: privilege.title,
                  description: `${role.title} · ${privilege.effect} ${privilege.resource}.${privilege.action}`,
                  sourceRoleId: role.id,
                  privilege: {
                    ...privilege,
                    scopeKinds: [...privilege.scopeKinds],
                  },
                }))
              )
            : undefined
        }
        resourceOptions={definition.resources.map((resource) => ({
          id: resource.id,
          label: resource.title,
          actions: resource.actions.map((action) => action.id),
        }))}
        onSave={
          kind === "identity-group" ? undefined : saveSecurityRecordAction
        }
        onDelete={
          kind === "identity-group" ? undefined : deleteSecurityRecordAction
        }
        onSetRoleStatus={
          kind === "role" ? setSecurityRoleStatusAction : undefined
        }
      />
    </CiPage>
  );
}
