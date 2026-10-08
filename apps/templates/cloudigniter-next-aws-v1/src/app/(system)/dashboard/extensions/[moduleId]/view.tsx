"use client";
import { extensionPages } from "@/custom/modules/.generated/client";
import type { CiExtensionPageProps } from "@cloudigniter/ui/types";

/** Thin module-slot composition; each module provides its own client facet. */
export function ExtensionPage({
  id,
  ...props
}: CiExtensionPageProps & { id: string }) {
  const Page = extensionPages[id];
  return Page ? (
    <Page {...props} />
  ) : (
    <p>Module page is unavailable. Rebuild the application registry.</p>
  );
}
