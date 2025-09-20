"use client"; // client component required for usePathname

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hideNavbar = pathname === "/ChatBox"; // adjust to your chatbox route

  return !hideNavbar ? <Navbar /> : null;
}
