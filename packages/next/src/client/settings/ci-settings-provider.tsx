"use client";

import { createContext, useContext } from "react";
import type {
  CiSettings,
  CiSettingsContextValue,
  CiSettingsProviderProps,
} from "@cloudigniter/core/types";

const CiSettingsContext = createContext<CiSettingsContextValue | null>(null);

export function CiSettingsProvider({
  settings,
  children,
}: CiSettingsProviderProps) {
  return (
    <CiSettingsContext.Provider value={{ settings }}>
      {children}
    </CiSettingsContext.Provider>
  );
}

export function ciUseSettingsContext<
  TSettings extends CiSettings = CiSettings,
>() {
  const context = useContext(CiSettingsContext);

  if (!context) {
    throw new Error(
      "ciUseSettingsContext must be used inside CiSettingsProvider.",
    );
  }

  return context as { settings: TSettings };
}
