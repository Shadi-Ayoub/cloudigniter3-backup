import commonEn from "../../src/locales/en/common.json";
import commonAr from "../../src/locales/ar/common.json";
import type { CiAccessControlDefinition } from "@cloudigniter/core/types";
const commonMessages = { en: commonEn, ar: commonAr };
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";
import { createElement, type ReactElement, type ReactNode } from "react";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import ts from "typescript";
import * as coreLibrary from "@cloudigniter/core/lib";
import { CiErrorPage } from "../../../ui/src/client/page/components/CiErrorPage";
import type { CiNextHttpErrorPageProps } from "../../src/types";
import { locales } from "../../src/locales";
import { locales as customLocales } from "../../../../apps/template/src/custom/locales";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};
const template = new URL("../../../../apps/template/", import.meta.url);
function load<T>(path: string, mocks: Record<string, unknown>): T {
  const dependencies = { "@cloudigniter/core/lib": coreLibrary, ...mocks };
  const compiled = ts.transpileModule(
    readFileSync(new URL(path, template), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }
  );
  const output = { exports: {} };
  runInThisContext(
    `(function(require, module, exports) { ${compiled.outputText}\n})`
  )(
    (id: string) =>
      Object.hasOwn(dependencies, id)
        ? dependencies[id as keyof typeof dependencies]
        : require(id),
    output,
    output.exports
  );
  return output.exports as T;
}
// Use the framework's CJS interop in this Node test, as Next's bundler does.
const { CiNextHttpErrorPage } = load<{
  CiNextHttpErrorPage(props: CiNextHttpErrorPageProps): ReactElement;
}>("../../packages/next/src/ui/server/page/CiNextHttpErrorPage.tsx", {
  "next/image": require("next/image").default,
  "next/link": require("next/link").default,
  "@cloudigniter/ui/client": { CiErrorPage },
  "../../../locales/en/common.json": commonEn,
});

function interrupt(status: number): never {
  throw Object.assign(new Error(`HTTP ${status}`), {
    digest: `NEXT_HTTP_ERROR_FALLBACK;${status}`,
  });
}
const navigation = {
  forbidden: () => interrupt(403),
  notFound: () => interrupt(404),
};
const denied403 = (error: unknown) =>
  (error as { digest?: string }).digest === "NEXT_HTTP_ERROR_FALLBACK;403";
const denied404 = (error: unknown) =>
  (error as { digest?: string }).digest === "NEXT_HTTP_ERROR_FALLBACK;404";
const shell = ({ children }: { children: ReactNode }) => children;

function messagesLoader(custom = customLocales) {
  return load<{
    ciLoadRouteMessages(input: {
      localeCode: string;
      namespace: string;
      pathname: string;
    }): Promise<{ messages: AbstractIntlMessages }>;
  }>("src/kernel/server/i18n/messages.ts", {
    "server-only": {},
    "@cloudigniter/next/locales": { locales },
    "@/custom/locales": { locales: custom },
  });
}

test("both HTTP boundaries render the same illustrated shell with translated recovery and application overrides", async () => {
  const overrides = structuredClone(customLocales);
  overrides.en.common.httpErrors = { homeLabel: "Go to application home" };
  for (const locale of ["en", "ar"] as const) {
    const { AppHttpErrorPage } = load<{
      AppHttpErrorPage(input: { statusCode: 403 | 404 }): Promise<ReactElement>;
    }>("src/custom/errors/AppHttpErrorPage.tsx", {
      "next-intl": { createTranslator },
      "@cloudigniter/next/server": {
        ciGetServerLocale: async () => ({ code: locale }),
      },
      "@cloudigniter/next/ui/server": { CiNextHttpErrorPage },
      "@/../cloudigniter.config": {
        i18n: {
          defaultLocale: "en",
          locales: [{ code: "en" }, { code: "ar" }],
        },
      },
      "@/kernel/server/i18n/messages": messagesLoader(overrides),
      "./app-is-page-access-suspended": {
        appIsPageAccessSuspended: async () => false,
      },
    });
    for (const statusCode of [403, 404] as const) {
      const html = renderToStaticMarkup(await AppHttpErrorPage({ statusCode }));
      assert.ok(
        html.includes(commonMessages[locale].httpErrors[statusCode].title)
      );
      assert.match(html, new RegExp(`>${statusCode}</span>`));
      assert.match(html, /href="\/"/);
      assert.match(html, /alt=""/);
      assert.match(html, /min-h-11/);
      assert.match(html, /dark:invert/);
      assert.doesNotMatch(html, /<button|Retry|NEXT_HTTP|stack/);
      assert.ok(
        html.includes(
          statusCode === 403
            ? "logo-access-denied-1.png"
            : "logo-not-found-1.png"
        )
      );
      if (locale === "en") assert.ok(html.includes("Go to application home"));
    }
  }
});

