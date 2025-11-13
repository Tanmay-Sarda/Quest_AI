"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Hide navbar on ChatBox page
  const hideNavbar = pathname.includes("/ChatBox");

  return !hideNavbar ? <Navbar /> : null;
}
