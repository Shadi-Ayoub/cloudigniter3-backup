type IndexedRecord<T> = {
  [key: string]: T | IndexedRecord<T>;
};

export function ciMergeObjects<T extends IndexedRecord<any>>(primary: T, secondary: T): T {
  const result = { ...primary };

  for (const key in secondary) {
    if (
      typeof primary[key] === 'object' &&
      primary[key] !== null &&
      typeof secondary[key] === 'object' &&
      secondary[key] !== null
    ) {
      result[key] = ciMergeObjects(primary[key], secondary[key]);
    } else {
      result[key] = secondary[key];
    }
  }

  return result;
}
