import { api } from "./client";

export interface AuthResult {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  phoneNumber: string | null;
  groups: { groupId: string; memberId: string; groupName: string; isCreator: boolean }[];
}

export const authApi = {
  register: (body: {
    username: string;
    password: string;
    displayName: string;
    avatarColor: string;
    phoneNumber?: string;
  }) => api.post<AuthResult>("/api/auth/register", body),

  login: (body: { username: string; password: string }) =>
    api.post<AuthResult>("/api/auth/login", body),

  updatePhone: (userId: string, phoneNumber: string | null) =>
    api.put<void>(`/api/auth/${userId}/phone`, { phoneNumber }),
};
