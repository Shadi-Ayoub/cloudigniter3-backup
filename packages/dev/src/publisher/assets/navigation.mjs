/** The category order is intentional; project choices are alphabetized by label.
 * @template {{id:string,label:string,kind:string}} T
 * @param {T[]} targets
 */
export function publisherGroups(targets) {
  const categories = [
    { id: "packages", label: "Packages", kinds: ["package"] },
    { id: "websites", label: "Websites", kinds: ["website"] },
    { id: "templates", label: "Templates", kinds: ["template", "app"] },
    { id: "docs", label: "Docs", kinds: ["docs"] },
  ];
  return categories
    .map((group) => ({
      id: group.id,
      label: group.label,
      targets: targets
        .filter((target) => group.kinds.includes(target.kind))
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label, "en", {
              sensitivity: "base",
              numeric: true,
            }) || a.id.localeCompare(b.id, "en"),
        ),
    }))
    .filter((group) => group.targets.length);
}
