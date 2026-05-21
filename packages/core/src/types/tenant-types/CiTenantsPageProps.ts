import type { CiTenant } from '../';

export type CiTenantsPageProps = {
  tenants: CiTenant[];
  direction: 'ltr' | 'rtl';
};
