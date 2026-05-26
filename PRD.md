# All for One 产品需求文档

## 1. 产品定位

All for One 是一个给个人使用的“多视角思考工作台”。

用户输入一个问题，系统同时调用两类视角：

- **多位智者**：来自人物型 skill 的认知风格，例如乔布斯、费曼、芒格、求是、马斯克等。
- **多个思维模型**：稳定、可复用的分析工具，例如第一性原理、逆向思考、二阶效应、反脆弱、机会成本、主要矛盾等。

最后由一个**主持人**把这些回答压缩成共识、分歧、盲点和下一步行动。

这个产品不是公开社区，不是 skill 商店，也不是角色扮演聊天。它首先是 Glenn 自己每天可用的思考工具。

## 2. 核心问题

单个 AI 回答容易过早收敛到一个框架里。用户真正需要的是：

- 同一个问题被不同专家视角拆开看。
- 同一个问题被不同思维模型稳定检查。
- 最后有人负责收束，而不是把一堆回答堆给用户。

All for One 要解决的是：**让一个问题同时经过人物经验和思维工具的双重推演。**

## 3. 产品目标

V1 目标：

- 用户可以输入一个问题。
- 页面清晰分成“多位智者”和“思维模型”两组。
- 用户可以选择参与的智者和思维模型。
- 系统分别生成每个视角的独立回答。
- 主持人汇总所有回答，输出可行动的结论。
- 默认调用 Codex 桌面版。
- 用户也可以切换为 API Key 模式。
- 部署到 Vercel 后默认使用 API Key 模式。
- 所有 skill 都是本地 Markdown 文件，方便手改。

## 4. 非目标

V1 不做：

- 用户登录
- 云端同步
- 历史记录
- Skill 市场
- 付费系统
- 多轮实时辩论
- 公开分享页

## 5. 使用场景

### 5.1 项目决策

例如：

> All for One 第一版应该怎么做，才能我自己每天愿意用？

系统会从产品、事实、解释、商业、工程、风险、思维模型等角度给出判断。

### 5.2 创业/产品判断

例如：

> 这个小工具有没有机会做成一个可以收费的产品？

智者组负责经验判断，思维模型组负责结构化检查。

### 5.3 人生/职业选择

例如：

> 我应该继续做这个方向，还是换一个更快变现的方向？

系统需要把长期复利、机会成本、风险、主要矛盾一起呈现。

## 6. 用户流程

1. 用户打开本地网页。
2. 用户输入一个问题。
3. 用户选择调用方式：
   - 默认：调用 Codex 桌面版
   - 可选：填写 OpenAI API Key
4. 用户选择“多位智者”。
5. 用户选择“思维模型”。
6. 用户点击“开始推演”。
7. 后端读取本地 skill prompt。
8. 后端并行调用每个视角。
9. 后端把所有回答交给主持人。
10. 页面展示：
    - 主持人总结
    - 智者回答
    - 思维模型回答

## 7. 信息架构

首页就是工作台，不做营销落地页。

页面结构：

```text
顶部：
  All for One
  当前选中视角数量

问题区：
  问题输入框
  调用方式切换：Codex 桌面版 / API Key
  API Key 输入框（仅 API Key 模式出现）

选择区：
  左侧：多位智者
  右侧：思维模型

结果区：
  主持人汇总
  各视角回答卡片
```

## 8. V1 默认视角

### 8.1 多位智者

| 名称 | 作用 |
| --- | --- |
| 乔布斯 | 产品体验、取舍、叙事 |
| 求是 | 调查研究、事实判断、主要矛盾 |
| 费曼 | 清晰解释、基础理解、反混淆 |
| 芒格 | 多元思维、逆向思考、激励与错误 |
| 马斯克 | 第一性原理、工程约束、规模化 |
| 塔勒布 | 不确定性、脆弱性、尾部风险 |
| 纳瓦尔 | 杠杆、长期复利、人生策略 |
| Paul Graham | 创业、用户需求、产品市场 |
| 张一鸣 | 信息效率、产品系统、组织 |
| 巴菲特 | 长期价值、护城河、下行保护 |

### 8.2 思维模型

| 名称 | 作用 |
| --- | --- |
| 第一性原理 | 拆到底层事实和真实约束 |
| 逆向思考 | 从失败路径反推避免动作 |
| 二阶效应 | 检查后续连锁反应和激励变化 |
| 反脆弱 | 判断压力下会受损、稳健还是变强 |
| 机会成本 | 比较时间、注意力、资金的替代用途 |
| 主要矛盾 | 找出当前阶段真正制约结果的关键冲突 |

## 9. 调用方式

