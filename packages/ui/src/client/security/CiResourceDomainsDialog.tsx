"use client";

import { useMemo, useState } from "react";
import { CirclePause, CirclePlay, Plus, RefreshCw } from "lucide-react";
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
  Textarea,
  ciNormalizeClientThrownError,
} from "@ci-ui/client";
import {
  CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN,
  ciIsAccessControlKebabIdentifier,
} from "@cloudigniter/core/lib";
import type {
  CiCreateSecurityResourceDomainInput,
  CiResourceDomainStatus,
  CiSecurityCapabilities,
  CiSecurityMutationResult,
  CiSecurityResourceDomainRecord,
} from "@cloudigniter/core/types";
import { ciIsSecurityIdentifierInputAllowed } from "./ci-security-editor-session";

type CiResourceDomainsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: CiSecurityResourceDomainRecord[];
  capabilities: CiSecurityCapabilities;
  onCreate?: (
    input: CiCreateSecurityResourceDomainInput,
  ) => Promise<CiSecurityMutationResult>;
  onSetStatus?: (
    domainId: string,
    status: CiResourceDomainStatus,
    reason: string,
  ) => Promise<CiSecurityMutationResult>;
};

const EMPTY_DOMAIN: CiCreateSecurityResourceDomainInput = {
  id: "",
  title: "",
  description: "",
};

