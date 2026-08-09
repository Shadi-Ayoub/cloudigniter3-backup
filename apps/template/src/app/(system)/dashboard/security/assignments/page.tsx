import { SecurityAspectPage } from "../_components/SecurityAspectPage";

/** Lists and manages persisted scoped role assignments. */
export default function AssignmentsPage() {
  return (
    <SecurityAspectPage
      kind="assignment"
      title="Role assignments"
      description="Grant reusable roles to subjects at a precise boundary, with explicit propagation and optional expiry."
    />
  );
}
