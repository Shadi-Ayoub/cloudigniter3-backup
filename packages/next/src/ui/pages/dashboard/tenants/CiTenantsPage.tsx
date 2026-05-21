"use client";

import { useEffect } from "react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { ciGetLangDir } from "@cloudigniter/core";
import { CiDataTable, useCiPageLoaderStore } from "@cloudigniter/core/client";
import { type CiTenantHtmlTableRow } from "@cloudigniter/core/types";

import { useTenantsLoader } from "./use-tenants-loader";
import { tenantColumns } from "./column-config";
import { tenantActions } from "./actions-config";

// type UserRow = {
//   id: string;
//   name: string;
//   email: string;
//   role: 'admin' | 'teacher' | 'student';
//   status: 'active' | 'disabled';
// };

// const columns: ColumnDef<UserRow>[] = [
//   {
//     accessorKey: 'name',
//     header: 'Name',
//     cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
//   },
//   { accessorKey: 'email', header: 'Email' },
//   {
//     accessorKey: 'role',
//     header: 'Role',
//     cell: ({ row }) => <span className='capitalize'>{row.original.role}</span>,
//   },
//   {
//     accessorKey: 'status',
//     header: 'Status',
//     cell: ({ row }) => (
//       <span className={row.original.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}>
//         {row.original.status}
//       </span>
//     ),
//   },
// ];

// const columns: ColumnDef<TenantRow>[] = [
//   {
//     accessorKey: 'name',
//     header: 'CiTenant',
//     cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
//   },
//   {
//     accessorKey: 'slug',
//     header: 'Slug',
//     cell: ({ row }) => <span className='text-muted-foreground'>{row.original.slug}</span>,
//   },
//   {
//     accessorKey: 'type',
//     header: 'Type',
//     cell: ({ row }) => <span className='capitalize'>{row.original.type}</span>,
//   },
//   {
//     accessorKey: 'region',
//     header: 'Region',
//     cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.region}</span>,
//   },
//   {
//     accessorKey: 'usersCount',
//     header: 'Users',
//     cell: ({ row }) => <span>{row.original.usersCount ?? '—'}</span>,
//   },
//   {
//     accessorKey: 'status',
//     header: 'Status',
//     cell: ({ row }) => (
//       <span className={row.original.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}>
//         {row.original.status}
//       </span>
//     ),
//   },
// ];

// const actions: DataTableAction<TenantRow>[] = [
//   {
//     id: 'view',
//     label: 'View',
//     onSelect: (t) => console.log('view', t.tenantId),
//   },
//   {
//     id: 'edit',
//     label: 'Edit',
//     onSelect: (t) => console.log('edit', t.tenantId),
//     isDisabled: (t) => t.status === 'archived',
//   },
//   {
//     id: 'toggle-status',
//     label: 'Suspend / Activate',
//     onSelect: (t) => console.log('toggle-status', t.tenantId, t.status),
//     isDisabled: (t) => t.status === 'archived',
//   },
//   {
//     id: 'delete',
//     label: 'Delete',
//     variant: 'destructive',
//     onSelect: (t) => console.log('delete', t.tenantId),
//     isVisible: (t) => !t.isSystem, // protect system tenants
//     isDisabled: (t) => t.status === 'archived',
//   },
// ];

const tenantsData: CiTenantHtmlTableRow[] = [
  {
    tenantId: "tenant-abu-dhabi",
    name: "Abu Dhabi Campus",
    slug: "abu-dhabi",
    type: "school",
    region: "UAE-AD",
    status: "active",
    usersCount: 420,
    createdAt: "2023-08-15T09:30:00Z",
  },
  {
    tenantId: "tenant-dubai",
    name: "Dubai Campus",
    slug: "dubai",
    type: "school",
    region: "UAE-DXB",
    status: "active",
    usersCount: 365,
    createdAt: "2023-08-18T10:00:00Z",
  },
  {
    tenantId: "tenant-head-office",
    name: "Head Office",
    slug: "head-office",
    type: "organization",
    region: "UAE",
    status: "active",
    isSystem: true,
    usersCount: 75,
    createdAt: "2022-12-01T08:00:00Z",
  },
  {
    tenantId: "tenant-test",
    name: "Sandbox CiTenant",
    slug: "sandbox",
    type: "department",
    region: "GLOBAL",
    status: "suspended",
    usersCount: 12,
    createdAt: "2024-02-05T14:45:00Z",
  },
];

