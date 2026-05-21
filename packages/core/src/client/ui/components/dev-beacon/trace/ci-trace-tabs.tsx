import { ListTree } from "lucide-react";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconTraceLogViewerTextProps,
} from "@/types";
import { CiDevBeaconTraceLogViewerText } from "./CiDevBeaconTraceLogViewerText";

/**
 * Server-safe builder: it only returns plain objects + React elements.
 * It does NOT execute client hooks; it just references a client component.
 */
export function ciDevBeaconGetTraceLogTextTab(
  overrides?: CiDevBeaconTraceLogViewerTextProps,
): CiDevBeaconExtraTab {
  return {
    id: "trace",
    label: "Trace",
    icon: ListTree,
    content: <CiDevBeaconTraceLogViewerText {...overrides} />,
  };
}
