import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { apiListTeamMembers } from "@/lib/leads.functions";
import { SERVICES, SOURCES, STATUSES, leadInputSchema, type LeadInput } from "@/lib/lead-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  defaultValues?: Partial<LeadInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: LeadInput) => void;
  onCancel: () => void;
};

export function LeadForm({ defaultValues, submitLabel, submitting, onSubmit, onCancel }: Props) {
  const fetchMembers = useServerFn(apiListTeamMembers);
  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => fetchMembers(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      lead_name: "",
      company_name: "",
      mobile: "",
      email: "",
      service: "Website Development",
      source: "Website",
      estimated_value: null,
      assigned_to: "",
      remarks: null,
      status: "New",
      ...defaultValues,
    },
  });

  const values = watch();

  const err = (field: keyof LeadInput) =>
    errors[field] ? (
      <p className="text-xs text-destructive">{errors[field]?.message as string}</p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      className="grid gap-5 md:grid-cols-2"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="lead_name">Lead Name *</Label>
        <Input id="lead_name" {...register("lead_name")} placeholder="Ravi Menon" />
        {err("lead_name")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <Input id="company_name" {...register("company_name")} placeholder="Acme Retail Pvt Ltd" />
        {err("company_name")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile *</Label>
        <Input id="mobile" inputMode="tel" {...register("mobile")} placeholder="9876543210" />
        {err("mobile")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register("email")} placeholder="ravi@acme.com" />
        {err("email")}
      </div>

      <div className="space-y-2">
        <Label>Service Required *</Label>
        <Select
          value={values.service}
          onValueChange={(v) => setValue("service", v as LeadInput["service"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {SERVICES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("service")}
      </div>

      <div className="space-y-2">
        <Label>Lead Source *</Label>
        <Select
          value={values.source}
          onValueChange={(v) => setValue("source", v as LeadInput["source"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("source")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_value">Estimated Value</Label>
        <Input
          id="estimated_value"
          type="number"
          min={0}
          step="0.01"
          {...register("estimated_value", {
            setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
          })}
          placeholder="150000"
        />
        {err("estimated_value")}
      </div>

      <div className="space-y-2">
        <Label>Assigned To *</Label>
        <Select value={values.assigned_to} onValueChange={(v) => setValue("assigned_to", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("assigned_to")}
      </div>

      <div className="space-y-2">
        <Label>Lead Status *</Label>
        <Select
          value={values.status}
          onValueChange={(v) => setValue("status", v as LeadInput["status"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("status")}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          rows={4}
          {...register("remarks", { setValueAs: (v) => (v === "" ? null : v) })}
          placeholder="Any context about this enquiry"
        />
        {err("remarks")}
      </div>

      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
