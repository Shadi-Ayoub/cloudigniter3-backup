"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ciStartTrace } from "@cloudigniter/core";
import { useCiPageLoaderStore } from "@/ui";
import type { CiHeaderLogoProps } from "./types";

export function CiHeaderLogo({ config }: CiHeaderLogoProps) {
  const { setLoading } = useCiPageLoaderStore();
  const router = useRouter();

  const handleClick = () => {
    setLoading(true);
    router.refresh();
  };

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "client" },
    { name: `HeaderLogo` },
  );

  // log mount/unmount once
  useEffect(() => {
    // stop the render timer (records a "duration" metric if enabled)
    done({ phase: "mount" });

    logger.log({
      type: "component",
      name: "HeaderLogo",
      scope: "layout",
      event: "mount <HeaderLogo>",
    });
    return () => logger.log({ type: "component", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="ci-header-logo-main"
      dir="ltr"
    >
      <span className="ci-header-logo-cloud">Cloud</span>
      <span className="ci-header-logo-igniter">Igniter</span>
      <span className="ci-header-logo-flame" />
    </Link>
  );
}
