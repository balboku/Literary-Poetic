"use client";

import { FormEvent, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clipboard,
  FileDown,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Skull,
} from "lucide-react";
import { parseFileToText } from "../lib/file-parser";

// ─── Types ───────────────────────────────────────────────────────────────────

type LogicCompassResponse = {
  runId?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  balboOpening?: string;
  logicalContradictions?: string[];
  marketOptimismRisks?: string[];
  doomScenario?: string;
  sharpQuestions?: { question: string; balboHint: string; }[];
  pivotSuggestion?: string;
  balboClosing?: string;
};

type LogicCompassPanelProps = {
  apiEndpoint?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CHARS = 120000;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LogicCompassPanel({
  apiEndpoint = "/api/logic-compass",
}: LogicCompassPanelProps) {
  const [businessModel, setBusinessModel] = useState("");
  const [personaMask, setPersonaMask] = useState<"vc" | "hater" | "balbo">("balbo");
  const [result, setResult] = useState<LogicCompassResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clarificationReply, setClarificationReply] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const charCount = businessModel.length;
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
      setBusinessModel((prev) =>
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

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await submitToApi(businessModel);
  }

  async function handleClarificationSubmit() {
    if (!clarificationReply.trim() || isLoading) return;
    const newText = businessModel + "\n\n補充細節：" + clarificationReply.trim();
    setBusinessModel(newText);
    setClarificationReply("");
    await submitToApi(newText);
  }

  async function submitToApi(text: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessModel: text.trim(), personaMask }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message ??
            "Balbo 的邏輯羅盤暫時轉不動，請稍後再試。",
        );
      }

      const data = (await response.json()) as LogicCompassResponse;
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

  // ── PDF export via print ───────────────────────────────────────────────────

  function handleExportPdf() {
    window.print();
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #logic-compass-print-region { display: block !important; }
          #logic-compass-print-region { color: #000 !important; background: #fff !important; }
        }
      `}</style>

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d6a85d]/50 bg-[#1a1e2e] text-[#7ee7da]">
                <Shield aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-[#d6a85d]">
                  Balbo · 邏輯羅盤
                </p>
                <p className="mt-1 text-sm leading-6 text-[#f6ead4]/80">
                  先讓我幫你找漏洞，比讓投資人找要好得多。
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Drop zone */}
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-[#f6ead4]"
                  htmlFor="logic-business-model"
                >
                  企劃案或商業模式描述
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
                    id="logic-business-model"
                    className="min-h-60 w-full resize-y rounded-lg bg-[#0f1627] px-4 py-3 text-sm leading-7 text-[#f6ead4] outline-none transition focus:ring-2 focus:ring-[#7ee7da]/35"
                    placeholder="描述你的商業模式、目標客群、收入來源、市場規模、競爭優勢…也可以拖曳文件進來（支援 TXT, MD, CSV, PDF, DOCX, XLSX）。"
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    maxLength={MAX_CHARS}
                  />
                  {isDragging && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[#7ee7da] bg-[#14343a]/60">
                      <p className="text-sm font-medium text-[#7ee7da]">
                        放開，讓 Balbo 讀一讀
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
                    {charCount.toLocaleString()} /{" "}
                    {MAX_CHARS.toLocaleString()}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  accept=".txt,.md,.csv,.pdf,.docx,.xlsx"
                  className="sr-only"
                  id="logic-file"
                  multiple
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesRead(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </div>

              {/* Persona Mask */}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-[#f6ead4]">
                  選擇拷問面具
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex cursor-pointer flex-col rounded-lg border p-2 transition ${personaMask === "balbo" ? "border-[#7ee7da] bg-[#14343a]" : "border-[#b98f49]/30 bg-[#201c20] hover:border-[#d6a85d]"}`}>
                    <input type="radio" className="sr-only" checked={personaMask === "balbo"} onChange={() => setPersonaMask("balbo")} />
                    <span className="text-sm font-medium text-[#f6ead4] text-center">大叔原味</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col rounded-lg border p-2 transition ${personaMask === "vc" ? "border-[#ffb86b] bg-[#3b2117]" : "border-[#b98f49]/30 bg-[#201c20] hover:border-[#d6a85d]"}`}>
                    <input type="radio" className="sr-only" checked={personaMask === "vc"} onChange={() => setPersonaMask("vc")} />
                    <span className="text-sm font-medium text-[#f6ead4] text-center">創投 VC</span>
                  </label>
                  <label className={`flex cursor-pointer flex-col rounded-lg border p-2 transition ${personaMask === "hater" ? "border-[#ff8f8f] bg-[#2b1c1c]" : "border-[#b98f49]/30 bg-[#201c20] hover:border-[#d6a85d]"}`}>
                    <input type="radio" className="sr-only" checked={personaMask === "hater"} onChange={() => setPersonaMask("hater")} />
                    <span className="text-sm font-medium text-[#f6ead4] text-center">無情酸民</span>
                  </label>
                </div>
              </fieldset>

              {/* Warning */}
              <div className="rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/30 p-3">
                <p className="text-xs leading-5 text-[#7ee7da]/80">
                  Balbo 的紅隊測試會揪出邏輯漏洞、數據矛盾與過度樂觀假設——但他批評歸批評，鼓勵歸鼓勵。
                </p>
              </div>

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
                  <Loader2
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin"
                  />
                ) : (
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                )}
                {isLoading ? "紅隊測試進行中" : "啟動邏輯羅盤"}
              </button>
            </form>
          </div>

          {/* ── Right: Results panel ───────────────────────────────────────── */}
          <div className="min-h-[640px] rounded-lg border border-[#263958] bg-[#101827]/95 p-4 shadow-2xl shadow-black/25 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-[#263958] pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#f6ead4]">
                  邏輯羅盤 · 企劃案壓力測試
                </h1>
                <p className="mt-1 text-sm text-[#f6ead4]/60">
                  Red Team · Balbo 友善大叔壓力測試版
                </p>
              </div>
              {result && !result.needsClarification ? (
                <button
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#b98f49]/35 bg-[#151b2b] px-4 py-2.5 text-sm font-medium text-[#d6a85d] transition hover:border-[#d6a85d] hover:text-[#e5bd76] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]/40"
                  onClick={handleExportPdf}
                  type="button"
                >
                  <FileDown aria-hidden="true" className="h-4 w-4" />
                  匯出 PDF 報告
                </button>
              ) : null}
            </div>

            {isLoading ? <LogicCompassLoadingState /> : null}
            {!isLoading && !result ? <LogicCompassEmptyState /> : null}

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
              <div id="logic-compass-print-region" ref={reportRef}>
                <LogicCompassResult result={result} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function LogicCompassResult({ result }: { result: LogicCompassResponse }) {
  return (
    <div className="space-y-6 pt-5">
      {/* Balbo opening (Highly affirming) */}
      <div className="rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/40 p-4">
        <p className="text-sm font-semibold text-[#7ee7da]">Balbo 的高度肯定：</p>
        <p className="mt-1.5 text-sm leading-7 text-[#f6ead4]/85">
          {result.balboOpening}
        </p>
      </div>

      {/* 1. Logical Contradictions */}
      <section aria-label="羅盤指針偏移">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#ffb86b]">
          1. 羅盤指針偏移：邏輯與常理的矛盾
        </p>
        <div className="space-y-2">
          {result.logicalContradictions?.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-[#ffb86b]/25 bg-[#2e1f10]/40 p-3"
            >
              <ShieldAlert
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb86b]"
              />
              <p className="text-sm leading-6 text-[#ffd6a3]/85">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Market Optimism Risks */}
      <section aria-label="迷霧警報">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#ff8f8f]">
          2. 迷霧警報：數據與市場的過度樂觀
        </p>
        <div className="space-y-2">
          {result.marketOptimismRisks?.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-[#ff8f8f]/25 bg-[#2b1c1c]/40 p-3"
            >
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8f8f]"
              />
              <p className="text-sm leading-6 text-[#ffd6a3]/85">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doom Scenario (Pre-mortem) */}
      {result.doomScenario && (
        <section aria-label="毀滅劇本">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#ff4f4f]">
            毀滅劇本：六個月後的慘況
          </p>
          <div className="flex gap-3 rounded-lg border border-[#ff4f4f]/30 bg-[#2e1010]/50 p-4 shadow-lg shadow-[#ff4f4f]/10">
            <Skull
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-[#ff4f4f]"
            />
            <p className="text-sm leading-6 text-[#f6ead4]/90 italic">{result.doomScenario}</p>
          </div>
        </section>
      )}

      {/* 3. Sharp Questions */}
      <section aria-label="大叔的靈魂拷問">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7ee7da]">
          3. 大叔的靈魂拷問（必考題）
        </p>
        <div className="grid gap-3">
          {result.sharpQuestions?.map((q, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/30 p-4"
            >
              <div className="flex gap-3">
                <Target
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#7ee7da]"
                />
                <p className="text-sm font-medium italic leading-6 text-[#f6ead4]">
                  「{q.question}」
                </p>
              </div>
              <p className="ml-7 text-xs text-[#7ee7da]/70 border-l-2 border-[#7ee7da]/30 pl-2">
                {q.balboHint}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pivot Suggestion */}
      {result.pivotSuggestion && (
        <section aria-label="救生圈">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
            救生圈：軸心轉向建議 (Pivot)
          </p>
          <div className="rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/40 p-4">
            <p className="text-sm leading-7 text-[#f6ead4]/90">{result.pivotSuggestion}</p>
          </div>
        </section>
      )}

      {/* Balbo closing */}
      {result.balboClosing && (
        <div className="rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/40 p-4">
          <p className="text-sm font-semibold text-[#d6a85d]">Balbo 悄悄話：</p>
          <p className="mt-1.5 text-sm leading-7 text-[#f6ead4]/85">
            {result.balboClosing}
          </p>
          <button
            aria-label="複製 Balbo 結語"
            className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs text-[#f6ead4]/50 transition hover:text-[#d6a85d] focus:outline-none"
            onClick={() => navigator.clipboard?.writeText(result.balboClosing || '')}
            type="button"
          >
            <Clipboard aria-hidden="true" className="h-3.5 w-3.5" />
            複製結語
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogicCompassEmptyState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-[#b98f49]/35 bg-[#171b26] text-[#7ee7da]">
          <Shield aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold text-[#f6ead4]">
          把企劃案交給 Balbo 來挑剔。
        </p>
        <p className="mt-2 text-sm leading-6 text-[#f6ead4]/60">
          他會找出投資人最可能打臉你的那幾個問題——在你真正面對他們之前。
        </p>
      </div>
    </div>
  );
}

function LogicCompassLoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center pt-5">
      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-center justify-center gap-3 text-[#7ee7da]">
          <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Balbo 正在戴上紅隊帽</span>
        </div>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-lg border border-[#263958] bg-[#171b26]"
          />
        ))}
      </div>
    </div>
  );
}
