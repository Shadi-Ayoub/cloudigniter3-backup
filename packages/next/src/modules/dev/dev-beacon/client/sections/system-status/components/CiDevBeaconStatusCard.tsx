import { type ReactNode } from "react";

export function CiDevBeaconStatusCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>

      <div className="space-y-2">{children}</div>
    </section>
  );
}
