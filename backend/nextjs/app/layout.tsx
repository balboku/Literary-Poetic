import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "無盡節點解憂雜貨店 · Powered by Balbo",
  description:
    "Balbo 大叔帶路的 AI SaaS：靈感卡殼急救包、枯燥數據白話文翻譯所、邏輯羅盤壓力測試，三大服務一站搞定。",
  keywords: ["AI靈感", "內容創作", "數據翻譯", "商業計畫壓力測試", "Balbo"],
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1627",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
