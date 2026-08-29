import type { Metadata } from "next";
import { Caveat, DM_Sans, Geist, Geist_Mono, Libre_Baskerville, Patrick_Hand } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plannerHand = Caveat({
  variable: "--font-planner-hand",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plannerScript = Patrick_Hand({
  variable: "--font-planner-script",
  subsets: ["latin"],
  weight: "400",
});

const plannerSerif = Libre_Baskerville({
  variable: "--font-planner-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plannerClean = DM_Sans({
  variable: "--font-planner-clean",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Interactive Planner",
  description:
    "Fill in your digital planner online — same look and navigation as the PDF.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plannerHand.variable} ${plannerScript.variable} ${plannerSerif.variable} ${plannerClean.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
