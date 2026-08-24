import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LeadForm } from "@/components/LeadForm";
import { apiGetLead, apiUpdateLead } from "@/lib/leads.functions";
import type { LeadInput } from "@/lib/lead-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/leads/$leadId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Lead | LeadDesk" },
      {
        name: "description",
        content:
          "Update enquiry details, reassign the owner and move the lead through the sales pipeline stages.",
      },
      { property: "og:title", content: "Edit Lead | LeadDesk" },
      { property: "og:description", content: "Update an existing enquiry in LeadDesk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditLeadPage,
});

function EditLeadPage() {
  const { leadId } = useParams({ from: "/_authenticated/leads/$leadId/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getLead = useServerFn(apiGetLead);
  const updateLead = useServerFn(apiUpdateLead);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLead({ data: { id: leadId } }),
  });

  const mutation = useMutation({
    mutationFn: (values: LeadInput) => updateLead({ data: { id: leadId, values } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Lead updated");
      navigate({ to: "/leads/$leadId", params: { leadId } });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update the lead"),
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Lead</h1>
        <p className="text-sm text-muted-foreground">{lead.lead_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            submitLabel="Update Lead"
            submitting={mutation.isPending}
            defaultValues={{
              lead_name: lead.lead_name,
              company_name: lead.company_name,
              mobile: lead.mobile,
              email: lead.email,
              service: lead.service,
              source: lead.source,
              estimated_value:
                lead.estimated_value === null ? null : Number(lead.estimated_value),
              assigned_to: lead.assigned_to,
              remarks: lead.remarks,
              status: lead.status,
            }}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => navigate({ to: "/leads/$leadId", params: { leadId } })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
