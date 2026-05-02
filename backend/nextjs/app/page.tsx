"use client";

import { useState } from "react";
import {
  Bug,
  ScrollText,
  Shield,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

import InspirationRescuePanel from "../components/InspirationRescuePanel";
import DataStoryPanel from "../components/DataStoryPanel";
import LogicCompassPanel from "../components/LogicCompassPanel";

type ServiceId = "inspiration" | "data-story" | "logic-compass";

type ServiceConfig = {
  id: ServiceId;
  icon: React.ElementType;
  label: string;
  tagline: string;
  badge: string;
  accentColor: string;
};

const services: ServiceConfig[] = [
  {
    id: "inspiration",
    icon: Bug,
    label: "靈感卡殼急救包",
    tagline: "靈感捕蟲網",
    badge: "訂閱制",
    accentColor: "text-[#7ee7da]",
  },
  {
    id: "data-story",
    icon: ScrollText,
    label: "枯燥數據白話文翻譯所",
    tagline: "時空萬花筒",
    badge: "單次計費",
    accentColor: "text-[#d6a85d]",
  },
  {
    id: "logic-compass",
    icon: Shield,
    label: "邏輯羅盤壓力測試",
    tagline: "紅隊羅盤",
    badge: "單次計費",
    accentColor: "text-[#ffb86b]",
  },
];

export default function HomePage() {
  const [activeService, setActiveService] = useState<ServiceId>("inspiration");

  return (
    <div className="min-h-dvh bg-[#0f1627] text-[#f6ead4]">
      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-[#1e2e45] bg-[#0f1627]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d6a85d]/50 bg-[#33251d]">
              <Sparkles
                aria-hidden="true"
                className="h-4 w-4 text-[#d6a85d]"
              />
            </div>
            <span className="hidden text-sm font-semibold text-[#f6ead4] sm:block">
              無盡節點解憂雜貨店
            </span>
          </div>

          <div className="mx-2 hidden h-5 w-px bg-[#263958] sm:block" />

          {/* Service nav */}
          <nav
            aria-label="服務選單"
            className="flex flex-1 gap-1 overflow-x-auto"
          >
            {services.map((svc) => {
              const Icon = svc.icon;
              const isActive = activeService === svc.id;

              return (
                <button
                  key={svc.id}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition",
                    isActive
                      ? "bg-[#151b2b] text-[#f6ead4]"
                      : "text-[#f6ead4]/60 hover:text-[#f6ead4]",
                  ].join(" ")}
                  onClick={() => setActiveService(svc.id)}
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className={["h-4 w-4", isActive ? svc.accentColor : ""].join(
                      " ",
                    )}
                  />
                  <span className="hidden md:block">{svc.label}</span>
                  <span className="block md:hidden">{svc.tagline}</span>
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <a
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#b98f49]/35 px-3 py-1.5 text-xs font-medium text-[#d6a85d] transition hover:border-[#d6a85d] focus:outline-none focus:ring-2 focus:ring-[#7ee7da]/40"
              href="/billing/success"
            >
              <Zap aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="hidden sm:block">升級方案</span>
            </a>
          </div>
        </div>

        {/* Active service indicator strip */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ServiceBreadcrumb active={activeService} services={services} />
        </div>
      </header>

      {/* ── Service panels ────────────────────────────────────────────────── */}
      <main>
        {activeService === "inspiration" ? <InspirationRescuePanel /> : null}
        {activeService === "data-story" ? <DataStoryPanel /> : null}
        {activeService === "logic-compass" ? <LogicCompassPanel /> : null}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e2e45] bg-[#0a0f1e] py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-xs text-[#f6ead4]/40">
            <WandSparkles aria-hidden="true" className="h-3.5 w-3.5" />
            無盡節點解憂雜貨店 · Powered by Gemini · Balbo 大叔守護中
          </p>
          <nav aria-label="頁尾連結" className="flex gap-4">
            <a
              className="cursor-pointer text-xs text-[#f6ead4]/40 transition hover:text-[#f6ead4]/70 focus:outline-none"
              href="/billing/success"
            >
              訂閱方案
            </a>
            <span className="text-[#f6ead4]/25" aria-hidden="true">
              ·
            </span>
            <a
              className="cursor-pointer text-xs text-[#f6ead4]/40 transition hover:text-[#f6ead4]/70 focus:outline-none"
              href="/api/billing-portal"
            >
              帳號管理
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceBreadcrumb({
  active,
  services,
}: {
  active: ServiceId;
  services: ServiceConfig[];
}) {
  const current = services.find((s) => s.id === active);
  if (!current) return null;

  const Icon = current.icon;

  return (
    <div className="flex items-center gap-2 py-2">
      <Icon
        aria-hidden="true"
        className={["h-3.5 w-3.5", current.accentColor].join(" ")}
      />
      <span className="text-xs font-medium text-[#f6ead4]/65">
        {current.label}
      </span>
      <span className="rounded-full border border-[#b98f49]/30 px-2 py-0.5 text-[10px] font-medium text-[#f6ead4]/50">
        {current.badge}
      </span>
    </div>
  );
}
