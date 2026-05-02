"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Bot,
  Bug,
  ChevronRight,
  Clipboard,
  Loader2,
  RefreshCw,
  Sparkles,
  WandSparkles,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";

type CrossDomainFact = {
  title: string;
  domain: string;
  unexpectedLink: string;
  contentAngle: string;
  trendIntegration: string;
  balboAside: string;
};

type StorySeed = {
  title: string;
  hook: string;
  outline: string[];
  format: string;
  visualCue: string;
  imagePrompt: string;
  trendIntegration: string;
  riskAndFix: string;
};

type InspirationRescueResponse = {
  runId?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  balboOpening?: string;
  crossDomainFacts?: CrossDomainFact[];
  storySeeds?: StorySeed[];
  balboClosing?: string;
};

type FavoriteItem =
  | {
      kind: "cross_domain_fact";
      runId?: string;
      title: string;
      content: CrossDomainFact;
    }
  | {
      kind: "story_seed";
      runId?: string;
      title: string;
      content: StorySeed;
    };

type InspirationRescuePanelProps = {
  apiEndpoint?: string;
  initialTopic?: string;
  onFavorite?: (item: FavoriteItem) => Promise<void> | void;
};

const contentFormats = [
  { value: "longform", label: "長文企劃" },
  { value: "short_video", label: "短影音" },
  { value: "youtube", label: "YouTube" },
  { value: "campaign", label: "行銷活動" },
] as const;

const MAX_CHARS = 120000;

