import { SecurityAspectPage } from "../_components/SecurityAspectPage";

/** Lists and manages core-protected and application-owned roles. */
export default function RolesPage() {
  return (
    <SecurityAspectPage
      kind="role"
      title="Roles"
      description="Create focused application roles, review inheritance and precedence, and temporarily suspend a role during incident investigation without deleting its assignments."
    />
  );
}
