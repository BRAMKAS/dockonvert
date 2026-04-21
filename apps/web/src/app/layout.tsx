import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { APP_NAME, APP_DESCRIPTION, COMPANY_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Document Conversion API`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  keywords: [
    "document conversion", "API", "markdown", "PDF", "docling",
    "BRAMKAS", "converter", "docx to markdown", "pdf to markdown",
  ],
  authors: [{ name: "BRAMKAS INC", url: COMPANY_URL }],
  openGraph: {
    title: `${APP_NAME} — Document Conversion API by BRAMKAS INC`,
    description: APP_DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
  },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
