import { CiPage } from "@cloudigniter/next/client";
import { CiNextSecurityDataPage } from "@cloudigniter/next/ui/client";
import type { CiSecurityRecordKind } from "@cloudigniter/core/types";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";
import {
  deleteSecurityRecordAction,
  saveSecurityRecordAction,
} from "../actions";

type SecurityAspectPageProps = {
  kind: CiSecurityRecordKind;
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
  const security = appCreateSecurityAdministration(context);
  const capabilities = security.capabilities;
  if (!capabilities.canRead) {
    throw new Error(
      "You do not have permission to view access-control administration."
    );
  }

  const [definition, assignments] = await Promise.all([
    security.loadDefinition(),
    kind === "assignment" ? security.loadAssignments() : Promise.resolve([]),
  ]);
  const records = security.buildRecords(definition, assignments);

  return (
    <CiPage
      name={`security-${kind}`}
      setup={{
        showPageHeader: false,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Security", href: "/dashboard/security" },
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
        }))}
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
      />
    </CiPage>
  );
}
