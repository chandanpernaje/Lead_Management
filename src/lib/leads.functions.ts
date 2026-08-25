import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { followUpInputSchema, leadFiltersSchema, leadInputSchema } from "./lead-options";
import {
  addFollowUp,
  createLead,
  deleteFollowUp,
  deleteLead,
  getDashboardStats,
  getLead,
  listLeads,
  listTeamMembers,
  updateLead,
} from "./leads.server";

const idSchema = z.object({ id: z.string().uuid() });

export const apiListTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTeamMembers(context.supabase));

export const apiListLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => leadFiltersSchema.parse(data))
  .handler(async ({ data, context }) => listLeads(context.supabase, data));

export const apiGetLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => getLead(context.supabase, data.id));

export const apiCreateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => leadInputSchema.parse(data))
  .handler(async ({ data, context }) => createLead(context.supabase, data, context.userId));

export const apiUpdateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), values: leadInputSchema }).parse(data),
  )
  .handler(async ({ data, context }) => updateLead(context.supabase, data.id, data.values));

export const apiDeleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => deleteLead(context.supabase, data.id));

export const apiAddFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => followUpInputSchema.parse(data))
  .handler(async ({ data, context }) => addFollowUp(context.supabase, data, context.userId));

export const apiDeleteFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => deleteFollowUp(context.supabase, data.id));

export const apiDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getDashboardStats(context.supabase));
