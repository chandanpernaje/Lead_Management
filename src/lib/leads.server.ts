import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { FollowUpInput, LeadFilters, LeadInput } from "./lead-options";

export type Db = SupabaseClient<Database>;

/** Turns a database error into a message that is safe and useful for the UI. */
function fail(error: { code?: string; message: string; details?: string }): never {
  if (error.code === "23505") {
    const dup = error.message.includes("mobile") ? "mobile number" : "email address";
    throw new Error(`A lead with this ${dup} already exists.`);
  }
  if (error.code === "23503") {
    throw new Error("The selected team member no longer exists.");
  }
  console.error("[db]", error);
  throw new Error(error.message || "Database request failed.");
}

const LEAD_SELECT = "*, team_member:team_members(id, name)";

export async function listTeamMembers(db: Db) {
  const { data, error } = await db
    .from("team_members")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name");
  if (error) fail(error);
  return data ?? [];
}

export async function listLeads(db: Db, filters: LeadFilters) {
  let query = db.from("leads").select(LEAD_SELECT, { count: "exact" });

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `lead_name.ilike.${term},company_name.ilike.${term},email.ilike.${term},mobile.ilike.${term}`,
    );
  }
  if (filters.status !== "all") query = query.eq("status", filters.status as never);
  if (filters.service !== "all") query = query.eq("service", filters.service as never);
  if (filters.assigned_to !== "all") query = query.eq("assigned_to", filters.assigned_to);

  const from = (filters.page - 1) * filters.page_size;
  query = query
    .order(filters.sort_by, { ascending: filters.sort_dir === "asc", nullsFirst: false })
    .range(from, from + filters.page_size - 1);

  const { data, error, count } = await query;
  if (error) fail(error);
  return { rows: data ?? [], total: count ?? 0, page: filters.page, pageSize: filters.page_size };
}

export async function getLead(db: Db, id: string) {
  const { data, error } = await db.from("leads").select(LEAD_SELECT).eq("id", id).maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error("Lead not found.");

  const { data: followUps, error: fErr } = await db
    .from("follow_ups")
    .select("*")
    .eq("lead_id", id)
    .order("follow_up_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (fErr) fail(fErr);

  return { lead: data, followUps: followUps ?? [] };
}

export async function createLead(db: Db, input: LeadInput, userId: string) {
  const { data, error } = await db
    .from("leads")
    .insert({ ...input, created_by: userId })
    .select("id")
    .single();
  if (error) fail(error);
  return data;
}

export async function updateLead(db: Db, id: string, input: LeadInput) {
  const { error } = await db.from("leads").update(input).eq("id", id);
  if (error) fail(error);
  return { id };
}

export async function deleteLead(db: Db, id: string) {
  const { error } = await db.from("leads").delete().eq("id", id);
  if (error) fail(error);
  return { id };
}

export async function addFollowUp(db: Db, input: FollowUpInput, userId: string) {
  const { error } = await db.from("follow_ups").insert({ ...input, created_by: userId });
  if (error) fail(error);
  return { ok: true };
}

export async function deleteFollowUp(db: Db, id: string) {
  const { error } = await db.from("follow_ups").delete().eq("id", id);
  if (error) fail(error);
  return { id };
}

export async function getDashboardStats(db: Db) {
  const { data, error } = await db.from("leads").select("status, estimated_value, created_at");
  if (error) fail(error);
  const rows = data ?? [];

  const byStatus: Record<string, number> = {};
  let potentialValue = 0;
  let wonValue = 0;
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    const value = Number(row.estimated_value ?? 0);
    if (row.status === "Won") wonValue += value;
    if (row.status !== "Won" && row.status !== "Lost") potentialValue += value;
  }

  return {
    total: rows.length,
    new: byStatus["New"] ?? 0,
    contacted: byStatus["Contacted"] ?? 0,
    proposalSent: byStatus["Proposal Sent"] ?? 0,
    negotiation: byStatus["Negotiation"] ?? 0,
    won: byStatus["Won"] ?? 0,
    lost: byStatus["Lost"] ?? 0,
    potentialValue,
    wonValue,
    byStatus,
  };
}
