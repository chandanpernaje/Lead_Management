import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiAddFollowUp, apiDeleteFollowUp, apiGetLead } from "@/lib/leads.functions";
import {
  FOLLOWUP_TYPES,
  STATUS_COLORS,
  formatCurrency,
  type FollowUpType,
  type LeadStatus,
} from "@/lib/lead-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads/$leadId/")({
  head: () => ({
    meta: [
      { title: "Lead Details & Follow-ups | LeadDesk" },
      {
        name: "description",
        content:
          "View full enquiry details and log every call, email or meeting with the next scheduled follow-up date.",
      },
      { property: "og:title", content: "Lead Details & Follow-ups | LeadDesk" },
      {
        property: "og:description",
        content: "Full enquiry details with a complete follow-up history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadDetailPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function LeadDetailPage() {
  const { leadId } = useParams({ from: "/_authenticated/leads/$leadId/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getLead = useServerFn(apiGetLead);
  const addFollowUp = useServerFn(apiAddFollowUp);
  const removeFollowUp = useServerFn(apiDeleteFollowUp);

  const [type, setType] = useState<FollowUpType>("Call");
  const [date, setDate] = useState(today());
  const [nextDate, setNextDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLead({ data: { id: leadId } }),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      addFollowUp({
        data: {
          lead_id: leadId,
          follow_up_date: date,
          follow_up_type: type,
          remarks: remarks.trim(),
          next_follow_up_date: nextDate || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      setRemarks("");
      setNextDate("");
      toast.success("Follow-up added");
    },
    onError: (e: Error) => toast.error(e.message || "Could not add follow-up"),
  });

  const deleteFollowUpMutation = useMutation({
    mutationFn: (id: string) => removeFollowUp({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast.success("Follow-up removed");
    },
    onError: (e: Error) => toast.error(e.message),
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
        <AlertDescription>{(error as Error)?.message ?? "Lead not found."}</AlertDescription>
      </Alert>
    );
  }

  const lead = data.lead;
  const details: Array<[string, string]> = [
    ["Company", lead.company_name],
    ["Mobile", lead.mobile],
    ["Email", lead.email],
    ["Service Required", lead.service],
    ["Lead Source", lead.source],
    ["Estimated Value", formatCurrency(Number(lead.estimated_value ?? 0) || null)],
    ["Assigned To", lead.team_member?.name ?? "—"],
    ["Created", new Date(lead.created_at).toLocaleString()],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/leads" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{lead.lead_name}</h1>
            <span
              className={cn(
                "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                STATUS_COLORS[lead.status as LeadStatus],
              )}
            >
              {lead.status}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/leads/$leadId/edit" params={{ leadId }}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Lead information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-right text-sm font-medium break-all">{value}</span>
              </div>
            ))}
            {lead.remarks ? (
              <div>
                <p className="text-sm text-muted-foreground">Remarks</p>
                <p className="mt-1 text-sm">{lead.remarks}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (remarks.trim().length < 2) {
                    setFormError("Please enter follow-up remarks.");
                    return;
                  }
                  if (nextDate && nextDate < date) {
                    setFormError("Next follow-up date cannot be before the follow-up date.");
                    return;
                  }
                  setFormError(null);
                  addMutation.mutate();
                }}
                noValidate
              >
                {formError ? (
                  <Alert variant="destructive" className="sm:col-span-2">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="fdate">Date *</Label>
                  <Input
                    id="fdate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Follow-up Type *</Label>
                  <Select value={type} onValueChange={(v) => setType(v as FollowUpType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOWUP_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fremarks">Remarks *</Label>
                  <Textarea
                    id="fremarks"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Spoke with the client about scope and budget…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fnext">Next Follow-up Date</Label>
                  <Input
                    id="fnext"
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Add Follow-up
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Follow-up history ({data.followUps.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No follow-ups recorded yet.</p>
              ) : (
                data.followUps.map((f) => (
                  <div key={f.id} className="rounded-xl border bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {f.follow_up_type}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(f.follow_up_date).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete follow-up"
                        onClick={() => deleteFollowUpMutation.mutate(f.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm">{f.remarks}</p>
                    {f.next_follow_up_date ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="size-3" />
                        Next follow-up: {new Date(f.next_follow_up_date).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
