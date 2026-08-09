import type {
  CiAccessControlDefinition,
  CiAuthorizationBatchRequest,
  CiAuthorizationDecision,
  CiAuthorizationMatch,
  CiAuthorizationRequest,
  CiAuthorizer,
  CiAuthorizerOptions,
  CiPrivilege,
  CiRoleDefinition,
} from "../../types";
import type { CiResolvedRolePrivilege } from "../../types/access-control-types/CiResolvedRolePrivilege";

import { ciAccessScopeContains } from "./ci-access-scope";
import { ciMatchesAuthorizationPattern } from "./ci-authorization-pattern";
import { CI_DEFAULT_ACCESS_CONTROL_DEFINITION } from "./ci-default-access-control";
import { ciAssertValidAccessControlDefinition } from "./ci-validate-access-control";

/** Returns whether a time-bounded grant is active at the supplied instant. */
function isGrantActive(
  grant: { validFrom?: string; expiresAt?: string },
  now: number,
): boolean {
  const validFrom = grant.validFrom === undefined ? null : Date.parse(grant.validFrom);
  const expiresAt = grant.expiresAt === undefined ? null : Date.parse(grant.expiresAt);

  if (validFrom !== null && (!Number.isFinite(validFrom) || now < validFrom)) {
    return false;
  }

  return expiresAt === null || (Number.isFinite(expiresAt) && now < expiresAt);
}

/** Orders matching evidence deterministically for logs, tests, and admin tooling. */
function sortMatches(matches: readonly CiAuthorizationMatch[]): CiAuthorizationMatch[] {
  return [...matches].sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "direct" ? -1 : 1;
    }

    const leftPrecedence = left.precedence ?? Number.NEGATIVE_INFINITY;
    const rightPrecedence = right.precedence ?? Number.NEGATIVE_INFINITY;

    if (leftPrecedence !== rightPrecedence) {
      return leftPrecedence - rightPrecedence;
    }

    if (left.privilege.effect !== right.privilege.effect) {
      return left.privilege.effect === "deny" ? -1 : 1;
    }

    return left.privilege.id.localeCompare(right.privilege.id);
  });
}

/** Creates a consistent deny result for a non-policy authorization failure. */
function deny(
  reason: CiAuthorizationDecision["reason"],
  evaluatedRoleIds: readonly string[] = [],
): CiAuthorizationDecision {
  return {
    allowed: false,
    effect: "deny",
    reason,
    matches: [],
    decidingMatches: [],
    evaluatedRoleIds,
  };
}

/** Selects the privilege evidence that determines the final result. */
function selectDecidingMatches(
  matches: readonly CiAuthorizationMatch[],
  algorithm: NonNullable<CiAuthorizerOptions["combiningAlgorithm"]>,
): readonly CiAuthorizationMatch[] {
  if (algorithm === "deny-overrides") {
    const denies = matches.filter((match) => match.privilege.effect === "deny");
    return denies.length > 0
      ? denies
      : matches.filter((match) => match.privilege.effect === "allow");
  }

  const highestPrecedence = Math.min(
    ...matches.map((match) => match.precedence ?? Number.NEGATIVE_INFINITY),
  );
  const highestTier = matches.filter(
    (match) => (match.precedence ?? Number.NEGATIVE_INFINITY) === highestPrecedence,
  );
  const denies = highestTier.filter((match) => match.privilege.effect === "deny");

  return denies.length > 0
    ? denies
    : highestTier.filter((match) => match.privilege.effect === "allow");
}

