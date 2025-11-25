import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar | Autolavado Digital",
};

export default function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-surface">
      <LoginForm />
    </section>
  );
}
