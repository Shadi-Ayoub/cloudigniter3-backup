"use client";

import { useMemo, useState } from "react";
import {
  CirclePause,
  CirclePlay,
  Cloud,
  DatabaseZap,
  KeyRound,
  LoaderCircle,
  Mail,
  Network,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundCheck,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import type {
  CICreateUserAssignmentInput,
  CICreateUserInput,
  CIUser,
} from "@cloudigniter/core/types";
import {
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciCanManageAdministrator,
  ciIsAdministratorRole,
} from "@cloudigniter/core/lib";
import type { CiUserManagementPageProps } from "@ci-ui/types";
import { ciFormatDateTime } from "../../lib/ci-format-date-time";
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

function formatAssignmentScope(
  assignment: CIUser["assignments"][number],
): string {
  if (assignment.scope.kind === "system") return "System";
  if (assignment.scope.kind === "global") return "Global";
  if (assignment.scope.kind === "tenant") {
    return `Tenant · ${assignment.scope.tenantId}`;
  }
  return `Org Unit · ${assignment.scope.tenantId}:${assignment.scope.orgUnitId}`;
}

function CiUserAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl?: string;
  displayName: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(avatarUrl && failedUrl !== avatarUrl);

  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {showImage ? (
        <img
          src={avatarUrl}
          alt={`${displayName} profile`}
          className="size-full object-cover"
          onError={() => setFailedUrl(avatarUrl ?? null)}
        />
      ) : (
        <UserRound aria-hidden className="size-5" />
      )}
    </div>
  );
}

