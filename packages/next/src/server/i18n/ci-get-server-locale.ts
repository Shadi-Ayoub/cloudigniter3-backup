import { cookies } from "next/headers";
import {
  CI_DEFAULT_LOCALE,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  CI_LANGUAGES,
  ciGetLangDir,
} from "@cloudigniter/core/lib";
import type {
  CiGetServerLocaleInterface,
  CiLocale,
} from "@cloudigniter/core/types";

// We chose to read the locale value from a cookie on the server. One could alternatively
// also read it from a database, backend service, or any other source.
export async function ciGetServerLocale(
  input: CiGetServerLocaleInterface = {},
) {
  const cookieName = input.cookieName ?? CI_DEFAULT_LOCALE_COOKIE_NAME;
  const defaultLocale = input.defaultLocale ?? CI_DEFAULT_LOCALE;

  const cookie = await cookies();
  const cookieVal = cookie.get(cookieName)?.value;

  const localeCode = cookieVal ?? defaultLocale;
  const localeName = CI_LANGUAGES[localeCode];
  const localeDirection = ciGetLangDir(localeCode);

  return {
    code: localeCode,
    name: localeName,
    direction: localeDirection,
  } as CiLocale;
}
