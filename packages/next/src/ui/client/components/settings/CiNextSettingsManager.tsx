"use client";

import { useRouter } from "next/navigation";
import {
  CiSettingsManager,
  useCiPageLoaderStore,
} from "@cloudigniter/ui/client";
import type { CiNextSettingsManagerProps } from "@ci-next/types";
import { ciSettingsReturnTarget } from "./ci-settings-return-target";

/** Owns Next navigation; settings forms remain framework-neutral. */
export function CiNextSettingsManager({
  closeHref,
  ...props
}: CiNextSettingsManagerProps) {
  const router = useRouter();
  const setLoading = useCiPageLoaderStore((state) => state.setLoading);
  return (
    <CiSettingsManager
      {...props}
      onClose={
        closeHref === undefined
          ? undefined
          : () => {
              const target = ciSettingsReturnTarget(
                closeHref,
                window.location.origin,
                window.location.pathname,
              );
              setLoading(true);
              router.push(target);
            }
      }
    />
  );
}
