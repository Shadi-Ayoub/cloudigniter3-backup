import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { CiCookieOptions } from "@cloudigniter/core/types";

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
export async function ciSetServerLocale(
  locale: string,
  cookieName = "ci-locale",
  options: CiCookieOptions = {},
) {
  const cookieStore = await cookies();

  const cookie: ResponseCookie = {
    name: cookieName,
    value: locale,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    ...options,
  };

  cookieStore.set(cookie);

  // const defaults: Required<
  //   Pick<CiCookieOptions, "path" | "httpOnly" | "sameSite" | "secure">
  // > & {
  //   maxAge?: number;
  //   domain?: string;
  //   expires?: Date;
  // } = {
  //   path: "/",
  //   httpOnly: true,
  //   sameSite: "lax",
  //   secure: true,
  // };

  // cookieStore.set({
  //   name: cookieName,
  //   value: locale,
  //   // merge your defaults with whatever the caller passed
  //   ...defaults,
  //   ...options,
  // });
}
