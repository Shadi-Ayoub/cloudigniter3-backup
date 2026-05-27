import type { ExternalToast } from "sonner";
import type { CiDeliveryChannel } from "./CiDeliveryChannel";
import type { CiFeedbackSeverity } from "./CiFeedbackSeverity";
export type CiNotifyOptions = {
    channel?: CiDeliveryChannel;
    modal?: {
        id?: string;
        title?: string;
        sticky?: boolean;
        open?: boolean;
        isCritical?: boolean;
        severityOverride?: CiFeedbackSeverity;
    };
    toast?: Partial<ExternalToast>;
};
//# sourceMappingURL=CiNotifyOptions.d.ts.map