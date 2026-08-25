import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Loader2, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { redirect: pathname }, replace: true });
    }
  }, [loading, session, navigate, pathname]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/dashboard" className="text-base font-semibold tracking-tight">
            Lead<span className="text-primary">Desk</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">admin</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
