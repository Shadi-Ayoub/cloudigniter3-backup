import type { ToasterProps, ExternalToast } from "sonner";
import type { CiToneTokens } from "./CiToneTokens";

export type CiFeedbackRuntimeOverrides = {
  toaster?: Partial<ToasterProps>;
  toastDefaults?: Partial<ExternalToast>;
  toneTokens?: CiToneTokens;
};
