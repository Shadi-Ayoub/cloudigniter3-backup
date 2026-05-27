"use client";

import { useField } from "formik";
import { AlertCircle } from "lucide-react";
import { Input } from "@ci-core/client";
import { CiSmartFormField } from "./CiSmartFormField";
import { CiSmartFormItem } from "./CiSmartFormItem";
import { CiSmartFormLabel } from "./CiSmartFormLabel";
import { CiSmartFormControl } from "./CiSmartFormControl";
import { CiSmartFormMessage } from "./CiSmartFormMessage";
import { cn, Tooltip, TooltipTrigger, TooltipContent } from "@ci-core/client";
import type { CiFormFieldProps } from "@ci-core/client";

export function CiSmartInputField(props: CiFormFieldProps) {
  const {
    name,
    label,
    iconType = "error",
    className,
    inputType = "text",
    ...rest
  } = props;

  const [field, meta] = useField(name);

  return (
    <CiSmartFormField name={name}>
      <CiSmartFormItem className={className}>
        {label && <CiSmartFormLabel htmlFor={name}>{label}</CiSmartFormLabel>}
        <CiSmartFormControl>
          <div className="relative">
            <Input
              id={name}
              type={inputType}
              {...field}
              {...rest}
              className={cn(
                "w-full rounded border px-3 py-2 transition-colors focus:outline-none",
                meta.touched && meta.error
                  ? "border-red-500 ring-red-500 focus-visible:ring-red-500"
                  : "focus-visible:ring-ring border-gray-300",
                className,
              )}
              aria-invalid={!!meta.error}
              aria-describedby={meta.error ? `${name}-error` : undefined}
            />
            {meta.touched && meta.error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-red-500"
                    size={18}
                    aria-label="Field error"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm text-red-500">
                  {meta.error}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CiSmartFormControl>
        <CiSmartFormMessage
          id={`${name}-error`}
          className="text-sm text-red-500"
        >
          {meta.touched && meta.error && meta.error}
        </CiSmartFormMessage>
      </CiSmartFormItem>
    </CiSmartFormField>
  );
}
