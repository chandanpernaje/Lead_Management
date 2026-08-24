export const ADMIN_EMAIL = "admin@leadms.app";
const ADMIN_PASSWORD = "Admin@123";

/**
 * Makes sure the single demo admin account exists and has the documented
 * password. Runs with the service role, never exposed to the browser.
 */
export async function ensureAdminAccount() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error("[auth] listUsers failed", error);
    return { ok: false };
  }

  const existing = data.users.find((u) => u.email === ADMIN_EMAIL);
  if (existing) {
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    return { ok: true };
  }

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: "admin", full_name: "Administrator" },
  });
  if (createError) {
    console.error("[auth] createUser failed", createError);
    return { ok: false };
  }
  return { ok: true };
}
