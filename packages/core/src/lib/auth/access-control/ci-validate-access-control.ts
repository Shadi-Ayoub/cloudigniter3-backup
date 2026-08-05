import type {
  CiAccessControlDefinition,
  CiAccessControlValidationIssue,
  CiAccessScopeKind,
  CiPrivilege,
} from "@ci-core/types";

import { ciMatchesAuthorizationPattern } from "./ci-authorization-pattern";

const CI_AUTHORIZATION_IDENTIFIER = /^[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$/;
const CI_AUTHORIZATION_RESOURCE_IDENTIFIER = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const CI_AUTHORIZATION_ACTION_IDENTIFIER = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const CI_AUTHORIZATION_RESOURCE_PATTERN = /^(?:[a-z][a-z0-9-]*|\*)(?:\.(?:[a-z][a-z0-9-]*|\*))*$/;
const CI_AUTHORIZATION_ACTION_PATTERN = /^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*|\*)$/;
const CI_ACCESS_SCOPE_KINDS = new Set<CiAccessScopeKind>([
  "system",
  "global",
  "tenant",
  "orgUnit",
]);

/** Appends a duplicate-identifier issue for repeated values in a collection. */
function validateUniqueIdentifiers(
  identifiers: readonly string[],
  path: string,
  issues: CiAccessControlValidationIssue[],
): void {
  const seen = new Set<string>();

  for (const identifier of identifiers) {
    if (seen.has(identifier)) {
      issues.push({
        severity: "error",
        code: "duplicate-identifier",
        path,
        message: `Duplicate identifier \"${identifier}\".`,
      });
    }

    seen.add(identifier);
  }
}

/** Validates an identifier and records a structured issue when it is malformed. */
function validateIdentifier(
  identifier: string,
  path: string,
  issues: CiAccessControlValidationIssue[],
  pattern: RegExp = CI_AUTHORIZATION_IDENTIFIER,
): void {
  if (!pattern.test(identifier)) {
    issues.push({
      severity: "error",
      code: "invalid-identifier",
      path,
      message: `Invalid authorization identifier \"${identifier}\".`,
    });
  }
}

/** Validates a non-empty, unique list of access-scope kinds. */
function validateScopeKinds(
  scopeKinds: readonly CiAccessScopeKind[],
  path: string,
  issues: CiAccessControlValidationIssue[],
): void {
  if (scopeKinds.length === 0) {
    issues.push({
      severity: "error",
      code: "empty-list",
      path,
      message: "At least one access scope kind is required.",
    });
  }

  validateUniqueIdentifiers(scopeKinds, path, issues);

  for (const scopeKind of scopeKinds) {
    if (!CI_ACCESS_SCOPE_KINDS.has(scopeKind)) {
      issues.push({
        severity: "error",
        code: "unsupported-scope",
        path,
        message: `Unsupported access scope kind \"${scopeKind}\".`,
      });
    }
  }
}

/** Validates a privilege against the registered resource/action catalog. */
function validatePrivilege(
  privilege: CiPrivilege,
  path: string,
  definition: CiAccessControlDefinition,
  issues: CiAccessControlValidationIssue[],
): void {
  validateIdentifier(privilege.id, `${path}.id`, issues);
  validateScopeKinds(privilege.scopeKinds, `${path}.scopeKinds`, issues);

  if (!CI_AUTHORIZATION_RESOURCE_PATTERN.test(privilege.resource)) {
    validateIdentifier(privilege.resource, `${path}.resource`, issues, CI_AUTHORIZATION_RESOURCE_PATTERN);
  }

  if (!CI_AUTHORIZATION_ACTION_PATTERN.test(privilege.action)) {
    validateIdentifier(privilege.action, `${path}.action`, issues, CI_AUTHORIZATION_ACTION_PATTERN);
  }

  const resources = definition.resources.filter((resource) =>
    ciMatchesAuthorizationPattern(privilege.resource, resource.id),
  );

  if (resources.length === 0) {
    issues.push({
      severity: "error",
      code: "unknown-resource",
      path: `${path}.resource`,
      message: `Resource pattern \"${privilege.resource}\" matches no registered resource.`,
    });
    return;
  }

  const actionExists = resources.some((resource) =>
    resource.actions.some((action) => ciMatchesAuthorizationPattern(privilege.action, action.id)),
  );

  if (!actionExists) {
    issues.push({
      severity: "error",
      code: "unknown-action",
      path: `${path}.action`,
      message: `Action pattern \"${privilege.action}\" matches no action on the selected resources.`,
    });
  }

  for (const scopeKind of privilege.scopeKinds) {
    if (!resources.some((resource) => resource.scopeKinds.includes(scopeKind))) {
      issues.push({
        severity: "error",
        code: "unsupported-scope",
        path: `${path}.scopeKinds`,
        message: `Scope \"${scopeKind}\" is unsupported by the selected resources.`,
      });
    }
  }

  if (privilege.resource === "*" && privilege.action === "*") {
    issues.push({
      severity: "warning",
      code: "broad-wildcard",
      path,
      message: "This privilege covers every registered resource and action, including future matches.",
    });
  }
}

