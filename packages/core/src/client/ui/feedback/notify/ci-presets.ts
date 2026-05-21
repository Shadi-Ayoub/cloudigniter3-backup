import type { ExternalToast } from "sonner";
import type { CiFeedbackLevel } from "@/client";

export function ciPresets(level: CiFeedbackLevel): Partial<ExternalToast> {
  // CI opinionated presets (can be kept minimal)
  switch (level) {
    case "error":
    case "critical":
      return { duration: 6500 };
    case "loading":
      // Sonner loading toasts are typically “sticky”; duration can be omitted
      // or set to Infinity if desired. Sonner supports duration per-toast. :contentReference[oaicite:3]{index=3}
      return { duration: Number.POSITIVE_INFINITY };
    default:
      return {}; // Toaster duration will apply
  }
}
