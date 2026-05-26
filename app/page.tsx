"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CircleAlert,
  CircleDot,
  Compass,
  Crosshair,
  ChartNetwork,
  Eye,
  EyeOff,
  Gauge,
  History,
  KeyRound,
  Layers,
  ListChecks,
  Loader2,
  MessageSquare,
  Plus,
  Repeat2,
  Scale,
  Search,
  Send,
  SquareScissors,
  Terminal,
  Target,
  Trash2,
  X,
  Users,
} from "lucide-react";

type Skill = {
  id: string;
  category?: "sage" | "model" | "host";
  name: string;
  shortName: string;
  role: string;
  sourceUrl: string;
  promptFile: string;
  enabledByDefault: boolean;
};

type SkillAnswer = {
  skillId: string;
  name: string;
  role: string;
  sourceUrl: string;
  content: string;
};

type DebateResponse = {
  summary: string;
  answers: SkillAnswer[];
  model: string;
  provider?: "desktop" | "openai";
  error?: string;
};

type HistoryEntry = {
  id: string;
  createdAt: string;
  question: string;
  context: string;
  selected: string[];
  provider: "desktop" | "openai";
  result: DebateResponse;
};

const sampleQuestion = "All for One 这个项目第一版应该怎么做，才能我自己真的每天愿意用？";
const maxQuestionLength = 2000;
const maxContextLength = 4000;
const historyStorageKey = "all-for-one.history.v1";
const maxHistoryItems = 80;

const progressPhases = [
  {
    label: "整理资料",
    note: "合并你的问题、补充资料和已选视角。",
  },
  {
    label: "智者推演",
    note: "让不同智者从各自视角拆解问题。",
  },
  {
    label: "模型校验",
    note: "用思维模型检查假设、约束和后果。",
  },
  {
    label: "提炼共识",
    note: "主持人正在压缩各视角的共同判断。",
  },
  {
    label: "对齐分歧",
    note: "主持人正在整理冲突、盲点和取舍。",
  },
  {
    label: "生成行动",
    note: "主持人正在形成下一步建议和最终输出。",
  },
];

const sageMeta: Record<string, { label: string; displayName: string; role: string; tone: string; avatar?: string }> = {
  jobs: {
    label: "SJ",
    displayName: "乔布斯 Jobs",
    role: "产品美学与用户体验的极致追求者",
    tone: "portrait-jobs",
    avatar: "/avatars/jobs.jpg",
  },
  qiushi: {
    label: "求",
    displayName: "求是 Qiushi",
    role: "坚持真理与实事求是",
    tone: "portrait-qiushi",
  },
  feynman: {
    label: "RF",
    displayName: "费曼 Feynman",
    role: "物理学家，追求本质与简单",
    tone: "portrait-feynman",
    avatar: "/avatars/feynman.png",
  },
  munger: {
    label: "CM",
    displayName: "芒格 Munger",
    role: "投资家，多元思维与跨学科",
    tone: "portrait-munger",
    avatar: "/avatars/munger.jpg",
  },
  musk: {
    label: "EM",
    displayName: "马斯克 Musk",
    role: "工程与第一性原理的实践者",
    tone: "portrait-musk",
    avatar: "/avatars/musk.jpg",
  },
  taleb: {
    label: "NT",
    displayName: "塔勒布 Taleb",
    role: "不确定性、尾部风险与反脆弱",
    tone: "portrait-taleb",
    avatar: "/avatars/taleb.jpg",
  },
  naval: {
    label: "NR",
    displayName: "纳瓦尔 Naval",
    role: "杠杆、判断与长期复利",
    tone: "portrait-naval",
    avatar: "/avatars/naval.jpg",
  },
  "paul-graham": {
    label: "PG",
    displayName: "保罗·格雷厄姆 PG",
    role: "创业、写作与产品市场契合",
    tone: "portrait-pg",
    avatar: "/avatars/paul-graham.jpg",
  },
  "zhang-yiming": {
    label: "张",
    displayName: "张一鸣 Yiming",
    role: "信息效率、产品系统与组织",
    tone: "portrait-yiming",
    avatar: "/avatars/zhang-yiming.jpg",
  },
  buffett: {
    label: "WB",
    displayName: "巴菲特 Buffett",
    role: "长期价值、耐心与安全边际",
    tone: "portrait-buffett",
    avatar: "/avatars/buffett.jpg",
  },
};

