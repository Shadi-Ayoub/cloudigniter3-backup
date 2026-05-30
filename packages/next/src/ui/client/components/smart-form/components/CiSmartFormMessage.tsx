"use client";

import { forwardRef } from "react";
import { useCiSmartFormField } from "../hooks/useCiSmartFormField";
import { cn } from "@ci-next/ui/client";

const CiSmartFormMessage = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useCiSmartFormField();
  const body = error ? String(error ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-destructive text-[0.8rem] font-medium", className)}
      {...props}
    >
      {body}
    </p>
  );
});

CiSmartFormMessage.displayName = "CiSmartFormMessage";

export { CiSmartFormMessage };
