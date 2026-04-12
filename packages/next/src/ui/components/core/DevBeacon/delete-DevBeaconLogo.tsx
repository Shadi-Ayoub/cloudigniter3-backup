'use client';

import * as React from 'react';
import { cn } from '../../shadcn/lib/utils';

type DevBeaconLogoProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Width/height of the square mark. Accepts px number or any CSS size string. */
  size?: number | string;
  /** If true, adds a helpful aria-label; otherwise decorative (aria-hidden). */
  announce?: boolean;
};

/**
 * DevBeaconLogo
 * - Non-interactive, parent handles clicks.
 * - Supply the logo via Tailwind class: bg-[url('/your-logo.svg')]
 * - Optionally add a dark variant: dark:bg-[url('/your-logo-dark.svg')]
 */
export function DevBeaconLogo({ className, size = 24, announce = false, ...props }: DevBeaconLogoProps) {
  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      {...props}
      dir='ltr'
      className={cn(
        'pointer-events-none inline-block align-middle select-none',
        'bg-contain bg-center bg-no-repeat',
        className
      )}
      style={{ width: dim, height: dim }}
      {...(announce ? { role: 'img', 'aria-label': 'CloudIgniter' } : { 'aria-hidden': true })}
    />
  );
}
