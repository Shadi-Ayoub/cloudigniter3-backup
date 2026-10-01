"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { ciAwsSignOut } from "@cloudigniter/aws/client";
import {
  CiProfileMenu,
  ciStartTraceClient,
  useCiPageLoaderStore,
} from "@cloudigniter/ui/client";
import type { CiProfileMenuItem } from "@cloudigniter/core/types";

import type { CiNextAwsProfileMenuProps } from "@ci-next/types";

export function CiNextAwsProfileMenu({
  config,
  accountItems,
  inviteItems,
  logoutRedirectTo = "/login",
  ...profileMenuProps
}: CiNextAwsProfileMenuProps) {
  const router = useRouter();
  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  const { logger, done } = useMemo(
    () =>
      ciStartTraceClient(
        config.appCoreConfig.dev.traceLog,
        {
          source: "client",
          tag: "CiNextAwsProfileMenu",
        },
        {
          name: "<CiNextAwsProfileMenu />",
        },
      ),
    [config.appCoreConfig.dev.traceLog],
  );

  useEffect(() => {
    done({ phase: "mount" });

    logger.log({
      type: "ui",
      event: "mount <CiNextAwsProfileMenu>",
    });

    return () => {
      logger.log({
        type: "ui",
        event: "unmount <CiNextAwsProfileMenu>",
      });
    };
  }, [done, logger]);

  const ciDefaultAccountItems = useMemo<CiProfileMenuItem[]>(
    () => [
      {
        id: "profile",
        label: "Profile",
        shortcut: "⇧⌘P",
      },
      {
        id: "billing",
        label: "Billing",
        shortcut: "⌘B",
      },
      {
        id: "settings",
        label: "My Preferences",
        onSelect: () => {
          if (window.location.pathname === "/account/settings") return;
          const returnTo = window.location.pathname + window.location.search;
          setLoading(true);
          router.push(
            `/account/settings?returnTo=${encodeURIComponent(returnTo)}`,
          );
        },
      },
      {
        id: "keyboard-shortcuts",
        label: "Keyboard shortcuts",
        shortcut: "⌘K",
      },
    ],
    [router, setLoading],
  );

  const ciDefaultInviteItems = useMemo<CiProfileMenuItem[]>(
    () => [
      {
        id: "invite-email",
        label: "Email",
      },
      {
        id: "invite-message",
        label: "Message",
      },
      {
        id: "invite-more",
        label: "More...",
      },
    ],
    [],
  );

  async function handleLogout(): Promise<void> {
    setLoading(true, "Signing you out. Please wait.");

    try {
      logger.log({
        type: "auth",
        scope: "profile-menu",
        event: "logout started",
      });

      await ciAwsSignOut();

      logger.log({
        type: "auth",
        scope: "profile-menu",
        event: "logout completed",
      });

      router.replace(logoutRedirectTo);
    } catch (error) {
      logger.log({
        type: "auth",
        scope: "profile-menu",
        event: "logout failed",
        data:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : {
                error: String(error),
              },
      });

      setLoading(false);
      throw error;
    }
  }

  return (
    <CiProfileMenu
      {...profileMenuProps}
      accountItems={accountItems ?? ciDefaultAccountItems}
      inviteItems={inviteItems ?? ciDefaultInviteItems}
      onLogout={handleLogout}
    />
  );
}
