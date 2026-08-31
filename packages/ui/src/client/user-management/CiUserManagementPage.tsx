"use client";

import { useMemo, useState } from "react";
import {
  CirclePause,
  CirclePlay,
  Cloud,
  DatabaseZap,
  Eraser,
  Mail,
  Pencil,
  Plus,
  Trash2,
  UserRoundCheck,
  UserRoundCog,
} from "lucide-react";
import type {
  CICreateUserAssignmentInput,
  CICreateUserInput,
  CIUser,
} from "@cloudigniter/core/types";
import type { CiUserManagementPageProps } from "@ci-ui/types";
import { CiDataTable, ciDefineDataTable } from "../components/data-table";
import {
  CiAlert,
  CiAlertDialog,
  ciNormalizeClientThrownError,
} from "../feedback";
import {
  Badge,
  Button,
  Checkbox,
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
} from "../components/shadcn";

type EditorMode = "create" | "edit";
type StatusAction =
  "activate" | "delete" | "impersonate" | "purge" | "restore" | "suspend";
type AssignmentDraft = {
  id: string;
  roleId: string;
  scopeKind: "system" | "global" | "tenant" | "orgUnit";
  scopeId: string;
  propagation: "exact" | "descendants";
};

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function createAssignment(roleId = "user"): AssignmentDraft {
  return {
    id: crypto.randomUUID(),
    roleId,
    scopeKind: "global",
    scopeId: "",
    propagation: "exact",
  };
}

function toAssignmentInput(
  draft: AssignmentDraft,
): CICreateUserAssignmentInput {
  const scope =
    draft.scopeKind === "system" || draft.scopeKind === "global"
      ? { kind: draft.scopeKind }
      : draft.scopeKind === "tenant"
        ? { kind: "tenant" as const, tenantId: draft.scopeId.trim() }
        : {
            kind: "orgUnit" as const,
            tenantId: draft.scopeId.split(":")[0]?.trim() ?? "",
            orgUnitId: draft.scopeId.split(":")[1]?.trim() ?? "",
          };
  return { roleId: draft.roleId, scope, propagation: draft.propagation };
}

function fromUserAssignment(
  assignment: CIUser["assignments"][number],
): AssignmentDraft {
  const scopeKind = assignment.scope.kind;
  const scopeId =
    scopeKind === "tenant"
      ? assignment.scope.tenantId
      : scopeKind === "orgUnit"
        ? `${assignment.scope.tenantId}:${assignment.scope.orgUnitId}`
        : "";
  return {
    id: assignment.id || crypto.randomUUID(),
    roleId: assignment.roleId,
    scopeKind,
    scopeId,
    propagation: assignment.propagation,
  };
}

