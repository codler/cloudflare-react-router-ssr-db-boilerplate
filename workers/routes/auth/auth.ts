import type { EmailOtpType, User } from "@supabase/supabase-js";
import { Hono } from "hono";
import { supabaseServer } from "workers/utils/supabase.server";

type Variables = { user: User };
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get("/confirm", async function (c) {
  const token_hash = c.req.query("token_hash");
  const type = c.req.query("type") as EmailOtpType | null;
  const _next = c.req.query("next");
  const origin = new URL(c.req.url).origin;
  const next = _next?.startsWith(`${origin}/`)
    ? _next.slice(origin.length)
    : "/";

  if (token_hash && type) {
    const supabase = supabaseServer(c, c.env);

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return c.redirect(`/${next.slice(1)}`, 303);
    } else {
      return c.redirect(`/error?error=${error?.message}`, 303);
    }
  }

  // return the user to an error page with some instructions
  return c.redirect("/auth-code-error", 303);
});

app.post("/forgot-password", async (c) => {
  const { email } = await c.req.json();
  const supabase = supabaseServer(c, c.env);
  const origin = new URL(c.req.url).origin;

  // Send the actual reset password email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  });

  if (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "An error occurred",
      },
      400
    );
  }

  return c.json({ success: true });
});

app.post("/login", async (c) => {
  const supabase = supabaseServer(c, c.env);
  const { email, password } = await c.req.json();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      400
    );
  }

  return c.json({ success: true });
});

app.post("/logout", async (c) => {
  const supabase = supabaseServer(c, c.env);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      400
    );
  }

  return c.json({ success: true });
});

app.post("/signup", async (c) => {
  const supabase = supabaseServer(c, c.env);
  const { email, password } = await c.req.json();
  const origin = new URL(c.req.url).origin;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/protected`,
    },
  });

  if (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      400
    );
  }

  return c.json({ success: true });
});

app.post("/update-password", async (c) => {
  const supabase = supabaseServer(c, c.env);
  const { password } = await c.req.json();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      400
    );
  }

  return c.json({ success: true });
});

export default app;
