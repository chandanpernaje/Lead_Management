import { createServerFn } from "@tanstack/react-start";
import { ensureAdminAccount } from "./admin-user.server";

export const apiEnsureAdmin = createServerFn({ method: "POST" }).handler(async () =>
  ensureAdminAccount(),
);
