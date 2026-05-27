import { ciBuildHandlerName } from './ci-build-handler-name';

/**
 * Infer a standardized CloudIgniter handler name from an ESM module URL.
 *
 * Typical usage:
 *
 * ```ts
 * const handlerName = ciInferHandlerName(import.meta.url);
 * ```
 *
 * Examples:
 *
 * file:///app/handlers/create-tenant-handler.ts
 * -> CREATE_TENANT_HANDLER
 *
 * file:///app/handlers/cognito-create-user-handler.ts
 * -> COGNITO_CREATE_USER_HANDLER
 */
export function ciInferHandlerName(moduleUrl: string): string {
  if (!moduleUrl || typeof moduleUrl !== 'string') {
    throw new Error('ciInferHandlerName: moduleUrl must be a non-empty string');
  }

  let pathname: string;

  try {
    pathname = new URL(moduleUrl).pathname;
  } catch {
    throw new Error(`ciInferHandlerName: invalid moduleUrl "${moduleUrl}"`);
  }

  const rawFileName = pathname.split('/').pop();

  if (!rawFileName) {
    throw new Error(`ciInferHandlerName: could not determine file name from "${moduleUrl}"`);
  }

  const fileNameWithoutExtension = rawFileName.replace(/\.[^.]+$/, '');

  const baseName = fileNameWithoutExtension.replace(/-?handler$/i, '');

  return ciBuildHandlerName(baseName);
}