/** Reusable user administration table and editor. */
export function CiUserManagementPage({
  mode = "active",
  users,
  providerLabel,
  roleOptions,
  localeOptions,
  timeZoneOptions,
  capabilities,
  onCreate,
  onUpdate,
  onRead,
  onEmail,
  onImpersonate,
  onSetStatus,
  onDelete,
  onRestore,
  onPurge,
  developmentSeeder,
}: CiUserManagementPageProps) {
  const [rows, setRows] = useState(users);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [target, setTarget] = useState<CIUser | null>(null);
  const [action, setAction] = useState<StatusAction | null>(null);
  const [pending, setPending] = useState(false);
  const [seederPending, setSeederPending] = useState(false);
  const [seederCleanupOpen, setSeederCleanupOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [givenName, setGivenName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [locale, setLocale] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [gender, setGender] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLocality, setAddressLocality] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountryCode, setAddressCountryCode] = useState("");
  const [avatarKey, setAvatarKey] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [sendInvitation, setSendInvitation] = useState(true);
  const [extensionsJson, setExtensionsJson] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["user"]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<AssignmentDraft[]>([
    createAssignment(),
  ]);

  const resetEditor = () => {
    setEditorMode(null);
    setTarget(null);
    setEmail("");
    setGivenName("");
    setMiddleName("");
    setFamilyName("");
    setDisplayName("");
    setTitle("");
    setPhoneNumber("");
    setLocale("");
    setTimeZone("");
    setGender("");
    setAddressLine1("");
    setAddressLine2("");
    setAddressLocality("");
    setAddressRegion("");
    setAddressPostalCode("");
    setAddressCountryCode("");
    setAvatarKey("");
    setAvatarUrl("");
    setTemporaryPassword("");
    setSendInvitation(true);
    setExtensionsJson("");
    setSelectedRoles(["user"]);
    setAssignmentDrafts([createAssignment()]);
  };

  const openCreate = () => {
    resetEditor();
    setFeedback(null);
    setEditorMode("create");
  };

  const runSeeder = async (operation: "seed" | "cleanup") => {
    if (!developmentSeeder) return;
    setSeederPending(true);
    setFeedback(null);
    try {
      const result =
        operation === "seed"
          ? await developmentSeeder.onSeed()
          : await developmentSeeder.onCleanup();
      if (!result.ok) {
        throw new Error(
          result.items.find((item) => item.status === "failed")?.message ??
            `User seeder ${operation} failed.`,
        );
      }
      setFeedback({
        ok: true,
        message: `${developmentSeeder.title}: ${result.created} created, ${result.deleted} deleted, ${result.skipped} skipped.`,
      });
      if (operation === "seed") {
        setRows((current) => {
          const byId = new Map(current.map((user) => [user.id, user]));
          for (const user of result.resources ?? []) byId.set(user.id, user);
          return [...byId.values()];
        });
      } else {
        const deletedIds = new Set(
          (result.resources ?? []).map((user) => user.id),
        );
        setRows((current) =>
          current.filter((user) => !deletedIds.has(user.id)),
        );
        setSeederCleanupOpen(false);
      }
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setSeederPending(false);
    }
  };

  const openEdit = async (user: CIUser) => {
    resetEditor();
    setFeedback(null);
    setPending(true);
    try {
      const result = onRead
        ? await onRead(user.id)
        : { ok: true as const, user };
      if (!result.ok || !result.user) {
        throw new Error(
          result.ok ? "The user details were not returned." : result.message,
        );
      }
      const fullUser = result.user;
      const profile = fullUser.profile ?? {};
      setTarget(fullUser);
      setEmail(fullUser.email ?? "");
      setGivenName(profile.givenName ?? "");
      setMiddleName(profile.middleName ?? "");
      setFamilyName(profile.familyName ?? "");
      setDisplayName(profile.displayName ?? fullUser.displayName);
      setTitle(profile.title ?? "");
      setPhoneNumber(profile.phoneNumber ?? "");
      setLocale(profile.locale ?? "");
      setTimeZone(profile.timeZone ?? "");
      setGender(profile.gender ?? "");
      setAvatarKey(profile.avatarKey ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
      setAddressLine1(profile.address?.line1 ?? "");
      setAddressLine2(profile.address?.line2 ?? "");
      setAddressLocality(profile.address?.locality ?? "");
      setAddressRegion(profile.address?.region ?? "");
      setAddressPostalCode(profile.address?.postalCode ?? "");
      setAddressCountryCode(profile.address?.countryCode ?? "");
      setExtensionsJson(
        profile.extensions ? JSON.stringify(profile.extensions, null, 2) : "",
      );
      setSelectedRoles(fullUser.roles);
      setAssignmentDrafts(
        fullUser.assignments.length
          ? fullUser.assignments.map(fromUserAssignment)
          : [createAssignment(fullUser.roles[0] ?? roleOptions[0]?.id)],
      );
      setEditorMode("edit");
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setPending(false);
    }
  };

  const definition = useMemo(
    () =>
      ciDefineDataTable<CIUser>({
        getRowId: (user) => user.id,
        information: {
          mode: "dialog",
          label: "View user details",
          title: (user) => user.displayName,
          description: (user) => user.email ?? user.username,
          record: (user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            status: user.status,
            identityProvider: user.identityProvider,
            roles: user.roles,
            assignments: user.assignments,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
        },
        columns: [
          {
            accessorKey: "displayName",
            header: "User",
            cell: ({ row }) => (
              <div className="flex min-w-48 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {row.original.avatarUrl ? (
                    <img
                      src={row.original.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    row.original.displayName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {row.original.displayName}
                  </div>
                  <div className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">
                    {row.original.username}
                  </div>
                </div>
              </div>
            ),
            meta: { ciDataTable: { label: "User" } },
          },
          {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
              <div className="min-w-52">
                <div className="truncate">{row.original.email ?? "—"}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {row.original.emailVerified ? "Verified" : "Not verified"}
                </div>
              </div>
            ),
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
              <Badge
                variant="outline"
                className={
                  row.original.status === "active"
                    ? "border-success-border bg-success-surface text-success-surface-foreground"
                    : row.original.status === "suspended"
                      ? "border-danger-border bg-danger-surface text-danger-surface-foreground"
                      : "border-warning-border bg-warning-surface text-warning-surface-foreground"
                }
              >
                {row.original.status === "active"
                  ? "Active"
                  : row.original.status === "suspended"
                    ? "Suspended"
                    : "Invitation pending"}
              </Badge>
            ),
          },
          {
            id: "roles",
            header: "Roles",
            accessorFn: (user) => user.roles.join(" "),
            cell: ({ row }) => (
              <div className="flex max-w-72 flex-wrap gap-1">
                {row.original.roles.length ? (
                  row.original.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No roles</span>
                )}
              </div>
            ),
          },
          {
            id: "assignments",
            header: "Assignments",
            accessorFn: (user) => user.assignments.length,
            cell: ({ row }) => (
              <span className="tabular-nums">
                {row.original.assignments.length}
              </span>
            ),
          },
          {
            id: "identityProvider",
            header: "Identity provider",
            accessorFn: (user) => user.identityProvider.label,
            cell: ({ row }) => (
              <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
                <Cloud aria-hidden className="size-3.5" />
                {row.original.identityProvider.label}
              </Badge>
            ),
          },
          {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.original.createdAt)}
              </span>
            ),
          },
          ...(mode === "trash"
            ? [
                {
                  id: "deletedAt",
                  header: "Deleted",
                  accessorFn: (user: CIUser) => user.deletion?.deletedAt ?? "",
                  cell: ({ row }: { row: { original: CIUser } }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                      {formatDate(row.original.deletion?.deletedAt)}
                    </span>
                  ),
                },
                {
                  id: "deletionReason",
                  header: "Reason",
                  accessorFn: (user: CIUser) => user.deletion?.reason ?? "",
                  meta: {
                    ciDataTable: {
                      truncate: { maxWidth: 260, showTitle: true },
                    },
                  },
                },
              ]
            : []),
        ],
        rowActions:
          mode === "trash"
            ? [
                {
                  id: "restore",
                  label: "Restore",
                  icon: <CirclePlay aria-hidden />,
                  hideWhen: (user) => user.protected === true || !onRestore,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setConfirmation("");
                    setAction("restore");
                  },
                },
                {
                  id: "purge",
                  label: "Delete permanently",
                  icon: <Trash2 aria-hidden />,
                  variant: "destructive",
                  hideWhen: (user) => user.protected === true || !onPurge,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setConfirmation("");
                    setAction("purge");
                  },
                },
              ]
            : [
                {
                  id: "edit",
                  label: "Edit",
                  icon: <Pencil aria-hidden />,
                  disableWhen: () => !capabilities.canUpdate,
                  onSelect: openEdit,
                },
                {
                  id: "email",
                  label: "Email user",
                  icon: <Mail aria-hidden />,
                  disableWhen: (user) => !capabilities.canEmail || !user.email,
                  onSelect: async (user) => {
                    if (onEmail) {
                      await onEmail(user);
                      return;
                    }
                    if (user.email)
                      window.location.assign(`mailto:${user.email}`);
                  },
                },
                {
                  id: "impersonate",
                  label:
                    capabilities.canImpersonate && !onImpersonate
                      ? "Impersonation session adapter required"
                      : "Impersonate user",
                  icon: <UserRoundCheck aria-hidden />,
                  disableWhen: (user) =>
                    user.protected === true ||
                    user.status !== "active" ||
                    !capabilities.canImpersonate ||
                    !onImpersonate,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setAction("impersonate");
                  },
                },
                {
                  id: "suspend",
                  label: "Suspend",
                  icon: <CirclePause aria-hidden />,
                  variant: "destructive",
                  hideWhen: (user) => user.status === "suspended",
                  disableWhen: (user) =>
                    user.protected === true || !capabilities.canUpdate,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setAction("suspend");
                  },
                },
                {
                  id: "activate",
                  label: "Activate",
                  icon: <CirclePlay aria-hidden />,
                  hideWhen: (user) => user.status !== "suspended",
                  disableWhen: (user) =>
                    user.protected === true || !capabilities.canUpdate,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setAction("activate");
                  },
                },
                {
                  id: "delete",
                  label: "Delete",
                  icon: <Trash2 aria-hidden />,
                  variant: "destructive",
                  disableWhen: (user) =>
                    user.protected === true || !capabilities.canDelete,
                  onSelect: (user) => {
                    setTarget(user);
                    setReason("");
                    setAction("delete");
                  },
                },
              ],
        globalActions:
          mode === "active"
            ? [
                ...(capabilities.canCreate && onCreate
                  ? [
                      {
                        id: "create-user",
                        label: "New user",
                        icon: <Plus aria-hidden />,
                        selection: "none" as const,
                        onSelect: openCreate,
                      },
                    ]
                  : []),
                ...(developmentSeeder
                  ? [
                      {
                        id: "seed-users",
                        label: seederPending ? "Seeding…" : "Seed test users",
                        icon: <DatabaseZap aria-hidden />,
                        selection: "none" as const,
                        isDisabled: () => seederPending,
                        onSelect: () => runSeeder("seed"),
                      },
                      {
                        id: "cleanup-seeded-users",
                        label: seederPending
                          ? "Cleaning up…"
                          : "Clean up test users",
                        icon: <Eraser aria-hidden />,
                        selection: "none" as const,
                        variant: "destructive" as const,
                        isDisabled: () => seederPending,
                        onSelect: () => setSeederCleanupOpen(true),
                      },
                    ]
                  : []),
              ]
            : undefined,
      }),
    [
      capabilities,
      developmentSeeder,
      mode,
      onCreate,
      onDelete,
      onEmail,
      onImpersonate,
      onPurge,
      onRead,
      onRestore,
      onSetStatus,
      onUpdate,
      roleOptions,
      seederPending,
    ],
  );

  const saveEditor = async () => {
    if (!editorMode) return;
    setPending(true);
    try {
      let extensions: Record<string, unknown> | undefined;
      if (extensionsJson.trim()) {
        const parsed: unknown = JSON.parse(extensionsJson);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error("Profile extensions must be a JSON object.");
        }
        extensions = parsed as Record<string, unknown>;
      }
      const address = {
        ...(addressLine1.trim() ? { line1: addressLine1.trim() } : {}),
        ...(addressLine2.trim() ? { line2: addressLine2.trim() } : {}),
        ...(addressLocality.trim() ? { locality: addressLocality.trim() } : {}),
        ...(addressRegion.trim() ? { region: addressRegion.trim() } : {}),
        ...(addressPostalCode.trim()
          ? { postalCode: addressPostalCode.trim() }
          : {}),
        ...(addressCountryCode.trim()
          ? { countryCode: addressCountryCode.trim().toUpperCase() }
          : {}),
      };

      if (editorMode === "create") {
        if (!onCreate) throw new Error("User creation is not configured.");
        if (!email.trim() || !givenName.trim() || !familyName.trim()) {
          throw new Error("Email, given name, and family name are required.");
        }
        if (!selectedRoles.length) {
          throw new Error("Assign at least one role.");
        }
        for (const draft of assignmentDrafts) {
          if (
            (draft.scopeKind === "tenant" || draft.scopeKind === "orgUnit") &&
            !draft.scopeId.trim()
          ) {
            throw new Error(
              "Every tenant or Org Unit assignment needs a scope ID.",
            );
          }
        }
        const input: CICreateUserInput = {
          email: email.trim(),
          givenName: givenName.trim(),
          ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
          familyName: familyName.trim(),
          ...(temporaryPassword ? { temporaryPassword } : {}),
          sendInvitation,
          roles: selectedRoles,
          assignments: assignmentDrafts.map(toAssignmentInput),
          profile: {
            displayName:
              displayName.trim() || `${givenName} ${familyName}`.trim(),
            ...(title.trim() ? { title: title.trim() } : {}),
            ...(avatarKey.trim() ? { avatarKey: avatarKey.trim() } : {}),
            ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
            ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
            ...(locale.trim() ? { locale: locale.trim() } : {}),
            ...(timeZone.trim() ? { timeZone: timeZone.trim() } : {}),
            ...(gender.trim() ? { gender: gender.trim() } : {}),
            ...(Object.keys(address).length ? { address } : {}),
            ...(extensions ? { extensions } : {}),
          },
        };
        const result = await onCreate(input);
        if (!result.ok) throw new Error(result.message);
        setFeedback(result);
        if (result.user) setRows((current) => [result.user!, ...current]);
      } else {
        if (!target || !onUpdate)
          throw new Error("User editing is not configured.");
        if (!selectedRoles.length) throw new Error("Assign at least one role.");
        for (const draft of assignmentDrafts) {
          if (
            (draft.scopeKind === "tenant" || draft.scopeKind === "orgUnit") &&
            !draft.scopeId.trim()
          ) {
            throw new Error(
              "Every tenant or Org Unit assignment needs a scope ID.",
            );
          }
        }
        const result = await onUpdate({
          userId: target.id,
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(givenName.trim() ? { givenName: givenName.trim() } : {}),
          ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
          ...(familyName.trim() ? { familyName: familyName.trim() } : {}),
          roles: selectedRoles,
          assignments: assignmentDrafts.map(toAssignmentInput),
          profile: {
            displayName: displayName.trim() || target.displayName,
            ...(title.trim() ? { title: title.trim() } : {}),
            ...(avatarKey.trim() ? { avatarKey: avatarKey.trim() } : {}),
            ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
            ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
            ...(locale.trim() ? { locale: locale.trim() } : {}),
            ...(timeZone.trim() ? { timeZone: timeZone.trim() } : {}),
            ...(gender.trim() ? { gender: gender.trim() } : {}),
            ...(Object.keys(address).length ? { address } : {}),
            ...(extensions ? { extensions } : {}),
          },
        });
        if (!result.ok) throw new Error(result.message);
        setFeedback(result);
        setRows((current) =>
          current.map((user) =>
            user.id === target.id
              ? {
                  ...user,
                  email: email.trim() || user.email,
                  displayName: displayName.trim() || user.displayName,
                  roles: selectedRoles,
                  assignments: assignmentDrafts.map((draft) => ({
                    id: draft.id,
                    subjectId: target.id,
                    ...toAssignmentInput(draft),
                  })),
                }
              : user,
          ),
        );
      }
      resetEditor();
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setPending(false);
    }
  };

  const confirmAction = async () => {
    if (!target || !action) return;
    setPending(true);
    try {
      const result =
        action === "impersonate"
          ? await onImpersonate?.({ userId: target.id, reason })
          : action === "delete"
            ? await onDelete?.({ userId: target.id, reason })
            : action === "restore"
              ? await onRestore?.({ userId: target.id, reason })
              : action === "purge"
                ? await onPurge?.({
                    userId: target.id,
                    reason,
                    confirmation,
                  })
                : await onSetStatus?.({
                    userId: target.id,
                    status: action === "suspend" ? "suspended" : "active",
                    reason,
                  });
      if (!result) throw new Error("This user action is not configured.");
      if (!result.ok) throw new Error(result.message);
      setFeedback(result);
      setRows((current) =>
        action === "impersonate"
          ? current
          : action === "delete" || action === "restore" || action === "purge"
            ? current.filter((user) => user.id !== target.id)
            : current.map((user) =>
                user.id === target.id
                  ? {
                      ...user,
                      status: action === "suspend" ? "suspended" : "active",
                    }
                  : user,
              ),
      );
      setAction(null);
      setTarget(null);
      setReason("");
      setConfirmation("");
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="w-full space-y-4">
      {feedback ? (
        <CiAlert
          variant={feedback.ok ? "success" : "error"}
          title={feedback.ok ? "Users updated" : "Action failed"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </CiAlert>
      ) : null}

      <CiDataTable
        title={mode === "trash" ? "Deleted users" : "Users"}
        titleBadge={
          mode === "trash" ? "User lifecycle" : "Identity administration"
        }
        titleIcon={<UserRoundCog aria-hidden />}
        titleIconTone="primary"
        titleChips={[
          {
            id: "records",
            label: `${rows.length} ${rows.length === 1 ? "user" : "users"}`,
          },
          {
            id: "provider",
            label: `Identity provider · ${providerLabel}`,
            variant: "secondary",
          },
          {
            id: "management",
            label:
              capabilities.canCreate || capabilities.canUpdate
                ? "Management enabled"
                : "Read only",
            variant:
              capabilities.canCreate || capabilities.canUpdate
                ? "default"
                : "secondary",
          },
        ]}
        description={
          mode === "trash"
            ? "Restore soft-deleted users or permanently remove their Cognito identity, profile, and assignments after verification."
            : "Manage application users, their Cognito identities, fixed CloudIgniter profiles, roles, and scoped assignments from one workspace."
        }
        definition={definition}
        data={rows}
        loading={pending}
        config={{
          formats: [
            { id: "table", label: "Table" },
            { id: "compact", label: "Compact" },
            { id: "cards", label: "Cards" },
          ],
          pagination: {
            pageSize: 25,
            pageSizeOptions: [10, 25, 50, 100],
            allowAll: false,
          },
          rowActions: { mode: "mixed", overflow: 1, reserveSpace: true },
          columnResizing: true,
          persistence: {
            key: `cloudigniter-users-${mode}-v1`,
            columnWidths: true,
            filters: false,
            pageSize: true,
            format: true,
          },
          labels: {
            loading: "Loading users. Please wait...",
            noResults: "No users match the current view.",
          },
        }}
        searchPlaceholder="Search users, email, roles, or provider..."
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            {mode === "trash"
              ? "No deleted users were found."
              : "No active users were found. Create a user to get started."}
          </p>
        }
      />

      <Dialog
        open={editorMode !== null}
        onOpenChange={(open) => {
          if (!open && !pending) resetEditor();
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          showCloseButton={!pending}
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editorMode === "create" ? "Create user" : "Edit user"}
            </DialogTitle>
            <DialogDescription>
              {editorMode === "create"
                ? "Create the Cognito account and CloudIgniter profile, then assign identity roles and scoped application access."
                : "Update the account email and the commonly used profile summary fields."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <section className="grid gap-3" aria-labelledby="account-heading">
              <h3 id="account-heading" className="text-sm font-semibold">
                Account
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-email">Email</Label>
                  <Input
                    id="ci-user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-given-name">Given name</Label>
                  <Input
                    id="ci-user-given-name"
                    value={givenName}
                    onChange={(event) => setGivenName(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-family-name">Family name</Label>
                  <Input
                    id="ci-user-family-name"
                    value={familyName}
                    onChange={(event) => setFamilyName(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-middle-name">Middle name</Label>
                  <Input
                    id="ci-user-middle-name"
                    value={middleName}
                    onChange={(event) => setMiddleName(event.target.value)}
                    disabled={pending}
                  />
                </div>
                {editorMode === "create" ? (
                  <>
                    <div className="grid gap-1.5 sm:col-span-2">
                      <Label htmlFor="ci-user-temporary-password">
                        Temporary password (optional)
                      </Label>
                      <Input
                        id="ci-user-temporary-password"
                        type="password"
                        autoComplete="new-password"
                        value={temporaryPassword}
                        onChange={(event) =>
                          setTemporaryPassword(event.target.value)
                        }
                        disabled={pending}
                      />
                    </div>
                    <label className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm sm:col-span-2">
                      <Checkbox
                        checked={sendInvitation}
                        onCheckedChange={(checked) =>
                          setSendInvitation(checked === true)
                        }
                        disabled={pending}
                      />
                      Send the Cognito invitation message
                    </label>
                  </>
                ) : null}
              </div>
            </section>

            <section className="grid gap-3" aria-labelledby="profile-heading">
              <h3 id="profile-heading" className="text-sm font-semibold">
                CloudIgniter profile
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-display-name">Display name</Label>
                  <Input
                    id="ci-user-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-title">Title</Label>
                  <Input
                    id="ci-user-title"
                    placeholder="Dr, Ms, Mr, Prof"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-gender">Gender</Label>
                  <Select
                    value={gender || "not-specified"}
                    onValueChange={(value) =>
                      setGender(value === "not-specified" ? "" : value)
                    }
                    disabled={pending}
                  >
                    <SelectTrigger id="ci-user-gender">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-specified">
                        Not specified
                      </SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="self-described">
                        Self-described
                      </SelectItem>
                      <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-phone">Phone number</Label>
                  <Input
                    id="ci-user-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ci-user-locale">Locale</Label>
                  <Select
                    value={locale || "application-default"}
                    onValueChange={(value) =>
                      setLocale(value === "application-default" ? "" : value)
                    }
                    disabled={pending}
                  >
                    <SelectTrigger id="ci-user-locale">
                      <SelectValue placeholder="Application default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application-default">
                        Application default
                      </SelectItem>
                      {localeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-time-zone">Time zone</Label>
                  <Select
                    value={timeZone || "application-default"}
                    onValueChange={(value) =>
                      setTimeZone(value === "application-default" ? "" : value)
                    }
                    disabled={pending}
                  >
                    <SelectTrigger id="ci-user-time-zone">
                      <SelectValue placeholder="Application default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application-default">
                        Application default
                      </SelectItem>
                      {timeZoneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-address-line-1">
                    Residence address
                  </Label>
                  <Input
                    id="ci-user-address-line-1"
                    placeholder="Address line 1"
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    disabled={pending}
                  />
                  <Input
                    aria-label="Residence address line 2"
                    placeholder="Address line 2 (optional)"
                    value={addressLine2}
                    onChange={(event) => setAddressLine2(event.target.value)}
                    disabled={pending}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label="Residence city or locality"
                      placeholder="City / locality"
                      value={addressLocality}
                      onChange={(event) =>
                        setAddressLocality(event.target.value)
                      }
                      disabled={pending}
                    />
                    <Input
                      aria-label="Residence state or region"
                      placeholder="State / region"
                      value={addressRegion}
                      onChange={(event) => setAddressRegion(event.target.value)}
                      disabled={pending}
                    />
                    <Input
                      aria-label="Residence postal code"
                      placeholder="Postal code"
                      value={addressPostalCode}
                      onChange={(event) =>
                        setAddressPostalCode(event.target.value)
                      }
                      disabled={pending}
                    />
                    <Input
                      aria-label="Residence country code"
                      placeholder="Country code (AE)"
                      maxLength={2}
                      value={addressCountryCode}
                      onChange={(event) =>
                        setAddressCountryCode(event.target.value)
                      }
                      disabled={pending}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-avatar-key">Profile photo</Label>
                  <Input
                    id="ci-user-avatar-key"
                    placeholder="user-avatars/{userId}/profile.webp"
                    value={avatarKey}
                    onChange={(event) => setAvatarKey(event.target.value)}
                    disabled={pending}
                  />
                  <Input
                    aria-label="Profile photo resolved URL"
                    type="url"
                    placeholder="Resolved or signed S3 URL"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    disabled={pending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Store the durable S3 object key; treat the URL as a
                    replaceable delivery value because signed URLs expire.
                  </p>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ci-user-extensions">
                    Profile extensions (JSON object)
                  </Label>
                  <Textarea
                    id="ci-user-extensions"
                    value={extensionsJson}
                    onChange={(event) => setExtensionsJson(event.target.value)}
                    placeholder={'{ "department": "Engineering" }'}
                    disabled={pending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use this one extension field for application-specific
                    profile data.
                  </p>
                </div>
              </div>
            </section>

            {editorMode ? (
              <section className="grid gap-4" aria-labelledby="access-heading">
                <h3 id="access-heading" className="text-sm font-semibold">
                  Roles and assignments
                </h3>
                <div className="grid gap-2">
                  <Label>Identity roles</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roleOptions.map((role) => (
                      <label
                        key={role.id}
                        className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm"
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role.id)}
                          onCheckedChange={(checked) =>
                            setSelectedRoles((current) =>
                              checked === true
                                ? Array.from(
                                    new Set([...current, role.id]),
                                  ).sort()
                                : current.filter((id) => id !== role.id),
                            )
                          }
                          disabled={pending || !capabilities.canAssignRoles}
                        />
                        {role.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Scoped assignments</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Org Unit scope IDs use tenant-id:org-unit-id.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={() =>
                        setAssignmentDrafts((current) => [
                          ...current,
                          createAssignment(roleOptions[0]?.id),
                        ])
                      }
                      disabled={pending || !capabilities.canAssignRoles}
                    >
                      <Plus aria-hidden /> Add assignment
                    </Button>
                  </div>
                  {assignmentDrafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2"
                    >
                      <Select
                        value={draft.roleId}
                        onValueChange={(value) =>
                          setAssignmentDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id
                                ? { ...item, roleId: value }
                                : item,
                            ),
                          )
                        }
                        disabled={pending}
                      >
                        <SelectTrigger
                          aria-label={`Assignment ${index + 1} role`}
                        >
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={draft.scopeKind}
                        onValueChange={(value) =>
                          setAssignmentDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id
                                ? {
                                    ...item,
                                    scopeKind:
                                      value as AssignmentDraft["scopeKind"],
                                    scopeId: "",
                                  }
                                : item,
                            ),
                          )
                        }
                        disabled={pending}
                      >
                        <SelectTrigger
                          aria-label={`Assignment ${index + 1} scope`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="orgUnit">Org Unit</SelectItem>
                        </SelectContent>
                      </Select>
                      {draft.scopeKind === "tenant" ||
                      draft.scopeKind === "orgUnit" ? (
                        <Input
                          aria-label={`Assignment ${index + 1} scope ID`}
                          placeholder={
                            draft.scopeKind === "tenant"
                              ? "tenant-id"
                              : "tenant-id:org-unit-id"
                          }
                          value={draft.scopeId}
                          onChange={(event) =>
                            setAssignmentDrafts((current) =>
                              current.map((item) =>
                                item.id === draft.id
                                  ? { ...item, scopeId: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          disabled={pending}
                        />
                      ) : null}
                      <Select
                        value={draft.propagation}
                        onValueChange={(value) =>
                          setAssignmentDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id
                                ? {
                                    ...item,
                                    propagation:
                                      value as AssignmentDraft["propagation"],
                                  }
                                : item,
                            ),
                          )
                        }
                        disabled={pending}
                      >
                        <SelectTrigger
                          aria-label={`Assignment ${index + 1} propagation`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exact scope</SelectItem>
                          <SelectItem value="descendants">
                            Include descendants
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {assignmentDrafts.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-11 sm:col-span-2"
                          onClick={() =>
                            setAssignmentDrafts((current) =>
                              current.filter((item) => item.id !== draft.id),
                            )
                          }
                          disabled={pending}
                        >
                          Remove assignment
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={resetEditor}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={() => void saveEditor()}
              disabled={pending}
              aria-busy={pending}
            >
              {pending
                ? "Saving..."
                : editorMode === "create"
                  ? "Create user"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CiAlertDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setAction(null);
            setTarget(null);
            setReason("");
            setConfirmation("");
          }
        }}
        variant={
          action === "activate" ||
          action === "restore" ||
          action === "impersonate"
            ? "default"
            : "destructive"
        }
        title={
          action === "delete"
            ? `Delete ${target?.displayName ?? "user"}?`
            : action === "impersonate"
              ? `Impersonate ${target?.displayName ?? "user"}?`
              : action === "purge"
                ? `Permanently delete ${target?.displayName ?? "user"}?`
                : action === "restore"
                  ? `Restore ${target?.displayName ?? "user"}?`
                  : action === "suspend"
                    ? `Suspend ${target?.displayName ?? "user"}?`
                    : `Activate ${target?.displayName ?? "user"}?`
        }
        description={
          action === "delete"
            ? "The profile will move to Trash and the Cognito identity will be disabled. The account is not permanently deleted."
            : action === "impersonate"
              ? "Start an audited application session as this user. Your administrator identity remains the actor and provider credentials are never reused as the target user."
              : action === "purge"
                ? "This irreversibly deletes the Cognito identity, CloudIgniter profile, and scoped assignments."
                : action === "restore"
                  ? "The user returns to the active list. A previously suspended operational status remains suspended."
                  : action === "suspend"
                    ? "The Cognito identity will be disabled while the profile and assignments remain available for restoration."
                    : "The Cognito identity will be enabled again. Existing roles and assignments are preserved."
        }
        confirmLabel={
          pending
            ? "Updating..."
            : action === "delete"
              ? "Move to Trash"
              : action === "impersonate"
                ? "Start impersonation"
                : action === "purge"
                  ? "Delete permanently"
                  : action === "restore"
                    ? "Restore user"
                    : action === "suspend"
                      ? "Suspend user"
                      : "Activate user"
        }
        cancelLabel="Cancel"
        pending={pending}
        confirmDisabled={
          !reason.trim() || (action === "purge" && confirmation !== target?.id)
        }
        onConfirm={() => void confirmAction()}
      >
        <div className="grid gap-2 pt-2">
          <Label htmlFor="ci-user-action-reason">Reason</Label>
          <Textarea
            id="ci-user-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            placeholder="Explain why this account state is changing."
          />
          {action === "purge" ? (
            <>
              <Label htmlFor="ci-user-purge-confirmation">
                Type the user ID to confirm
              </Label>
              <Input
                id="ci-user-purge-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={pending}
                placeholder={target?.id}
              />
            </>
          ) : null}
        </div>
      </CiAlertDialog>

      {developmentSeeder ? (
        <CiAlertDialog
          open={seederCleanupOpen}
          onOpenChange={(open) => {
            if (!seederPending) setSeederCleanupOpen(open);
          }}
          variant="destructive"
          title={`Clean up “${developmentSeeder.title}”?`}
          description="Only users carrying this seeder's exact provenance marker will be soft-deleted and permanently purged. This cannot be undone."
          confirmLabel={seederPending ? "Cleaning up…" : "Clean up users"}
          cancelLabel="Cancel"
          pending={seederPending}
          onConfirm={() => void runSeeder("cleanup")}
        />
      ) : null}
    </main>
  );
}
