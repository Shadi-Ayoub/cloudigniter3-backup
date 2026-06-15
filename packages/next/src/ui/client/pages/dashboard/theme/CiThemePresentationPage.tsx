"use client";

import React from "react";

type TokenGroup = {
  title: string;
  description: string;
  tokens: string[];
};

const SYSTEM_COLOR_GROUPS: TokenGroup[] = [
  {
    title: "System Colors",
    description:
      "Use these tokens for normal application surfaces, text, borders, inputs, and action states.",
    tokens: [
      "--color-background",
      "--color-foreground",
      "--color-surface",
      "--color-surface-foreground",
      "--color-surface-muted",
      "--color-surface-muted-foreground",
      "--color-card",
      "--color-card-foreground",
      "--color-popover",
      "--color-popover-foreground",
      "--color-primary",
      "--color-primary-foreground",
      "--color-secondary",
      "--color-secondary-foreground",
      "--color-muted",
      "--color-muted-foreground",
      "--color-accent",
      "--color-accent-foreground",
      "--color-border",
      "--color-input",
      "--color-ring",
    ],
  },
];

const STATUS_COLOR_GROUPS: TokenGroup[] = [
  {
    title: "Status Colors",
    description:
      "Use solid status tokens for buttons, badges, and icons. Use status surface tokens for alerts and soft feedback panels.",
    tokens: [
      "--color-success",
      "--color-success-foreground",
      "--color-success-surface",
      "--color-success-surface-foreground",
      "--color-success-border",
      "--color-info",
      "--color-info-foreground",
      "--color-info-surface",
      "--color-info-surface-foreground",
      "--color-info-border",
      "--color-warning",
      "--color-warning-foreground",
      "--color-warning-surface",
      "--color-warning-surface-foreground",
      "--color-warning-border",
      "--color-danger",
      "--color-danger-foreground",
      "--color-danger-surface",
      "--color-danger-surface-foreground",
      "--color-danger-border",
    ],
  },
];

const PALETTE_PREFIXES = [
  "--color-ci-gray",
  "--color-ci-blue",
  "--color-ci-green",
  "--color-ci-amber",
  "--color-ci-red",
] as const;

const PALETTE_STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

const TYPOGRAPHY_TOKENS = [
  "--font-sans",
  "--font-serif",
  "--font-mono",
  "--text-xs",
  "--text-sm",
  "--text-base",
  "--text-lg",
  "--text-xl",
  "--text-2xl",
  "--text-3xl",
  "--text-4xl",
  "--text-5xl",
  "--font-weight-normal",
  "--font-weight-medium",
  "--font-weight-semibold",
  "--font-weight-bold",
  "--leading-tight",
  "--leading-snug",
  "--leading-normal",
  "--leading-relaxed",
];

const RADIUS_TOKENS = [
  "--radius-xs",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-2xl",
  "--radius-3xl",
  "--radius",
];

const SHADOW_TOKENS = [
  "--shadow-2xs",
  "--shadow-xs",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
  "--shadow-xl",
  "--shadow-2xl",
];

const LAYOUT_TOKENS = [
  "--spacing-primary-header-height",
  "--spacing-secondary-header-height",
  "--spacing-breadcrumb-height",
  "--spacing-page-header-height",
  "--spacing-footer-height",
  "--spacing-sidebar-width",
  "--spacing-sidebar-collapsed-width",
  "--spacing-content-max-width",
];

const Z_INDEX_TOKENS = [
  "--z-index-base",
  "--z-index-raised",
  "--z-index-sticky",
  "--z-index-layout",
  "--z-index-header",
  "--z-index-sidebar",
  "--z-index-menu",
  "--z-index-dropdown",
  "--z-index-popover",
  "--z-index-overlay-1",
  "--z-index-overlay-2",
  "--z-index-tooltip",
  "--z-index-overlay",
  "--z-index-modal",
  "--z-index-toast",
  "--z-index-debug",
  "--z-index-dev-beacon",
  "--z-index-debug-probe",
];

