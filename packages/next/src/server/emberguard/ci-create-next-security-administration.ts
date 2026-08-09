import {
  ciCreateAwsEmberguardAdministrationRepository,
  ciResolveAwsCognitoIdentityGroups,
} from "@cloudigniter/aws/lib";
import { ciCreateSecurityAdministration } from "@cloudigniter/core/lib";
import type { CiSecurityAdministration } from "@cloudigniter/core/types";
import type {
  CiNextAwsSecurityAdministrationOptions,
  CiNextSecurityAdministrationOptions,
} from "../../types";

/** Adapts the authenticated Next.js context to a generic security actor. */
export function ciCreateNextSecurityAdministration(
  options: CiNextSecurityAdministrationOptions
): CiSecurityAdministration {
  return ciCreateSecurityAdministration({
    actor: {
      id: options.context.auth.user.id ?? "anonymous",
      authenticated: options.context.auth.user.authenticated,
      roleIds: options.context.auth.user.roles,
      primaryRole: options.context.auth.user.primaryRole,
    },
    definition: options.definition,
    repository: options.repository,
    identityGroups: options.identityGroups,
    createId: options.createId,
  });
}

/** Binds Next.js security administration to the AWS Amplify/Cognito adapter. */
export function ciCreateNextAwsSecurityAdministration(
  options: CiNextAwsSecurityAdministrationOptions
): CiSecurityAdministration {
  return ciCreateNextSecurityAdministration({
    context: options.context,
    definition: options.definition,
    repository: ciCreateAwsEmberguardAdministrationRepository(
      options.operations
    ),
    identityGroups: ciResolveAwsCognitoIdentityGroups(options.amplifyOutputs),
    createId: options.createId,
  });
}
