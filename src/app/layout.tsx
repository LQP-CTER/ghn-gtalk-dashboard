import type { Metadata } from "next";
import { Exo } from "next/font/google";
import "./globals.css";

const exo = Exo({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-exo",
});

export const metadata: Metadata = {
  title: "Gtalk Adoption · IBCS Report",
  description: "Dashboard báo cáo Adoption Gtalk chuẩn IBCS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={exo.variable}>
      <body className="font-inter antialiased bg-slate-100 text-slate-800">
        {children}
      </body>
    </html>
  );
}
