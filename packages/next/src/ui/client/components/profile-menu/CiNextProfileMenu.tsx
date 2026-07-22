"use client";

import type { CiNextProfileMenuProps } from "@ci-next/types";
import { CiNextAwsProfileMenu } from "./CiNextAwsProfileMenu";

export function CiNextProfileMenu({
  config,
  dir,
  provider = "aws",
}: CiNextProfileMenuProps) {
  switch (provider) {
    case "aws":
      return <CiNextAwsProfileMenu config={config} dir={dir} />;

    case "auth0":
    case "azure":
    case "custom":
      throw new Error(
        `CiNextProfileMenu provider "${provider}" is not implemented.`,
      );

    default: {
      const unsupportedProvider: never = provider;

      throw new Error(
        `CiNextProfileMenu received an unsupported provider "${String(
          unsupportedProvider,
        )}".`,
      );
    }
  }
}
