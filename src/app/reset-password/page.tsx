import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Autolavado Digital",
};

export default function ResetPasswordPage() {
  return (
    <ThemeProvider>
      <section className="flex min-h-screen items-center justify-center bg-surface dark:bg-slate-900 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <ResetPasswordForm />
      </section>
    </ThemeProvider>
  );
}
