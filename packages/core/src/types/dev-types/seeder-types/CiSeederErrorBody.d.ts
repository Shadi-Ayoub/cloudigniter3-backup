import type { CiSeederAction } from './CiSeederAction';
import type { CiSeederItemKey } from './CiSeederItemKey';
export type CiSeederErrorBody = {
    error: string;
    action: CiSeederAction;
    items: CiSeederItemKey[];
    results: Array<{
        item: CiSeederItemKey;
        ok: false;
        message: string;
    }>;
};
//# sourceMappingURL=CiSeederErrorBody.d.ts.map