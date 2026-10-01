"use client";

import { useMemo, useState } from "react";
import {
  Braces,
  Eye,
  Globe,
  Layers3,
  List,
  Pencil,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../shadcn/button";
import { CiSmartForm } from "../smart-form/CiSmartForm";
import { CiManagementHeader } from "../management-header/CiManagementHeader";
import { CiAlert } from "../../feedback/CiAlert";
import { CiAlertDialog } from "../../feedback/CiAlertDialog";
import { ciSettingsForm } from "./ci-settings-form";
import { CiSettingsTenancy } from "./CiSettingsTenancy";
import { ciSettingsTargetKey } from "@cloudigniter/core/lib";
import type { CiSettingsManagerProps } from "@ci-ui/types";
import type {
  CiSmartFormValues,
  CiSettingsTarget,
  CiSettingsEnforcementRule,
} from "@cloudigniter/core/types";

/** Registry-driven settings domains. Editing always returns through the authorized save action. */
export function CiSettingsManager({
  title,
  description,
  groups: initialGroups,
  canUpdate: initialCanUpdate,
  tenancy,
  notice,
  saveUnavailableReason,
  onSave,
  onClose,
}: CiSettingsManagerProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [canUpdate, setCanUpdate] = useState(initialCanUpdate);
  const [canEnforce, setCanEnforce] = useState(tenancy?.canEnforce ?? false);
  const [canOverwrite, setCanOverwrite] = useState(
    tenancy?.canOverwrite ?? false,
  );
  const [target, setTarget] = useState<CiSettingsTarget>(
    tenancy?.target ?? { scope: "system" },
  );
  const [rules, setRules] = useState<
    Record<string, readonly CiSettingsEnforcementRule[]>
  >({});
  const [requestedTarget, setRequestedTarget] = useState<CiSettingsTarget>();
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(initialGroups[0]?.id);
  const [editing, setEditing] = useState(canUpdate);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<CiSmartFormValues>();
  const [json, setJson] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const form = useMemo(
    () =>
      ciSettingsForm(groups, editing && canUpdate, json ? undefined : selected),
    [groups, editing, canUpdate, json, selected],
  );
  const close = () => {
    if (editing && dirty) setConfirmClose(true);
    else onClose?.();
  };
  const group = groups.find((item) => item.id === selected);
  const scope = groups[0]?.scope;
  async function switchTarget(next: CiSettingsTarget) {
    if (!tenancy || ciSettingsTargetKey(next) === ciSettingsTargetKey(target))
      return;
    setPending(true);
    setLoadError("");
    try {
      const view = await tenancy.onLoad(next);
      setTarget(next);
      setGroups(view.groups);
      setSelected(view.groups[0]?.id);
      setCanUpdate(view.canUpdate);
      setCanEnforce(view.canEnforce);
      setCanOverwrite(view.canOverwrite);
      setEditing(view.canUpdate);
      setDirty(false);
      setDraft(undefined);
      setRules({});
      setMessage("");
      setJson(false);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load settings.",
      );
    } finally {
      setPending(false);
      setRequestedTarget(undefined);
    }
  }

  return (
    <section
      className="flex w-full min-w-0 flex-col pb-4"
      onInputCapture={(event) => {
        if (
          editing &&
          canUpdate &&
          (event.target as HTMLElement).closest("[data-smart-field]")
        )
          setDirty(true);
      }}
    >
      <CiManagementHeader
        title={title}
        description={description}
        titleBadge={
          scope === "user" ? "Account preferences" : "Application configuration"
        }
        titleIcon={
          scope === "public" ? (
            <Globe aria-hidden />
          ) : scope === "private" ? (
            <ShieldCheck aria-hidden />
          ) : (
            <Settings2 aria-hidden />
          )
        }
        titleChips={[
          {
            id: "groups",
            icon: <Layers3 aria-hidden className="size-3.5" />,
            label: `${groups.length} ${groups.length === 1 ? "group" : "groups"}`,
            variant: "secondary",
          },
          {
            id: "access",
            icon: canUpdate ? (
              <Pencil aria-hidden className="size-3.5" />
            ) : (
              <Eye aria-hidden className="size-3.5" />
            ),
            label: canUpdate ? "Can edit" : "View only",
            variant: "secondary",
          },
        ]}
      />
      {notice && (
        <CiAlert variant="info" dismissible={false} className="mb-4">
          {notice}
        </CiAlert>
      )}
      {saveUnavailableReason && (
        <CiAlert variant="warning" dismissible={false} className="mb-4">
          {saveUnavailableReason}
        </CiAlert>
      )}
      {loadError && (
        <CiAlert variant="error" onDismiss={() => setLoadError("")}>
          {loadError}
        </CiAlert>
      )}
      {tenancy && (
        <CiSettingsTenancy
          tenancy={{ ...tenancy, canEnforce, canOverwrite }}
          target={target}
          groups={groups.map((item) => ({
            ...item,
            enforcement: rules[item.id] ?? item.enforcement,
          }))}
          selected={selected}
          pending={pending}
          dirty={dirty}
          editable={editing && canUpdate}
          unavailable={Boolean(saveUnavailableReason)}
          onTargetChange={(next) => {
            if (ciSettingsTargetKey(next) === ciSettingsTargetKey(target))
              return;
            if (dirty) setRequestedTarget(next);
            else void switchTarget(next);
          }}
          onRule={(ids, rule) => {
            setRules((current) => ({
              ...current,
              ...Object.fromEntries(
                ids.map((id) => [
                  id,
                  [
                    ...(current[id] ??
                      groups.find((item) => item.id === id)?.enforcement ??
                      []),
                    rule,
                  ],
                ]),
              ),
            }));
            setDirty(true);
            setMessage("");
          }}
          onRemoveRule={(id, index) => {
            setRules((current) => ({
              ...current,
              [id]: (
                current[id] ??
                groups.find((item) => item.id === id)?.enforcement ??
                []
              ).filter((_, i) => i !== index),
            }));
            setDirty(true);
            setMessage("");
          }}
          onBusy={setPending}
        />
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label="Settings groups"
          className="flex min-w-0 flex-wrap content-start gap-2 self-start rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-col"
        >
          <p className="w-full px-2 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Settings groups
          </p>
          {groups.map((item) => (
            <Button
              key={item.id}
              variant={selected === item.id ? "secondary" : "ghost"}
              className="min-h-11 max-w-full justify-start whitespace-normal break-words text-start lg:w-full"
              aria-current={selected === item.id ? "page" : undefined}
              disabled={pending}
              aria-controls="settings-group-panel"
              onClick={() => {
                setSelected(item.id);
                setMessage("");
              }}
            >
              {item.title}
            </Button>
          ))}
        </nav>
        {group ? (
          <section
            id="settings-group-panel"
            aria-label={group.title}
            aria-busy={pending}
            className="min-w-0 rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="h-11"
                  aria-pressed={json}
                  disabled={pending}
                  onClick={() => setJson(!json)}
                >
                  {json ? <List aria-hidden /> : <Braces aria-hidden />}
                  {json ? "Form view" : "JSON view"}
                </Button>
                {canUpdate && !editing && (
                  <Button
                    className="h-11"
                    onClick={() => {
                      setEditing(true);
                      setJson(false);
                      setMessage("");
                    }}
                  >
                    <Pencil aria-hidden />
                    Edit settings
                  </Button>
                )}
              </div>
            </div>
            <div className="min-w-0 p-4 sm:p-6">
              {!!group.lockedFields?.length && (
                <CiAlert variant="info" dismissible={false} className="mb-4">
                  Some fields are enforced by System and cannot be changed here.
                  Their previous local values are preserved.
                </CiAlert>
              )}
              {message && (
                <CiAlert
                  variant="success"
                  className="mb-4"
                  onDismiss={() => setMessage("")}
                >
                  {message}
                </CiAlert>
              )}
              {json && (
                <div className="space-y-4">
                  <pre
                    tabIndex={0}
                    aria-label={`${group.title} JSON`}
                    className="max-h-[36rem] overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {JSON.stringify(
                      form
                        .updates(draft ?? form.data)
                        .find((item) => item.id === group.id)?.value,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
              <CiSmartForm
                key={`${ciSettingsTargetKey(target)}:${groups.map((item) => `${item.id}:${item.revision}`).join("|")}:${editing}`}
                specifications={{
                  ...form.specifications,
                  buttons: [
                    ...(editing
                      ? [
                          {
                            id: "cancel",
                            label: "Cancel",
                            type: "cancel" as const,
                            validate: false,
                          },
                        ]
                      : []),
                    ...(canUpdate
                      ? [
                          {
                            id: "save",
                            label: "Save",
                            type: "save" as const,
                            pendingLabel: "Saving…",
                            disabled:
                              !editing || Boolean(saveUnavailableReason),
                          },
                        ]
                      : []),
                    ...(onClose
                      ? [
                          {
                            id: "close",
                            label: "Close",
                            type: "cancel" as const,
                            callback: "close",
                            validate: false,
                          },
                        ]
                      : []),
                  ],
                }}
                data={form.data}
                disabled={pending}
                onValuesChange={(values) => {
                  setDraft(values);
                  setDirty(true);
                  setMessage("");
                }}
                onValidationErrors={(errors) => {
                  setJson(false);
                  const invalid = form.invalidGroup(errors);
                  if (invalid) setSelected(invalid);
                }}
                callbacks={{
                  cancel: () => {
                    setEditing(false);
                    setDraft(undefined);
                    setRules({});
                    setDirty(false);
                    setMessage("");
                  },
                  close,
                }}
                onSubmit={async (values) => {
                  if (!canUpdate || !editing || saveUnavailableReason) return;
                  setPending(true);
                  setMessage("");
                  try {
                    const updates = form
                      .updates(values)
                      .map((item) =>
                        rules[item.id]
                          ? { ...item, enforcement: rules[item.id] }
                          : item,
                      );
                    const result = await onSave(
                      updates,
                      tenancy ? target : undefined,
                    );
                    if (!result.ok) throw new Error(result.message);
                    setGroups(result.groups);
                    setDraft(undefined);
                    setRules({});
                    setDirty(false);
                    setMessage(
                      "All settings sections saved. Existing browser preferences remain in effect.",
                    );
                  } finally {
                    setPending(false);
                  }
                }}
              />
            </div>
          </section>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No settings groups are registered.
          </p>
        )}
      </div>
      {onClose && (
        <CiAlertDialog
          open={confirmClose}
          onOpenChange={setConfirmClose}
          title="Discard edits and close?"
          description="Your unsaved changes across all sections will be discarded."
          confirmLabel="Discard and close"
          onConfirm={onClose}
        />
      )}
      <CiAlertDialog
        open={requestedTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setRequestedTarget(undefined);
        }}
        title="Discard edits and switch scope?"
        description="Unsaved values and enforcement rules across all sections will be discarded."
        confirmLabel="Discard and switch"
        onConfirm={() => {
          if (requestedTarget) return switchTarget(requestedTarget);
        }}
      />
    </section>
  );
}
