"use client";

import { useCallback, useMemo } from "react";

import {
  CiHeaderLogo,
  ciStartTraceClient,
} from "@cloudigniter/ui/client";
import { useCiNextNavigationWithLoader } from "@ci-next/client/navigation";

import type { CiNextHeaderLogoProps } from "./types";

export function CiNextHeaderLogo({ traceConfig }: CiNextHeaderLogoProps) {
  const { navigate, onNavigateStart } = useCiNextNavigationWithLoader();

  const trace = useMemo(
    () =>
      ciStartTraceClient(
        traceConfig,
        { source: "client" },
        { name: "HeaderLogo" },
      ),
    [traceConfig],
  );

  const handleMount = useCallback(() => {
    trace.done({ phase: "mount" });

    trace.logger.log({
      type: "component",
      name: "HeaderLogo",
      scope: "layout",
      event: "mount <HeaderLogo>",
    });
  }, [trace]);

  const handleUnmount = useCallback(() => {
    trace.logger.log({
      type: "component",
      name: "HeaderLogo",
      scope: "layout",
      event: "unmount",
    });
  }, [trace]);

  return (
    <CiHeaderLogo
      href="/"
      navigate={navigate}
      onNavigateStart={onNavigateStart}
      onMount={handleMount}
      onUnmount={handleUnmount}
    />
  );
}
