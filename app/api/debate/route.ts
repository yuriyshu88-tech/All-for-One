import OpenAI from "openai";
import { NextResponse } from "next/server";
import { askCodexDesktop } from "@/lib/codexDesktop";
import {
  compactPrompt,
  getSkillById,
  readManifest,
  readSkillPrompt,
  type SkillManifestItem,
} from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 300;

type DebateRequest = {
  question?: string;
  context?: string;
  skillIds?: string[];
  provider?: "desktop" | "openai";
  apiKey?: string;
};

type SkillAnswer = {
  skillId: string;
  name: string;
  role: string;
  sourceUrl: string;
  content: string;
};

const skillDisplayNames: Record<string, string> = {
  jobs: "乔布斯 Jobs",
  qiushi: "求是 Qiushi",
  feynman: "费曼 Feynman",
  munger: "芒格 Munger",
  musk: "马斯克 Musk",
  taleb: "塔勒布 Taleb",
  naval: "纳瓦尔 Naval",
  "paul-graham": "保罗·格雷厄姆 PG",
  "zhang-yiming": "张一鸣 Yiming",
  buffett: "巴菲特 Buffett",
};

const modelDisplayNames: Record<string, string> = {
  "first-principles": "第一性原理",
  inversion: "逆向思考",
  "second-order": "二阶效应",
  antifragile: "反脆弱",
  "opportunity-cost": "机会成本",
  "main-contradiction": "主要矛盾",
  "pareto-principle": "二八法则",
  "occams-razor": "奥卡姆剃刀",
  "circle-of-competence": "能力圈",
  "systems-thinking": "系统思考",
};

function getDisplayName(skill: SkillManifestItem) {
  return skill.category === "model"
    ? modelDisplayNames[skill.id] || skill.shortName
    : skillDisplayNames[skill.id] || skill.shortName;
}

async function askModel(client: OpenAI, model: string, system: string, user: string) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
  });

  return response.choices[0]?.message.content?.trim() || "";
}

async function askProvider(options: {
  provider: "desktop" | "openai";
  client?: OpenAI;
  model: string;
  system: string;
  user: string;
}) {
  if (options.provider === "desktop") {
    return askCodexDesktop(options.system, options.user);
  }

  if (!options.client) {
    throw new Error("OpenAI client is required.");
  }

  return askModel(options.client, options.model, options.system, options.user);
}

const desktopCouncilSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "answers"],
  properties: {
    summary: {
      type: "string",
    },
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skillId", "name", "role", "sourceUrl", "content"],
        properties: {
          skillId: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          sourceUrl: { type: "string" },
          content: { type: "string" },
        },
      },
    },
  },
};

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function parseDesktopCouncil(text: string, selectedSkills: SkillManifestItem[]) {
  const parsed = JSON.parse(extractJsonObject(text)) as { summary?: unknown; answers?: unknown };
  const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
  const selectedIds = new Set(selectedSkills.map((skill) => skill.id));
  const validAnswers = answers.filter(
    (answer): answer is SkillAnswer => {
      const item = answer as Partial<SkillAnswer> | null;
      return (
        Boolean(item) &&
        typeof item?.skillId === "string" &&
        selectedIds.has(item.skillId) &&
        typeof item.content === "string"
      );
    },
  );

  if (typeof parsed.summary !== "string" || validAnswers.length === 0) {
    throw new Error("Codex 桌面版返回了内容，但格式不完整。请重试或减少视角数量。");
  }

  return {
    summary: parsed.summary,
    answers: validAnswers.map((answer) => {
      const skill = selectedSkills.find((item) => item.id === answer.skillId);
      return {
        skillId: answer.skillId,
        name: skill ? getDisplayName(skill) : answer.name,
        role: skill?.role || answer.role,
        sourceUrl: skill?.sourceUrl || answer.sourceUrl,
        content: answer.content,
      };
    }),
  };
}

function buildSkillSystem(skill: SkillManifestItem, prompt: string, hasContext: boolean) {
  return `${compactPrompt(prompt)}

## All for One Operating Rules

- You are one cognitive lens inside a private council.
- Do not claim to be the real person named by the skill.
- Answer the user's question from your lens only.
- If reference material is provided, ground your answer in it.
- Separate evidence from inference; explicitly say when something is an assumption.
- If reference material is thin or missing, name the most important missing information.
- Be specific and useful.
- Write in Chinese unless the user asks otherwise.
- Keep the response under 650 Chinese characters.

Reference material status: ${hasContext ? "provided" : "not provided"}.`;
}

function buildSkillUser(question: string, context: string) {
  return `用户的问题：
${question}

已知资料：
${context || "未提供。请谨慎推断，并说明需要补充哪些资料。"}`;
}

