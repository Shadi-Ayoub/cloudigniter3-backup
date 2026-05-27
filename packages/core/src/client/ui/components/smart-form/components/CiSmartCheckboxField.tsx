"use client";

import { AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { useField } from "formik";
import {
  Checkbox,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
} from "@ci-core/client";
import type { CiSmartCheckboxFieldProps } from "@ci-core/client";

export const CiSmartCheckboxField = ({
  name,
  label,
  iconType = "error",
  className,
  description,
  tooltip,
  disabled = false,
}: CiSmartCheckboxFieldProps) => {
  const [field, meta, helpers] = useField({ name, type: "checkbox" });
  const hasError = Boolean(meta.touched && meta.error);
  const Icon = iconType === "warning" ? AlertTriangle : AlertCircle;

  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={name}
        className={cn(
          "flex cursor-pointer items-center space-x-2",
          disabled && "opacity-50",
        )}
      >
        <Checkbox
          id={name}
          checked={field.value}
          onCheckedChange={(val: boolean | "indeterminate") =>
            helpers.setValue(val)
          }
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={cn(hasError && "border-red-500 ring-1 ring-red-500")}
        />

        {label && <span className="font-normal">{label}</span>}

        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{tooltip}</TooltipContent>
          </Tooltip>
        )}

        {hasError && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Icon
                  className="h-4 w-4 text-red-500"
                  aria-label="Field error"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{meta.error}</TooltipContent>
          </Tooltip>
        )}
      </label>

      {description && !hasError && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}

      {hasError && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {meta.error}
        </p>
      )}
    </div>
  );
};
