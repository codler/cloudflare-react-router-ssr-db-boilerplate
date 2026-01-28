import { Hono, type ExecutionContext } from "hono";
import { createRequestHandler } from "react-router";
import { Resend } from "resend";
import { supabaseServer } from "./utils/supabase.server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { trimTrailingSlash } from "hono/trailing-slash";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

type Variables = { user: User };
const app = new Hono<{ Bindings: Env; Variables: Variables }>({
  strict: false,
});

app.use(secureHeaders());
app.use(trimTrailingSlash());
app.use(prettyJSON());

// Middleware: protect dashboard routes
app.use("/dashboard/*", async (c, next) => {
  const supabase = supabaseServer(c, c.env);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return c.redirect("/login");

  c.set("user", user);
  await next();
});
app.use("/protected/*", async (c, next) => {
  const supabase = supabaseServer(c, c.env);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return c.redirect("/login");

  c.set("user", user);
  await next();
});

app.get("/auth/confirm", async function (c) {
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
      return c.redirect(`/auth/error?error=${error?.message}`, 303);
    }
  }

  // return the user to an error page with some instructions
  return c.redirect("/auth/auth-code-error", 303);
});

app.post("/auth/forgot-password", async (c) => {
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

app.post("/auth/login", async (c) => {
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

app.post("/auth/logout", async (c) => {
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

app.post("/auth/signup", async (c) => {
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

app.post("/auth/update-password", async (c) => {
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

app.get("/email", async (c) => {
  const resend = new Resend(c.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: c.env.RESEND_FROM,
    to: c.env.RESEND_TO,
    subject: "Hello World",
    html: "<p>Hello from Workers</p>",
  });
  console.log("🚀 ~ error:", error);
  console.log("🚀 ~ data:", data);

  return new Response("Email sent!");
});

// All routes: SSR + SPA fallback
app.all("*", async (c) => {
  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
    user: c.get("user") ?? c.req.query("user"),
  });
});

export default app;
