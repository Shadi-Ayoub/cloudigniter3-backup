"use client";

import * as React from "react";
import { ListTree } from "lucide-react";

import type {
  CiDevBeaconExtraTab,
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
  CiDevBeaconWrapperProps,
} from "@cloudigniter/core/types";

import { CiDevBeaconButton } from "./components/CiDevBeaconButton";
import { CiDevBeaconModal } from "./components/CiDevBeaconModal";
import { CiDevBeaconSideTabsList } from "./components/CiDevBeaconSideTabsList";
import { CiDevBeaconSectionConfig } from "./sections/system-config/CiDevBeaconSectionConfig";
import { CiDevBeaconSectionStatus } from "./sections/system-status/CiDevBeaconSectionStatus";
import { CiDevBeaconSectionTools } from "./sections/system-tools/CiDevBeaconSectionTools";
import { CiDevBeaconTraceLogViewerText, CiDevBeaconTraceTab } from "./trace";

function buildLogoNode(spec?: CiDevBeaconLogoSpec): React.ReactNode {
  if (!spec || spec.kind === "default") {
    return (
      <div className="pointer-events-none relative size-7 select-none">
        <img
          src="/images/cloudigniter-icon-1.png"
          alt="CloudIgniter"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  if (spec.kind === "image") {
    const size = spec.sizePx ?? 28;

    return (
      <div
        className="pointer-events-none relative select-none"
        style={{ width: size, height: size }}
      >
        <img
          src={spec.src}
          alt={spec.alt ?? "CloudIgniter"}
          loading={spec.priority === false ? "lazy" : "eager"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return null;
}

function buildExtraTabs(
  specs: CiDevBeaconExtraTabSpec[] = [],
): CiDevBeaconExtraTab[] {
  return specs.map((spec) => {
    if (spec.kind === "trace-log-text") {
      return {
        id: spec.id ?? "trace",
        label: spec.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceLogViewerText {...(spec.props ?? {})} />,
      };
    }

    if (spec.kind === "trace-events-table") {
      return {
        id: spec.id ?? "trace",
        label: spec.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceTab {...(spec.props ?? {})} />,
      };
    }

    return {
      id: "unknown",
      label: "Unknown",
      content: null,
    };
  });
}

export function CiDevBeaconClient({
  locale,
  dir,
  languageDiagnosticsEndpoint = "/ci-internal/dev-beacon/language",
  position = "bottom-right",
  env = "production",
  defaultTab = "status",
  logo,
  extraTabSpecs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
  tenant,
}: CiDevBeaconWrapperProps) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [topOffset, setTopOffset] = React.useState(viewportTopOffset);
  const [bottomOffset, setBottomOffset] = React.useState(viewportBottomOffset);

  React.useEffect(() => {
    setLoaded(true);

    const measure = () => {
      const primary = document.querySelector<HTMLElement>(
        '[data-ci-primary-header], .ci-primary-header, header[data-role="primary"]',
      );

      const secondary = document.querySelector<HTMLElement>(
        '[data-ci-secondary-header], .ci-secondary-header, nav[data-role="secondary"]',
      );

      const footerFixed = document.querySelector<HTMLElement>(
        '[data-ci-footer-fixed], .ci-footer-fixed, footer[data-fixed="true"]',
      );

      const top = (primary?.offsetHeight ?? 0) + (secondary?.offsetHeight ?? 0);
      const bottom = footerFixed?.offsetHeight ?? 0;

      setTopOffset(`${top}px`);
      setBottomOffset(`${bottom}px`);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);

    document.querySelectorAll("header, nav, footer").forEach((element) => {
      resizeObserver.observe(element);
    });

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const extraTabs = React.useMemo(
    () => buildExtraTabs(extraTabSpecs),
    [extraTabSpecs],
  );

  const logoNode = React.useMemo(() => buildLogoNode(logo), [logo]);

  return (
    <>
      <CiDevBeaconButton
        loaded={loaded}
        onClick={() => setOpen(true)}
        env={env}
        position={position}
        size="md"
        logo={logoNode}
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
        viewportTopOffset={topOffset}
        viewportBottomOffset={bottomOffset}
      />
    </>
  );
}
