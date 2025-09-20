import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/component/NavbarWrapper"; // 👈 new client wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quest-AI",
  description: "Unleash your creativity! Write stories, share them with friends, and enjoy collaborative storytelling in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white"
      >
        <NavbarWrapper />
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
