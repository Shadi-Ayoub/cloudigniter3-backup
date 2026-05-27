export function resolvePath(obj: any, path: string): any {
  return path.split('.').reduce((acc, token) => {
    if (acc && typeof acc === 'object' && token in acc) {
      return acc[token];
    }
    return undefined;
  }, obj);
}