export default function InspirationRescuePanel({
  apiEndpoint = "/api/inspiration-rescue",
  initialTopic = "",
  onFavorite,
}: InspirationRescuePanelProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [format, setFormat] =
    useState<(typeof contentFormats)[number]["value"]>("longform");
  const [activeTab, setActiveTab] = useState<"facts" | "stories">("facts");
  const [result, setResult] = useState<InspirationRescueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationReply, setClarificationReply] = useState("");

  const selectedFormat = useMemo(
    () => contentFormats.find((item) => item.value === format)?.label,
    [format],
  );

  const charCount = topic.length;
  const canSubmit = charCount >= 4 && charCount <= MAX_CHARS && !isLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await submitToApi(topic);
  }

  async function handleClarificationSubmit() {
    if (!clarificationReply.trim() || isLoading) return;
    const newTopic = topic + "\n\n補充細節：" + clarificationReply.trim();
    setTopic(newTopic);
    setClarificationReply("");
    await submitToApi(newTopic);
  }

  async function submitToApi(currentTopic: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentTopic.trim(),
          contentFormat: format,
          service: "inspiration_rescue",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Balbo 的黃銅管線暫時塞住了，請稍後再試。");
      }

      const data = normalizeResponse(await response.json());
      setResult(data);
      setActiveTab("facts");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "發生未知錯誤，請稍後再試。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="min-h-dvh bg-[#0f1627] px-4 py-6 text-[#f6ead4] sm:px-6 lg:px-8">
      <div
        className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(191,151,83,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(126,231,218,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="rounded-lg border border-[#b98f49]/35 bg-[#151b2b]/95 p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d6a85d]/50 bg-[#33251d] text-[#7ee7da]">
              <Bot aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-[#d6a85d]">
                Balbo
              </p>
              <p className="mt-1 text-sm leading-6 text-[#f6ead4]/82">
                {result?.balboOpening ??
                  "卡住不是壞事，那通常只是腦袋在門口翻找鑰匙。"}
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#f6ead4]"
                htmlFor="inspiration-topic"
              >
                卡住的主題
              </label>
              <textarea
                id="inspiration-topic"
                className="min-h-40 w-full resize-y rounded-lg border border-[#b98f49]/35 bg-[#0f1627] px-4 py-3 text-base leading-7 text-[#f6ead4] outline-none transition focus:border-[#7ee7da] focus:ring-2 focus:ring-[#7ee7da]/35"
                placeholder="例：我想做 AI 寫作工具的內容，但每篇都像規格表。"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={MAX_CHARS}
              />
              <div className="mt-1.5 flex justify-end">
                <p
                  className={[
                    "text-xs tabular-nums",
                    charCount > MAX_CHARS * 0.95
                      ? "text-[#ff8f8f]"
                      : "text-[#f6ead4]/45",
                  ].join(" ")}
                >
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#f6ead4]">
                內容形式
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {contentFormats.map((item) => (
                  <label
                    className={[
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition",
                      format === item.value
                        ? "border-[#7ee7da] bg-[#14343a] text-[#f6ead4]"
                        : "border-[#b98f49]/30 bg-[#201c20] text-[#f6ead4]/76 hover:border-[#d6a85d]",
                    ].join(" ")}
                    key={item.value}
                  >
                    <input
                      checked={format === item.value}
                      className="sr-only"
                      name="content-format"
                      onChange={() => setFormat(item.value)}
                      type="radio"
                      value={item.value}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error ? (
              <div
                className="flex gap-2 rounded-lg border border-[#ffb86b]/45 bg-[#3b2117] p-3 text-sm leading-6 text-[#ffd6a3]"
                role="alert"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d6a85d] px-4 text-base font-semibold text-[#111827] transition hover:bg-[#e5bd76] focus:outline-none focus:ring-2 focus:ring-[#7ee7da] focus:ring-offset-2 focus:ring-offset-[#151b2b] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!canSubmit}
              type="submit"
            >
              {isLoading ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              )}
              {isLoading ? "捕捉靈感中" : "啟動靈感捕蟲網"}
            </button>
          </form>
        </div>

        <div className="min-h-[640px] rounded-lg border border-[#263958] bg-[#101827]/95 p-4 shadow-2xl shadow-black/25 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[#263958] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#f6ead4]">
                靈感卡殼急救包
              </h1>
              <p className="mt-1 text-sm text-[#f6ead4]/68">
                {selectedFormat ? `輸出形式：${selectedFormat}` : null}
              </p>
            </div>

            {!result?.needsClarification && (
              <div
                aria-label="輸出方案"
                className="grid grid-cols-2 rounded-lg border border-[#b98f49]/30 bg-[#151b2b] p-1"
                role="tablist"
              >
                <button
                  aria-selected={activeTab === "facts"}
                  className={[
                    "flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition",
                    activeTab === "facts"
                      ? "bg-[#d6a85d] text-[#111827]"
                      : "text-[#f6ead4]/72 hover:text-[#f6ead4]",
                  ].join(" ")}
                  onClick={() => setActiveTab("facts")}
                  role="tab"
                  type="button"
                >
                  <Bug aria-hidden="true" className="h-4 w-4" />
                  A 方案
                </button>
                <button
                  aria-selected={activeTab === "stories"}
                  className={[
                    "flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition",
                    activeTab === "stories"
                      ? "bg-[#d6a85d] text-[#111827]"
                      : "text-[#f6ead4]/72 hover:text-[#f6ead4]",
                  ].join(" ")}
                  onClick={() => setActiveTab("stories")}
                  role="tab"
                  type="button"
                >
                  <WandSparkles aria-hidden="true" className="h-4 w-4" />
                  B 方案
                </button>
              </div>
            )}
          </div>

          {isLoading ? <LoadingState /> : null}

          {!isLoading && !result ? <EmptyState /> : null}

          {!isLoading && result?.needsClarification ? (
            <div className="flex flex-col items-center justify-center pt-8">
              <div className="w-full max-w-md rounded-lg border border-[#ffb86b]/40 bg-[#2e1f10]/80 p-5 shadow-lg">
                <p className="mb-4 text-sm font-semibold text-[#ffb86b]">
                  Balbo 正在吧檯後方看著你...
                </p>
                <p className="mb-6 text-base leading-7 text-[#f6ead4]">
                  「{result.clarificationQuestion}」
                </p>
                <textarea
                  className="mb-4 min-h-24 w-full rounded border border-[#b98f49]/30 bg-[#151b2b] px-3 py-2 text-sm text-[#f6ead4] placeholder-[#f6ead4]/40 outline-none focus:border-[#d6a85d]"
                  placeholder="告訴 Balbo 更多細節..."
                  value={clarificationReply}
                  onChange={(e) => setClarificationReply(e.target.value)}
                />
                <button
                  className="flex w-full items-center justify-center gap-2 rounded bg-[#d6a85d] px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#e5bd76] disabled:opacity-50"
                  disabled={!clarificationReply.trim() || isLoading}
                  onClick={handleClarificationSubmit}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  回覆 Balbo
                </button>
              </div>
            </div>
          ) : null}

          {!isLoading && result && !result.needsClarification && activeTab === "facts" && result.crossDomainFacts ? (
            <div className="grid gap-3 pt-5 xl:grid-cols-3">
              {result.crossDomainFacts.map((fact, index) => (
                <FactCard
                  fact={fact}
                  index={index}
                  key={`${fact.title}-${index}`}
                  onCopy={() => copyText(formatFactForClipboard(fact))}
                  onFavorite={
                    onFavorite
                      ? () =>
                          onFavorite({
                            kind: "cross_domain_fact",
                            runId: result.runId,
                            title: fact.title,
                            content: fact,
                          })
                      : undefined
                  }
                />
              ))}
            </div>
          ) : null}

          {!isLoading && result && !result.needsClarification && activeTab === "stories" && result.storySeeds ? (
            <div className="grid gap-3 pt-5 xl:grid-cols-3">
              {result.storySeeds.map((seed, index) => (
                <StoryCard
                  index={index}
                  key={`${seed.title}-${index}`}
                  onCopy={() => copyText(formatStoryForClipboard(seed))}
                  onFavorite={
                    onFavorite
                      ? () =>
                          onFavorite({
                            kind: "story_seed",
                            runId: result.runId,
                            title: seed.title,
                            content: seed,
                          })
                      : undefined
                  }
                  seed={seed}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && result?.balboClosing && !result.needsClarification ? (
            <div className="mt-6 rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/30 p-4">
              <p className="text-sm font-semibold text-[#d6a85d]">Balbo 叮嚀：</p>
              <p className="mt-1.5 text-sm italic leading-7 text-[#f6ead4]/85">
                「{result.balboClosing}」
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FactCard({
  fact,
  index,
  onCopy,
  onFavorite,
}: {
  fact: CrossDomainFact;
  index: number;
  onCopy: () => void;
  onFavorite?: () => void;
}) {
  return (
    <article className="flex min-h-[360px] flex-col rounded-lg border border-[#b98f49]/30 bg-[#171b26] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[#7ee7da]">
            冷知識 {index + 1}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-7 text-[#f6ead4]">
            {fact.title}
          </h2>
        </div>
        <CardActions onCopy={onCopy} onFavorite={onFavorite} />
      </div>

      <div className="space-y-3 text-sm leading-6">
        <InfoBlock label="領域" value={fact.domain} />
        <InfoBlock label="意外連結" value={fact.unexpectedLink} />
        <InfoBlock label="內容切入" value={fact.contentAngle} />
        {fact.trendIntegration && (
          <div className="rounded-md border border-[#d6a85d]/20 bg-[#33251d]/30 p-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#d6a85d]">
              <TrendingUp className="h-3 w-3" /> 時事雷達
            </p>
            <p className="mt-1 text-sm leading-6 text-[#f6ead4]/82">{fact.trendIntegration}</p>
          </div>
        )}
      </div>

      <p className="mt-auto border-t border-[#263958] pt-4 text-sm leading-6 text-[#ffdca8]">
        {fact.balboAside}
      </p>
    </article>
  );
}

function StoryCard({
  seed,
  index,
  onCopy,
  onFavorite,
}: {
  seed: StorySeed;
  index: number;
  onCopy: () => void;
  onFavorite?: () => void;
}) {
  return (
    <article className="flex min-h-[420px] flex-col rounded-lg border border-[#b98f49]/30 bg-[#171b26] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[#7ee7da]">
            故事種子 {index + 1}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-7 text-[#f6ead4]">
            {seed.title}
          </h2>
        </div>
        <CardActions onCopy={onCopy} onFavorite={onFavorite} />
      </div>

      <InfoBlock label="核心鉤子" value={seed.hook} />

      <ol className="mt-4 space-y-2">
        {seed.outline?.map((item, outlineIndex) => (
          <li
            className="grid grid-cols-[24px_1fr] gap-2 text-sm leading-6 text-[#f6ead4]/82"
            key={`${item}-${outlineIndex}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7ee7da]/35 text-xs text-[#7ee7da]">
              {outlineIndex + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 space-y-3">
        {seed.trendIntegration && (
          <div className="rounded-md border border-[#d6a85d]/20 bg-[#33251d]/30 p-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#d6a85d]">
              <TrendingUp className="h-3 w-3" /> 時事雷達
            </p>
            <p className="mt-1 text-sm leading-6 text-[#f6ead4]/82">{seed.trendIntegration}</p>
          </div>
        )}
        {seed.imagePrompt && (
          <div className="rounded-md border border-[#7ee7da]/20 bg-[#14343a]/30 p-2">
             <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7ee7da]">
               <ImageIcon className="h-3 w-3" /> 視覺化咒語
             </p>
             <code className="mt-1 block text-xs leading-5 text-[#f6ead4]/70">
               {seed.imagePrompt}
             </code>
             <button
               className="mt-1 text-xs text-[#7ee7da] hover:underline"
               onClick={() => copyText(seed.imagePrompt)}
             >
               複製咒語
             </button>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3 border-t border-[#263958] pt-4">
        <InfoBlock label="形式" value={seed.format} />
        <InfoBlock label="踩雷與修正" value={seed.riskAndFix} />
      </div>
    </article>
  );
}

function CardActions({
  onCopy,
  onFavorite,
}: {
  onCopy: () => void;
  onFavorite?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        aria-label="複製內容"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#b98f49]/30 text-[#f6ead4]/76 transition hover:border-[#7ee7da] hover:text-[#7ee7da] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]/40"
        onClick={onCopy}
        title="複製內容"
        type="button"
      >
        <Clipboard aria-hidden="true" className="h-4 w-4" />
      </button>
      {onFavorite ? (
        <button
          aria-label="加入收藏"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#b98f49]/30 text-[#f6ead4]/76 transition hover:border-[#d6a85d] hover:text-[#d6a85d] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]/40"
          onClick={onFavorite}
          title="加入收藏"
          type="button"
        >
          <Bookmark aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#d6a85d]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#f6ead4]/82">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-[#b98f49]/35 bg-[#171b26] text-[#7ee7da]">
          <ChevronRight aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold text-[#f6ead4]">
          Balbo 正在櫃檯後方等你的題目。
        </p>
        <p className="mt-2 text-sm leading-6 text-[#f6ead4]/68">
          把那團卡住的念頭放上桌，他會先敲一敲，再看看裡面有沒有發光。
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-center justify-center gap-3 text-[#7ee7da]">
          <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Balbo 正在擦亮黃銅節點</span>
        </div>
        {[0, 1, 2].map((item) => (
          <div
            className="h-24 animate-pulse rounded-lg border border-[#263958] bg-[#171b26]"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeResponse(raw: unknown): InspirationRescueResponse {
  const root = raw as Record<string, unknown>;
  const output = (root.output_payload ??
    root.outputPayload ??
    root) as Record<string, unknown>;

  if (output.needsClarification) {
    return {
      runId: (root.runId ?? root.run_id ?? output.runId) as string | undefined,
      needsClarification: true,
      clarificationQuestion: output.clarificationQuestion as string,
    };
  }

  const crossDomainFacts = (output.crossDomainFacts ??
    output.cross_domain_facts ??
    output.a_plan) as CrossDomainFact[] | undefined;

  const storySeeds = (output.storySeeds ??
    output.story_seeds ??
    output.b_plan) as StorySeed[] | undefined;

  return {
    runId: (root.runId ?? root.run_id ?? output.runId) as string | undefined,
    needsClarification: false,
    balboOpening:
      ((output.balboOpening ??
        output.balbo_opening ??
        output.balboNote ??
        output.balbo_note) as string | undefined) ??
      "有東西開始亮了，咱們來拆開看看。",
    crossDomainFacts,
    storySeeds,
    balboClosing: (output.balboClosing ??
      output.balbo_closing ??
      output.closing) as string,
  };
}

function formatFactForClipboard(fact: CrossDomainFact) {
  return [
    fact.title,
    `領域：${fact.domain}`,
    `意外連結：${fact.unexpectedLink}`,
    `內容切入：${fact.contentAngle}`,
    fact.trendIntegration ? `時事雷達：${fact.trendIntegration}` : '',
    `Balbo：${fact.balboAside}`,
  ].filter(Boolean).join("\n");
}

function formatStoryForClipboard(seed: StorySeed) {
  return [
    seed.title,
    `核心鉤子：${seed.hook}`,
    "三段式大綱：",
    ...(seed.outline || []).map((item, index) => `${index + 1}. ${item}`),
    `形式：${seed.format}`,
    seed.trendIntegration ? `時事雷達：${seed.trendIntegration}` : '',
    seed.imagePrompt ? `視覺化咒語：${seed.imagePrompt}` : '',
    `踩雷與修正：${seed.riskAndFix}`,
  ].filter(Boolean).join("\n");
}

async function copyText(text: string) {
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
}
