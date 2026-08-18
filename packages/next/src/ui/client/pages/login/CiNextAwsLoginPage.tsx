"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type PropsWithChildren,
} from "react";
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
import { useCiPageLoaderStore } from "@cloudigniter/ui/client";
import type { CiAuthUiConfig } from "@cloudigniter/core/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import { useShowLoaderWhenAuthenticatorDisappears } from "./use-show-loader-when-authenticator-disappears";
// import type { CiAuthenticatorConfig } from "@ci-next/types";

export type CiNextAwsLoginPageShell = ComponentType<PropsWithChildren>;

export interface LoginPageClientWrapperInterface {
  outputs: CiAmplifyOutputs;
  authenticatorProps: AuthenticatorProps;
  authenticatorStyleTheme?: Theme;
  authenticatorConfig: CiAuthUiConfig;
  loginPageShell?: CiNextAwsLoginPageShell;
}

export function CiNextAwsLoginPage({
  outputs,
  authenticatorProps,
  authenticatorStyleTheme,
  authenticatorConfig,
  loginPageShell: LoginPageShell,
}: LoginPageClientWrapperInterface) {
  // Why ssr: true matters here
  // Without ssr: true, Amplify Auth typically persists tokens in localStorage (client-only). Server
  // cannot read them → fetchAuthSession(serverCtx) returns no tokens → unauthenticated.
  // With ssr: true, Amplify uses a cookie-compatible storage strategy so the server adapter can see the session.
  // This is required so the middleware can verify user login.
  const configuredRef = useRef(false);

  if (!configuredRef.current) {
    Amplify.configure(outputs, { ssr: true });
    configuredRef.current = true;
  }

  // useEffect(() => {
  //   Amplify.configure(outputs, { ssr: true });
  // }, [outputs]);

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

  const authenticator = (
    <div ref={authUiRef}>
      <Authenticator {...authenticatorProps} className="w-full" />
    </div>
  );

  return (
    <ThemeProvider theme={authenticatorStyleTheme}>
      <Authenticator.Provider>
        {LoginPageShell ? (
          <LoginPageShell>{authenticator}</LoginPageShell>
        ) : (
          authenticator
        )}
        <LoginRedirector loadingText={authenticatorConfig.custom?.loadingText} />
      </Authenticator.Provider>

      <CiConsolePrint
        label="Auth"
        message="Amplify Authenticator is loaded..."
        options={{ messageType: "SUCCESS" }}
      />
    </ThemeProvider>
  );
}

function LoginRedirector({ loadingText }: { loadingText?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { route } = useAuthenticator((ctx) => [ctx.route]);
  const setLoading = useCiPageLoaderStore((state) => state.setLoading);
  const redirectedRef = useRef(false);

  const next = useMemo(() => {
    const requestedNext = searchParams.get("next");

    // Keep post-login navigation within this application. The server applies
    // the same safeguard for already-authenticated visits to /login.
    return requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    if (route !== "authenticated") return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    setLoading(true, loadingText ?? "Signing you in. Please wait.");
    router.replace(next);
  }, [route, next, router, setLoading, loadingText]);

  return null;
}
