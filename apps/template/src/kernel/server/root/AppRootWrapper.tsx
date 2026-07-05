import type { PropsWithChildren } from "react";

import { CiDebugProbe, CiNextRootWrapper } from "@cloudigniter/next/ui/server";

import type { AppRootLayoutContext } from "./appResolveRootLayoutContext";
import { Kernel } from "@/kernel/server";

export interface AppRootWrapperProps extends PropsWithChildren {
  root: AppRootLayoutContext;
}

export function AppRootWrapper({ root, children }: AppRootWrapperProps) {
  return (
    <>
      <CiDebugProbe {...root.debugProbe} />

      <CiNextRootWrapper
        config={root.config}
        envMode={root.envMode}
        actor={root.actor}
      >
        <Kernel />
        {children}
      </CiNextRootWrapper>
    </>
  );
}
