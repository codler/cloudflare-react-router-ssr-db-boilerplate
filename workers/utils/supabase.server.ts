import { createServerClient } from "@supabase/ssr";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

// https://github.com/honojs/middleware/issues/352#issuecomment-2481325833
export function supabaseServer(c: Context, env: Env) {
  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookie(c)).map(([name, value]) => ({
            name,
            value,
          }));
          // return parseCookieHeader(c.req.raw.headers.get("Cookie") ?? "") as {
          //   name: string;
          //   value: string;
          // }[];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) =>
              setCookie(c, name, value, {
                ...options,
                sameSite:
                  options.sameSite === true
                    ? "strict"
                    : options.sameSite || undefined,
              })
            // headers.append(
            //   "Set-Cookie",
            //   serializeCookieHeader(name, value, options)
            // )
          );
        },
      },
    }
  );

  return supabase;
}
