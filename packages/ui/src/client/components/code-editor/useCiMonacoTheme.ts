"use client";

import { useCiColorMode } from "../../hooks/use-ci-color-mode";

export function useCiMonacoTheme(): "cloudigniter-dark" | "cloudigniter-light" {
  return useCiColorMode() === "dark" ? "cloudigniter-dark" : "cloudigniter-light";
}
