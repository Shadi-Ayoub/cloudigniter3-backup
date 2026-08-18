export type CiImportPackageEntryInput = {
  baseDirectory: string;
  packageName: string;
  subpath?: string;
};

export function ciImportPackageEntry<TModule = Record<string, unknown>>(
  input: CiImportPackageEntryInput,
): Promise<TModule>;
