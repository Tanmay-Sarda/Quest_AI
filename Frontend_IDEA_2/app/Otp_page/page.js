import { Suspense } from "react";
import OtpContent from "@/component/otp_verification.js"

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <OtpContent />
    </Suspense>
  );
}