export const CiTenantsPage = () => {
  const { setLoading } = useCiPageLoaderStore();

  const locale = useLocale();
  const messages = useMessages();
  const direction = ciGetLangDir(locale);

  // ✅ This triggers load on mount because the hook calls useEffect internally
  const { tenants, loadTenants, errorMsg } = useTenantsLoader(setLoading);

  useEffect(() => {
    // load on mount
    void loadTenants();
  }, []);

  // const actions: DataTableAction<UserRow>[] = [
  //   {
  //     id: 'view',
  //     label: 'View',
  //     onSelect: (u) => console.log('view', u.id),
  //   },
  //   {
  //     id: 'edit',
  //     label: 'Edit',
  //     onSelect: (u) => console.log('edit', u.id),
  //     isDisabled: (u) => u.status === 'disabled',
  //   },
  //   {
  //     id: 'delete',
  //     label: 'Delete',
  //     variant: 'destructive',
  //     onSelect: (u) => console.log('delete', u.id),
  //     isVisible: (u) => u.role !== 'admin', // example rule
  //   },
  // ];

  try {
    // const [successMsg, setSuccessMsg] = useState<string | null>(null);
    // const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // const handleSeedTenants = async () => {
    //   setLoading(true, 'Seeding Tenants. Please wait...');
    //   setSuccessMsg(null);
    //   setErrorMsg(null);

    //   const envMode = getEnvMode();

    //   const request: CiRequest<CiSeedTenantItem[]> = {
    //     input: tenants,
    //     envMode,
    //   };

    //   try {
    //     const result = await call<CiSeedTenantItem[], CiSeedTenantsResult>('/dashboard/tenants/seed', request);

    //     if (!result.ok) {
    //       // Unified error message from helper
    //       const msg = result.message;

    //       setErrorMsg(msg);
    //       notify('error', msg);
    //       consolePrint({
    //         label: '[TenantsPage] handleSeedTenants error:',
    //         message: result.kind,
    //         options: { messageType: 'ERROR' },
    //       });

    //       consolePrint({
    //         label: 'HTTP:',
    //         message: result.httpStatus?.toString() as string,
    //         options: { messageType: 'ERROR' },
    //       });

    //       consolePrint({
    //         label: 'response:',
    //         message: result.response as object,
    //         options: { format: 'JSON', messageType: 'ERROR' },
    //       });

    //       consolePrint({
    //         label: 'cause:',
    //         message: result.cause as object,
    //         options: { format: 'JSON', messageType: 'ERROR' },
    //       });

    //       return;
    //     }

    //     // OK path
    //     const ciResponse = result.response;

    //     // setSuccessMsg(JSON.stringify(ciResponse));

    //     consolePrint({
    //       label: 'Seed tenants response:',
    //       message: ciResponse as object,
    //       options: { format: 'JSON', messageType: 'SUCCESS' },
    //     });

    //     const msg = 'Tenants seeded successfully.';

    //     setSuccessMsg(msg);
    //     notify('success', msg);
    //   } catch (error) {
    //     const errMsg = 'Unexpected error while seeding tenants.';
    //     consolePrint({
    //       label: '[TenantsPage] handleSeedTenants error:',
    //       message: error as string,
    //       options: { messageType: 'ERROR' },
    //     });
    //     setErrorMsg(errMsg);
    //     notify('error', errMsg);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="w-full px-6">
          {errorMsg && <div className="text-red-600">{errorMsg}</div>}
          <button
            onClick={() => void loadTenants()}
            className="bg-amber-600 text-gray-800"
          >
            Refresh
          </button>
          <pre>{JSON.stringify(tenants, null, 2)}</pre>
          <CiDataTable
            title="Users"
            description="Manage system users and their access."
            columns={tenantColumns}
            data={tenantsData}
            rowActions={tenantActions}
            searchPlaceholder="Search users..."
            className="max-w-none"
            direction={direction}
          />
        </div>
        {/* <p>Tenants Management</p>
        <main className='space-y-4 p-6'>
          <h1 className='text-2xl font-semibold'>Tenants</h1>

          <button
            type='button'
            onClick={handleSeedTenants}
            disabled={isLoading}
            className='rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60'
          >
            {isLoading ? 'Seeding tenants…' : 'Seed Tenants'}
          </button>

          {successMsg && <p className='text-green-600'>{successMsg}</p>}

          {errorMsg && <p className='text-red-600'>{errorMsg}</p>}
        </main> */}
      </NextIntlClientProvider>
    );
  } catch (error) {
    throw error;
  }
};
