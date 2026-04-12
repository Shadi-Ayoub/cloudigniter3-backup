"use client";

import { useEffect } from "react";

import { withAuthenticator } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export type CiAwsLoginViewProps = {
  user?: AuthUser;
  redirectTo?: string;
};

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
