import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Ingresar | Autolavado Digital",
};

export default function LoginPage() {
  return (
    <ThemeProvider>
      <section className="flex min-h-screen items-center justify-center bg-surface dark:bg-slate-900 relative">
        {/* Botón de toggle de tema en la esquina superior derecha */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <LoginForm />
      </section>
    </ThemeProvider>
  );
}