const modelMeta: Record<string, { icon: ReactNode; role: string }> = {
  "first-principles": {
    icon: <Compass size={28} />,
    role: "回归事物本质，从零开始思考",
  },
  inversion: {
    icon: <Repeat2 size={28} />,
    role: "反向推导路径，寻找根本原因",
  },
  "second-order": {
    icon: <Layers size={28} />,
    role: "看见后果的后果，评估长期影响",
  },
  antifragile: {
    icon: <CircleDot size={28} />,
    role: "从波动中受益，在不确定性中成长",
  },
  "opportunity-cost": {
    icon: <Scale size={28} />,
    role: "选择的代价，比较最佳替代方案",
  },
  "main-contradiction": {
    icon: <Crosshair size={28} />,
    role: "抓住关键矛盾，聚焦核心问题",
  },
  "pareto-principle": {
    icon: <Target size={28} />,
    role: "找到少数关键输入，撬动大部分结果",
  },
  "occams-razor": {
    icon: <SquareScissors size={28} />,
    role: "优先选择假设更少、更简单的解释",
  },
  "circle-of-competence": {
    icon: <Gauge size={28} />,
    role: "分清能力边界，只在懂的范围内决策",
  },
  "systems-thinking": {
    icon: <ChartNetwork size={28} />,
    role: "看见关系、反馈、延迟和系统结构",
  },
};

function getInitialProvider(): "desktop" | "openai" {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? "desktop" : "openai";
}

