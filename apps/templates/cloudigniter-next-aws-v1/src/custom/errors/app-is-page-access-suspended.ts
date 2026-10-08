import "server-only";
import { cache } from "react";
import {
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
  ciGlobalAccessScope,
  ciIsAuthorizationSuspended,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import {
  appBootstrap,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
} from "@/kernel/server";

/** Application composition: match the actual page guard's subject and scope. */
export const appIsPageAccessSuspended = cache(async (): Promise<boolean> => {
  try {
    const context = await appBootstrap();
    const path = context.route?.pathname;
    if (path === "/error-preview/access-suspended")
      return context.env.mode === "development";
    if (!context.auth.user.authenticated || !context.auth.user.id) return false;

    // These pages share the corresponding authorizer-based guard. Boolean-only
    // feature gates and other custom pages do not prove a suspension.
    const securityPage =
      path === "/dashboard/security" ||
      path?.startsWith("/dashboard/security/");
    const usersPage =
      path === "/dashboard/users" || path === "/dashboard/administrators";
    const trashPage = path === "/dashboard/trash";
    if (!securityPage && !usersPage && !trashPage) return false;

    const security = appCreateSecurityAdministration(context);
    const definition = await security.loadDefinition();
    const subject = securityPage
      ? ciCreateAuthorizationSubject(
          { id: context.auth.user.id, authenticated: true },
          ciCreateRoleAssignments(
            context.auth.user.roles,
            ciSystemAccessScope(),
            "exact"
          )
        )
      : appCreateUserManagementAuthorizationSubject(
          context,
          await security.loadAssignments()
        );
    const scopes = securityPage
      ? [ciSystemAccessScope()]
      : [ciSystemAccessScope(), ciGlobalAccessScope()];
    return ciIsAuthorizationSuspended(
      definition,
      scopes.map((scope) => ({
        subject,
        scope,
        resource: securityPage ? "platform.authorization" : "identity.users",
        action: trashPage ? "restore" : "read",
      }))
    );
  } catch {
    // Missing or failed evidence must never label ordinary denial as suspension.
    return false;
  }
});
