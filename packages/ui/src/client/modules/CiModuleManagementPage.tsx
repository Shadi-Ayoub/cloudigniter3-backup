"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, LockKeyhole, RefreshCw, Settings2 } from "lucide-react";
import { CI_FIXED_MODULES } from "@cloudigniter/core/lib";
import type {
  CiExtensionCatalogEntry,
  CiExtensionCommand,
  CiExtensionConfiguration,
} from "@cloudigniter/core/types";
import type { CiModuleManagementPageProps } from "@ci-ui/types";
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/shadcn";
import { CiManagementHeader } from "../components/management-header/CiManagementHeader";
import { CiAlert } from "../feedback/CiAlert";
import { CiAlertDialog } from "../feedback/CiAlertDialog";
import { ciModuleManagementMessages } from "./ci-module-management-messages";

export function CiModuleManagementPage({
  initialCatalog,
  initialError,
  onReload,
  onCommand,
  moduleHref = (id) => `/dashboard/extensions/${id}`,
  messages,
  locale = "en",
}: CiModuleManagementPageProps) {
  const copy = { ...ciModuleManagementMessages, ...messages };
  const [catalog, setCatalog] = useState(initialCatalog);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [remove, setRemove] = useState<CiExtensionCatalogEntry>();
  const [removeRevision, setRemoveRevision] = useState(0);
  const [confirmation, setConfirmation] = useState("");
  const [update, setUpdate] = useState(false);
  const [settings, setSettings] = useState<CiExtensionCatalogEntry>();
  const [configuration, setConfiguration] = useState<CiExtensionConfiguration>(
    {}
  );
  const [settingsRevision, setSettingsRevision] = useState(0);
  const pending = catalog.entries.some((entry) =>
    ["installing", "uninstalling"].includes(entry.installation?.status ?? "")
  );
  async function reload() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await onReload();
      if (result.ok) {
        setCatalog(result.body);
        setError(undefined);
      } else setError(result.body.error);
    } catch {
      setError(copy.refreshError);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!pending) return;
    let remaining = 60;
    const timer = setInterval(() => {
      if (--remaining <= 0) clearInterval(timer);
      else void reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [pending, onReload]);
  async function command(
    entry: CiExtensionCatalogEntry,
    action: CiExtensionCommand["action"],
    extra: Partial<CiExtensionCommand> = {}
  ) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await onCommand({
        id: entry.manifest.id,
        action,
        revision: catalog.revision,
        ...extra,
      });
      if (!result.ok) {
        setError(result.body.error);
        const fresh = await onReload();
        if (fresh.ok) setCatalog(fresh.body);
        return false;
      }
      setCatalog(result.body);
      setNotice(
        action === "install"
          ? copy.installRequested
          : action === "uninstall"
          ? copy.uninstallRequested
          : copy.saved
      );
      return true;
    } catch {
      setError(copy.requestError);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6" aria-busy={busy}>
      <CiManagementHeader
        title={copy.title}
        description={copy.description}
        titleIcon={<Boxes />}
        titleBadge={copy.badge}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {copy.extensionCount(catalog.entries.length)}
        </p>
        <Button variant="outline" onClick={() => void reload()} disabled={busy}>
          <RefreshCw
            aria-hidden
            className={busy ? "animate-spin motion-reduce:animate-none" : ""}
          />
          {busy ? copy.working : copy.refresh}
        </Button>
      </div>
      {error && (
        <CiAlert
          key={error}
          variant="error"
          title={copy.operationErrorTitle}
          dismissLabel={copy.dismissAlert}
          onDismiss={() => setError(undefined)}
        >
          {error}
        </CiAlert>
      )}
      {notice && (
        <CiAlert
          key={notice}
          variant="success"
          dismissLabel={copy.dismissAlert}
          onDismiss={() => setNotice(undefined)}
        >
          {notice}
        </CiAlert>
      )}
      {pending && (
        <CiAlert variant="info" dismissible={false}>
          {copy.pending}
        </CiAlert>
      )}
      {!catalog.entries.length && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {copy.empty}
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {catalog.entries.map((entry) => {
          const { manifest, installation } = entry;
          const status = installation?.status ?? "not-installed";
          const installed = status === "disabled" || status === "enabled";
          const available =
            entry.detected &&
            entry.compatible &&
            entry.backendAvailable !== false;
          return (
            <article
              key={manifest.id}
              className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{manifest.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {manifest.id} · v{manifest.version}
                    {installation &&
                    installation.manifest.version !== manifest.version
                      ? ` · ${copy.installedVersion(
                          installation.manifest.version
                        )}`
                      : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {copy.status[status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {manifest.description}
              </p>
              {!entry.detected && (
                <CiAlert variant="warning" dismissible={false}>
                  {copy.missingSource}
                </CiAlert>
              )}
              {!entry.compatible && (
                <CiAlert variant="warning" dismissible={false}>
                  {copy.incompatible}
                </CiAlert>
              )}
              {entry.backendAvailable === false && (
                <CiAlert variant="warning" dismissible={false}>
                  {copy.backendRequired}
                </CiAlert>
              )}
              {installation?.error && (
                <CiAlert variant="error" dismissible={false}>
                  {installation.error}
                </CiAlert>
              )}
              {installation && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer py-2">
                    {copy.resourceDetails}
                  </summary>
                  <dl className="space-y-2 pt-2">
                    <dt>{copy.provider}</dt>
                    <dd>{installation.infrastructure.provider}</dd>
                    <dt>{copy.infrastructureId}</dt>
                    <dd className="break-all font-mono">
                      {installation.infrastructure.id}
                    </dd>
                  </dl>
                </details>
              )}
              {manifest.permissions?.length ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer py-2">
                    {copy.permissions}
                  </summary>
                  <ul className="list-inside list-disc space-y-1">
                    {manifest.permissions.map((permission) => (
                      <li key={permission.id}>{permission.title}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2">
                {!installation && (
                  <Button
                    disabled={busy || !available}
                    onClick={() => void command(entry, "install")}
                  >
                    {copy.install}
                  </Button>
                )}
                {status === "installing" && (
                  <Button
                    variant="outline"
                    disabled={busy || !available}
                    onClick={() => void command(entry, "install")}
                  >
                    {copy.retryInstall}
                  </Button>
                )}
                {status === "disabled" && (
                  <Button
                    disabled={
                      busy ||
                      !available ||
                      manifest.version !== installation?.manifest.version
                    }
                    onClick={() => void command(entry, "enable")}
                  >
                    {copy.enable}
                  </Button>
                )}
                {status === "enabled" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void command(entry, "disable")}
                    >
                      {copy.disable}
                    </Button>
                    <Button asChild variant="outline">
                      <a href={moduleHref(manifest.id)}>{copy.open}</a>
                    </Button>
                  </>
                )}
                {installed && !!manifest.settings?.length && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setSettings(entry);
                      setConfiguration(installation!.configuration);
                      setSettingsRevision(catalog.revision);
                    }}
                  >
                    <Settings2 aria-hidden />
                    {copy.settings}
                  </Button>
                )}
                {installation && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setUpdate(true)}
                  >
                    {copy.update}
                  </Button>
                )}
                {installation &&
                  !["enabled", "installing"].includes(status) && (
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => {
                        setRemove(entry);
                        setRemoveRevision(catalog.revision);
                        setConfirmation("");
                      }}
                    >
                      {status === "uninstalling"
                        ? copy.retryUninstall
                        : copy.uninstall}
                    </Button>
                  )}
              </div>
              {status === "enabled" && (
                <p className="text-xs text-muted-foreground">
                  {copy.disableFirst}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <section className="rounded-xl border border-border p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <LockKeyhole aria-hidden className="size-4" />
          {copy.coreTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.coreDescription}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...CI_FIXED_MODULES]
            .map((item) => ({
              ...item,
              name: copy.coreModuleNames[item.id] ?? item.name,
            }))
            .sort((a, b) => a.name.localeCompare(b.name, locale))
            .map((item) => (
              <Badge key={item.id} variant="secondary">
                {item.name}
              </Badge>
            ))}
        </div>
      </section>
      <CiAlertDialog
        open={!!remove}
        onOpenChange={(open) => {
          if (!open) setRemove(undefined);
        }}
        variant="destructive"
        title={copy.uninstallTitle(
          remove?.manifest.name ?? copy.moduleFallback
        )}
        description={copy.uninstallDescription}
        confirmLabel={copy.confirmUninstall}
        cancelLabel={copy.cancel}
        pendingLabel={copy.working}
        confirmDisabled={confirmation !== remove?.manifest.id}
        pending={busy}
        closeOnConfirm={false}
        onConfirm={async () => {
          if (
            remove &&
            (await command(remove, "uninstall", {
              confirmation,
              revision: removeRevision,
            }))
          )
            setRemove(undefined);
        }}
      >
        <Label htmlFor="module-removal-confirmation">
          {copy.confirmationPrompt(remove?.manifest.id ?? "")}
        </Label>
        <Input
          id="module-removal-confirmation"
          autoComplete="off"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={busy}
        />
        {error && (
          <p role="alert" className="mt-3 text-danger">
            {error}
          </p>
        )}
      </CiAlertDialog>
      <Dialog open={update} onOpenChange={setUpdate}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{copy.updateTitle}</DialogTitle>
            <DialogDescription>{copy.updateDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setUpdate(false)}>{copy.gotIt}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!settings}
        onOpenChange={(open) => {
          if (!open && !busy) setSettings(undefined);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {copy.settingsTitle(
                settings?.manifest.name ?? copy.moduleFallback
              )}
            </DialogTitle>
            <DialogDescription>{copy.settingsDescription}</DialogDescription>
          </DialogHeader>
          {settings?.manifest.settings?.map((setting) => (
            <div key={setting.key} className="space-y-2">
              <Label htmlFor={`module-setting-${setting.key}`}>
                {setting.title}
              </Label>
              {typeof setting.default === "boolean" ? (
                <input
                  id={`module-setting-${setting.key}`}
                  type="checkbox"
                  className="ms-3 size-5 accent-primary"
                  checked={configuration[setting.key] === true}
                  disabled={busy}
                  onChange={(event) =>
                    setConfiguration((previous) => ({
                      ...previous,
                      [setting.key]: event.target.checked,
                    }))
                  }
                />
              ) : (
                <select
                  id={`module-setting-${setting.key}`}
                  className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-ring"
                  value={String(configuration[setting.key])}
                  disabled={busy}
                  onChange={(event) =>
                    setConfiguration((previous) => ({
                      ...previous,
                      [setting.key]: event.target.value,
                    }))
                  }
                >
                  {setting.options?.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setSettings(undefined)}
            >
              {copy.cancel}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  settings &&
                  (await command(settings, "configure", {
                    configuration,
                    revision: settingsRevision,
                  }))
                )
                  setSettings(undefined);
              }}
            >
              {copy.saveSettings}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
