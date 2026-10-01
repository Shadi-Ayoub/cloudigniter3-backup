import type {
  CiAccessControlDefinition,
  CiAuthorizationRequest,
  CiAuthorizerOptions,
} from "../../types";
import { ciCreateAuthorizer } from "./ci-create-authorizer";

/**
 * Presentation evidence only: retained grants would allow one of these requests
 * if administrative role/resource/domain suspensions were lifted. Never use this
 * diagnostic result to grant access or persist the hypothetical policy.
 */
export function ciIsAuthorizationSuspended(
  definition: CiAccessControlDefinition,
  requests: readonly CiAuthorizationRequest[],
  options: CiAuthorizerOptions = {}
): boolean {
  if (
    !requests.length ||
    requests.some(({ subject }) => !subject.authenticated || !subject.id)
  )
    return false;

  if (
    ![...definition.roles, ...definition.resources, ...definition.domains].some(
      (entry) => entry.status === "suspended"
    )
  )
    return false;

  // Keep grant windows identical across the real and hypothetical evaluations.
  const now = (options.clock ?? (() => new Date()))();
  const evaluationOptions = { ...options, clock: () => now };
  const current = ciCreateAuthorizer(definition, evaluationOptions);
  const decisions = requests.map((request) => current.authorize(request));
  if (
    decisions.some(
      (decision) => decision.allowed || decision.reason === "read-only"
    )
  )
    return false;

  const restored: CiAccessControlDefinition = {
    ...definition,
    domains: definition.domains.map((entry) => ({
      ...entry,
      status: "active",
    })),
    resources: definition.resources.map((entry) => ({
      ...entry,
      status: "active",
    })),
    roles: definition.roles.map((entry) => ({ ...entry, status: "active" })),
  };
  const hypothetical = ciCreateAuthorizer(restored, evaluationOptions);
  return requests.some((request) => hypothetical.can(request));
}
