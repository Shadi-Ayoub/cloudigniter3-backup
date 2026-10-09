export type DocsEdition = "preview" | "public" | "developer";

export function docsEdition(value = process.env.DOCS_EDITION): DocsEdition {
  if (value === undefined) return "preview";
  if (value === "preview" || value === "public" || value === "developer")
    return value;
  throw new Error("DOCS_EDITION must be preview, public, or developer.");
}

export function includesCompanyDocs(edition: DocsEdition) {
  return edition !== "public";
}
