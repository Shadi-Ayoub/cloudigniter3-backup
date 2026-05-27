import type { CiCookiePriority } from "./CiCookiePriority";
export type CiCookieOptions = {
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
    expires?: Date;
    name?: string;
    value?: string;
    priority?: CiCookiePriority;
    partitioned?: boolean;
};
//# sourceMappingURL=CiCookieOptions.d.ts.map