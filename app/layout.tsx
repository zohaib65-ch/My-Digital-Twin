import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Muhammad Zohaib | AI Digital Twin",
  description:
    "Interactive AI Digital Twin of Muhammad Zohaib — Full-Stack Web Developer & MERN/Vue.js Specialist. Strictly grounded in verified portfolio and experience facts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-indigo-500/15 selection:text-indigo-700">
        {children}
      </body>
    </html>
  );
}
