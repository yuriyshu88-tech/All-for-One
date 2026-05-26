import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const skillsDir = path.join(rootDir, "skills");

const imports = [
  {
    id: "jobs",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/steve-jobs-skill/main/SKILL.md"],
  },
  {
    id: "feynman",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/feynman-skill/main/SKILL.md"],
  },
  {
    id: "munger",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/munger-skill/main/SKILL.md"],
  },
  {
    id: "musk",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/elon-musk-skill/main/SKILL.md"],
  },
  {
    id: "taleb",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/taleb-skill/main/SKILL.md"],
  },
  {
    id: "naval",
    rawUrls: ["https://raw.githubusercontent.com/alchaincyf/naval-skill/main/SKILL.md"],
  },
  {
    id: "paul-graham",
    rawUrls: [
      "https://raw.githubusercontent.com/alchaincyf/paul-graham-skill/main/SKILL.md",
      "https://raw.githubusercontent.com/alchaincyf/paul-graham-skill/master/SKILL.md",
    ],
  },
  {
    id: "zhang-yiming",
    rawUrls: [
      "https://raw.githubusercontent.com/alchaincyf/zhang-yiming-skill/main/SKILL.md",
      "https://raw.githubusercontent.com/alchaincyf/zhang-yiming-skill/master/SKILL.md",
    ],
  },
  {
    id: "buffett",
    rawUrls: ["https://raw.githubusercontent.com/will2025btc/buffett-perspective/main/SKILL.md"],
  },
];

const qiushiImport = {
  id: "qiushi",
  rawUrls: [
    "https://raw.githubusercontent.com/HughYau/qiushi-skill/main/skills/investigation-first/SKILL.md",
    "https://raw.githubusercontent.com/HughYau/qiushi-skill/main/skills/contradiction-analysis/SKILL.md",
    "https://raw.githubusercontent.com/HughYau/qiushi-skill/main/skills/practice-cognition/SKILL.md",
  ],
};

function wrapPrompt({ id, source, content }) {
  return `# Imported Skill: ${id}

Source: ${source}
Imported for All for One.

Important adaptation:
- This skill is used as one cognitive lens inside a multi-perspective council.
- Do not claim to be the real person, author, or original project.
- Preserve the reasoning method, but answer the user's question directly.
- Prefer concise Chinese output.

---

${content.trim()}
`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "all-for-one-skill-importer",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function fetchFirstAvailable(urls) {
  const errors = [];

  for (const url of urls) {
    try {
      return {
        source: url,
        content: await fetchText(url),
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(errors.join("; "));
}

async function importOne(item) {
  const { source, content } = await fetchFirstAvailable(item.rawUrls);
  const filePath = path.join(skillsDir, `${item.id}.md`);
  await fs.writeFile(
    filePath,
    wrapPrompt({ id: item.id, source, content }),
    "utf8",
  );
  console.log(`Imported ${item.id}`);
}

async function importQiushi() {
  const parts = await Promise.all(qiushiImport.rawUrls.map(fetchText));
  const content = parts
    .map((part, index) => `## Qiushi Part ${index + 1}\n\n${part}`)
    .join("\n\n---\n\n");

  await fs.writeFile(
    path.join(skillsDir, "qiushi.md"),
    wrapPrompt({
      id: qiushiImport.id,
      source: qiushiImport.rawUrls.join(", "),
      content,
    }),
    "utf8",
  );

  console.log("Imported qiushi");
}

await fs.mkdir(skillsDir, { recursive: true });
for (const item of imports) {
  try {
    await importOne(item);
  } catch (error) {
    console.warn(`Skipped ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  await importQiushi();
} catch (error) {
  console.warn(`Skipped qiushi: ${error instanceof Error ? error.message : String(error)}`);
}

console.log("Done. Local skill prompts are ready.");
