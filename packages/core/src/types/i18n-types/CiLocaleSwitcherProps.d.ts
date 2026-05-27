import type { CiI18nConfig, CiLocale, CiTraceConfig } from "@ci-core/types";
export interface CiLocaleSwitcherProps {
    traceConfig?: CiTraceConfig;
    menuItems: {
        key: string;
        label: string;
    }[];
    locale?: CiLocale;
    config: CiI18nConfig;
}
//# sourceMappingURL=CiLocaleSwitcherProps.d.ts.map