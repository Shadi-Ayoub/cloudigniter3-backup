import { SecurityAspectPage } from "../_components/SecurityAspectPage";

/** Lists and manages the resources and actions used by authorization checks. */
export default function ResourcesPage() {
  return (
    <SecurityAspectPage
      kind="resource"
      title="Resource catalog"
      description="Keep the authorization vocabulary stable and discoverable across domains, business actions, and system or tenant boundaries."
    />
  );
}
