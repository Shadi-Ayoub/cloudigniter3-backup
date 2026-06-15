import type { CiRoutesMap } from "@cloudigniter/core/types";

export const routes: CiRoutesMap = {
  "/": {
    title: "CloudIgniter Application Home Page",
    namespace: "home",
    protected: false,
  },
  "/auth-test": {
    title: "Test Authentication",
    namespace: "testing",
    protected: true,
  },
  "/dashboard": {
    title: "Admin Dashboard",
    namespace: "dashboard",
    protected: true,
  },
  "/dashboard/auth": {
    title: "Manage Authorization",
    namespace: "dashboard.auth",
    protected: true,
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
  "/dashboard/theme": {
    title: "Theme Presentation",
    namespace: "dashboard.theme",
    protected: false,
  },
  "/dashboard/users/*": {
    title: "List Users",
    namespace: "dashboard.users",
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
  "/test": { title: "Test Page", namespace: "test", protected: true },
};