/** Compiles inherited privileges once for efficient repeated checks. */
function compileRolePrivileges(
  roles: ReadonlyMap<string, CiRoleDefinition>,
): ReadonlyMap<string, readonly CiResolvedRolePrivilege[]> {
  const compiled = new Map<string, readonly CiResolvedRolePrivilege[]>();

  /** Resolves one role and all of its inherited privilege declarations. */
  function resolve(
    roleId: string,
    visiting: ReadonlySet<string>,
  ): readonly CiResolvedRolePrivilege[] {
    const cached = compiled.get(roleId);

    if (cached) {
      return cached;
    }

    if (visiting.has(roleId)) {
      return [];
    }

    const role = roles.get(roleId);

    if (!role) {
      return [];
    }

    const nextVisiting = new Set(visiting).add(roleId);
    const privileges: CiResolvedRolePrivilege[] = role.privileges.map((privilege) => ({
      privilege,
      privilegeRoleId: role.id,
    }));

    for (const inheritedRoleId of role.inherits ?? []) {
      privileges.push(...resolve(inheritedRoleId, nextVisiting));
    }

    compiled.set(roleId, privileges);
    return privileges;
  }

  for (const roleId of roles.keys()) {
    resolve(roleId, new Set());
  }

  return compiled;
}

/** Checks whether one privilege applies to the requested resource/action/scope. */
function privilegeMatches(privilege: CiPrivilege, request: CiAuthorizationRequest): boolean {
  return (
    privilege.scopeKinds.includes(request.scope.kind) &&
    ciMatchesAuthorizationPattern(privilege.resource, request.resource) &&
    ciMatchesAuthorizationPattern(privilege.action, request.action)
  );
}

/**
 * Creates a compiled, provider-neutral ARBAC authorizer.
 *
 * The authorizer denies by default. Under the default combining algorithm any
 * matching deny wins. The optional highest-precedence algorithm first selects
 * direct privileges or the numerically lowest role precedence, then applies
 * deny-overrides within that tier.
 */
export function ciCreateAuthorizer(
  definition: CiAccessControlDefinition,
  options: CiAuthorizerOptions = {},
): CiAuthorizer {
  if (options.validateDefinition !== false) {
    ciAssertValidAccessControlDefinition(definition);
  }

  const resources = new Map(definition.resources.map((resource) => [resource.id, resource]));
  const roles = new Map(definition.roles.map((role) => [role.id, role]));
  const compiledRolePrivileges = compileRolePrivileges(roles);
  const algorithm = options.combiningAlgorithm ?? "deny-overrides";
  const clock = options.clock ?? (() => new Date());

  /** Evaluates one resource/action request and returns auditable policy evidence. */
  function authorize(request: CiAuthorizationRequest): CiAuthorizationDecision {
    const resource = resources.get(request.resource);

    if (!resource) {
      return deny("unknown-resource");
    }

    if (!resource.actions.some((action) => action.id === request.action)) {
      return deny("unknown-action");
    }

    if (!resource.scopeKinds.includes(request.scope.kind)) {
      return deny("unsupported-scope");
    }

    if (!request.subject.authenticated || !request.subject.id) {
      return deny("unauthenticated");
    }

    const now = clock().getTime();
    const evaluatedRoleIds: string[] = [];
    const matches: CiAuthorizationMatch[] = [];

    for (const assignment of request.subject.roleAssignments) {
      const role = roles.get(assignment.roleId);

      if (
        !role ||
        !isGrantActive(assignment, now) ||
        !ciAccessScopeContains(assignment.scope, request.scope, assignment.propagation)
      ) {
        continue;
      }

      if (!evaluatedRoleIds.includes(role.id)) {
        evaluatedRoleIds.push(role.id);
      }

      for (const resolved of compiledRolePrivileges.get(role.id) ?? []) {
        if (!privilegeMatches(resolved.privilege, request)) {
          continue;
        }

        matches.push({
          source: "role",
          privilege: resolved.privilege,
          assignmentScope: assignment.scope,
          assignedRoleId: role.id,
          privilegeRoleId: resolved.privilegeRoleId,
          precedence: role.precedence,
        });
      }
    }

    for (const directPrivilege of request.subject.directPrivileges ?? []) {
      if (
        !isGrantActive(directPrivilege, now) ||
        !ciAccessScopeContains(
          directPrivilege.scope,
          request.scope,
          directPrivilege.propagation,
        ) ||
        !privilegeMatches(directPrivilege.privilege, request)
      ) {
        continue;
      }

      matches.push({
        source: "direct",
        privilege: directPrivilege.privilege,
        assignmentScope: directPrivilege.scope,
        precedence: null,
      });
    }

    if (matches.length === 0) {
      const hasScopedGrant =
        evaluatedRoleIds.length > 0 ||
        (request.subject.directPrivileges ?? []).some(
          (directPrivilege) =>
            isGrantActive(directPrivilege, now) &&
            ciAccessScopeContains(
              directPrivilege.scope,
              request.scope,
              directPrivilege.propagation,
            ),
        );

      return deny(
        hasScopedGrant ? "no-matching-privilege" : "no-role-assignment",
        evaluatedRoleIds,
      );
    }

    const sortedMatches = sortMatches(matches);
    const decidingMatches = selectDecidingMatches(sortedMatches, algorithm);
    const allowed = decidingMatches.every((match) => match.privilege.effect === "allow");

    return {
      allowed,
      effect: allowed ? "allow" : "deny",
      reason: allowed ? "allowed" : "explicit-deny",
      matches: sortedMatches,
      decidingMatches,
      evaluatedRoleIds,
    };
  }

  /** Returns only the boolean result for one authorization request. */
  function can(request: CiAuthorizationRequest): boolean {
    return authorize(request).allowed;
  }

  /** Returns true when at least one non-empty batch requirement is allowed. */
  function canAny(request: CiAuthorizationBatchRequest): boolean {
    return (
      request.requirements.length > 0 &&
      request.requirements.some((requirement) =>
        can({
          subject: request.subject,
          scope: request.scope,
          ...requirement,
        }),
      )
    );
  }

  /** Returns true when every requirement in a non-empty batch is allowed. */
  function canAll(request: CiAuthorizationBatchRequest): boolean {
    return (
      request.requirements.length > 0 &&
      request.requirements.every((requirement) =>
        can({
          subject: request.subject,
          scope: request.scope,
          ...requirement,
        }),
      )
    );
  }

  return {
    definition,
    authorize,
    can,
    canAny,
    canAll,
  };
}

