import policy from "../hosting-policy.json";
import { docsEdition } from "../scripts/docs-edition";

type Node = { type: string; url?: string; children?: Node[] };

/** Public references may point to the gated section, never an unprotected alias. */
export default function remarkProtectedLinks() {
  return function visit(node: Node) {
    if (
      docsEdition() === "public" &&
      node.url &&
      /^\/(?:company-developers|developer-dictionary|skills|commands\/dev)(?:\/|#|$)/.test(
        node.url,
      )
    ) {
      node.url = `${policy.url}${policy.developerBaseUrl}${node.url.slice(1)}`;
    }
    node.children?.forEach(visit);
  };
}
