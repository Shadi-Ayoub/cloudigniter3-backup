"use client";

import { useLocale, useTranslations } from "next-intl";
import { CiModuleManagementPage } from "@cloudigniter/ui/client";
import type {
  CiModuleManagementMessages,
  CiModuleManagementPageProps,
} from "@cloudigniter/ui/types";

/** Binds route-scoped next-intl messages to the framework-neutral module manager. */
export function CiNextModuleManagementPage(props: CiModuleManagementPageProps) {
  const t = useTranslations("modules");
  const locale = useLocale();
  const messages: CiModuleManagementMessages = {
    title: t("title"),
    description: t("description"),
    badge: t("badge"),
    refresh: t("refresh"),
    working: t("working"),
    refreshError: t("refreshError"),
    operationErrorTitle: t("operationErrorTitle"),
    requestError: t("requestError"),
    installRequested: t("installRequested"),
    uninstallRequested: t("uninstallRequested"),
    saved: t("saved"),
    pending: t("pending"),
    empty: t("empty"),
    missingSource: t("missingSource"),
    incompatible: t("incompatible"),
    backendRequired: t("backendRequired"),
    resourceDetails: t("resourceDetails"),
    provider: t("provider"),
    infrastructureId: t("infrastructureId"),
    permissions: t("permissions"),
    install: t("install"),
    retryInstall: t("retryInstall"),
    enable: t("enable"),
    disable: t("disable"),
    open: t("open"),
    settings: t("settings"),
    update: t("update"),
    uninstall: t("uninstall"),
    retryUninstall: t("retryUninstall"),
    disableFirst: t("disableFirst"),
    coreTitle: t("coreTitle"),
    coreDescription: t("coreDescription"),
    moduleFallback: t("moduleFallback"),
    uninstallDescription: t("uninstallDescription"),
    confirmUninstall: t("confirmUninstall"),
    cancel: t("cancel"),
    dismissAlert: t("dismissAlert"),
    updateTitle: t("updateTitle"),
    updateDescription: t("updateDescription"),
    gotIt: t("gotIt"),
    settingsDescription: t("settingsDescription"),
    saveSettings: t("saveSettings"),
    extensionCount: (count) => t("extensionCount", { count }),
    installedVersion: (version) => t("installedVersion", { version }),
    uninstallTitle: (name) => t("uninstallTitle", { name }),
    confirmationPrompt: (id) => t("confirmationPrompt", { id }),
    settingsTitle: (name) => t("settingsTitle", { name }),
    status: {
      "not-installed": t("status.not-installed"),
      installing: t("status.installing"),
      disabled: t("status.disabled"),
      enabled: t("status.enabled"),
      uninstalling: t("status.uninstalling"),
      failed: t("status.failed"),
    },
    coreModuleNames: {
      security: t("coreModuleNames.security"),
      tenant: t("coreModuleNames.tenant"),
      "org-unit": t("coreModuleNames.org-unit"),
      appearance: t("coreModuleNames.appearance"),
      users: t("coreModuleNames.users"),
      admins: t("coreModuleNames.admins"),
      settings: t("coreModuleNames.settings"),
      modules: t("coreModuleNames.modules"),
    },
  };
  return (
    <CiModuleManagementPage
      {...props}
      locale={props.locale ?? locale}
      messages={{ ...messages, ...props.messages }}
    />
  );
}
