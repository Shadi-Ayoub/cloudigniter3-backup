"use client";

import * as React from "react";
import { ListTree } from "lucide-react";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
  CiDevBeaconWrapperProps,
} from "@cloudigniter/core/types";
import { CiDevBeaconClient } from "./CiDevBeaconClient";
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
  return specs.map((s) => {
    if (s.kind === "trace-log-text") {
      return {
        id: s.id ?? "trace",
        label: s.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceLogViewerText {...(s.props ?? {})} />,
      };
    }

    if (s.kind === "trace-events-table") {
      return {
        id: s.id ?? "trace",
        label: s.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceTab {...(s.props ?? {})} />,
      };
    }

    return {
      id: "unknown",
      label: "Unknown",
      content: null,
    };
  });
}

export function CiDevBeaconWrapper({
  locale,
  dir,
  languageDiagnosticsEndpoint,
  position,
  env,
  defaultTab,
  logo,
  extraTabSpecs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
  tenant,
}: CiDevBeaconWrapperProps) {
  const [ready, setReady] = React.useState(false);
  const [topOffset, setTopOffset] = React.useState(viewportTopOffset);
  const [bottomOffset, setBottomOffset] = React.useState(viewportBottomOffset);

  React.useEffect(() => {
    setReady(true);

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

    const ro = new ResizeObserver(measure);

    document
      .querySelectorAll("header, nav, footer")
      .forEach((el) => ro.observe(el));

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const extraTabs = React.useMemo(
    () => buildExtraTabs(extraTabSpecs),
    [extraTabSpecs],
  );

  const logoNode = React.useMemo(() => buildLogoNode(logo), [logo]);

  return (
    <CiDevBeaconClient
      isContentLoaded={ready}
      locale={locale}
      dir={dir}
      languageDiagnosticsEndpoint={languageDiagnosticsEndpoint}
      position={position}
      env={env}
      logo={logoNode}
      defaultTab={defaultTab}
      extraTabs={extraTabs}
      viewportTopOffset={topOffset}
      viewportBottomOffset={bottomOffset}
      tenant={tenant}
    />
  );
}
