import type {
  CiSmartFormSpecExtension,
  CiSmartFormTemplateExtension,
} from "@cloudigniter/core/types";

/** Edit this file, then run pnpm forms:generate (also runs before dev/build). */
export const appUserFormSpecifications: CiSmartFormSpecExtension = {
  fields: [
    {
      name: "department",
      group: "extensions",
      label: "Department",
      props: { placeholder: "Engineering" },
    },
    { name: "jobTitle", group: "extensions", label: "Job title" },
  ],
};
export const appUserFormTemplate: CiSmartFormTemplateExtension = {
  groups: [
    {
      name: "extensions",
      rows: [
        { id: "employment", fields: ["department", "jobTitle"], columns: 2 },
      ],
    },
  ],
};
/** These values round-trip through the established profile.extensions seam. */
export const appUserExtensionFields = ["department", "jobTitle"] as const;
