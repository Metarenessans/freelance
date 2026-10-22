import { NextResponse } from "next/server";
import { getCachedCompanyInfo } from "@/components/common/json-ld";

export const dynamic = "force-dynamic";

export async function GET() {
  const companyInfo = await getCachedCompanyInfo();
  const phone = companyInfo?.phoneNumber || "Not available in this demo";
  const city = companyInfo?.city || "Naberezhnye Chelny";
  const minOrder = companyInfo?.minOrderAmount || 5000;
  const freeDelivery = companyInfo?.freeDeliveryThreshold || 10000;

  const content = `# Chef Meal Catering

> Buffet dish, party platter and food box delivery, plus off-site catering ${city === "Naberezhnye Chelny" ? "in Naberezhnye Chelny" : `in ${city}`}.

## About us
- Name: Chef Meal Catering
- Service area: ${city}
- Order phone: ${phone}
- Website: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
- Online menu estimate in 15 minutes: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/calculate
- Minimum order: ${minOrder} ₽
- Free delivery from ${freeDelivery} ₽

## Menu highlights
- Ready-made appetizer platters and party food boxes
- Bruschetta, crostini, tartlets and bite-size appetizers
- Meat, fish, cheese and vegetable canapes
- Individual salad cups (verrines)
- Hot banquet dishes and mini skewers
- Party menus for children
- Desserts and sweet buffet tables

## Navigation
- Home page: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/
- Online menu planner: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/calculate
- Catering blog and guides: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog
- Cart: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cart
- Privacy policy: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/privacy-policy
- Public offer: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/public-offer
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
