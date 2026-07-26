import { API_BASE_URL } from "./config";

async function api(input, options = {}) {
  const token = localStorage.getItem("token");

  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const url = typeof input === "string" && input.startsWith("/")
    ? `${API_BASE_URL}${input}`
    : input;

  const response = await fetch(url, { ...options, headers });

  return response;
}

export { api };
