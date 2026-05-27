"use client";

import type { CiSettings } from "@cloudigniter/core/types";
import { CiSettingsProvider } from "../ci-settings-provider";

export type CiSettingsPageProps = {
  settings: CiSettings;
  children: React.ReactNode;
};

export function CiSettingsPage({ settings, children }: CiSettingsPageProps) {
  return (
    <CiSettingsProvider settings={settings}>{children}</CiSettingsProvider>
  );
}
