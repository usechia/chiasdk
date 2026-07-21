const fs = require("fs");
const path = require("path");

const SITE_URL = "https://docs.usechia.com";

const SECTIONS = [
  {
    title: "Platform",
    dir: "platform",
    recursive: false,
  },
  {
    title: "Platform API Reference",
    dir: path.join("platform", "api"),
    recursive: false,
  },
  {
    title: "Platform Concepts",
    dir: path.join("platform", "concepts"),
    recursive: false,
  },
  {
    title: "Claude Code Skill",
    dir: "skill",
    recursive: false,
  },
];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    data[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return { data, body: raw.slice(match[0].length) };
}

function readDocs(docsDir, relDir) {
  const abs = path.join(docsDir, relDir);
  if (!fs.existsSync(abs)) return [];

  return fs
    .readdirSync(abs)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(abs, name), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = name.replace(/\.md$/, "");
      const docPath = path.posix.join(relDir.split(path.sep).join("/"), slug);
      return {
        title: data.title || slug,
        description: data.description || "",
        position: Number(data.sidebar_position) || 999,
        url: `${SITE_URL}/docs/${docPath}`,
        docPath,
        body: body.trim(),
      };
    })
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
}

function buildIndex(sections) {
  const lines = [
    "# Chia Platform",
    "",
    "> Subscription billing over African mobile money rails. Create plans, collect recurring payments through PayChangu, PawaPay and OneKhusa, and receive signed webhook events. Amounts are numeric(12,2) and are returned as strings.",
    "",
  ];

  for (const section of sections) {
    if (section.docs.length === 0) continue;
    lines.push(`## ${section.title}`, "");
    for (const doc of section.docs) {
      lines.push(`- [${doc.title}](${doc.url})${doc.description ? `: ${doc.description}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Optional", "");
  lines.push(`- [Full documentation as one file](${SITE_URL}/llms-full.txt): every platform doc concatenated as plain markdown`);
  lines.push(`- [Postman collection](${SITE_URL}/chia-platform-api.postman_collection.json): importable request collection for the platform API`);
  lines.push("");

  return lines.join("\n");
}

function buildFull(sections) {
  const parts = [
    "# Chia Platform documentation",
    "",
    "Every platform documentation page, concatenated as plain markdown. Each page starts with a `# <path>` separator.",
    "",
  ];

  for (const section of sections) {
    for (const doc of section.docs) {
      parts.push("", `# ${doc.docPath}`, "", doc.body, "");
    }
  }

  return parts.join("\n");
}

module.exports = function llmsTxtPlugin(context) {
  return {
    name: "llms-txt",
    async postBuild({ outDir }) {
      const docsDir = path.resolve(context.siteDir, "docs");
      const sections = SECTIONS.map((section) => ({
        title: section.title,
        docs: readDocs(docsDir, section.dir),
      }));

      fs.writeFileSync(path.join(outDir, "llms.txt"), buildIndex(sections), "utf8");
      fs.writeFileSync(path.join(outDir, "llms-full.txt"), buildFull(sections), "utf8");
    },
  };
};
