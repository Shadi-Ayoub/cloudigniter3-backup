import type { CiRoutesMap } from "@ci-core/types";

export const ciCoreRoutes: CiRoutesMap = {
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
  },
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
