"use client";

import { useEffect } from "react";
import {
  Tab as HeadlessTab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from "@headlessui/react";
import { useSearchParams, usePathname } from "next/navigation";
import { Button, CiSpinner, useCiFormikErrors } from "@cloudigniter/ui/client";
import type {
  CiSettingsPageExtendedTab,
  CiLocaleDirection,
} from "@cloudigniter/core/types";

interface SettingsFormContentProps {
  allTabs: CiSettingsPageExtendedTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  fieldLabels: Record<string, string>;
  fieldSectionMap: Record<string, string>;
  loading: boolean;
  direction: CiLocaleDirection;
}

export function CiSettingsFormContent({
  allTabs,
  activeTabId,
  setActiveTabId,
  t,
  fieldLabels,
  fieldSectionMap,
  loading,
  direction,
}: SettingsFormContentProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabQuery = searchParams.get("tab") ?? undefined;

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("ci-settingsActiveTab") || undefined
        : undefined;
    const initial =
      tabQuery && allTabs.some((t) => t.id === tabQuery)
        ? tabQuery
        : stored && allTabs.some((t) => t.id === stored)
        ? stored
        : undefined;
    if (initial && initial !== activeTabId) {
      setActiveTabId(initial);
    }
  }, [allTabs, tabQuery, activeTabId, setActiveTabId]);

  const { formErrors, hasErrorInSection } = useCiFormikErrors({
    fieldLabels,
    fieldSectionMap,
    translate: (key) => t(`form.fields.${key}`),
    onTabChange: setActiveTabId,
  });

  const selectedIndex = Math.max(
    0,
    allTabs.findIndex((tab) => tab.id === activeTabId),
  );

  return (
    <div className="ci-settings-form-container">
      {loading && (
        <div className="dark:bg-muted-900/20 absolute inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <CiSpinner />
        </div>
      )}
      <TabGroup
        selectedIndex={selectedIndex}
        onChange={(idx) => {
          const tab = allTabs[idx];
          if (!tab) return;

          const id = tab.id;
          setActiveTabId(id);
          localStorage.setItem("ci-settingsActiveTab", id);
          const params = new URLSearchParams(
            Array.from(searchParams.entries()),
          );
          params.set("tab", id);
          window.history.replaceState(null, "", `${pathname}?${params}`);
        }}
      >
        <div className="ci-settings-form-main">
          {/* Tabs sidebar */}
          <aside className="w-1/5 border-0 border-gray-200 ltr:border-r ltr:pr-4 rtl:border-l rtl:pl-4">
            <TabList
              aria-label={t("form.tabs.ariaLabel")}
              className="space-y-2"
            >
              {allTabs.map((tab) => (
                <HeadlessTab
                  key={tab.id}
                  className={({ selected }) =>
                    `flex w-full items-center justify-between rounded-md px-4 py-2 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      selected
                        ? "bg-blue-100 font-semibold text-blue-800"
                        : "hover:bg-gray-50"
                    } rtl:flex-row-reverse`
                  }
                >
                  <span className="flex-1 text-left rtl:text-right">
                    {t(`tabs.${tab.id}`)}
                  </span>
                  {hasErrorInSection(tab.id) && (
                    <span
                      className="text-sm text-red-500"
                      title={t("form.errors.containsErrors")}
                    >
                      ⚠️
                    </span>
                  )}
                </HeadlessTab>
              ))}
            </TabList>
          </aside>

          {/* Main form panel */}
          <div className="w-3/5">
            <TabPanels>
              {allTabs.map((tab) => (
                <TabPanel key={tab.id} className="outline-none">
                  <div className="space-y-6">
                    <tab.Component direction={direction} />
                  </div>
                </TabPanel>
              ))}
            </TabPanels>
          </div>

          {/* Save button panel */}
          <div className="w-1/6 pt-2">
            <div className="sticky top-10">
              <Button type="submit" className="w-full">
                {t("form.buttons.save")}
              </Button>
            </div>
          </div>
        </div>
      </TabGroup>
      {/* Error Summary */}
      {formErrors.length > 0 && (
        <div className="sticky top-4 mb-6 rounded-md border border-red-300 bg-red-50 p-4 text-red-700 shadow-md rtl:text-right">
          <p className="mb-2 font-semibold">{t("form.errors.heading")}</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {formErrors.map((err, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => setActiveTabId(err.section)}
                  className="underline hover:text-red-900"
                >
                  {err.label}: {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
