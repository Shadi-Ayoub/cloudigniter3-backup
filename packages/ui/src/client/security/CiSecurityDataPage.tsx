"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CirclePause,
  CirclePlay,
  FolderTree,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  CiAlert,
  CiAlertDialog,
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
  ciNormalizeClientThrownError,
  ciDefineDataTable,
} from "@ci-ui/client";
import type {
  CiDataTableColumnDef,
  CiDataTableConfig,
  CiSecurityDataPageProps,
} from "@ci-ui/types";
import {
  CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN,
  ciIsAccessControlKebabIdentifier,
} from "@cloudigniter/core/lib";
import type {
  CiAccessScopeKind,
  CiResourceStatus,
  CiRoleStatus,
  CiSecurityRecord,
  CiSecurityRecordKind,
  CiSecurityResourceRecord,
  CiSecurityRoleRecord,
} from "@cloudigniter/core/types";
import { CiSearchableChipMultiSelect } from "../components/searchable-chip-multi-select";
import { CiResourceDomainsDialog } from "./CiResourceDomainsDialog";
import {
  ciIsSecurityIdentifierLocked,
  ciIsSecurityIdentifierInputAllowed,
  ciUpdateSecurityEditorSessionDraft,
  type CiSecurityEditorSession,
} from "./ci-security-editor-session";
import { ciGetAvailableInheritedRoleOptions } from "./ci-security-role-options";

