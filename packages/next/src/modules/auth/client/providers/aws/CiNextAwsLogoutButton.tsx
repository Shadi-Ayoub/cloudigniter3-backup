"use client";

import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import type { CiAwsLogoutButtonProps } from "@ci-next/types";

export function CiNextAwsLogoutButton({
  redirectTo = "/login",
  className = "bg-primary px-2 text-primary-foreground",
  label = "Sign out",
}: CiAwsLogoutButtonProps) {
  const router = useRouter();

  async function ciHandleLogout() {
    await signOut();
    router.push(redirectTo);
  }

  return (
    <button onClick={ciHandleLogout} className={className}>
      {label}
    </button>
  );
}
