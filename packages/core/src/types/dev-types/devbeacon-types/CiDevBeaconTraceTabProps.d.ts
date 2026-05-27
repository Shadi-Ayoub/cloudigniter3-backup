export interface CiDevBeaconTraceTabProps {
    /** API endpoint to read JSON events from (GET) and clear (DELETE). Defaults to "/ci-internal/trace". */
    endpoint?: string;
    /** Poll interval in ms when Auto is on. Defaults to 1500. */
    pollMs?: number;
    /** Optional bytes hint for server tailing (passed as ?bytes=). Defaults to 128 KiB. */
    tailBytes?: number;
    /** Optional lines cap on server (passed as ?lines=). Defaults to 1500. */
    maxLines?: number;
    /** Start with auto polling enabled. Defaults to true. */
    autoStart?: boolean;
}
//# sourceMappingURL=CiDevBeaconTraceTabProps.d.ts.map