import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Circle Modular Wallet Demo",
  description:
    "A demo application showcasing Circle's Modular Wallet SDK functionality",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-inter">
        <main className="min-h-screen bg-background">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
