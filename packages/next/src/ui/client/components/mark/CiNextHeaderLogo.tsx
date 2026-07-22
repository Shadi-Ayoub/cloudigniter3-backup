"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  CiHeaderLogo,
  ciStartTraceClient,
  useCiPageLoaderStore,
} from "@cloudigniter/ui/client";

import type { CiNextHeaderLogoProps } from "./types";

export function CiNextHeaderLogo({ config }: CiNextHeaderLogoProps) {
  const router = useRouter();

  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  const trace = useMemo(
    () =>
      ciStartTraceClient(
        config.coreConfig.dev.traceLog,
        { source: "client" },
        { name: "HeaderLogo" },
      ),
    [config.coreConfig.dev.traceLog],
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
      onNavigateStart={() => setLoading(true)}
      navigate={(href) => router.push(href)}
      onMount={handleMount}
      onUnmount={handleUnmount}
    />
  );
}
