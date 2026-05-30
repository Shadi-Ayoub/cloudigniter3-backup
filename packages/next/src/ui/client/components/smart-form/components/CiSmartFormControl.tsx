'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { useCiSmartFormField } from '../hooks/useCiSmartFormField';

const CiSmartFormControl = React.forwardRef<
  React.ComponentRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, CiSmartFormItemId, formDescriptionId, formMessageId } = useCiSmartFormField();

  return (
    <Slot
      ref={ref}
      id={CiSmartFormItemId}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});

CiSmartFormControl.displayName = 'CiSmartFormControl';

export { CiSmartFormControl };
