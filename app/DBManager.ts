export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

/**
 * TodoManager handles all interactions with the Todos KV store.
 * This class provides CRUD operations for managing todo items in Cloudflare KV storage.
 *
 * By separating all of the logic for interacting with the KV store from the
 * rest of the Remix application, we can easily test the logic in isolation
 * using [Cloudflare's vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
 */
export class DBManager {
  /**
   * Creates a new TodoManager instance
   * @param db - The Cloudflare KV namespace instance to use for storage
   * @param tableKey - The key under which todos will be stored in KV (defaults to "todos")
   */
  constructor(
    private db: D1Database,
    private tableKey: string = "todos"
  ) {}

  /**
   * Retrieves all todos from storage
   * @returns Promise containing an array of Todo items, sorted by creation date (newest first)
   */
  async list(): Promise<Todo[]> {
    const todos = await this.db.prepare(`SELECT * FROM ${this.tableKey}`);

    const { results } = await todos.run<Todo>();

    if (Array.isArray(results)) {
      results.sort((a: Todo, b: Todo) => b.createdAt - a.createdAt);
      results.forEach((todo) => {
        todo.id = todo.id.toString();
      });
    }
    return (results || []) as Todo[];
  }

  async get(id: string): Promise<Todo> {
    const todoStmt = await this.db
      .prepare(`SELECT * FROM ${this.tableKey} WHERE id = ? LIMIT 1`)
      .bind(id);
    const todo = await todoStmt.first<Todo>();

    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }

    todo.id = todo.id.toString();
    return todo;
  }

  /**
   * Creates a new todo item
   * @param text - The text content of the todo item
   * @returns Promise containing the newly created Todo item
   */
  async create(text: string): Promise<Todo> {
    const newTodo: Omit<Todo, "id" | "createdAt"> = {
      text,
      completed: false,
    };
    const { meta } = await this.db
      .prepare(`INSERT INTO ${this.tableKey} (text, completed) VALUES (?, ?)`)
      .bind(newTodo.text, newTodo.completed ? 1 : 0)
      .run();

    const todo = await this.get(meta.last_row_id.toString());

    return todo;
  }

  /**
   * Toggles the completed status of a todo item
   * @param id - The unique identifier of the todo item to toggle
   * @returns Promise containing the updated Todo item
   * @throws Error if the todo item with the specified ID is not found
   */
  async toggle(id: string): Promise<Todo> {
    const todo = await this.get(id);

    todo.completed = !todo.completed;

    const { success } = await this.db
      .prepare(`UPDATE ${this.tableKey} SET completed = ? WHERE id = ? LIMIT 1`)
      .bind(todo.completed ? 1 : 0, id)
      .run();

    if (!success) {
      throw new Error(`Failed to update todo with id ${id}`);
    }

    return todo;
  }

  /**
   * Deletes a todo item
   * @param id - The unique identifier of the todo item to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async delete(id: string): Promise<void> {
    const { success } = await this.db
      .prepare(`DELETE FROM ${this.tableKey} WHERE id = ? LIMIT 1`)
      .bind(id)
      .run();

    if (!success) {
      throw new Error(`Failed to delete todo with id ${id}`);
    }
  }
}
