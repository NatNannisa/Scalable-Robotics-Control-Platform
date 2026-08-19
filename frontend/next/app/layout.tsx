import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Retail Robot Live Session 3D Control Room",
  description: "Nong Chim robot live session monitoring dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
