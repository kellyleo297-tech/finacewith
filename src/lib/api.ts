const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Token management ──────────────────────────────────
let authToken = localStorage.getItem('moneymate_token') || '';

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('moneymate_token', token);
}

export function clearToken() {
  authToken = '';
  localStorage.removeItem('moneymate_token');
}

export function getToken() {
  return authToken;
}

// ── HTTP helpers ──────────────────────────────────────
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    me: () => request<any>('/auth/me', { headers: { Authorization: `Bearer ${authToken}` } }),
  },
  user: {
    profile: () => request<any>('/user/profile'),
    update: (body: any) => request<any>('/user/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  expenses: {
    list: () => request<any[]>('/expenses'),
    create: (body: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(body) }),
    batchCreate: (expenses: any[]) => request<any[]>('/expenses/batch', { method: 'POST', body: JSON.stringify({ expenses }) }),
    delete: (id: string) => request('/expenses/' + id, { method: 'DELETE' }),
  },
  incomes: {
    list: () => request<any[]>('/incomes'),
    create: (body: any) => request<any>('/incomes', { method: 'POST', body: JSON.stringify(body) }),
  },
  budgets: {
    list: () => request<any[]>('/budgets'),
    update: (categoryId: string, body: any) => request(`/budgets/${categoryId}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  ai: {
    chat: (message: string, history?: string) =>
      request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  },
};
