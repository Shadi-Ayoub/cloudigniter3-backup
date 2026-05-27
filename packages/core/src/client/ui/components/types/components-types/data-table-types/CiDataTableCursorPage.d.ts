export type CiDataTableCursorPage<T> = {
    rows: T[];
    nextCursor?: string | null;
    /**
     * Optional: only if your backend supports backward paging.
     * DynamoDB does not naturally support "prev" without additional patterns.
     * Most teams implement "prev" by keeping a local cursor stack in the UI.
     */
    prevCursor?: string | null;
};
//# sourceMappingURL=CiDataTableCursorPage.d.ts.map