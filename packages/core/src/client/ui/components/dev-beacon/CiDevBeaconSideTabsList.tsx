"use client";

import { Activity, Loader2, Settings, Wrench } from "lucide-react";
import { cn, Tabs, TabsContent, TabsList, TabsTrigger } from "@/client";
import type { CiDevBeaconSideTabsListProps } from "@/types";

export function CiDevBeaconSideTabsList({
  loaded,
  defaultTab = "status",
  className,
  statusContent,
  configContent,
  toolsContent,
  extraTabs = [],
}: CiDevBeaconSideTabsListProps) {
  return (
    <aside
      className={cn(
        "border-r p-2 data-[side=right]:border-r-0 data-[side=right]:border-l",
        className,
      )}
    >
      <Tabs
        defaultValue={defaultTab}
        orientation="vertical"
        className="flex w-full flex-row items-start gap-3"
      >
        {/* Left: vertical tab list */}
        <TabsList className="grid h-auto w-fit shrink-0 grid-cols-1 gap-1">
          {/* built-ins */}
          <TabsTrigger value="status" className="justify-start">
            <span className="inline-flex items-center gap-2">
              <Activity className="size-3.5" aria-hidden="true" />
              Status
            </span>
          </TabsTrigger>

          <TabsTrigger value="config" className="justify-start">
            <span className="inline-flex items-center gap-2">
              <Settings className="size-3.5" aria-hidden="true" />
              CiConfig
            </span>
          </TabsTrigger>

          <TabsTrigger value="tools" className="justify-start">
            <span className="inline-flex items-center gap-2">
              <Wrench className="size-3.5" aria-hidden="true" />
              <span className="inline-flex items-center">
                Tools
                {!loaded && (
                  <Loader2
                    className="ml-2 size-3 animate-spin"
                    aria-hidden="true"
                  />
                )}
              </span>
            </span>
          </TabsTrigger>

          {/* extra tabs */}
          {extraTabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="justify-start">
              <span className="inline-flex items-center gap-2">
                {t.icon ? (
                  <t.icon className="size-3.5" aria-hidden="true" />
                ) : null}
                {t.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Right: content panel */}
        <div className="flex min-h-40 w-full max-w-full min-w-0 items-stretch justify-stretch rounded-md border">
          <div className="flex-1 p-3">
            <TabsContent
              value="status"
              className="m-0 flex h-full w-full items-start justify-start"
            >
              {statusContent ?? (
                <div className="text-muted-foreground text-sm">
                  No status content.
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="config"
              className="m-0 flex h-full w-full items-start justify-start"
            >
              {configContent ?? (
                <div className="text-muted-foreground text-sm">
                  No config content.
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="tools"
              className="m-0 flex h-full w-full items-start justify-start"
            >
              {toolsContent ?? (
                <div className="text-muted-foreground text-sm">
                  No tools content.
                </div>
              )}
            </TabsContent>

            {/* extra contents */}
            {extraTabs.map((t) => (
              <TabsContent
                key={t.id}
                value={t.id}
                className="m-0 flex h-full w-full items-start justify-start"
              >
                {t.content}
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </aside>
  );
}
