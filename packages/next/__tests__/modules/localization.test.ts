import moduleMessagesEn from "../../src/locales/en/dashboard-modules.json";
import moduleMessagesAr from "../../src/locales/ar/dashboard-modules.json";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";
import { createElement, type ReactElement, type ReactNode } from "react";
import {
  NextIntlClientProvider,
  createTranslator,
  type AbstractIntlMessages,
} from "next-intl";
import ts from "typescript";
import { ciCoreRoutes } from "@cloudigniter/core/lib";
import * as coreLibrary from "@cloudigniter/core/lib";
import type {
  CiExtensionCatalog,
  CiExtensionStatus,
  CiPageSetup,
} from "@cloudigniter/core/types";
import { CiNextModuleManagementPage } from "../../src/ui/client/components/modules/CiNextModuleManagementPage";
import { locales } from "../../src/locales";
import { locales as customLocales } from "../../../../apps/template/src/custom/locales";
import { dashboardBreadcrumbChildren } from "../../../../apps/template/src/app/(system)/dashboard/breadcrumb-menu";
import { ciResolveBreadcrumbMenuItems } from "../../src/client/page/ci-resolve-breadcrumb-menu-items";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};
const template = new URL("../../../../apps/template/", import.meta.url);

// Execute the actual template composition, replacing only request/provider boundaries.
function loadSource<T>(url: URL, mocks: Record<string, unknown>): T {
  const dependencies: Record<string, unknown> = {
    "@cloudigniter/core/lib": coreLibrary,
    ...mocks,
  };
  const source = readFileSync(url, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const output = { exports: {} };
  const load = runInThisContext(
    `(function(require, module, exports) { ${compiled.outputText}\n})`
  );
  load(
    (id: string) =>
      Object.hasOwn(dependencies, id) ? dependencies[id] : require(id),
    output,
    output.exports
  );
  return output.exports as T;
}

function loadTemplate<T>(path: string, mocks: Record<string, unknown>): T {
  return loadSource<T>(new URL(path, template), mocks);
}

type Loader = {
  ciLoadRouteMessages(input: {
    localeCode: string;
    namespace: string;
    pathname: string;
  }): Promise<{
    requestedFileNames: string[];
    messages: AbstractIntlMessages;
    diagnostics: {
      files: { source: string; fileName: string; status: string }[];
    };
  }>;
};
function messageLoader(
  custom: Record<string, Record<string, AbstractIntlMessages>> = customLocales
) {
  return loadTemplate<Loader>("src/kernel/server/i18n/messages.ts", {
    "server-only": {},
    "@cloudigniter/next/locales": { locales },
    "@/custom/locales": { locales: custom },
  });
}
async function messagesFor(localeCode: string, loader = messageLoader()) {
  const namespace = ciCoreRoutes["/dashboard/modules"]!.namespace;
  assert.equal(namespace, "dashboard.modules");
  return loader.ciLoadRouteMessages({
    localeCode,
    namespace,
    pathname: "/dashboard/modules",
  });
}
const denied = async () => ({
  ok: false as const,
  statusCode: 400 as const,
  body: { error: "Denied" },
});
const manifest = {
  schemaVersion: 1,
  kind: "extension",
  id: "todo",
  name: "To-Do List",
  version: "1.0.0",
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
} as const;
function catalog(status?: CiExtensionStatus): CiExtensionCatalog {
  return {
    revision: 1,
    entries: [
      {
        manifest,
        detected: true,
        compatible: true,
        ...(status
          ? {
              installation: {
                manifest,
                status,
                operation: "install",
                operationId: "test",
                infrastructure: { provider: "none", id: "todo" },
                configuration: {},
                updatedAt: "2026-09-18T00:00:00.000Z",
                updatedBy: "developer",
              },
            }
          : {}),
      },
    ],
  };
}
function render(
  locale: string,
  messages: AbstractIntlMessages,
  status?: CiExtensionStatus
) {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale,
      messages,
      timeZone: "UTC",
      onError: (error) => {
        throw error;
      },
      children: createElement(CiNextModuleManagementPage, {
        initialCatalog: catalog(status),
        onReload: denied,
        onCommand: denied,
      }),
    })
  );
}

test("Modules resolves registered English/Arabic package and custom namespace files", async () => {
  for (const locale of ["en", "ar"]) {
    const result = await messagesFor(locale);
    assert.deepEqual(result.requestedFileNames, [
      "common",
      "dashboard",
      "dashboard-modules",
    ]);
    for (const source of ["core", "custom"])
      assert.ok(
        result.diagnostics.files.some(
          (file) =>
            file.source === source &&
            file.fileName === "dashboard-modules" &&
            file.status === "loaded"
        )
      );
    assert.ok(result.messages.modules);
  }
});