test("an account without the developer role receives 403 before module data is accessed", async () => {
  let reads = 0;
  const { default: Page } = load<{ default(): Promise<ReactNode> }>(
    "src/app/(system)/dashboard/modules/page.tsx",
    {
      "next/navigation": navigation,
      "@cloudigniter/next/client": { CiPage: shell },
      "@cloudigniter/next/ui/client": {},
      "@/kernel/server": {
        appBootstrap: async () => ({
          env: { mode: "development" },
          auth: { user: { authenticated: true, roles: ["user"] } },
        }),
      },
      "@/kernel/server/modules/app-modules": {
        appModules: () => {
          reads++;
          throw new Error("Protected read");
        },
      },
      "@/kernel/server/modules/app-module-actions": {},
      "../breadcrumb-menu": {},
    }
  );
  await assert.rejects(Page(), denied403);
  assert.equal(reads, 0);
});

test("Settings denial interrupts the page; verification failure remains retryable", async () => {
  for (const statusCode of [403, 500] as const) {
    let registryReads = 0;
    const { default: Page } = load<{ default(): Promise<ReactElement> }>(
      "src/app/(system)/dashboard/settings/page.tsx",
      {
        "next/navigation": navigation,
        "@cloudigniter/next/client": {
          CiPage: shell,
          CiNextNavigateWithLoader: ({ children }: { children: ReactNode }) =>
            createElement("a", { href: "/dashboard" }, children),
        },
        "@cloudigniter/ui/client": {
          CiErrorPage: (props: { message: string }) =>
            createElement("p", null, props.message),
        },
        "@cloudigniter/next/ui/server": {},
        "@/kernel/server": { appBootstrap: async () => ({}) },
        "@/kernel/server/settings/app-settings-access": {
          appSettingsAccess: async () => ({
            ok: false,
            statusCode,
            body: {
              error: "Verification failed",
              errorMeta: { showRetry: true },
            },
          }),
        },
        "@/custom/settings/ci-settings-registry": {
          ciBuildSettingsRegistry: () => {
            registryReads++;
            return { listByScope: () => ({}) };
          },
        },
        "../breadcrumb-menu": {},
      }
    );
    if (statusCode === 403) {
      await assert.rejects(Page(), denied403);
      assert.equal(registryReads, 0);
    } else
      assert.match(renderToStaticMarkup(await Page()), /Verification failed/);
  }
});

test("missing or disabled modules retain 404 and a confirmed provider denial uses 403", async () => {
  for (const result of [
    { ok: true, body: [] },
    { ok: false, statusCode: 403, body: { error: "Provider details" } },
  ]) {
    const { default: Page } = load<{
      default(input: {
        params: Promise<{ moduleId: string }>;
      }): Promise<ReactElement>;
    }>("src/app/(system)/dashboard/extensions/[moduleId]/page.tsx", {
      "next/navigation": navigation,
      "@cloudigniter/next/client": {},
      "@/kernel/server": { appBootstrap: async () => ({}) },
      "@/kernel/server/modules/app-modules": {
        appModules: () => ({ enabled: async () => result }),
      },
      "@/kernel/server/modules/app-module-actions": {},
      "./view": {},
      "../../breadcrumb-menu": {},
    });
    await assert.rejects(
      Page({ params: Promise.resolve({ moduleId: "todo" }) }),
      result.ok ? denied404 : denied403
    );
  }
});

