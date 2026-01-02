import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import {
  dehydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Original default https://github.com/remix-run/react-router/blob/dev/packages/react-router-dev/config/defaults/entry.server.node.tsx

export const streamTimeout = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const controller = new AbortController();
  // Abort the rendering stream after the `streamTimeout` so it has time to
  // flush down the rejected boundaries
  let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
    () => controller.abort(),
    streamTimeout + 1000
  );
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });

  const body = await renderToReadableStream(
    <QueryClientProvider client={queryClient}>
      <ServerRouter context={routerContext} url={request.url} />
    </QueryClientProvider>,
    {
      signal: controller.signal,
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
  }
  await body.allReady;

  // Clear the timeout to prevent retaining the closure and memory leak
  clearTimeout(timeoutId);
  timeoutId = undefined;

  const dehydratedState = dehydrate(queryClient);
  const stateScript = `<script>window.__REACT_QUERY_STATE__ = ${JSON.stringify(
    dehydratedState
  ).replace(/</g, "\\u003c")}</script>`;

  const stream = new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // decode chunk and append to buffer
        buffer += decoder.decode(value, { stream: true });

        // check if placeholder exists
        const index = buffer.indexOf("<!-- REACT_QUERY_STATE -->");
        if (index !== -1) {
          // push content before placeholder
          controller.enqueue(encoder.encode(buffer.slice(0, index)));
          // push state script
          controller.enqueue(encoder.encode(stateScript));
          // keep rest of buffer
          buffer = buffer.slice(index + "<!-- REACT_QUERY_STATE -->".length);
        }
      }

      // push any remaining content
      if (buffer.length > 0) controller.enqueue(encoder.encode(buffer));

      controller.close();
    },
  });

  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