test("Arabic module controls and statuses render through the real Next adapter", async () => {
  const { messages } = await messagesFor("ar");
  const html = render("ar", messages, "enabled");
  assert.match(html, /الوحدات الأساسية/);
  assert.match(html, /مفعّلة/);
  assert.match(html, /تعطيل/);
  assert.match(html, /فتح الوحدة/);
  assert.doesNotMatch(html, />Disable<|>Core modules<|>Refresh<|>Uninstall</);
  assert.match(render("ar", messages, "disabled"), /إلغاء التثبيت/);
  assert.match(render("ar", messages), /غير مثبّتة/);
  assert.equal(render("ar", messages, "enabled"), html);
});

test("custom module messages override package copy while preserving missing defaults", async () => {
  const loader = messageLoader({
    ...customLocales,
    en: {
      ...customLocales.en,
      "dashboard-modules": {
        modules: { title: "My extensions", refresh: "Check status" },
      },
    },
  });
  const { messages } = await messagesFor("en", loader);
  const html = render("en", messages);
  assert.match(html, /My extensions/);
  assert.match(html, /Check status/);
  assert.match(html, />Install</);
  assert.match(html, /1 detected or installed extension/);
});

test("both locale files contain matching keys and valid dynamic dialog messages", () => {
  function keys(value: object, prefix = ""): string[] {
    return Object.entries(value).flatMap(([key, item]) =>
      typeof item === "string"
        ? [`${prefix}${key}`]
        : keys(item, `${prefix}${key}.`)
    );
  }
  const en = moduleMessagesEn;
  const ar = moduleMessagesAr;
  assert.deepEqual(keys(en).sort(), keys(ar).sort());
  for (const [locale, messages] of [
    ["en", en],
    ["ar", ar],
  ] as const) {
    const t = createTranslator({
      locale,
      messages,
      onError: (error) => {
        throw error;
      },
    });
    for (const key of keys(messages) as Array<Parameters<typeof t>[0]>)
      assert.ok(
        t(key, { count: 2, id: "todo", name: "Example", version: "1.0.0" })
      );
    assert.match(t("modules.confirmationPrompt", { id: "todo" }), /todo/);
    assert.match(t("modules.uninstallTitle", { name: "Example" }), /Example/);
  }
});

test("actual Modules and extension pages expose the Dashboard children menu", async () => {
  const pageMocks = {
    "next/navigation": {
      notFound: () => {
        throw new Error("Not found");
      },
    },
    "@cloudigniter/next/client": { CiPage: () => null },
    "@cloudigniter/next/ui/client": { CiNextModuleManagementPage: () => null },
    "@/kernel/server": {
      appBootstrap: async () => ({
        auth: { user: { authenticated: true, roles: ["developer"] } },
        env: { mode: "development" },
      }),
    },
    "@/kernel/server/modules/app-modules": {
      appModules: () => ({
        list: async () => ({ ok: true, body: catalog() }),
        detected: () => catalog(),
        enabled: async () => ({
          ok: true,
          body: [{ manifest, configuration: {} }],
        }),
      }),
    },
    "@/kernel/server/modules/app-module-actions": {
      appListModules: denied,
      appModuleCommand: denied,
      appExecuteModule: denied,
    },
    "../breadcrumb-menu": { dashboardBreadcrumbChildren },
    "../../breadcrumb-menu": { dashboardBreadcrumbChildren },
    "./view": { ExtensionPage: () => null },
  };
  for (const path of ["modules/page.tsx", "extensions/[moduleId]/page.tsx"]) {
    const page = loadTemplate<{
      default(props: {
        params: Promise<{ moduleId: string }>;
      }): Promise<ReactElement<{ setup: CiPageSetup }>>;
    }>(`src/app/(system)/dashboard/${path}`, pageMocks);
    const result = await page.default({
      params: Promise.resolve({ moduleId: "todo" }),
    });
    assert.equal(result.props.setup.withBreadcrumbChildrenMenu, true);
    const dashboard = result.props.setup.breadcrumbs!.find(
      (item) => item.href === "/dashboard"
    );
    assert.ok(dashboard?.children?.length);
    const menu = ciResolveBreadcrumbMenuItems(
      dashboard.children,
      "/dashboard/modules",
      (key) => key,
      "en"
    );
    const security = menu.find(
      (item) => item.item.href === "/dashboard/security"
    );
    assert.ok(
      security?.children.some(
        (item) => item.item.href === "/dashboard/security/roles"
      )
    );
  }
});
