"use client";

import { useContext } from "react";
import { useFormikContext } from "formik";

import { CiSmartFormFieldContext } from "../components/CiSmartFormFieldContext";
import { CiSmartFormItemContext } from "../components/CiSmartFormItemContext";

export const useCiSmartFormField = () => {
  const fieldContext = useContext(CiSmartFormFieldContext);
  const itemContext = useContext(CiSmartFormItemContext);
  const formik = useFormikContext();

  if (!fieldContext) {
    throw new Error(
      "useCiSmartFormField should be used within <CiSmartFormField>",
    );
  }

  const name = fieldContext.name;
  const error = (formik.errors as Record<string, any>)[name];
  const touched = (formik.touched as Record<string, any>)[name];
  const showError = touched && error;

  const id = itemContext?.id ?? name;

  return {
    id,
    name,
    error: showError ? error : null,
    CiSmartFormItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  };
};
