import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


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
    <html lang="vi">
      <body className="font-inter antialiased bg-slate-100 text-slate-800">
        {children}
      </body>
    </html>
  );
}
