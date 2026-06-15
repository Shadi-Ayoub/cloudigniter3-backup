"use client";

import { useEffect, useState } from "react";
import { CiDevBeaconButton } from "./CiDevBeaconButton";
import { CiDevBeaconModal } from "./CiDevBeaconModal";
import { CiDevBeaconSideTabsList } from "./CiDevBeaconSideTabsList";
import { CiDevBeaconSectionStatus } from "./CiDevBeaconSectionStatus";
import { CiDevBeaconSectionConfig } from "./CiDevBeaconSectionConfig";
import { CiDevBeaconSectionTools } from "./CiDevBeaconSectionTools";
import type { CiDevBeaconClientProps } from "@cloudigniter/core/types";

export function CiDevBeaconClient({
  dir = "ltr",
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
    if (onRequestMarkLoaded) onRequestMarkLoaded(setLoaded);
  }, [onRequestMarkLoaded]);

  useEffect(() => {
    if (typeof isContentLoaded === "boolean") setLoaded(isContentLoaded);
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
        SectionStatus={() => <CiDevBeaconSectionStatus tenant={tenant} />}
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
