-- ===========================================================================
-- 無盡節點解憂雜貨店 · Supabase Database Schema
-- ===========================================================================
-- 執行方式：複製貼上到 Supabase SQL Editor 執行，或用 supabase db push
-- 注意：執行順序重要，請整段一次執行
-- ===========================================================================

-- ── 啟用必要擴充 ──────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── 使用者訂閱狀態表 ─────────────────────────────────────────────────────────
-- 每個用戶可以有多筆訂閱（不同 plan_code），但同一 stripe_subscription_id 唯一

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id    text,
  stripe_subscription_id text unique,
  plan_code             text not null,          -- e.g. 'inspiration_monthly'
  status                text not null,          -- Stripe status: active, trialing, canceled, etc.
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions(stripe_customer_id);

-- ── 單次服務點數錢包 ──────────────────────────────────────────────────────────
-- 用於 data_story_translator 與 logic_compass 服務

create table if not exists public.credit_wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  balance    integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_wallets_user_id_idx
  on public.credit_wallets(user_id);

-- ── 服務執行記錄 ──────────────────────────────────────────────────────────────
-- 每次呼叫 AI 服務都會建立一筆記錄

create table if not exists public.service_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  service         text not null,              -- inspiration_rescue | data_story_translator | logic_compass
  billing_mode    text not null,              -- subscription | one_time | metered
  status          text not null default 'processing', -- processing | completed | failed
  input_text      text,
  input_payload   jsonb not null default '{}'::jsonb,
  output_payload  jsonb,
  model_provider  text default 'google',
  model_name      text,
  error_message   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists service_runs_user_id_idx
  on public.service_runs(user_id);

create index if not exists service_runs_service_idx
  on public.service_runs(service);

create index if not exists service_runs_created_at_idx
  on public.service_runs(created_at desc);

-- ── AI 模型調用詳細記錄 ───────────────────────────────────────────────────────
-- 用於 token 追蹤、成本分析與 prompt 版本管理

create table if not exists public.model_invocations (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.service_runs(id) on delete cascade,
  provider        text not null default 'google',
  model_name      text not null,
  prompt_version  text not null,
  input_tokens    integer,
  output_tokens   integer,
  latency_ms      integer,
  raw_response    jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists model_invocations_run_id_idx
  on public.model_invocations(run_id);

-- ── 用量帳本 ─────────────────────────────────────────────────────────────────
-- 每次服務扣用量都會記一筆，用於計費核對

create table if not exists public.usage_ledger (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  run_id                uuid references public.service_runs(id) on delete set null,
  service               text not null,
  quantity              integer not null default 1,
  unit                  text not null,          -- e.g. 'request' | 'k_tokens'
  stripe_meter_event_id text,
  recorded_at           timestamptz not null default now()
);

create index if not exists usage_ledger_user_id_idx
  on public.usage_ledger(user_id);

create index if not exists usage_ledger_recorded_at_idx
  on public.usage_ledger(recorded_at desc);

-- ── Stripe 事件冪等記錄 ────────────────────────────────────────────────────────
-- 防止 webhook 重複處理同一事件

create table if not exists public.payment_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text not null unique,
  event_type       text not null,
  payload          jsonb not null,
  processed_at     timestamptz not null default now()
);

create index if not exists payment_events_stripe_event_id_idx
  on public.payment_events(stripe_event_id);

create index if not exists payment_events_event_type_idx
  on public.payment_events(event_type);

-- ── 靈感收藏夾 ───────────────────────────────────────────────────────────────
-- 儲存用戶收藏的靈感卡殼急救包結果

create table if not exists public.inspiration_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  run_id       uuid references public.service_runs(id) on delete set null,
  kind         text not null,   -- 'cross_domain_fact' | 'story_seed'
  title        text not null,
  content      jsonb not null,
  created_at   timestamptz not null default now()
);

create index if not exists inspiration_favorites_user_id_idx
  on public.inspiration_favorites(user_id);

create index if not exists inspiration_favorites_created_at_idx
  on public.inspiration_favorites(created_at desc);

-- ===========================================================================
-- Row Level Security (RLS) 設定
-- ===========================================================================

-- 啟用 RLS

alter table public.subscriptions          enable row level security;
alter table public.credit_wallets         enable row level security;
alter table public.service_runs           enable row level security;
alter table public.model_invocations      enable row level security;
alter table public.usage_ledger           enable row level security;
alter table public.payment_events         enable row level security;
alter table public.inspiration_favorites  enable row level security;

-- subscriptions：只能讀自己的

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- credit_wallets：只能讀自己的

create policy "credit_wallets_select_own" on public.credit_wallets
  for select using (auth.uid() = user_id);

-- service_runs：只能讀自己的

create policy "service_runs_select_own" on public.service_runs
  for select using (auth.uid() = user_id);

-- usage_ledger：只能讀自己的

create policy "usage_ledger_select_own" on public.usage_ledger
  for select using (auth.uid() = user_id);

-- inspiration_favorites：用戶可以讀寫自己的收藏

create policy "inspiration_favorites_select_own" on public.inspiration_favorites
  for select using (auth.uid() = user_id);

create policy "inspiration_favorites_insert_own" on public.inspiration_favorites
  for insert with check (auth.uid() = user_id);

create policy "inspiration_favorites_delete_own" on public.inspiration_favorites
  for delete using (auth.uid() = user_id);

-- payment_events：僅 service role 可操作（no user policy = blocked for all users）

-- model_invocations：用戶可透過 run_id 間接查

create policy "model_invocations_select_via_run" on public.model_invocations
  for select using (
    exists (
      select 1 from public.service_runs
      where service_runs.id = model_invocations.run_id
        and service_runs.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- 自動更新 updated_at 的觸發器函式
-- ===========================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger credit_wallets_updated_at
  before update on public.credit_wallets
  for each row execute procedure public.set_updated_at();

-- ===========================================================================
-- 完成！
-- ===========================================================================
-- 資料表列表：
--   subscriptions          · 訂閱狀態（inspiration_monthly）
--   credit_wallets         · 單次服務點數錢包
--   service_runs           · 每次 AI 服務呼叫記錄
--   model_invocations      · Gemini token 用量詳細記錄
--   usage_ledger           · 帳本（Stripe meter 對帳用）
--   payment_events         · Stripe webhook 事件冪等記錄
--   inspiration_favorites  · 靈感收藏夾
-- ===========================================================================
