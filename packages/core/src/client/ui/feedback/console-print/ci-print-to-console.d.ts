/**
 * When using Next.js commands, the environment is set by default based on the command:
 * next dev: Runs the project in development mode.
 * next build: Prepares the project for production mode.
 * next start: Runs the compiled project in production mode.
 * next export: Exports the project for static serving.
 */
import type { CiConsolePrintInterface } from "@ci-core/client";
export declare function ciPrintToConsole({ label, message, options, }: CiConsolePrintInterface): null | undefined;
export declare function printTable(data: object | object[] | string, tableCaption?: string): void;
//# sourceMappingURL=ci-print-to-console.d.ts.map