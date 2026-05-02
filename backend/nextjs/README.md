# 無盡節點解憂雜貨店 Backend Core

這個資料夾是 Next.js App Router 版本的後端核心邏輯，涵蓋：

- Gemini structured output 呼叫
- 三大服務 API route
- Stripe Checkout
- Stripe Billing Portal
- Stripe Webhook
- Supabase service run / usage ledger / subscription 更新
- 單次服務額度發放與扣除

## 安裝

```bash
cd backend/nextjs
npm install
cp .env.example .env.local
npm run dev
```

請把新的 Gemini API key 放在 `.env.local` 的 `GEMINI_API_KEY`。不要使用已經貼到對話或程式碼裡的舊 key。

## API

- `POST /api/inspiration-rescue`
- `POST /api/data-story`
- `POST /api/logic-compass`
- `POST /api/checkout`
- `POST /api/billing-portal`
- `POST /api/stripe/webhook`

若尚未接 Supabase Auth，開發時可以用 `x-demo-user-id` header 暫時模擬登入者。正式上線請改用 `Authorization: Bearer <supabase-jwt>`。

## Billing mode

`ENFORCE_BILLING=false` 時 API 可直接測試。改成 `true` 後：

- `inspiration_rescue` 需要 active/trialing 訂閱。
- `data_story_translator` 和 `logic_compass` 需要 Checkout 成功後發放的 `credit_wallets.balance`。
- Stripe meter event 會在有 `STRIPE_METER_EVENT_NAME_AI_CREDITS` 與 customer id 時同步送出。