### 9.1 Codex 桌面版模式

默认模式。

特点：

- 不需要在网页里填写 API Key。
- 后端通过 Codex Desktop 的 app-server 协议生成回答。
- 适合个人本地使用。
- 依赖用户本机已经登录 Codex 桌面版。

实现方式：

```text
Next.js API
  -> Codex Desktop app-server
  -> 返回每个视角的最终回答
```

### 9.2 API Key 模式

备用模式。

特点：

- 用户在网页中临时填写 OpenAI API Key。
- 后端用 OpenAI SDK 调用模型。
- API Key 不写入本地文件。
- 也可以通过 `.env.local` 设置 `OPENAI_API_KEY`。

实现方式：

```text
Next.js API
  -> OpenAI Responses API
  -> 返回每个视角的最终回答
```

### 9.3 Vercel 部署模式

Vercel 可以承载 All for One 的网页和 Next.js API。

线上限制：

- Vercel 不能调用用户本机的 Codex 桌面版。
- 线上默认切换为 API Key 模式。
- 可以在 Vercel 环境变量里配置 `OPENAI_API_KEY`，也可以让用户在页面临时填写。

线上调用链：

```text
Vercel Web
  -> Vercel Next.js API
  -> OpenAI Responses API
  -> 返回每个视角和主持人总结
```

## 10. 数据结构

Skill manifest:

```ts
type SkillManifestItem = {
  id: string;
  category: "sage" | "model" | "host";
  name: string;
  shortName: string;
  role: string;
  sourceUrl: string;
  promptFile: string;
  enabledByDefault: boolean;
  isHost?: boolean;
};
```

文件结构：

```text
skills/
  manifest.json
  host.md
  jobs.md
  qiushi.md
  ...
  model-first-principles.md
  model-inversion.md
  model-second-order.md
```

## 11. API

### 11.1 获取视角

```http
GET /api/skills
```

返回所有非主持人视角。

### 11.2 开始推演

```http
POST /api/debate
```

请求：

```json
{
  "question": "我的问题",
  "skillIds": ["jobs", "qiushi", "first-principles"],
  "provider": "desktop",
  "apiKey": ""
}
```

返回：

```json
{
  "summary": "主持人总结",
  "answers": [
    {
      "skillId": "jobs",
      "name": "Steve Jobs Lens",
      "role": "产品体验、取舍、叙事",
      "sourceUrl": "https://github.com/...",
      "content": "回答内容"
    }
  ],
  "model": "codex-desktop",
  "provider": "desktop"
}
```

## 12. 主持人要求

主持人不能只是复述。

主持人必须输出：

- 主持人结论
- 共识
- 分歧
- 盲点
- 下一步

主持人的价值在于帮用户从多视角回答中做判断。

## 13. 风险与约束

### 13.1 Codex 桌面版调用速度

Codex 桌面版模式可能比 API Key 模式慢。

缓解：

- 默认选择较少视角。
- 后续支持“快速模式”和“深度模式”。

### 13.2 Vercel 无法访问本机 Codex 桌面版

Codex 桌面版模式依赖 Glenn 本机的 Codex Desktop app-server。Vercel 云端运行时没有这台 Mac 的桌面环境，也没有本机登录态。

缓解：

- 线上默认使用 API Key 模式。
- API 在 Vercel 环境中收到 `provider=desktop` 时直接返回提示。
- 保留本机 Codex 桌面版模式，作为个人本地工作台的默认体验。

### 13.3 Skill prompt 太长

部分 GitHub skill 文件较长，会增加调用成本和上下文压力。

缓解：

- 后端对 prompt 做长度截断。
- 未来为每个 skill 做 All for One 专用压缩版。

### 13.4 人物视角变成模仿秀

All for One 不应该变成“假装某个人说话”。

缓解：

- 所有 prompt 都声明这是认知视角，不是真人。
- 输出重点放在判断方法，而不是口吻模仿。

## 14. V1 验收标准

- PRD 为中文。
- 页面包含“多位智者”和“思维模型”两组。
- 页面包含“Codex 桌面版 / API Key”调用方式切换。
- 默认选择 Codex 桌面版。
- 部署到 Vercel 后页面默认选择 API Key。
- 用户可以选择多个视角并提交问题。
- 后端可以根据 provider 使用不同调用路径。
- 构建通过。
- 本地可以通过 `npm run dev` 打开。

## 15. 后续版本

- 多轮辩论
- 自动选择视角
- 保存历史推演
- 对比两个方案
- 自定义私人 skill
- 从资料自动生成思维模型
- 把主持人总结导出为 Markdown
- 给每个视角设置权重
