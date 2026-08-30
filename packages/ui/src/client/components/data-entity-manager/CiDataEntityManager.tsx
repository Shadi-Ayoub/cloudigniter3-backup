"use client";

import {
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { RowData } from "@tanstack/react-table";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  CiAlert,
  CiAlertDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ciNormalizeClientThrownError,
  cn,
} from "@ci-ui/client";
import type {
  CiDataEntityEditorMode,
  CiDataEntityField,
  CiDataEntityManagerProps,
  CiDataEntityMutationResult,
  CiDataTableColumnDef,
  CiDataTableDefinition,
} from "@ci-ui/types";

import {
  ciCreateDataEntityFormDraft,
  ciParseDataEntityFormDraft,
  type CiDataEntityFormDraft,
} from "./lib";

const UNSET_BOOLEAN_VALUE = "__ci_unset_boolean__";

type CiDataEntityEditorSession<TRecord extends RowData> = {
  mode: CiDataEntityEditorMode;
  record?: TRecord;
  draft: CiDataEntityFormDraft;
  refresh?: () => void;
};

type CiDataEntityDeleteSession<TRecord extends RowData> = {
  record: TRecord;
  refresh?: () => void;
};

type CiDataEntityFeedback = {
  variant: "success" | "error";
  title: string;
  message: string;
};

/** Resolves either a static permission or a record-specific predicate. */
function isOperationAllowed<TRecord extends RowData>(
  permission: boolean | ((record: TRecord) => boolean) | undefined,
  record: TRecord,
): boolean {
  return typeof permission === "function"
    ? permission(record)
    : permission !== false;
}

/** Formats dynamic values without exposing provider-specific presentation. */
function renderFieldValue(value: unknown): ReactNode {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "boolean") {
    return <Badge variant="secondary">{value ? "Yes" : "No"}</Badge>;
  }
  if (typeof value === "object") {
    const serialized = JSON.stringify(value);
    return (
      <code className="block max-w-72 truncate text-xs" title={serialized}>
        {serialized}
      </code>
    );
  }
  return String(value);
}

/** Builds safe default columns when the caller does not supply a definition. */
function buildFieldColumns<TRecord extends RowData>(
  fields: readonly CiDataEntityField<TRecord>[],
): CiDataTableColumnDef<TRecord, unknown>[] {
  return fields.map((field) => ({
    id: field.name,
    accessorFn: (record) => (record as Record<string, unknown>)[field.name],
    header: field.label,
    cell: ({ getValue }) => renderFieldValue(getValue()),
    enableSorting: !field.array && field.valueKind !== "json",
    meta: {
      ciDataTable: {
        label: field.label,
        truncate: true,
      },
    },
  }));
}

/** Returns the first useful human-readable field when no label callback exists. */
function getDefaultRecordLabel<TRecord extends RowData>(
  record: TRecord,
  fields: readonly CiDataEntityField<TRecord>[],
): string {
  const source = record as Record<string, unknown>;
  for (const field of fields) {
    const value = source[field.name];
    if (
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim()
    ) {
      return String(value);
    }
  }
  return "selected record";
}

/** Returns a failed callback result message, if one was returned. */
function getMutationFailure<TRecord>(
  result: void | CiDataEntityMutationResult<TRecord>,
): string | undefined {
  return result && !result.ok ? result.message : undefined;
}

