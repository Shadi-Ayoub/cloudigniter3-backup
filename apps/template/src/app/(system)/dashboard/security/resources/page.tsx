import { permanentRedirect } from "next/navigation";

/** Preserves bookmarks after the resources catalog became a dashboard section. */
export default function ResourcesPage() {
  permanentRedirect("/dashboard/resources");
}
