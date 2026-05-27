"use client";

import { useFormikContext } from "formik";
import { type CiCoreSettingsFormValues } from "@cloudigniter/core/types";

export const useSettingsForm = <
  T extends CiCoreSettingsFormValues = CiCoreSettingsFormValues,
>() => {
  return useFormikContext<T>();
};
