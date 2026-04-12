'use client';

import * as React from 'react';

export function SectionStatus() {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>System Status</h3>
      <ul className='space-y-2 text-sm'>
        <li className='flex items-center justify-between'>
          <span>Next.js Runtime</span>
          <span className='bg-muted rounded px-2 py-0.5'>App Router</span>
        </li>
        <li className='flex items-center justify-between'>
          <span>Amplify Auth</span>
          <span className='rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-700'>OK</span>
        </li>
        <li className='flex items-center justify-between'>
          <span>Data Schema</span>
          <span className='rounded bg-amber-500/10 px-2 py-0.5 text-amber-700'>Check</span>
        </li>
      </ul>
    </div>
  );
}
