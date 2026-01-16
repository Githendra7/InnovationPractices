import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/common/Providers";
// import { Toaster } from "@/components/ui/sonner"; 
// Note: Shadcn `sonner` or `toaster` needed for notifications. 
// I didn't install sonner specific component but initialized shadcn.
// Standard shadcn init usually adds toaster if requested? 
// I'll stick to basic Providers for now, and add Toaster if I find the file.
// I'll assume standard layout for now.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Innovation Tool",
  description: "AI-assisted product development support tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-stone-50 text-stone-900">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
