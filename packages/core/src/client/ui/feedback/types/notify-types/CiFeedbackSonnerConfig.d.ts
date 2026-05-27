import type { ToasterProps, ExternalToast } from "sonner";
import type { CiToneTokens } from "./CiToneTokens";
export type CiFeedbackSonnerConfig = {
    enabled?: boolean;
    toaster?: Partial<ToasterProps>;
    toastDefaults?: Partial<ExternalToast>;
    /**
     * CI convenience: maps semantic levels to class tokens.
     * - Used to populate Toaster.toastOptions.classNames
     * - Optionally applied to per-toast className if caller didn't provide one
     */
    toneTokens?: CiToneTokens;
};
//# sourceMappingURL=CiFeedbackSonnerConfig.d.ts.map