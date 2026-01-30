import { createMiddleware } from "hono/factory";
import { supabaseServer } from "workers/utils/supabase.server";

export const authMiddleware = createMiddleware(async (c, next) => {
  const supabase = supabaseServer(c, c.env);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return c.redirect("/login");

  c.set("user", user);
  await next();
});