function isHistoryEntry(item: unknown): item is HistoryEntry {
  const entry = item as Partial<HistoryEntry> | null;
  return (
    Boolean(entry) &&
    typeof entry?.id === "string" &&
    typeof entry.createdAt === "string" &&
    typeof entry.question === "string" &&
    typeof entry.context === "string" &&
    Array.isArray(entry.selected) &&
    (entry.provider === "desktop" || entry.provider === "openai") &&
    Boolean(entry.result) &&
    typeof entry.result?.summary === "string" &&
    Array.isArray(entry.result.answers)
  );
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState(sampleQuestion);
  const [context, setContext] = useState("");
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [result, setResult] = useState<DebateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<"desktop" | "openai">(getInitialProvider);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyDate, setHistoryDate] = useState("");

  useEffect(() => {
    async function loadSkills() {
      const response = await fetch("/api/skills");
      const data = (await response.json()) as { skills: Skill[] };
      setSkills(data.skills);
      setSelected(data.skills.filter((skill) => skill.enabledByDefault).map((skill) => skill.id));
    }

    loadSkills().catch(() => {
      setError("读取本地 skills 失败。");
    });
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(historyStorageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as HistoryEntry[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.filter(isHistoryEntry));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setProgressStep(0);
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextStep = Math.min(progressPhases.length - 1, Math.floor(elapsed / 9000));
      setElapsedSeconds(Math.floor(elapsed / 1000));
      setProgressStep(nextStep);
    }, 900);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const sageSkills = useMemo(() => skills.filter((skill) => skill.category !== "model"), [skills]);
  const modelSkills = useMemo(() => skills.filter((skill) => skill.category === "model"), [skills]);
  const selectedSages = useMemo(
    () => sageSkills.filter((skill) => selected.includes(skill.id)).length,
    [sageSkills, selected],
  );
  const selectedModels = useMemo(
    () => modelSkills.filter((skill) => selected.includes(skill.id)).length,
    [modelSkills, selected],
  );
  const resultModelAnswers = useMemo(
    () => result?.answers.filter((answer) => getAnswerCategory(answer, skills) === "model") ?? [],
    [result, skills],
  );
  const resultSageAnswers = useMemo(
    () => result?.answers.filter((answer) => getAnswerCategory(answer, skills) !== "model") ?? [],
    [result, skills],
  );
  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return history.filter((item) => {
      const matchesDate = historyDate ? item.createdAt.slice(0, 10) === historyDate : true;
      const haystack = `${item.question}\n${item.context}\n${item.result.summary}\n${item.result.answers
        .map((answer) => `${answer.name} ${answer.role} ${answer.content}`)
        .join("\n")}`.toLowerCase();
      return matchesDate && (!query || haystack.includes(query));
    });
  }, [history, historyDate, historyQuery]);
  const allSagesSelected = sageSkills.length > 0 && selectedSages === sageSkills.length;
  const allModelsSelected = modelSkills.length > 0 && selectedModels === modelSkills.length;

  function toggleSkill(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAllSages() {
    const sageIds = sageSkills.map((skill) => skill.id);
    setSelected((current) => {
      const withoutSages = current.filter((id) => !sageIds.includes(id));
      return allSagesSelected ? withoutSages : [...withoutSages, ...sageIds];
    });
  }

  function toggleAllModels() {
    const modelIds = modelSkills.map((skill) => skill.id);
    setSelected((current) => {
      const withoutModels = current.filter((id) => !modelIds.includes(id));
      return allModelsSelected ? withoutModels : [...withoutModels, ...modelIds];
    });
  }

  function saveHistory(entry: HistoryEntry) {
    setHistory((current) => {
      const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, maxHistoryItems);
      window.localStorage.setItem(historyStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function openHistoryEntry(entry: HistoryEntry) {
    setQuestion(entry.question);
    setContext(entry.context);
    setIsContextOpen(Boolean(entry.context));
    setSelected(entry.selected);
    setProvider(entry.provider);
    setResult(entry.result);
    setError("");
    setIsLoading(false);
    setIsHistoryOpen(false);
    window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function deleteHistoryEntry(id: string) {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem(historyStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function clearHistoryFilters() {
    setHistoryQuery("");
    setHistoryDate("");
  }

  async function runCouncil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!question.trim()) {
      setError("先写一个问题。");
      return;
    }

    if (selected.length === 0) {
      setError("至少选择一个视角。");
      return;
    }

    setIsLoading(true);
    const requestSnapshot = {
      question: question.trim(),
      context: context.trim(),
      selected: [...selected],
      provider,
    };

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          context,
          skillIds: selected,
          provider,
          apiKey: provider === "openai" ? apiKey : undefined,
        }),
      });

      const data = (await response.json()) as DebateResponse;

      if (!response.ok) {
        throw new Error(data.error || "生成失败。");
      }

      setResult(data);
      saveHistory({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        ...requestSnapshot,
        result: data,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className={isContextOpen ? "main-stage context-open" : "main-stage"} id="workspace">
        <header className="stage-topbar">
          <div className="top-brand">
            <div className="brand-mark">
              <BrandRoundtable />
            </div>
            <span>All for One</span>
          </div>
          <div className="runtime-pill">
            <Terminal size={15} />
            <span>{provider === "desktop" ? "本机 Codex" : "API Key"}</span>
            <strong>{isLoading ? "推演中" : "就绪"}</strong>
          </div>
          <button className="history-toggle" type="button" onClick={() => setIsHistoryOpen((current) => !current)}>
            <History size={16} />
            <span>历史记录</span>
            <strong>{history.length}</strong>
          </button>
          <div className="user-dot">G</div>
        </header>

        {isHistoryOpen ? (
          <section className="history-panel" aria-label="历史记录">
            <div className="history-head">
              <div>
                <h2>历史记录</h2>
                <p>保存每次问题、资料、视角选择和完整推演结果。</p>
              </div>
              <button type="button" onClick={() => setIsHistoryOpen(false)} title="关闭历史记录">
                <X size={18} />
              </button>
            </div>

            <div className="history-filters">
              <label>
                <Search size={16} />
                <input
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="搜索问题、结论、视角内容"
                />
              </label>
              <label>
                <CalendarDays size={16} />
                <input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
              </label>
              <button type="button" onClick={clearHistoryFilters}>
                清除筛选
              </button>
            </div>

            <div className="history-list">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((entry) => (
                  <article className="history-item" key={entry.id}>
                    <button type="button" onClick={() => openHistoryEntry(entry)}>
                      <span>{formatHistoryTime(entry.createdAt)}</span>
                      <strong>{entry.question}</strong>
                      <small>
                        {entry.selected.length} 个视角 · {entry.provider === "desktop" ? "本机 Codex" : entry.result.model}
                      </small>
                    </button>
                    <button type="button" onClick={() => deleteHistoryEntry(entry.id)} title="删除这条历史">
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="history-empty">
                  <BookOpen size={34} />
                  <span>{history.length === 0 ? "还没有历史记录" : "没有匹配的历史记录"}</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <form className="composer-panel" onSubmit={runCouncil}>
          <div className="question-box">
            <MessageSquare className="question-icon" size={31} />
            <textarea
              id="question"
              maxLength={maxQuestionLength}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="输入一个问题，让智者与思维模型共同推演"
            />
            <div className="char-count">
              {question.length}/{maxQuestionLength}
            </div>
            <button className="send-fab" type="submit" disabled={isLoading} title="开始推演">
              {isLoading ? <Loader2 className="spin" size={24} /> : <Send size={24} />}
            </button>
          </div>

          <div className={isContextOpen ? "context-box open" : "context-box"}>
            <button
              className="context-toggle"
              type="button"
              onClick={() => setIsContextOpen((current) => !current)}
            >
              <BookOpen size={16} />
              <span>资料收集</span>
              <strong>
                {isContextOpen ? "收起" : context.trim() ? `${context.trim().length}/${maxContextLength}` : "可选"}
              </strong>
            </button>
            {isContextOpen ? (
              <textarea
                className="context-input"
                maxLength={maxContextLength}
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="粘贴背景资料、链接摘录、事实观察、用户反馈或约束条件。没有资料时，结论会更多依赖推断。"
              />
            ) : null}
          </div>

          <div className="provider-row">
            <button
              className={provider === "desktop" ? "provider-card active" : "provider-card"}
              type="button"
              onClick={() => setProvider("desktop")}
              title="默认调用 Codex 桌面版"
            >
              <span className="radio-dot" />
              <strong>调用本机 Codex（默认）</strong>
              <Terminal size={18} />
            </button>
            <button
              className={provider === "openai" ? "provider-card active" : "provider-card"}
              type="button"
              onClick={() => setProvider("openai")}
              title="使用临时填写的 OpenAI API Key"
            >
              <span className="radio-dot" />
              <strong>使用 API Key</strong>
              <KeyRound size={18} />
            </button>
            <div className={provider === "openai" ? "api-input visible" : "api-input"}>
              <KeyRound size={17} />
              <input
                disabled={provider !== "openai"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={provider === "openai" ? "输入你的 API Key" : "本机模式无需填写"}
                type={showApiKey ? "text" : "password"}
              />
              <button
                aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                disabled={provider !== "openai"}
                onClick={() => setShowApiKey((current) => !current)}
                title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                type="button"
              >
                {showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </form>

        <div className="council-board">
          <SkillSection
            id="sages"
            variant="sage"
            skills={sageSkills}
            title="多位智者"
            count={`${selectedSages}/${sageSkills.length}`}
            actionLabel={allSagesSelected ? "取消全选" : "全选"}
            addLabel="添加智者"
            icon={<Users size={22} />}
            selected={selected}
            onToggle={toggleSkill}
            onAction={toggleAllSages}
          />
          <SkillSection
            id="models"
            variant="model"
            skills={modelSkills}
            title="思维模型"
            count={`${selectedModels}/${modelSkills.length}`}
            actionLabel={allModelsSelected ? "取消全选" : "全选"}
            addLabel="添加思维模型"
            icon={<Brain size={22} />}
            selected={selected}
            onToggle={toggleSkill}
            onAction={toggleAllModels}
          />
        </div>

        {error ? (
          <div className="error-box">
            <CircleAlert size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="host-panel" id="results" aria-live="polite">
          <div className="host-header">
            <div className="host-avatar">
              <BrandRoundtable />
            </div>
            <div>
              <h2>主持人汇总</h2>
              <p>整合智者观点与模型推演，形成结构化结论</p>
            </div>
          </div>

          {!result && !isLoading ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <div>
                <strong>还没有生成结果</strong>
                <p>输入问题并选择智者与思维模型，点击发送开始推演</p>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-orb">
                <Loader2 className="spin" size={24} />
              </div>
              <div className="loading-copy">
                <strong>{progressPhases[progressStep].label}</strong>
                <p>
                  已等待 {elapsedSeconds} 秒。{selectedSages} 位智者、{selectedModels} 个思维模型正在同一轮推演，
                  完成后会自动显示主持人汇总。
                </p>
                <div className="progress-track">
                  {progressPhases.map((phase, index) => (
                    <span className={index <= progressStep ? "active" : ""} key={phase.label}>
                      {phase.label}
                    </span>
                  ))}
                </div>
                <ol className="progress-list" aria-label="推演进度">
                  {progressPhases.map((phase, index) => (
                    <li className={index <= progressStep ? "active" : ""} key={phase.label}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{phase.label}</strong>
                        <small>{phase.note}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="result-body">
              <article className="host-result">
                <div className="result-source">
                  {result.provider === "desktop" ? "Codex 桌面版" : result.model}
                </div>
                <MarkdownText text={result.summary} structured />
              </article>

              <AnswerGroup title="智者视角" answers={resultSageAnswers} skills={skills} />
              <AnswerGroup title="思维模型校验" answers={resultModelAnswers} skills={skills} />
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function AnswerGroup({ title, answers, skills }: { title: string; answers: SkillAnswer[]; skills: Skill[] }) {
  if (answers.length === 0) {
    return null;
  }

  return (
    <section className="answer-section">
      <div className="answer-section-title">
        <h3>{title}</h3>
        <span>{answers.length}</span>
      </div>
      <div className="answer-grid">
        {answers.map((answer) => {
          const display = getAnswerDisplay(answer, skills);
          const hasExternalSource = /^https?:\/\//.test(answer.sourceUrl);
          return (
            <article className="answer-card" key={answer.skillId}>
              <div className="answer-heading">
                <span className={display.visualClass}>{display.visual}</span>
                <div className="answer-title">
                  <h3>{display.name}</h3>
                  <p className="role">{display.role}</p>
                </div>
                {hasExternalSource ? (
                  <a href={answer.sourceUrl} target="_blank" rel="noreferrer" title="打开这个视角的来源">
                    来源
                  </a>
                ) : (
                  <span className="local-source" title="这个思维模型来自本地内置 prompt">
                    本地
                  </span>
                )}
              </div>
              <MarkdownText text={answer.content} structured />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SkillSection({
  id,
  variant,
  title,
  count,
  actionLabel,
  addLabel,
  icon,
  skills,
  selected,
  onToggle,
  onAction,
}: {
  id: string;
  variant: "sage" | "model";
  title: string;
  count: string;
  actionLabel: string;
  addLabel: string;
  icon: ReactNode;
  skills: Skill[];
  selected: string[];
  onToggle: (id: string) => void;
  onAction?: () => void;
}) {
  return (
    <section className="skill-section" id={id}>
      <div className="section-heading">
        <div className="section-title">
          {icon}
          <h2>{title}</h2>
          <span>{count}</span>
        </div>
        <button type="button" onClick={onAction} disabled={!onAction}>
          {actionLabel}
        </button>
      </div>
      <div className="skill-grid" aria-label={title}>
        {skills.map((skill) => {
          const active = selected.includes(skill.id);
          const display = getSkillDisplay(skill, variant);
          return (
            <button
              className={active ? "skill-chip active" : "skill-chip"}
              key={skill.id}
              type="button"
              onClick={() => onToggle(skill.id)}
              title={skill.role}
            >
              <span className={display.visualClass}>{display.visual}</span>
              <span className="skill-copy">
                <strong>{display.name}</strong>
                <small>{display.role}</small>
              </span>
              <span className="check-dot">{active ? <Check size={13} /> : null}</span>
            </button>
          );
        })}
      </div>
      <button className="add-skill" type="button" disabled title="后续版本开放">
        <Plus size={17} />
        <span>{addLabel}</span>
      </button>
    </section>
  );
}

function getSkillDisplay(skill: Skill, variant: "sage" | "model") {
  if (variant === "model") {
    const meta = modelMeta[skill.id];
    return {
      visual: meta?.icon || <ListChecks size={28} />,
      name: skill.shortName,
      role: meta?.role || skill.role,
      visualClass: "model-logo",
    };
  }

  const meta = sageMeta[skill.id];
  return {
    visual: meta?.avatar ? (
      <AvatarImage alt={`${skill.shortName} 头像`} fallback={meta?.label || skill.shortName.slice(0, 2)} src={meta.avatar} />
    ) : (
      <SagePortrait label={meta?.label || skill.shortName.slice(0, 2)} />
    ),
    name: meta?.displayName || skill.shortName,
    role: meta?.role || skill.role,
    visualClass: `skill-avatar ${meta?.avatar ? "photo-avatar" : meta?.tone || "portrait-default"}`,
  };
}

function getAnswerDisplay(answer: SkillAnswer, skills: Skill[]) {
  const skill = skills.find((item) => item.id === answer.skillId);
  if (!skill) {
    return {
      visual: <SagePortrait label={answer.name.slice(0, 2)} />,
      name: answer.name,
      role: answer.role,
      visualClass: "skill-avatar portrait-default answer-avatar",
    };
  }

  const variant = skill.category === "model" ? "model" : "sage";
  const display = getSkillDisplay(skill, variant);
  return {
    ...display,
    role: display.role || answer.role,
    visualClass: `${display.visualClass} answer-avatar`,
  };
}

function getAnswerCategory(answer: SkillAnswer, skills: Skill[]) {
  return skills.find((item) => item.id === answer.skillId)?.category;
}

function AvatarImage({ alt, fallback, src }: { alt: string; fallback: string; src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <SagePortrait label={fallback} />;
  }

  return <img alt={alt} src={src} onError={() => setHasError(true)} />;
}

function SagePortrait({ label }: { label: string }) {
  return (
    <svg aria-hidden="true" className="portrait-svg" viewBox="0 0 64 64">
      <rect height="64" rx="32" width="64" />
      <circle cx="32" cy="19" r="10" />
      <path d="M14 58c3.4-15 10.4-23 18-23s14.6 8 18 23" />
      <rect className="portrait-label" height="19" rx="9.5" width="38" x="13" y="40" />
      <text x="32" y="50">
        {label}
      </text>
    </svg>
  );
}

function BrandRoundtable() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <circle className="roundtable-ring" cx="24" cy="24" r="14" />
      <circle className="roundtable-center" cx="24" cy="24" r="4.6" />
      <circle className="roundtable-seat" cx="24" cy="5.8" r="3.3" />
      <circle className="roundtable-seat" cx="24" cy="42.2" r="3.3" />
      <circle className="roundtable-seat" cx="5.8" cy="24" r="3.3" />
      <circle className="roundtable-seat" cx="42.2" cy="24" r="3.3" />
      <circle className="roundtable-seat" cx="11.1" cy="11.1" r="3.3" />
      <circle className="roundtable-seat" cx="36.9" cy="11.1" r="3.3" />
      <circle className="roundtable-seat" cx="11.1" cy="36.9" r="3.3" />
      <circle className="roundtable-seat" cx="36.9" cy="36.9" r="3.3" />
    </svg>
  );
}

function splitStructuredText(text: string) {
  return text
    .replace(
      /(?:^|[。；;]\s*)(主持人结论|核心判断|共识|分歧\/取舍|分歧|取舍|盲点|下一步|底层事实|可疑假设|重新组合|如何失败|最大误判|应该避免|反推行动|底层约束|二阶后果|长期期望|脆弱点|可选项|真正成本|被放弃的选择|更好替代|主要矛盾|次要矛盾|阶段判断|集中力量|关键少数|无效多数|优先动作|验证指标|最简单解释|额外假设|反例检查|简化行动|能力圈内|能力圈外|边界判断|补课路径|系统结构|反馈回路|延迟效应|杠杆点)\s*[：:]/g,
      "\n## $1\n",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MarkdownText({ text, structured = false }: { text: string; structured?: boolean }) {
  const source = structured ? splitStructuredText(text) : text;
  return (
    <div className="markdown-text">
      {source.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return <h3 key={`${line}-${index}`}>{line.replace(/^##\s+/, "")}</h3>;
        }

        if (!line.trim()) {
          return <div className="line-break" key={`break-${index}`} />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
