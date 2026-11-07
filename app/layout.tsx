import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Courier_Prime, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: "800", variable: "--font-bricolage" });
const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier" });
const caveat = Caveat({ subsets: ["latin"], weight: "600", variable: "--font-caveat" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(siteUrl()),
    title: t("title"),
    description: t("description"),
    openGraph: { title: t("title"), description: t("description"), type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#5A3925",
  colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${bricolage.variable} ${courier.variable} ${caveat.variable} ${inter.variable} antialiased`}>
        <NextIntlClientProvider>
          <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
