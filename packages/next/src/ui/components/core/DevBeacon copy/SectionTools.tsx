'use client';

import * as React from 'react';
import { Button } from '@CI/ui/components/shadcn';

export interface SectionToolsProps {
  onMarkLoaded: () => void;
}

export function SectionTools({ onMarkLoaded }: SectionToolsProps) {
  React.useEffect(() => {
    const t = setTimeout(() => onMarkLoaded(), 600); // simulate async init
    return () => clearTimeout(t);
  }, [onMarkLoaded]);

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Developer Tools</h3>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='rounded-lg border p-3'>
          <div className='mb-1 font-medium'>Seed Mock Users</div>
          <p className='text-muted-foreground text-sm'>Generate a batch of test users.</p>
          <div className='mt-2'>
            <Button size='sm' variant='secondary'>
              Open
            </Button>
          </div>
        </div>
        <div className='rounded-lg border p-3'>
          <div className='mb-1 font-medium'>Health Check</div>
          <p className='text-muted-foreground text-sm'>Verify Amplify config &amp; schema.</p>
          <div className='mt-2'>
            <Button size='sm' variant='secondary'>
              Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