const MOTION_TOKENS = [
  "--ease-in",
  "--ease-out",
  "--ease-in-out",
  "--duration-fast",
  "--duration-normal",
  "--duration-slow",
  "--animate-spin",
  "--animate-ping",
  "--animate-pulse",
  "--animate-bounce",
];

const CUSTOM_ANIMATION_UTILITIES = [
  {
    name: "animate-ci-ping",
    className: "animate-[ci-ping_1.5s_ease-out_infinite]",
    description: "Expanding pulse ring.",
  },
  {
    name: "animate-ci-pulse",
    className: "animate-[ci-pulse_1.2s_ease-in-out_infinite]",
    description: "Soft breathing pulse.",
  },
];

/**
 * Reads a CSS variable value from the document root.
 */
function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";

  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Converts a CSS token name into the equivalent Tailwind-friendly class hint.
 */
function getClassHint(tokenName: string): string {
  return tokenName
    .replace("--color-", "")
    .replace("--spacing-", "")
    .replace("--z-index-", "z-");
}

/**
 * Returns true when a token is a color token.
 */
function isColorToken(tokenName: string): boolean {
  return tokenName.startsWith("--color-");
}

/**
 * Creates a runtime snapshot of the currently applied theme tokens.
 */
function createThemeSnapshot() {
  const tokens = [
    ...SYSTEM_COLOR_GROUPS.flatMap((group) => group.tokens),
    ...STATUS_COLOR_GROUPS.flatMap((group) => group.tokens),
    ...PALETTE_PREFIXES.flatMap((prefix) =>
      PALETTE_STEPS.map((step) => `${prefix}-${step}`),
    ),
    ...TYPOGRAPHY_TOKENS,
    ...RADIUS_TOKENS,
    ...SHADOW_TOKENS,
    ...LAYOUT_TOKENS,
    ...Z_INDEX_TOKENS,
    ...MOTION_TOKENS,
  ];

  return Object.fromEntries(tokens.map((token) => [token, readCssVar(token)]));
}

/**
 * Displays one theme token with its runtime value.
 */
function TokenRow({
  token,
  value,
  showRawName,
}: {
  token: string;
  value: string;
  showRawName: boolean;
}) {
  const label = showRawName ? token : getClassHint(token);
  const displayValue = value || `var(${token})`;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-3 text-sm md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_80px]">
      <div className="font-mono text-xs text-foreground">{label}</div>

      <div className="break-all font-mono text-xs text-muted-foreground">
        {displayValue}
      </div>

      {isColorToken(token) ? (
        <div
          className="h-8 rounded-md border border-border"
          style={{ backgroundColor: `var(${token})` }}
          title={displayValue}
        />
      ) : null}
    </div>
  );
}

/**
 * Displays a standard theme section.
 */
function ThemeSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

/**
 * Displays semantic or status token groups.
 */
