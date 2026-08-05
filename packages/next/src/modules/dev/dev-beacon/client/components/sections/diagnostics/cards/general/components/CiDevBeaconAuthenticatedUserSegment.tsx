"use client";

import { useMemo, useState } from "react";
import { FileJson2, X } from "lucide-react";

import type { CiUser } from "@cloudigniter/core/types";
import {
  Button,
  CiCodeEditor,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@cloudigniter/ui/client";
import { CiDevBeaconCardRow, CiDevBeaconCardRowGrid } from "@ci-next/modules/dev/dev-beacon/client/components";

interface CiDevBeaconAuthenticatedUserSegmentProps {
  currentUser: CiUser;
}

type CiDecodedJwt =
  | {
      header: unknown;
      payload: unknown;
      signature: {
        displayed: false;
        length: number;
      };
    }
  | {
      error: string;
    };

interface CiJwtDetails {
  label: "Access Token" | "ID Token";
  preview: string;
  decoded: CiDecodedJwt;
}

/**
 * Displays authentication state and, for authenticated sessions, the complete
 * provider-neutral user diagnostics represented by {@link CiUser}.
 */
export function CiDevBeaconAuthenticatedUserSegment({ currentUser }: CiDevBeaconAuthenticatedUserSegmentProps) {
  const [selectedToken, setSelectedToken] = useState<CiJwtDetails | null>(null);
  const isAuthenticated = currentUser.authenticated === true;
  const currentUserId = currentUser.id?.trim() || "—";
  const currentUserRoles = currentUser.roles ?? [];

  const accessToken = useMemo(
    () => ciBuildJwtDetails("Access Token", currentUser.accessToken),
    [currentUser.accessToken],
  );
  const idToken = useMemo(() => ciBuildJwtDetails("ID Token", currentUser.idToken), [currentUser.idToken]);

  return (
    <>
      <CiDevBeaconCardRowGrid title="Authentication Information" columns={1} boxed cellPadding="compact">
        <CiDevBeaconCardRow
          label="Is Authenticated"
          value={isAuthenticated ? "YES" : "NO"}
          valueClassName={
            isAuthenticated
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }
          tooltip="Indicates whether the current request is associated with a valid authenticated user session."
        />

        {isAuthenticated ? (
          <>
            <CiDevBeaconCardRow
              label="Email Verified"
              value={ciFormatBoolean(currentUser.emailVerified)}
              valueClassName={
                currentUser.emailVerified === true
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : undefined
              }
              tooltip="Whether the identity provider reports the user's email address as verified."
            />

            <CiDevBeaconCardRow
              label="User ID"
              value={currentUserId}
              mono
              allowWrap
              tooltip="The unique, stable identifier of the user associated with the current authenticated session."
            />

            <CiDevBeaconCardRow
              label="User Roles"
              value={currentUserRoles.length > 0 ? currentUserRoles : "—"}
              tooltip="Roles or groups assigned to the current user and used for authorization checks."
            />

            <CiDevBeaconCardRow
              label="Email"
              value={ciGetDisplayValue(currentUser.email)}
              tooltip="Email address associated with the authenticated user."
            />

            <CiDevBeaconCardRow
              label="Display Name"
              value={ciGetDisplayValue(currentUser.displayName)}
              tooltip="Human-readable name resolved from the identity provider."
            />

            <CiDevBeaconCardRow
              label="Username"
              value={ciGetDisplayValue(currentUser.username)}
              mono
              allowWrap
              tooltip="Provider-specific username for the authenticated user."
            />

            <CiDevBeaconCardRow
              label="Sign-in Identifier"
              value={ciGetDisplayValue(currentUser.signInId)}
              tooltip="Identifier used to establish the current sign-in session."
            />

            <CiDevBeaconCardRow
              label="Authentication Flow"
              value={ciGetDisplayValue(currentUser.authFlow)}
              mono
              tooltip="Provider-specific authentication flow used to establish the session."
            />

            <CiDevBeaconCardRow
              label="Session Expires"
              value={ciFormatDateTime(currentUser.sessionExpiresAt)}
              tooltip="Expiration time reported by the current authenticated session."
            />

            <CiJwtTokenRow label="Access Token" token={accessToken} onView={setSelectedToken} />

            <CiJwtTokenRow label="ID Token" token={idToken} onView={setSelectedToken} />
          </>
        ) : null}
      </CiDevBeaconCardRowGrid>

      <CiDecodedJwtDialog
        token={selectedToken}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedToken(null);
          }
        }}
      />
    </>
  );
}

