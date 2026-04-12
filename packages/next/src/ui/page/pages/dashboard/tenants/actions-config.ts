import type { DataTableAction, TenantRow } from '@CI/types';

export const tenantActions = [
  {
    id: 'view',
    label: 'View',
    onSelect: (t: TenantRow) => console.log('view', t.tenantId),
  },
  {
    id: 'edit',
    label: 'Edit',
    onSelect: (t: TenantRow) => console.log('edit', t.tenantId),
    isDisabled: (t: TenantRow) => t.status === 'archived',
  },
  {
    id: 'toggle-status',
    label: 'Suspend / Activate',
    onSelect: (t: TenantRow) => console.log('toggle-status', t.tenantId, t.status),
    isDisabled: (t: TenantRow) => t.status === 'archived' || t.isSystem === true,
  },
  {
    id: 'delete',
    label: 'Delete',
    variant: 'destructive',
    onSelect: (t: TenantRow) => console.log('delete', t.tenantId),
    isVisible: (t: TenantRow) => !t.isSystem,
    isDisabled: (t: TenantRow) => t.status === 'archived',
  },
] satisfies DataTableAction<TenantRow>[];
