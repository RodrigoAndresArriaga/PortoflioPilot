import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PortfolioPilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Manual-only long-term investment planning
          </p>
        </div>

        <AuthForm />
      </div>
    </div>
  );
}
