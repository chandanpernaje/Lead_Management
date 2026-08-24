import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUpDown, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiDeleteLead, apiListLeads, apiListTeamMembers } from "@/lib/leads.functions";
import {
  SERVICES,
  STATUSES,
  STATUS_COLORS,
  formatCurrency,
  type LeadStatus,
} from "@/lib/lead-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads/")({
  head: () => ({
    meta: [
      { title: "All Leads | LeadDesk Lead Management" },
      {
        name: "description",
        content:
          "Search, filter and sort every client enquiry by status, service and owner, then view, edit or delete a lead.",
      },
      { property: "og:title", content: "All Leads | LeadDesk Lead Management" },
      {
        property: "og:description",
        content: "Search, filter and manage every client enquiry in one table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});

const PAGE_SIZE = 10;

function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listLeads = useServerFn(apiListLeads);
  const fetchMembers = useServerFn(apiListTeamMembers);
  const removeLead = useServerFn(apiDeleteLead);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [sortBy, setSortBy] = useState<"created_at" | "estimated_value" | "lead_name">(
    "created_at",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const filters = {
    search,
    status,
    service,
    assigned_to: assignedTo,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["leads", filters],
    queryFn: () => listLeads({ data: filters }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => fetchMembers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeLead({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Lead deleted");
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete the lead"),
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} enquiries recorded` : "Loading enquiries…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/leads/new">
            <Plus className="size-4" /> Add Lead
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, company, email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={service}
            onValueChange={(v) => {
              setService(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={assignedTo}
            onValueChange={(v) => {
              setAssignedTo(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assigned to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() => toggleSort("lead_name")}
                    >
                      Lead <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Service</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() => toggleSort("estimated_value")}
                    >
                      Value <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      Created <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : data && data.rows.length > 0 ? (
                  data.rows.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.lead_name}</TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{lead.mobile}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{lead.service}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lead.team_member?.name ?? "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(lead.estimated_value ?? 0) || null)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            STATUS_COLORS[lead.status as LeadStatus],
                          )}
                        >
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View lead"
                            onClick={() =>
                              navigate({ to: "/leads/$leadId", params: { leadId: lead.id } })
                            }
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit lead"
                            onClick={() =>
                              navigate({ to: "/leads/$leadId/edit", params: { leadId: lead.id } })
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete lead"
                            onClick={() =>
                              setPendingDelete({ id: lead.id, name: lead.lead_name })
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No leads match your filters yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} and all its follow-ups will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
