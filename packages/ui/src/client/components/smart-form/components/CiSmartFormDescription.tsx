"use client";

import { forwardRef } from "react";
import { useCiSmartFormField } from "../hooks/useCiSmartFormField";
import { cn } from "@ci-ui/client";

const CiSmartFormDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useCiSmartFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-muted-foreground text-[0.8rem]", className)}
      {...props}
    />
  );
});

CiSmartFormDescription.displayName = "CiSmartFormDescription";

export { CiSmartFormDescription };
