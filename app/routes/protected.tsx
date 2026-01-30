import { useLoaderData } from "react-router";
import type { Route } from "./+types/protected";
import { useQuery } from "@tanstack/react-query";

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  return { origin: new URL(request.url).origin, user: context.user };
};

export default function ProtectedPage() {
  let data = useLoaderData<typeof loader>();

  const { data: dummy } = useQuery<{ id: number }>({
    queryKey: ["protected-dummy"],
    queryFn: () => {
      return fetch(data.origin + "/protected/x").then((response) =>
        response.json()
      );
    },
  });

  return (
    <div>
      {JSON.stringify(data.user)} User: {JSON.stringify(dummy)}
    </div>
  );
}
