import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", newRefresh);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  business_name: string;
  gstin?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: { access_token: string; refresh_token: string; token_type: string };
}

export interface UserProfile {
  id: string;
  email: string;
  business_name: string;
  gstin?: string;
  created_at: string;
  is_active: boolean;
}

export const authAPI = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/api/auth/register", data),
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/api/auth/login", data),
  getMe: () => api.get<UserProfile>("/api/auth/me"),
  updateMe: (data: { business_name?: string; gstin?: string }) =>
    api.put<UserProfile>("/api/auth/me", data),
  logout: (refresh_token: string) =>
    api.post("/api/auth/logout", { refresh_token }),
};

// ─── Invoices ────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  user_id: string;
  file_path?: string;
  original_filename?: string;
  gstin_supplier?: string;
  gstin_recipient?: string;
  invoice_number?: string;
  invoice_date?: string;
  vendor_name?: string;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  total_amount: number;
  validation_status: string;
  validation_errors: string[];
  validation_warnings: string[];
  reconciliation_status: string;
  created_at?: string;
  updated_at?: string;
  confidence_scores?: Record<string, number>;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OCRResult {
  invoice: Invoice;
  raw_text: string;
  confidence: number;
  message: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
  vendor?: string;
  status?: string;
}

export const invoiceAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<OCRResult>("/api/invoices/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: (filters: InvoiceFilters = {}) =>
    api.get<InvoiceListResponse>("/api/invoices", { params: filters }),
  get: (id: string) => api.get<Invoice>(`/api/invoices/${id}`),
  update: (id: string, data: Partial<Invoice>) =>
    api.put<Invoice>(`/api/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/api/invoices/${id}`),
  exportCSV: () =>
    api.get("/api/invoices/export/csv", { responseType: "blob" }),
};

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  status: string;
  errors: { field: string; rule: string; message: string }[];
  warnings: { field: string; rule: string; message: string }[];
}

export const validateAPI = {
  validateOne: (invoiceId: string) =>
    api.post<ValidationResult>(`/api/validate/${invoiceId}`),
  validateBulk: () => api.post("/api/validate/bulk"),
};

// ─── Reconciliation ──────────────────────────────────────────────────────────

export interface ReconciliationRun {
  _id?: string;
  id?: string;
  user_id: string;
  run_id: string;
  run_date: string;
  total_invoices: number;
  matched_count: number;
  mismatch_count: number;
  missing_count: number;
  extra_in_gst_count: number;
  total_itc_claimable: number;
  total_itc_at_risk: number;
}

export interface ReconciliationResult {
  id: string;
  user_id: string;
  run_id: string;
  invoice_id?: string;
  invoice_number?: string;
  gstin?: string;
  match_status: string;
  itc_claimable: number;
  confidence_score: number;
  discrepancy_details?: {
    field: string;
    invoice_value: number;
    gst_record_value: number;
    difference: number;
  };
  vendor_name?: string;
  invoice_gst?: number;
  gst_record_gst?: number;
}

export const reconcileAPI = {
  run: () => api.post("/api/reconcile/run"),
  getResults: () => api.get("/api/reconcile/results"),
  getRunDetail: (runId: string) =>
    api.get(`/api/reconcile/results/${runId}`),
  getHistory: () => api.get("/api/reconcile/history"),
  exportCSV: () =>
    api.post("/api/reconcile/export", {}, { responseType: "blob" }),
};

// ─── ITC ─────────────────────────────────────────────────────────────────────

export interface ITCSummary {
  total_itc_claimable: number;
  total_itc_at_risk: number;
  total_possible_itc: number;
  itc_efficiency_rate: number;
  matched_itc: number;
  mismatch_itc: number;
  missing_itc: number;
}

export const itcAPI = {
  getSummary: () => api.get<ITCSummary>("/api/itc/summary"),
  getVendors: () => api.get("/api/itc/vendors"),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_invoices: number;
  total_gst_paid: number;
  total_taxable: number;
  total_amount: number;
  itc_claimable: number;
  itc_at_risk: number;
  matched_count: number;
  mismatch_count: number;
  missing_count: number;
  pending_count: number;
}

export const analyticsAPI = {
  getSummary: () => api.get<AnalyticsSummary>("/api/analytics/summary"),
  getMonthly: () => api.get("/api/analytics/monthly"),
  getVendors: () => api.get("/api/analytics/vendors"),
  getITCTrend: () => api.get("/api/analytics/itc-trend"),
  getStatusDist: () => api.get("/api/analytics/status-dist"),
};

// ─── AI Assistant ────────────────────────────────────────────────────────────

export const assistantAPI = {
  getPrompts: () => api.get<{ prompts: string[] }>("/api/assistant/prompts"),
  getHistory: () => api.get("/api/assistant/history"),
  queryStream: async function* (question: string) {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_URL}/api/assistant/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Assistant query failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) yield parsed.text;
          } catch {
            // skip malformed data
          }
        }
      }
    }
  },
};

// ─── Seed ────────────────────────────────────────────────────────────────────

export const seedAPI = {
  seedDemo: () => api.post("/api/seed/demo"),
  getStatus: () => api.get("/api/seed/status"),
  resetDashboard: () => api.post("/api/seed/reset"),
};

export default api;
