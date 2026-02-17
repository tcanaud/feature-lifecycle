import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

function scanAdrDirectory(dirPath, featureId, results) {
  if (!existsSync(dirPath)) return;

  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectories (domain/*, local/*)
      scanAdrDirectory(fullPath, featureId, results);
      continue;
    }

    if (!entry.endsWith(".md")) continue;
    // Skip non-ADR files
    if (entry === "template.md" || entry === "index.md" || entry === "README.md") continue;

    const content = readFileSync(fullPath, "utf-8");

    // Check YAML frontmatter for feature reference
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];

    // Check if references.features contains the featureId
    if (frontmatter.includes(featureId)) {
      // Extract ADR id from frontmatter or filename
      const idMatch = frontmatter.match(/^id:\s*["']?(.+?)["']?\s*$/m);
      const adrId = idMatch ? idMatch[1] : basename(entry, ".md");
      results.push(adrId);
    }
  }
}

export function scanAdr(projectRoot, config, featureId) {
  const result = { count: 0, ids: [] };

  const adrDir = config.adr_dir || ".adr";
  const adrPath = join(projectRoot, adrDir);
  if (!existsSync(adrPath)) return result;

  const ids = [];

  // Scan all ADR scopes: global/, domain/*/, local/*/
  scanAdrDirectory(join(adrPath, "global"), featureId, ids);
  scanAdrDirectory(join(adrPath, "domain"), featureId, ids);
  scanAdrDirectory(join(adrPath, "local"), featureId, ids);

  // Also scan root level of .adr/ for flat structure
  scanAdrDirectory(adrPath, featureId, ids);

  // Deduplicate
  const uniqueIds = [...new Set(ids)];
  result.count = uniqueIds.length;
  result.ids = uniqueIds;

  return result;
}
