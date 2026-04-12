"use client";

import { useEffect } from "react";

import { Amplify } from "aws-amplify";

import type { CiAmplifyOutputs } from "@cloudigniter/aws";

export type CiAmplifyClientConfigurerProps = {
  amplifyOutputs: CiAmplifyOutputs;
};

export function CiAmplifyClientConfigurer({
  amplifyOutputs,
}: CiAmplifyClientConfigurerProps) {
  useEffect(() => {
    Amplify.configure(amplifyOutputs, { ssr: true });
  }, [amplifyOutputs]);

  return null;
}
