"use client";

import { useMemo, useState, useTransition } from "react";
import { LockKeyhole, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  CiDataTable,
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
  ciDefineDataTable,
} from "@ci-ui/client";
import type {
  CiAccessScopeKind,
  CiSecurityRecord,
  CiSecurityRecordKind,
} from "@cloudigniter/core/types";
import type {
  CiDataTableColumnDef,
  CiDataTableConfig,
  CiSecurityDataPageProps,
} from "@ci-ui/types";

/** Converts a machine identifier into a readable fallback label. */
function humanizeIdentifier(value: string): string {
  return value
    .replaceAll(/[._-]+/g, " ")
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Parses a comma-delimited list into supported access-scope kinds. */
function parseScopeKinds(value: string): CiAccessScopeKind[] {
  /** Narrows one form value to a supported scope kind. */
  const isScopeKind = (item: string): item is CiAccessScopeKind =>
    item === "system" ||
    item === "global" ||
    item === "tenant" ||
    item === "orgUnit";
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(isScopeKind);
}

/** Creates a safe application-owned draft for the selected security aspect. */
function createSecurityDraft(kind: CiSecurityRecordKind): CiSecurityRecord {
  const id = `new-${kind}`;
  const base = {
    id,
    title: "",
    description: "",
    origin: "application" as const,
    locked: false,
  };

  switch (kind) {
    case "role":
      return {
        ...base,
        kind,
        precedence: 50,
        inherits: ["USER"],
        permissionCount: 0,
      };
    case "permission":
      return {
        ...base,
        kind,
        roleId: "",
        effect: "allow",
        resource: "",
        action: "read",
        scopeKinds: ["tenant"],
        sensitive: false,
      };
    case "resource":
      return {
        ...base,
        kind,
        domainId: "",
        actions: ["read"],
        scopeKinds: ["tenant"],
        sensitiveActionCount: 0,
      };
    case "assignment":
      return {
        ...base,
        kind,
        subjectId: "",
        roleId: "",
        scopeKind: "tenant",
        propagation: "exact",
      };
    case "identity-group":
      return {
        ...base,
        kind,
        provider: "",
        providerGroup: "",
        roleId: "",
        status: "mapped",
      };
  }
}

/** Returns a concise aspect-specific summary for a table record. */
function getRecordSummary(record: CiSecurityRecord): string {
  switch (record.kind) {
    case "role":
      return `${record.permissionCount} permissions`;
    case "permission":
      return `${record.roleId} · ${record.effect} ${record.resource}.${record.action}`;
    case "resource":
      return `${record.domainId} · ${record.actions.length} actions`;
    case "assignment":
      return `${record.subjectId} · ${record.roleId}`;
    case "identity-group":
      return `${record.providerGroup} → ${record.roleId}`;
  }
}

/** Checks the minimum fields required before a draft can be submitted. */
function isSecurityDraftComplete(record: CiSecurityRecord | null): boolean {
  if (!record) return false;
  if (record.kind !== "assignment" && record.id.startsWith("new-"))
    return false;
  switch (record.kind) {
    case "role":
      return Boolean(record.id.trim() && record.title.trim());
    case "permission":
      return Boolean(
        record.id.trim() &&
          record.roleId.trim() &&
          record.resource.trim() &&
          record.action.trim() &&
          record.scopeKinds.length
      );
    case "resource":
      return Boolean(
        record.id.trim() &&
          record.title.trim() &&
          record.domainId.trim() &&
          record.actions.length &&
          record.scopeKinds.length
      );
    case "assignment":
      return Boolean(
        record.subjectId.trim() &&
          record.roleId.trim() &&
          ((record.scopeKind !== "tenant" && record.scopeKind !== "orgUnit") ||
            record.scopeId?.trim())
      );
    case "identity-group":
      return false;
  }
}

/** Builds columns shared by every security management route. */
function buildSecurityColumns(
  kind: CiSecurityRecordKind
): CiDataTableColumnDef<CiSecurityRecord, unknown>[] {
  const primary: CiDataTableColumnDef<CiSecurityRecord, unknown> = {
    accessorKey: "title",
    header: kind === "assignment" ? "Assignment" : "Name",
    cell: ({ row }) => (
      <div className="min-w-52">
        <div className="flex items-center gap-2 font-semibold">
          {row.original.title || humanizeIdentifier(row.original.id)}
          {row.original.locked ? (
            <LockKeyhole
              aria-label="Protected entry"
              className="size-3.5 text-muted-foreground"
            />
          ) : null}
        </div>
        <div className="mt-0.5 max-w-96 truncate text-xs text-muted-foreground">
          {row.original.id}
        </div>
      </div>
    ),
    meta: {
      ciDataTable: { label: "Name", export: { value: (row) => row.title } },
    },
  };

  const origin: CiDataTableColumnDef<CiSecurityRecord, unknown> = {
    accessorKey: "origin",
    header: "Owner",
    cell: ({ row }) => (
      <Badge
        variant={row.original.origin === "core" ? "secondary" : "outline"}
        className="capitalize"
      >
        {row.original.origin}
      </Badge>
    ),
    meta: {
      ciDataTable: {
        filter: {
          type: "select",
          options: [
            { id: "core", label: "Core" },
            { id: "application", label: "Application" },
            { id: "provider", label: "Provider" },
          ],
        },
      },
    },
  };

  const summary: CiDataTableColumnDef<CiSecurityRecord, unknown> = {
    id: "summary",
    header: "Details",
    accessorFn: (record) => getRecordSummary(record),
    meta: { ciDataTable: { truncate: { maxWidth: 440, showTitle: true } } },
  };

  const aspectColumns: CiDataTableColumnDef<CiSecurityRecord, unknown>[] = [];
  if (kind === "role") {
    aspectColumns.push({
      id: "precedence",
      accessorFn: (row) => (row.kind === "role" ? row.precedence : 0),
      header: "Precedence",
      meta: {
        ciDataTable: {
          className: "font-medium tabular-nums",
        },
      },
    });
  }
  if (kind === "permission") {
    aspectColumns.push(
      {
        id: "roleId",
        accessorFn: (row) => (row.kind === "permission" ? row.roleId : ""),
        header: "Role",
      },
      {
        id: "effect",
        accessorFn: (row) => (row.kind === "permission" ? row.effect : ""),
        header: "Effect",
      }
    );
  }
  if (kind === "resource") {
    aspectColumns.push({
      id: "domainId",
      accessorFn: (row) => (row.kind === "resource" ? row.domainId : ""),
      header: "Domain",
    });
  }
  if (kind === "assignment") {
    aspectColumns.push(
      {
        id: "subjectId",
        accessorFn: (row) => (row.kind === "assignment" ? row.subjectId : ""),
        header: "Subject",
      },
      {
        id: "roleId",
        accessorFn: (row) => (row.kind === "assignment" ? row.roleId : ""),
        header: "Role",
      }
    );
  }
  if (kind === "identity-group") {
    aspectColumns.push(
      {
        id: "providerGroup",
        accessorFn: (row) =>
          row.kind === "identity-group" ? row.providerGroup : "",
        header: "Provider group",
      },
      {
        id: "roleId",
        accessorFn: (row) => (row.kind === "identity-group" ? row.roleId : ""),
        header: "CloudIgniter role",
      }
    );
  }

  return [primary, ...aspectColumns, summary, origin];
}

/** Provider-neutral editor for roles, permissions, resources, assignments, and group mappings. */
function CiSecurityRecordEditor({
  draft,
  reason,
  roleOptions = [],
  resourceOptions = [],
  onChange,
  onReasonChange,
}: {
  draft: CiSecurityRecord;
  reason: string;
  roleOptions?: CiSecurityDataPageProps["roleOptions"];
  resourceOptions?: CiSecurityDataPageProps["resourceOptions"];
  onChange: (next: CiSecurityRecord) => void;
  onReasonChange: (next: string) => void;
}) {
  const set = (values: Partial<CiSecurityRecord>) =>
    onChange({ ...draft, ...values } as CiSecurityRecord);
  const isExisting = !draft.id.startsWith("new-");

  return (
    <div className="grid gap-5 py-2 [&_button[role=combobox]]:min-h-11 [&_input]:min-h-11 [&_textarea]:min-h-24">
      <div className="grid gap-2">
        <Label htmlFor="security-id">Stable identifier</Label>
        <Input
          id="security-id"
          value={draft.id.startsWith("new-") ? "" : draft.id}
          disabled={isExisting}
          onChange={(event) => set({ id: event.target.value.trim() })}
          placeholder="lowercase-stable-id"
        />
        <p className="text-xs text-muted-foreground">
          Identifiers are referenced by assignments and audit records and cannot
          be renamed later.
        </p>
      </div>

      {draft.kind !== "assignment" ? (
        <div className="grid gap-2">
          <Label htmlFor="security-title">Display name</Label>
          <Input
            id="security-title"
            value={draft.title}
            onChange={(event) => set({ title: event.target.value })}
          />
        </div>
      ) : null}

      {draft.kind === "role" ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="security-precedence">Precedence</Label>
              <Input
                id="security-precedence"
                type="number"
                min={1}
                value={draft.precedence}
                onChange={(event) =>
                  set({ precedence: Number(event.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="security-inherits">Inherited roles</Label>
              <Input
                id="security-inherits"
                value={draft.inherits.join(", ")}
                onChange={(event) =>
                  set({
                    inherits: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="USER, EDITOR"
              />
            </div>
          </div>
        </>
      ) : null}

      {draft.kind === "permission" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={draft.roleId}
              disabled={isExisting}
              onValueChange={(value) => set({ roleId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Effect</Label>
            <Select
              value={draft.effect}
              onValueChange={(value) =>
                set({ effect: value as "allow" | "deny" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Allow</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Resource</Label>
            <Select
              value={draft.resource}
              onValueChange={(value) => set({ resource: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                {resourceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-action">Action</Label>
            <Input
              id="security-action"
              value={draft.action}
              onChange={(event) => set({ action: event.target.value.trim() })}
              placeholder="read"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="security-scopes">Permitted scope kinds</Label>
            <Input
              id="security-scopes"
              value={draft.scopeKinds.join(", ")}
              onChange={(event) =>
                set({
                  scopeKinds: parseScopeKinds(event.target.value),
                })
              }
              placeholder="tenant, orgUnit"
            />
          </div>
        </div>
      ) : null}

      {draft.kind === "resource" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="security-domain">Domain</Label>
            <Input
              id="security-domain"
              value={draft.domainId}
              onChange={(event) => set({ domainId: event.target.value.trim() })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-actions">Actions</Label>
            <Input
              id="security-actions"
              value={draft.actions.join(", ")}
              onChange={(event) =>
                set({
                  actions: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="resource-scopes">Scope kinds</Label>
            <Input
              id="resource-scopes"
              value={draft.scopeKinds.join(", ")}
              onChange={(event) =>
                set({
                  scopeKinds: parseScopeKinds(event.target.value),
                })
              }
            />
          </div>
        </div>
      ) : null}

      {draft.kind === "assignment" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="security-subject">Subject ID</Label>
            <Input
              id="security-subject"
              value={draft.subjectId}
              onChange={(event) =>
                set({
                  subjectId: event.target.value.trim(),
                  title: `${event.target.value.trim()} assignment`,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={draft.roleId}
              onValueChange={(value) => set({ roleId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Scope</Label>
            <Select
              value={draft.scopeKind}
              onValueChange={(value) =>
                set({ scopeKind: value as typeof draft.scopeKind })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="orgUnit">Org unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-scope-id">Scope ID</Label>
            <Input
              id="security-scope-id"
              value={draft.scopeId ?? ""}
              disabled={
                draft.scopeKind === "system" || draft.scopeKind === "global"
              }
              onChange={(event) => set({ scopeId: event.target.value.trim() })}
            />
          </div>
        </div>
      ) : null}

      {draft.kind === "identity-group" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="provider-group">Provider group</Label>
            <Input
              id="provider-group"
              value={draft.providerGroup}
              onChange={(event) =>
                set({
                  providerGroup: event.target.value,
                  title: event.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>CloudIgniter role</Label>
            <Select
              value={draft.roleId}
              onValueChange={(value) => set({ roleId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {draft.kind !== "assignment" && draft.kind !== "identity-group" ? (
        <div className="grid gap-2">
          <Label htmlFor="security-description">Description</Label>
          <Textarea
            id="security-description"
            value={draft.description ?? ""}
            onChange={(event) => set({ description: event.target.value })}
          />
        </div>
      ) : null}

      {draft.origin === "core" ? (
        <div className="grid gap-2">
          <Label htmlFor="security-reason">Override reason</Label>
          <Textarea
            id="security-reason"
            required
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Explain why this protected core entry must change."
          />
          <p className="text-xs text-muted-foreground">
            Core changes require system super administrator access and an
            auditable reason.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Data-table-based administration surface shared across all ARBAC aspects. */
export function CiSecurityDataPage({
  kind,
  title,
  description,
  records,
  capabilities,
  providerLabel,
  roleOptions,
  resourceOptions,
  onSave,
  onDelete,
}: CiSecurityDataPageProps) {
  const [draft, setDraft] = useState<CiSecurityRecord | null>(null);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const canManage =
    kind === "assignment"
      ? capabilities.canManageAssignments
      : capabilities.canManageApplication;
  const columns = useMemo(() => buildSecurityColumns(kind), [kind]);

  const definition = useMemo(
    () =>
      ciDefineDataTable<CiSecurityRecord>({
        getRowId: (record) =>
          record.kind === "permission"
            ? `${record.kind}:${record.roleId}:${record.id}`
            : `${record.kind}:${record.id}`,
        columns,
        information: {
          mode: "dialog",
          label: "View details",
          title: (record) => record.title || humanizeIdentifier(record.id),
          description: (record) => getRecordSummary(record),
          content: (record) => (
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs leading-5">
              {JSON.stringify(record, null, 2)}
            </pre>
          ),
        },
        filters: [
          {
            id: "origin",
            label: "Owner",
            allLabel: "All owners",
            options: [
              { id: "core", label: "Core" },
              { id: "application", label: "Application" },
              { id: "provider", label: "Provider" },
            ],
          },
        ],
        rowActions: [
          {
            id: "edit",
            label: "Edit",
            icon: <Pencil />,
            display: "icon",
            disableWhen: (record) =>
              !canManage ||
              (record.origin === "core" && !capabilities.canManageCore),
            onSelect: (record) => {
              setFeedback(null);
              setReason("");
              setDraft(record);
            },
          },
          {
            id: "delete",
            label: "Delete",
            icon: <Trash2 />,
            variant: "destructive",
            hideWhen: (record) => record.origin === "core" || !onDelete,
            disableWhen: () => !canManage,
            onSelect: (record) => {
              if (
                !onDelete ||
                !window.confirm(`Delete ${record.title || record.id}?`)
              )
                return;
              startTransition(async () => setFeedback(await onDelete(record)));
            },
          },
        ],
        globalActions:
          onSave && canManage
            ? [
                {
                  id: "create",
                  label: `New ${kind.replace("identity-", "")}`,
                  icon: <Plus />,
                  selection: "none",
                  onSelect: () => {
                    setFeedback(null);
                    setReason("");
                    setDraft(createSecurityDraft(kind));
                  },
                },
              ]
            : [],
      }),
    [canManage, capabilities.canManageCore, columns, kind, onDelete, onSave]
  );

  const config: CiDataTableConfig<CiSecurityRecord> = {
    formats: [
      { id: "table", label: "Table" },
      { id: "compact", label: "Compact" },
      { id: "cards", label: "Cards" },
    ],
    sorting: {
      initial: [{ id: kind === "role" ? "precedence" : "title", desc: false }],
    },
    pagination: {
      pageSize: 25,
      pageSizeOptions: [10, 25, 50, 100],
      allowAll: true,
    },
    rowActions: { mode: "mixed", inlineCount: 1 },
    selection: { enabled: false },
    persistence: {
      key: `ci-security-${kind}`,
      columnWidths: true,
      filters: true,
      pageSize: true,
      format: true,
    },
    excelExport: {
      fileName: `cloudigniter-${kind}.xlsx`,
      sheetName: title.slice(0, 31),
      scope: "all-filtered",
    },
  };

  /** Saves the current draft through the injected application adapter. */
  const saveDraft = () => {
    if (!draft || !onSave) return;
    startTransition(async () => {
      const result = await onSave(draft, reason || undefined);
      setFeedback(result);
      if (result.ok) setDraft(null);
    });
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-1 sm:px-2">
      <header className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm dark:bg-primary/10 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <ShieldCheck className="size-4" /> Access governance
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{records.length} records</Badge>
          {providerLabel ? (
            <Badge variant="secondary">{providerLabel}</Badge>
          ) : null}
          <Badge variant={canManage ? "default" : "secondary"}>
            {canManage ? "Management enabled" : "Read only"}
          </Badge>
        </div>
      </header>

      {feedback ? (
        <Alert variant={feedback.ok ? "default" : "destructive"}>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}
      {!capabilities.canManageCore ? (
        <Alert>
          <LockKeyhole className="size-4" />
          <AlertDescription>
            Platform-owned entries are protected. Only a directly assigned
            system super administrator can override core roles and permissions.
          </AlertDescription>
        </Alert>
      ) : null}

      <CiDataTable
        definition={definition}
        data={records}
        config={config}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        loading={isPending}
      />

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setDraft(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {draft?.id.startsWith("new-") ? "Create" : "Edit"}{" "}
              {kind.replace("identity-", "")}
            </DialogTitle>
            <DialogDescription>
              Changes are validated by the application adapter before the
              effective policy is updated.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <CiSecurityRecordEditor
              draft={draft}
              reason={reason}
              roleOptions={roleOptions}
              resourceOptions={resourceOptions}
              onChange={setDraft}
              onReasonChange={setReason}
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={isPending}
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11"
              disabled={
                isPending ||
                !onSave ||
                !isSecurityDraftComplete(draft) ||
                Boolean(draft?.origin === "core" && !reason.trim())
              }
              onClick={saveDraft}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
