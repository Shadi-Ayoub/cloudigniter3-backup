/** Registered application action that can be assigned through privileges. */
export type CiActionDefinition = {
  id: string;
  title: string;
  description?: string;
  sensitive?: boolean;
};
