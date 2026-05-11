import { api } from "./client";

export interface AuthResult {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
}

export const authApi = {
  register: (body: {
    username: string;
    password: string;
    displayName: string;
    avatarColor: string;
  }) => api.post<AuthResult>("/api/auth/register", body),

  login: (body: { username: string; password: string }) =>
    api.post<AuthResult>("/api/auth/login", body),
};
