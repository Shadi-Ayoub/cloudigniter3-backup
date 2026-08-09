import { SecurityAspectPage } from "../_components/SecurityAspectPage";

/** Shows provider group mappings without leaking provider APIs into shared UI. */
export default function IdentityGroupsPage() {
  return (
    <SecurityAspectPage
      kind="identity-group"
      title="Identity-provider groups"
      description="Compare trusted provider groups with CloudIgniter roles and detect mapping or precedence drift. Tenant and Org Unit grants remain in scoped application assignments."
      providerLabel="Amazon Cognito"
    />
  );
}
