import * as React from 'react';

import { cn } from './lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'box-border border-input placeholder:text-muted-foreground focus-visible:border-2 focus-visible:border-zinc-950 focus-visible:ring-0 flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:focus-visible:border-zinc-300',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
