import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 py-10 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <section className="flex w-full max-w-lg flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-muted-foreground sm:text-sm">
          Error
        </p>

        <div className="relative mt-1 select-none">
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-x-1.5 translate-y-1.5 text-7xl font-black tracking-tighter text-primary/10 sm:text-9xl"
          >
            404
          </span>

          <span className="relative text-7xl font-black tracking-tighter text-foreground sm:text-9xl">
            404
          </span>
        </div>

        <div
          aria-hidden="true"
          className="relative -mt-2 w-56 sm:-mt-4 sm:w-64 md:w-72"
        >
          <Image
            src="/images/logo-not-found-1.png"
            alt=""
            width={1024}
            height={1024}
            priority
            className="h-auto w-full select-none object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
          />
        </div>

        <h1 className="-mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Page not found
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          The route you requested does not exist, may have moved, or is no
          longer available.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Return to home
        </Link>
      </section>
    </main>
  );
}
