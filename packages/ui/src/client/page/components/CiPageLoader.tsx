"use client";

import { useEffect } from "react";
import { ciSleep } from "@cloudigniter/core/lib";
import { CiSpinner } from "@ci-ui/client";
import { useCiPageLoaderStore } from "../utils";

export function CiPageLoader() {
  const isLoading = useCiPageLoaderStore((state) => state.isLoading);
  const loadingText = useCiPageLoaderStore((state) => state.loadingText);
  const setLoading = useCiPageLoaderStore((state) => state.setLoading);

  async function delay() {
    await ciSleep(1000);
    setLoading(false);
  }

  useEffect(() => {
    delay();
  }, []);

  return isLoading && <CiSpinner text={loadingText} />;
}
