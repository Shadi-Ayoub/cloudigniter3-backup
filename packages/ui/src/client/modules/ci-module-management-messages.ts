import type { CiModuleManagementMessages } from "@ci-ui/types";

export const ciModuleManagementMessages: CiModuleManagementMessages = {
  title: "Modules",
  description:
    "Extend your application with optional modules. Install resources, configure defaults, and choose which features are enabled.",
  badge: "Application extensions",
  refresh: "Refresh",
  working: "Working…",
  refreshError: "Could not refresh modules. Try again.",
  operationErrorTitle: "Module operation needs attention",
  requestError:
    "The request could not be completed. Refresh to check module state before retrying.",
  installRequested:
    "Installation requested. The module will remain disabled until you enable it.",
  uninstallRequested:
    "Removal requested. Its resources and data are being permanently deleted.",
  saved: "Module saved.",
  pending:
    "Infrastructure changes run in the background. This page checks progress for up to five minutes; use Refresh afterward. Retry the operation if it was interrupted.",
  empty:
    "No optional modules detected. Add a trusted module to the application’s modules folder and rebuild its registry.",
  missingSource:
    "The module folder is missing. Restore its installed version to enable it, or uninstall its retained resources.",
  incompatible:
    "This module does not support the configured provider and platform.",
  backendRequired:
    "Deploy the generated module backend before installing or using this version.",
  resourceDetails: "Installed resource details",
  provider: "Provider",
  infrastructureId: "Infrastructure ID",
  permissions: "Permissions",
  install: "Install",
  retryInstall: "Retry install",
  enable: "Enable",
  disable: "Disable",
  open: "Open module",
  settings: "Settings",
  update: "Update",
  uninstall: "Uninstall",
  retryUninstall: "Retry uninstall",
  disableFirst:
    "Disable first to uninstall. Disabling preserves resources and data.",
  coreTitle: "Core modules",
  coreDescription:
    "These capabilities are included and fixed. They cannot be disabled or uninstalled here.",
  moduleFallback: "module",
  uninstallDescription:
    "Hazardous action: this permanently deletes the module’s cloud resources and all stored data, including tasks in Trash. This cannot be undone. Disable the module instead to keep its data.",
  confirmUninstall: "Uninstall and delete data",
  cancel: "Cancel",
  dismissAlert: "Dismiss alert",
  updateTitle: "Module updates are coming later",
  updateDescription:
    "Update checks and downloads will be available when the CloudIgniter website and Store launch. No module code, configuration, or infrastructure has been changed.",
  gotIt: "Got it",
  settingsDescription:
    "These defaults apply to this installation. Existing tasks keep their values.",
  saveSettings: "Save settings",
  extensionCount: (count) =>
    `${count} detected or installed ${
      count === 1 ? "extension" : "extensions"
    }`,
  installedVersion: (version) => `Installed v${version}`,
  uninstallTitle: (name) => `Permanently uninstall ${name}?`,
  confirmationPrompt: (id) => `Type ${id} to confirm`,
  settingsTitle: (name) => `${name} settings`,
  status: {
    "not-installed": "Not installed",
    installing: "Installing",
    disabled: "Disabled",
    enabled: "Enabled",
    uninstalling: "Uninstalling",
    failed: "Failed",
  },
  coreModuleNames: {
    security: "Security",
    tenant: "Tenants",
    "org-unit": "Org Units",
    appearance: "Appearance",
    users: "Users",
    admins: "Administrators",
    settings: "Settings",
    modules: "Modules",
  },
};
