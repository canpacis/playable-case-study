import { auth } from "@utils/auth";

export type Paginated<T> = {
  items: T[];
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

const BASE_URL = "http://localhost:5000";

export const endpoints = {
  listTodos: "/todos",
  createTodo: "/todos",
  deleteTodo: "/todos",
  updateTodo: "/todos",
} as const;

export type Endpoint = (typeof endpoints)[keyof typeof endpoints];

export async function query<T>(
  endpoint: Endpoint,
  params: Record<string, unknown> = {}
): Promise<T> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("failed to query without a logged in user");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const param = params[key];
      url.searchParams.set(key, String(param));
    }
  }

  const token = await user.getIdToken();

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await resp.json();
}
