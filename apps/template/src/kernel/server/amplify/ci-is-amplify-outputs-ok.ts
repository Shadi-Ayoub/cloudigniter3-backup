import { cache } from "react";
import outputs from "@/../amplify_outputs.json";

export const ciIsAmplifyOutputsOk = cache(() => {
  if (outputs && outputs.auth) {
    return true;
  }

  return false;
});
