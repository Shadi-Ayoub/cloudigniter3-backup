"use client";

import { z } from "zod";
import { Formik, Form } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useState } from "react";
import { CiCoreSettingsFormSchema } from "@cloudigniter/core/lib";
import { TooltipProvider } from "@ci-next/ui/client";
import {
  type CiResponse,
  type CiSettings,
  type CiSettingsPageProps,
} from "@cloudigniter/core/types";

import { fieldLabels, fieldSectionMap, baseTabs } from "./ci-config";
import { CiSettingsFormContent } from "./CiSettingsFormContent";

export function CiSettingsForm<
  TExtendedSchema extends z.ZodRawShape = z.ZodRawShape,
>(props: CiSettingsPageProps<TExtendedSchema>) {
  const t = useTranslations("systemSettings");

  const {
    extendedZodSchema,
    settings,
    extendedTabs = [],
    submitUrl = "/dashboard/settings/save",
    direction,
  } = props.input;

  if (!settings) {
    throw new Error("CiSettingsForm: settings are undefined");
  }

  // const mergedSchema = extendedZodSchema
  //   ? CiCoreSettingsFormSchema.extend(extendedZodSchema.shape)
  //   : CiCoreSettingsFormSchema;

  const mergedSchema = (
    extendedZodSchema
      ? CiCoreSettingsFormSchema.extend(extendedZodSchema.shape)
      : CiCoreSettingsFormSchema
  ) as z.ZodType<CiSettings & Record<string, unknown>>;

  const allTabs = [...baseTabs, ...extendedTabs];
  const [activeTabId, setActiveTabId] = useState<string>(
    allTabs[0]?.id ?? "general",
  );

  return (
    <TooltipProvider>
      <Formik
        initialValues={{ ...settings }}
        validationSchema={toFormikValidationSchema(mergedSchema)}
        onSubmit={async (data, actions) => {
          actions.setSubmitting(true);

          try {
            const res = await fetch(submitUrl, {
              method: "POST",
              body: JSON.stringify(data),
              headers: { "Content-Type": "application/json" },
            });

            const result = (await res.json()) as CiResponse<
              unknown,
              { error?: string }
            >;

            if (res.ok && result.statusCode === 200) {
              toast.success("Settings saved");
              return;
            }

            const errorMessage =
              !result.ok &&
              result.body &&
              typeof result.body === "object" &&
              "error" in result.body
                ? String(result.body.error ?? "Failed to save settings")
                : "Failed to save settings";

            toast.error(errorMessage);
          } catch {
            toast.error("Unexpected error");
          } finally {
            actions.setSubmitting(false);
          }
        }}
        validateOnBlur={false}
        validateOnChange={false}
      >
        {({ isSubmitting }) => (
          <Form>
            <CiSettingsFormContent
              allTabs={allTabs}
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
              t={t}
              fieldLabels={fieldLabels}
              fieldSectionMap={fieldSectionMap}
              loading={isSubmitting}
              direction={direction}
            />
          </Form>
        )}
      </Formik>
    </TooltipProvider>
  );
}
