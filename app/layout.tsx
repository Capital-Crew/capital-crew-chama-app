import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalNotification } from "@/components/ui/global-notification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capital Crew Sacco",
  description: "Advanced SACCO Management System",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import { ProgressBar, ProgressBarProvider } from "react-transition-progress";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProgressBarProvider>
              <ProgressBar className="fixed h-1 bg-[#00c2e0] top-0 z-[9999] shadow-[0_0_10px_rgba(0,194,224,0.5)]" />
              {children}
              <Toaster />
              <GlobalNotification />
            </ProgressBarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
