'use client';

import * as React from 'react';

export function DevBeaconSectionConfig() {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Configurations</h3>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <div className='rounded-lg border p-3 text-sm'>
          <div className='mb-1 font-medium'>Theme</div>
          <div>light / dark / system</div>
        </div>
        <div className='rounded-lg border p-3 text-sm'>
          <div className='mb-1 font-medium'>Locale</div>
          <div>en / ar</div>
        </div>
      </div>
    </div>
  );
}
