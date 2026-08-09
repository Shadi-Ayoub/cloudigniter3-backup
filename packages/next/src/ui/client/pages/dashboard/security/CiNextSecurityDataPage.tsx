"use client";

import { CiSecurityDataPage } from "@cloudigniter/ui/client";
import type { CiSecurityDataPageProps } from "@cloudigniter/ui/types";

/** Next.js package boundary for the provider-neutral security table surface. */
export function CiNextSecurityDataPage(props: CiSecurityDataPageProps) {
  return <CiSecurityDataPage {...props} />;
}
