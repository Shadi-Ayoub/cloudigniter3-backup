"use client";

import { useEffect, useMemo } from "react";

import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import { ciStartTrace } from "@cloudigniter/core";

import type { CiResolvedPageConfig } from "@/.";
import { useCiLogout, CiAmplifyClientConfigurer } from "../";
import { CiProfileMenuBase } from "@/ui";
import {} from "../";

export type CiAwsProfileMenuProps = {
  config: CiResolvedPageConfig;
  dir: "ltr" | "rtl";
  amplifyOutputs: CiAmplifyOutputs;
};

export function CiAwsProfileMenu({
  config,
  dir,
  amplifyOutputs,
}: CiAwsProfileMenuProps) {
  const { ciLogout } = useCiLogout({ redirectTo: "/login" });

  const { logger, done } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "client", tag: "CiAwsProfileMenu" },
    { name: "<CiAwsProfileMenu />" },
  );

  useEffect(() => {
    done({ phase: "mount" });
    logger.log({ type: "ui", event: "mount <CiAwsProfileMenu>" });

    return () => {
      logger.log({ type: "ui", event: "unmount <CiAwsProfileMenu>" });
    };
  }, [done, logger]);

  const ciAccountItems = useMemo(
    () => [
      { label: "Profile", shortcut: "⇧⌘P" },
      { label: "Billing", shortcut: "⌘B" },
      { label: "Settings", shortcut: "⌘S" },
      { label: "Keyboard shortcuts", shortcut: "⌘K" },
    ],
    [],
  );

  const ciInviteItems = useMemo(
    () => [{ label: "Email" }, { label: "Message" }, { label: "More..." }],
    [],
  );

  return (
    <>
      <CiAmplifyClientConfigurer amplifyOutputs={amplifyOutputs} />

      <CiProfileMenuBase
        dir={dir}
        accountItems={ciAccountItems}
        inviteItems={ciInviteItems}
        onLogout={ciLogout}
      />
    </>
  );
}
