"use client";

import { usePathname } from "next/navigation";

export function HomeDemoNotice() {
  const pathname = usePathname();
  if (pathname !== "/" || process.env.NEXT_PUBLIC_DEMO_MODE === "false") return null;
  return (
    <aside role="note" style={{ position: "relative", margin: "12px 0 8px", zIndex: 2, padding: "8px 12px", borderRadius: "12px", textAlign: "center", background: "#fff4cc", color: "#312600", lineHeight: 1.4, fontSize: "13.5px" }}>
      <span>Portfolio demonstration - test orders are live with instant Telegram notifications. </span>
      <span style={{ display: "inline-block" }}>
        To receive alerts: 1) Add your username in{" "}
        <a href="https://catering-portfolio-api.vercel.app/admin/orders/telegramsubscriber/add/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", fontWeight: 700, color: "#1a1200" }}>Admin Subscribers ↗</a>,{" "}
        2) Open{" "}
        <a href="https://t.me/cate_portfolio_notification_bot" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", fontWeight: 700, color: "#1a1200" }}>@cate_portfolio_notification_bot ↗</a>{" "}
        and send <code>/start</code>.
      </span>
    </aside>
  );
}
