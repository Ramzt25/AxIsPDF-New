#!/usr/bin/env node
/* tools/scan-placeholders.cjs */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- config ---
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs");
const OUT_JSON = path.join(OUT_DIR, "placeholders.json");
const OUT_MD = path.join(OUT_DIR, "placeholders.md");
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "coverage", ".next", ".vercel", "tmp", "vendor"]);
const EXT_ALLOW = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".md", ".html", ".css", ".scss", ".svg", ".ps1", ".sh"]);
const PATTERN = /(TODO|FIXME|TEMP|STUB|MOCK|PLACEHOLDER|SAMPLE)(\[([A-Z]+-\d{3,})\])?/i; // optional existing [PH-###]
const TYPE_MAP = { TODO: "todo", FIXME: "fixme", TEMP: "temp", STUB: "stub", MOCK: "mock", PLACEHOLDER: "placeholder", SAMPLE: "sample" };

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fp);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!EXT_ALLOW.has(ext)) continue;
      yield fp;
    }
  }
}

function hashKey(s) {
  return crypto.createHash("md5").update(s).digest("hex").slice(0, 8);
}

function readPrev() {
  try {
    return JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  } catch {
    return { items: [], lastId: 0 };
  }
}

function nextId(prev) {
  prev.lastId = (prev.lastId || 0) + 1;
  return `PH-${String(prev.lastId).padStart(3, "0")}`;
}

function detectType(m) {
  const key = m.toUpperCase();
  return TYPE_MAP[key] || "placeholder";
}

function scanFile(fp) {
  const rel = path.relative(ROOT, fp);
  const text = fs.readFileSync(fp, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  lines.forEach((line, idx) => {
    const m = line.match(PATTERN);
    if (m) {
      const tag = m[1];
      const existingId = m[3]; // PH-### if present
      const desc = line.trim().slice(0, 240);
      hits.push({
        file: rel,
        line: idx + 1,
        tag,
        type: detectType(tag),
        existingId: existingId || null,
        snippet: desc
      });
    }
  });
  return hits;
}

function merge(prev, found) {
  const prevByKey = new Map();
  (prev.items || []).forEach(item => {
    prevByKey.set(item.key, item);
  });

  const result = [];
  let lastId = prev.lastId || 0;

  for (const f of found) {
    const key = `${f.file}:${f.line}:${hashKey(f.snippet)}`;
    const id = f.existingId ||
      (prevByKey.get(key)?.id) ||
      `PH-TBD`; // assign later to keep stable order

    const base = prevByKey.get(key) || {};
    result.push({
      id,
      key,
      file: f.file,
      line: f.line,
      type: f.type,
      tag: f.tag.toUpperCase(),
      description: base.description || f.snippet,
      resolutionPlan: base.resolutionPlan || "",
      owner: base.owner || "",
      status: base.status || "open",
      dateAdded: base.dateAdded || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
  }

  // assign new numeric IDs for any PH-TBD in discovery order
  result.forEach(item => {
    if (item.id === "PH-TBD") {
      lastId += 1;
      item.id = `PH-${String(lastId).padStart(3, "0")}`;
    }
  });

  // Sort: open first, then by numeric id
  result.sort((a, b) => {
    const s = (a.status === "open") - (b.status === "open");
    if (s !== 0) return s * -1;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  return { items: result, lastId };
}

function writeOutputs(state) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(state, null, 2));

  const open = state.items.filter(i => i.status !== "resolved");
  const resolved = state.items.filter(i => i.status === "resolved");
  const byType = {};
  open.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
  });

  const md = [
    "# TeamBeam - Placeholders / Stubs / Mocks / Samples",
    "",
    `**Last updated:** ${new Date().toISOString()}`,
    `**Open items:** ${open.length} | **Total items:** ${state.items.length}`,
    "",
    "## Summary by Type",
    Object.entries(byType).length ? 
      Object.entries(byType).map(([type, count]) => `- **${type}:** ${count}`).join("\n") :
      "_No open items_",
    "",
    "## Open Items",
    open.length ? "" : "_🎉 No open placeholders! Ready for production._",
    ...open.map(i =>
      [
        `### ${i.id}`,
        `- **File:** \`${i.file}\`:${i.line}`,
        `- **Type:** ${i.type}`,
        `- **Tag:** \`${i.tag}\``,
        `- **Description:** ${i.description}`,
        `- **Resolution Plan:** ${i.resolutionPlan || "⚠️ _(add plan)_"} `,
        `- **Owner:** ${i.owner || "🔍 _unassigned_"} `,
        `- **Status:** ${i.status}`,
        `- **Date Added:** ${i.dateAdded}`,
        `- **Last Updated:** ${i.lastUpdated}`,
        ""
      ].join("\n")
    ),
    "## Resolved Items (History)",
    resolved.length ? "" : "_None resolved yet_",
    ...resolved.map(i => `- ✅ **${i.id}** — \`${i.file}:${i.line}\` — ${i.description}`)
  ].join("\n");

  fs.writeFileSync(OUT_MD, md);
}

(function main() {
  console.log("[TeamBeam Placeholder Scanner] 🔍 Scanning for stubs, mocks, and placeholders...");
  
  const prev = readPrev();
  const found = [];
  let fileCount = 0;
  
  for (const fp of walk(ROOT)) {
    try { 
      found.push(...scanFile(fp)); 
      fileCount++;
    } catch (err) {
      console.warn(`⚠️  Error scanning ${fp}: ${err.message}`);
    }
  }
  
  const merged = merge(prev, found);
  writeOutputs(merged);
  
  const openCount = merged.items.filter(i => i.status !== "resolved").length;
  const totalCount = merged.items.length;
  
  console.log(`✅ Scanned ${fileCount} files`);
  console.log(`📊 Found ${totalCount} total items (${openCount} open, ${totalCount - openCount} resolved)`);
  console.log(`📝 Report: docs/placeholders.md`);
  console.log(`📄 Data: docs/placeholders.json`);
  
  if (openCount > 0) {
    console.log(`\n🚨 ${openCount} placeholders need attention before production!`);
  } else {
    console.log(`\n🎉 No open placeholders! Project is production-ready.`);
  }

  // Strict mode enforcement
  const STRICT = process.env.PLACEHOLDER_STRICT === "1";
  if (STRICT) {
    const prevKeys = new Set((prev.items||[]).map(i => i.key));
    const newbies = merged.items.filter(i => !prevKeys.has(i.key));
    const bad = newbies.filter(i => !i.owner || !i.resolutionPlan);
    if (bad.length) {
      console.error(`❌ [STRICT MODE] New placeholders missing owner/plan: ${bad.map(b => b.id).join(", ")}`);
      process.exit(2);
    }
  }
})();