# All for One

一个给自己用的多视角思考工作台。输入一个问题，同时调用“多位智者”和“思维模型”，最后由主持人汇总成共识、分歧、盲点和下一步。

## 快速开始

```bash
npm install
npm run import:skills
npm run dev
```

打开 http://localhost:3000。

## 调用方式

默认使用 Codex 桌面版：

```text
网页 -> Next.js API -> Codex Desktop app-server -> 返回回答
```

注意：Codex 桌面版模式只适用于本机运行。部署到 Vercel 后请使用 API Key 模式。

如果你想改用 API Key 模式，可以在页面里临时填写 OpenAI API Key，或者创建 `.env.local`：

```bash
cp .env.example .env.local
```

然后填写：

```text
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

修改 `.env.local` 后需要重启 `npm run dev`。

## 部署到 Vercel

可以部署。部署后的网页、skills 读取和 OpenAI API Key 模式都可以正常工作；Codex 桌面版模式不能在 Vercel 云端工作，因为 Vercel 无法访问你本机正在登录的 Codex 桌面版。

推荐部署方式：

```bash
npx vercel
```

生产部署：

```bash
npx vercel --prod
```

线上有两种使用方式：

- 在 Vercel 项目环境变量里配置 `OPENAI_API_KEY` 和可选的 `OPENAI_MODEL`，页面不用再填写 key。
- 不配置环境变量，每次在页面 API Key 模式里临时填写 key。

部署后，页面会自动默认切换到 API Key 模式；本机 `localhost` 仍默认使用 Codex 桌面版。

## Skills

Skill metadata lives in:

```text
skills/manifest.json
```

Skill prompts live in:

```text
skills/*.md
```

The host prompt is:

```text
skills/host.md
```

Run this whenever you want to refresh public upstream prompts:

```bash
npm run import:skills
```

Local edits to `skills/*.md` take effect on the next API call.

## Optional Local Avatars

Real portrait files are intentionally not included in the open-source repository. If you want local portraits, put your own licensed images under:

```text
public/avatars/
```

The UI falls back to generated initials when avatar files are missing.

## 当前视角

多位智者：

- 乔布斯
- 求是
- 费曼
- 芒格
- 马斯克
- 塔勒布
- 纳瓦尔
- Paul Graham
- 张一鸣
- 巴菲特

思维模型：

- 第一性原理
- 逆向思考
- 二阶效应
- 反脆弱
- 机会成本
- 主要矛盾
- 二八法则
- 奥卡姆剃刀
- 能力圈
- 系统思考

## License

Apache License 2.0
