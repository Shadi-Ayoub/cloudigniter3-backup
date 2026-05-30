"use client";

import { createContext } from "react";
import type { CiSmartFormFieldContextValue } from "@ci-next/ui/client";

export const CiSmartFormFieldContext = createContext<
  CiSmartFormFieldContextValue | undefined
>(undefined);
