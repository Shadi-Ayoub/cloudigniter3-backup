"use client";

import { createContext } from "react";
import type { CiSmartFormItemContextValue } from "@ci-ui/types";

export const CiSmartFormItemContext = createContext<
  CiSmartFormItemContextValue | undefined
>(undefined);
