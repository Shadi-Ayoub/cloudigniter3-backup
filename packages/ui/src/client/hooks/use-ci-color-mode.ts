"use client";

import { useEffect, useState } from "react";

/** The applied DOM color mode for widgets that cannot consume CSS tokens. */
export function useCiColorMode(): "light" | "dark" {
  // Keep server output and the first hydration render identical.
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const isDark = root.matches('.dark, [data-theme="dark"]');
      const isLight = root.matches('.light, [data-theme="light"]');
      setMode(isDark || (!isLight && preference.matches) ? "dark" : "light");
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
    };
  }, []);

  return mode;
}
