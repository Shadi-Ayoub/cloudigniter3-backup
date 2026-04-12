import { createContext } from 'react';
import type { CiSmartFormFieldContextValue } from '../types';

export const CiSmartFormFieldContext = createContext<CiSmartFormFieldContextValue | undefined>(undefined);
