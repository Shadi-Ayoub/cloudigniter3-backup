import "server-only";

import { deepmerge } from "deepmerge-ts";
import type { AbstractIntlMessages } from "next-intl";

import { ciNormalizeThrownError, ciResolveNamespaceLocaleFileNames } from "@cloudigniter/core/lib";

import type { CiRoute, CiServerErrorPayload } from "@cloudigniter/core/types";

import { locales as coreLocaleMessages } from "@cloudigniter/next/locales";
import { locales as customLocaleMessages } from "@/custom/locales";

export type CiLanguageMessageSource = "core" | "custom";

export type CiLanguageMessageFileStatus = "loaded" | "not-found" | "failed";

export interface CiLanguageMessageEntry {
  key: string;
  value: unknown;
}

export interface CiLanguageMessageFileDiagnostic {
  id: string;
  source: CiLanguageMessageSource;
  locale: string;
  fileName: string;
  status: CiLanguageMessageFileStatus;
  messageCount: number;
  overriddenKeyCount: number;
  error?: string;
}

export interface CiLanguageSourceMessages {
  id: string;
  source: CiLanguageMessageSource;
  fileName: string;
  status: CiLanguageMessageFileStatus;
  messageCount: number;
  overriddenKeyCount: number;
  error?: string;
  entries: CiLanguageMessageEntry[];
}

export interface CiLanguageMessagesDiagnostics {
  files: CiLanguageMessageFileDiagnostic[];
  effectiveMessageCount: number;
  customOverrideCount: number;
}

export interface CiLoadRouteMessagesOptions {
  localeCode: string;

  /**
   * Authoritative logical route resolved by the CloudIgniter proxy.
   */
  // route: Pick<CiRoute, "pathname" | "namespace">;

  namespace: string;

  pathname: string;

  includeMessageEntries?: boolean;
}

export interface CiLoadRouteMessagesResult {
  locale: string;
  urlPath: string;
  namespace: string;
  requestedFileNames: string[];
  messages: AbstractIntlMessages;
  diagnostics: CiLanguageMessagesDiagnostics;
  effectiveMessages?: CiLanguageMessageEntry[];
  sourceMessages?: CiLanguageSourceMessages[];
}

type CiLoadedMessageFile = {
  diagnostic: CiLanguageMessageFileDiagnostic;
  messages?: AbstractIntlMessages;
  entries?: CiLanguageMessageEntry[];
};

type CiLocaleMessagesRegistry = Record<string, Record<string, AbstractIntlMessages>>;

const coreMessages = coreLocaleMessages as CiLocaleMessagesRegistry;

const customMessages = customLocaleMessages as CiLocaleMessagesRegistry;

function ciCreateCriticalI18nError(title: string, message: string): Error {
  return new Error(
    JSON.stringify({
      title,
      message,
      severity: "critical",
      showRetry: true,
    } satisfies CiServerErrorPayload),
  );
}

function ciIsMessageRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciFlattenMessages(messages: AbstractIntlMessages): CiLanguageMessageEntry[] {
  const entries: CiLanguageMessageEntry[] = [];

  const visit = (value: unknown, prefix: string) => {
    if (ciIsMessageRecord(value)) {
      for (const [key, childValue] of Object.entries(value)) {
        visit(childValue, prefix ? `${prefix}.${key}` : key);
      }

      return;
    }

    if (prefix) {
      entries.push({
        key: prefix,
        value,
      });
    }
  };

  visit(messages, "");

  return entries.sort((left, right) => left.key.localeCompare(right.key));
}

function ciMergeMessages(current: AbstractIntlMessages, next: AbstractIntlMessages): AbstractIntlMessages {
  return deepmerge(current, next) as AbstractIntlMessages;
}

function ciCreateFileDiagnostic(
  source: CiLanguageMessageSource,
  locale: string,
  fileName: string,
  status: CiLanguageMessageFileStatus,
): CiLanguageMessageFileDiagnostic {
  return {
    id: `${source}:${fileName}`,
    source,
    locale,
    fileName,
    status,
    messageCount: 0,
    overriddenKeyCount: 0,
  };
}

