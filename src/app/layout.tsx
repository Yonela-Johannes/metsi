import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./tokens.css";
import "./base.css";
import "./components.css";
import { IconSprite } from "@/components/Icon";
import { ThemeScript } from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "Metsi — South Africa Water Monitor",
  description:
    "Real-time hydrological, dam-level and flood intelligence for South Africa, powered by Department of Water and Sanitation (DWS) readings.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a172e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
