"use client";

import { FormEvent, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Clipboard,
  FileText,
  Loader2,
  Newspaper,
  RefreshCw,
  ScrollText,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { parseFileToText } from "../lib/file-parser";

// ─── Types ───────────────────────────────────────────────────────────────────

type StyleOption = {
  value: "warm" | "humorous" | "fantasy" | "fundraising" | "pr" | "concise";
  label: string;
  desc: string;
};

type PitchSlide = {
  title: string;
  bullets: string[];
};

type DataStoryResponse = {
  runId?: string;
  balboOpening: string;
  analogy: string;
  storyCopy: string;
  slogans: string[];
  balboClosing: string;
};

// No activeView needed as we show all sections in a flow

type DataStoryPanelProps = {
  apiEndpoint?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const styleOptions: StyleOption[] = [
  { value: "fundraising", label: "募資簡報", desc: "說服投資人的語氣" },
  { value: "warm", label: "溫暖親切", desc: "有溫度的敘事風格" },
  { value: "humorous", label: "幽默詼諧", desc: "讓人忍不住笑的切入" },
  { value: "fantasy", label: "奇幻魔法", desc: "充滿想像力的奇幻敘事" },
  { value: "pr", label: "公關新聞", desc: "正式媒體稿件格式" },
  { value: "concise", label: "精簡扼要", desc: "去除廢話的白話版本" },
];

const MAX_CHARS = 120000;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataStoryPanel({
  apiEndpoint = "/api/data-story",
}: DataStoryPanelProps) {
  const [inputText, setInputText] = useState("");
  const [style, setStyle] = useState<StyleOption["value"]>("fundraising");
  const [result, setResult] = useState<DataStoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = inputText.length;
  const canSubmit = charCount >= 20 && charCount <= MAX_CHARS && !isLoading;

  // ── File handling ──────────────────────────────────────────────────────────

  async function handleFilesRead(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setError(null);
    const parts: string[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const text = await parseFileToText(file);
        parts.push(`\n\n--- 檔案：${file.name} ---\n\n${text}`);
      } catch (err) {
        console.error(err);
        errors.push(`檔案 ${file.name} 解析失敗：${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (parts.length > 0) {
      setInputText((prev) =>
        (prev + parts.join("")).slice(0, MAX_CHARS)
      );
    }
  }

  function handleFileDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const { files } = event.dataTransfer;
    if (files.length > 0) handleFilesRead(files);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      handleFilesRead(event.target.files);
      // 重設 input 以便下次能選同一批檔案
      event.target.value = "";
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: inputText.trim(), style }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ??
            "Balbo 的翻譯機台暫時卡帶，請稍後再試。",
        );
      }

      const data = (await response.json()) as DataStoryResponse;
      setResult(data);
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
        className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(340px,440px)_1fr]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(191,151,83,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(126,231,218,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* ── Left: Input panel ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-[#b98f49]/35 bg-[#151b2b]/95 p-5 shadow-2xl shadow-black/30">
          {/* Balbo header */}
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d6a85d]/50 bg-[#1e2514] text-[#7ee7da]">
              <ScrollText aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-[#d6a85d]">
                Balbo · 時空萬花筒
              </p>
              <p className="mt-1 text-sm leading-6 text-[#f6ead4]/80">
                把那堆讓人昏昏欲睡的數字扔過來，我用故事把它們叫醒。
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Drop zone / textarea */}
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#f6ead4]"
                htmlFor="data-story-input"
              >
                原始資料或文件內容
              </label>
              <div
                className={[
                  "relative rounded-lg border transition",
                  isDragging
                    ? "border-[#7ee7da] bg-[#14343a]/40"
                    : "border-[#b98f49]/35",
                ].join(" ")}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <textarea
                  id="data-story-input"
                  className="min-h-52 w-full resize-y rounded-lg bg-[#0f1627] px-4 py-3 text-sm leading-7 text-[#f6ead4] outline-none transition focus:ring-2 focus:ring-[#7ee7da]/35"
                  placeholder="貼上規格書、論文摘要、財報數字或產品描述…也可以直接拖曳文件進來（支援 TXT, MD, CSV, PDF, DOCX, XLSX）。"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={MAX_CHARS}
                />
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[#7ee7da] bg-[#14343a]/60">
                    <p className="text-sm font-medium text-[#7ee7da]">
                      放開來讓 Balbo 讀一讀
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <button
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-[#f6ead4]/55 transition hover:text-[#d6a85d] focus:outline-none"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                  上傳檔案（可多選）
                </button>
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
              <input
                ref={fileInputRef}
                accept=".txt,.md,.csv,.pdf,.docx,.xlsx"
                className="sr-only"
                id="data-story-file"
                multiple
                type="file"
                onChange={handleFileChange}
              />
            </div>

            {/* Style selector */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#f6ead4]">
                輸出語氣
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {styleOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={[
                      "flex cursor-pointer flex-col rounded-lg border p-2.5 transition",
                      style === opt.value
                        ? "border-[#7ee7da] bg-[#14343a]"
                        : "border-[#b98f49]/30 bg-[#201c20] hover:border-[#d6a85d]",
                    ].join(" ")}
                  >
                    <input
                      checked={style === opt.value}
                      className="sr-only"
                      name="data-story-style"
                      onChange={() => setStyle(opt.value)}
                      type="radio"
                      value={opt.value}
                    />
                    <span className="text-sm font-medium text-[#f6ead4]">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 text-xs text-[#f6ead4]/55">
                      {opt.desc}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Error */}
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

            {/* Submit */}
            <button
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#d6a85d] px-4 text-base font-semibold text-[#111827] transition hover:bg-[#e5bd76] focus:outline-none focus:ring-2 focus:ring-[#7ee7da] focus:ring-offset-2 focus:ring-offset-[#151b2b] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!canSubmit}
              type="submit"
            >
              {isLoading ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              )}
              {isLoading ? "翻譯機台運轉中" : "啟動時空萬花筒"}
            </button>
          </form>
        </div>

        {/* ── Right: Results panel ───────────────────────────────────────── */}
        <div className="min-h-[640px] rounded-lg border border-[#263958] bg-[#101827]/95 p-4 shadow-2xl shadow-black/25 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[#263958] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#f6ead4]">
                枯燥數據白話文翻譯所
              </h1>
              <p className="mt-1 text-sm text-[#f6ead4]/60">
                {result
                  ? `語氣：${styleOptions.find((s) => s.value === style)?.label}`
                  : "輸入資料，Balbo 幫你說人話"}
              </p>
            </div>
          </div>

          {!isLoading && result ? (
            <DataStoryResult
              result={result}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function DataStoryResult({
  result,
}: {
  result: DataStoryResponse;
}) {
  return (
    <div className="space-y-6 pt-5">
      {/* Balbo opening */}
      <div className="rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/40 p-4">
        <p className="text-sm font-semibold text-[#7ee7da]">Balbo 的招呼：</p>
        <p className="mt-1.5 leading-7 text-[#f6ead4]/85">{result.balboOpening}</p>
      </div>

      {/* 1. Analogy */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
          1. 大叔的白話文翻譯（核心價值比喻）
        </p>
        <div className="rounded-lg border border-[#b98f49]/30 bg-[#171b26] p-4">
          <p className="text-base italic leading-7 text-[#f6ead4]/90">
            「{result.analogy}」
          </p>
        </div>
      </section>

      {/* 2. Story Copy */}
      <TextResultBlock
        label="2. 萬花筒故事文案"
        text={result.storyCopy}
      />

      {/* 3. Slogans */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7ee7da]">
          3. 吸睛金句（Slogan）
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.slogans.map((slogan, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-[#7ee7da]/30 bg-[#14343a]/30 p-4"
            >
              <Zap aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7ee7da]" />
              <p className="text-sm font-medium text-[#f6ead4]">{slogan}</p>
              <button
                className="ml-auto text-[#f6ead4]/40 hover:text-[#7ee7da]"
                onClick={() => navigator.clipboard?.writeText(slogan)}
                title="複製金句"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Balbo closing */}
      {result.balboClosing ? (
        <div className="rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/30 p-4 text-center">
          <p className="text-sm italic leading-7 text-[#d6a85d]">
            {result.balboClosing}
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TextResultBlock({
  label,
  text,
  children,
}: {
  label: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
          {label}
        </p>
        <button
          aria-label={`複製${label}`}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#b98f49]/30 px-2.5 py-1.5 text-xs text-[#f6ead4]/65 transition hover:border-[#7ee7da] hover:text-[#7ee7da] focus:outline-none"
          onClick={() => navigator.clipboard?.writeText(text)}
          type="button"
        >
          <Clipboard aria-hidden="true" className="h-3.5 w-3.5" />
          複製
        </button>
      </div>
      <div className="rounded-lg border border-[#b98f49]/25 bg-[#171b26] p-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-[#f6ead4]/85">
          {text}
        </p>
      </div>
      {children}
    </div>
  );
}

function DataStoryEmptyState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-[#b98f49]/35 bg-[#171b26] text-[#7ee7da]">
          <ScrollText aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold text-[#f6ead4]">
          等你的數字來報到。
        </p>
        <p className="mt-2 text-sm leading-6 text-[#f6ead4]/60">
          規格書、論文、財報、產品說明——任何讓人讀了想睡的東西，都可以。
        </p>
      </div>
    </div>
  );
}

function DataStoryLoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-center justify-center gap-3 text-[#7ee7da]">
          <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Balbo 正在用故事包裹數字</span>
        </div>
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-lg border border-[#263958] bg-[#171b26]"
          />
        ))}
      </div>
    </div>
  );
}
