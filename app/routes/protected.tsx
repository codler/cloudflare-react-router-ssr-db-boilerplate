import { Button } from "@/components/ui/shadcn/button";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/protected";

export const loader = async ({ context }: Route.LoaderArgs) => {
  if (!context.user) {
    throw new Error("Missing user");
  }

  return { user: context.user };
};

export default function ProtectedPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <div className="flex items-center justify-center h-screen gap-2">
      <p>
        Hello{" "}
        <span className="text-primary font-semibold">{String(data.user)}</span>
      </p>
      <a href="/logout">
        <Button>Logout</Button>
      </a>
    </div>
  );
}
