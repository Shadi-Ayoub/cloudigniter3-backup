import type { ToasterProps, ExternalToast } from "sonner";
import type { CiToneTokens } from "./CiToneTokens";

export type CiFeedbackSonnerConfigResolved = {
  enabled: boolean;
  toaster: Partial<ToasterProps>;
  toastDefaults: Partial<ExternalToast>;
  toneTokens: CiToneTokens; // now guaranteed
};
