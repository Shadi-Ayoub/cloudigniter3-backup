"use client";

import { useState } from "react";
import { IoLogOutOutline, IoPersonOutline } from "react-icons/io5";

import {
  Button,
  CiTooltipBalloon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@ci-ui/client";

import { CI_DEFAULT_PROFILE_MENU_MESSAGES } from "@cloudigniter/core/lib";
import type {
  CiProfileMenuMessages,
  CiProfileMenuProps,
} from "@cloudigniter/core/types";

type CiProfileMenuAction = () => void | Promise<void>;

/**
 * Wraps an optional synchronous or asynchronous profile-menu action
 * in a dropdown-compatible selection handler.
 */
function ciCreateSelectHandler(
  action?: CiProfileMenuAction,
): (() => void) | undefined {
  if (!action) {
    return undefined;
  }

  return () => {
    void action();
  };
}

export function CiProfileMenu({
  dir,
  accountItems = [],
  inviteItems = [],
  onLogout,
  messages,
  onTeamSelect,
  onNewTeamSelect,
  onGitHubSelect,
  onSupportSelect,
  onApiSelect,
  showTeamSection = true,
  showResourceSection = true,
}: CiProfileMenuProps) {
  const [ciMenuOpen, setCiMenuOpen] = useState(false);

  const ciMessages: CiProfileMenuMessages = {
    ...CI_DEFAULT_PROFILE_MENU_MESSAGES,
    ...messages,
  };

  const visibleAccountItems = accountItems.filter((item) => !item.hidden);
  const visibleInviteItems = inviteItems.filter((item) => !item.hidden);

  return (
    <DropdownMenu modal={false} dir={dir} onOpenChange={setCiMenuOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ci-header-menu-button-rounded"
                aria-label={ciMessages.profileMenuLabel}
              >
                <IoPersonOutline aria-hidden="true" />

                <span className="ci-screen-reader-only">
                  {ciMessages.profileMenuLabel}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          {!ciMenuOpen ? (
            <CiTooltipBalloon content={ciMessages.profileTooltip} />
          ) : null}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event: Event) => event.preventDefault()}
        className="ci-menu-content w-56"
      >
        <DropdownMenuLabel>{ciMessages.accountLabel}</DropdownMenuLabel>

        {visibleAccountItems.length > 0 ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {visibleAccountItems.map((item, index) => (
                <DropdownMenuItem
                  key={item.id ?? `${index}-${String(item.label)}`}
                  className="ci-menu-item"
                  disabled={item.disabled}
                  onSelect={ciCreateSelectHandler(item.onSelect)}
                >
                  {item.label}

                  {item.shortcut ? (
                    <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}

        {showTeamSection ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="ci-menu-item"
                disabled={!onTeamSelect}
                onSelect={ciCreateSelectHandler(onTeamSelect)}
              >
                {ciMessages.teamLabel}
              </DropdownMenuItem>

              {visibleInviteItems.length > 0 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="ci-menu-item">
                    {ciMessages.inviteUsersLabel}
                  </DropdownMenuSubTrigger>

                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="ci-menu-content">
                      {visibleInviteItems.map((item, index) => (
                        <DropdownMenuItem
                          key={item.id ?? `${index}-${String(item.label)}`}
                          className="ci-menu-item"
                          disabled={item.disabled}
                          onSelect={ciCreateSelectHandler(item.onSelect)}
                        >
                          {item.label}

                          {item.shortcut ? (
                            <DropdownMenuShortcut>
                              {item.shortcut}
                            </DropdownMenuShortcut>
                          ) : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ) : null}

              <DropdownMenuItem
                className="ci-menu-item"
                disabled={!onNewTeamSelect}
                onSelect={ciCreateSelectHandler(onNewTeamSelect)}
              >
                {ciMessages.newTeamLabel}

                <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}

        {showResourceSection ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="ci-menu-item"
              disabled={!onGitHubSelect}
              onSelect={ciCreateSelectHandler(onGitHubSelect)}
            >
              {ciMessages.githubLabel}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="ci-menu-item"
              disabled={!onSupportSelect}
              onSelect={ciCreateSelectHandler(onSupportSelect)}
            >
              {ciMessages.supportLabel}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="ci-menu-item"
              disabled={!onApiSelect}
              onSelect={ciCreateSelectHandler(onApiSelect)}
            >
              {ciMessages.apiLabel}
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="ci-menu-item flex items-center gap-2"
          onSelect={ciCreateSelectHandler(onLogout)}
        >
          <IoLogOutOutline className="text-lg" aria-hidden="true" />

          {ciMessages.logoutLabel}

          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
