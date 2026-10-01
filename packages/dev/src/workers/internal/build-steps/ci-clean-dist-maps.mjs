// CloudIgniter internal source-map cleanup worker.
import fs from "node:fs";
import path from "node:path";

function ciDeleteMaps(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      ciDeleteMaps(fullPath);
      continue;
    }

    if (entry.name.endsWith(".map")) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ ${fullPath}`);
    }
  }
}

ciDeleteMaps("dist");
