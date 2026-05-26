# All for One

> 一个私人思考议会：输入一个问题，邀请多位智者视角和经典思维模型共同推演，最后由主持人压缩成结构化结论。

All for One 是一个本机优先的多视角思考工作台。它不是为了替你做决定，而是帮助你把一个问题拆开：先收集背景资料，再从不同智者视角、思维模型和主持人总结中看见共识、分歧、盲点与下一步。

它最初是为个人使用设计的：安静、直接、可改、能长期积累。

## 它能做什么

- 输入一个问题，一次性获得多个视角的回答。
- 同时使用“智者视角”和“经典思维模型”。
- 支持补充资料，让回答不只靠空泛推断。
- 本机默认调用 Codex 桌面版。
- 部署后可切换为 OpenAI API Key 模式。
- 自动保存历史记录，可搜索并打开旧结果。
- 所有 skill 都是 Markdown prompt，方便自己修改和扩展。

## 页面结构

应用主要由三块组成：

- **问题与资料**：写下问题，也可以粘贴背景资料、事实、链接摘录或约束。
- **议会选择**：选择要参与推演的智者视角和思维模型。
- **主持人汇总**：先看综合结论，再按“智者视角”和“思维模型校验”查看细节。

## 内置视角

### 智者视角

这些并不是在声称模拟真实人物本人，而是把公开可见的思想风格、判断框架和表达习惯整理成认知视角。

| 视角 | 关注点 |
| --- | --- |
| 乔布斯 Jobs | 产品品味、简单、聚焦、叙事、用户体验 |
| 求是 Qiushi | 调查研究、证据、现实检验、主要矛盾 |
| 费曼 Feynman | 清晰解释、好奇心、基础理解、把复杂问题讲简单 |
| 芒格 Munger | 多元思维模型、激励、错误清单、世俗智慧 |
| 马斯克 Musk | 第一性原理、工程约束、速度、规模化 |
| 塔勒布 Taleb | 不确定性、脆弱性、尾部风险、可选项 |
| 纳瓦尔 Naval | 杠杆、判断力、财富、幸福、人生策略 |
| 保罗·格雷厄姆 PG | 创业、创始人、产品市场契合、写作 |
| 张一鸣 Yiming | 信息效率、产品系统、组织、长期复利 |
| 巴菲特 Buffett | 长期价值、护城河、耐心、安全边际 |

### 思维模型

| 模型 | 适合用来 |
| --- | --- |
| 第一性原理 | 把问题拆到底层事实、约束和真正限制 |
| 逆向思考 | 先问如何失败，再反推应该避免什么 |
| 二阶效应 | 看见直接结果之后的连锁反应 |
| 反脆弱 | 判断方案在压力和波动中会变弱、稳定还是变强 |
| 机会成本 | 比较每个选择消耗了什么、放弃了什么 |
| 主要矛盾 | 找到当前阶段真正制约结果的关键冲突 |
| 二八法则 | 找出少数高杠杆输入，避免平均用力 |
| 奥卡姆剃刀 | 优先选择假设更少、更简单、更可验证的解释 |
| 能力圈 | 分清自己真正懂、部分懂和不懂的范围 |
| 系统思考 | 观察反馈回路、激励结构、延迟效应和杠杆点 |

## 快速开始

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

在 `localhost` 下，应用会默认使用 **Codex 桌面版模式**。

## 两种调用方式

### 1. Codex 桌面版模式

本机使用时的默认模式。

```text
浏览器 -> Next.js API -> Codex Desktop app-server -> 返回结果
```

这个模式依赖你本机已经登录的 Codex 桌面版，只适合本机运行。部署到云端后，Vercel 这类服务无法访问你电脑上的 Codex 桌面版。

### 2. API Key 模式

部署到 Vercel 或其他云端环境时，请使用 API Key 模式。

你可以在页面里临时填写 OpenAI API Key，也可以创建 `.env.local`：

```bash
cp .env.example .env.local
```

然后填写：

```text
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=
```

修改 `.env.local` 后需要重启开发服务。

如果使用 DeepSeek 等 OpenAI-compatible 服务，可以把 `OPENAI_BASE_URL` 设置为对应服务地址，例如：

```text
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
```

## 部署到 Vercel

项目可以部署到 Vercel。部署后网页、skills 读取、历史记录和 API Key 模式都可以工作；只有 Codex 桌面版模式不能在云端工作。

```bash
npx vercel
```

生产部署：

```bash
npx vercel --prod
```

推荐在 Vercel 环境变量里配置：

```text
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=
```

当应用不运行在 `localhost` 时，会默认切换到 API Key 模式。

## Skill 如何工作

All for One 的 skill 很简单：一份 metadata，加一份 Markdown prompt。

```text
skills/manifest.json    # skill 元数据
skills/*.md             # 每个 skill 的 prompt
skills/host.md          # 主持人汇总 prompt
```

新增一个 skill：

1. 在 `skills/` 下创建一个新的 Markdown prompt。
2. 在 `skills/manifest.json` 中登记它。
3. 重启开发服务。

修改 `skills/*.md` 后，下一次 API 调用就会读取新的 prompt。

## 本机头像

公开仓库里没有包含真实人物头像图片，避免图片授权不清晰的问题。

如果你想在本机显示头像，可以把自己有授权的图片放到：

```text
public/avatars/
```

如果图片不存在，页面会自动退回到 initials 占位头像。

## 开发

```bash
npm run dev
npm run build
```

项目结构：

```text
app/                    # Next.js 页面和 UI
app/api/debate/route.ts # 多视角推演 API
app/api/skills/route.ts # skill 元数据 API
lib/codexDesktop.ts     # 本机 Codex Desktop 调用桥接
lib/skills.ts           # skill 读取工具
skills/                 # prompt 和 manifest
```

## 注意

- All for One 是思考辅助工具，不是真相来源。
- 智者视角是 prompt 化的认知视角，不代表真实人物本人。
- 涉及法律、财务、医疗、安全等重要决策时，请把输出当成讨论起点，并咨询专业人士。

## License

Apache License 2.0. See [LICENSE](./LICENSE).