function ciLoadCoreMessages(localeCode: string, fileName: string): CiLoadedMessageFile | undefined {
  const messages = coreMessages[localeCode]?.[fileName];

  /*
   * Core namespace files are optional. Application routes can belong to
   * namespaces for which @cloudigniter/next provides no messages.
   */
  if (!messages) {
    return undefined;
  }

  const diagnostic = ciCreateFileDiagnostic("core", localeCode, fileName, "loaded");

  const entries = ciFlattenMessages(messages);

  diagnostic.messageCount = entries.length;

  return {
    diagnostic,
    messages,
    entries,
  };
}

function ciLoadCustomMessages(localeCode: string, fileName: string): CiLoadedMessageFile {
  const diagnostic = ciCreateFileDiagnostic("custom", localeCode, fileName, "not-found");

  const messages = customMessages[localeCode]?.[fileName];

  if (!messages) {
    return { diagnostic };
  }

  try {
    const entries = ciFlattenMessages(messages);

    diagnostic.status = "loaded";
    diagnostic.messageCount = entries.length;

    return {
      diagnostic,
      messages,
      entries,
    };
  } catch (error) {
    const normalizedError = ciNormalizeThrownError(error);

    diagnostic.status = "failed";
    diagnostic.error = normalizedError.message;

    return { diagnostic };
  }
}

export async function ciLoadRouteMessages({
  localeCode,
  namespace,
  pathname,
  includeMessageEntries = false,
}: CiLoadRouteMessagesOptions): Promise<CiLoadRouteMessagesResult> {
  if (!coreMessages[localeCode]) {
    throw ciCreateCriticalI18nError(
      "No locale is defined!",
      `[i18n.messages.ts] Locale "${localeCode}" is not defined in CloudIgniter's next package!`,
    );
  }

  /*
   * The route was already matched and validated by the proxy. Its logical
   * namespace can therefore be used directly without resolving it again.
   */
  const requestedFileNames = [
    ...new Set(["common", ...ciResolveNamespaceLocaleFileNames(namespace).filter((fileName) => fileName !== "common")]),
  ];

  const coreFiles = requestedFileNames.flatMap((fileName) => {
    const file = ciLoadCoreMessages(localeCode, fileName);

    return file ? [file] : [];
  });

  const customFiles = requestedFileNames.map((fileName) => ciLoadCustomMessages(localeCode, fileName));

  /*
   * Merge precedence:
   * 1. core/common
   * 2. core/namespace chain
   * 3. custom/common
   * 4. custom/namespace chain
   */
  const allFiles = [...coreFiles, ...customFiles];

  let messages = {} as AbstractIntlMessages;
  let customOverrideCount = 0;

  const resolvedKeys = new Set<string>();

  for (const file of allFiles) {
    const { diagnostic, entries, messages: fileMessages } = file;

    if (diagnostic.status !== "loaded" || !entries || !fileMessages) {
      continue;
    }

    diagnostic.overriddenKeyCount = entries.filter(({ key }) => resolvedKeys.has(key)).length;

    if (diagnostic.source === "custom") {
      customOverrideCount += diagnostic.overriddenKeyCount;
    }

    messages = ciMergeMessages(messages, fileMessages);

    for (const { key } of entries) {
      resolvedKeys.add(key);
    }
  }

  const effectiveMessages = ciFlattenMessages(messages);

  return {
    locale: localeCode,

    /*
     * This is the normalized logical pathname, not the public Tenant-aware
     * pathname.
     */
    urlPath: pathname,
    namespace: namespace,
    requestedFileNames,
    messages,
    diagnostics: {
      files: allFiles.map(({ diagnostic }) => diagnostic),
      effectiveMessageCount: effectiveMessages.length,
      customOverrideCount,
    },
    ...(includeMessageEntries
      ? {
          effectiveMessages,
          sourceMessages: allFiles.map(({ diagnostic, entries }) => ({
            id: diagnostic.id,
            source: diagnostic.source,
            fileName: diagnostic.fileName,
            status: diagnostic.status,
            messageCount: diagnostic.messageCount,
            overriddenKeyCount: diagnostic.overriddenKeyCount,
            ...(diagnostic.error === undefined ? {} : { error: diagnostic.error }),
            entries: entries ?? [],
          })),
        }
      : {}),
  };
}
