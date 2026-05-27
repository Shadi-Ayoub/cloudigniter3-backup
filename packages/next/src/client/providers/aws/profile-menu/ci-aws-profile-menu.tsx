"use client";

import { useEffect, useMemo } from "react";

// import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import { ciStartTraceClient } from "@cloudigniter/core/client";

import { useCiAwsLogout } from "@ci-next/client";
import type { CiNextProfileMenuProps } from "@ci-next/types";
// import { useCiLogout, CiAmplifyClientConfigurer } from "../";
import { CiProfileMenuBase } from "@ci-next/ui/client";

export function CiAwsProfileMenu({ config, dir }: CiNextProfileMenuProps) {
  const { ciLogout } = useCiAwsLogout({ redirectTo: "/login" });

  const { logger, done } = ciStartTraceClient(
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
      {/* <CiAmplifyClientConfigurer amplifyOutputs={amplifyOutputs} /> */}

      <CiProfileMenuBase
        dir={dir}
        accountItems={ciAccountItems}
        inviteItems={ciInviteItems}
        onLogout={ciLogout}
      />
    </>
  );
}
