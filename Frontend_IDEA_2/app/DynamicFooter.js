"use client";
import { usePathname } from "next/navigation";

export default function DynamicFooter() {
  const pathname = usePathname();

  // Determine footer text based on current route
  const getFooterText = () => {
    // Root path is the Sign_up page
    if (pathname === "/") {
      return "(N) TERMINAL_INIT: QUEST-AI ONLINE. AWAITING COMMAND.";
    }
    if (pathname.includes("/Sign_up")) {
      return "(N) TERMINAL_INIT: QUEST-AI ONLINE. AWAITING COMMAND.";
    }
    if (pathname.includes("/Sign_in")) {
      return "(N) TERMINAL_INIT: QUEST-AI ONLINE. AWAITING COMMAND.";
    }
    if (pathname.includes("/Home")) {
      //return "(N) SESSION ACTIVE. AWAITING COMMAND.";
      return "";
    }
    if (pathname.includes("/About")) {
      return "(N) SYSTEM INFO LOADED.";
    }
    if (pathname.includes("/temp_folder") || pathname.includes("/StoryForm") || pathname.includes("/Create")) {
      return "(N) STORY MATRIX INITIALIZED. AWAITING INPUT.";
    }
    if (pathname.includes("/EditProfile") || pathname.includes("/Edit")) {
      return "(N) USER PROFILE LOADED. AWAITING MODIFICATION.";
    }
    if (pathname.includes("/ChatBox") || pathname.includes("/Story") || pathname.includes("/Chat")) {
      return ""; // No footer on chat page
    }
    return "(N) TERMINAL_INIT: QUEST-AI ONLINE. AWAITING COMMAND.";
  };

  const footerText = getFooterText();

  // Don't render footer if text is empty (chat page)
  if (!footerText) {
    return null;
  }

  return (
    <footer
      id="footer"
      style={{
        position: "absolute",
        bottom: "5px",
        width: "100%",
        textAlign: "center",
        color: "var(--text-color)",
        opacity: 0.7,
        fontSize: "1rem",
        backgroundColor: "var(--footer-bg)",
        animation: "fadeIn 2s ease-out",
      }}
    >
      {footerText}
    </footer>
  );
}