import type { CiRoutesMap } from "@/types";

export const ciCoreRoutes: CiRoutesMap = {
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
    namespace: "authorization",
    protected: true,
  },
  "/dashboard/dev": {
    title: "Developer Toolbox",
    namespace: "dev",
    protected: true,
  },
  "/dashboard/dev/install1": {
    title: "CloudIgniter Application Installation Page",
    namespace: "dev",
    protected: false,
  },
  "/dashboard/dev/sandbox/*": {
    title: "CloudIgniter Application Sandbox Section",
    namespace: "dev",
    protected: true,
  },
  "/dashboard/dev/seeder/*": {
    title: "CloudIgniter Application Seeder Tool",
    namespace: "dev",
    protected: true,
  },
  "/dashboard/settings": {
    title: "Manage Settings",
    namespace: "systemSettings",
    protected: true,
  },
  "/dashboard/tenants": {
    title: "Manage Tenants",
    namespace: "tenants",
    protected: true,
  },
  "/dashboard/theme": {
    title: "Theme Presentation",
    namespace: "theme",
    protected: false,
  },
  "/dashboard/users/*": {
    title: "List Users",
    namespace: "users",
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
