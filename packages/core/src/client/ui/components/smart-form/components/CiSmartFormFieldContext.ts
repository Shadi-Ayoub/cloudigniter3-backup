"use client";

import { createContext } from "react";
import type { CiSmartFormFieldContextValue } from "@/client";

export const CiSmartFormFieldContext = createContext<
  CiSmartFormFieldContextValue | undefined
>(undefined);
