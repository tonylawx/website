import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "期权工具",
  description: "基于长桥 OpenAPI 的期权工具站点，包含卖 Put 日报与期权年化收益计算器",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "期权工具"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
