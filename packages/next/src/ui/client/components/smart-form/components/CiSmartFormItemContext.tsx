"use client";

import { createContext } from "react";
import type { CiSmartFormItemContextValue } from "@ci-next/ui/client";

export const CiSmartFormItemContext = createContext<
  CiSmartFormItemContextValue | undefined
>(undefined);