test("the example invokes the real boundary in development and is absent in other environments", () => {
  for (const mode of ["development", "production", "test", undefined]) {
    const { CiNextAccessDeniedPreview: Page } = load<{
      CiNextAccessDeniedPreview(): never;
    }>("../../packages/next/src/ui/server/page/CiNextAccessDeniedPreview.tsx", {
      "next/navigation": navigation,
      "../../../server/env/ci-get-env-mode": { ciGetEnvMode: () => mode },
    });
    assert.throws(Page, mode === "development" ? denied403 : denied404);
  }
});

test("confirmed suspension alone selects the retained artwork and localized suspension copy", async () => {
  for (const locale of ["en", "ar"] as const) {
    const { AppHttpErrorPage } = load<{
      AppHttpErrorPage(input: { statusCode: 403 | 404 }): Promise<ReactElement>;
    }>("src/custom/errors/AppHttpErrorPage.tsx", {
      "next-intl": { createTranslator },
      "@cloudigniter/next/server": {
        ciGetServerLocale: async () => ({ code: locale }),
      },
      "@cloudigniter/next/ui/server": { CiNextHttpErrorPage },
      "@/../cloudigniter.config": {
        i18n: {
          defaultLocale: "en",
          locales: [{ code: "en" }, { code: "ar" }],
        },
      },
      "@/kernel/server/i18n/messages": messagesLoader(),
      "./app-is-page-access-suspended": {
        appIsPageAccessSuspended: async () => true,
      },
    });
    const html = renderToStaticMarkup(
      await AppHttpErrorPage({ statusCode: 403 })
    );
    assert.ok(html.includes(commonMessages[locale].httpErrors.suspended.title));
    assert.ok(html.includes("logo-access-not-allowed-1.png"));
    assert.ok(!html.includes("logo-access-denied-1.png"));
    const missing = renderToStaticMarkup(
      await AppHttpErrorPage({ statusCode: 404 })
    );
    assert.ok(missing.includes("logo-not-found-1.png"));
    assert.ok(
      !missing.includes(commonMessages[locale].httpErrors.suspended.title)
    );
  }
});

test("the application resolver requires authoritative matching grants and fails closed on missing evidence", async () => {
  const definition: CiAccessControlDefinition = {
    ...structuredClone(coreLibrary.CI_DEFAULT_ACCESS_CONTROL_DEFINITION),
    roles: [
    ...coreLibrary.CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles,
    {
      id: "security-reader",
      title: "Security reader",
      precedence: 5,
      status: "suspended",
      statusChange: {
        changedAt: "2026-09-19T00:00:00Z",
        changedBy: "administrator",
        reason: "Suspended",
      },
      privileges: [
        {
          id: "read-security",
          title: "Read security",
          effect: "allow",
          resource: "platform.authorization",
          action: "read",
          scopeKinds: ["system"],
        },
      ],
    },
  ],
  };
  for (const [roles, failed, expected] of [
    [["security-reader"], false, true],
    [["user"], false, false],
    [["security-reader"], true, false],
  ] as const) {
    const { appIsPageAccessSuspended } = load<{
      appIsPageAccessSuspended(): Promise<boolean>;
    }>("src/custom/errors/app-is-page-access-suspended.ts", {
      "server-only": {},
      react: { cache: (fn: unknown) => fn },
      "@/kernel/server": {
        appBootstrap: async () => ({
          route: { pathname: "/dashboard/security" },
          auth: { user: { id: "person", authenticated: true, roles } },
        }),
        appCreateSecurityAdministration: () => ({
          loadDefinition: async () => {
            if (failed) throw new Error("Provider failed");
            return definition;
          },
        }),
      },
    });
    assert.equal(await appIsPageAccessSuspended(), expected);
  }
});
