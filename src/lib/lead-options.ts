import { z } from "zod";

export const SERVICES = [
  "Website Development",
  "Web Application",
  "Mobile Application",
  "E-Commerce",
  "SEO",
  "Digital Marketing",
  "Other",
] as const;

export const SOURCES = [
  "Website",
  "WhatsApp",
  "Referral",
  "LinkedIn",
  "Google",
  "Facebook",
  "Other",
] as const;

export const STATUSES = [
  "New",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export const FOLLOWUP_TYPES = [
  "Call",
  "Email",
  "Meeting",
  "WhatsApp",
  "Site Visit",
  "Other",
] as const;

export type LeadService = (typeof SERVICES)[number];
export type LeadSource = (typeof SOURCES)[number];
export type LeadStatus = (typeof STATUSES)[number];
export type FollowUpType = (typeof FOLLOWUP_TYPES)[number];

export const leadInputSchema = z.object({
  lead_name: z.string().trim().min(2, "Lead name must be at least 2 characters").max(100),
  company_name: z.string().trim().min(2, "Company name is required").max(120),
  mobile: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{7,15}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email address").max(160),
  service: z.enum(SERVICES),
  source: z.enum(SOURCES),
  estimated_value: z.number().nonnegative("Value cannot be negative").max(1_000_000_000).nullable(),
  assigned_to: z.string().uuid("Please select a team member"),
  remarks: z.string().trim().max(1000).nullable(),
  status: z.enum(STATUSES),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const followUpInputSchema = z.object({
  lead_id: z.string().uuid(),
  follow_up_date: z.string().min(1, "Date is required"),
  follow_up_type: z.enum(FOLLOWUP_TYPES),
  remarks: z.string().trim().min(2, "Remarks are required").max(1000),
  next_follow_up_date: z.string().nullable(),
});

export type FollowUpInput = z.infer<typeof followUpInputSchema>;

export const leadFiltersSchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  status: z.string().optional().default("all"),
  service: z.string().optional().default("all"),
  assigned_to: z.string().optional().default("all"),
  sort_by: z.enum(["created_at", "estimated_value", "lead_name"]).optional().default("created_at"),
  sort_dir: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  page_size: z.number().int().min(5).max(100).optional().default(10),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;

export const STATUS_COLORS: Record<LeadStatus, string> = {
  New: "bg-status-new/15 text-status-new border-status-new/30",
  Contacted: "bg-status-contacted/15 text-status-contacted border-status-contacted/30",
  "Proposal Sent": "bg-status-proposal/15 text-status-proposal border-status-proposal/30",
  Negotiation: "bg-status-negotiation/15 text-status-negotiation border-status-negotiation/30",
  Won: "bg-status-won/15 text-status-won border-status-won/30",
  Lost: "bg-status-lost/15 text-status-lost border-status-lost/30",
};

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
