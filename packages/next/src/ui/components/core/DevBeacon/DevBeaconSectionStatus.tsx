'use client';

import type { DevBeaconSectionStatusInterface } from '@CI/types';

export function DevBeaconSectionStatus({ tenant }: DevBeaconSectionStatusInterface) {
  // Placeholder values for now; wire these to your real sources (store/config/tenant resolver) as needed.
  // const tenant = {
  //   name: 'Default CiTenant',
  //   slug: 'default',
  //   status: 'active',
  // };
  const inferredTenantInfo = tenant ?? { source: 'headers' as const, scope: 'system' as const };

  const language = {
    locale: 'en',
    dir: 'ltr',
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Status</h3>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
        {/* Box 1: System Status */}
        <div className='rounded-lg border p-3'>
          <div className='mb-2 text-sm font-medium'>System Status</div>
          <ul className='space-y-2 text-sm'>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Next.js Runtime</span>
              <span className='bg-muted rounded px-2 py-0.5'>App Router</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Amplify Auth</span>
              <span className='rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-700'>OK</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Data Schema</span>
              <span className='rounded bg-amber-500/10 px-2 py-0.5 text-amber-700'>Check</span>
            </li>
          </ul>
        </div>

        {/* Box 2: Inferred CiTenant */}
        <div className='rounded-lg border p-3'>
          <div className='mb-2 text-sm font-medium'>Inferred CiTenant</div>
          <ul className='space-y-2 text-sm'>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Name</span>
              <span className='truncate'>{inferredTenantInfo.name ?? '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Scope</span>
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs'>{inferredTenantInfo.scope ?? '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Slug</span>
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs'>{inferredTenantInfo.slug ?? '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Id</span>
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs'>{inferredTenantInfo.id ?? '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Status</span>
              <span className='bg-muted rounded px-2 py-0.5'>{inferredTenantInfo.status ?? '—'}</span>
            </li>
          </ul>

          <p className='text-muted-foreground mt-2 text-xs'>
            Source: <code>{inferredTenantInfo.source}</code> (middleware headers)
          </p>
        </div>

        {/* Box 3: Language */}
        <div className='rounded-lg border p-3'>
          <div className='mb-2 text-sm font-medium'>Language</div>
          <ul className='space-y-2 text-sm'>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Locale</span>
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs'>{language.locale}</span>
            </li>
            <li className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>Direction</span>
              <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs'>{language.dir}</span>
            </li>
          </ul>
          <p className='text-muted-foreground mt-2 text-xs'>Source: i18n provider / CI config.</p>
        </div>
      </div>
    </div>
  );
}
