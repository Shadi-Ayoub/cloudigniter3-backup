export interface ManualMethodDefinition {
  id?: string;
  label?: string;
  type?: 'method' | 'api';
  category?: string; // Used for grouping methods
  brief?: string; // Short hint about the method
  description?: string; // Detailed description of the method
  signature?: string; // Function signature in TypeScript
  parameters?: { name: string; type: string; description: string }[];
  returns?: { type: string; description: string };
  examples?: { description: string; code: string }[];
  notes?: string;
  seeAlso?: { label: string; link: string }[];
}
