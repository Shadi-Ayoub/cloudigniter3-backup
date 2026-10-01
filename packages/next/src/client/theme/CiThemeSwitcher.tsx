"use client";

import { useEffect, useState } from "react";
import { CheckIcon, LaptopIcon, Moon, MoonIcon, Sun, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  CiTooltipBalloon,
  ciStartTraceClient,
  Tooltip,
  TooltipTrigger,
  useCiFeedbackStore,
} from "@cloudigniter/ui/client";
import type { CiThemeSwitcherProps } from "@ci-next/types";

export function CiThemeSwitcher({ dir, config }: CiThemeSwitcherProps) {
  const { logger, done } = ciStartTraceClient(
    config.appCoreConfig.dev.traceLog,
    { source: "client", tag: "ThemeSwitcher" },
    { name: "<ThemeSwitcher />" },
  );
  const { forcedTheme, theme, themes, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerError = useCiFeedbackStore((state) => state.triggerError);
  const clearError = useCiFeedbackStore((state) => state.clear);
  const t = useTranslations("themeSwitcher");
  const errors = useTranslations("errorTheme");
  const themeList = JSON.stringify(themes);
  const invalidForcedTheme = !!forcedTheme && !themes.includes(forcedTheme);

  useEffect(() => {
    setMounted(true);
    done({ phase: "mount" });
    logger.log({ type: "ui", event: "mount <ThemeSwitcher>" });
    return () => logger.log({ type: "ui", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (invalidForcedTheme && forcedTheme) {
      triggerError(
        "theme",
        errors("criticalThemeNotExist", { theme: forcedTheme, themeList }),
        "critical",
      );
    } else {
      clearError("theme");
    }
  }, [invalidForcedTheme, forcedTheme, themeList, errors, triggerError, clearError]);

  // Read choices and selection from the actual provider, including raw overrides.
  // Browser-persisted state must not affect server or first-hydration markup.
  const selectedTheme = mounted ? forcedTheme ?? theme : undefined;
  const disabled = !mounted || !!forcedTheme;

  return (
    <DropdownMenu modal={false} dir={dir} onOpenChange={setMenuOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="ci-menu-trigger" asChild>
            <Button variant="ghost" className="ci-header-menu-button-rounded">
              <Sun size={32} className="ci-theme-switcher-button-icon-sun" />
              <Moon className="ci-theme-switcher-button-icon-moon" />
              <span className="ci-screen-reader-only">{t("toggle")}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {!menuOpen && <CiTooltipBalloon content={t("toggle")} />}
      </Tooltip>
      <DropdownMenuContent align="end" onCloseAutoFocus={(event: Event) => event.preventDefault()} className="ci-menu-content">
        {themes.map((name) => {
          const Icon = name === "system" ? LaptopIcon : name === "dark" ? MoonIcon : SunIcon;
          const label = name === "light" || name === "dark" || name === "system" ? t(name) : name;
          return (
            <DropdownMenuItem key={name} onClick={() => { document.cookie = `ci-theme=${encodeURIComponent(name)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`; setTheme(name); }} className="ci-menu-item" disabled={disabled}>
              <Icon />
              {label}
              {selectedTheme === name && <CheckIcon className="ci-menu-item-check-icon" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
