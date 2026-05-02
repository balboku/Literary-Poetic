"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clipboard,
  FileText,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { parseFileToText } from "../lib/file-parser";

// ─── Types ───────────────────────────────────────────────────────────────────

type AttachedFile = {
  name: string;
  content: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

type DataStoryVersion = {
  analogy: string;
  storyCopy: string;
  slogans: string[];
};

type DataStoryResponse = {
  runId?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  balboOpening?: string;
  boringReality?: string;
  balboTranslation?: string;
  investorVersion?: DataStoryVersion;
  customerVersion?: DataStoryVersion;
  grandmaVersion?: DataStoryVersion;
  balboClosing?: string;
};

type DataStoryPanelProps = {
  apiEndpoint?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CHARS = 120000;
const DRAFT_STORAGE_KEY = "dataStoryDraft";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataStoryPanel({
  apiEndpoint = "/api/data-story",
}: DataStoryPanelProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<DataStoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clarificationReply, setClarificationReply] = useState("");
  const [activeTab, setActiveTab] = useState<"investor" | "customer" | "grandma">("investor");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount =
    inputText.length +
    attachedFiles.reduce((acc, f) => acc + f.content.length, 0);
  const canSubmit = charCount >= 20 && charCount <= MAX_CHARS && !isLoading;

  // ── State Persistence ──────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.inputText !== undefined) setInputText(parsed.inputText);
        if (parsed.attachedFiles !== undefined) setAttachedFiles(parsed.attachedFiles);
        if (parsed.activeTab !== undefined) setActiveTab(parsed.activeTab);
        if (parsed.messages !== undefined) setMessages(parsed.messages);
      } catch (e) {
        console.error("Failed to parse local storage draft:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ inputText, attachedFiles, activeTab, messages })
      );
    }
  }, [inputText, attachedFiles, activeTab, messages, isMounted]);

  // ── File handling ──────────────────────────────────────────────────────────

  async function handleFilesRead(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setError(null);
    const newFiles: AttachedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const text = await parseFileToText(file);
        newFiles.push({ name: file.name, content: text });
      } catch (err) {
        console.error(err);
        errors.push(
          `檔案 ${file.name} 解析失敗：${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (newFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newFiles]);
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
      event.target.value = "";
    }
  }

  function removeAttachedFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    let combinedContent = inputText;
    if (attachedFiles.length > 0) {
      combinedContent +=
        "\n\n--- 附件資料 ---\n" +
        attachedFiles
          .map((f) => `檔案：${f.name}\n${f.content}`)
          .join("\n\n");
    }

    const initialMessages: Message[] = [
      { role: "user", content: combinedContent.trim() },
    ];
    setMessages(initialMessages);
    await submitToApi(initialMessages);
  }

  async function handleClarificationSubmit() {
    if (!clarificationReply.trim() || isLoading || !result?.clarificationQuestion) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "assistant", content: result.clarificationQuestion },
      { role: "user", content: clarificationReply.trim() },
    ];

    setMessages(updatedMessages);
    setClarificationReply("");
    await submitToApi(updatedMessages);
  }

  async function submitToApi(apiMessages: Message[]) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: apiMessages[apiMessages.length - 1].content,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ??
            "Balbo 的翻譯機台暫時卡帶，請稍後再試。"
        );
      }

      const data = (await response.json()) as DataStoryResponse;
      setResult(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "發生未知錯誤，請稍後再試。"
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
            <div>
              <label
                className="mb-2 block text-sm font-medium text-[#f6ead4]"
                htmlFor="data-story-input"
              >
                指令與補充說明
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
                  placeholder="請在此輸入你的指令或補充說明...（也可以直接拖曳文件進來）"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={Math.max(0, MAX_CHARS - (charCount - inputText.length))}
                />
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[#7ee7da] bg-[#14343a]/60">
                    <p className="text-sm font-medium text-[#7ee7da]">
                      放開來讓 Balbo 讀一讀
                    </p>
                  </div>
                )}
              </div>

              <AttachedFileList
                files={attachedFiles}
                onRemove={removeAttachedFile}
              />

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
                {result && !result.needsClarification
                  ? "三個平行宇宙的白話文版本"
                  : "輸入資料，Balbo 幫你說人話"}
              </p>
            </div>
          </div>

          {isLoading ? <DataStoryLoadingState /> : null}
          {!isLoading && !result ? <DataStoryEmptyState /> : null}

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

          {!isLoading && result && !result.needsClarification ? (
            <div className="space-y-6 pt-5">
              {/* Balbo opening */}
              <div className="rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/40 p-4">
                <p className="text-sm font-semibold text-[#7ee7da]">Balbo 的招呼：</p>
                <p className="mt-1.5 leading-7 text-[#f6ead4]/85">
                  {result.balboOpening}
                </p>
              </div>

              {/* Boring Reality vs Balbo Translation */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-[#263958] bg-[#171b26] p-4">
                  <p className="mb-2 text-xs font-semibold text-[#f6ead4]/50">原始死板數據</p>
                  <p className="text-sm leading-6 text-[#f6ead4]/70">{result.boringReality}</p>
                </div>
                <div className="rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/30 p-4">
                  <p className="mb-2 text-xs font-semibold text-[#d6a85d]">大叔的溫暖總結</p>
                  <p className="text-sm leading-6 text-[#f6ead4]/90">{result.balboTranslation}</p>
                </div>
              </div>

              {/* Tabs for 3 Versions */}
              <div className="mt-8 rounded-lg border border-[#263958] bg-[#151b2b] p-1">
                <div className="flex">
                  <button
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === "investor" ? "bg-[#d6a85d] text-[#111827]" : "text-[#f6ead4]/60 hover:text-[#f6ead4]"}`}
                    onClick={() => setActiveTab("investor")}
                  >
                    給投資人
                  </button>
                  <button
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === "customer" ? "bg-[#d6a85d] text-[#111827]" : "text-[#f6ead4]/60 hover:text-[#f6ead4]"}`}
                    onClick={() => setActiveTab("customer")}
                  >
                    給消費者
                  </button>
                  <button
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${activeTab === "grandma" ? "bg-[#d6a85d] text-[#111827]" : "text-[#f6ead4]/60 hover:text-[#f6ead4]"}`}
                    onClick={() => setActiveTab("grandma")}
                  >
                    給長輩
                  </button>
                </div>
              </div>

              {/* Active Version Content */}
              <div className="mt-4">
                {activeTab === "investor" && result.investorVersion && (
                  <VersionCard version={result.investorVersion} label="投資人視角" />
                )}
                {activeTab === "customer" && result.customerVersion && (
                  <VersionCard version={result.customerVersion} label="消費者視角" />
                )}
                {activeTab === "grandma" && result.grandmaVersion && (
                  <VersionCard version={result.grandmaVersion} label="長輩視角" />
                )}
              </div>

              {/* Balbo closing */}
              {result.balboClosing ? (
                <div className="mt-6 rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/30 p-4 text-center">
                  <p className="text-sm italic leading-7 text-[#d6a85d]">
                    {result.balboClosing}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AttachedFileList({
  files,
  onRemove,
}: {
  files: AttachedFile[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((file, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-full border border-[#7ee7da]/30 bg-[#14343a]/60 px-3 py-1 text-xs text-[#7ee7da]"
        >
          <FileText aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="max-w-[150px] truncate" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            className="ml-1 rounded-full p-0.5 text-[#7ee7da]/70 transition hover:bg-[#7ee7da]/20 hover:text-[#ff8f8f] focus:outline-none"
            onClick={() => onRemove(i)}
            title="移除檔案"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function VersionCard({ version, label }: { version: DataStoryVersion; label: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
          {label}的比喻
        </p>
        <div className="rounded-lg border border-[#b98f49]/30 bg-[#171b26] p-4">
          <p className="text-base italic leading-7 text-[#f6ead4]/90">
            「{version.analogy}」
          </p>
        </div>
      </section>

      <TextResultBlock label="萬花筒故事文案 (PAS架構)" text={version.storyCopy} />

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7ee7da]">
          吸睛金句（Slogan）
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {version.slogans?.map((slogan, i) => (
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
    </div>
  );
}

function TextResultBlock({ label, text, children }: { label: string; text: string; children?: React.ReactNode }) {
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
          <span className="text-sm font-medium">Balbo 正在轉動萬花筒</span>
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

