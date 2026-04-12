'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@CI/ui/components/shadcn/lib/utils';
import { Dialog, DialogContent, DialogOverlay, DialogTitle, ScrollArea } from '@CI/ui/components/shadcn';
import type { BeaconTabValue, DevEnv } from '@CI/types';

type SideTabsListProps = {
  loaded: boolean;
  defaultTab: BeaconTabValue;
  className?: string;
  statusContent?: React.ReactNode;
  configContent?: React.ReactNode;
  toolsContent?: React.ReactNode;
};

export interface DevBeaconModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  env?: DevEnv;
  loaded: boolean;
  defaultTab?: BeaconTabValue;
  dir?: 'ltr' | 'rtl';
  SideTabsList: React.ComponentType<SideTabsListProps>;
  SectionStatus: React.ComponentType;
  SectionConfig: React.ComponentType;
  SectionTools: React.ComponentType<{ onMarkLoaded: () => void }>;
  headerActions?: React.ReactNode;
  className?: string;
  title?: string;
}

export function DevBeaconModal({
  open,
  onOpenChange,
  env,
  loaded,
  defaultTab = 'status',
  dir = 'ltr',
  SideTabsList,
  SectionStatus,
  SectionConfig,
  SectionTools,
  headerActions,
  className,
  title = 'Developer Dashboard',
}: DevBeaconModalProps) {
  const isRTL = dir === 'rtl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className='z-overlay-2 fixed inset-0 bg-black/30 backdrop-blur-sm' />
      <DialogContent
        className={cn(
          'bg-background z-modal fixed max-h-[85vh] w-[min(100vw,1000px)] overflow-hidden rounded-2xl border p-0 shadow-xl',
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          className
        )}
      >
        {/* Header */}
        <header className='flex items-center justify-between border-b px-4 py-3'>
          <DialogTitle className='text-xl font-semibold'>
            {title}
            {env ? (
              <span
                className={cn(
                  'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                  env === 'development'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : env === 'staging'
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-muted text-foreground/60'
                )}
              >
                {String(env).toUpperCase()}
              </span>
            ) : null}
          </DialogTitle>

          <div className='flex items-center gap-2'>
            {!loaded && (
              <span className='text-muted-foreground inline-flex items-center gap-2 text-xs'>
                <Loader2 className='size-3 animate-spin' />
                Loading dashboard…
              </span>
            )}
            {headerActions}
            {/* Removed the manual close <Button> to avoid duplicate X */}
          </div>
        </header>

        {/* Body: SideTabsList controls both the list and content pane */}
        <div dir={dir} className='max-h-[calc(85vh-52px)] min-h-[50vh] overflow-hidden'>
          <SideTabsList
            loaded={loaded}
            defaultTab={defaultTab}
            className={cn(isRTL && 'border-r-0 border-l')}
            statusContent={
              <ScrollArea className='h-full pr-1'>
                <SectionStatus />
              </ScrollArea>
            }
            configContent={
              <ScrollArea className='h-full pr-1'>
                <SectionConfig />
              </ScrollArea>
            }
            toolsContent={
              <ScrollArea className='h-full pr-1'>
                <SectionTools
                  onMarkLoaded={() => {
                    /* allow parent to flip `loaded` */
                  }}
                />
              </ScrollArea>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
