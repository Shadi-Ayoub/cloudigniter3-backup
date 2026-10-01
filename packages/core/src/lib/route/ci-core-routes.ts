import type { CiRoutesMap } from "@ci-core/types";

export const ciCoreRoutes: CiRoutesMap = {
  "/error-preview/access-suspended": {
    title: "Access suspended preview",
    namespace: "common",
    protected: false,
    tenantScopes: ["system"],
  },
  "/error-preview/access-denied": {
    title: "Access denied preview",
    namespace: "common",
    protected: false,
    tenantScopes: ["system"],
  },
  "/dashboard/modules": { title: "Modules", namespace: "dashboard.modules", protected: true, tenantScopes: ["system"] },
  "/dashboard/extensions/*": { title: "Module", namespace: "dashboard", protected: true, tenantScopes: ["system"] },
  "/": {
    title: "CloudIgniter Application Home Page",
    namespace: "home",
    protected: false,
  },
  "/create-account": {
    title: "Create an Account",
    namespace: "authentication",
    protected: false,
  },
  "/dashboard": {
    title: "Admin Dashboard",
    namespace: "dashboard",
    protected: true,
  },
  "/dashboard/security": {
    title: "Security Center",
    namespace: "dashboard.security",
    protected: true,
    access: {
      resource: "platform.authorization",
      action: "read",
    },
  },
  "/dashboard/resources": {
    title: "Resources Catalog",
    namespace: "dashboard.resources",
    protected: true,
    access: {
      resource: "platform.dashboard",
      action: "read",
    },
  },
  "/dashboard/trash": {
    title: "Trash Management",
    namespace: "dashboard.trash",
    protected: true,
  },
  "/dashboard/security/*": {
    title: "Access Control Administration",
    namespace: "dashboard.security",
    protected: true,
    access: {
      resource: "platform.authorization",
      action: "read",
    },
  },
  "/dashboard/dev": {
    title: "Developer Toolbox",
    namespace: "dashboard.dev",
    protected: true,
  },
  "/dashboard/dev/install1": {
    title: "CloudIgniter Application Installation Page",
    namespace: "dashboard.dev.install",
    protected: false,
  },
  "/dashboard/dev/sandbox/*": {
    title: "CloudIgniter Application Sandbox Section",
    namespace: "dashboard.dev.sandbox",
    protected: true,
  },
  "/dashboard/dev/seeder/*": {
    title: "CloudIgniter Application Seeder Tool",
    namespace: "dashboard.dev.seeder",
    protected: true,
  },
  "/dashboard/settings": {
    title: "Manage Settings",
    namespace: "dashboard.settings",
    protected: true,
    tenantScopes: ["system"],
    access: { resource: "platform.settings", action: "read" },
  },
  "/dashboard/settings/public": { title: "Public settings", namespace: "dashboard.settings", protected: true, tenantScopes: ["system"], access: { resource: "platform.settings", action: "read" } },
  "/dashboard/settings/private": { title: "Private settings", namespace: "dashboard.settings", protected: true, tenantScopes: ["system"], access: { resource: "platform.settings", action: "read" } },
  "/account/settings": { title: "My Preferences", namespace: "account.settings", protected: true },
  "/dashboard/tenants": {
    title: "Manage Tenants",
    namespace: "dashboard.tenants",
    protected: true,
  },
  "/dashboard/users": {
    title: "Manage Users",
    namespace: "dashboard.users",
    protected: true,
    access: {
      resource: "identity.users",
      action: "read",
    },
  },
  "/dashboard/administrators": {
    title: "Manage Administrators",
    namespace: "dashboard.administrators",
    protected: true,
  },
  "/dashboard/org-units": {
    title: "Manage Org Units",
    namespace: "dashboard.org-units",
    protected: true,
    access: {
      resource: "platform.org-units",
      action: "read",
    },
  },
  "/dashboard/theme": {
    title: "Theme Presentation",
    namespace: "dashboard.theme",
    protected: false,
  },
  "/dashboard/users/*": {
    title: "User Administration",
    namespace: "dashboard.users",
    protected: true,
    access: {
      resource: "identity.users",
      action: "read",
    },
  },
  "/dashboard/administrators/*": {
    title: "Administrator Administration",
    namespace: "dashboard.administrators",
    protected: true,
  },
  "/login": {
    title: "Login Page",
    namespace: "authentication",
    protected: false,
  },
  "/logout": {
    title: "Logout Page",
    namespace: "authentication",
    protected: true,
  },
  "/t/:id": {
    title: "CloudIgniter Application Tenants Tree",
    namespace: "tenant",
    protected: true,
  },
};
