"use client";

import { createContext } from "react";
import type { CiSmartFormItemContextValue } from "@ci-core/client";

export const CiSmartFormItemContext = createContext<
  CiSmartFormItemContextValue | undefined
>(undefined);
