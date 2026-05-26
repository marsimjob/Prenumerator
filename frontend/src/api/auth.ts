import { api } from "./client";

export interface AuthResult {
  userId: string;
  email: string;
  displayName: string;
  avatarColor: string;
  phoneNumber: string | null;
  groups: { groupId: string; memberId: string; groupName: string; isCreator: boolean }[];
}

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    displayName: string;
    avatarColor: string;
    phoneNumber?: string;
  }) => api.post<{ message: string }>("/api/auth/register", body),

  verifyEmail: (body: { email: string; code: string }) =>
    api.post<AuthResult>("/api/auth/verify-email", body),

  login: (body: { email: string; password: string }) =>
    api.post<AuthResult>("/api/auth/login", body),

  forgotPassword: (body: { email: string }) =>
    api.post<{ message: string }>("/api/auth/forgot-password", body),

  updatePhone: (userId: string, phoneNumber: string | null) =>
    api.put<void>(`/api/auth/${userId}/phone`, { phoneNumber }),
};
