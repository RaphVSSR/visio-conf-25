const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220";
const API_PREFIX = process.env.REACT_APP_BACKEND_API_PREFIX || "/api";

function buildUrl(path: string) {
	const normalizedBase = BACKEND_URL.replace(/\/+$/g, "");
	const normalizedPrefix =
		API_PREFIX === "/"
			? ""
			: (API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`).replace(/\/+$/g, "");

	return `${normalizedBase}${normalizedPrefix}${path}`;
}

export const httpClient = {
	fetch(path: string, init?: RequestInit) {
		return fetch(buildUrl(path), {
			credentials: "include",
			...init,
			headers: {
				"Content-Type": "application/json",
				...init?.headers,
			},
		});
	},
};
