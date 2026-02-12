import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider"; // <--- Importação Adicionada
import "./globals.css";

export const metadata: Metadata = {
  title: "EduConnect - Plataforma Educacional",
  description: "Conectando estudantes, construindo comunidades",
  generator: "v0.app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning é OBRIGATÓRIO ao usar next-themes para evitar erros no console
    <html lang="pt" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"      // <--- Define o padrão como PRETO
            enableSystem={false}     // <--- Ignora a preferência do Windows/Mac para garantir o início em preto
            disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}