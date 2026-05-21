import { ciIsInternalPath, ciIsStaticFile } from './';

export function ciGetBypassFlag(pathnameNormalized: string) {
  const isInternal = ciIsInternalPath(pathnameNormalized); // quick path filters (belt-and-suspenders with the matcher below)
  const isStatic = ciIsStaticFile(pathnameNormalized);
  return isInternal || isStatic;
}
