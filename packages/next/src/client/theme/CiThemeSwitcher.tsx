"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  LaptopIcon,
  Moon,
  MoonIcon,
  Sun,
  SunIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ciStartTraceClient } from "@cloudigniter/core/client";
import { ciGetLocalStorageItem } from "@cloudigniter/core/client";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useCiFeedbackStore,
} from "@cloudigniter/core/client";
import type { CiThemeSwitcherProps } from "@ci-next/types";

export function CiThemeSwitcher({ dir, config }: CiThemeSwitcherProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTraceClient(
    config.ciConfig.traceLog,
    { source: "client", tag: `ThemeSwitcher` },
    { name: `<ThemeSwitcher />` },
  );

  // log mount/unmount once
  useEffect(() => {
    // stop the render timer (records a "duration" metric if enabled)
    done({ phase: "mount" });

    logger.log({ type: "ui", event: "mount <ThemeSwitcher>" });
    return () => logger.log({ type: "ui", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  const { forcedTheme, theme, themes, setTheme } = useTheme();

  const triggerError = useCiFeedbackStore((state) => state.triggerError);
  const clearError = useCiFeedbackStore((state) => state.clear);

  const t1 = useTranslations("themeSwitcher");
  const t2 = useTranslations("errorTheme");

  const enableSystem = config.ciConfig.theme.enableSystem ?? true;
  const storageKey = config.ciConfig.theme.storageKey ?? "ci-theme";
  const currentTheme = ciGetLocalStorageItem(storageKey);
  const disabled = !!forcedTheme;

  // Local state for validForcedTheme
  const [validForcedTheme, setValidForcedTheme] = useState<string | undefined>(
    forcedTheme,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // To make sure that ErrorHandler render does not happen during ThemeSwitcher render!
  useEffect(() => {
    // Localstorage theme value correction. Just in case!!
    // The new value will take effect on the next page load.
    if (currentTheme === "system" && !enableSystem) {
      setTheme("light");
    }

    if (!!forcedTheme && !themes.includes(forcedTheme)) {
      triggerError(
        "theme",
        t2("criticalThemeNotExist", {
          theme: forcedTheme,
          themeList: JSON.stringify(themes),
        }),
        // `Unknown theme name "${forcedTheme}"! The system can only accept a theme name from the list ${JSON.stringify(themes)}`,
        "critical",
      );
      setValidForcedTheme(undefined);
    } else {
      clearError("theme");
      setValidForcedTheme(forcedTheme);
    }
  }, [forcedTheme, themes, triggerError, setTheme, currentTheme, enableSystem]);

  return (
    <DropdownMenu modal={false} dir={dir} onOpenChange={setMenuOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="ci-menu-trigger" asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ci-header-menu-button-rounded"
            >
              <Sun size={32} className="ci-theme-switcher-button-icon-sun" />
              <Moon className="ci-theme-switcher-button-icon-moon" />
              <span className="ci-screen-reader-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {!menuOpen ? (
          <TooltipContent>
            <p>Toggle Theme</p>
          </TooltipContent>
        ) : null}
      </Tooltip>

      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
        className="ci-menu-content"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="ci-menu-item"
          disabled={disabled}
        >
          <SunIcon />
          {t1("light")}
          {((theme === "light" && validForcedTheme === undefined) ||
            (currentTheme === "system" && !enableSystem) ||
            validForcedTheme === "light") && (
            <CheckIcon className="ci-menu-item-check-icon" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="ci-menu-item"
          disabled={disabled}
        >
          <MoonIcon />
          {t1("dark")}
          {((theme === "dark" && validForcedTheme === undefined) ||
            validForcedTheme === "dark") && (
            <CheckIcon className="ci-menu-item-check-icon" />
          )}
        </DropdownMenuItem>
        {enableSystem && (
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="ci-menu-item"
            disabled={disabled}
          >
            <LaptopIcon />
            {t1("system")}
            {((theme === "system" && validForcedTheme === undefined) ||
              validForcedTheme === "system") && (
              <CheckIcon className="ci-menu-item-check-icon" />
            )}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
