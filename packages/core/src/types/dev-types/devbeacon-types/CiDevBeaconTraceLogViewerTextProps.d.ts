export interface CiDevBeaconTraceLogViewerTextProps {
    /** API endpoint for tail + truncate, e.g., "/ci-internal/trace" */
    endpoint?: string;
    /** Poll every N ms when auto is enabled */
    pollMs?: number;
    /** Server tail: bytes */
    tailBytes?: number;
    /** Server tail: max lines */
    maxLines?: number;
    /** Start with auto polling */
    autoStart?: boolean;
    /** Editor height (CSS size, e.g., "420px") */
    height?: string;
    /** Auto-scroll to bottom after each update */
    autoScroll?: boolean;
    /** Optional: wrap long lines */
    wordWrap?: "on" | "off";
}
//# sourceMappingURL=CiDevBeaconTraceLogViewerTextProps.d.ts.map