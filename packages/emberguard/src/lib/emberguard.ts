import type {
  CiAccessControlDefinition,
  CiAuthorizationRequest,
  CiAuthorizationSubject,
  CiAuthorizer,
  CiAuthorizerOptions,
  CiEmberguardAccessControlState,
} from "../types";
import type {
  CiEmberguardCustomDomainRecord,
  CiEmberguardOptions,
  CiEmberguardProvider,
  CiEmberguardResourceInventoryRecord,
  CiEmberguardStoredRoleAssignment,
} from "../types/provider-types";

import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciAssertValidAccessControlDefinition,
  ciCreateAuthorizer,
  ciIsAccessControlKebabIdentifier,
  ciMigrateLegacyPrivilegeTitles,
} from "./access-control";
import { ciBuildSecurityRoleCounters } from "./security-administration";

/** Rejects role assignments that do not use the canonical identifier contract. */
function assertCanonicalRoleId(roleId: string): void {
  if (!ciIsAccessControlKebabIdentifier(roleId)) {
    throw new Error(
      `Role identifier "${roleId}" must use lowercase kebab case.`
    );
  }
}

/** Validates role identifiers returned by a persistence provider. */
function assertCanonicalRoleAssignments(
  assignments: readonly CiEmberguardStoredRoleAssignment[]
): void {
  for (const assignment of assignments) {
    assertCanonicalRoleId(assignment.roleId);
  }
}

export class Emberguard {
  readonly provider: CiEmberguardProvider;

  private definition: CiAccessControlDefinition;

  private authorizer?: CiAuthorizer;

  constructor(
    provider: CiEmberguardProvider,
    options: CiEmberguardOptions = {}
  ) {
    this.provider = provider;
    this.definition =
      options.definition ?? CI_DEFAULT_ACCESS_CONTROL_DEFINITION;
  }

  getDefinition(): CiAccessControlDefinition {
    return this.definition;
  }

  setDefinition(definition: CiAccessControlDefinition): void {
    this.definition = definition;
    this.authorizer = undefined;
  }

  createAuthorizer(options?: CiAuthorizerOptions): CiAuthorizer {
    return ciCreateAuthorizer(this.definition, options);
  }

  authorize(request: CiAuthorizationRequest, options?: CiAuthorizerOptions) {
    const authorizer = options
      ? this.createAuthorizer(options)
      : this.getAuthorizer();
    return authorizer.authorize(request);
  }

  can(request: CiAuthorizationRequest, options?: CiAuthorizerOptions): boolean {
    return this.authorize(request, options).allowed;
  }

  async loadAccessControlState(): Promise<CiEmberguardAccessControlState> {
    return (await this.ensureAccessControlState()).state;
  }

  /** Ensures that the canonical state exists and reports whether it was created. */
  async ensureAccessControlState(): Promise<{
    state: CiEmberguardAccessControlState;
    created: boolean;
  }> {
    const stored = await this.provider.repository.getAccessControlState();
    if (stored) {
      return { state: this.useAccessControlState(stored), created: false };
    }

    const assignments = await this.listRoleAssignments({});
    const initialized =
      await this.provider.repository.initializeAccessControlState({
        definition: this.definition,
        roleCounters: ciBuildSecurityRoleCounters(this.definition, assignments),
        revision: 0,
      });
    return {
      state: this.useAccessControlState(initialized.state),
      created: initialized.created,
    };
  }

  async loadDefinition(): Promise<CiAccessControlDefinition> {
    return (await this.loadAccessControlState()).definition;
  }

  async saveDefinition(
    definition: CiAccessControlDefinition = this.definition
  ): Promise<void> {
    ciAssertValidAccessControlDefinition(definition);
    const [state, assignments] = await Promise.all([
      this.loadAccessControlState(),
      this.listRoleAssignments({}),
    ]);
    await this.provider.repository.saveAccessControlState(
      {
        definition,
        roleCounters: ciBuildSecurityRoleCounters(definition, assignments),
        revision: state.revision + 1,
      },
      state.revision
    );
    this.setDefinition(definition);
  }