function TokenGroupCard({
  group,
  snapshot,
  showRawName,
}: {
  group: TokenGroup;
  snapshot: Record<string, string>;
  showRawName: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-card-foreground">{group.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {group.description}
        </p>
      </div>

      <div className="space-y-2">
        {group.tokens.map((token) => (
          <TokenRow
            key={token}
            token={token}
            value={snapshot[token] ?? ""}
            showRawName={showRawName}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Displays one raw palette scale.
 */
function PaletteScale({
  prefix,
  snapshot,
}: {
  prefix: string;
  snapshot: Record<string, string>;
}) {
  const label = prefix.replace("--color-ci-", "");

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold capitalize text-card-foreground">
          {label}
        </h3>

        <span className="font-mono text-xs text-muted-foreground">
          {prefix}-*
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-11">
        {PALETTE_STEPS.map((step) => {
          const token = `${prefix}-${step}`;
          const value = snapshot[token] ?? "";

          return (
            <div key={token} className="space-y-2">
              <div
                className="h-14 rounded-md border border-border"
                style={{ backgroundColor: `var(${token})` }}
                title={`${token}: ${value}`}
              />

              <div className="text-center font-mono text-xs text-muted-foreground">
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 *
 * Custom Animation Utilities presentation
 */
function AnimationUtilityPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CUSTOM_ANIMATION_UTILITIES.map((utility) => (
        <div
          key={utility.name}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="mb-5">
            <h3 className="font-mono text-sm font-semibold text-card-foreground">
              {utility.name}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {utility.description}
            </p>
          </div>

          <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-muted">
            <span className="relative flex size-8">
              <span
                className={[
                  "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75",
                  utility.className,
                ].join(" ")}
              />

              <span className="relative inline-flex size-8 rounded-full bg-primary" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main CloudIgniter theme presentation page.
 */
export function CiThemePresentationPage() {
  const [showRawName, setShowRawName] = React.useState(false);
  const [snapshot, setSnapshot] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setSnapshot(createThemeSnapshot());
  }, []);

  const jsonForCopy = React.useMemo(() => {
    return JSON.stringify(snapshot, null, 2);
  }, [snapshot]);

  const handleRefresh = React.useCallback(() => {
    setSnapshot(createThemeSnapshot());
  }, []);

  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(jsonForCopy);
  }, [jsonForCopy]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-header border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              CloudIgniter Theme System
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Developer visibility page for semantic tokens, status tokens,
              layout values, typography, radius, shadow, and motion.
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
            >
              Copy JSON
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
            >
              Refresh
            </button>

            <label className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={showRawName}
                onChange={(event) => setShowRawName(event.target.checked)}
                className="accent-primary"
              />
              Raw names
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            Developer Guidance
          </h2>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-success-border bg-success-surface p-4 text-success-surface-foreground">
              <h3 className="font-semibold">Recommended</h3>
              <p className="mt-1 text-sm">
                Use semantic tokens in application components.
              </p>
              <code className="mt-3 block rounded bg-background/60 p-3 text-xs">
                bg-background text-foreground border-border bg-primary
                text-primary-foreground
              </code>
            </div>

            <div className="rounded-lg border border-warning-border bg-warning-surface p-4 text-warning-surface-foreground">
              <h3 className="font-semibold">Avoid</h3>
              <p className="mt-1 text-sm">
                Avoid raw palette tokens unless building low-level theme
                previews or primitives.
              </p>
              <code className="mt-3 block rounded bg-background/60 p-3 text-xs">
                bg-ci-gray-100 text-ci-blue-700 border-ci-red-300
              </code>
            </div>
          </div>
        </section>

        <ThemeSection
          title="System Colors"
          description="The primary tokens developers should use for normal application UI."
        >
          {SYSTEM_COLOR_GROUPS.map((group) => (
            <TokenGroupCard
              key={group.title}
              group={group}
              snapshot={snapshot}
              showRawName={showRawName}
            />
          ))}
        </ThemeSection>

        <ThemeSection
          title="Status Colors"
          description="Feedback tokens for success, info, warning, and danger states."
        >
          {STATUS_COLOR_GROUPS.map((group) => (
            <TokenGroupCard
              key={group.title}
              group={group}
              snapshot={snapshot}
              showRawName={showRawName}
            />
          ))}
        </ThemeSection>

        <ThemeSection
          title="Raw Palette"
          description="Raw palette scales are the source ingredients. Prefer semantic tokens in components."
        >
          <div className="space-y-4">
            {PALETTE_PREFIXES.map((prefix) => (
              <PaletteScale key={prefix} prefix={prefix} snapshot={snapshot} />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Typography">
          <div className="space-y-2">
            {TYPOGRAPHY_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Radius">
          <div className="space-y-2">
            {RADIUS_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Shadow">
          <div className="space-y-2">
            {SHADOW_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Layout Tokens">
          <div className="space-y-2">
            {LAYOUT_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Z-Index Scale">
          <div className="space-y-2">
            {Z_INDEX_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection title="Motion Tokens">
          <div className="space-y-2">
            {MOTION_TOKENS.map((token) => (
              <TokenRow
                key={token}
                token={token}
                value={snapshot[token] ?? ""}
                showRawName={showRawName}
              />
            ))}
          </div>
        </ThemeSection>

        <ThemeSection
          title="Custom Animation Utilities"
          description="Visual preview of CloudIgniter custom animation utilities."
        >
          <AnimationUtilityPreview />
        </ThemeSection>
      </div>
    </main>
  );
}
