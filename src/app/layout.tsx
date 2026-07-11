import type { Metadata } from "next";
import { inter, switzer } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Empria", template: "%s · Empria" },
  description:
    "Gestão e inteligência para empresas de vestuário — a planilha entra, a clareza sai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${switzer.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
