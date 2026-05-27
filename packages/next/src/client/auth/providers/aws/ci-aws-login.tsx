"use client";

import { useEffect } from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import type { CiAwsLoginViewProps } from "@ci-next/types";

function CiAwsLoginView({ user, redirectTo = "/" }: CiAwsLoginViewProps) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, redirectTo, router]);

  return null;
}

export const CiAwsLoginInternal = withAuthenticator(CiAwsLoginView);
