import { type ReactNode } from "react";
type CiDebugProbeContextValue = {
    enabled: boolean;
};
export declare function CiDebugProbeProvider({ enabled, children, }: {
    enabled: boolean;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function ciUseDebugProbe(): CiDebugProbeContextValue;
export {};
//# sourceMappingURL=CiDebugProbeProvider.d.ts.map