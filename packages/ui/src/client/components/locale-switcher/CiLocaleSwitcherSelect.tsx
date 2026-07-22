"use client";

import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { ciSetCookie } from "@cloudigniter/core/client";
import { CI_DEFAULT_LOCALE_COOKIE_NAME } from "@cloudigniter/core/lib";
import type { CiLocaleSwitcherSelectProps } from "@cloudigniter/core/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useCiPageLoaderStore,
} from "@ci-ui/client";

const LocaleSwitcherSelect = ({
  dir,
  menuItems,
  defaultValue,
  config,
}: CiLocaleSwitcherSelectProps) => {
  const { setLoading } = useCiPageLoaderStore();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLanguageSelection(locale: string) {
    const cookieName = config.cookieName ?? CI_DEFAULT_LOCALE_COOKIE_NAME;
    ciSetCookie(cookieName, locale, { expires: 365 });
    setLoading(true);
    // router.refresh(); // triggers an SSR fetch of layout + pages
    location.reload();
    // });
  }

  const items = menuItems.map((lang) => ({
    key: lang.key, // Use the language code as the key
    label: lang.label, // Use the language name as the label
    onClick: () => {
      handleLanguageSelection(lang.key); // Update the language in the store
    },
  }));

  return (
    <DropdownMenu modal={false} dir={dir} onOpenChange={setMenuOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger className="ci-menu-trigger" asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ci-header-menu-button-rounded"
              >
                {defaultValue.toUpperCase()}
                <span className="ci-screen-reader-only">Select langusge</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {!menuOpen ? (
            <TooltipContent>
              <p>Select Language</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
        className="ci-menu-content"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => handleLanguageSelection(item.key)}
            className="ci-menu-item"
          >
            {item.label}
            {defaultValue === item.key && (
              <CheckIcon className="ci-menu-item-check-icon" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LocaleSwitcherSelect;
