/** Serialize async confirmations and bind consent to the exact current draft. */
export function createDiscardGuard({
  getDraft,
  getRevision,
  isClosing,
  ask,
  onPending,
  onError,
}) {
  let pending = false;
  const check = async () => {
    const draft = getDraft();
    if (pending || isClosing() || draft?.saving) return false;
    if (!draft || draft.saved === draft.getValue()) return true;
    const revision = getRevision();
    const saved = draft.saved;
    const content = draft.getValue();
    pending = true;
    try {
      onPending(true);
      const accepted = await ask(draft);
      return Boolean(
        accepted &&
        !isClosing() &&
        revision === getRevision() &&
        draft === getDraft() &&
        !draft.saving &&
        draft.saved === saved &&
        draft.getValue() === content,
      );
    } catch (error) {
      onError(error);
      return false;
    } finally {
      pending = false;
      onPending(false);
    }
  };
  check.pending = () => pending;
  return check;
}
