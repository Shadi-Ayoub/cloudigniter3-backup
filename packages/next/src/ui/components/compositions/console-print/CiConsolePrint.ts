"use client";

import {
  ciConsolePrint,
  type CiConsolePrintInterface,
} from "@cloudigniter/core";

export function CiConsolePrint({
  label,
  message,
  options,
}: CiConsolePrintInterface) {
  ciConsolePrint({ label, message, options });

  return null;
}