function CiJwtTokenRow({
  label,
  token,
  onView,
}: {
  label: CiJwtDetails["label"];
  token: CiJwtDetails | null;
  onView: (token: CiJwtDetails) => void;
}) {
  if (!token) {
    return (
      <CiDevBeaconCardRow
        label={label}
        value="—"
        mono
        tooltip={`${label} is not available for the current authenticated session.`}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
      <span>{label}</span>

      <div className="flex min-w-0 max-w-[75%] items-center justify-end gap-2">
        <code
          className="bg-muted min-w-0 truncate rounded px-1.5 py-px text-right text-xs"
          title="Truncated token preview"
        >
          {token.preview}
        </code>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
          title={`View decoded ${label}`}
          aria-label={`View decoded ${label} JWT`}
          onClick={() => onView(token)}
        >
          <FileJson2 className="size-3.5" aria-hidden="true" />
          View Decoded JWT
        </Button>
      </div>
    </div>
  );
}

function CiDecodedJwtDialog({
  token,
  onOpenChange,
}: {
  token: CiJwtDetails | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={token !== null} modal onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-overlay)",
          }}
        />

        <DialogContent
          className={cn(
            "bg-background text-foreground fixed top-1/2 left-1/2",
            "flex h-[min(48rem,calc(100dvh-2rem))]",
            "w-[min(72rem,calc(100vw-2rem))] max-w-none sm:max-w-none",
            "-translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-xl border shadow-2xl outline-none",
          )}
          style={{
            zIndex: "var(--z-dev-beacon-diagnostics-content)",
          }}
          showCloseButton={false}
          onWheel={(event) => {
            event.stopPropagation();
          }}
          onTouchMove={(event) => {
            event.stopPropagation();
          }}
        >
          <header className="bg-background flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">Decoded {token?.label ?? "JWT"}</DialogTitle>

              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Decoded locally for diagnostics. The token signature has not been verified and is not displayed.
              </DialogDescription>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close decoded JWT viewer"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/80 active:bg-muted",
                  "focus-visible:ring-ring/60 focus-visible:ring-2 focus-visible:outline-none",
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                  "border border-transparent transition-colors",
                )}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </DialogClose>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            <CiCodeEditor
              content={token?.decoded ?? {}}
              options={{
                readOnly: true,
                domReadOnly: true,
                folding: true,
                wordWrap: "on",
                fontSize: 13,
                tabSize: 2,
                padding: {
                  top: 14,
                  bottom: 14,
                },
              }}
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function ciBuildJwtDetails(label: CiJwtDetails["label"], token: string | null | undefined): CiJwtDetails | null {
  const tokenValue = token?.trim();

  if (!tokenValue) {
    return null;
  }

  return {
    label,
    preview: ciTruncateToken(tokenValue),
    decoded: ciDecodeJwt(tokenValue),
  };
}

/** Decodes JWT data for inspection without claiming signature verification. */
function ciDecodeJwt(token: string): CiDecodedJwt {
  try {
    const [encodedHeader, encodedPayload, encodedSignature, ...extraSegments] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature || extraSegments.length > 0) {
      throw new Error("The token is not a three-segment JWT.");
    }

    return {
      header: ciDecodeJwtSegment(encodedHeader),
      payload: ciDecodeJwtSegment(encodedPayload),
      signature: {
        displayed: false,
        length: encodedSignature.length,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The JWT could not be decoded.",
    };
  }
}

function ciDecodeJwtSegment(segment: string): unknown {
  const base64 = segment.replaceAll("-", "+").replaceAll("_", "/");
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binaryValue = globalThis.atob(paddedBase64);
  const bytes = Uint8Array.from(binaryValue, (character) => character.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function ciTruncateToken(token: string): string {
  const leadingCharacterCount = 24;
  const trailingCharacterCount = 12;

  if (token.length <= leadingCharacterCount + trailingCharacterCount + 1) {
    return token;
  }

  return `${token.slice(0, leadingCharacterCount)}…${token.slice(-trailingCharacterCount)}`;
}

function ciGetDisplayValue(value: string | null | undefined): string {
  return value?.trim() || "—";
}

function ciFormatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return value ? "YES" : "NO";
}

function ciFormatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}
