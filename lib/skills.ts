import { promises as fs } from "fs";
import path from "path";

export type SkillManifestItem = {
  id: string;
  category?: "sage" | "model" | "host";
  name: string;
  shortName: string;
  role: string;
  sourceUrl: string;
  promptFile: string;
  enabledByDefault: boolean;
  isHost?: boolean;
};

const rootDir = process.cwd();
const skillsDir = path.join(rootDir, "skills");
const manifestPath = path.join(skillsDir, "manifest.json");

export async function readManifest() {
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw) as SkillManifestItem[];
}

export async function getPublicSkills() {
  const manifest = await readManifest();
  return manifest.filter((skill) => !skill.isHost);
}

export async function getSkillById(id: string) {
  const manifest = await readManifest();
  return manifest.find((skill) => skill.id === id);
}

export async function readSkillPrompt(skill: SkillManifestItem) {
  return fs.readFile(path.join(skillsDir, skill.promptFile), "utf8");
}

export function compactPrompt(prompt: string, maxChars = 12000) {
  if (prompt.length <= maxChars) {
    return prompt;
  }

  return `${prompt.slice(0, maxChars)}

[All for One note: The source prompt was longer than the V1 prompt budget and has been truncated for this run.]`;
}
