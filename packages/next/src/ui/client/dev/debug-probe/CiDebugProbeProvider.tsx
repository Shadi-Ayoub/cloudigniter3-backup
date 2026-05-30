"use client";

import { createContext, useContext, type ReactNode } from "react";

type CiDebugProbeContextValue = {
  enabled: boolean;
};

const CiDebugProbeContext = createContext<CiDebugProbeContextValue>({
  enabled: false,
});

export function CiDebugProbeProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <CiDebugProbeContext.Provider value={{ enabled }}>
      {children}
    </CiDebugProbeContext.Provider>
  );
}

export function ciUseDebugProbe() {
  return useContext(CiDebugProbeContext);
}
