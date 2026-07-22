import type {
  CiModuleManifest,
  CiModulePackageSection,
  CiResolvedModulePackageDependency,
} from "@ci-core/types";

import { CiModuleError } from "./CiModuleError";

const ciValidPackageSections = new Set<CiModulePackageSection>([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]);

export function ciCollectModulePackageDependencies(
  manifests: readonly CiModuleManifest[],
): readonly CiResolvedModulePackageDependency[] {
  const dependencies = new Map<
    string,
    {
      specifier: string;
      sections: Set<CiModulePackageSection>;
      moduleIds: Set<string>;
    }
  >();

  for (const manifest of manifests) {
    for (const dependency of manifest.packageDependencies ?? []) {
      if (!dependency.name.trim() || !dependency.specifier.trim()) {
        throw new CiModuleError({
          code: "INVALID_MANIFEST",
          moduleId: manifest.id,
          message: `Module "${manifest.id}" contains an invalid package dependency.`,
        });
      }

      if (dependency.sections.length === 0) {
        throw new CiModuleError({
          code: "INVALID_MANIFEST",
          moduleId: manifest.id,
          message: `Package "${dependency.name}" does not declare a package.json section.`,
        });
      }

      for (const section of dependency.sections) {
        if (!ciValidPackageSections.has(section)) {
          throw new CiModuleError({
            code: "INVALID_MANIFEST",
            moduleId: manifest.id,
            message: `Package "${dependency.name}" uses invalid section "${section}".`,
          });
        }
      }

      const current = dependencies.get(dependency.name);

      if (current && current.specifier !== dependency.specifier) {
        throw new CiModuleError({
          code: "PACKAGE_DEPENDENCY_CONFLICT",
          moduleId: manifest.id,
          message:
            `Package "${dependency.name}" requires conflicting specifiers ` +
            `"${current.specifier}" and "${dependency.specifier}".`,
        });
      }

      const resolved = current ?? {
        specifier: dependency.specifier,
        sections: new Set<CiModulePackageSection>(),
        moduleIds: new Set<string>(),
      };

      for (const section of dependency.sections) {
        resolved.sections.add(section);
      }

      resolved.moduleIds.add(manifest.id);
      dependencies.set(dependency.name, resolved);
    }
  }

  return [...dependencies.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, dependency]) => ({
      name,
      specifier: dependency.specifier,
      sections: [...dependency.sections].sort(),
      moduleIds: [...dependency.moduleIds].sort(),
    }));
}
