import type { CiErrorPageProps } from "@cloudigniter/core/types";

/** Next.js composition for a localized, illustrated 403 or 404 boundary. */
export interface CiNextHttpErrorPageProps {
  statusCode: 403 | 404;
  /** Only true when trusted authorization evidence confirms a retained grant is suspended. */
  accessSuspended?: boolean;
  /** Application-owned image URL; omit to render without artwork. */
  imageSrc?: string;
  messages?: Partial<
    Pick<CiErrorPageProps, "title" | "message" | "errorLabel"> & {
      homeLabel: string;
    }
  >;
}
