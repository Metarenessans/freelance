"use client";

import { usePathname } from "next/navigation";

export function HomeDemoNotice() {
  const pathname = usePathname();
  if (pathname !== "/" || process.env.NEXT_PUBLIC_DEMO_MODE === "false") return null;
  return (
    <aside role="note" style={{ position: "absolute", left: 0, right: 0, zIndex: 2, padding: "6px 12px", borderRadius: "12px", textAlign: "center", background: "#fff4cc", color: "#312600", lineHeight: 1.4 }}>
      Portfolio demonstration - test orders and estimate requests are fully functional with Telegram notifications. Payment and physical delivery are simulated.
    </aside>
  );
}
