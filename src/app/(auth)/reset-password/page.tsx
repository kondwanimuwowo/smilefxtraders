import { AuthShell } from "@/components/shell/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Set new password — Smile FX Traders" };

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
