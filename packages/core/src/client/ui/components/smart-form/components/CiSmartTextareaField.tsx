"use client";

import { useField } from "formik";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { CiSmartFormField } from "./CiSmartFormField";
import { CiSmartFormItem } from "./CiSmartFormItem";
import { CiSmartFormLabel } from "./CiSmartFormLabel";
import { CiSmartFormControl } from "./CiSmartFormControl";
import { CiSmartFormMessage } from "./CiSmartFormMessage";
import {
  cn,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Textarea,
} from "@ci-core/client";

interface SmartTextareaFieldProps {
  name: string;
  label?: string;
  className?: string;
  iconType?: "error" | "warning";
  [key: string]: any;
}

export function CiSmartTextareaField(props: SmartTextareaFieldProps) {
  const { name, label, className, iconType = "error", ...rest } = props;

  const [field, meta] = useField(name);
  const Icon = iconType === "warning" ? AlertTriangle : AlertCircle;

  return (
    <CiSmartFormField name={name}>
      <CiSmartFormItem className={className}>
        {label && <CiSmartFormLabel htmlFor={name}>{label}</CiSmartFormLabel>}
        <CiSmartFormControl>
          <div className="relative">
            <Textarea
              id={name}
              {...field}
              {...rest}
              value={
                typeof field.value === "string"
                  ? field.value
                  : field.value != null
                  ? JSON.stringify(field.value, null, 2) // Prettified JSON for objects
                  : ""
              }
              rows={10}
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
                  <Icon
                    className="animate-fade-in absolute top-3 right-3 text-red-500"
                    size={18}
                    aria-label="Field error"
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs text-sm text-red-500"
                >
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