/** Manages the resource domains used by the authorization catalog. */
export function CiResourceDomainsDialog({
  open,
  onOpenChange,
  domains,
  capabilities,
  onCreate,
  onSetStatus,
}: CiResourceDomainsDialogProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DOMAIN);
  const [identifierVisited, setIdentifierVisited] = useState(false);
  const [identifierEntryError, setIdentifierEntryError] = useState<
    string | null
  >(null);
  const [statusTarget, setStatusTarget] =
    useState<CiSecurityResourceDomainRecord | null>(null);
  const [nextStatus, setNextStatus] =
    useState<CiResourceDomainStatus>("suspended");
  const [reason, setReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "create" | "status" | null
  >(null);
  const [feedback, setFeedback] = useState<CiSecurityMutationResult | null>(
    null,
  );

  const sortedDomains = useMemo(
    () =>
      [...domains].sort(
        (left, right) =>
          left.title.localeCompare(right.title, undefined, {
            sensitivity: "base",
          }) || left.id.localeCompare(right.id),
      ),
    [domains],
  );
  const identifierFormatError =
    identifierVisited &&
    draft.id.length > 0 &&
    !ciIsAccessControlKebabIdentifier(draft.id)
      ? "Start with a lowercase letter and use only lowercase letters, digits, and single hyphens."
      : null;
  const identifierError = identifierEntryError ?? identifierFormatError;
  const canCreate = Boolean(
    onCreate &&
    capabilities.canManageApplication &&
    ciIsAccessControlKebabIdentifier(draft.id) &&
    draft.title.trim(),
  );

  const updateIdentifier = (value: string) => {
    if (!ciIsSecurityIdentifierInputAllowed(value)) {
      setIdentifierVisited(true);
      setIdentifierEntryError(
        "That character is not allowed. Use lowercase kebab case and begin with a letter.",
      );
      return;
    }
    setIdentifierEntryError(null);
    setDraft((current) => ({ ...current, id: value }));
  };

  const resetCreateDraft = () => {
    setCreateOpen(false);
    setDraft(EMPTY_DOMAIN);
    setIdentifierVisited(false);
    setIdentifierEntryError(null);
  };

  const changeDialogOpen = (nextOpen: boolean) => {
    if (pendingAction !== null) return;
    if (!nextOpen && statusTarget !== null) return;
    if (!nextOpen) {
      resetCreateDraft();
      setFeedback(null);
    }
    onOpenChange(nextOpen);
  };

  const createDomain = async () => {
    if (!onCreate || !canCreate) return;
    setPendingAction("create");
    try {
      const result = await onCreate({
        id: draft.id,
        title: draft.title.trim(),
        description: draft.description?.trim() || undefined,
      });
      setFeedback(result);
      if (result.ok) {
        setDraft(EMPTY_DOMAIN);
        setIdentifierVisited(false);
        setCreateOpen(false);
      }
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setPendingAction(null);
    }
  };

  const changeStatus = async () => {
    if (!statusTarget || !onSetStatus) return;
    setPendingAction("status");
    try {
      const result = await onSetStatus(
        statusTarget.id,
        nextStatus,
        reason.trim(),
      );
      if (!result.ok) throw new Error(result.message);
      setFeedback(result);
    } finally {
      setPendingAction(null);
    }
  };

  const closeStatusDialog = () => {
    setStatusTarget(null);
    setReason("");
    setStatusError(null);
    onOpenChange(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={changeDialogOpen}>
        <DialogContent
          className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl"
          aria-busy={pendingAction !== null}
        >
          <DialogHeader>
            <DialogTitle>Resource domains</DialogTitle>
            <DialogDescription>
              Group related authorization resources and control whether every
              resource in a domain can participate in access checks.
            </DialogDescription>
          </DialogHeader>

          {feedback ? (
            <CiAlert
              variant={feedback.ok ? "success" : "error"}
              title={feedback.ok ? "Success" : "Action failed"}
              onDismiss={() => setFeedback(null)}
            >
              {feedback.message}
            </CiAlert>
          ) : null}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pe-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {sortedDomains.length} domain
                {sortedDomains.length === 1 ? "" : "s"}, sorted alphabetically
              </p>
              {onCreate && capabilities.canManageApplication ? (
                <Button
                  type="button"
                  variant={createOpen ? "secondary" : "default"}
                  className="min-h-11"
                  onClick={() => {
                    setFeedback(null);
                    setCreateOpen((current) => !current);
                  }}
                >
                  <Plus aria-hidden />
                  New domain
                </Button>
              ) : null}
            </div>

            {createOpen ? (
              <section className="grid gap-4 rounded-xl border bg-muted/25 p-4 sm:p-5">
                <div>
                  <h3 className="font-semibold">Create resource domain</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Domain identifiers are permanent and become part of the
                    authorization catalog.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="resource-domain-id">
                      Stable identifier
                    </Label>
                    <Input
                      id="resource-domain-id"
                      value={draft.id}
                      pattern={CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-invalid={identifierError ? true : undefined}
                      aria-describedby="resource-domain-id-guidance"
                      onChange={(event) => updateIdentifier(event.target.value)}
                      onBlur={() => setIdentifierVisited(true)}
                      placeholder="billing-operations"
                    />
                    <p
                      id="resource-domain-id-guidance"
                      className={
                        identifierError
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                      role={identifierError ? "alert" : undefined}
                    >
                      {identifierError ??
                        "Lowercase kebab case, beginning with a letter. No spaces or special characters."}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resource-domain-title">Display name</Label>
                    <Input
                      id="resource-domain-title"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Billing operations"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-domain-description">
                    Description <span className="font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="resource-domain-description"
                    value={draft.description ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe the resources governed by this domain."
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={pendingAction !== null}
                    onClick={resetCreateDraft}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="min-h-11"
                    disabled={!canCreate || pendingAction !== null}
                    onClick={createDomain}
                  >
                    {pendingAction === "create" ? "Creating…" : "Create domain"}
                  </Button>
                </div>
              </section>
            ) : null}

            <div className="overflow-hidden rounded-xl border">
              <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] gap-3 border-b bg-muted/35 px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid">
                <span>Domain</span>
                <span>Status</span>
                <span>Resources</span>
                <span className="text-end">Action</span>
              </div>
              <div className="divide-y">
                {sortedDomains.map((domain) => {
                  const active = domain.status === "active";
                  const canChange =
                    Boolean(onSetStatus) &&
                    capabilities.canManageApplication &&
                    (!domain.locked || capabilities.canManageCore) &&
                    !(domain.id === "platform" && active);
                  return (
                    <div
                      key={domain.id}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{domain.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {domain.id}
                        </div>
                        {domain.description ? (
                          <p className="mt-1 text-sm text-muted-foreground sm:hidden">
                            {domain.description}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className={
                            active
                              ? "border-success-border bg-success-surface text-success-surface-foreground"
                              : "border-warning-border bg-warning-surface text-warning-surface-foreground"
                          }
                        >
                          {active ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                      <div className="text-sm tabular-nums">
                        <span className="sm:hidden">Resources: </span>
                        {domain.resourceCount}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant={active ? "destructive" : "outline"}
                          size="sm"
                          className="min-h-11 min-w-24"
                          disabled={!canChange || pendingAction !== null}
                          title={
                            domain.id === "platform" && active
                              ? "The platform domain contains the recovery path and cannot be suspended."
                              : undefined
                          }
                          onClick={() => {
                            setFeedback(null);
                            setStatusError(null);
                            setReason("");
                            setNextStatus(active ? "suspended" : "active");
                            setStatusTarget(domain);
                            onOpenChange(false);
                          }}
                        >
                          {active ? (
                            <CirclePause aria-hidden />
                          ) : (
                            <CirclePlay aria-hidden />
                          )}
                          {active ? "Suspend" : "Restore"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="!mx-0 !mb-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pendingAction !== null}
              onClick={() => changeDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>

          {pendingAction === "create" ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-background/85 px-6 supports-backdrop-filter:backdrop-blur-[2px]">
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-3 rounded-xl border bg-background px-5 py-4 text-sm font-medium shadow-lg"
              >
                <RefreshCw className="size-5 animate-spin" aria-hidden />
                Creating the resource domain. Please wait...
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <CiAlertDialog
        open={statusTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && pendingAction === null) closeStatusDialog();
        }}
        variant={nextStatus === "suspended" ? "destructive" : "default"}
        icon={
          nextStatus === "suspended" ? (
            <CirclePause aria-hidden />
          ) : (
            <CirclePlay aria-hidden />
          )
        }
        title={`${nextStatus === "suspended" ? "Suspend" : "Restore"} domain “${
          statusTarget?.title ?? statusTarget?.id ?? ""
        }”?`}
        description={
          nextStatus === "suspended"
            ? `All ${statusTarget?.resourceCount ?? 0} resources in this domain will immediately stop authorizing actions. Catalog records and privileges remain intact for restoration.`
            : "Resources in this domain will immediately resume participating in authorization checks."
        }
        confirmLabel={
          nextStatus === "suspended" ? "Suspend domain" : "Restore domain"
        }
        pendingLabel={
          nextStatus === "suspended"
            ? "Suspending domain…"
            : "Restoring domain…"
        }
        confirmDisabled={!reason.trim()}
        pending={pendingAction === "status"}
        onConfirm={changeStatus}
        onConfirmError={(error) => {
          setStatusError(ciNormalizeClientThrownError(error).message);
        }}
      >
        <div className="grid gap-2">
          {statusError ? (
            <CiAlert
              variant="error"
              title="Unable to change domain status"
              onDismiss={() => setStatusError(null)}
            >
              {statusError}
            </CiAlert>
          ) : null}
          <Label htmlFor="resource-domain-status-reason">Reason</Label>
          <Textarea
            id="resource-domain-status-reason"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reference the incident, review, or approval for this change."
          />
          <p className="text-xs text-muted-foreground">
            The actor, timestamp, and reason are stored with the latest domain
            status change.
          </p>
        </div>
      </CiAlertDialog>
    </>
  );
}
