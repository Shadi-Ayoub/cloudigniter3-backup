"use client";

import type { ReactElement, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
} from "@ci-ui/client";

import {
  ciBuildDataTableRecordFields,
  ciFormatDataTableRecordJson,
  ciHasDataTableRecordDescription,
  type CiDataTableRecordField,
} from "../lib/ci-data-table-record-display";

export type CiDataTableRecordInformationDialogProps = {
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  record: unknown;
  dialogClassName?: string;
};

const RECORD_VIEW_CLASS_NAME =
  "h-[50vh] min-h-48 max-h-80 overflow-auto rounded-md border bg-muted/20";

function RecordField({ field }: { field: CiDataTableRecordField }) {
  if (field.children) {
    return (
      <div role="listitem" className="space-y-2">
        <div className="text-sm font-semibold text-foreground">
          {field.label}:
        </div>
        <div role="list" className="ms-2 space-y-2 border-s border-border ps-4">
          {field.children.map((child) => (
            <RecordField key={child.id} field={child} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="listitem"
      className="grid min-w-0 grid-cols-[minmax(7rem,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm"
    >
      <div className="font-medium text-muted-foreground">{field.label}:</div>
      <div className="min-w-0 whitespace-pre-wrap break-words font-mono text-foreground">
        {field.value}
      </div>
    </div>
  );
}

function RecordInformationViews({
  description,
  record,
}: Pick<CiDataTableRecordInformationDialogProps, "description" | "record">) {
  const hasDescription = ciHasDataTableRecordDescription(description);
  const fields = ciBuildDataTableRecordFields(record);
  const json = ciFormatDataTableRecordJson(record);

  return (
    <Tabs
      defaultValue={hasDescription ? "description" : "details"}
      className="min-w-0"
    >
      <TabsList
        className="grid h-auto w-full grid-cols-3"
        aria-label="Record information views"
      >
        <TabsTrigger
          value="description"
          className="min-h-11 whitespace-normal"
          disabled={!hasDescription}
          title={hasDescription ? undefined : "No description is available"}
        >
          Description
        </TabsTrigger>
        <TabsTrigger value="details" className="min-h-11 whitespace-normal">
          Details
        </TabsTrigger>
        <TabsTrigger value="json" className="min-h-11 whitespace-normal">
          JSON
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        <div
          className={cn(
            RECORD_VIEW_CLASS_NAME,
            "whitespace-pre-wrap p-4 text-sm leading-6"
          )}
        >
          {description}
        </div>
      </TabsContent>

      <TabsContent value="details">
        <div
          role="list"
          aria-label="Record details"
          className={cn(RECORD_VIEW_CLASS_NAME, "space-y-3 p-4")}
        >
          {fields.map((field) => (
            <RecordField key={field.id} field={field} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="json">
        <Textarea
          aria-label="Record JSON"
          readOnly
          value={json}
          spellCheck={false}
          className={cn(
            RECORD_VIEW_CLASS_NAME,
            "resize-none whitespace-pre font-mono text-xs leading-5"
          )}
        />
      </TabsContent>
    </Tabs>
  );
}

/** Displays one table record as description, nested label/value details, or JSON. */
export function CiDataTableRecordInformationDialog({
  trigger,
  title,
  description,
  record,
  dialogClassName,
}: CiDataTableRecordInformationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-2xl", dialogClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Review this record as a description, a nested details list, or JSON.
          </DialogDescription>
        </DialogHeader>

        <RecordInformationViews description={description} record={record} />
      </DialogContent>
    </Dialog>
  );
}
