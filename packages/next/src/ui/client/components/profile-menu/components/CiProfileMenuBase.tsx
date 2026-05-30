"use client";

import { useState } from "react";
import { IoLogOutOutline, IoPersonOutline } from "react-icons/io5";
import {
  Button,
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
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ci-next/ui/client";

import type { CiProfileMenuItem } from "@ci-next/types";

export type CiProfileMenuBaseProps = {
  dir: "ltr" | "rtl";
  accountItems: CiProfileMenuItem[];
  inviteItems: CiProfileMenuItem[];
  onLogout: () => void | Promise<void>;
};

export function CiProfileMenuBase({
  dir,
  accountItems,
  inviteItems,
  onLogout,
}: CiProfileMenuBaseProps) {
  const [ciMenuOpen, setCiMenuOpen] = useState(false);

  return (
    <DropdownMenu modal={false} dir={dir} onOpenChange={setCiMenuOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ci-header-menu-button-rounded"
              >
                <IoPersonOutline />
                <span className="ci-screen-reader-only">Your Profile Menu</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          {!ciMenuOpen ? (
            <TooltipContent>
              <p>Access your Profile</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
        className="ci-menu-content w-56"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {accountItems.map((ciItem) => (
            <DropdownMenuItem
              key={ciItem.label}
              className="ci-menu-item"
              disabled={ciItem.disabled}
              onClick={
                ciItem.onSelect ? () => void ciItem.onSelect?.() : undefined
              }
            >
              {ciItem.label}
              {ciItem.shortcut ? (
                <DropdownMenuShortcut>{ciItem.shortcut}</DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="ci-menu-item">Team</DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="ci-menu-item">
              Invite users
            </DropdownMenuSubTrigger>

            <DropdownMenuPortal>
              <DropdownMenuSubContent className="ci-menu-content">
                {inviteItems.map((ciItem) => (
                  <DropdownMenuItem
                    key={ciItem.label}
                    className="ci-menu-item"
                    disabled={ciItem.disabled}
                    onClick={
                      ciItem.onSelect
                        ? () => void ciItem.onSelect?.()
                        : undefined
                    }
                  >
                    {ciItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem className="ci-menu-item">
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="ci-menu-item">GitHub</DropdownMenuItem>
        <DropdownMenuItem className="ci-menu-item">Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="ci-menu-item flex items-center gap-2"
          onClick={() => void onLogout()}
        >
          <IoLogOutOutline className="text-lg" />
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
