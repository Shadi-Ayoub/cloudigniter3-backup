"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CirclePause,
  CirclePlay,
  DatabaseZap,
  LoaderCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { CiTenantHtmlTableRow } from "@cloudigniter/core/types";
import type { CiTenantManagementPageProps } from "@ci-ui/types";
import { CiDataTable, ciDefineDataTable } from "../components/data-table";
import { ciFormatTenantDate } from "./ci-format-tenant-date";
import {
  CiAlert,
  CiAlertDialog,
  ciNormalizeClientThrownError,
} from "../feedback";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "../components/shadcn";

type PendingAction = "activate" | "delete" | "purge" | "restore" | "suspend";

/** Reusable tenant lifecycle table used by Tenant management and Trash. */
export function CiTenantManagementPage({
  mode,
  tenants,
  capabilities,
  onDelete,
  onSetStatus,
  onRestore,
  onPurge,
  developmentSeeder,
}: CiTenantManagementPageProps) {
  const [rows, setRows] = useState(tenants);
  const [target, setTarget] = useState<CiTenantHtmlTableRow | null>(null);
  const [action, setAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [seederOpen, setSeederOpen] = useState(false);
  const [seederPending, setSeederPending] = useState<"seed" | "cleanup" | null>(
    null,
  );
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [seederFeedback, setSeederFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const closeDialog = () => {
    if (pending) return;
    setTarget(null);
    setAction(null);
    setReason("");
    setConfirmation("");
  };

  const definition = useMemo(
    () =>
      ciDefineDataTable<CiTenantHtmlTableRow>({
        getRowId: (tenant) => tenant.tenantId,
        information: {
          mode: "dialog",
          label: "Tenant information",
          title: (tenant) => tenant.name,
          description: (tenant) => `Tenant ID: ${tenant.tenantId}`,
        },
        columns: [
          {
            accessorKey: "name",
            header: "Tenant",
            meta: {
              ciDataTable: { label: "Tenant", className: "font-semibold" },
            },
          },
          {
            accessorKey: "slug",
            header: "Slug",
            meta: {
              ciDataTable: { truncate: { maxWidth: 220, showTitle: true } },
            },
          },
          { accessorKey: "type", header: "Type" },
          { accessorKey: "region", header: "Region" },
          {
            accessorKey: "status",
            header: "Operational status",
            cell: ({ row }) => {
              const status = row.original.status;
              return (
                <Badge
                  variant="outline"
                  className={
                    status === "active"
                      ? "border-success-border bg-success-surface text-success-surface-foreground"
                      : status === "suspended"
                        ? "border-danger-border bg-danger-surface text-danger-surface-foreground"
                        : "border-warning-border bg-warning-surface text-warning-surface-foreground"
                  }
                >
                  {status === "active"
                    ? "Active"
                    : status === "suspended"
                      ? "Suspended"
                      : "Archived"}
                </Badge>
              );
            },
          },
          ...(mode === "trash"
            ? [
                {
                  id: "deletedAt",
                  header: "Deleted",
                  accessorFn: (tenant: CiTenantHtmlTableRow) =>
                    tenant.deletion?.deletedAt ?? "",
                  cell: ({
                    row,
                  }: {
                    row: { original: CiTenantHtmlTableRow };
                  }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                      {ciFormatTenantDate(row.original.deletion?.deletedAt)}
                    </span>
                  ),
                },
                {
                  id: "deletedBy",
                  header: "Deleted by",
                  accessorFn: (tenant: CiTenantHtmlTableRow) =>
                    tenant.deletion?.deletedBy ?? "",
                  meta: {
                    ciDataTable: {
                      truncate: { maxWidth: 180, showTitle: true },
                    },
                  },
                },
                {
                  id: "deletionReason",
                  header: "Reason",
                  accessorFn: (tenant: CiTenantHtmlTableRow) =>
                    tenant.deletion?.reason ?? "",
                  meta: {
                    ciDataTable: {
                      truncate: { maxWidth: 260, showTitle: true },
                    },
                  },
                },
              ]
            : [
                {
                  accessorKey: "createdAt",
                  header: "Created",
                  cell: ({
                    row,
                  }: {
                    row: { original: CiTenantHtmlTableRow };
                  }) => (
                    <span className="whitespace-nowrap text-muted-foreground">
                      {ciFormatTenantDate(row.original.createdAt)}
                    </span>
                  ),
                },
              ]),
        ],
        rowActions:
          mode === "trash"
            ? [
                {
                  id: "restore",
                  label: "Restore",
                  icon: <RotateCcw aria-hidden />,
                  hideWhen: () => !capabilities.canRestore,
                  onSelect: (tenant) => {
                    setTarget(tenant);
                    setAction("restore");
                  },
                },
                {
                  id: "purge",
                  label: "Delete permanently",
                  icon: <Trash2 aria-hidden />,
                  variant: "destructive",
                  hideWhen: () => !capabilities.canPurge,
                  onSelect: (tenant) => {
                    setTarget(tenant);
                    setAction("purge");
                  },
                },
              ]
            : [
                {
                  id: "delete",
                  label: "Delete",
                  icon: <Trash2 aria-hidden />,
                  variant: "destructive",
                  hideWhen: (tenant) =>
                    tenant.isSystem === true || !capabilities.canDelete,
                  onSelect: (tenant) => {
                    setTarget(tenant);
                    setAction("delete");
                  },
                },
                {
                  id: "suspend",
                  label: "Suspend",
                  icon: <CirclePause aria-hidden />,
                  hideWhen: (tenant) =>
                    tenant.isSystem === true ||
                    tenant.status !== "active" ||
                    !capabilities.canSetStatus,
                  onSelect: (tenant) => {
                    setTarget(tenant);
                    setAction("suspend");
                  },
                },
                {
                  id: "activate",
                  label: "Activate",
                  icon: <CirclePlay aria-hidden />,
                  hideWhen: (tenant) =>
                    tenant.isSystem === true ||
                    tenant.status !== "suspended" ||
                    !capabilities.canSetStatus,
                  onSelect: (tenant) => {
                    setTarget(tenant);
                    setAction("activate");
                  },
                },
              ],
        globalActions:
          mode === "active" && developmentSeeder
            ? [
                {
                  id: "seeder",
                  label: "Seeder",
                  icon: <DatabaseZap aria-hidden />,
                  variant: "default",
                  selection: "none",
                  onSelect: () => {
                    setSeederFeedback(null);
                    setSeederOpen(true);
                  },
                },
              ]
            : undefined,
      }),
    [capabilities, developmentSeeder, mode],
  );

  const confirmAction = async () => {
    if (!target || !action) return;
    setPending(true);
    try {
      if (action === "suspend" || action === "activate") {
        const result = await onSetStatus?.({
          tenantId: target.tenantId,
          status: action === "suspend" ? "suspended" : "active",
          reason,
        });
        if (!result) {
          throw new Error("Tenant status management is not configured.");
        }
        if (!result.ok) throw new Error(result.message);
        const updatedTenant = result.resource;
        if (!updatedTenant) {
          throw new Error("The updated tenant was not returned.");
        }
        setFeedback(result);
        setRows((current) =>
          current.map((tenant) =>
            tenant.tenantId === target.tenantId ? updatedTenant : tenant,
          ),
        );
        setTarget(null);
        setAction(null);
        setReason("");
        setConfirmation("");
        return;
      }

      const result =
        action === "delete"
          ? await onDelete?.({ tenantId: target.tenantId, reason })
          : action === "restore"
            ? await onRestore?.({ tenantId: target.tenantId, reason })
            : await onPurge?.({
                tenantId: target.tenantId,
                reason,
                confirmation,
              });
      if (!result)
        throw new Error("This tenant lifecycle action is not configured.");
      setFeedback(result);
      if (!result.ok) throw new Error(result.message);
      setRows((current) =>
        current.filter((tenant) => tenant.tenantId !== target.tenantId),
      );
      setTarget(null);
      setAction(null);
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

  const runSeeder = async (operation: "seed" | "cleanup") => {
    if (!developmentSeeder) return;
    setSeederPending(operation);
    try {
      const result =
        operation === "seed"
          ? await developmentSeeder.onSeed()
          : await developmentSeeder.onCleanup();
      if (!result.ok) {
        const failedMessage = result.items.find(
          (item) => item.status === "failed",
        )?.message;
        throw new Error(failedMessage ?? `The ${operation} operation failed.`);
      }
      if (operation === "seed") {
        setRows((current) => {
          const byId = new Map(
            current.map((tenant) => [tenant.tenantId, tenant]),
          );
          for (const tenant of result.resources ?? []) {
            byId.set(tenant.tenantId, tenant);
          }
          return [...byId.values()];
        });
      } else {
        const deletedIds = new Set(
          result.items
            .filter((item) => item.status === "deleted")
            .map((item) => item.id),
        );
        setRows((current) =>
          current.filter((tenant) => !deletedIds.has(tenant.tenantId)),
        );
      }
      setSeederFeedback({
        ok: true,
        message:
          operation === "seed"
            ? `${result.created} seeded resource(s) created and ${result.skipped} already present.`
            : `${result.deleted} seeded resource(s) removed and ${result.skipped} preserved.`,
      });
    } catch (error) {
      setSeederFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setSeederPending(null);
    }
  };

  const isPurge = action === "purge";
  const isSuspend = action === "suspend";
  const isActivate = action === "activate";
  const actionLabel =
    action === "restore"
      ? "Restore tenant"
      : isSuspend
        ? "Suspend tenant"
        : isActivate
          ? "Activate tenant"
          : isPurge
            ? "Delete permanently"
            : "Move to Trash";

  return (
    <section className="w-full space-y-4">
      {feedback ? (
        <CiAlert
          variant={feedback.ok ? "success" : "error"}
          title={feedback.ok ? "Tenant lifecycle updated" : "Action failed"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </CiAlert>
      ) : null}
      <CiDataTable
        title={mode === "trash" ? "Trash" : "Tenants"}
        titleBadge={mode === "trash" ? "Tenant lifecycle" : "Tenant management"}
        titleIcon={
          mode === "trash" ? <Trash2 aria-hidden /> : <Building2 aria-hidden />
        }
        titleIconTone={mode === "trash" ? "danger" : "primary"}
        titleChips={[
          {
            id: "records",
            icon: <Building2 aria-hidden className="size-3.5" />,
            label: `${rows.length} ${rows.length === 1 ? "record" : "records"}`,
            variant: "secondary",
          },
          ...(mode === "active" && developmentSeeder
            ? [
                {
                  id: "seeder",
                  icon: <DatabaseZap aria-hidden className="size-3.5" />,
                  label: "Development seeder",
                  variant: "secondary" as const,
                },
              ]
            : []),
        ]}
        description={
          mode === "trash"
            ? "Review deleted resources, restore tenants, or permanently remove them after verification."
            : "Review tenant details, manage operational status, and coordinate tenant administration across the platform."
        }
        definition={definition}
        data={rows}
        config={{
          formats: [
            { id: "table", label: "Table" },
            { id: "compact", label: "Compact" },
            { id: "cards", label: "Cards" },
          ],
          sorting: {
            initial: [
              {
                id: mode === "trash" ? "deletedAt" : "name",
                desc: mode === "trash",
              },
            ],
          },
          pagination: {
            pageSize: 10,
            pageSizeOptions: [10, 25, 50],
            allowAll: false,
          },
          rowActions: { mode: "mixed", overflow: 1, reserveSpace: true },
          columnResizing: true,
          persistence: {
            key: `cloudigniter-tenants-${mode}-v2`,
            columnWidths: true,
            filters: true,
            pageSize: true,
            format: true,
          },
        }}
        searchPlaceholder={
          mode === "trash" ? "Search deleted tenants..." : "Search tenants..."
        }
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            {mode === "trash"
              ? "Trash is empty. Deleted tenants will appear here."
              : "No active tenants were found."}
          </p>
        }
      />

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
                    "Create and clean up development-only test data."}
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
                  {seederPending === "seed" ? "Seeding…" : "Seed Tenants"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={seederPending !== null}
                  onClick={() => {
                    setSeederOpen(false);
                    setCleanupOpen(true);
                  }}
                >
                  <Trash2 aria-hidden />
                  Clean Up
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CiAlertDialog
            open={cleanupOpen}
            onOpenChange={(open) => {
              setCleanupOpen(open);
              if (!open) setSeederOpen(true);
            }}
            variant="destructive"
            icon={<Trash2 aria-hidden />}
            title={`Clean up “${developmentSeeder.title}”?`}
            description="Only tenant and Org Unit records carrying this seeder's provenance marker are removed. Existing and ownership-mismatched resources are preserved."
            confirmLabel="Clean up seeded resources"
            pendingLabel="Cleaning up…"
            pending={seederPending === "cleanup"}
            onConfirm={() => runSeeder("cleanup")}
          />
        </>
      ) : null}

      <CiAlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        variant={
          isPurge || action === "delete"
            ? "destructive"
            : isSuspend
              ? "warning"
              : "default"
        }
        icon={
          isPurge || action === "delete" ? (
            <Trash2 aria-hidden />
          ) : isSuspend ? (
            <CirclePause aria-hidden />
          ) : isActivate ? (
            <CirclePlay aria-hidden />
          ) : (
            <RotateCcw aria-hidden />
          )
        }
        title={`${actionLabel} “${target?.name ?? "tenant"}”?`}
        description={
          isPurge
            ? "This permanently removes the tenant record. This action cannot be undone and is allowed only after the tenant has been moved to Trash."
            : action === "restore"
              ? "The tenant will return to the active tenant list with its previous operational status and slug lookup restored."
              : isSuspend
                ? "The tenant remains in the active management list, but tenant-scoped application routes will be blocked until an administrator activates it again."
                : isActivate
                  ? "The tenant will regain access to its normal tenant-scoped application routes."
                  : "The tenant record is preserved in Trash and removed from active tenant routing. It can be restored later."
        }
        confirmLabel={actionLabel}
        pendingLabel={
          action === "restore"
            ? "Restoring tenant…"
            : isSuspend
              ? "Suspending tenant…"
              : isActivate
                ? "Activating tenant…"
                : isPurge
                  ? "Deleting permanently…"
                  : "Moving to Trash…"
        }
        confirmDisabled={
          reason.trim().length < 3 ||
          (isPurge && confirmation !== target?.tenantId)
        }
        pending={pending}
        onConfirm={confirmAction}
      >
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="tenant-lifecycle-reason">Reason</Label>
            <Textarea
              id="tenant-lifecycle-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reference the request, approval, or incident."
              required
            />
          </div>
          {isPurge ? (
            <div className="grid gap-2">
              <Label htmlFor="tenant-purge-confirmation">
                Type {target?.tenantId} to confirm
              </Label>
              <Input
                id="tenant-purge-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}
        </div>
      </CiAlertDialog>
    </section>
  );
}
