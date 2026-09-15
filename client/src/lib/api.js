// Single place that knows where the API lives and how to talk to it.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getToken = () => localStorage.getItem('token');

export const setToken = (token) => {
  if (token) localStorage.setItem('token', token);
};

export const clearToken = () => localStorage.removeItem('token');

// Thin fetch wrapper: adds the base URL, JSON headers and the auth token,
// and turns a non-2xx response into a thrown Error with the server's message.
export const apiFetch = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.errors?.[0]?.msg || 'Request failed');
  }

  return data;
};
