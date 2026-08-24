import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiEnsureAdmin } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Usernames are mapped to an internal email so the auth provider stays standard. */
const USERNAME_DOMAIN = "@leadms.app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | LeadDesk Lead Management" },
      {
        name: "description",
        content:
          "Secure sign in to LeadDesk, the lead management system for tracking enquiries, follow-ups and pipeline value.",
      },
      { property: "og:title", content: "Sign in | LeadDesk Lead Management" },
      {
        property: "og:description",
        content: "Secure sign in to the LeadDesk lead management system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    const email = username.trim().includes("@")
      ? username.trim().toLowerCase()
      : `${username.trim().toLowerCase()}${USERNAME_DOMAIN}`;

    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      // First-run bootstrap: provision the documented demo account, then retry once.
      if (signInError && email === `admin${USERNAME_DOMAIN}` && password === "Admin@123") {
        await apiEnsureAdmin();
        ({ error: signInError } = await supabase.auth.signInWithPassword({ email, password }));
      }

      if (signInError) {
        setError("Invalid username or password. Please try again.");
        return;
      }

      const target = search.redirect?.startsWith("/") ? search.redirect : "/dashboard";
      navigate({ to: target, replace: true });
    } catch {
      setError("We could not reach the server. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">LeadDesk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lead Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
          noValidate
        >
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Sign in
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <KeyRound className="size-3" />
            Test login: admin / Admin@123
          </p>
        </form>
      </div>
    </main>
  );
}
