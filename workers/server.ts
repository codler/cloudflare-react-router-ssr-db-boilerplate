import { Hono, type ExecutionContext } from "hono";
import { createRequestHandler } from "react-router";
import { Resend } from "resend";
import { supabaseServer } from "./utils/supabase.server";
import type { EmailOtpType, User } from "@supabase/supabase-js";

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
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

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

app.get("/auth/confirm", async function (c) {
  const token_hash = c.req.query("token_hash");
  const type = c.req.query("type") as EmailOtpType | null;
  const next = c.req.query("next") ?? "/";

  if (token_hash && type) {
    const supabase = supabaseServer(c, c.env);

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      c.redirect(`/${next.slice(1)}`, 303);
    }
  }

  // return the user to an error page with some instructions
  c.redirect("/auth/auth-code-error", 303);
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
