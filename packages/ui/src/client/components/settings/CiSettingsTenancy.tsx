"use client";

import { useEffect, useState } from "react";
import { Building2, LockKeyhole, Copy } from "lucide-react";
import { ciSettingsTargetKey } from "@cloudigniter/core/lib";
import type {
  CiSettingsTarget,
  CiSettingsGroup,
  CiSettingsEnforcementRule,
  CiSettingsTargetOption,
} from "@cloudigniter/core/types";
import type { CiSettingsTenancyProps } from "@ci-ui/types";
import { Button } from "../shadcn/button";
import { CiAlert } from "../../feedback/CiAlert";
import { CiAlertDialog } from "../../feedback/CiAlertDialog";

import { ciSmartFormFieldLabel } from "../../../lib/smart-form/ci-validate-smart-form";

const selectClass =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

/** Tenant discovery, rule drafting and explicit overwrite controls for the shared category form. */
export function CiSettingsTenancy({
  tenancy,
  target,
  groups,
  selected,
  pending,
  dirty,
  editable,
  unavailable,
  onTargetChange,
  onRule,
  onRemoveRule,
  onBusy,
}: {
  tenancy: CiSettingsTenancyProps;
  target: CiSettingsTarget;
  groups: readonly CiSettingsGroup[];
  selected?: string;
  pending: boolean;
  dirty: boolean;
  editable: boolean;
  unavailable: boolean;
  onTargetChange: (target: CiSettingsTarget) => void;
  onRule: (ids: readonly string[], rule: CiSettingsEnforcementRule) => void;
  onRemoveRule: (id: string, index: number) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [options, setOptions] = useState<CiSettingsTargetOption[]>([
    { target: { scope: "global" }, label: "GLOBAL" },
  ]);
  const [nextToken, setNextToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState("");
  const [allGroups, setAllGroups] = useState(false);
  const [allFields, setAllFields] = useState(true);
  const [fields, setFields] = useState<string[]>([]);
  const [allTargets, setAllTargets] = useState(true);
  const [chosen, setChosen] = useState<string[]>([]);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const group = groups.find((item) => item.id === selected);
  const mergeOptions = (items: CiSettingsTargetOption[]) =>
    setOptions((current) => [
      ...new Map(
        [...current, ...items].map((item) => [
          ciSettingsTargetKey(item.target),
          item,
        ]),
      ).values(),
    ]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    tenancy
      .onListTargets()
      .then((page) => {
        if (!active) return;
        mergeOptions(page.items);
        setNextToken(page.nextToken);
        setLoaded(true);
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error ? error.message : "Unable to load tenants.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenancy.onListTargets]);
  useEffect(() => {
    setFields([]);
    setAllFields(true);
  }, [selected]);
  const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label));
  const selectedTargets = sorted.filter((item) =>
    chosen.includes(ciSettingsTargetKey(item.target)),
  );
  const valid =
    (allTargets || selectedTargets.length > 0) &&
    (allGroups || allFields || fields.length > 0);
  const selectedGroups = allGroups ? groups : group ? [group] : [];
  const selectedFields = allGroups || allFields ? ("*" as const) : fields;
  const labels = (rule: CiSettingsEnforcementRule) =>
    rule.targets === "*"
      ? "All tenants, including GLOBAL"
      : rule.targets
          .map(
            (item) =>
              options.find(
                (option) =>
                  ciSettingsTargetKey(option.target) ===
                  ciSettingsTargetKey(item),
              )?.label ?? ciSettingsTargetKey(item),
          )
          .join(", ");

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const page = await tenancy.onListTargets(loaded ? nextToken : undefined);
      mergeOptions(page.items);
      setNextToken(page.nextToken);
      setLoaded(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load tenants.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function overwrite() {
    setConfirmOverwrite(false);
    onBusy(true);
    setError("");
    setOutcome("");
    let completed = 0;
    const failures: string[] = [];
    try {
      let targets = selectedTargets;
      if (allTargets) {
        // Enumerate every page before the first write; never silently limit "all" to loaded options.
        const found = new Map<string, CiSettingsTargetOption>();
        const visited = new Set<string>();
        let token: string | undefined;
        do {
          const page = await tenancy.onListTargets(token);
          for (const item of page.items)
            found.set(ciSettingsTargetKey(item.target), item);
          token = page.nextToken;
          if (token && visited.has(token))
            throw new Error(
              "Tenant discovery repeated a page. No tenants were overwritten.",
            );
          if (token) visited.add(token);
          if (visited.size > 200)
            throw new Error(
              "Too many tenants for one interactive overwrite. Select a smaller set.",
            );
        } while (token);
        targets = [...found.values()];
      }
      const selection = selectedGroups.map((item) => ({
        id: item.id,
        fields: selectedFields,
        systemRevision: item.revision,
      }));
      for (const item of targets) {
        setOutcome(
          `Overwriting ${completed + failures.length + 1} of ${targets.length}: ${item.label}`,
        );
        try {
          await tenancy.onOverwrite(item.target, selection);
          completed++;
        } catch (error) {
          failures.push(
            `${item.label}: ${error instanceof Error ? error.message : "Overwrite failed"}`,
          );
        }
      }
      setOutcome(`Overwritten ${completed} of ${targets.length} targets.`);
      if (failures.length) setError(`Not overwritten: ${failures.join("; ")}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to overwrite settings.",
      );
    } finally {
      onBusy(false);
    }
  }

  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <label className="min-w-0 flex-1 space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="size-4" aria-hidden /> Settings scope
          </span>
          <select
            aria-label="Settings scope"
            className={selectClass}
            value={ciSettingsTargetKey(target)}
            disabled={pending}
            onChange={(event) =>
              onTargetChange(
                event.target.value === "system"
                  ? { scope: "system" }
                  : options.find(
                      (item) =>
                        ciSettingsTargetKey(item.target) === event.target.value,
                    )!.target,
              )
            }
          >
            <option value="system">System — Primary settings</option>
            {sorted.map((item) => (
              <option
                key={ciSettingsTargetKey(item.target)}
                value={ciSettingsTargetKey(item.target)}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {(nextToken || !loaded) && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={loading || pending}
            onClick={loadMore}
          >
            {loading
              ? "Loading tenants…"
              : loaded
                ? "Load more tenants"
                : "Retry tenant list"}
          </Button>
        )}
        <p className="w-full text-sm text-muted-foreground">
          {target.scope === "system"
            ? "Primary settings seed each tenant’s independent copy. Enforcement follows System; overwrites copy saved values once."
            : "This scope has its own saved values. Fields enforced by System are locked; removing enforcement restores local values."}
        </p>
      </div>
      {error && (
        <CiAlert variant="error" onDismiss={() => setError("")}>
          {error}
        </CiAlert>
      )}
      {outcome && (
        <p className="text-sm text-muted-foreground" role="status">
          {outcome}
        </p>
      )}
      {target.scope === "system" &&
        (tenancy.canEnforce || tenancy.canOverwrite) &&
        group && (
          <details className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Enforcement and tenant overwrites
            </summary>
            <fieldset
              disabled={pending || unavailable}
              className="mt-3 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>Settings to apply</span>
                  <select
                    className={selectClass}
                    value={allGroups ? "all" : "group"}
                    onChange={(event) =>
                      setAllGroups(event.target.value === "all")
                    }
                  >
                    <option value="group">Current group: {group.title}</option>
                    <option value="all">All groups in this category</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Apply to tenants</span>
                  <select
                    className={selectClass}
                    value={allTargets ? "all" : "selected"}
                    onChange={(event) =>
                      setAllTargets(event.target.value === "all")
                    }
                  >
                    <option value="all">All tenants, including GLOBAL</option>
                    <option value="selected">Selected tenants / GLOBAL</option>
                  </select>
                </label>
              </div>
              {!allGroups && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Fields in {group.title}
                  </legend>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allFields}
                      onChange={(event) => setAllFields(event.target.checked)}
                    />
                    All fields
                  </label>
                  {!allFields && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[...group.fields]
                        .sort((a, b) =>
                          ciSmartFormFieldLabel(a).localeCompare(
                            ciSmartFormFieldLabel(b),
                          ),
                        )
                        .map((field) => (
                          <label
                            key={field.name}
                            className="flex min-h-11 items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={fields.includes(field.name)}
                              onChange={(event) =>
                                setFields((current) =>
                                  event.target.checked
                                    ? [...current, field.name]
                                    : current.filter(
                                        (name) => name !== field.name,
                                      ),
                                )
                              }
                            />
                            {ciSmartFormFieldLabel(field)}
                          </label>
                        ))}
                    </div>
                  )}
                </fieldset>
              )}
              {!allTargets && (
                <fieldset>
                  <legend className="text-sm font-medium">
                    Selected tenants
                  </legend>
                  <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
                    {sorted.map((item) => (
                      <label
                        key={ciSettingsTargetKey(item.target)}
                        className="flex min-h-11 items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={chosen.includes(
                            ciSettingsTargetKey(item.target),
                          )}
                          onChange={(event) =>
                            setChosen((current) =>
                              event.target.checked
                                ? [...current, ciSettingsTargetKey(item.target)]
                                : current.filter(
                                    (key) =>
                                      key !== ciSettingsTargetKey(item.target),
                                  ),
                            )
                          }
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  {nextToken && (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={loading}
                      onClick={loadMore}
                    >
                      Load more tenants
                    </Button>
                  )}
                </fieldset>
              )}
              <div className="flex flex-wrap gap-2">
                {tenancy.canEnforce && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={!valid || !editable}
                    onClick={() =>
                      onRule(
                        selectedGroups.map((item) => item.id),
                        {
                          fields: selectedFields,
                          targets: allTargets
                            ? "*"
                            : selectedTargets.map((item) => item.target),
                        },
                      )
                    }
                  >
                    <LockKeyhole aria-hidden />
                    Add enforcement rule
                  </Button>
                )}
                {tenancy.canOverwrite && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={!valid || dirty || !loaded}
                    onClick={() => setConfirmOverwrite(true)}
                  >
                    <Copy aria-hidden />
                    Overwrite from saved System settings…
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Enforcement rules are saved with the form’s single Save button.
                All tenants includes future tenants. Overwrite changes existing
                copies once and preserves unrelated fields. Save or cancel
                drafts before overwriting.
              </p>
              {(group.enforcement?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rules for {group.title}</p>
                  {group.enforcement!.map((rule, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                    >
                      <span>
                        {rule.fields === "*"
                          ? "All fields"
                          : rule.fields.join(", ")}{" "}
                        → {labels(rule)}
                      </span>
                      {tenancy.canEnforce && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!editable}
                          onClick={() => onRemoveRule(group.id, index)}
                          aria-label={`Remove enforcement rule ${index + 1}`}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </details>
        )}
      <CiAlertDialog
        open={confirmOverwrite}
        onOpenChange={setConfirmOverwrite}
        title="Overwrite tenant settings?"
        description={`Copy saved System values for ${allGroups ? "all groups in this category" : `${group?.title ?? "the current group"} (${selectedFields === "*" ? "all fields" : selectedFields.join(", ")})`} to ${allTargets ? "all current tenants, including GLOBAL" : selectedTargets.map((item) => item.label).join(", ")}? This replaces their local values. Each target is saved atomically; failures are reported separately.`}
        confirmLabel="Overwrite selected settings"
        onConfirm={overwrite}
      />
    </div>
  );
}
