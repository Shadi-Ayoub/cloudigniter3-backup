import { createContext } from "react";
import type { CiSmartFormItemContextValue } from "../types";

export const CiSmartFormItemContext = createContext<
  CiSmartFormItemContextValue | undefined
>(undefined);
