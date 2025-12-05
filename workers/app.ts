import { createRequestHandler } from "react-router";
import { Resend } from "resend";

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

export default {
  async fetch(request, env, ctx) {
    if (request.url.endsWith("/email")) {
      const resend = new Resend(env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: env.RESEND_TO,
        subject: "Hello World",
        html: "<p>Hello from Workers</p>",
      });
      console.log("🚀 ~ error:", error)
      console.log("🚀 ~ data:", data)

      return new Response("Email sent!");
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
