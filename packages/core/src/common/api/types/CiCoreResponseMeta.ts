/**
 * Generic CloudIgniter response metadata.
 *
 * This type stays platform-level and runtime-agnostic.
 */
export type CiCoreResponseMeta = {
  /**
   * Optional human-readable message.
   */
  message?: string;

  /**
   * Optional original parameter payload reference.
   */
  parameter?: string | null;
};
