"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CiResourceCatalogPage } from "@cloudigniter/ui/client";
import type { CiResourceCatalogPageProps } from "@cloudigniter/ui/types";

/** Next.js refresh boundary for the provider-neutral resources catalog. */
export function CiNextResourceCatalogPage(props: CiResourceCatalogPageProps) {
  const router = useRouter();
  const save = props.onSave;
  const remove = props.onDelete;
  const createResourceDomain = props.onCreateResourceDomain;
  const setResourceDomainStatus = props.onSetResourceDomainStatus;
  const setResourceStatus = props.onSetResourceStatus;

  const onSave = useCallback<NonNullable<CiResourceCatalogPageProps["onSave"]>>(
    async (record, reason) => {
      if (!save) return { ok: false, message: "Saving is not available." };
      const result = await save(record, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [router, save],
  );

  const onDelete = useCallback<
    NonNullable<CiResourceCatalogPageProps["onDelete"]>
  >(
    async (record, reason) => {
      if (!remove) return { ok: false, message: "Deleting is not available." };
      const result = await remove(record, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [remove, router],
  );

  const onCreateResourceDomain = useCallback<
    NonNullable<CiResourceCatalogPageProps["onCreateResourceDomain"]>
  >(
    async (input) => {
      if (!createResourceDomain) {
        return { ok: false, message: "Creating domains is not available." };
      }
      const result = await createResourceDomain(input);
      if (result.ok) router.refresh();
      return result;
    },
    [createResourceDomain, router],
  );

  const onSetResourceDomainStatus = useCallback<
    NonNullable<CiResourceCatalogPageProps["onSetResourceDomainStatus"]>
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
    [router, setResourceDomainStatus],
  );

  const onSetResourceStatus = useCallback<
    NonNullable<CiResourceCatalogPageProps["onSetResourceStatus"]>
  >(
    async (resourceId, status, reason) => {
      if (!setResourceStatus) {
        return {
          ok: false,
          message: "Changing resource status is not available.",
        };
      }
      const result = await setResourceStatus(resourceId, status, reason);
      if (result.ok) router.refresh();
      return result;
    },
    [router, setResourceStatus],
  );

  return (
    <CiResourceCatalogPage
      {...props}
      onSave={save ? onSave : undefined}
      onDelete={remove ? onDelete : undefined}
      onCreateResourceDomain={
        createResourceDomain ? onCreateResourceDomain : undefined
      }
      onSetResourceDomainStatus={
        setResourceDomainStatus ? onSetResourceDomainStatus : undefined
      }
      onSetResourceStatus={setResourceStatus ? onSetResourceStatus : undefined}
    />
  );
}