/** Detects inheritance cycles while allowing a role to inherit multiple parents. */
function validateRoleCycles(
  definition: CiAccessControlDefinition,
  issues: CiAccessControlValidationIssue[],
): void {
  const roles = new Map(definition.roles.map((role) => [role.id, role]));
  const completed = new Set<string>();
  const visiting = new Set<string>();

  /** Traverses one role inheritance branch. */
  function visit(roleId: string, path: readonly string[]): void {
    if (completed.has(roleId)) {
      return;
    }

    if (visiting.has(roleId)) {
      issues.push({
        severity: "error",
        code: "role-cycle",
        path: `roles.${roleId}.inherits`,
        message: `Role inheritance cycle detected: ${[...path, roleId].join(" -> ")}.`,
      });
      return;
    }

    visiting.add(roleId);

    for (const inheritedRoleId of roles.get(roleId)?.inherits ?? []) {
      if (roles.has(inheritedRoleId)) {
        visit(inheritedRoleId, [...path, roleId]);
      }
    }

    visiting.delete(roleId);
    completed.add(roleId);
  }

  for (const role of definition.roles) {
    visit(role.id, []);
  }
}

/**
 * Validates resource, action, scope, role, privilege, and inheritance integrity.
 *
 * Warnings do not prevent the catalog from being used; errors do.
 */
export function ciValidateAccessControlDefinition(
  definition: CiAccessControlDefinition,
): readonly CiAccessControlValidationIssue[] {
  const issues: CiAccessControlValidationIssue[] = [];

  validateUniqueIdentifiers(
    definition.domains.map((domain) => domain.id),
    "domains",
    issues,
  );
  validateUniqueIdentifiers(
    definition.resources.map((resource) => resource.id),
    "resources",
    issues,
  );
  validateUniqueIdentifiers(
    definition.roles.map((role) => role.id),
    "roles",
    issues,
  );

  const domainIds = new Set(definition.domains.map((domain) => domain.id));
  const roleIds = new Set(definition.roles.map((role) => role.id));

  for (const [domainIndex, domain] of definition.domains.entries()) {
    validateIdentifier(
      domain.id,
      `domains[${domainIndex}].id`,
      issues,
      CI_AUTHORIZATION_RESOURCE_IDENTIFIER,
    );
  }

  for (const [resourceIndex, resource] of definition.resources.entries()) {
    const path = `resources[${resourceIndex}]`;
    validateIdentifier(resource.id, `${path}.id`, issues, CI_AUTHORIZATION_RESOURCE_IDENTIFIER);
    validateScopeKinds(resource.scopeKinds, `${path}.scopeKinds`, issues);
    validateUniqueIdentifiers(
      resource.actions.map((action) => action.id),
      `${path}.actions`,
      issues,
    );

    if (!domainIds.has(resource.domainId)) {
      issues.push({
        severity: "error",
        code: "unknown-domain",
        path: `${path}.domainId`,
        message: `Unknown resource domain \"${resource.domainId}\".`,
      });
    }

    if (resource.actions.length === 0) {
      issues.push({
        severity: "error",
        code: "empty-list",
        path: `${path}.actions`,
        message: "At least one action is required.",
      });
    }

    for (const [actionIndex, action] of resource.actions.entries()) {
      validateIdentifier(
        action.id,
        `${path}.actions[${actionIndex}].id`,
        issues,
        CI_AUTHORIZATION_ACTION_IDENTIFIER,
      );
    }
  }

  for (const [roleIndex, role] of definition.roles.entries()) {
    const path = `roles[${roleIndex}]`;
    validateIdentifier(role.id, `${path}.id`, issues);
    validateUniqueIdentifiers(
      role.privileges.map((privilege) => privilege.id),
      `${path}.privileges`,
      issues,
    );
    validateUniqueIdentifiers(role.inherits ?? [], `${path}.inherits`, issues);

    if (!Number.isFinite(role.precedence) || role.precedence < 0) {
      issues.push({
        severity: "error",
        code: "invalid-precedence",
        path: `${path}.precedence`,
        message: "Role precedence must be a finite, non-negative number.",
      });
    }

    for (const inheritedRoleId of role.inherits ?? []) {
      if (!roleIds.has(inheritedRoleId)) {
        issues.push({
          severity: "error",
          code: "unknown-role",
          path: `${path}.inherits`,
          message: `Unknown inherited role \"${inheritedRoleId}\".`,
        });
      }
    }

    for (const [privilegeIndex, privilege] of role.privileges.entries()) {
      validatePrivilege(privilege, `${path}.privileges[${privilegeIndex}]`, definition, issues);
    }
  }

  validateRoleCycles(definition, issues);

  return issues;
}

/** Throws when an access-control catalog contains one or more validation errors. */
export function ciAssertValidAccessControlDefinition(definition: CiAccessControlDefinition): void {
  const errors = ciValidateAccessControlDefinition(definition).filter(
    (issue) => issue.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(
      `Invalid CloudIgniter access-control definition:\n${errors
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
  }
}

/** Defines and validates an access-control catalog while preserving literal types. */
export function ciDefineAccessControl<const Definition extends CiAccessControlDefinition>(
  definition: Definition,
): Definition {
  ciAssertValidAccessControlDefinition(definition);
  return definition;
}
