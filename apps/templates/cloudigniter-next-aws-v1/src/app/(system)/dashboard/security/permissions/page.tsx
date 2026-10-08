import { SecurityAspectPage } from "../_components/SecurityAspectPage";

/** Lists and manages privileges attached to the effective role catalog. */
export default function PermissionsPage() {
  return (
    <SecurityAspectPage
      kind="permission"
      title="Permissions"
      description="Manage explicit allow and deny statements across registered resources, actions, and supported access scopes."
    />
  );
}
