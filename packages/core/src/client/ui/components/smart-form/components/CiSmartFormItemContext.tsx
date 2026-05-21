"use client";

import { createContext } from "react";
import type { CiSmartFormItemContextValue } from "@/client";

export const CiSmartFormItemContext = createContext<
  CiSmartFormItemContextValue | undefined
>(undefined);
