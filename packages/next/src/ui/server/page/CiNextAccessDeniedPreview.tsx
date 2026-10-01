import { forbidden, notFound } from "next/navigation";
import { ciGetEnvMode } from "../../../server/env/ci-get-env-mode";

/** Development-only visual check of the application's real 403 boundary. */
export function CiNextAccessDeniedPreview(): never {
  if (ciGetEnvMode() !== "development") notFound();
  forbidden();
}
