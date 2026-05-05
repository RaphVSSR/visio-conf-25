import type { Permission, PermissionPayload } from "types/Permission";

type ApiError = {
  message?: string;
};

const backendUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220";
const apiPrefix = process.env.REACT_APP_BACKEND_API_PREFIX || "/api";

function buildUrl(path: string) {
  const normalizedBase = backendUrl.replace(/\/+$/g, "");
  const normalizedPrefix =
    apiPrefix === "/"
      ? ""
      : (apiPrefix.startsWith("/") ? apiPrefix : `/${apiPrefix}`).replace(/\/+$/g, "");

  return `${normalizedBase}${normalizedPrefix}${path}`;
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as ApiError).message === "string"
        ? (data as ApiError).message
        : "Request failed.";

    throw new Error(message);
  }

  return data as T;
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  return parseResponse<T>(response);
}

export const PermissionApi = {
  list() {
    return request<Permission[]>("/permissions");
  },

  create(payload: PermissionPayload) {
    return request<Permission>("/permissions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: PermissionPayload) {
    return request<Permission>(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id: string) {
    return request<void>(`/permissions/${id}`, {
      method: "DELETE",
    });
  },
};
