import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta | Autolavado Digital",
};

export default function RegisterPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-surface">
      <RegisterForm />
    </section>
  );
}
