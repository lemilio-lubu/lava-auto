import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Autolavado Digital",
};

export default function ResetPasswordPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-surface">
      <ResetPasswordForm />
    </section>
  );
}
