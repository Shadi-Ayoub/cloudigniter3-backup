type IndexedRecord<T> = {
    [key: string]: T | IndexedRecord<T>;
};
export declare function ciMergeObjects<T extends IndexedRecord<any>>(primary: T, secondary: T): T;
export {};
//# sourceMappingURL=ci-merge-objects.d.ts.map