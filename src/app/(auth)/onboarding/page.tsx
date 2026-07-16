import { Suspense } from "react";
import { AuthShell } from "@/components/shell/AuthShell";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Set up your desk | Smile FX Traders" };

export default function OnboardingPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <OnboardingFlow />
      </Suspense>
    </AuthShell>
  );
}
