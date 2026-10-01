import Image from "next/image";
import Link from "next/link";
import { CiErrorPage } from "@cloudigniter/ui/client";
import type { CiNextHttpErrorPageProps } from "@ci-next/types";
import common from "../../../locales/en/common.json";

/** Presentation only: invoke Next.js forbidden()/notFound() at the server guard. */
export function CiNextHttpErrorPage({
  statusCode,
  accessSuspended = false,
  imageSrc,
  messages,
}: CiNextHttpErrorPageProps) {
  const defaults = common.httpErrors;
  const copy = {
    ...(statusCode === 403 && accessSuspended
      ? defaults.suspended
      : defaults[statusCode]),
    errorLabel: defaults.errorLabel,
    homeLabel: defaults.homeLabel,
    ...messages,
  };
  return (
    <main>
      <CiErrorPage
        statusCode={statusCode}
        title={copy.title}
        message={copy.message}
        errorLabel={copy.errorLabel}
        illustration={
          imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              width={1024}
              height={1024}
              priority
              className="h-auto w-full select-none object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
            />
          ) : undefined
        }
        actions={
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.homeLabel}
          </Link>
        }
      />
    </main>
  );
}
