import { Suspense } from "react";
import { AuthShell } from "@/components/shell/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in | Smile FX Traders" };

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
