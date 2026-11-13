import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Google_Sans } from "next/font/google";
import { FloatingBagBar } from "@/components/layout/FloatingBagBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PendingAnalyticsEvent } from "@/components/analytics/PendingAnalyticsEvent";
import "./globals.css";

const GTM_ID = "GTM-MS8T2DQV";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lapa Marketplace | O comércio de Bom Jesus da Lapa - BA",
  description:
    "Encontre roupas, calçados, eletrônicos e ofertas das melhores lojas físicas de Bom Jesus da Lapa com pedido direto no WhatsApp.",
  applicationName: "Lapa Marketplace",
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${googleSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <FloatingBagBar />
        <BottomNav />
        <PendingAnalyticsEvent />
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </body>
    </html>
  );
}