  async loadSubject(input: {
    subjectId: string;
    tenantId?: string;
    authenticated?: boolean;
    directPrivileges?: CiAuthorizationSubject["directPrivileges"];
  }): Promise<CiAuthorizationSubject> {
    const roleAssignments = await this.provider.repository.listRoleAssignments({
      subjectId: input.subjectId,
      tenantId: input.tenantId,
    });
    assertCanonicalRoleAssignments(roleAssignments);

    return {
      id: input.subjectId,
      authenticated: input.authenticated ?? true,
      roleAssignments,
      directPrivileges: input.directPrivileges ?? [],
    };
  }

  async listRoleAssignments(input: { subjectId?: string; tenantId?: string }) {
    const assignments = await this.provider.repository.listRoleAssignments(
      input
    );
    assertCanonicalRoleAssignments(assignments);
    return assignments;
  }

  async putRoleAssignment(assignment: CiEmberguardStoredRoleAssignment) {
    assertCanonicalRoleId(assignment.roleId);
    const [state, assignments] = await Promise.all([
      this.loadAccessControlState(),
      this.listRoleAssignments({}),
    ]);
    const previousAssignment = assignments.find(
      (current) => current.id === assignment.id
    );
    const nextAssignments = assignments.filter(
      (current) => current.id !== assignment.id
    );
    nextAssignments.push(assignment);
    const nextState = {
      definition: state.definition,
      roleCounters: ciBuildSecurityRoleCounters(
        state.definition,
        nextAssignments
      ),
      revision: state.revision + 1,
    };
    await this.provider.repository.putRoleAssignmentWithAccessControlState(
      assignment,
      nextState,
      state.revision,
      previousAssignment
    );
  }

  async deleteRoleAssignment(input: { id: string; subjectId: string }) {
    const [state, assignments] = await Promise.all([
      this.loadAccessControlState(),
      this.listRoleAssignments({}),
    ]);
    const nextAssignments = assignments.filter(
      (assignment) =>
        assignment.id !== input.id || assignment.subjectId !== input.subjectId
    );
    const nextState = {
      definition: state.definition,
      roleCounters: ciBuildSecurityRoleCounters(
        state.definition,
        nextAssignments
      ),
      revision: state.revision + 1,
    };
    await this.provider.repository.deleteRoleAssignmentWithAccessControlState(
      input,
      nextState,
      state.revision
    );
  }

  listResourceInventory(input?: { tenantId?: string; domainId?: string }) {
    return this.provider.repository.listResourceInventory(input);
  }

  putResourceInventoryRecord(record: CiEmberguardResourceInventoryRecord) {
    return this.provider.repository.putResourceInventoryRecord(record);
  }

  listCustomDomains(input?: { tenantId?: string }) {
    return this.provider.repository.listCustomDomains(input);
  }

  putCustomDomain(record: CiEmberguardCustomDomainRecord) {
    return this.provider.repository.putCustomDomain(record);
  }

  deleteCustomDomain(input: { id: string; tenantId?: string }) {
    return this.provider.repository.deleteCustomDomain(input);
  }

  private getAuthorizer(): CiAuthorizer {
    this.authorizer ??= ciCreateAuthorizer(this.definition);
    return this.authorizer;
  }

  /** Validates and installs one persisted access-control state. */
  private useAccessControlState(
    stored: CiEmberguardAccessControlState
  ): CiEmberguardAccessControlState {
    const migrated = ciMigrateLegacyPrivilegeTitles(
      stored.definition,
      this.definition
    );
    ciAssertValidAccessControlDefinition(migrated);
    if (!Number.isSafeInteger(stored.revision) || stored.revision < 0) {
      throw new Error("The persisted access-control revision is invalid.");
    }
    this.setDefinition(migrated);
    return {
      definition: migrated,
      roleCounters: stored.roleCounters,
      revision: stored.revision,
    };
  }
}