function buildDesktopCouncilSystem(items: Array<{ skill: SkillManifestItem; prompt: string }>, hostPrompt: string) {
  const lenses = items
    .map(
      ({ skill, prompt }) => `## ${skill.id} | ${getDisplayName(skill)}
角色：${skill.role}
来源：${skill.sourceUrl}
提示词：
${compactPrompt(prompt, 4000)}`,
    )
    .join("\n\n");

  return `你是 All for One 的本机编排器。你需要在一次回答中模拟多个认知视角，然后由主持人汇总。

严格规则：
- 不要声称自己是这些真实人物本人，只能说“从该视角看”。
- 如果用户提供资料，优先基于资料；如果资料不足，要说明哪些结论是推断。
- 每个视角回答控制在 260 个中文字符以内。
- 主持人汇总必须包含：共识、分歧/取舍、盲点、下一步。
- 只返回 JSON，不要返回 Markdown 代码块，不要返回额外解释。

可用视角：
${lenses}

主持人提示词：
${compactPrompt(hostPrompt, 4000)}`;
}

function buildDesktopCouncilUser(question: string, context: string, selectedSkills: SkillManifestItem[]) {
  const outputShape = selectedSkills
    .map(
      (skill) => `{"skillId":"${skill.id}","name":"${getDisplayName(skill)}","role":"${skill.role}","sourceUrl":"${skill.sourceUrl}","content":"..."}`,
    )
    .join(",");

  return `用户的问题：
${question}

已知资料：
${context || "未提供。请谨慎推断，并说明需要补充哪些资料。"}

请按下面 JSON 形状返回：
{
  "summary": "主持人汇总，包含共识、分歧/取舍、盲点、下一步",
  "answers": [${outputShape}]
}`;
}

function buildHostUser(question: string, context: string, answers: SkillAnswer[]) {
  const council = answers
    .map(
      (answer) => `## ${answer.name} (${answer.role})

${answer.content}`,
    )
    .join("\n\n");

  return `用户的问题：
${question}

已知资料：
${context || "未提供。"}

各个视角的回答：

${council}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as DebateRequest;
  const question = body.question?.trim();
  const context = body.context?.trim() || "";
  const skillIds = body.skillIds ?? [];
  const provider = body.provider || (process.env.VERCEL ? "openai" : "desktop");

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (skillIds.length === 0) {
    return NextResponse.json({ error: "Select at least one skill." }, { status: 400 });
  }

  if (provider === "desktop" && process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "Vercel 部署环境无法调用你本机的 Codex 桌面版。请切换到 API Key 模式。",
      },
      { status: 400 },
    );
  }

  const manifest = await readManifest();
  const skillMap = new Map(manifest.map((skill) => [skill.id, skill]));
  const selectedSkills = skillIds
    .map((id) => skillMap.get(id))
    .filter((skill): skill is SkillManifestItem => Boolean(skill && !skill.isHost));

  if (selectedSkills.length === 0) {
    return NextResponse.json({ error: "No valid skills selected." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const client =
    provider === "openai" && apiKey
      ? new OpenAI({
          apiKey,
          baseURL: baseURL || undefined,
        })
      : undefined;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (provider === "openai" && !apiKey) {
    return NextResponse.json(
      {
        error: "使用 API Key 模式时需要填写 OpenAI API Key，或在 .env.local 里设置 OPENAI_API_KEY。",
      },
      { status: 500 },
    );
  }

  try {
    const host = await getSkillById("host");
    if (!host) {
      return NextResponse.json({ error: "Host skill is missing." }, { status: 500 });
    }

    if (provider === "desktop") {
      const [hostPrompt, skillPrompts] = await Promise.all([
        readSkillPrompt(host),
        Promise.all(selectedSkills.map(async (skill) => ({ skill, prompt: await readSkillPrompt(skill) }))),
      ]);
      const raw = await askCodexDesktop(
        buildDesktopCouncilSystem(skillPrompts, hostPrompt),
        buildDesktopCouncilUser(question, context, selectedSkills),
        desktopCouncilSchema,
      );
      const council = parseDesktopCouncil(raw, selectedSkills);

      return NextResponse.json({
        summary: council.summary,
        answers: council.answers,
        model: "codex-desktop",
        provider,
      });
    }

    const buildAnswer = async (skill: SkillManifestItem) => {
      const prompt = await readSkillPrompt(skill);
      const content = await askProvider({
        provider,
        client,
        model,
        system: buildSkillSystem(skill, prompt, Boolean(context)),
        user: buildSkillUser(question, context),
      });

      return {
        skillId: skill.id,
        name: getDisplayName(skill),
        role: skill.role,
        sourceUrl: skill.sourceUrl,
        content,
      };
    };

    const answers = await Promise.all(selectedSkills.map((skill) => buildAnswer(skill)));

    const hostPrompt = await readSkillPrompt(host);
    const summary = await askProvider({
      provider,
      client,
      model,
      system: compactPrompt(hostPrompt),
      user: buildHostUser(question, context, answers),
    });

    return NextResponse.json({
      summary,
      answers,
      model,
      provider,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "生成失败，请检查调用方式、Codex 登录状态或 API Key。",
      },
      { status: 500 },
    );
  }
}
