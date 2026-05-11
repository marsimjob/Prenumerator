import { api } from "./client";
import type {
  CreateGroupRequest,
  CreateGroupResponse,
  GroupDto,
  JoinGroupRequest,
  JoinGroupResponse,
} from "./types";

export const groupsApi = {
  create: (body: CreateGroupRequest) =>
    api.post<CreateGroupResponse>("/api/groups", body),

  join: (body: JoinGroupRequest) =>
    api.post<JoinGroupResponse>("/api/groups/join", body),

  get: (groupId: string) =>
    api.get<GroupDto>(`/api/groups/${groupId}`),
};
