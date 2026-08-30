/** Declarative application-owned seeder definition. */
export type CiSeederDefinition = {
  /** Stable lowercase kebab-case identifier used for provenance and cleanup. */
  id: string;
  title: string;
  description?: string;
  /** Capability/resource populated by the seeder, for example `platform.tenants`. */
  resource: string;
  /** Directory relative to the application seeder root. */
  dataDirectory: string;
  /** JSON files relative to `dataDirectory`, merged in declaration order. */
  dataFiles: readonly string[];
  /** Trusted application operation ID used to create the configured data. */
  createApi: string;
  /** Trusted application operation ID used to garbage-collect this seeder's data. */
  cleanupApi: string;
};
