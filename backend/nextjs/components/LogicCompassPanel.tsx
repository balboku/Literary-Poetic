"use client";

import { FormEvent, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
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
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = "low" | "medium" | "high" | "critical";

type Vulnerability = {
  severity: Severity;
  issue: string;
  whyItMatters: string;
  sharpQuestion: string;
  fix: string;
};

type LogicCompassResponse = {
  runId?: string;
  balboSummary: string;
  riskScore: number;
  vulnerabilities: Vulnerability[];
  dataContradictions: string[];
  validationExperiments: string[];
  revisedDirection: string[];
  balboClosing: string;
};

type LogicCompassPanelProps = {
  apiEndpoint?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_CHARS = 120000;

const severityConfig: Record<
  Severity,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "低風險",
    color: "text-[#7ee7da]",
    bg: "bg-[#14343a]/40",
    border: "border-[#7ee7da]/30",
  },
  medium: {
    label: "中風險",
    color: "text-[#ffd6a3]",
    bg: "bg-[#2e2517]/40",
    border: "border-[#ffd6a3]/30",
  },
  high: {
    label: "高風險",
    color: "text-[#ffb86b]",
    bg: "bg-[#2e1f10]/40",
    border: "border-[#ffb86b]/35",
  },
  critical: {
    label: "致命",
    color: "text-[#ff8f8f]",
    bg: "bg-[#2b1c1c]/60",
    border: "border-[#ff8f8f]/40",
  },
};

function riskScoreColor(score: number) {
  if (score <= 3) return "text-[#7ee7da]";
  if (score <= 6) return "text-[#ffd6a3]";
  if (score <= 8) return "text-[#ffb86b]";
  return "text-[#ff8f8f]";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LogicCompassPanel({
  apiEndpoint = "/api/logic-compass",
}: LogicCompassPanelProps) {
  const [businessModel, setBusinessModel] = useState("");
  const [result, setResult] = useState<LogicCompassResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const charCount = businessModel.length;
  const canSubmit = charCount >= 20 && charCount <= MAX_CHARS && !isLoading;

  // ── File handling ──────────────────────────────────────────────────────────

  async function handleFileRead(file: File) {
    const text = await file.text();
    setBusinessModel(text.slice(0, MAX_CHARS));
  }

  function handleFileDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFileRead(file);
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
        body: JSON.stringify({ businessModel: businessModel.trim() }),
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
                    placeholder="描述你的商業模式、目標客群、收入來源、市場規模、競爭優勢…也可以拖曳 TXT 進來。"
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
                    上傳 TXT 企劃書
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
                  accept=".txt,.md"
                  className="sr-only"
                  id="logic-file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileRead(file);
                  }}
                />
              </div>

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
              {result ? (
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
            {!isLoading && result ? (
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
      {/* Risk score + Balbo summary */}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        {/* Score circle */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#b98f49]/30 bg-[#171b26] px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#f6ead4]/55">
            風險總分
          </p>
          <p
            className={[
              "mt-1 text-5xl font-bold tabular-nums",
              riskScoreColor(result.riskScore),
            ].join(" ")}
          >
            {result.riskScore}
          </p>
          <p className="mt-0.5 text-xs text-[#f6ead4]/45">/ 10</p>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/40 p-4">
          <p className="text-sm font-semibold text-[#7ee7da]">Balbo 總評：</p>
          <p className="mt-1.5 text-sm leading-7 text-[#f6ead4]/85">
            {result.balboSummary}
          </p>
        </div>
      </div>

      {/* Vulnerabilities */}
      {result.vulnerabilities.length > 0 ? (
        <section aria-label="漏洞清單">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
            發現的漏洞（{result.vulnerabilities.length} 項）
          </p>
          <div className="space-y-3">
            {result.vulnerabilities.map((vuln, i) => (
              <VulnerabilityCard key={i} index={i} vuln={vuln} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Data contradictions */}
      {result.dataContradictions.length > 0 ? (
        <section aria-label="數據矛盾">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#ffb86b]">
            數據矛盾（{result.dataContradictions.length} 項）
          </p>
          <div className="space-y-2">
            {result.dataContradictions.map((item, i) => (
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
      ) : null}

      {/* Validation experiments */}
      <section aria-label="驗證實驗">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7ee7da]">
          Balbo 建議的驗證實驗
        </p>
        <div className="space-y-2">
          {result.validationExperiments.map((exp, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-[#7ee7da]/20 bg-[#14343a]/30 p-3"
            >
              <Target
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#7ee7da]"
              />
              <p className="text-sm leading-6 text-[#f6ead4]/85">{exp}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revised direction */}
      <section aria-label="修正版方向">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#d6a85d]">
          修正版方向
        </p>
        <div className="space-y-2">
          {result.revisedDirection.map((dir, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-[#b98f49]/25 bg-[#171b26] p-3"
            >
              <CheckCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#d6a85d]"
              />
              <p className="text-sm leading-6 text-[#f6ead4]/85">{dir}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Balbo closing */}
      <div className="rounded-lg border border-[#d6a85d]/30 bg-[#2e2517]/40 p-4">
        <p className="text-sm font-semibold text-[#d6a85d]">Balbo 最後說：</p>
        <p className="mt-1.5 text-sm leading-7 text-[#f6ead4]/85">
          {result.balboClosing}
        </p>
        <button
          aria-label="複製 Balbo 結語"
          className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs text-[#f6ead4]/50 transition hover:text-[#d6a85d] focus:outline-none"
          onClick={() => navigator.clipboard?.writeText(result.balboClosing)}
          type="button"
        >
          <Clipboard aria-hidden="true" className="h-3.5 w-3.5" />
          複製結語
        </button>
      </div>
    </div>
  );
}

// ─── Vulnerability Card ───────────────────────────────────────────────────────

function VulnerabilityCard({
  vuln,
  index,
}: {
  vuln: Vulnerability;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[vuln.severity];

  return (
    <article
      className={[
        "rounded-lg border p-4 transition",
        cfg.bg,
        cfg.border,
      ].join(" ")}
    >
      <button
        className="flex w-full cursor-pointer items-start gap-3 text-left focus:outline-none"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
        aria-expanded={expanded}
      >
        <span
          className={[
            "mt-0.5 rounded-md px-2 py-0.5 text-xs font-semibold",
            cfg.color,
            cfg.border,
            "border",
          ].join(" ")}
        >
          {cfg.label}
        </span>
        <span className="flex-1 text-sm font-medium leading-6 text-[#f6ead4]">
          {index + 1}. {vuln.issue}
        </span>
        {expanded ? (
          <ChevronUp
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[#f6ead4]/55"
          />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[#f6ead4]/55"
          />
        )}
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 border-t border-[#263958] pt-3">
          <InfoRow label="為什麼重要" value={vuln.whyItMatters} />
          <InfoRow label="Balbo 的追問" value={vuln.sharpQuestion} accent />
          <InfoRow label="建議修正" value={vuln.fix} />
        </div>
      ) : null}
    </article>
  );
}

function InfoRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={[
          "text-xs font-semibold",
          accent ? "text-[#ffd6a3]" : "text-[#d6a85d]",
        ].join(" ")}
      >
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#f6ead4]/82">{value}</p>
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
