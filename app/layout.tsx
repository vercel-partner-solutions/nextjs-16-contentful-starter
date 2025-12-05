import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Knowledge Articles",
  description: "Browse our knowledge base articles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          <header className="border-b border-black/5 shadow-sm">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <span className="text-2xl font-semibold tracking-tight text-black">
                Knowledge Articles
              </span>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
