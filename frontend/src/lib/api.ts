import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// Profile API
export const profileApi = {
  update: (data: any) => api.put('/profile', data),
  getApiToken: (regenerate?: boolean) =>
    api.get('/profile/api-token', { params: { regenerate } }),
};

// Resume API
export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: () => api.get('/resume'),
  download: () => api.get('/resume/download', { responseType: 'blob' }),
};

// Email template API
export const emailTemplateApi = {
  get: () => api.get('/email-template'),
  update: (data: any) => api.put('/email-template', data),
  preview: (data: any) => api.post('/email-template/preview', data),
};

// Applications API
export const applicationsApi = {
  list: (params?: any) => api.get('/applications', { params }),
  get: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: any) => api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  sync: (data: any) => api.post('/applications/sync', data),
};

// Email API
export const emailApi = {
  send: (data: any) => api.post('/emails/send', data),
  sendSingle: (applicationId: string) =>
    api.post(`/emails/send/${applicationId}`),
  logs: (params?: any) => api.get('/emails/logs', { params }),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

// Dashboard API
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  syncHistory: (params?: any) => api.get('/dashboard/sync-history', { params }),
};
