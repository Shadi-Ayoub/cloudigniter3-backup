import type { ColumnDef } from '@tanstack/react-table';
import type { TenantRow } from '@CI/types';

export const tenantColumns: ColumnDef<TenantRow>[] = [
  {
    accessorKey: 'name',
    header: 'CiTenant',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className='flex min-w-[220px] flex-col'>
          <span className='leading-tight font-medium'>{t.name}</span>
          <span className='text-muted-foreground text-xs'>{t.tenantId}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.original.slug}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className='capitalize'>{row.original.type}</span>,
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.region}</span>,
  },
  {
    accessorKey: 'usersCount',
    header: () => <div className='text-start'>Users</div>,
    cell: ({ row }) => <div className='text-start tabular-nums'>{row.original.usersCount ?? '—'}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status;

      // Keep the styling conservative; you can replace with Badge if you prefer
      const cls =
        s === 'active'
          ? 'text-foreground'
          : s === 'suspended'
            ? 'text-muted-foreground'
            : 'text-muted-foreground italic';

      return <span className={cls}>{s}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const iso = row.original.createdAt;
      const d = iso ? new Date(iso) : null;
      return <span className='text-muted-foreground whitespace-nowrap'>{d ? d.toLocaleDateString() : '—'}</span>;
    },
  },
];
