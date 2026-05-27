import { z } from "zod";
import type { CiMainMenuItem } from "@ci-core/client/ui/components/types/components-types/main-menu-types/CiMainMenuItem";
import type { CiSettingsValue } from "@ci-core/types";
export declare const CiSettingsValueSchema: z.ZodType<CiSettingsValue>;
export declare const CiGeneralSettingsSchema: z.ZodObject<{
    applicationName: z.ZodString;
}, z.core.$strip>;
export declare const CiLocaleEntrySchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const CiI18nSettingsSchema: z.ZodObject<{
    locales: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
    defaultLocale: z.ZodString;
    cookieName: z.ZodString;
}, z.core.$strip>;
export declare const CiThemeSettingsSchema: z.ZodObject<{
    defaultTheme: z.ZodString;
    storageKey: z.ZodString;
    enableSystem: z.ZodBoolean;
    enableColorScheme: z.ZodBoolean;
    disableTransitionOnChange: z.ZodBoolean;
    themes: z.ZodArray<z.ZodString>;
    attribute: z.ZodString;
}, z.core.$strip>;
export declare const CiSecuritySettingsSchema: z.ZodObject<{
    enable2FA: z.ZodBoolean;
}, z.core.$strip>;
export declare const CiEmailSettingsSchema: z.ZodObject<{
    emailSender: z.ZodString;
}, z.core.$strip>;
export declare const CiMainMenuTargetSchema: z.ZodEnum<{
    _self: "_self";
    _blank: "_blank";
}>;
export declare const CiMainMenuItemSchema: z.ZodType<CiMainMenuItem>;
export declare const CiMainMenuSettingsSchema: z.ZodArray<z.ZodType<CiMainMenuItem, unknown, z.core.$ZodTypeInternals<CiMainMenuItem, unknown>>>;
export declare const CiPublicCoreSettingsSchema: z.ZodObject<{
    general: z.ZodObject<{
        applicationName: z.ZodString;
    }, z.core.$strip>;
    i18n: z.ZodObject<{
        locales: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>>;
        defaultLocale: z.ZodString;
        cookieName: z.ZodString;
    }, z.core.$strip>;
    theme: z.ZodObject<{
        defaultTheme: z.ZodString;
        storageKey: z.ZodString;
        enableSystem: z.ZodBoolean;
        enableColorScheme: z.ZodBoolean;
        disableTransitionOnChange: z.ZodBoolean;
        themes: z.ZodArray<z.ZodString>;
        attribute: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CiPrivateCoreSettingsSchema: z.ZodObject<{
    security: z.ZodObject<{
        enable2FA: z.ZodBoolean;
    }, z.core.$strip>;
    email: z.ZodObject<{
        emailSender: z.ZodString;
    }, z.core.$strip>;
    mainMenu: z.ZodArray<z.ZodType<CiMainMenuItem, unknown, z.core.$ZodTypeInternals<CiMainMenuItem, unknown>>>;
}, z.core.$strip>;
export declare const CiUserCoreSettingsSchema: z.ZodObject<{
    locale: z.ZodOptional<z.ZodObject<{
        preferredLocale: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    theme: z.ZodOptional<z.ZodObject<{
        preferredTheme: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CiCoreSettingsFormSchema: z.ZodObject<{
    public: z.ZodObject<{
        general: z.ZodObject<{
            applicationName: z.ZodString;
        }, z.core.$strip>;
        i18n: z.ZodObject<{
            locales: z.ZodArray<z.ZodObject<{
                code: z.ZodString;
                name: z.ZodString;
            }, z.core.$strip>>;
            defaultLocale: z.ZodString;
            cookieName: z.ZodString;
        }, z.core.$strip>;
        theme: z.ZodObject<{
            defaultTheme: z.ZodString;
            storageKey: z.ZodString;
            enableSystem: z.ZodBoolean;
            enableColorScheme: z.ZodBoolean;
            disableTransitionOnChange: z.ZodBoolean;
            themes: z.ZodArray<z.ZodString>;
            attribute: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
    private: z.ZodObject<{
        security: z.ZodObject<{
            enable2FA: z.ZodBoolean;
        }, z.core.$strip>;
        email: z.ZodObject<{
            emailSender: z.ZodString;
        }, z.core.$strip>;
        mainMenu: z.ZodArray<z.ZodType<CiMainMenuItem, unknown, z.core.$ZodTypeInternals<CiMainMenuItem, unknown>>>;
    }, z.core.$strip>;
}, z.core.$loose>;
export declare const CiUserSettingsFormSchema: z.ZodObject<{
    "~standard": z.ZodStandardSchemaWithJSON<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    shape: {
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    };
    keyof(): z.ZodEnum<{
        theme: "theme";
        locale: "locale";
    }>;
    catchall<T extends z.core.SomeType>(schema: T): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$catchall<T>>;
    passthrough(): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$loose>;
    loose(): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$loose>;
    strict(): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strict>;
    strip(): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    extend<U extends z.core.$ZodLooseShape>(shape: U): z.ZodObject<(("theme" | "locale") & keyof U extends never ? {
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } & U : ({
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } extends infer T_1 extends z.core.util.SomeObject ? { [K in keyof T_1 as K extends keyof U ? never : K]: T_1[K]; } : never) & { [K_1 in keyof U]: U[K_1]; }) extends infer T ? { [k in keyof T]: T[k]; } : never, z.core.$strip>;
    safeExtend<U extends z.core.$ZodLooseShape>(shape: z.SafeExtendShape<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, U> & Partial<Record<"theme" | "locale", z.core.SomeType>>): z.ZodObject<(("theme" | "locale") & keyof U extends never ? {
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } & U : ({
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } extends infer T_1 extends z.core.util.SomeObject ? { [K in keyof T_1 as K extends keyof U ? never : K]: T_1[K]; } : never) & { [K_1 in keyof U]: U[K_1]; }) extends infer T ? { [k in keyof T]: T[k]; } : never, z.core.$strip>;
    merge<U extends z.ZodObject>(other: U): z.ZodObject<(("theme" | "locale") & keyof U["shape"] extends never ? {
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } & U["shape"] : ({
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    } extends infer T_1 extends z.core.util.SomeObject ? { [K in keyof T_1 as K extends keyof U["shape"] ? never : K]: T_1[K]; } : never) & (U["shape"] extends infer T_2 extends z.core.util.SomeObject ? { [K_1 in keyof T_2]: T_2[K_1]; } : never)) extends infer T ? { [k in keyof T]: T[k]; } : never, U["_zod"]["config"]>;
    pick<M extends z.core.util.Mask<"theme" | "locale">>(mask: M & Record<Exclude<keyof M, "theme" | "locale">, never>): z.ZodObject<Pick<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, Extract<"theme", keyof M> | Extract<"locale", keyof M>> extends infer T ? { [k in keyof T]: T[k]; } : never, z.core.$strip>;
    omit<M extends z.core.util.Mask<"theme" | "locale">>(mask: M & Record<Exclude<keyof M, "theme" | "locale">, never>): z.ZodObject<Omit<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, Extract<"theme", keyof M> | Extract<"locale", keyof M>> extends infer T ? { [k in keyof T]: T[k]; } : never, z.core.$strip>;
    partial(): z.ZodObject<{
        locale: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        theme: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    partial<M extends z.core.util.Mask<"theme" | "locale">>(mask: M & Record<Exclude<keyof M, "theme" | "locale">, never>): z.ZodObject<{
        locale: "locale" extends infer T ? T extends "locale" ? T extends keyof M ? z.ZodOptional<{
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T]> : {
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T] : never : never;
        theme: "theme" extends infer T_1 ? T_1 extends "theme" ? T_1 extends keyof M ? z.ZodOptional<{
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T_1]> : {
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T_1] : never : never;
    }, z.core.$strip>;
    required(): z.ZodObject<{
        locale: z.ZodNonOptional<z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        theme: z.ZodNonOptional<z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    required<M extends z.core.util.Mask<"theme" | "locale">>(mask: M & Record<Exclude<keyof M, "theme" | "locale">, never>): z.ZodObject<{
        locale: "locale" extends infer T ? T extends "locale" ? T extends keyof M ? z.ZodNonOptional<{
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T]> : {
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T] : never : never;
        theme: "theme" extends infer T_1 ? T_1 extends "theme" ? T_1 extends keyof M ? z.ZodNonOptional<{
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T_1]> : {
            locale: z.ZodOptional<z.ZodObject<{
                preferredLocale: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            theme: z.ZodOptional<z.ZodObject<{
                preferredTheme: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }[T_1] : never : never;
    }, z.core.$strip>;
    def: z.core.$ZodObjectDef<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }>;
    type: "object";
    _def: z.core.$ZodObjectDef<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }>;
    _output: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    };
    _input: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    };
    toJSONSchema(params?: z.core.ToJSONSchemaParams): z.core.ZodStandardJSONSchemaPayload<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    check(...checks: (z.core.CheckFn<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }> | z.core.$ZodCheck<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>)[]): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    with(...checks: (z.core.CheckFn<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }> | z.core.$ZodCheck<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>)[]): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    clone(def?: z.core.$ZodObjectDef<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }> | undefined, params?: {
        parent: boolean;
    } | undefined): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    register<R extends z.core.$ZodRegistry>(registry: R, ...meta: z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip> extends infer T ? T extends z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip> ? T extends R["_schema"] ? undefined extends R["_meta"] ? [(z.core.$replace<R["_meta"], R["_schema"] & z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>> | undefined)?] : [z.core.$replace<R["_meta"], R["_schema"] & z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>] : ["Incompatible schema"] : never : never): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    brand<T extends PropertyKey = PropertyKey, Dir extends "in" | "out" | "inout" = "out">(value?: T | undefined): PropertyKey extends T ? z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip> : z.core.$ZodBranded<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, T, Dir>;
    parse(data: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>): {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    };
    safeParse(data: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>): z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    parseAsync(data: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    safeParseAsync(data: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>;
    spa: (data: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => Promise<z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>;
    encode(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    };
    decode(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    };
    encodeAsync(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    decodeAsync(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    safeEncode(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    safeDecode(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>;
    safeEncodeAsync(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>;
    safeDecodeAsync(data: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, params?: z.core.ParseContext<z.core.$ZodIssue>): Promise<z.ZodSafeParseResult<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>;
    refine<Ch extends (arg: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }) => unknown | Promise<unknown>>(check: Ch, params?: string | {
        path?: PropertyKey[] | undefined | undefined;
        params?: Record<string, any> | undefined;
        abort?: boolean | undefined | undefined;
        when?: ((payload: z.core.ParsePayload) => boolean) | undefined | undefined;
        error?: string | z.core.$ZodErrorMap<NonNullable<z.core.$ZodIssue>> | undefined;
        message?: string | undefined | undefined;
    } | undefined): Ch extends (arg: any) => arg is infer R ? z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip> & z.ZodType<R, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, z.core.$ZodTypeInternals<R, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>> : z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    superRefine(refinement: (arg: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, ctx: z.core.$RefinementCtx<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>) => void | Promise<void>): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    overwrite(fn: (x: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }) => {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    optional(): z.ZodOptional<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    exactOptional(): z.ZodExactOptional<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    nonoptional(params?: string | z.core.$ZodNonOptionalParams): z.ZodNonOptional<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    nullable(): z.ZodNullable<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    nullish(): z.ZodOptional<z.ZodNullable<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    default(def: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodDefault<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    default(def: () => {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodDefault<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    prefault(def: () => {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodPrefault<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    prefault(def: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodPrefault<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    array(): z.ZodArray<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    or<T extends z.core.SomeType>(option: T): z.ZodUnion<[z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, T]>;
    and<T extends z.core.SomeType>(incoming: T): z.ZodIntersection<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, T>;
    transform<NewOut>(transform: (arg: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, ctx: z.core.$RefinementCtx<{
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>) => NewOut | Promise<NewOut>): z.ZodPipe<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodTransform<Awaited<NewOut>, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>;
    catch(def: {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodCatch<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    catch(def: (ctx: z.core.$ZodCatchCtx) => {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }): z.ZodCatch<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    pipe<T extends z.core.$ZodType<any, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, z.core.$ZodTypeInternals<any, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>>>(target: z.core.$ZodType<any, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }, z.core.$ZodTypeInternals<any, {
        locale?: {
            preferredLocale?: string | undefined;
        } | undefined;
        theme?: {
            preferredTheme?: string | undefined;
        } | undefined;
    }>> | T): z.ZodPipe<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, T>;
    readonly(): z.ZodReadonly<z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    describe(description: string): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    description?: string;
    meta(): {
        [x: string]: unknown;
        id?: string | undefined | undefined;
        title?: string | undefined | undefined;
        description?: string | undefined | undefined;
        deprecated?: boolean | undefined | undefined;
    } | undefined;
    meta(data: {
        [x: string]: unknown;
        id?: string | undefined | undefined;
        title?: string | undefined | undefined;
        description?: string | undefined | undefined;
        deprecated?: boolean | undefined | undefined;
    }): z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    isOptional(): boolean;
    isNullable(): boolean;
    apply<T>(fn: (schema: z.ZodObject<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>) => T): T;
    _zod: z.core.$ZodObjectInternals<{
        locale: z.ZodOptional<z.ZodObject<{
            preferredLocale: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        theme: z.ZodOptional<z.ZodObject<{
            preferredTheme: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$loose>;
//# sourceMappingURL=index.d.ts.map