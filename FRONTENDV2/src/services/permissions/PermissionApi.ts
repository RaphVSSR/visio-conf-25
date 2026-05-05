import type { Permission, PermissionPayload } from "types/Permission";
import { httpClient } from "services/http/httpClient";

type ApiError = {
  message?: string;
};

type CsrfTokenResponse = {
  csrfToken: string;
};

let csrfTokenPromise: Promise<string> | null = null;

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

async function getCsrfToken() {
  csrfTokenPromise ??= httpClient
    .fetch("/permissions/csrf-token")
    .then(response => parseResponse<CsrfTokenResponse>(response))
    .then(data => data.csrfToken);

  return csrfTokenPromise;
}

function resetCsrfToken() {
  csrfTokenPromise = null;
}

async function request<T>(path: string, init?: RequestInit) {
  const method = init?.method?.toUpperCase() ?? "GET";
  const requiresCsrfToken = method !== "GET" && method !== "HEAD";

  async function sendRequest() {
    const headers: Record<string, string> = {};

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers[key] = value;
      });
    }

    if (requiresCsrfToken) {
      headers["X-CSRF-Token"] = await getCsrfToken();
    }

    return httpClient.fetch(path, {
      ...init,
      headers: {
        ...headers,
      },
    });
  }

  let response = await sendRequest();

  if (requiresCsrfToken && response.status === 403) {
    resetCsrfToken();
    response = await sendRequest();
  }

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
