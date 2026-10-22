import type { Metadata, Viewport } from "next";
import { Geist, Golos_Text } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { Toaster } from "react-hot-toast";
import { JsonLdGlobalWatcher } from "@/components/common/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin", "cyrillic"],
});

import { getCachedCompanyInfo } from "@/components/common/json-ld/server-catalog-cache";
import { toPublicMediaUrl } from "@/utils/seo";

function getRegionCode(city?: string, address?: string): string {
  const text = `${city || ""} ${address || ""}`.toLowerCase();
  if (text.includes("\u043c\u043e\u0441\u043a\u0432") || text.includes("moscow")) return "RU-MOW";
  if (text.includes("\u043f\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433") || text.includes("\u0441\u043f\u0431") || text.includes("spb")) return "RU-SPE";
  if (text.includes("\u0431\u0430\u0448\u043a\u043e\u0440\u0442\u043e\u0441\u0442\u0430\u043d") || text.includes("\u0443\u0444\u0430")) return "RU-BA";
  // Default to the Republic of Tatarstan.
  return "RU-TA";
}

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();

  const brandName =
    companyInfo?.legalName ||
    companyInfo?.companyName ||
    "Chef Meal Catering";

  const city = companyInfo?.city?.trim() || "Naberezhnye Chelny";
  const regionCode = getRegionCode(city, companyInfo?.address);

  // Use precise coordinates from Django CompanyInfo when available.
  // Otherwise use the city center coordinates for Naberezhnye Chelny.
  const lat =
    companyInfo?.latitude != null
      ? Number(companyInfo.latitude).toFixed(6)
      : "55.7436";
  const lon =
    companyInfo?.longitude != null
      ? Number(companyInfo.longitude).toFixed(6)
      : "52.3959";

  const inCityPhrase =
    city === "Naberezhnye Chelny"
      ? "in Naberezhnye Chelny"
      : `in ${city}`;

  const defaultTitle = `${brandName} | Catering and buffet menus ${inCityPhrase}`;
  const defaultDesc = `Order catering, banquet dishes and buffet food for delivery ${inCityPhrase}. Delicious appetizers, bruschetta, canapes and ready-made party platters from ${brandName}.`;

  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);

  return {
    title: {
      default: defaultTitle,
      template: "%s",
    },
    description: defaultDesc,
    keywords: [
      `catering ${city}`,
      "buffet delivery",
      "buffet dishes",
      "party food orders",
      `banquet ${city}`,
      "made-to-order appetizers",
      "canapes",
      "bruschetta",
      "food delivery",
      brandName,
    ],
    authors: [{ name: brandName }],
    metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")),
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: "/icon.svg?v=5", type: "image/svg+xml" },
        { url: "/favicon.ico?v=5", sizes: "any" },
        { url: "/icon-32.png?v=5", sizes: "32x32", type: "image/png" },
        { url: "/icon-96.png?v=5", sizes: "96x96", type: "image/png" },
        { url: "/icon-192.png?v=5", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png?v=5", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png?v=5", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: defaultTitle,
      description: defaultDesc,
      url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
      siteName: brandName,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${brandName} - catering and buffet delivery ${inCityPhrase}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDesc,
      images: [ogImageUrl],
    },
    other: {
      "geo.region": regionCode,
      "geo.placename": city,
      "geo.position": `${lat};${lon}`,
      ICBM: `${lat}, ${lon}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    appleWebApp: {
      title: brandName,
      statusBarStyle: "black",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var msg = (e && (e.message || (e.error && e.error.message))) || '';
                if (
                  msg.indexOf('Loading chunk') !== -1 ||
                  msg.indexOf('ChunkLoadError') !== -1 ||
                  msg.indexOf('Failed to fetch dynamically imported module') !== -1
                ) {
                  var key = 'chunk_reload_' + window.location.pathname;
                  if (!sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, '1');
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${golosText.variable} antialiased`}
        suppressHydrationWarning
        data-vaul-drawer-wrapper=""
      >
        <StoreProvider>

          {children}
          <Toaster position="top-center" />
          <JsonLdGlobalWatcher />
        </StoreProvider>
      </body>
    </html>
  );
}
