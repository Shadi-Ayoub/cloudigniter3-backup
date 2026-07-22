import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

interface CiDevBeaconDiagnosticsBoxProps {
  title: string;
  description?: React.ReactNode;
  entries: Array<[string, string]>;
  emptyMessage: React.ReactNode;
  pendingEntryNames?: readonly string[];
}

export function CiDevBeaconDiagnosticsBox({
  title,
  description,
  entries,
  emptyMessage,
  pendingEntryNames,
}: CiDevBeaconDiagnosticsBoxProps) {
  const pendingNames = new Set<string>(
    (pendingEntryNames ?? []).map((name) => name.toLowerCase()),
  );

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b bg-muted/25 px-4 py-3">
        <div>
          <h5 className="text-sm font-semibold">{title}</h5>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
          {entries.length}
        </span>
      </header>

      {entries.length > 0 ? (
        <div className="max-h-80 overflow-auto">
          <dl className="divide-y">
            {entries.map(([name, value]) => {
              const isPending = pendingNames.has(name.toLowerCase());

              return (
                <div
                  key={name}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 font-mono text-xs text-muted-foreground">
                    {name}
                  </div>

                  <div
                    aria-busy={isPending}
                    aria-live="polite"
                    className="min-w-0 text-right font-mono text-xs"
                  >
                    {isPending ? (
                      <span
                        role="status"
                        className="inline-flex items-center justify-end text-muted-foreground"
                      >
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-3.5 animate-spin"
                        />

                        <span className="sr-only">Refreshing {name}</span>
                      </span>
                    ) : (
                      <span className="break-all">{value}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
