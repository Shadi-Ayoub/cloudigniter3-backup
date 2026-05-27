// 'use client';

// import React, { useState } from 'react';

// import type { DataTableConfig, DataTableUserRecord } from '@CI/types';
// import { DataTable, processColumns } from '@CI/ui/components/compositions/DataTable';
// import { Button } from '@CI/ui/components/shadcn/button';

// interface UsersManagementTableInterface {
//   records: DataTableUserRecord[];
//   dataTableConfig: DataTableConfig<DataTableUserRecord, unknown>;
// }
// export function UsersManagementTable({ records, dataTableConfig }: UsersManagementTableInterface) {
//   const [users, setUsers] = useState<DataTableUserRecord[]>(records);

//   // Mock create user
//   const createUser = () => {
//     const now = new Date().toISOString();
//     const newUser: DataTableUserRecord = {
//       id: Math.random().toString(36).substr(2, 9),
//       name: 'New User',
//       email: `new.user.${Date.now()}@example.com`,
//       groups: 'User',
//       createdAt: now,
//       lastActiveAt: now, // just logged in
//       status: undefined, // will compute to active
//       justCreated: true,
//     };
//     setUsers((prev) => [newUser, ...prev]);
//     setTimeout(() => {
//       setUsers((prev) => prev.map((u) => (u.id === newUser.id ? { ...u, justCreated: false } : u)));
//     }, 5000);
//   };

//   const columns = processColumns(dataTableConfig.columns, dataTableConfig.model);

//   return (
//     <div className='p-4'>
//       <div className='mb-4 flex items-center justify-between'>
//         <Button onClick={createUser}>Create User</Button>
//       </div>
//       <DataTable<DataTableUserRecord>
//         data={users}
//         columns={columns}
//         filterColumn='name'
//         pageSizeOptions={[10, 25, 50, 100]}
//         initialPageSize={10}
//         searchPlaceholder='Search users...'
//         infiniteScroll={false}
//         rowClassName={(row) => {
//           const justCreated = row.original.justCreated;
//           const baseClasses = ['ci-dt-row'];
//           const newRow = justCreated ? 'ci-dt-new-row' : '';
//           return [...baseClasses, newRow].filter(Boolean).join(' ');
//         }}
//       />
//     </div>
//   );
// }
