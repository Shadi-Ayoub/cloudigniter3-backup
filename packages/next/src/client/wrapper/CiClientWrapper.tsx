"use client";

/**
 * This component adds the following layers around the application:
 * - Language or Locale layer
 * - AntD Library Next.js Registry
 * - Theme Provider
 * - Layout if requested
 * - Error Handler
 */

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { CiConsolePrint, ciRemoveCookie } from "@cloudigniter/core/client";
import {
  CiFeedbackHandler,
  CiFeedbackProvider,
  type CiFeedbackSonnerConfig,
} from "@ci-next/ui/client";

import { CiThemeProvider } from "@ci-next/client";
import type { CiClientWrapperProps } from "@ci-next/types";

import { CiInitialLoader } from "./CiInitialLoader";

export const CiClientWrapper = ({
  theme,
  i18n,
  direction,
  protect,
  children,
}: CiClientWrapperProps) => {
  try {
    // House keeping! If no multible locales to select from then the language
    // switcher will not show and therefore we do not need the cookie in the browser.
    if (i18n.locales && i18n.locales?.length <= 1) {
      ciRemoveCookie(i18n.cookieName ?? "ci-locale");
    }

    // blur on capable browsers (see CSS file for PageHeader)
    if (typeof document !== "undefined") {
      const supportsBlur = CSS.supports?.("backdrop-filter", "blur(2px)");
      document.documentElement.classList.toggle(
        "supports-blur",
        !!supportsBlur,
      );
    }

    const feedbackConfig: CiFeedbackSonnerConfig = {
      enabled: true,
      toaster: {
        position: "top-right",
        theme: "system",
        richColors: true,
        closeButton: true,
        visibleToasts: 5,
        offset: 16,
        mobileOffset: 12,
        swipeDirections: ["right", "left"],
      },
      toastDefaults: {
        dismissible: true,
        duration: 4000,
      },
    };

    return (
      <>
        <AntdRegistry>
          <CiThemeProvider
            config={{
              ...theme,
              themeProviderProps: {
                ...theme.themeProviderProps,
                attribute: "class", // a must!
                defaultTheme: "system",
              },
            }}
          >
            <CiFeedbackProvider
              initialConfig={{ ...feedbackConfig }}
              overrides={{
                // optional runtime overrides (spread last)
                toaster: { dir: direction },
              }}
            />
            <CiFeedbackHandler direction={direction} />
            <CiInitialLoader />
            {/* <ErrorHandler direction={direction} /> */}
            {/* <DevBeaconWrapper /> */}
            {children}
          </CiThemeProvider>
        </AntdRegistry>
        <CiConsolePrint
          label="Client"
          message="Theme/Loader/ErrorHandler/Beacon are loaded..."
          options={{ messageType: "SUCCESS" }}
        />
        <CiConsolePrint
          label="Client"
          message={`${protect ? "Protected Path" : "Un-protected Path"}`}
          options={{ messageType: "SUCCESS" }}
        />
      </>
    );
  } catch (error: unknown) {
    throw new Error("Error!");
  }
};
