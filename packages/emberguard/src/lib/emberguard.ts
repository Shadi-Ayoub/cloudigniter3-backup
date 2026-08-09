import type {
  CiAccessControlDefinition,
  CiAuthorizationRequest,
  CiAuthorizationSubject,
  CiAuthorizer,
  CiAuthorizerOptions,
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
  ciCreateAuthorizer,
} from "./access-control";

export class Emberguard {
  readonly provider: CiEmberguardProvider;

  private definition: CiAccessControlDefinition;

  private authorizer?: CiAuthorizer;

  constructor(provider: CiEmberguardProvider, options: CiEmberguardOptions = {}) {
    this.provider = provider;
    this.definition = options.definition ?? CI_DEFAULT_ACCESS_CONTROL_DEFINITION;
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
    const authorizer = options ? this.createAuthorizer(options) : this.getAuthorizer();
    return authorizer.authorize(request);
  }

  can(request: CiAuthorizationRequest, options?: CiAuthorizerOptions): boolean {
    return this.authorize(request, options).allowed;
  }

  async loadDefinition(): Promise<CiAccessControlDefinition> {
    const stored = await this.provider.repository.getAccessControlDefinition();
    if (stored) {
      this.setDefinition(stored);
    }
    return this.definition;
  }

  async saveDefinition(definition: CiAccessControlDefinition = this.definition): Promise<void> {
    await this.provider.repository.saveAccessControlDefinition(definition);
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

    return {
      id: input.subjectId,
      authenticated: input.authenticated ?? true,
      roleAssignments,
      directPrivileges: input.directPrivileges ?? [],
    };
  }

  listRoleAssignments(input: { subjectId?: string; tenantId?: string }) {
    return this.provider.repository.listRoleAssignments(input);
  }

  putRoleAssignment(assignment: CiEmberguardStoredRoleAssignment) {
    return this.provider.repository.putRoleAssignment(assignment);
  }

  deleteRoleAssignment(input: { id: string; subjectId: string }) {
    return this.provider.repository.deleteRoleAssignment(input);
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
}
