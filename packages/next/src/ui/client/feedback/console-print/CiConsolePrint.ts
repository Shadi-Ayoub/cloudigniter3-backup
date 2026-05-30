"use client";

import { ciPrintToConsole } from "./ci-print-to-console";
import type { CiConsolePrintInterface } from "@ci-next/ui/client";

export function CiConsolePrint({
  label,
  message,
  options,
}: CiConsolePrintInterface) {
  ciPrintToConsole({ label, message, options });

  return null;
}
