"use client";

import { useEffect, useState } from "react";
import { CiDevBeaconButton } from "./components/CiDevBeaconButton";
import { CiDevBeaconModal } from "./components/CiDevBeaconModal";
import { CiDevBeaconSideTabsList } from "./components/CiDevBeaconSideTabsList";
import { CiDevBeaconSectionStatus } from "./sections/system-status/CiDevBeaconSectionStatus";
import { CiDevBeaconSectionConfig } from "./sections/system-config/CiDevBeaconSectionConfig";
import { CiDevBeaconSectionTools } from "./sections/system-tools/CiDevBeaconSectionTools";
import type { CiDevBeaconClientProps } from "@cloudigniter/core/types";

export function CiDevBeaconClient({
  locale,
  dir,
  languageDiagnosticsEndpoint = "/ci-internal/dev-beacon/language",
  position = "bottom-right",
  env = "production",
  logo,
  defaultTab = "status",
  isContentLoaded,
  onRequestMarkLoaded,
  extraTabs = [],
  viewportTopOffset,
  viewportBottomOffset,
  tenant,
}: CiDevBeaconClientProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<boolean>(!!isContentLoaded);

  useEffect(() => {
    if (onRequestMarkLoaded) {
      onRequestMarkLoaded(setLoaded);
    }
  }, [onRequestMarkLoaded]);

  useEffect(() => {
    if (typeof isContentLoaded === "boolean") {
      setLoaded(isContentLoaded);
    }
  }, [isContentLoaded]);

  return (
    <>
      <CiDevBeaconButton
        loaded={loaded}
        onClick={() => setOpen(true)}
        env={env}
        position={position}
        size="md"
        logo={logo}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        className={open ? "pointer-events-none opacity-0" : undefined}
      />

      <CiDevBeaconModal
        open={open}
        onOpenChange={setOpen}
        env={env}
        loaded={loaded}
        defaultTab={defaultTab}
        dir={dir}
        SideTabsList={CiDevBeaconSideTabsList}
        SectionStatus={() => (
          <CiDevBeaconSectionStatus
            tenant={tenant}
            languageDiagnosticsEndpoint={languageDiagnosticsEndpoint}
          />
        )}
        SectionConfig={CiDevBeaconSectionConfig}
        SectionTools={(props) => (
          <CiDevBeaconSectionTools
            {...props}
            onMarkLoaded={() => setLoaded(true)}
          />
        )}
        extraTabs={extraTabs}
        viewportTopOffset={viewportTopOffset}
        viewportBottomOffset={viewportBottomOffset}
      />
    </>
  );
}
