"use client";

import * as React from "react";
import { ListTree } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type {
  CiDevBeaconClientProps,
  CiDevBeaconExtraTab,
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
} from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";

import { CiDevBeaconButton } from "./components/CiDevBeaconButton";
import { CiDevBeaconModal } from "./components/CiDevBeaconModal";
import { CiDevBeaconSideTabsList } from "./components/CiDevBeaconSideTabsList";
import { CiDevBeaconSectionConfig } from "./components/sections/system-config/CiDevBeaconSectionConfig";
import { CiDevBeaconSectionDiagnostics } from "./components/sections/diagnostics/CiDevBeaconSectionDiagnostics";
import { CiDevBeaconSectionTools } from "./components/sections/system-tools/CiDevBeaconSectionTools";
import { CiDevBeaconTraceLogViewerText, CiDevBeaconTraceTab } from "./components/trace";

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
      <div className="pointer-events-none relative select-none" style={{ width: size, height: size }}>
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

function buildExtraTab(spec: CiDevBeaconExtraTabSpec): CiDevBeaconExtraTab {
  switch (spec.kind) {
    case "trace-log-text":
      return {
        id: spec.id ?? "trace",
        label: spec.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceLogViewerText {...(spec.props ?? {})} />,
      };

    case "trace-events-table":
      return {
        id: spec.id ?? "trace",
        label: spec.label ?? "Trace",
        icon: ListTree,
        content: <CiDevBeaconTraceTab {...(spec.props ?? {})} />,
      };

    default: {
      const unsupportedSpec: never = spec;

      throw new Error(`Unsupported Dev Beacon extra-tab specification: ${String(unsupportedSpec)}`);
    }
  }
}

function buildExtraTabs(specs: CiDevBeaconExtraTabSpec[] = []): CiDevBeaconExtraTab[] {
  return specs.map(buildExtraTab);
}

export function CiDevBeaconClient({
  context,
  position = "bottom-right",
  defaultTab = "status",
  logo,
  extraTabs = [],
  viewportTopOffset = "120px",
  viewportBottomOffset = "0px",
}: CiDevBeaconClientProps<CiNextContext>) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [topOffset, setTopOffset] = React.useState(viewportTopOffset);
  const [bottomOffset, setBottomOffset] = React.useState(viewportBottomOffset);
  const [routeHeadersRefreshPending, startRouteHeadersRefresh] = React.useTransition();

  const refreshedPathnameRef = React.useRef(pathname);

  const routeHeadersRefreshing = refreshedPathnameRef.current !== pathname || routeHeadersRefreshPending;

  React.useEffect(() => {
    if (!open || refreshedPathnameRef.current === pathname) {
      return;
    }

    refreshedPathnameRef.current = pathname;
    router.refresh();
  }, [open, pathname, router]);

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
  }, [pathname]);

  const resolvedExtraTabs = React.useMemo(() => buildExtraTabs(extraTabs), [extraTabs]);

  const logoNode = React.useMemo(() => buildLogoNode(logo), [logo]);

  const SectionStatus = React.useCallback(
    () => (
      <CiDevBeaconSectionDiagnostics
        key={pathname}
        pathname={pathname}
        context={context}
        routeHeadersRefreshing={routeHeadersRefreshing}
      />
    ),
    [context, pathname, routeHeadersRefreshing],
  );

  return (
    <>
      <CiDevBeaconButton
        loaded={loaded}
        onClick={() => setOpen(true)}
        env={context.env.mode}
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
        env={context.env.mode}
        loaded={loaded}
        defaultTab={defaultTab}
        dir={context.config.appResolvedCoreConfig.direction}
        SideTabsList={CiDevBeaconSideTabsList}
        SectionStatus={SectionStatus}
        SectionConfig={CiDevBeaconSectionConfig}
        SectionTools={(props) => <CiDevBeaconSectionTools {...props} onMarkLoaded={() => setLoaded(true)} />}
        extraTabs={resolvedExtraTabs}
        viewportTopOffset={topOffset}
        viewportBottomOffset={bottomOffset}
      />
    </>
  );
}
