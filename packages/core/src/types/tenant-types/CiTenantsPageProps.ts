import type { CiTenant } from "./CiTenant";

export type CiTenantsPageProps = {
  tenants: CiTenant[];
  direction: "ltr" | "rtl";
};
