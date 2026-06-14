import { AuthShell } from "@/components/shell/AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Create account — Smile FX Traders" };

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
