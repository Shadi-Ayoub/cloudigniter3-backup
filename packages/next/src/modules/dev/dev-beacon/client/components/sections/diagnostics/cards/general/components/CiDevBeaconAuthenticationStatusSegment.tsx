import type { CiUser } from "@cloudigniter/core/types";
import { CiDevBeaconCardRow } from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiDevBeaconAuthenticationStatusSegmentProps {
  currentUser: CiUser;
}
export function CiDevBeaconAuthenticationStatusSegment({ currentUser }: CiDevBeaconAuthenticationStatusSegmentProps) {
  const currentUserId = currentUser?.id?.trim() || "—";
  const isAuthenticated = currentUser?.authenticated === true;
  const currentUserRoles = currentUser?.roles ?? [];

  return (
    <>
      <CiDevBeaconCardRow
        label="Current User ID"
        value={currentUserId}
        tooltip={<>The unique, stable identifier of the user associated with the current authenticated session.</>}
      />

      <CiDevBeaconCardRow
        label="Is Authenticated"
        value={isAuthenticated ? "YES" : "NO"}
        valueClassName={
          isAuthenticated
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        }
        tooltip={<>Indicates whether the current request is associated with a valid authenticated user session.</>}
      />

      <CiDevBeaconCardRow
        label="Current User Roles"
        value={currentUserRoles.length > 0 ? currentUserRoles : "—"}
        tooltip={<>Roles or groups assigned to the current user and used for authorization checks.</>}
      />
    </>
  );
}
