"use client";

import { createContext } from "react";
import type { CiSmartFormFieldContextValue } from "@ci-core/client";

export const CiSmartFormFieldContext = createContext<
  CiSmartFormFieldContextValue | undefined
>(undefined);
