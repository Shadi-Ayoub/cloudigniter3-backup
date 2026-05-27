import { cookies } from "next/headers";

import type { CiGetServerLocaleInterface } from "@cloudigniter/core/types";

// We chose to read the locale value from a cookie on the server. One could alternatively
// also read it from a database, backend service, or any other source.
export async function ciGetServerLocale(input: CiGetServerLocaleInterface) {
  const cookieName = input.cookieName ?? "ci-locale";
  const defaultLocale = input.defaultLocale ?? "en";

  const cookie = await cookies();
  const cookieVal = cookie.get(cookieName)?.value;

  // throw new Error(cookieVal);
  if (cookieVal) {
    return cookieVal as string;
  } else {
    return defaultLocale as string;
  }
}
