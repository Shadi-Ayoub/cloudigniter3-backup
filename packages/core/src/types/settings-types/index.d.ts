import type { ReactNode } from "react";
import type { z } from "zod";
import { CiCoreSettingsFormSchema, CiUserSettingsFormSchema } from "@ci-core/lib";
import type { CiTenantScope } from "@ci-core/types";
export type { CiScopedSettingsScope } from "./CiScopedSettingsScope";
export type { CiBuildSettingsKeysInput } from "./CiBuildSettingsKeysInput";
export type { CiSettingsKey } from "./CiSettingsKey";
export type { CiGetSettingsApiInterface } from "./CiGetSettingsApiInterface";
export type { CiGetSettingsHandlerInput } from "./CiGetSettingsHandlerInput";
export type { CiGetSettingsHandlerOutput } from "./CiGetSettingsHandlerOutput";
export type { CiSettingsGroupResult } from "./CiSettingsGroupResult";
export type CiSettingsValue = string | number | boolean | null | CiSettingsValue[] | {
    [key: string]: CiSettingsValue;
};
export type CiSettings = {
    [key: string]: CiSettingsValue;
};
export type CiSettingsScope = "public" | "private" | "user";
export type CiTargetTenantScope = "system" | "global" | "tenant";
export type CiSettingsId = string;
export type CiSettingsPath = string;
export type CiSettingsRecord<TSettings extends CiSettings = CiSettings> = {
    settingsId: CiSettingsId;
    scope: CiSettingsScope;
    targetTenantScope: CiTargetTenantScope;
    tenantId?: string;
    userId?: string;
    value: Partial<TSettings>;
    createdAt?: string;
    updatedAt?: string;
};
export type CiSettingsRegistryEntry<TSettings extends CiSettings = CiSettings> = {
    scope: CiSettingsScope;
    defaults: TSettings;
    schema?: z.ZodType<TSettings>;
    allowClientRead?: boolean;
    allowClientWrite?: boolean;
    mergeWithCore?: boolean;
    meta?: {
        title?: string;
        description?: string;
        order?: number;
    };
};
export type CiSettingsRegistryMap = Record<CiSettingsId, CiSettingsRegistryEntry>;
export type CiSettingsRegistry = {
    entries: CiSettingsRegistryMap;
    get: (settingsId: CiSettingsId) => CiSettingsRegistryEntry;
    list: () => CiSettingsRegistryMap;
    listByScope: (scope: CiSettingsScope) => CiSettingsRegistryMap;
};
export type CiSettingsStoreGetInput = {
    settingsId: CiSettingsId;
    scope: CiSettingsScope;
    targetTenantScope: CiTargetTenantScope;
    tenantId?: string;
    userId?: string;
};
export type CiSettingsStoreSetInput<TSettings extends CiSettings = CiSettings> = CiSettingsStoreGetInput & {
    value: Partial<TSettings>;
};
export type CiSettingsStoreDeleteInput = CiSettingsStoreGetInput;
export type CiSettingsStore = {
    get: <TSettings extends CiSettings = CiSettings>(input: CiSettingsStoreGetInput) => Promise<CiSettingsRecord<TSettings> | null>;
    set: <TSettings extends CiSettings = CiSettings>(input: CiSettingsStoreSetInput<TSettings>) => Promise<CiSettingsRecord<TSettings>>;
    delete: (input: CiSettingsStoreDeleteInput) => Promise<void>;
};
export type CiResolvedSettings<TSettings extends CiSettings = CiSettings> = {
    settingsId: CiSettingsId;
    scope: CiSettingsScope;
    value: TSettings;
    defaults: TSettings;
    layers: {
        system?: CiSettingsRecord<TSettings> | null;
        global?: CiSettingsRecord<TSettings> | null;
        tenant?: CiSettingsRecord<TSettings> | null;
        user?: CiSettingsRecord<TSettings> | null;
    };
};
export type CiGetSettingsInput = {
    settingsId: CiSettingsId;
    tenantId?: string;
    userId?: string;
};
export type CiSetSettingsInput<TSettings extends CiSettings = CiSettings> = {
    settingsId: CiSettingsId;
    scope?: CiSettingsScope;
    targetTenantScope: CiTargetTenantScope;
    tenantId?: string;
    userId?: string;
    value: Partial<TSettings>;
};
export type CiDeleteSettingsInput = {
    settingsId: CiSettingsId;
    scope?: CiSettingsScope;
    targetTenantScope: CiTargetTenantScope;
    tenantId?: string;
    userId?: string;
};
export type CiSettingsService = {
    get: <TSettings extends CiSettings = CiSettings>(input: CiGetSettingsInput) => Promise<CiResolvedSettings<TSettings>>;
    set: <TSettings extends CiSettings = CiSettings>(input: CiSetSettingsInput<TSettings>) => Promise<CiSettingsRecord<TSettings>>;
    delete: (input: CiDeleteSettingsInput) => Promise<void>;
};
export type CiCreateSettingsServiceInput = {
    registry: CiSettingsRegistry;
    store: CiSettingsStore;
};
export type CiSettingsContextValue = {
    settings: CiSettings;
};
export type CiSettingsProviderProps = {
    settings: CiSettings;
    children: ReactNode;
};
export type CiUseSettingsResult<TSettings extends CiSettings = CiSettings> = {
    settings: TSettings;
};
export type CiUseSettingValueResult<TValue = unknown> = {
    value: TValue | undefined;
};
import type { CiLocaleDirection } from "@ci-core/types";
export type CiSettingsPageExtendedTabComponentProps = {
    direction?: CiLocaleDirection;
};
export type CiSettingsPageExtendedTab = {
    id: string;
    label: string;
    Component: React.ComponentType<CiSettingsPageExtendedTabComponentProps>;
    description?: string;
    icon?: React.ReactNode;
};
export type CiCoreSettingsFormValues = z.infer<typeof CiCoreSettingsFormSchema>;
export type CiUserSettingsFormValues = z.infer<typeof CiUserSettingsFormSchema>;
export type CiSettingsPageProps<T extends z.ZodRawShape = {}> = {
    input: {
        settings: CiSettings;
        direction: "ltr" | "rtl";
        submitUrl?: string;
        extendedZodSchema?: z.ZodObject<T>;
        values?: z.infer<z.ZodObject<T>> & Partial<CiCoreSettingsFormValues>;
        extendedTabs?: CiSettingsPageExtendedTab[];
    };
};
export type CiUserSettingsPageProps<T extends z.ZodRawShape = {}> = {
    input: {
        settings: CiSettings;
        direction: "ltr" | "rtl";
        submitUrl?: string;
        extendedZodSchema?: z.ZodObject<T>;
        values?: z.infer<z.ZodObject<T>> & Partial<CiUserSettingsFormValues>;
        extendedTabs?: CiSettingsPageExtendedTab[];
    };
};
export type CiInitializeCoreUserSettingsIfMissingResult = {
    ok: true;
    initialized: boolean;
    settingsId: "core";
    scope: "user";
    tenantId?: string;
    userId: string;
};
export type CiSeedCorePublicSettingsInput = {
    service: CiSettingsService;
    targetTenantScope?: Extract<CiTenantScope, "system" | "global" | "tenant">;
    tenantId?: string;
};
export type CiSeedCorePrivateSettingsInput = {
    service: CiSettingsService;
    targetTenantScope?: Extract<CiTenantScope, "system" | "global" | "tenant">;
    tenantId?: string;
};
export type CiSeedCoreSettingsInput = {
    service: CiSettingsService;
    targetTenantScope?: Extract<CiTenantScope, "system" | "global" | "tenant">;
    tenantId?: string;
    includePublic?: boolean;
    includePrivate?: boolean;
};
export type CiSeedCoreUserSettingsInput = {
    service: CiSettingsService;
    userId: string;
    tenantId?: string;
};
//# sourceMappingURL=index.d.ts.map