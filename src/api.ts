import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

export const API_URL = getBaseUrl();

export async function apiPost<T>(path: string, body: Record<string, string>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data as T;
}

export interface AuthResponse {
  token: string;
  user: { id: number; firstName: string; lastName: string; email: string };
}
