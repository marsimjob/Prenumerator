import { api } from "./client";
import type { CredentialDto, UpsertCredentialRequest } from "./types";

export const credentialsApi = {
  get: (subscriptionId: string) =>
    api.get<CredentialDto>(`/api/subscriptions/${subscriptionId}/credential`),

  upsert: (subscriptionId: string, body: UpsertCredentialRequest) =>
    api.put<void>(`/api/subscriptions/${subscriptionId}/credential`, body),
};
