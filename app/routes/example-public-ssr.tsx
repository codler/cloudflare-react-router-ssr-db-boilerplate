import { useLoaderData } from "react-router";
import type { Route } from "./+types/protected";
import { useSuspenseQuery } from "@tanstack/react-query";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return { origin: new URL(request.url).origin };
};

export default function PublicPage() {
  let data = useLoaderData<typeof loader>();

  const { data: dummy } = useSuspenseQuery<{ message: string }>({
    queryKey: ["example-public-ssr-dummy"],
    queryFn: () => {
      return fetch(data.origin + "/public").then((response) => response.json());
    },
  });

  return <div>{JSON.stringify(dummy)}</div>;
}
