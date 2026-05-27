import type { CiSeederAction } from './CiSeederAction';
import type { CiSeederItemKey } from './CiSeederItemKey';
export type CiSeederResponseBody = {
    action: CiSeederAction;
    items: CiSeederItemKey[];
    results: Array<{
        item: CiSeederItemKey;
        ok: boolean;
        message?: string;
        count?: number;
        error?: unknown;
    }>;
};
//# sourceMappingURL=CiSeederResponseBody.d.ts.map