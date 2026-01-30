import { Hono, type ExecutionContext } from "hono";
import { createRequestHandler } from "react-router";
import { Resend } from "resend";
import type { User } from "@supabase/supabase-js";
import { trimTrailingSlash } from "hono/trailing-slash";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import auth from "./routes/auth/auth";
import { authMiddleware } from "./middlewares/auth.middleware";
import { protectedRoutes } from "./constants";

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

app.use(secureHeaders());
app.use(trimTrailingSlash());
app.use(prettyJSON());

function requireAuth(routes: string[]) {
  routes.forEach((route) => {
    app.use(`${route}.data`, authMiddleware);
    app.use(`${route}/*`, authMiddleware);
    app.use(route, authMiddleware);
  });
}

requireAuth(protectedRoutes);

app.route("/auth", auth);

// example public route
app.get("/public", (c) => {
  return c.json({ message: "This is a public api endpoint" });
});

// Experimental: send email via Resend
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