/** Converts a machine identifier into a readable fallback label. */
function humanizeIdentifier(value: string): string {
  return value
    .replaceAll(/[._-]+/g, " ")
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Formats a count with a readable singular or plural label. */
function formatCount(count: number, singularLabel: string): string {
  return `${count} ${singularLabel}${count === 1 ? "" : "s"}`;
}

const ACCESS_SCOPE_KIND_OPTIONS: ReadonlyArray<{
  id: CiAccessScopeKind;
  label: string;
}> = [
  { id: "system", label: "System" },
  { id: "global", label: "Global" },
  { id: "tenant", label: "Tenant" },
  { id: "orgUnit", label: "Org unit" },
];

const OTHER_ACTION_VALUE = "__other_action__";
const PROTECTED_RECOVERY_RESOURCE_IDS = new Set([
  "platform.authorization",
  "platform.authorization.core",
]);

/** Common action verbs provide consistent defaults across resource catalogs. */
const COMMON_ACTION_OPTIONS = [
  "approve",
  "archive",
  "assign",
  "cancel",
  "create",
  "delete",
  "download",
  "execute",
  "export",
  "get",
  "import",
  "invite",
  "list",
  "manage",
  "publish",
  "read",
  "restore",
  "search",
  "share",
  "submit",
  "update",
  "upload",
  "view",
  "write",
] as const;

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
        inherits: ["user"],
        privileges: [],
        permissionCount: 0,
        directUserCount: 0,
        inheritedUserCount: 0,
        status: "active",
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
        status: "active",
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
      return `${formatCount(
        record.permissionCount,
        "permission"
      )} · ${formatCount(
        record.directUserCount,
        "direct user"
      )} · ${formatCount(record.inheritedUserCount, "user")} via inheritance`;
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
      return Boolean(
        record.id.trim() &&
          record.title.trim() &&
          (record.origin !== "application" ||
            ciIsAccessControlKebabIdentifier(record.id))
      );
    case "permission":
      return Boolean(
        record.id.trim() &&
          (record.origin !== "application" ||
            ciIsAccessControlKebabIdentifier(record.id)) &&
          record.title.trim() &&
          record.roleId.trim() &&
          record.resource.trim() &&
          ciIsAccessControlKebabIdentifier(record.action) &&
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
  };

  const summary: CiDataTableColumnDef<CiSecurityRecord, unknown> = {
    id: "summary",
    header: "Details",
    accessorFn: (record) => getRecordSummary(record),
    cell: ({ row }) => {
      const record = row.original;
      if (record.kind !== "role") return getRecordSummary(record);

      return (
        <div className="grid min-w-44 gap-1 text-sm leading-5">
          <div>{formatCount(record.permissionCount, "permission")}</div>
          <div>{formatCount(record.directUserCount, "direct user")}</div>
          <div>
            {formatCount(record.inheritedUserCount, "user")} via inheritance
          </div>
        </div>
      );
    },
    meta: { ciDataTable: { truncate: { maxWidth: 440, showTitle: true } } },
  };

  const aspectColumns: CiDataTableColumnDef<CiSecurityRecord, unknown>[] = [];
  if (kind === "role") {
    aspectColumns.push(
      {
        id: "status",
        accessorFn: (row) => (row.kind === "role" ? row.status : ""),
        header: "Status",
        cell: ({ row }) => {
          const status =
            row.original.kind === "role"
              ? row.original.status ?? "active"
              : "active";
          return (
            <Badge
              variant="outline"
              className={
                status === "active"
                  ? "border-success-border bg-success-surface text-success-surface-foreground"
                  : "border-warning-border bg-warning-surface text-warning-surface-foreground"
              }
            >
              {status === "active" ? "Active" : "Suspended"}
            </Badge>
          );
        },
      },
      {
        id: "precedence",
        accessorFn: (row) => (row.kind === "role" ? row.precedence : 0),
        header: "Precedence",
        meta: {
          ciDataTable: {
            className: "font-medium tabular-nums",
          },
        },
      }
    );
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
    aspectColumns.push(
      {
        id: "domainId",
        accessorFn: (row) => (row.kind === "resource" ? row.domainId : ""),
        header: "Domain",
      },
      {
        id: "status",
        accessorFn: (row) => (row.kind === "resource" ? row.status : ""),
        header: "Status",
        cell: ({ row }) => {
          const status =
            row.original.kind === "resource"
              ? row.original.status ?? "active"
              : "active";
          return (
            <Badge
              variant="outline"
              className={
                status === "active"
                  ? "border-success-border bg-success-surface text-success-surface-foreground"
                  : "border-warning-border bg-warning-surface text-warning-surface-foreground"
              }
            >
              {status === "active" ? "Active" : "Suspended"}
            </Badge>
          );
        },
      }
    );
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
  privilegeOptions = [],
  resourceOptions = [],
  resourceDomains = [],
  isExisting,
  onChange,
  onReasonChange,
}: {
  draft: CiSecurityRecord;
  reason: string;
  roleOptions?: CiSecurityDataPageProps["roleOptions"];
  privilegeOptions?: CiSecurityDataPageProps["privilegeOptions"];
  resourceOptions?: CiSecurityDataPageProps["resourceOptions"];
  resourceDomains?: CiSecurityDataPageProps["resourceDomains"];
  isExisting: boolean;
  onChange: (next: CiSecurityRecord) => void;
  onReasonChange: (next: string) => void;
}) {
  const [identifierVisited, setIdentifierVisited] = useState(false);
  const [identifierEntryError, setIdentifierEntryError] = useState<
    string | null
  >(null);
  const [isCustomActionSelected, setIsCustomActionSelected] = useState(false);
  const [actionEntryError, setActionEntryError] = useState<string | null>(null);
  const set = (values: Partial<CiSecurityRecord>) =>
    onChange({ ...draft, ...values } as CiSecurityRecord);
  const availableInheritedRoleOptions = useMemo(
    () =>
      draft.kind === "role"
        ? ciGetAvailableInheritedRoleOptions(
            draft.id,
            draft.inherits,
            roleOptions
          )
        : [],
    [draft, roleOptions]
  );
  const availablePrivilegeOptions = useMemo(() => {
    if (draft.kind !== "role") return [];
    const selectedPrivilegeIds = new Set(
      draft.privileges.map((privilege) => privilege.id)
    );
    return privilegeOptions.filter(
      (option) => !selectedPrivilegeIds.has(option.privilege.id)
    );
  }, [draft, privilegeOptions]);
  const editableKebabIdentifier =
    !isExisting &&
    draft.origin === "application" &&
    (draft.kind === "role" || draft.kind === "permission");
  const displayedIdentifier = draft.id.startsWith("new-") ? "" : draft.id;
  const identifierFormatError =
    identifierVisited &&
    editableKebabIdentifier &&
    displayedIdentifier.length > 0 &&
    !ciIsAccessControlKebabIdentifier(displayedIdentifier)
      ? "Start with a lowercase letter and use only lowercase letters, digits, and single hyphens."
      : null;
  const identifierError = identifierEntryError ?? identifierFormatError;
  const actionOptions = useMemo(() => {
    if (draft.kind !== "permission") return [];
    const resource = resourceOptions.find(
      (option) => option.id === draft.resource
    );
    const actions = [...COMMON_ACTION_OPTIONS, ...(resource?.actions ?? [])];
    // Retain a legacy wildcard while editing an existing permission, but do not
    // offer it for new permissions.
    if (draft.action === "*" && !actions.includes("*")) actions.push("*");
    return [...new Set(actions)].sort((left, right) =>
      left.localeCompare(right)
    );
  }, [draft, resourceOptions]);
  const actionIsKnown =
    draft.kind === "permission" && actionOptions.includes(draft.action);
  const actionIsCustom =
    draft.kind === "permission" &&
    !actionIsKnown &&
    (isCustomActionSelected || (isExisting && draft.action.length > 0));
  const actionFormatError =
    draft.kind === "permission" &&
    actionIsCustom &&
    draft.action.length > 0 &&
    !ciIsAccessControlKebabIdentifier(draft.action)
      ? "Start with a lowercase letter and use only lowercase letters, digits, and single hyphens."
      : null;
  const actionError = actionEntryError ?? actionFormatError;

  const updateIdentifier = (value: string) => {
    if (editableKebabIdentifier && !ciIsSecurityIdentifierInputAllowed(value)) {
      setIdentifierVisited(true);
      setIdentifierEntryError(
        "That character is not allowed. Start with a lowercase letter and use only lowercase letters, digits, and single hyphens."
      );
      return;
    }

    setIdentifierEntryError(null);
    set({ id: value });
  };

  return (
    <div className="grid gap-5 py-2 [&_button[role=combobox]]:min-h-11 [&_input]:min-h-11 [&_textarea]:min-h-24">
      <div className="grid gap-2">
        <Label htmlFor="security-id">Stable identifier</Label>
        <Input
          id="security-id"
          value={displayedIdentifier}
          disabled={isExisting}
          pattern={
            editableKebabIdentifier
              ? CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN
              : undefined
          }
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={identifierError ? true : undefined}
          aria-describedby="security-id-guidance"
          onChange={(event) => updateIdentifier(event.target.value)}
          onBlur={() => setIdentifierVisited(true)}
          placeholder="lowercase-stable-id"
        />
        <p
          id="security-id-guidance"
          className={
            identifierError
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
          role={identifierError ? "alert" : undefined}
        >
          {identifierError ??
            (editableKebabIdentifier
              ? "Use lowercase kebab case, beginning with a letter—for example, invoice-approver or reviewer2. IDs cannot be renamed later."
              : "Identifiers are referenced by assignments and audit records and cannot be renamed later.")}
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
        <div className="grid gap-5">
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
            <Label htmlFor="security-inherits-search">Inherited roles</Label>
            <CiSearchableChipMultiSelect
              id="security-inherits-search"
              label="Inherited roles"
              placeholder="Select inherited roles…"
              showAllOptions
              options={availableInheritedRoleOptions.map((option) => ({
                id: option.id,
                label: option.label,
                description:
                  option.inherits.length > 0
                    ? `Directly inherits ${option.inherits.join(", ")}`
                    : "No inherited roles",
              }))}
              selectedItems={draft.inherits.map((roleId) => ({
                id: roleId,
                label:
                  roleOptions.find((option) => option.id === roleId)?.label ??
                  roleId,
              }))}
              emptyMessage="No cycle-safe roles match this search."
              onAdd={(option) =>
                set({ inherits: [...draft.inherits, option.id] })
              }
              onRemove={(roleId) =>
                set({
                  inherits: draft.inherits.filter((id) => id !== roleId),
                })
              }
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Only direct inheritance is shown as chips. Roles that already
              inherit this role are excluded to prevent cycles.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="security-privileges-search">Privileges</Label>
            <CiSearchableChipMultiSelect
              id="security-privileges-search"
              label="Privileges"
              placeholder="Select privileges…"
              showAllOptions
              options={availablePrivilegeOptions}
              selectedItems={draft.privileges.map((privilege) => ({
                id: privilege.id,
                label: privilege.title,
              }))}
              emptyMessage="No unselected privileges match this search."
              onAdd={(option) => {
                const selected = privilegeOptions.find(
                  (candidate) => candidate.id === option.id
                );
                if (!selected) return;
                const privileges = [
                  ...draft.privileges,
                  {
                    ...selected.privilege,
                    scopeKinds: [...selected.privilege.scopeKinds],
                  },
                ];
                set({ privileges, permissionCount: privileges.length });
              }}
              onRemove={(privilegeId) => {
                const privileges = draft.privileges.filter(
                  (privilege) => privilege.id !== privilegeId
                );
                set({ privileges, permissionCount: privileges.length });
              }}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Selecting an existing privilege copies its complete policy
              statement into this role. Remove a chip to detach it.
            </p>
          </div>
        </div>
      ) : null}

      {draft.kind === "permission" ? (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)]">
            <div className="grid min-w-0 gap-2">
            <Label>Role</Label>
            <Select
              value={draft.roleId}
              disabled={isExisting}
              onValueChange={(value) => set({ roleId: value })}
            >
              <SelectTrigger className="w-full min-w-0">
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Resource</Label>
            <Select
              value={draft.resource}
              onValueChange={(value) => {
                const nextActions = [
                  ...COMMON_ACTION_OPTIONS,
                  ...(resourceOptions.find((option) => option.id === value)
                    ?.actions ?? []),
                ].sort((left, right) => left.localeCompare(right));
                set({
                  resource: value,
                  action:
                    draft.action === "*" || nextActions?.includes(draft.action)
                      ? draft.action
                      : (nextActions?.[0] ?? ""),
                });
                setIsCustomActionSelected(false);
                setActionEntryError(null);
              }}
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
            <Label>Action</Label>
            <Select
              value={
                actionIsKnown
                  ? draft.action
                  : actionIsCustom
                    ? OTHER_ACTION_VALUE
                    : ""
              }
              onValueChange={(value) => {
                const isOther = value === OTHER_ACTION_VALUE;
                setIsCustomActionSelected(isOther);
                setActionEntryError(null);
                set({ action: isOther ? "" : value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_ACTION_VALUE}>Other</SelectItem>
              </SelectContent>
            </Select>
            {actionIsCustom ? (
              <>
                <Input
                  id="security-action"
                  value={draft.action}
                  pattern={CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={actionError ? true : undefined}
                  aria-describedby="security-action-guidance"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!ciIsSecurityIdentifierInputAllowed(value)) {
                      setActionEntryError(
                        "That character is not allowed. Start with a lowercase letter and use only lowercase letters, digits, and single hyphens."
                      );
                      return;
                    }
                    setActionEntryError(null);
                    set({ action: value });
                  }}
                  placeholder="new-action"
                />
                <p
                  id="security-action-guidance"
                  className={
                    actionError
                      ? "text-xs text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                  role={actionError ? "alert" : undefined}
                >
                  {actionError ??
                    "Use lowercase kebab case, beginning with a letter—for example, export-report."}
                </p>
              </>
            ) : null}
          </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="security-scopes">Permitted scope kinds</Label>
            <CiSearchableChipMultiSelect
              id="security-scopes"
              label="Permitted scope kinds"
              placeholder="Select a scope kind…"
              showAllOptions
              options={ACCESS_SCOPE_KIND_OPTIONS.filter(
                (option) => !draft.scopeKinds.includes(option.id)
              )}
              selectedItems={draft.scopeKinds.map((scopeKind) => ({
                id: scopeKind,
                label:
                  ACCESS_SCOPE_KIND_OPTIONS.find(
                    (option) => option.id === scopeKind
                  )?.label ?? scopeKind,
              }))}
              emptyMessage="All supported scope kinds are selected."
              onAdd={(option) =>
                set({
                  scopeKinds: [...draft.scopeKinds, option.id as CiAccessScopeKind],
                })
              }
              onRemove={(scopeKind) =>
                set({
                  scopeKinds: draft.scopeKinds.filter(
                    (item) => item !== scopeKind
                  ),
                })
              }
            />
          </div>
        </div>
      ) : null}

      {draft.kind === "resource" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="security-domain">Domain</Label>
            <Select
              value={draft.domainId}
              onValueChange={(value) => set({ domainId: value })}
            >
              <SelectTrigger id="security-domain" className="w-full min-w-0">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {resourceDomains.map((domain) => (
                  <SelectItem
                    key={domain.id}
                    value={domain.id}
                    disabled={
                      domain.status === "suspended" &&
                      draft.domainId !== domain.id
                    }
                  >
                    {domain.title} ({domain.id})
                    {domain.status === "suspended" ? " — suspended" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Suspended domains cannot accept new resources.
            </p>
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
            <CiSearchableChipMultiSelect
              id="resource-scopes"
              label="Scope kinds"
              placeholder="Select a scope kind…"
              showAllOptions
              options={ACCESS_SCOPE_KIND_OPTIONS.filter(
                (option) => !draft.scopeKinds.includes(option.id)
              )}
              selectedItems={draft.scopeKinds.map((scopeKind) => ({
                id: scopeKind,
                label:
                  ACCESS_SCOPE_KIND_OPTIONS.find(
                    (option) => option.id === scopeKind
                  )?.label ?? scopeKind,
              }))}
              emptyMessage="All supported scope kinds are selected."
              onAdd={(option) =>
                set({
                  scopeKinds: [...draft.scopeKinds, option.id as CiAccessScopeKind],
                })
              }
              onRemove={(scopeKind) =>
                set({
                  scopeKinds: draft.scopeKinds.filter(
                    (item) => item !== scopeKind
                  ),
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
  privilegeOptions,
  resourceOptions,
  resourceDomains,
  onSave,
  onDelete,
  onSetRoleStatus,
  onCreateResourceDomain,
  onSetResourceDomainStatus,
  onSetResourceStatus,
}: CiSecurityDataPageProps) {
  const [editorSession, setEditorSession] =
    useState<CiSecurityEditorSession | null>(null);
  const draft = editorSession?.draft ?? null;
  const isExisting = editorSession
    ? ciIsSecurityIdentifierLocked(editorSession)
    : false;
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [editorFeedback, setEditorFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CiSecurityRecord | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleStatusTarget, setRoleStatusTarget] =
    useState<CiSecurityRoleRecord | null>(null);
  const [nextRoleStatus, setNextRoleStatus] =
    useState<CiRoleStatus>("suspended");
  const [roleStatusReason, setRoleStatusReason] = useState("");
  const [roleStatusDialogOpen, setRoleStatusDialogOpen] = useState(false);
  const [isChangingRoleStatus, setIsChangingRoleStatus] = useState(false);
  const [resourceStatusTarget, setResourceStatusTarget] =
    useState<CiSecurityResourceRecord | null>(null);
  const [nextResourceStatus, setNextResourceStatus] =
    useState<CiResourceStatus>("suspended");
  const [resourceStatusReason, setResourceStatusReason] = useState("");
  const [resourceStatusDialogOpen, setResourceStatusDialogOpen] =
    useState(false);
  const [isChangingResourceStatus, setIsChangingResourceStatus] =
    useState(false);
  const [resourceDomainsDialogOpen, setResourceDomainsDialogOpen] =
    useState(false);
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
          description: (record) => record.description,
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
                    setEditorFeedback(null);
                    setReason("");
                    setEditorSession({ mode: "edit", draft: record });
            },
          },
          {
            id: "suspend-role",
            label: "Suspend role",
            icon: <CirclePause />,
            variant: "destructive",
            hideWhen: (record) =>
              !onSetRoleStatus ||
              record.kind !== "role" ||
              (record.status ?? "active") === "suspended" ||
              record.id === "system-super-admin",
            disableWhen: (record) =>
              !canManage ||
              (record.origin === "core" && !capabilities.canManageCore),
            onSelect: (record) => {
              if (record.kind !== "role" || !onSetRoleStatus) return;
              setFeedback(null);
              setRoleStatusReason("");
              setRoleStatusTarget(record);
              setNextRoleStatus("suspended");
              setRoleStatusDialogOpen(true);
            },
          },
          {
            id: "suspend-resource",
            label: "Suspend resource",
            icon: <CirclePause />,
            variant: "destructive",
            hideWhen: (record) =>
              (!onSetResourceStatus && !onSave) ||
              record.kind !== "resource" ||
              (record.status ?? "active") === "suspended",
            disableWhen: (record) =>
              !canManage ||
              PROTECTED_RECOVERY_RESOURCE_IDS.has(record.id) ||
              (record.origin === "core" && !capabilities.canManageCore),
            onSelect: (record) => {
              if (
                record.kind !== "resource" ||
                (!onSetResourceStatus && !onSave)
              )
                return;
              setFeedback(null);
              setResourceStatusReason("");
              setResourceStatusTarget(record);
              setNextResourceStatus("suspended");
              setResourceStatusDialogOpen(true);
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
              if (!onDelete) return;
              setFeedback(null);
              setDeleteTarget(record);
              setDeleteDialogOpen(true);
            },
          },
          {
            id: "restore-role",
            label: "Restore role",
            icon: <CirclePlay />,
            hideWhen: (record) =>
              !onSetRoleStatus ||
              record.kind !== "role" ||
              (record.status ?? "active") !== "suspended",
            disableWhen: (record) =>
              !canManage ||
              (record.origin === "core" && !capabilities.canManageCore),
            onSelect: (record) => {
              if (record.kind !== "role" || !onSetRoleStatus) return;
              setFeedback(null);
              setRoleStatusReason("");
              setRoleStatusTarget(record);
              setNextRoleStatus("active");
              setRoleStatusDialogOpen(true);
            },
          },
          {
            id: "restore-resource",
            label: "Restore resource",
            icon: <CirclePlay />,
            hideWhen: (record) =>
              (!onSetResourceStatus && !onSave) ||
              record.kind !== "resource" ||
              (record.status ?? "active") !== "suspended",
            disableWhen: (record) =>
              !canManage ||
              (record.origin === "core" && !capabilities.canManageCore),
            onSelect: (record) => {
              if (
                record.kind !== "resource" ||
                (!onSetResourceStatus && !onSave)
              )
                return;
              setFeedback(null);
              setResourceStatusReason("");
              setResourceStatusTarget(record);
              setNextResourceStatus("active");
              setResourceStatusDialogOpen(true);
            },
          },
        ],
        globalActions: [
          ...(kind === "resource" && resourceDomains
            ? [
                {
                  id: "manage-resource-domains",
                  label: "Resource domains",
                  icon: <FolderTree />,
                  selection: "none" as const,
                  onSelect: () => {
                    setFeedback(null);
                    setResourceDomainsDialogOpen(true);
                  },
                },
              ]
            : []),
          ...(onSave && canManage
            ? [
                {
                  id: "create",
                  label: `New ${kind.replace("identity-", "")}`,
                  icon: <Plus />,
                  selection: "none" as const,
                  onSelect: () => {
                    setFeedback(null);
                    setEditorFeedback(null);
                    setReason("");
                    setEditorSession({
                      mode: "create",
                      draft: createSecurityDraft(kind),
                    });
                  },
                },
              ]
            : []),
        ],
      }),
    [
      canManage,
      capabilities.canManageCore,
      columns,
      kind,
      onDelete,
      onSave,
      onSetRoleStatus,
      onSetResourceStatus,
      resourceDomains,
    ]
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
    rowActions: { mode: "mixed", overflow: 1, reserveSpace: true },
    selection: { enabled: false },
    persistence: {
      key: kind === "resource" ? "ci-security-resource-v2" : `ci-security-${kind}`,
      columnWidths: true,
      // Security administration should always reopen with the complete catalog.
      // Persisted owner/search filters can otherwise make a successful create
      // look as though it disappeared after the route refreshes.
      filters: false,
      pageSize: true,
      format: true,
    },
    labels: {
      loading: `Loading ${title.toLowerCase()}. Please wait...`,
      noResults: `No ${title.toLowerCase()} match the current view.`,
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
      setEditorFeedback(result);
      if (result.ok) setEditorSession(null);
    });
  };

  /** Deletes the selected record after acknowledgement in the alert dialog. */
  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;

    setIsDeleting(true);
    try {
      setFeedback(await onDelete(deleteTarget));
    } finally {
      setIsDeleting(false);
    }
  };

  /** Applies a reasoned suspension or restoration through the server adapter. */
  const confirmRoleStatusChange = async () => {
    if (!roleStatusTarget || !onSetRoleStatus) return;

    setIsChangingRoleStatus(true);
    try {
      const result = await onSetRoleStatus(
        roleStatusTarget.id,
        nextRoleStatus,
        roleStatusReason.trim()
      );
      if (!result.ok) throw new Error(result.message);
      setFeedback(result);
    } finally {
      setIsChangingRoleStatus(false);
    }
  };

  /** Applies a reasoned resource suspension or restoration. */
  const confirmResourceStatusChange = async () => {
    if (!resourceStatusTarget || (!onSetResourceStatus && !onSave)) return;

    setIsChangingResourceStatus(true);
    try {
      const result = onSetResourceStatus
        ? await onSetResourceStatus(
            resourceStatusTarget.id,
            nextResourceStatus,
            resourceStatusReason.trim()
          )
        : await onSave!(
            { ...resourceStatusTarget, status: nextResourceStatus },
            resourceStatusReason.trim()
          );
      if (!result.ok) throw new Error(result.message);
      setFeedback(result);
    } finally {
      setIsChangingResourceStatus(false);
    }
  };

  return (
    <main className="w-full space-y-4">
      {feedback ? (
        <CiAlert
          variant={feedback.ok ? "success" : "error"}
          title={feedback.ok ? "Success" : "Action failed"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </CiAlert>
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
        title={title}
        description={description}
        titleBadge="Access governance"
        titleIcon={<ShieldCheck aria-hidden />}
        titleChips={[
          {
            id: "records",
            label: `${records.length} ${
              records.length === 1 ? "record" : "records"
            }`,
          },
          ...(providerLabel
            ? [
                {
                  id: "provider",
                  label: providerLabel,
                  variant: "secondary" as const,
                },
              ]
            : []),
          {
            id: "management",
            label: canManage ? "Management enabled" : "Read only",
            variant: canManage ? "default" : "secondary",
          },
        ]}
        definition={definition}
        data={records}
        config={config}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        loading={
          isPending ||
          isDeleting ||
          isChangingRoleStatus ||
          isChangingResourceStatus
        }
      />

      <CiAlertDialog
        open={roleStatusDialogOpen}
        onOpenChange={(open) => {
          if (!isChangingRoleStatus) setRoleStatusDialogOpen(open);
        }}
        variant={nextRoleStatus === "suspended" ? "destructive" : "default"}
        icon={
          nextRoleStatus === "suspended" ? (
            <CirclePause aria-hidden />
          ) : (
            <CirclePlay aria-hidden />
          )
        }
        title={`${
          nextRoleStatus === "suspended" ? "Suspend" : "Restore"
        } role “${roleStatusTarget?.title ?? roleStatusTarget?.id ?? ""}”?`}
        description={
          nextRoleStatus === "suspended"
            ? "The role will immediately stop granting access, including privileges reached through its inheritance path. Assignments and policy configuration remain intact for investigation and later restoration."
            : "The role will immediately resume granting its configured privileges through existing assignments and inheritance paths."
        }
        confirmLabel={
          nextRoleStatus === "suspended" ? "Suspend role" : "Restore role"
        }
        pendingLabel={
          nextRoleStatus === "suspended"
            ? "Suspending role…"
            : "Restoring role…"
        }
        confirmDisabled={!roleStatusReason.trim()}
        pending={isChangingRoleStatus}
        onConfirm={confirmRoleStatusChange}
        onConfirmError={(error) => {
          setFeedback({
            ok: false,
            message: ciNormalizeClientThrownError(error).message,
          });
        }}
      >
        <div className="grid gap-2">
          {roleStatusTarget?.id === capabilities.actorRole &&
          nextRoleStatus === "suspended" ? (
            <p className="rounded-lg border border-warning-border bg-warning-surface p-3 text-warning-surface-foreground">
              This is your primary role. Suspending it may remove your access on
              the next authorization check.
            </p>
          ) : null}
          <Label htmlFor="role-status-reason">Reason</Label>
          <Textarea
            id="role-status-reason"
            required
            value={roleStatusReason}
            onChange={(event) => setRoleStatusReason(event.target.value)}
            placeholder="Reference the incident, investigation, or approval for this change."
          />
          <p className="text-xs text-muted-foreground">
            The actor, timestamp, and this reason are stored with the latest
            role status change.
          </p>
        </div>
      </CiAlertDialog>

      <CiAlertDialog
        open={resourceStatusDialogOpen}
        onOpenChange={(open) => {
          if (!isChangingResourceStatus) setResourceStatusDialogOpen(open);
        }}
        variant={nextResourceStatus === "suspended" ? "destructive" : "default"}
        icon={
          nextResourceStatus === "suspended" ? (
            <CirclePause aria-hidden />
          ) : (
            <CirclePlay aria-hidden />
          )
        }
        title={`${
          nextResourceStatus === "suspended" ? "Suspend" : "Restore"
        } resource “${
          resourceStatusTarget?.title ?? resourceStatusTarget?.id ?? ""
        }”?`}
        description={
          nextResourceStatus === "suspended"
            ? "Every authorization request for this resource will be denied immediately. Its actions, privileges, domain relationship, and catalog record remain intact for restoration."
            : "This resource will resume authorization checks unless its parent domain is still suspended."
        }
        confirmLabel={
          nextResourceStatus === "suspended"
            ? "Suspend resource"
            : "Restore resource"
        }
        pendingLabel={
          nextResourceStatus === "suspended"
            ? "Suspending resource…"
            : "Restoring resource…"
        }
        confirmDisabled={!resourceStatusReason.trim()}
        pending={isChangingResourceStatus}
        onConfirm={confirmResourceStatusChange}
        onConfirmError={(error) => {
          setFeedback({
            ok: false,
            message: ciNormalizeClientThrownError(error).message,
          });
        }}
      >
        <div className="grid gap-2">
          {nextResourceStatus === "active" &&
          resourceDomains?.find(
            (domain) => domain.id === resourceStatusTarget?.domainId
          )?.status === "suspended" ? (
            <p className="rounded-lg border border-warning-border bg-warning-surface p-3 text-warning-surface-foreground">
              The parent domain is suspended. Restoring this resource preserves
              its active state, but access remains denied until the domain is
              restored.
            </p>
          ) : null}
          <Label htmlFor="resource-status-reason">Reason</Label>
          <Textarea
            id="resource-status-reason"
            required
            value={resourceStatusReason}
            onChange={(event) => setResourceStatusReason(event.target.value)}
            placeholder="Reference the incident, investigation, or approval for this change."
          />
          <p className="text-xs text-muted-foreground">
            The actor, timestamp, and this reason are stored with the latest
            resource status change.
          </p>
        </div>
      </CiAlertDialog>

      <CiAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setDeleteDialogOpen(open);
        }}
        variant="destructive"
        icon={<Trash2 aria-hidden />}
        title={`Delete ${kind.replace("identity-", "")} “${
          deleteTarget?.title || deleteTarget?.id || "selected record"
        }”?`}
        description={`This permanently removes the ${
          deleteTarget?.origin ?? "application"
        }-owned ${kind.replace("identity-", "")} “${
          deleteTarget?.id ?? ""
        }”. Existing access relationships that reference it may be affected. This action cannot be undone.`}
        confirmLabel={`Delete ${kind.replace("identity-", "")}`}
        pendingLabel={`Deleting ${kind.replace("identity-", "")}…`}
        pending={isDeleting}
        onConfirm={confirmDelete}
        onConfirmError={(error) => {
          setFeedback({
            ok: false,
            message: ciNormalizeClientThrownError(error).message,
          });
          setDeleteDialogOpen(false);
        }}
      />

      <Dialog
        open={editorSession !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setEditorSession(null);
        }}
      >
        <DialogContent
          className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl"
          aria-busy={isPending}
        >
          <DialogHeader>
            <DialogTitle>
              {editorSession?.mode === "create" ? "Create" : "Edit"}{" "}
              {kind.replace("identity-", "")}
            </DialogTitle>
            <DialogDescription>
              Changes are validated by the application adapter before the
              effective policy is updated.
            </DialogDescription>
          </DialogHeader>
          {editorFeedback ? (
            <CiAlert
              variant={editorFeedback.ok ? "success" : "error"}
              title={editorFeedback.ok ? "Success" : "Unable to save changes"}
              onDismiss={() => setEditorFeedback(null)}
            >
              {editorFeedback.message}
            </CiAlert>
          ) : null}
          {draft ? (
            <div className="min-h-0 flex-1 overflow-y-auto pe-1">
              <CiSecurityRecordEditor
                draft={draft}
                reason={reason}
                roleOptions={roleOptions}
                privilegeOptions={privilegeOptions}
                resourceOptions={resourceOptions}
                resourceDomains={resourceDomains}
                isExisting={isExisting}
                onChange={(nextDraft) =>
                  setEditorSession((current) =>
                    current
                      ? ciUpdateSecurityEditorSessionDraft(current, nextDraft)
                      : null
                  )
                }
                onReasonChange={setReason}
              />
            </div>
          ) : null}
          <DialogFooter className="!mx-0 !mb-0 shrink-0">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={isPending}
              onClick={() => setEditorSession(null)}
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
          {isPending ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-background/85 px-6 text-center supports-backdrop-filter:backdrop-blur-[2px]">
              <div
                role="status"
                aria-live="polite"
                className="flex max-w-sm items-center gap-3 rounded-xl border bg-background/95 px-5 py-4 text-sm font-medium text-foreground shadow-lg"
              >
                <RefreshCw
                  className="size-5 shrink-0 animate-spin"
                  aria-hidden
                />
                <span>
                  {editorSession?.mode === "create"
                    ? `Creating the new ${kind.replace(
                        "identity-",
                        ""
                      )}. Please wait...`
                    : `Saving the ${kind.replace(
                        "identity-",
                        ""
                      )}. Please wait...`}
                </span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {kind === "resource" ? (
        <CiResourceDomainsDialog
          open={resourceDomainsDialogOpen}
          onOpenChange={setResourceDomainsDialogOpen}
          domains={resourceDomains ?? []}
          capabilities={capabilities}
          onCreate={onCreateResourceDomain}
          onSetStatus={onSetResourceDomainStatus}
        />
      ) : null}
    </main>
  );
}
