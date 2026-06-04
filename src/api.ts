import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

export const API_URL = getBaseUrl();

let authToken: string | null = null;

function loadToken(): string | null {
  const stored = (globalThis as any).localStorage?.getItem?.('authToken');
  return stored || null;
}

function saveToken(token: string | null) {
  try {
    if (token) {
      (globalThis as any).localStorage?.setItem?.('authToken', token);
    } else {
      (globalThis as any).localStorage?.removeItem?.('authToken');
    }
  } catch {}
}

authToken = loadToken();

export function setToken(token: string | null) {
  authToken = token;
  saveToken(token);
}

export function getToken() {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data as T;
}

export async function apiPost<T>(path: string, body: Record<string, string>) {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiGet<T>(path: string) {
  return request<T>(path, { method: 'GET' });
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: { id: number; firstName: string; lastName: string; email: string; role?: string };
}

export interface DashboardStats {
  totalDocuments: number;
  totalUsers: number;
  totalCategories: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentDocuments: Array<{
    documentId: string;
    title: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  categoryStats: Array<{
    id: number;
    name: string;
    documentCount: number;
  }>;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
}

export interface CategoriesResponse {
  total: number;
  categories: Category[];
}

export interface Document {
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  categoryId: number | null;
  fileName: string;
  fileSize: number;
  uploadedBy: number;
  uploadedAt: string;
}

export interface DocumentsResponse {
  total: number;
  documents: Document[];
}

export interface UploadResponse {
  message: string;
  document: Document;
}

export async function apiUpload<T>(path: string, formData: FormData) {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data as T;
}
