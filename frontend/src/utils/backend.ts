import { QueryClient } from "@tanstack/react-query";
import { auth } from "@utils/auth";

export const queryClient = new QueryClient();

export type Paginated<T> = {
  items: T[];
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type TodoPriority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  description: string;
  image: ImageUpload | null;
  priority: TodoPriority;
  tags: Tag[];
  attachments: FileUpload[];
  createdAt: Date;
  recommendation: AIRecommendation;
};

export type AIRecommendation = {
  title: string;
  description: string;
  priority: TodoPriority;
  tags: string[];
};

export type ImageUpload = {
  id: string;
  thumbnail: string;
  medium: string;
  original: string;
  createdAt: Date;
};

export type FileUpload = {
  id: string;
  originalName: string;
  url: string;
  createdAt: Date;
};

export type Tag = {
  id: string;
  title: string;
  createdAt: Date;
};

const BASE_URL =
  import.meta.env.VITE_ENV === "development"
    ? "http://localhost:5000"
    : "http://playable.canpacis.net:5000";

export const endpoints = {
  listTodos: "/todos",
  createTodo: "/todos",
  deleteTodo: (id: string) => `/todos/${id}`,
  updateTodo: (id: string) => `/todos/${id}`,
  uploadFile: "/upload/file",
  uploadImage: "/upload/image",
  listTags: "/tags",
  createTag: "/tags",
  search: "/todos/search",
  filter: "/todos/filter",
  recommend: "/recommend",
} as const;

export type Endpoint = string;

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

export const method = {
  Post: "POST",
  Patch: "PATCH",
  Delete: "DELETE",
} as const;

export type MutateMethod = (typeof method)[keyof typeof method];

export async function mutate<T>(
  endpoint: Endpoint,
  method: MutateMethod,
  params: Record<string, unknown> = {}
): Promise<T> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("failed to query without a logged in user");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  const token = await user.getIdToken();

  const resp = await fetch(url, {
    method: method,
    body: JSON.stringify(params),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return await resp.json();
}

export async function upload<T>(endpoint: Endpoint, file: File): Promise<T> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("failed to query without a logged in user");
  }

  const data = new FormData();
  data.set("file", file);

  const url = new URL(`${BASE_URL}${endpoint}`);
  const token = await user.getIdToken();

  const resp = await fetch(url, {
    method: "POST",
    body: data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await resp.json();
}