/**
 * Creates an application authorizer from a resolved access-control catalog.
 *
 * The core default catalog is used when no definition is supplied. Applications
 * normally pass the result of `ciCreateAppAccessControl()`.
 */
export function ciCreateAppAuthorizer(
  definition: CiAccessControlDefinition = CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  options: CiAuthorizerOptions = {},
): CiAuthorizer {
  return ciCreateAuthorizer(definition, options);
}

/** Evaluates one request without retaining a compiled authorizer instance. */
export function ciAuthorize(
  request: CiAuthorizationRequest,
  definition: CiAccessControlDefinition,
  options: CiAuthorizerOptions = {},
): CiAuthorizationDecision {
  return ciCreateAuthorizer(definition, options).authorize(request);
}

/** Evaluates one request and returns only whether access is allowed. */
export function ciCan(
  request: CiAuthorizationRequest,
  definition: CiAccessControlDefinition,
  options: CiAuthorizerOptions = {},
): boolean {
  return ciCreateAuthorizer(definition, options).can(request);
}

/** Evaluates a batch and returns whether at least one requirement is allowed. */
export function ciCanAny(
  request: CiAuthorizationBatchRequest,
  definition: CiAccessControlDefinition,
  options: CiAuthorizerOptions = {},
): boolean {
  return ciCreateAuthorizer(definition, options).canAny(request);
}

/** Evaluates a batch and returns whether every non-empty requirement is allowed. */
export function ciCanAll(
  request: CiAuthorizationBatchRequest,
  definition: CiAccessControlDefinition,
  options: CiAuthorizerOptions = {},
): boolean {
  return ciCreateAuthorizer(definition, options).canAll(request);
}
