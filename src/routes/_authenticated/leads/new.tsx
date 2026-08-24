import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LeadForm } from "@/components/LeadForm";
import { apiCreateLead } from "@/lib/leads.functions";
import type { LeadInput } from "@/lib/lead-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/leads/new")({
  head: () => ({
    meta: [
      { title: "Add New Lead | LeadDesk" },
      {
        name: "description",
        content:
          "Record a new client enquiry with contact details, service required, lead source, estimated value and owner.",
      },
      { property: "og:title", content: "Add New Lead | LeadDesk" },
      { property: "og:description", content: "Record a new client enquiry in LeadDesk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewLeadPage,
});

function NewLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createLead = useServerFn(apiCreateLead);

  const mutation = useMutation({
    mutationFn: (values: LeadInput) => createLead({ data: values }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Lead created successfully");
      navigate({ to: "/leads/$leadId", params: { leadId: result.id } });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the lead"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add New Lead</h1>
        <p className="text-sm text-muted-foreground">
          Fields marked with * are required. Duplicate email or mobile numbers are rejected.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            submitLabel="Save Lead"
            submitting={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => navigate({ to: "/leads" })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
