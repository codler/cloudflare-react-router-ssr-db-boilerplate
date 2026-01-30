import { Form, useLoaderData } from "react-router";
import type { Route } from "./+types/_layout.$";
import { KVManager } from "@/KVManager";
import { DBManager } from "@/DBManager";
import { Suspense, type FC } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Box, TypographyH2 } from "@/components/ui";
import type { User } from "@supabase/supabase-js";

const NotFound: FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Box className="max-w-250 mx-auto">
      <TypographyH2>404 Page not found</TypographyH2>

      {children}
    </Box>
  );
};

export const loader = async ({ context }: Route.LoaderArgs) => {
  const todoManager = new DBManager(context.cloudflare.env.DATABASE);
  const todos = await todoManager.list();

  return { todos, user: context.user as User | undefined };
};

export async function action({ request, context, params }: Route.ActionArgs) {
  if (!context.user) {
    throw new Error("Missing user");
  }
  const user = context.user as User;
  const todoManager = new DBManager(context.cloudflare.env.DATABASE);

  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "create": {
      const text = formData.get("text");
      if (typeof text !== "string" || !text)
        return Response.json({ error: "Invalid text" }, { status: 400 });
      await todoManager.create(text, user.id);
      return { success: true };
    }

    case "toggle": {
      const id = formData.get("id") as string;
      await todoManager.toggle(id, user.id);
      return { success: true };
    }

    case "delete": {
      const id = formData.get("id") as string;
      await todoManager.delete(id, user.id);
      return { success: true };
    }

    default:
      return Response.json({ error: "Invalid intent" }, { status: 400 });
  }
}

function User() {
  const { data } = useSuspenseQuery<{ id: number }>({
    queryKey: ["user"],
    queryFn: () =>
      fetch("https://jsonplaceholder.typicode.com/todos/1").then((response) =>
        response.json()
      ),
  });

  return <div>x: {data.id}</div>;
}

export default function () {
  const { todos, user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          Todo List
        </h1>
        <Suspense fallback={<p>Loading…</p>}>
          <User />
        </Suspense>
        <Form method="post" className="mb-8 flex gap-2">
          <input
            type="text"
            name="text"
            className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm px-4 py-2"
            placeholder="Add a new todo..."
          />
          <button
            disabled={!user}
            type="submit"
            name="intent"
            value="create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Add
          </button>
        </Form>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <Form method="post" className="flex-1 flex items-center gap-2">
                <input type="hidden" name="id" value={todo.id} />
                <button
                  disabled={user?.id !== todo.userId}
                  type="submit"
                  name="intent"
                  value="toggle"
                  className="text-gray-500 hover:text-blue-500"
                >
                  <span
                    className={
                      todo.completed ? "line-through text-gray-400" : ""
                    }
                  >
                    {todo.text}
                  </span>
                </button>
              </Form>

              {user?.id === todo.userId && (
                <Form method="post">
                  <input type="hidden" name="id" value={todo.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </Form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
