"use client";

import { ciResolveAuthProvider } from "@/ui";
import type { CiProfileMenuProps } from "../types";
import { CiAwsProfileMenu } from "@/providers/";

export function CiProfileMenu({ config, dir, provider }: CiProfileMenuProps) {
  const ciProvider = ciResolveAuthProvider(provider);

  switch (ciProvider) {
    case "aws": {
      /**
       * For provider-aware rendering, the AWS-specific implementation must
       * receive AWS-specific inputs from an AWS-aware boundary.
       *
       * Here we assume the resolved config exposes a provider section.
       * If not, inject it from a higher AWS-aware wrapper instead.
       */
      const ciAwsConfig = config.providers?.aws;

      if (!ciAwsConfig?.amplifyOutputs) {
        throw new Error(
          'CiProfileMenu requires providers.aws.amplifyOutputs when provider="aws".',
        );
      }

      return (
        <CiAwsProfileMenu
          config={config}
          dir={dir}
          amplifyOutputs={ciAwsConfig.amplifyOutputs}
        />
      );
    }

    case "auth0":
    case "azure":
    case "custom":
      throw new Error(
        `CiProfileMenu provider "${ciProvider}" is not implemented.`,
      );

    default:
      throw new Error(
        `CiProfileMenu received an unsupported provider "${String(
          ciProvider,
        )}".`,
      );
  }
}
