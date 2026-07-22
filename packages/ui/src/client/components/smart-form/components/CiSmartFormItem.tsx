"use client";

import { forwardRef, useId } from "react";
import { CiSmartFormItemContext } from "./CiSmartFormItemContext";
import { cn } from "@ci-ui/client";

const CiSmartFormItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = useId();

  return (
    <CiSmartFormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </CiSmartFormItemContext.Provider>
  );
});

CiSmartFormItem.displayName = "CiSmartFormItem";

export { CiSmartFormItem };
