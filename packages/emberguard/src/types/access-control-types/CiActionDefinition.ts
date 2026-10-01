/** Registered application action that can be assigned through privileges. */
export type CiActionDefinition = {
  id: string;
  title: string;
  description?: string;
  sensitive?: boolean;
  /**
   * Classifies side effects for forced read-only permissions. Without an
   * explicit mode, read/get/list/view/search are reads; all other actions write.
   */
  accessMode?: "read" | "write";
};
