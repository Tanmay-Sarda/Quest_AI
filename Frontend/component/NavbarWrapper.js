"use client"; // client component required for usePathname

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hideNavbar =  pathname.startsWith("/ChatBox/") ;

  return !hideNavbar ? <Navbar /> : null;
}
