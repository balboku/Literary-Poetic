# 無盡節點解憂雜貨店 (Endless Node Grocery) - Backend Core

這是一個基於 Next.js App Router 的 AI 代理服務核心系統，旨在透過溫暖且富有洞察力的 AI 角色 **Balbo**，為創作者與創業家解決靈感卡殼、數據解讀及邏輯盲點等問題。

## 🌟 核心服務 (Core Services)

1.  **靈感卡殼急救包 (Inspiration Rescue)**
    - 透過跨領域冷知識與故事種子，打破思維僵局。
    - 支援多種內容形式（長文、短影音、YouTube、行銷活動）。
2.  **枯燥數據白話文翻譯所 (Data Story Translator)**
    - 將死板的規格書、財報或技術論文翻譯成生動的平行宇宙故事。
    - 針對投資人、消費者與長輩提供不同的專業視角。
3.  **邏輯羅盤 (Logic Compass)**
    - 進行紅隊壓力測試，找出企劃案中的邏輯矛盾與市場過度樂觀假設。
    - 模擬創投 (VC) 或無情酸民等不同人格進行拷問。

## 🚀 重大更新與 UX 優化

我們近期針對用戶體驗進行了深度重構，特別是在 **Data Story Translator** 組件中導入了新的標準：

-   **檔案上傳體驗分離 (UI Separation)**:
    - 捨棄傳統將解析文字直接塞入輸入框的做法，改用獨立的 **Pill UI** 顯示已夾帶檔案清單。
    - 讓使用者能專注於輸入「指令與補充說明」，保持介面整潔。
-   **狀態持久化 (State Persistence)**:
    - 導入 `localStorage` 自動草稿儲存機制。
    - 防止頁面重新整理導致輸入內容或已解析檔案遺失。
-   **結構化「吧檯追問」機制 (Structured Clarification)**:
    - 將對話脈絡改為結構化訊息陣列 (`messages: {role, content}[]`)。
    - 確保 AI 在進行吧檯追問時，能完整繼承先前的對話背景，提升回答精準度。

## 🛠️ 技術棧 (Tech Stack)

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React.
- **Backend**: Next.js API Routes, Gemini Pro API (Structured Output).
- **Storage & Auth**: Supabase.
- **Payment & Metering**: Stripe (Checkout, Billing Portal, Webhooks, Metered Billing).
- **File Parsing**: `pdfjs-dist`, `mammoth`, `xlsx`.

## 📦 安裝與啟動

```bash
cd backend/nextjs
npm install
cp .env.example .env.local
npm run dev
```

請確保在 `.env.local` 中配置正確的 `GEMINI_API_KEY` 與 Stripe/Supabase 相關金鑰。

## 🔌 API 路由

- `POST /api/inspiration-rescue`: 靈感救助
- `POST /api/data-story`: 數據翻譯
- `POST /api/logic-compass`: 邏輯測試
- `POST /api/checkout`: Stripe 支付串接
- `POST /api/billing-portal`: 訂閱管理
- `POST /api/stripe/webhook`: 支付狀態回傳

## 💳 計費模式 (Billing Mode)

系統支援靈活的計費切換（透過 `ENFORCE_BILLING` 環境變數）：
- **訂閱制**: 針對 `inspiration_rescue` 服務。
- **額度制 (Credits)**: 針對 `data_story_translator` 與 `logic_compass` 等高消耗服務。
- **自動計費 (Metered)**: 整合 Stripe Metered Billing，實時回傳 AI 額度消耗。

---
*「卡住不是壞事，那通常只是腦袋在門口翻找鑰匙。」 —— Balbo*