/** Renders one field in the provider-neutral create/edit form. */
function CiDataEntityEditorField<TRecord extends RowData>({
  field,
  value,
  error,
  mode,
  disabled,
  controlId,
  onChange,
}: {
  field: CiDataEntityField<TRecord>;
  value: string;
  error?: string;
  mode: CiDataEntityEditorMode;
  disabled?: boolean;
  controlId: string;
  onChange: (value: string) => void;
}) {
  const guidanceId = `${controlId}-guidance`;
  const isReadOnly =
    field.readOnly || (mode === "edit" && field.readOnlyOnUpdate);
  const isStructured = field.array || field.valueKind === "json";
  const structuredGuidance = field.array
    ? `Enter a JSON array of ${field.valueKind} values.${
        field.itemsRequired ? " Null items are not allowed." : ""
      }`
    : field.valueKind === "json"
      ? "Enter a valid JSON value."
      : undefined;
  const describedBy =
    error || field.description || structuredGuidance || isReadOnly
      ? guidanceId
      : undefined;

  let control: ReactNode;
  if (isStructured) {
    control = (
      <Textarea
        id={controlId}
        value={value}
        required={field.required}
        disabled={disabled}
        readOnly={isReadOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-28 font-mono text-sm"
        placeholder={
          field.placeholder ??
          (field.array
            ? field.valueKind === "number"
              ? "[1, 2]"
              : field.valueKind === "boolean"
                ? "[true, false]"
                : field.valueKind === "json"
                  ? '[{"key": "value"}]'
                  : '["first", "second"]'
            : "{}")
        }
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  } else if (field.valueKind === "boolean") {
    control = (
      <Select
        value={value || UNSET_BOOLEAN_VALUE}
        disabled={disabled || isReadOnly}
        onValueChange={(nextValue) =>
          onChange(nextValue === UNSET_BOOLEAN_VALUE ? "" : nextValue)
        }
      >
        <SelectTrigger
          id={controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-readonly={isReadOnly || undefined}
          className="min-h-11 w-full"
        >
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNSET_BOOLEAN_VALUE}>
            {field.required ? "Select a value" : "Not set"}
          </SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  } else if (field.valueKind === "string" && field.inputKind === "textarea") {
    control = (
      <Textarea
        id={controlId}
        value={value}
        required={field.required}
        disabled={disabled}
        readOnly={isReadOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-24"
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  } else {
    const inputType =
      field.valueKind === "number" ? "number" : (field.inputKind ?? "text");
    control = (
      <Input
        id={controlId}
        type={inputType}
        value={value}
        required={field.required}
        disabled={disabled}
        readOnly={isReadOnly}
        min={field.valueKind === "number" ? field.min : undefined}
        max={field.valueKind === "number" ? field.max : undefined}
        step={field.valueKind === "number" ? field.step : undefined}
        inputMode={field.valueKind === "number" ? "decimal" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="min-h-11"
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={controlId}>
        {field.label}
        {field.required ? (
          <>
            <span aria-hidden className="ms-1 text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      {control}
      {error ? (
        <p id={guidanceId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : field.description || structuredGuidance || isReadOnly ? (
        <p id={guidanceId} className="text-xs leading-5 text-muted-foreground">
          {[field.description, structuredGuidance, isReadOnly && "Read only."]
            .filter(Boolean)
            .join(" ")}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Provider-neutral CRUD manager that owns forms, feedback, confirmations, and
 * table actions while leaving the concrete table element at a render boundary.
 */
export function CiDataEntityManager<TRecord extends RowData>({
  title,
  description,
  entityLabel,
  entityPluralLabel,
  fields,
  data = [],
  source,
  getRowId,
  tableProps,
  renderTable,
  onCreate,
  onUpdate,
  onDelete,
  createInitialValues,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  getRecordLabel,
  renderDeleteDescription,
  labels,
  className,
}: CiDataEntityManagerProps<TRecord>) {
  const componentId = useId();
  const [editor, setEditor] =
    useState<CiDataEntityEditorSession<TRecord> | null>(null);
  const [editorErrors, setEditorErrors] = useState<Record<string, string>>({});
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteSession, setDeleteSession] =
    useState<CiDataEntityDeleteSession<TRecord> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<CiDataEntityFeedback | null>(null);
  const isMutating = isSaving || isDeleting;

  const recordLabel = (record: TRecord) =>
    getRecordLabel?.(record) ?? getDefaultRecordLabel(record, fields);

  const openCreate = (refresh?: () => void) => {
    const initialValues =
      typeof createInitialValues === "function"
        ? createInitialValues()
        : createInitialValues;
    setFeedback(null);
    setEditorErrors({});
    setEditorError(null);
    setEditor({
      mode: "create",
      draft: ciCreateDataEntityFormDraft(fields, initialValues),
      refresh,
    });
  };

  const openEdit = (record: TRecord, refresh?: () => void) => {
    setFeedback(null);
    setEditorErrors({});
    setEditorError(null);
    setEditor({
      mode: "edit",
      record,
      draft: ciCreateDataEntityFormDraft(fields, record),
      refresh,
    });
  };

  const updateDraft = (name: string, value: string) => {
    setEditor((current) =>
      current
        ? { ...current, draft: { ...current.draft, [name]: value } }
        : null,
    );
    setEditorErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setEditorError(null);
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || isSaving) return;

    const parsed = ciParseDataEntityFormDraft(
      fields,
      editor.draft,
      editor.mode,
    );
    if (!parsed.ok) {
      setEditorErrors(parsed.errors);
      setEditorError("Review the highlighted fields and try again.");
      const firstInvalidField = fields.find(
        (field) => parsed.errors[field.name],
      );
      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          document
            .getElementById(`${componentId}-${firstInvalidField.name}`)
            ?.focus();
        });
      }
      return;
    }

    setIsSaving(true);
    setEditorError(null);
    try {
      const result =
        editor.mode === "create"
          ? await onCreate?.(parsed.values)
          : editor.record
            ? await onUpdate?.(editor.record, parsed.values)
            : undefined;
      const failure = getMutationFailure(result);
      if (failure) {
        setEditorError(failure);
        return;
      }

      const successMessage =
        result?.message ??
        (editor.mode === "create"
          ? (labels?.createSuccess ?? `${entityLabel} created successfully.`)
          : (labels?.updateSuccess ?? `${entityLabel} updated successfully.`));
      const refresh = editor.refresh;
      setFeedback({
        variant: "success",
        title: labels?.successTitle ?? "Success",
        message: successMessage,
      });
      setEditor(null);
      refresh?.();
    } catch (error) {
      setEditorError(ciNormalizeClientThrownError(error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSession || !onDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await onDelete(deleteSession.record);
      const failure = getMutationFailure(result);
      if (failure) throw new Error(failure);

      setFeedback({
        variant: "success",
        title: labels?.successTitle ?? "Success",
        message:
          result?.message ??
          labels?.deleteSuccess ??
          `${entityLabel} deleted successfully.`,
      });
      deleteSession.refresh?.();
    } finally {
      setIsDeleting(false);
    }
  };

  const generatedColumns = useMemo(() => buildFieldColumns(fields), [fields]);
  const baseDefinition = tableProps?.definition;
  const definition = useMemo<CiDataTableDefinition<TRecord>>(
    () => ({
      columns: baseDefinition?.columns ?? generatedColumns,
      getRowId,
      information: baseDefinition?.information ?? {
        mode: "dialog",
        label: "View details",
        title: (record) => recordLabel(record),
      },
      filters: baseDefinition?.filters,
      rowActions: [
        ...(onUpdate
          ? [
              {
                id: "ci-data-entity-edit",
                label: labels?.editAction ?? `Edit ${entityLabel}`,
                icon: <Pencil aria-hidden />,
                display: "icon" as const,
                disableWhen: (record: TRecord) =>
                  isMutating || !isOperationAllowed(canUpdate, record),
                onSelect: (
                  record: TRecord,
                  context?: { refresh: () => void },
                ) => openEdit(record, context?.refresh),
              },
            ]
          : []),
        ...(baseDefinition?.rowActions ?? []),
        ...(onDelete
          ? [
              {
                id: "ci-data-entity-delete",
                label: labels?.deleteAction ?? `Delete ${entityLabel}`,
                icon: <Trash2 aria-hidden />,
                variant: "destructive" as const,
                disableWhen: (record: TRecord) =>
                  isMutating || !isOperationAllowed(canDelete, record),
                onSelect: (
                  record: TRecord,
                  context?: { refresh: () => void },
                ) => {
                  setFeedback(null);
                  setDeleteError(null);
                  setDeleteSession({ record, refresh: context?.refresh });
                  setDeleteOpen(true);
                },
              },
            ]
          : []),
      ],
      globalActions: [
        ...(onCreate
          ? [
              {
                id: "ci-data-entity-create",
                label: labels?.createAction ?? `New ${entityLabel}`,
                icon: <Plus aria-hidden />,
                selection: "none" as const,
                isDisabled: () => isMutating || !canCreate,
                onSelect: (context: { refresh: () => void }) =>
                  openCreate(context.refresh),
              },
            ]
          : []),
        ...(baseDefinition?.globalActions ?? []),
      ],
    }),
    [
      baseDefinition,
      canCreate,
      canDelete,
      canUpdate,
      createInitialValues,
      entityLabel,
      fields,
      generatedColumns,
      getRecordLabel,
      getRowId,
      isMutating,
      labels?.createAction,
      labels?.deleteAction,
      labels?.editAction,
      onCreate,
      onDelete,
      onUpdate,
    ],
  );

  const {
    definition: _definition,
    config,
    ...tableOverrides
  } = tableProps ?? {};
  const renderedTable = renderTable({
    ...tableOverrides,
    title,
    description,
    titleBadge: tableOverrides.titleBadge ?? "Data management",
    titleChips:
      tableOverrides.titleChips ??
      [
        data
          ? {
              id: "records",
              label: `${data.length} ${
                data.length === 1 ? "record" : "records"
              }`,
            }
          : { id: "source", label: "Provider-backed" },
        {
          id: "management",
          label:
            onCreate || onUpdate || onDelete
              ? "Management enabled"
              : "Read only",
          variant:
            onCreate || onUpdate || onDelete ? "default" : "secondary",
        },
      ],
    data,
    source,
    definition,
    config: {
      ...config,
      rowActions: {
        mode: "mixed",
        overflow: 1,
        reserveSpace: true,
        ...config?.rowActions,
      },
    },
  });
  const selectedRecordLabel = deleteSession
    ? recordLabel(deleteSession.record)
    : "selected record";

  return (
    <section className={cn("space-y-4", className)}>
      {feedback ? (
        <CiAlert
          variant={feedback.variant}
          title={feedback.title}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </CiAlert>
      ) : null}

      {renderedTable}

      <CiAlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteSession(null);
            setDeleteError(null);
          }
        }}
        variant="destructive"
        icon={<Trash2 aria-hidden />}
        title={`${labels?.deleteTitle ?? `Delete ${entityLabel}`} “${
          selectedRecordLabel
        }”?`}
        description={
          renderDeleteDescription && deleteSession
            ? renderDeleteDescription(deleteSession.record)
            : (labels?.deleteDescription ??
              `This permanently deletes “${selectedRecordLabel}” from ${entityPluralLabel}. This action cannot be undone.`)
        }
        confirmLabel={labels?.deleteAction ?? `Delete ${entityLabel}`}
        pendingLabel={labels?.deleting ?? `Deleting ${entityLabel}…`}
        pending={isDeleting}
        onConfirm={confirmDelete}
        onConfirmError={(error) =>
          setDeleteError(ciNormalizeClientThrownError(error).message)
        }
      >
        {deleteError ? (
          <CiAlert
            variant="error"
            title={labels?.errorTitle ?? "Action failed"}
            dismissible={false}
          >
            {deleteError} Review the record and try again.
          </CiAlert>
        ) : null}
      </CiAlertDialog>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setEditor(null);
            setEditorErrors({});
            setEditorError(null);
          }
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl [&_[data-slot=dialog-close]]:size-11"
          aria-busy={isSaving}
        >
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "create"
                ? (labels?.createTitle ?? `Create ${entityLabel}`)
                : `${labels?.editTitle ?? `Edit ${entityLabel}`} “${
                    editor?.record ? recordLabel(editor.record) : ""
                  }”`}
            </DialogTitle>
            <DialogDescription>
              {labels?.editorDescription ??
                `Complete the ${entityLabel.toLowerCase()} fields, then save your changes.`}
            </DialogDescription>
          </DialogHeader>

          {editor ? (
            <form className="grid gap-5" onSubmit={submitEditor} noValidate>
              {editorError ? (
                <CiAlert
                  variant="error"
                  title={labels?.errorTitle ?? "Could not save"}
                  dismissible={false}
                >
                  {editorError}
                </CiAlert>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      (field.array ||
                        field.valueKind === "json" ||
                        (field.valueKind === "string" &&
                          field.inputKind === "textarea")) &&
                        "sm:col-span-2",
                    )}
                  >
                    <CiDataEntityEditorField
                      field={field}
                      value={editor.draft[field.name] ?? ""}
                      error={editorErrors[field.name]}
                      mode={editor.mode}
                      disabled={isSaving}
                      controlId={`${componentId}-${field.name}`}
                      onChange={(value) => updateDraft(field.name, value)}
                    />
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={isSaving}
                  onClick={() => setEditor(null)}
                >
                  {labels?.cancelAction ?? "Cancel"}
                </Button>
                <Button type="submit" className="min-h-11" disabled={isSaving}>
                  {isSaving ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : null}
                  {isSaving
                    ? editor.mode === "create"
                      ? (labels?.savingCreate ?? `Creating ${entityLabel}…`)
                      : (labels?.savingEdit ?? `Saving ${entityLabel}…`)
                    : editor.mode === "create"
                      ? (labels?.saveCreateAction ?? `Create ${entityLabel}`)
                      : (labels?.saveEditAction ?? "Save changes")}
                </Button>
              </DialogFooter>

              {isSaving ? (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-background/85 px-6 text-center supports-backdrop-filter:backdrop-blur-[2px]">
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex max-w-sm items-center gap-3 rounded-xl border bg-background/95 px-5 py-4 text-sm font-medium shadow-lg"
                  >
                    <LoaderCircle
                      className="size-5 shrink-0 animate-spin"
                      aria-hidden
                    />
                    <span>
                      {editor.mode === "create"
                        ? (labels?.savingCreate ??
                          `Creating ${entityLabel}. Please wait…`)
                        : (labels?.savingEdit ??
                          `Saving ${entityLabel}. Please wait…`)}
                    </span>
                  </div>
                </div>
              ) : null}
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
