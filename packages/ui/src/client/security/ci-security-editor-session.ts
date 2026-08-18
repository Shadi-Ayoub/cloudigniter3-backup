import type { CiSecurityRecord } from "@cloudigniter/core/types";

export type CiSecurityEditorSession = {
  mode: "create" | "edit";
  draft: CiSecurityRecord;
};

/**
 * Accepts empty and otherwise valid intermediate kebab identifiers while typing.
 *
 * A trailing hyphen is allowed temporarily so a user can continue with the next
 * segment. Final form validation remains stricter and rejects that trailing
 * hyphen before save.
 */
export function ciIsSecurityIdentifierInputAllowed(value: string): boolean {
  return /^(?:|[a-z][a-z0-9]*(?:-[a-z0-9]+)*-?)$/.test(value);
}

/** Replaces editable form data without changing whether the session creates or edits. */
export function ciUpdateSecurityEditorSessionDraft(
  session: CiSecurityEditorSession,
  draft: CiSecurityRecord
): CiSecurityEditorSession {
  return { ...session, draft };
}

/** Existing records lock stable identity fields; create drafts remain editable. */
export function ciIsSecurityIdentifierLocked(
  session: CiSecurityEditorSession
): boolean {
  return session.mode === "edit";
}
