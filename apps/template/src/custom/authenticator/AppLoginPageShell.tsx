// custom/authenticator/AppLoginPageShell.tsx
"use client";

import { useState, type PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import { CiNavigateWithLoader } from "@cloudigniter/ui/client";

import { appLoginPageContent } from "./app-login-page-content";

const highlightIcons = [ShieldCheck, LayoutDashboard, Building2] as const;

const signUpStepIcons = [CircleUserRound, BadgeCheck, Rocket] as const;

// const highlightIcons: LucideIcon[] = [ShieldCheck, LayoutDashboard, Building2];

export function AppLoginPageShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const { brand, hero, signUp, support, accountNavigation } =
    appLoginPageContent;

  const normalizedPathname = pathname.replace(/\/+$/, "");

  const isCreateAccountPage =
    normalizedPathname === accountNavigation.signUpHref ||
    normalizedPathname.endsWith(accountNavigation.signUpHref);

  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  function handleNavigateStart() {
    setIsNavigating(true);
  }

  function navigate(href: string) {
    router.push(href);
  }

  function refreshRoute() {
    router.refresh();
  }

  function AccountNavigationLink({
    href,
    children,
  }: PropsWithChildren<{ href: string }>) {
    return (
      <CiNavigateWithLoader
        href={href}
        navigate={navigate}
        refreshRoute={refreshRoute}
        onNavigateStart={handleNavigateStart}
        className="text-primary font-medium underline-offset-4 hover:underline"
      >
        {children}
      </CiNavigateWithLoader>
    );
  }

  if (isCreateAccountPage) {
    return (
      <div>
        {isNavigating ? (
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium text-foreground shadow-xl">
              <LoaderCircle className="size-5 animate-spin text-primary" />
              <span>Loading...</span>
            </div>
          </div>
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="bg-primary/10 absolute -top-64 -left-52 size-144 rounded-full blur-3xl" />
          <div className="bg-accent/70 absolute -right-56 -bottom-72 size-160 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-content-max-width items-stretch gap-6 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-8 lg:px-8">
          <aside className="border-border/70 bg-surface/75 hidden flex-col self-stretch rounded-3xl border p-8 shadow-lg backdrop-blur-xl lg:flex xl:p-10">
            <div className="flex items-center gap-3">
              {brand.logoSrc ? (
                <img
                  src={brand.logoSrc}
                  alt={brand.logoAlt}
                  className="size-11 object-contain"
                />
              ) : null}

              <span className="text-lg font-semibold tracking-tight">
                {brand.name}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 xl:py-8">
              <div>
                {signUp.eyebrow ? (
                  <p className="text-primary text-sm font-medium tracking-wider uppercase">
                    {signUp.eyebrow}
                  </p>
                ) : null}

                <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
                  {signUp.title}
                </h1>

                {signUp.description ? (
                  <p className="text-muted-foreground mt-5 leading-relaxed">
                    {signUp.description}
                  </p>
                ) : null}
              </div>

              <ol className="mt-8 space-y-3">
                {signUp.steps.map((step, index) => {
                  const Icon =
                    signUpStepIcons[index % signUpStepIcons.length] ??
                    CircleUserRound;

                  return (
                    <li
                      key={step.title}
                      className="group border-border/70 bg-card/70 flex gap-4 rounded-2xl border p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm"
                    >
                      <span className="border-primary/15 bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>

                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>

                        {step.description ? (
                          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="border-border/70 border-t pt-5 text-sm">
              <p className="text-muted-foreground">
                {accountNavigation.signInPrompt}{" "}
                <AccountNavigationLink href={accountNavigation.signInHref}>
                  {accountNavigation.signInLabel}
                </AccountNavigationLink>
              </p>
            </div>
          </aside>

          <section className="border-border/70 bg-card/90 min-w-0 self-stretch overflow-hidden rounded-3xl border shadow-lg backdrop-blur-xl">
            <div className="border-border/70 border-b px-6 py-6 lg:hidden">
              <div className="flex items-center gap-3">
                {brand.logoSrc ? (
                  <img
                    src={brand.logoSrc}
                    alt={brand.logoAlt}
                    className="size-10 object-contain"
                  />
                ) : null}

                <span className="font-semibold tracking-tight">
                  {brand.name}
                </span>
              </div>

              {signUp.eyebrow ? (
                <p className="text-primary mt-6 text-xs font-medium tracking-wider uppercase">
                  {signUp.eyebrow}
                </p>
              ) : null}

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {signUp.title}
              </h1>

              {signUp.description ? (
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {signUp.description}
                </p>
              ) : null}
            </div>

            <div className="ci-auth-page ci-auth-page--sign-up">{children}</div>

            <div className="border-border/70 border-t px-6 py-5 text-center text-sm lg:hidden">
              <p className="text-muted-foreground">
                {accountNavigation.signInPrompt}{" "}
                <Link
                  href={accountNavigation.signInHref}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {accountNavigation.signInLabel}
                </Link>
              </p>
            </div>

            {support ? (
              <p className="text-muted-foreground px-6 pb-6 text-center text-xs">
                {support.text}{" "}
                <a
                  href={support.href}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {support.linkLabel}
                </a>
              </p>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    // <main className="relative flex min-h-dvh items-center overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
    <div>
      {isNavigating ? (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium text-foreground shadow-xl">
            <LoaderCircle className="size-5 animate-spin text-primary" />
            <span>Loading...</span>
          </div>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-56 -top-56 size-136 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-64 -right-52 size-152 rounded-full bg-accent/70 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-content-max-width overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-xl backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        {hero.enabled ? (
          <aside className="hidden flex-col border-r border-border/70 bg-surface/75 px-10 py-8 lg:flex xl:px-14">
            <div className="flex items-center gap-2">
              {brand.logoSrc ? (
                <img
                  src={brand.logoSrc}
                  alt={brand.logoAlt}
                  className="size-10 object-contain"
                />
              ) : null}

              <span className="text-lg font-semibold tracking-tight">
                {brand.name}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-10">
              <div className="max-w-xl">
                {hero.eyebrow ? (
                  <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
                    {hero.eyebrow}
                  </p>
                ) : null}

                <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
                  {hero.title}
                </h1>

                {hero.description ? (
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                    {hero.description}
                  </p>
                ) : null}
              </div>
            </div>

            {hero.highlights?.length ? (
              <div className="grid gap-3">
                {hero.highlights.map((highlight, index) => {
                  const Icon =
                    highlightIcons[index % highlightIcons.length] ??
                    ShieldCheck;

                  return (
                    <div
                      key={highlight}
                      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>

                      <span className="text-sm font-medium text-foreground/90">
                        {highlight}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </aside>
        ) : null}

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {!hero.enabled ? (
              <div className="mb-8 flex flex-col items-center gap-3 text-center">
                {brand.logoSrc ? (
                  <img
                    src={brand.logoSrc}
                    alt={brand.logoAlt}
                    className="h-12 max-w-56 object-contain"
                  />
                ) : null}

                <span className="text-lg font-semibold tracking-tight">
                  {brand.name}
                </span>
              </div>
            ) : null}

            <div
              className={
                isCreateAccountPage
                  ? "ci-auth-page ci-auth-page--sign-up"
                  : "ci-auth-page ci-auth-page--sign-in"
              }
            >
              {children}
            </div>

            <div className="border-border mt-6 border-t pt-5 text-center text-sm">
              {isCreateAccountPage ? (
                <p className="text-muted-foreground">
                  {accountNavigation.signInPrompt}{" "}
                  <Link
                    href={accountNavigation.signInHref}
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {accountNavigation.signInLabel}
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {accountNavigation.signUpPrompt}{" "}
                  <AccountNavigationLink href={accountNavigation.signUpHref}>
                    {accountNavigation.signUpLabel}
                  </AccountNavigationLink>
                </p>
              )}
            </div>

            {support ? (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {support.text}{" "}
                <a
                  href={support.href}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {support.linkLabel}
                </a>
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
    // </main>
  );
}
