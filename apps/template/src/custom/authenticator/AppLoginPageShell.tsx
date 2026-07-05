// custom/authenticator/AppLoginPageShell.tsx
"use client";

import type { PropsWithChildren } from "react";
import { Building2, LayoutDashboard, ShieldCheck } from "lucide-react";

import { appLoginPageContent } from "./login-page-content";

const highlightIcons = [ShieldCheck, LayoutDashboard, Building2] as const;

// const highlightIcons: LucideIcon[] = [ShieldCheck, LayoutDashboard, Building2];

export function AppLoginPageShell({ children }: PropsWithChildren) {
  const { brand, hero, support } = appLoginPageContent;

  return (
    // <main className="relative flex min-h-dvh items-center overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
    <div>
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

            {children}

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
