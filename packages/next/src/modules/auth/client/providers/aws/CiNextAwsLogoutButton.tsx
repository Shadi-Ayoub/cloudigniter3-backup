"use client";

import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import type { CiAwsLogoutButtonProps } from "@ci-next/types";

export function CiNextAwsLogoutButton({
  redirectTo = "/login",
  className = "bg-white px-2 text-black",
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
