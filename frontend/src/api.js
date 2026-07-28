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

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
    return response;
  }

  return response;
}

export { api };
