"use client";

import { forwardRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { useCiSmartFormField } from "../hooks/useCiSmartFormField";
import { cn, Label } from "@ci-core/client";

export const CiSmartFormLabel = forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, CiSmartFormItemId } = useCiSmartFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={CiSmartFormItemId}
      {...props}
    />
  );
});

CiSmartFormLabel.displayName = "CiSmartFormLabel";
