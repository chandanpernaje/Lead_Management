import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import { apiDashboardStats } from "@/lib/leads.functions";
import { STATUSES, formatCurrency } from "@/lib/lead-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | LeadDesk Lead Management" },
      {
        name: "description",
        content:
          "Pipeline overview with total leads, new enquiries, proposals sent, won and lost deals plus potential business value.",
      },
      { property: "og:title", content: "Dashboard | LeadDesk Lead Management" },
      {
        property: "og:description",
        content: "Track lead volume, status split and potential business value at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const STATUS_FILL: Record<string, string> = {
  New: "var(--status-new)",
  Contacted: "var(--status-contacted)",
  "Proposal Sent": "var(--status-proposal)",
  Negotiation: "var(--status-negotiation)",
  Won: "var(--status-won)",
  Lost: "var(--status-lost)",
};

function DashboardPage() {
  const fetchStats = useServerFn(apiDashboardStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Could not load dashboard statistics. {(error as Error)?.message}
        </AlertDescription>
      </Alert>
    );
  }

  const chartData = STATUSES.map((status) => ({
    name: status,
    value: data.byStatus[status] ?? 0,
  }));

  const cards = [
    { label: "Total Leads", value: data.total, hint: "All enquiries recorded" },
    { label: "New Leads", value: data.new, hint: "Awaiting first contact" },
    { label: "Proposal Sent", value: data.proposalSent, hint: "Quotes shared" },
    { label: "Won", value: data.won, hint: formatCurrency(data.wonValue) + " closed" },
    { label: "Lost", value: data.lost, hint: "Marked unsuccessful" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live pipeline summary from the database.</p>
        </div>
        <Button asChild>
          <Link to="/leads/new">
            <Plus className="size-4" /> Add Lead
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Business Value</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatCurrency(data.potentialValue)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated value of all open leads (excludes Won and Lost).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_FILL[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} dy={8} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_FILL[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
