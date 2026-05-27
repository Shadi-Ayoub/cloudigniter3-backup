export type CiTraceLoggerLike = {
    log(entry: Record<string, unknown>): void;
    wave(label?: string, extra?: Record<string, unknown>): void;
    start(label: string, base?: Record<string, unknown>): string;
    stop(handle: string, extra?: Record<string, unknown>): void;
    startTimer(label: string, base?: Record<string, unknown>): (extra?: Record<string, unknown>) => void;
    time<T>(label: string, fn: () => Promise<T> | T, base?: Record<string, unknown>): Promise<T>;
    setEnabled(value: boolean): void;
    setFilePath(absPath: string): void;
    setEndpoint(url: string): void;
    setTag(tag: string): void;
};
//# sourceMappingURL=CiTraceLoggerLike.d.ts.map