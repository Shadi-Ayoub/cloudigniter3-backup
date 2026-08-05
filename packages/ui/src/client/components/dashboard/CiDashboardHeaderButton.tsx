"use client";

import { useEffect } from "react";
import { ciStartTraceClient } from "@ci-ui/client";
import { type CiDashboardHeaderButtonProps } from "@ci-ui/types";
import { CiNavigateWithLoader } from "../../navigation";

export function CiDashboardHeaderButton({
  traceConfig,
  refresh,
  navigate,
  refreshRoute,
  onNavigateStart,
}: CiDashboardHeaderButtonProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTraceClient(
    traceConfig,
    { source: "client", tag: `HeaderDashboardButton` },
    { name: `<HeaderDashboardButton />` },
  );

  // log mount/unmount once
  useEffect(() => {
    // stop the render timer (records a "duration" metric if enabled)
    done({ phase: "mount" });

    logger.log({ type: "ui", event: "mount <HeaderDashboardButton>" });
    return () => logger.log({ type: "ui", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <CiNavigateWithLoader
      href={"/dashboard"}
      className="ci-main-header-dashboard-button"
      refresh={refresh}
      navigate={navigate}
      refreshRoute={refreshRoute}
      onNavigateStart={onNavigateStart}
    >
      Dashboard
    </CiNavigateWithLoader>
  );
}
