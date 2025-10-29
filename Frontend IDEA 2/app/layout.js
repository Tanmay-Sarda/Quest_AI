import { VT323 } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/component/NavbarWrapper";
import DynamicFooter from "./DynamicFooter";

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Quest AI",
  description: "Retro cyber theme UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={vt323.variable}>
        <NavbarWrapper />
        <div id="content">{children}</div>
        <DynamicFooter />
      </body>
    </html>
  );
}
