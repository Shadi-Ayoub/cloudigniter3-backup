"use client";

import { useRouter } from "next/navigation";
import { ciAwsSignOut } from "@cloudigniter/aws";

export type CiAwsLogoutButtonProps = {
  redirectTo?: string;
  className?: string;
  label?: string;
};

export function CiAwsLogoutButton({
  redirectTo = "/login",
  className = "bg-white px-2 text-black",
  label = "Sign out",
}: CiAwsLogoutButtonProps) {
  const router = useRouter();

  async function ciHandleLogout() {
    await ciAwsSignOut();
    router.push(redirectTo);
  }

  return (
    <button onClick={ciHandleLogout} className={className}>
      {label}
    </button>
  );
}
