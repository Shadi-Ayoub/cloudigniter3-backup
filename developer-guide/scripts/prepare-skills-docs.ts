import fs from "node:fs";
import path from "node:path";

const sourceRoots = [".agents/skills", ".codex/skills"];
const APPLEDOUBLE_MAGIC = Buffer.from([0x00, 0x05, 0x16, 0x07]);

function collectAppleDoubleFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      files.push(...collectAppleDoubleFiles(entryPath));
      continue;
    }
    if (entry.name.startsWith("._") && entry.isFile()) files.push(entryPath);
  }
  return files;
}

function isAppleDoubleFile(filePath: string): boolean {
  const stats = fs.lstatSync(filePath);
  if (!stats.isFile()) return false;
  const bytes = fs.readFileSync(filePath).subarray(0, APPLEDOUBLE_MAGIC.length);
  return bytes.equals(APPLEDOUBLE_MAGIC);
}

function removeGeneratedAppleDoubleFiles(generatedRoot: string): void {
  // The staging tree is disposable and is recreated on every guide build. Only
  // remove exact AppleDouble files created in this current generated view; do
  // not scan or clean any source skill directory or other repository path.
  for (const filePath of collectAppleDoubleFiles(generatedRoot)) {
    try {
      if (!isAppleDoubleFile(filePath)) {
        console.warn(
          `Preserving non-AppleDouble metadata candidate: ${filePath}`,
        );
        continue;
      }
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn(
        `Unable to remove generated AppleDouble file: ${filePath}`,
        error,
      );
    }
  }
}

function linkMarkdownFiles(sourceDir: string, targetDir: string): void {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name.startsWith("._")) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      linkMarkdownFiles(sourcePath, targetPath);
      continue;
    }
    const isSkillFile = entry.name === "SKILL.md";
    if (!isSkillFile && !entry.name.endsWith(".md")) continue;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    // Docusaurus' content globber intentionally does not follow symlinks. The
    // generated file is therefore a disposable build view, while the source
    // file remains authoritative and is re-read on every config evaluation.
    const contents = fs.readFileSync(sourcePath, "utf8");
    // Reference files are authored as Markdown templates and may contain
    // literal MDX expressions (for example `{Trait 1}`). Escape only those
    // expressions in prose so headings, tables, lists, and code blocks remain
    // native Markdown in the Skills tab.
    fs.writeFileSync(targetPath, sanitizeMdx(contents));
  }
}

function sanitizeMdx(contents: string): string {
  // Literal braces and JSX-like angle brackets are common in templates but
  // are interpreted by MDX before Markdown rendering. Escaping them keeps the
  // surrounding Markdown structure native and readable.
  return contents
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll("<", "\\<");
}

function writeCategoryMetadata(
  directory: string,
  label: string,
  position?: number,
): void {
  fs.mkdirSync(directory, { recursive: true });
  const metadata =
    position === undefined
      ? { label, collapsed: true }
      : { label, position, collapsed: true };
  fs.writeFileSync(
    path.join(directory, "_category_.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
}

export function prepareSkillsDocs(siteDir: string = process.cwd()): void {
  const repositoryRoot = path.resolve(siteDir, "..");
  const generatedRoot = path.join(siteDir, ".generated", "skills");
  fs.rmSync(generatedRoot, { recursive: true, force: true });
  fs.mkdirSync(generatedRoot, { recursive: true });
  for (const sourceRoot of sourceRoots) {
    const sourcePath = path.join(repositoryRoot, sourceRoot);
    if (fs.existsSync(sourcePath)) {
      const displayRoot = sourceRoot.replace(/^\./, "");
      linkMarkdownFiles(sourcePath, path.join(generatedRoot, displayRoot));
      for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillDir = path.join(generatedRoot, displayRoot, entry.name);
        const position =
          entry.name === "cloudigniter-development"
            ? -2
            : entry.name === "cloudigniter-guide-authoring"
              ? -1
              : undefined;
        writeCategoryMetadata(
          skillDir,
          entry.name.replaceAll("-", " "),
          position,
        );
        if (fs.existsSync(path.join(skillDir, "references"))) {
          writeCategoryMetadata(
            path.join(skillDir, "references"),
            "References",
          );
        }
      }
    }
  }
  removeGeneratedAppleDoubleFiles(generatedRoot);
}
