import { api } from "./client";
import type {
  CreateSubscriptionRequest,
  SetActiveUserRequest,
  SubscriptionDto,
  UpdateSubscriptionRequest,
} from "./types";

export const subscriptionsApi = {
  listByGroup: (groupId: string) =>
    api.get<SubscriptionDto[]>(`/api/groups/${groupId}/subscriptions`),

  getById: (id: string) =>
    api.get<SubscriptionDto>(`/api/subscriptions/${id}`),

  create: (groupId: string, body: CreateSubscriptionRequest) =>
    api.post<{ id: string }>(`/api/groups/${groupId}/subscriptions`, body),

  update: (id: string, body: UpdateSubscriptionRequest) =>
    api.put<void>(`/api/subscriptions/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/subscriptions/${id}`),

  setActiveUser: (id: string, body: SetActiveUserRequest) =>
    api.put<void>(`/api/subscriptions/${id}/active-user`, body),

  addMember: (id: string, memberId: string) =>
    api.post<void>(`/api/subscriptions/${id}/members`, { memberId }),

  removeMember: (id: string, memberId: string) =>
    api.delete<void>(`/api/subscriptions/${id}/members/${memberId}`),

  requestWatch: (id: string, requestorMemberId: string) =>
    api.post<void>(`/api/subscriptions/${id}/request-watch`, { requestorMemberId }),

  resolveWatch: (id: string, requestorMemberId: string, accepted: boolean) =>
    api.post<void>(`/api/subscriptions/${id}/resolve-watch`, { requestorMemberId, accepted }),

  stopWatching: (id: string, memberId: string) =>
    api.delete<void>(`/api/subscriptions/${id}/active-user?memberId=${memberId}`),

  toggleSharedWatcher: (id: string, memberId: string) =>
    api.post<void>(`/api/subscriptions/${id}/shared-watcher`, { memberId }),
};
