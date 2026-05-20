import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div data-testid="login-page" className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="text-muted-foreground text-sm">Login form coming soon.</p>
      </div>
    </main>
  );
}
