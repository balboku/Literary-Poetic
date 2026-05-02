/**
 * lib/file-parser.ts
 *
 * 統一的前端檔案文字擷取工具。
 * 支援：TXT / MD / CSV / PDF / DOCX / XLSX
 * 所有解析均在瀏覽器端（Client Side）執行，無需後端。
 */

// ─── 型別宣告補充（xlsx 套件無預設 export 型別問題規避）─────────────────────

// pdfjs-dist 的型別由套件本身提供，mammoth / xlsx 同理。

// ─── 主要匯出函式 ─────────────────────────────────────────────────────────────

/**
 * 將任意支援格式的 File 物件解析為純文字字串。
 * @param file 使用者選取或拖曳的檔案
 * @returns 擷取到的純文字內容
 * @throws Error 若格式不支援或解析失敗
 */
export async function parseFileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const mime = file.type;

  // ── 純文字類：直接讀取 ──────────────────────────────────────────────────────
  if (
    mime === "text/plain" ||
    mime === "text/markdown" ||
    mime === "text/csv" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv")
  ) {
    return file.text();
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return parsePdf(file);
  }

  // ── DOCX（Word）────────────────────────────────────────────────────────────
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return parseDocx(file);
  }

  // ── XLSX（Excel）───────────────────────────────────────────────────────────
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  ) {
    return parseXlsx(file);
  }

  throw new Error(
    `不支援的檔案格式：${file.name}（${mime || "未知類型"}）`
  );
}

// ─── PDF 解析（pdfjs-dist，使用 public/ 目錄的 worker）──────────────────────

async function parsePdf(file: File): Promise<string> {
  // 動態 import 避免 SSR 時 pdfjs-dist 嘗試存取 window
  const pdfjsLib = await import("pdfjs-dist");

  // 指向 public/ 目錄中複製好的 worker 檔案
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}

// ─── DOCX 解析（mammoth）────────────────────────────────────────────────────

async function parseDocx(file: File): Promise<string> {
  // 動態 import，mammoth 的 browser 入口為 mammoth/mammoth.browser
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();

  // extractRawText 只取純文字，不含任何 HTML 標籤
  const result = await mammoth.extractRawText({ arrayBuffer });

  if (result.messages.length > 0) {
    // mammoth 會把警告放在 messages，只 console 記錄，不阻斷流程
    console.warn("[file-parser] mammoth 警告：", result.messages);
  }

  return result.value;
}

// ─── XLSX 解析（xlsx / SheetJS）─────────────────────────────────────────────

async function parseXlsx(file: File): Promise<string> {
  const XLSX = await import("xlsx");

  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheetTexts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // sheet_to_csv 可將試算表轉為 CSV 文字，易於 LLM 閱讀
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    sheetTexts.push(`=== 工作表：${sheetName} ===\n${csv}`);
  }

  return sheetTexts.join("\n\n");
}
