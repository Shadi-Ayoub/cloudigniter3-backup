"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CiSecurityDataPage } from "@cloudigniter/ui/client";
import type { CiSecurityDataPageProps } from "@cloudigniter/ui/types";

/** Next.js package boundary for the provider-neutral security table surface. */
export function CiNextSecurityDataPage(props: CiSecurityDataPageProps) {
  const router = useRouter();
  const save = props.onSave;
  const remove = props.onDelete;
  const setRoleStatus = props.onSetRoleStatus;
  const createResourceDomain = props.onCreateResourceDomain;
  const setResourceDomainStatus = props.onSetResourceDomainStatus;

  const onSave = useCallback<NonNullable<CiSecurityDataPageProps["onSave"]>>(
    async (record, reason) => {
      if (!save) {
        return { ok: false, message: "Saving is not available." };
      }
      const result = await save(record, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [router, save]
  );

  const onDelete = useCallback<
    NonNullable<CiSecurityDataPageProps["onDelete"]>
  >(
    async (record, reason) => {
      if (!remove) {
        return { ok: false, message: "Deleting is not available." };
      }
      const result = await remove(record, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [remove, router]
  );

  const onSetRoleStatus = useCallback<
    NonNullable<CiSecurityDataPageProps["onSetRoleStatus"]>
  >(
    async (roleId, status, reason) => {
      if (!setRoleStatus) {
        return { ok: false, message: "Changing role status is not available." };
      }
      const result = await setRoleStatus(roleId, status, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [router, setRoleStatus]
  );

  const onCreateResourceDomain = useCallback<
    NonNullable<CiSecurityDataPageProps["onCreateResourceDomain"]>
  >(
    async (input) => {
      if (!createResourceDomain) {
        return { ok: false, message: "Creating domains is not available." };
      }
      const result = await createResourceDomain(input);
      if (result.ok) router.refresh();
      return result;
    },
    [createResourceDomain, router]
  );

  const onSetResourceDomainStatus = useCallback<
    NonNullable<CiSecurityDataPageProps["onSetResourceDomainStatus"]>
  >(
    async (domainId, status, reason) => {
      if (!setResourceDomainStatus) {
        return {
          ok: false,
          message: "Changing resource-domain status is not available.",
        };
      }
      const result = await setResourceDomainStatus(domainId, status, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [router, setResourceDomainStatus]
  );

  return (
    <CiSecurityDataPage
      {...props}
      onSave={save ? onSave : undefined}
      onDelete={remove ? onDelete : undefined}
      onSetRoleStatus={setRoleStatus ? onSetRoleStatus : undefined}
      onCreateResourceDomain={
        createResourceDomain ? onCreateResourceDomain : undefined
      }
      onSetResourceDomainStatus={
        setResourceDomainStatus ? onSetResourceDomainStatus : undefined
      }
    />
  );
}
