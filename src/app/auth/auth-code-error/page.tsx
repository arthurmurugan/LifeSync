import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
        <h1 className="text-2xl font-semibold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">
          There was an error processing your authentication. This could be due to an expired or invalid link.
        </p>
        <div className="space-y-3">
          <Link
            href="/sign-in"
            className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
          >
            Try signing in again
          </Link>
          <Link
            href="/sign-up"
            className="block w-full border border-border hover:bg-accent px-4 py-2 rounded-md transition-colors"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
}