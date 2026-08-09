import type { PropsWithChildren } from "react";

import { CiNextRootWrapper } from "@cloudigniter/next/server";
import { CiDebugProbe } from "@cloudigniter/ui/server";
import type { CiNextRootLayoutContext } from "@cloudigniter/next/types";
import { Kernel } from "@/kernel/server";

export interface AppRootWrapperProps extends PropsWithChildren {
  context: CiNextRootLayoutContext;
}

export function AppRootWrapper({ context, children }: AppRootWrapperProps) {
  return (
    <CiNextRootWrapper context={context}>
      <Kernel />
      {children}
    </CiNextRootWrapper>
  );
}
