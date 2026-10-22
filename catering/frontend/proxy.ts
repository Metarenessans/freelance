import { NextRequest, NextResponse } from "next/server";

// Enforce read-only previews before Next.js forwards requests to Django.
export function proxy(request: NextRequest) {
  const isReadOnly = process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === "true";
  const sandboxPost = process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === "true"
    && request.method.toUpperCase() === "POST"
    && ["/api/v1/orders/", "/api/v1/menu-requests/"].includes(request.nextUrl?.pathname);
  if (isReadOnly && !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase()) && !sandboxPost) {
    return NextResponse.json(
      { error: "DEMO_READ_ONLY", detail: "Demo only: orders and quote requests are disabled." },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/v1/:path*" };
