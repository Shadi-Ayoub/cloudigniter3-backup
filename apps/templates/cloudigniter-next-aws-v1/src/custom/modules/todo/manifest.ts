import type { CiExtensionManifest } from "@cloudigniter/core/types";

export const ciModuleManifest = {
  schemaVersion: 1,
  id: "todo",
  kind: "extension",
  name: "To-Do List",
  version: "1.0.0",
  description:
    "Personal tasks with priorities, due dates, completion tracking, and a recoverable trash.",
  enabledByDefault: false,
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
  dashboard: {
    title: "To-Do List",
    description: "Organize your tasks and keep track of what comes next.",
  },
  settings: [
    {
      key: "defaultPriority",
      title: "Default task priority",
      default: "normal",
      options: ["low", "normal", "high"],
    },
    {
      key: "showCompleted",
      title: "Show completed tasks by default",
      default: true,
    },
  ],
  permissions: [
    { id: "read-own", title: "Read your own tasks", accessMode: "read" },
    {
      id: "write-own",
      title: "Create, edit, complete, delete, and restore your own tasks",
      accessMode: "write",
    },
  ],
  authenticatedAccess: true,
} as const satisfies CiExtensionManifest;
