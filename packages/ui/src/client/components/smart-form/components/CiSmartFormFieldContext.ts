"use client";

import { createContext } from "react";
import type { CiSmartFormFieldContextValue } from "@ci-ui/types";

export const CiSmartFormFieldContext = createContext<
  CiSmartFormFieldContextValue | undefined
>(undefined);