/** Reusable user administration table and editor. */
export function CiUserManagementPage({
  mode = "active",
  managementKind = "users",
  users,
  providerLabel,
  roleOptions,
  filterRoleOptions = roleOptions,
  assignmentRoleOptions = roleOptions,
  localeOptions,
  timeZoneOptions,
  locale: renderLocale = "en-US",
  actor,
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
  const [details, setDetails] = useState<{
    kind: "roles" | "assignments";
    user: CIUser;
  } | null>(null);
  const [action, setAction] = useState<StatusAction | null>(null);
  const [pending, setPending] = useState(false);
  const [seederOpen, setSeederOpen] = useState(false);
  const [seederPending, setSeederPending] = useState<"seed" | "cleanup" | null>(
    null,
  );
  const [seederCleanupOpen, setSeederCleanupOpen] = useState(false);
  const [seederFeedback, setSeederFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    roleOptions[0]?.id ?? "user",
  ]);
  // Draft IDs are created only after a browser interaction. The initial render
  // stays deterministic across SSR and hydration.
  const [assignmentDrafts, setAssignmentDrafts] = useState<AssignmentDraft[]>(
    [],
  );

  const canManageTarget = (
    user: CIUser,
    operation: "profile-edit" | "account-management" = "account-management",
  ) => {
    const effectiveTargetRoleIds = [
      ...user.roles,
      ...user.assignments.map((assignment) => assignment.roleId),
    ];
    const isAdministrator =
      user.isRootUser === true ||
      effectiveTargetRoleIds.some(ciIsAdministratorRole);
    if (!isAdministrator) return true;
    if (!actor) return false;

    return ciCanManageAdministrator({
      actor: {
        id: actor.userId,
        effectiveRoleIds: actor.roles,
        isRootUser: actor.isRootUser,
        canManageSystemSuperAdmins: actor.canManageSystemSuperAdmins,
      },
      target: {
        id: user.id,
        effectiveRoleIds: effectiveTargetRoleIds,
        isRootUser: user.isRootUser === true,
      },
      operation,
    });
  };

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
    setSelectedRoles([roleOptions[0]?.id ?? "user"]);
    setAssignmentDrafts([
      createAssignment(
        assignmentRoleOptions[0]?.id ?? roleOptions[0]?.id ?? "user",
      ),
    ]);
  };

  const openCreate = () => {
    resetEditor();
    setFeedback(null);
    setEditorMode("create");
  };

  const runSeeder = async (operation: "seed" | "cleanup") => {
    if (!developmentSeeder) return;
    setSeederPending(operation);
    setSeederFeedback(null);
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
      setSeederFeedback({
        ok: true,
        message: `${developmentSeeder.title}: ${result.created} created, ${result.deleted} deleted, ${result.skipped} skipped.`,
      });
      if (operation === "seed") {
        setRows((current) => {
          const byId = new Map(current.map((user) => [user.id, user]));
          for (const user of result.resources ?? []) {
            const isAdministrator =
              user.isRootUser === true ||
              user.roles.some(ciIsAdministratorRole);
            if ((managementKind === "administrators") === isAdministrator) {
              byId.set(user.id, user);
            }
          }
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
        setSeederOpen(true);
      }
    } catch (error) {
      setSeederFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setSeederPending(null);
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
      const identity = fullUser.identity as
        | {
            givenName?: string;
            middleName?: string;
            familyName?: string;
          }
        | undefined;
      setTarget(fullUser);
      setEmail(fullUser.email ?? "");
      setGivenName(identity?.givenName ?? profile.givenName ?? "");
      setMiddleName(identity?.middleName ?? profile.middleName ?? "");
      setFamilyName(identity?.familyName ?? profile.familyName ?? "");
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
          : [
              createAssignment(
                fullUser.roles[0] ??
                  assignmentRoleOptions[0]?.id ??
                  roleOptions[0]?.id,
              ),
            ],
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
            givenName: user.givenName,
            familyName: user.familyName,
            status: user.status,
            rootUser: user.isRootUser === true,
            identityProvider: user.identityProvider,
            primaryRole: user.primaryRole,
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
                <CiUserAvatar
                  avatarUrl={row.original.avatarUrl}
                  displayName={row.original.displayName}
                />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold">
                      {row.original.displayName}
                    </span>
                    {row.original.isRootUser ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 gap-1 bg-primary/10 text-primary"
                      >
                        <ShieldCheck aria-hidden className="size-3.5" />
                        Root User
                      </Badge>
                    ) : null}
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
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-2 tabular-nums"
                onClick={() =>
                  setDetails({ kind: "roles", user: row.original })
                }
              >
                <KeyRound aria-hidden />
                {row.original.roles.length}{" "}
                {row.original.roles.length === 1 ? "role" : "roles"}
              </Button>
            ),
          },
          {
            id: "assignments",
            header: "Assignments",
            accessorFn: (user) => user.assignments.length,
            cell: ({ row }) => (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-2 tabular-nums"
                onClick={() =>
                  setDetails({ kind: "assignments", user: row.original })
                }
              >
                <Network aria-hidden />
                {row.original.assignments.length}{" "}
                {row.original.assignments.length === 1
                  ? "assignment"
                  : "assignments"}
              </Button>
            ),
          },
          {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {ciFormatDateTime(row.original.createdAt, renderLocale)}
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
                      {ciFormatDateTime(
                        row.original.deletion?.deletedAt,
                        renderLocale,
                      )}
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
        filters: [
          {
            id: "status",
            label: "Status",
            allLabel: "All statuses",
            sortOptions: false,
            options: [
              { id: "active", label: "Active" },
              { id: "invited", label: "Invitation pending" },
              { id: "suspended", label: "Suspended" },
            ],
          },
          {
            id: "roles",
            label: "Role",
            allLabel: "All roles",
            sortOptions: false,
            options: filterRoleOptions.map((role) => ({
              id: role.id,
              label: role.label,
            })),
            filterFn: (row, _columnId, value) =>
              typeof value === "string" &&
              (row.original.roles.includes(value) ||
                row.original.assignments.some(
                  (assignment) => assignment.roleId === value,
                )),
          },
        ],
        rowActions:
          mode === "trash"
            ? [
                {
                  id: "restore",
                  label: "Restore",
                  icon: <CirclePlay aria-hidden />,
                  hideWhen: (user) => user.isRootUser === true || !onRestore,
                  disableWhen: (user) => !canManageTarget(user),
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
                  hideWhen: (user) => user.isRootUser === true || !onPurge,
                  disableWhen: (user) => !canManageTarget(user),
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
                  disableWhen: (user) =>
                    !capabilities.canUpdate ||
                    !canManageTarget(
                      user,
                      user.isRootUser ? "profile-edit" : "account-management",
                    ),
                  onSelect: openEdit,
                },
                {
                  id: "email",
                  label: "Email user",
                  icon: <Mail aria-hidden />,
                  disableWhen: (user) =>
                    !capabilities.canEmail ||
                    !user.email ||
                    !canManageTarget(user),
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
                    user.isRootUser === true ||
                    user.status !== "active" ||
                    !capabilities.canImpersonate ||
                    !onImpersonate ||
                    !canManageTarget(user),
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
                    user.isRootUser === true ||
                    !capabilities.canUpdate ||
                    !canManageTarget(user),
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
                    user.isRootUser === true ||
                    !capabilities.canUpdate ||
                    !canManageTarget(user),
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
                    user.isRootUser === true ||
                    !capabilities.canDelete ||
                    !canManageTarget(user),
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
                        label:
                          managementKind === "administrators"
                            ? "New administrator"
                            : "New user",
                        icon: <Plus aria-hidden />,
                        selection: "none" as const,
                        onSelect: openCreate,
                      },
                    ]
                  : []),
                ...(developmentSeeder
                  ? [
                      {
                        id: "user-seeder",
                        label: "Seeder",
                        icon: <DatabaseZap aria-hidden />,
                        selection: "none" as const,
                        isDisabled: () => seederPending !== null,
                        onSelect: () => {
                          setSeederFeedback(null);
                          setSeederOpen(true);
                        },
                      },
                    ]
                  : []),
              ]
            : undefined,
      }),
    [
      capabilities,
      developmentSeeder,
      managementKind,
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
      filterRoleOptions,
      roleOptions,
      actor?.userId,
      actor?.roles,
      actor?.isRootUser,
      actor?.canManageSystemSuperAdmins,
      renderLocale,
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
        if (!target.isRootUser && capabilities.canAssignRoles) {
          if (!selectedRoles.length)
            throw new Error("Assign at least one role.");
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
        }
        const result = await onUpdate({
          userId: target.id,
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(givenName.trim() ? { givenName: givenName.trim() } : {}),
          ...(middleName.trim() ? { middleName: middleName.trim() } : {}),
          ...(familyName.trim() ? { familyName: familyName.trim() } : {}),
          ...(target.isRootUser || !capabilities.canAssignRoles
            ? {}
            : {
                roles: selectedRoles,
                assignments: assignmentDrafts.map(toAssignmentInput),
              }),
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
                  ...(target.isRootUser || !capabilities.canAssignRoles
                    ? {}
                    : {
                        roles: selectedRoles,
                        assignments: assignmentDrafts.map((draft) => ({
                          id: draft.id,
                          subjectId: target.id,
                          ...toAssignmentInput(draft),
                        })),
                      }),
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
        title={
          mode === "trash"
            ? managementKind === "administrators"
              ? "Deleted administrators"
              : "Deleted users"
            : managementKind === "administrators"
              ? "Administrators"
              : "Users"
        }
        titleBadge={
          mode === "trash"
            ? managementKind === "administrators"
              ? "Administrator lifecycle"
              : "User lifecycle"
            : managementKind === "administrators"
              ? "Administrator governance"
              : "Identity administration"
        }
        titleIcon={
          managementKind === "administrators" ? (
            <ShieldCheck aria-hidden />
          ) : (
            <UserRoundCog aria-hidden />
          )
        }
        titleIconTone="primary"
        titleChips={[
          {
            id: "records",
            icon: <UsersRound aria-hidden className="size-3.5" />,
            label: `${rows.length} ${
              rows.length === 1
                ? managementKind === "administrators"
                  ? "administrator"
                  : "user"
                : managementKind === "administrators"
                  ? "administrators"
                  : "users"
            }`,
            variant: "secondary",
          },
          {
            id: "provider",
            icon: <Cloud aria-hidden className="size-3.5" />,
            label: `Identity provider · ${providerLabel}`,
            variant: "default",
          },
        ]}
        description={
          mode === "trash"
            ? managementKind === "administrators"
              ? "Restore soft-deleted administrators or permanently remove their Cognito identity, profile, and assignments after hierarchy verification."
              : "Restore soft-deleted users or permanently remove their Cognito identity, profile, and assignments after verification."
            : managementKind === "administrators"
              ? "Manage administrator identities and scoped access while enforcing role hierarchy, delegated authority, and Root User protection."
              : "Manage non-administrator application users, their Cognito identities, fixed CloudIgniter profiles, roles, and scoped assignments."
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
            key: `cloudigniter-${managementKind}-${mode}-v2`,
            columnWidths: true,
            filters: true,
            pageSize: true,
            format: true,
          },
          labels: {
            loading: `Loading ${managementKind}. Please wait...`,
            noResults: `No ${managementKind} match the current view.`,
          },
        }}
        searchPlaceholder={`Search ${managementKind}, email, or roles...`}
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            {mode === "trash"
              ? managementKind === "administrators"
                ? "No deleted administrator accounts were found."
                : "No deleted users were found."
              : managementKind === "administrators"
                ? "No administrator accounts were found."
                : "No active users were found. Create a user to get started."}
          </p>
        }
      />

      <Dialog
        open={details !== null}
        onOpenChange={(open) => {
          if (!open) setDetails(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {details?.kind === "roles" ? "Assigned roles" : "Assignments"}
            </DialogTitle>
            <DialogDescription>
              {details?.user.displayName}
              {details?.kind === "roles"
                ? " — the primary role is identified separately from other identity roles."
                : " — scoped assignments control where each role applies."}
            </DialogDescription>
          </DialogHeader>

          {details?.kind === "roles" ? (
            <div className="grid gap-2">
              {details.user.isRootUser ? (
                <div className="flex min-h-11 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3">
                  <ShieldCheck aria-hidden className="size-4 text-primary" />
                  <span className="font-medium">Root User</span>
                </div>
              ) : null}
              {[...details.user.roles]
                .sort((left, right) => {
                  if (left === details.user.primaryRole) return -1;
                  if (right === details.user.primaryRole) return 1;
                  return left.localeCompare(right);
                })
                .map((role) => (
                  <div
                    key={role}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3"
                  >
                    <span className="font-medium">
                      {filterRoleOptions.find((option) => option.id === role)
                        ?.label ?? role}
                    </span>
                    {role === details.user.primaryRole ? (
                      <Badge variant="secondary">Primary</Badge>
                    ) : (
                      <Badge variant="outline">Additional</Badge>
                    )}
                  </div>
                ))}
              {!details.user.roles.length ? (
                <p className="text-sm text-muted-foreground">
                  No identity roles are assigned.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid max-h-96 gap-2 overflow-y-auto">
              {details?.user.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {assignmentRoleOptions.find(
                        (option) => option.id === assignment.roleId,
                      )?.label ?? assignment.roleId}
                    </span>
                    <Badge variant="secondary">
                      {assignment.propagation === "descendants"
                        ? "Includes descendants"
                        : "Exact"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatAssignmentScope(assignment)}
                  </p>
                </div>
              ))}
              {!details?.user.assignments.length ? (
                <p className="text-sm text-muted-foreground">
                  No scoped assignments are configured.
                </p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              {editorMode === "create"
                ? managementKind === "administrators"
                  ? "Create administrator"
                  : "Create user"
                : managementKind === "administrators"
                  ? "Edit administrator"
                  : "Edit user"}
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
                    <SelectTrigger
                      id="ci-user-gender"
                      className="min-h-11 w-full"
                    >
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
                    <SelectTrigger
                      id="ci-user-locale"
                      className="min-h-11 w-full"
                    >
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
                    <SelectTrigger
                      id="ci-user-time-zone"
                      className="min-h-11 w-full"
                    >
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

            {editorMode && !target?.isRootUser ? (
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
                          createAssignment(
                            assignmentRoleOptions[0]?.id ?? roleOptions[0]?.id,
                          ),
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
                                ? {
                                    ...item,
                                    roleId: value,
                                    ...(value ===
                                    CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE
                                      ? {
                                          scopeKind: "system" as const,
                                          scopeId: "",
                                          propagation: "exact" as const,
                                        }
                                      : {}),
                                  }
                                : item,
                            ),
                          )
                        }
                        disabled={
                          pending ||
                          (draft.roleId ===
                            CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
                            !capabilities.canDelegateSystemSuperAdminManagement)
                        }
                      >
                        <SelectTrigger
                          aria-label={`Assignment ${index + 1} role`}
                        >
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignmentRoleOptions.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id}
                              disabled={
                                role.id ===
                                  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
                                !capabilities.canDelegateSystemSuperAdminManagement
                              }
                            >
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
                        disabled={
                          pending ||
                          draft.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE
                        }
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
                          disabled={
                            pending ||
                            (draft.roleId ===
                              CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
                              !capabilities.canDelegateSystemSuperAdminManagement)
                          }
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
                        disabled={
                          pending ||
                          draft.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE
                        }
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
                          disabled={
                            pending ||
                            (draft.roleId ===
                              CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
                              !capabilities.canDelegateSystemSuperAdminManagement)
                          }
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
                  ? managementKind === "administrators"
                    ? "Create administrator"
                    : "Create user"
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
        <>
          <Dialog
            open={seederOpen}
            onOpenChange={(open) => {
              if (seederPending === null) setSeederOpen(open);
            }}
          >
            <DialogContent
              className="sm:max-w-lg"
              showCloseButton={seederPending === null}
              onEscapeKeyDown={(event) => {
                if (seederPending !== null) event.preventDefault();
              }}
              onPointerDownOutside={(event) => {
                if (seederPending !== null) event.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle>{developmentSeeder.title}</DialogTitle>
                <DialogDescription>
                  {developmentSeeder.description ??
                    "Create and clean up development-only test users."}
                </DialogDescription>
              </DialogHeader>

              {seederFeedback ? (
                <CiAlert
                  variant={seederFeedback.ok ? "success" : "error"}
                  title={seederFeedback.ok ? "Seeder updated" : "Seeder failed"}
                  onDismiss={() => setSeederFeedback(null)}
                >
                  {seederFeedback.message}
                </CiAlert>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={seederPending !== null}
                  aria-busy={seederPending === "seed"}
                  onClick={() => void runSeeder("seed")}
                >
                  {seederPending === "seed" ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <DatabaseZap aria-hidden />
                  )}
                  {seederPending === "seed" ? "Seeding…" : "Seed Users"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={seederPending !== null}
                  onClick={() => {
                    setSeederOpen(false);
                    setSeederCleanupOpen(true);
                  }}
                >
                  <Trash2 aria-hidden />
                  Clean Up
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CiAlertDialog
            open={seederCleanupOpen}
            onOpenChange={(open) => {
              setSeederCleanupOpen(open);
              if (!open) setSeederOpen(true);
            }}
            variant="destructive"
            icon={<Trash2 aria-hidden />}
            title={`Clean up “${developmentSeeder.title}”?`}
            description="Only users carrying this seeder's exact provenance marker will be soft-deleted and permanently purged. Existing users and ownership-mismatched records are preserved."
            confirmLabel="Clean up seeded users"
            pendingLabel="Cleaning up…"
            pending={seederPending === "cleanup"}
            onConfirm={() => void runSeeder("cleanup")}
          />
        </>
      ) : null}
    </main>
  );
}
