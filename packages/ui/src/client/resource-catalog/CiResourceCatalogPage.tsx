"use client";

import type { CiResourceCatalogPageProps } from "@ci-ui/types";
import { CiSecurityDataPage } from "../security/CiSecurityDataPage";

/**
 * Data-table-based catalog for CloudIgniter logical and operational resources.
 *
 * Resource authorization metadata remains compatible with EmberGuard while the
 * catalog itself is presented as a first-class platform capability.
 */
export function CiResourceCatalogPage(props: CiResourceCatalogPageProps) {
  const { onSave, onDelete, ...catalogProps } = props;

  return (
    <CiSecurityDataPage
      {...catalogProps}
      kind="resource"
      onSave={
        onSave
          ? async (record, reason) =>
              record.kind === "resource"
                ? onSave(record, reason)
                : { ok: false, message: "Expected a resource record." }
          : undefined
      }
      onDelete={
        onDelete
          ? async (record, reason) =>
              record.kind === "resource"
                ? onDelete(record, reason)
                : { ok: false, message: "Expected a resource record." }
          : undefined
      }
    />
  );
}
