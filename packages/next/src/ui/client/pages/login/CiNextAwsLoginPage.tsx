"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Authenticator,
  ThemeProvider,
  useAuthenticator,
  type AuthenticatorProps,
  type Theme,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";

import { CiConsolePrint } from "@cloudigniter/core/client";
import type { CiAuthUiConfig } from "@cloudigniter/core/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import { useShowLoaderWhenAuthenticatorDisappears } from "./use-show-loader-when-authenticator-disappears";
// import type { CiAuthenticatorConfig } from "@ci-next/types";

export interface LoginPageClientWrapperInterface {
  outputs: CiAmplifyOutputs;
  authenticatorProps: AuthenticatorProps;
  authenticatorStyleTheme?: Theme;
  authenticatorConfig: CiAuthUiConfig;
}

export function CiNextAwsLoginPage({
  outputs,
  authenticatorProps,
  authenticatorStyleTheme,
  authenticatorConfig,
}: LoginPageClientWrapperInterface) {
  // Why ssr: true matters here
  // Without ssr: true, Amplify Auth typically persists tokens in localStorage (client-only). Server
  // cannot read them → fetchAuthSession(serverCtx) returns no tokens → unauthenticated.
  // With ssr: true, Amplify uses a cookie-compatible storage strategy so the server adapter can see the session.
  // This is required so the middleware can verify user login.
  useEffect(() => {
    Amplify.configure(outputs, { ssr: true });
  }, [outputs]);

  const authUiRef = useRef<HTMLDivElement>(null);
  useShowLoaderWhenAuthenticatorDisappears(
    authUiRef,
    {
      minHeightPx: authenticatorConfig?.visibility?.minHeightPx,
      debounceMs: authenticatorConfig?.visibility?.debounceMs,
      initialMountSuppressMs:
        authenticatorConfig?.visibility?.initialMountSuppressMs,
      minVisibleStableMs: authenticatorConfig?.visibility?.minVisibleStableMs,
    },
    authenticatorConfig,
  );

  return (
    <ThemeProvider theme={authenticatorStyleTheme}>
      <div ref={authUiRef}>
        <Authenticator {...authenticatorProps} className="px-4 pt-8 pb-8">
          {() => <LoginRedirector />}
        </Authenticator>
      </div>
      <CiConsolePrint
        label="Auth"
        message="Amplify Authenticator is loaded..."
        options={{ messageType: "SUCCESS" }}
      />
    </ThemeProvider>
  );
}

function LoginRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { route } = useAuthenticator((ctx) => [ctx.route]);
  const redirectedRef = useRef(false);

  const next = useMemo(
    () => searchParams.get("next") || "/dashboard",
    [searchParams],
  );

  useEffect(() => {
    if (route !== "authenticated") return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    router.replace(next);
  }, [route, next, router]);

  return null;
}
