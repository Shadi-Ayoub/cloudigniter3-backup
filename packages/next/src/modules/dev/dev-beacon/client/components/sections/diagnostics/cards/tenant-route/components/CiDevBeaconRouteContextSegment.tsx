"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";
import { cn, Button } from "@cloudigniter/ui/client";
import { CiDevBeaconCardRow, CiDevBeaconCardRowGrid } from "@ci-next/modules/dev/dev-beacon/client/components";
import type { CiNextContext } from "@ci-next/types";
import { CiDevBeaconRouteDefinitionsModal } from "./CiDevBeaconRouteDefinitionsModal";

interface CiDevBeaconRouteContextSegmentProps {
  route?: CiNextContext["route"];
  featurePathname?: CiNextContext["featurePathname"];
}

const EMPTY_VALUE = "—";

function getDisplayValue(value?: string | null) {
  return value?.trim() || EMPTY_VALUE;
}

export function CiDevBeaconRouteContextSegment({ route, featurePathname }: CiDevBeaconRouteContextSegmentProps) {
  const [isRouteDefinitionsOpen, setIsRouteDefinitionsOpen] = useState(false);

  const routeTitle = getDisplayValue(route?.title);
  const routeNamespace = getDisplayValue(route?.namespace);
  const publicPathname = getDisplayValue(route?.publicPathname);
  const resolvedFeaturePathname = getDisplayValue(featurePathname);
  const routePathname = getDisplayValue(route?.pathname);
  const matchedPattern = getDisplayValue(route?.matchedPattern);
  const matchKind = getDisplayValue(route?.matchKind);
  const wildcardPath = getDisplayValue(route?.wildcardPath);

  const protectedRoute = route?.protected === undefined ? EMPTY_VALUE : route.protected ? "Yes" : "No";

  const routesDefinitions = route?.routesDefinitions;
  const canShowRouteDefinitions = routesDefinitions != null;

  return (
    <>
      <CiDevBeaconCardRowGrid title="Route Information" columns={2} boxed cellPadding="compact">
        <CiDevBeaconCardRow
          label="Route"
          value={routeTitle}
          tooltip="The descriptive title assigned to the matched route definition."
          tooltipAriaLabel="About route title"
        />

        <CiDevBeaconCardRow
          label="Namespace"
          value={routeNamespace}
          mono
          tooltip="The namespace of the route definition that matched the current request."
          tooltipAriaLabel="About route namespace"
        />

        <CiDevBeaconCardRow
          label="Public Pathname"
          value={publicPathname}
          mono
          allowWrap
          tooltip="The externally visible pathname requested by the browser before tenant and organizational-unit routing are removed."
          tooltipAriaLabel="About public pathname"
        />

        <CiDevBeaconCardRow
          label="Feature Pathname"
          value={resolvedFeaturePathname}
          mono
          allowWrap
          tooltip="The pathname remaining after tenant and organizational-unit resolution. This is the pathname passed to feature-route matching."
          tooltipAriaLabel="About feature pathname"
        />

        <CiDevBeaconCardRow
          label="Route Pathname"
          value={routePathname}
          mono
          allowWrap
          tooltip="The normalized runtime pathname used to construct the current route."
          tooltipAriaLabel="About route pathname"
        />

        <CiDevBeaconCardRow
          label="Matched Pattern"
          value={matchedPattern}
          mono
          allowWrap
          tooltip="The registered route pattern that matched the current feature pathname."
          tooltipAriaLabel="About matched route pattern"
        />

        <CiDevBeaconCardRow
          label="Match Kind"
          value={matchKind}
          mono
          tooltip="Indicates how the route was matched, such as an exact or wildcard match."
          tooltipAriaLabel="About route match kind"
        />

        <CiDevBeaconCardRow
          label="Wildcard Path"
          value={wildcardPath}
          mono
          allowWrap
          tooltip="The pathname portion captured by a wildcard route. It is empty when the matched route has no wildcard."
          tooltipAriaLabel="About wildcard pathname"
        />

        <CiDevBeaconCardRow
          label="Protected"
          value={protectedRoute}
          tooltip="Indicates whether the matched route requires an authenticated user."
          tooltipAriaLabel="About protected route"
        />

        <Button
          type="button"
          className={cn(
            "h-full min-h-9 w-full",
            "border border-orange-200 bg-orange-100 text-orange-900",
            "hover:bg-orange-200 hover:text-orange-950",
            "dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
            "dark:hover:bg-orange-900/70 dark:hover:text-orange-100",
          )}
          disabled={!canShowRouteDefinitions}
          title={canShowRouteDefinitions ? "Show route definitions" : "Route definitions are unavailable"}
          onClick={() => setIsRouteDefinitionsOpen(true)}
        >
          <Code2 className="size-4" aria-hidden="true" />
          Show Route Definitions
        </Button>
      </CiDevBeaconCardRowGrid>

      <CiDevBeaconRouteDefinitionsModal
        routesDefinitions={routesDefinitions}
        open={isRouteDefinitionsOpen}
        onOpenChange={setIsRouteDefinitionsOpen}
      />
    </>
  );
}
