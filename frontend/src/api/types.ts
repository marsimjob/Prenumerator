export type BillingCycle = "Monthly" | "Yearly";
export type WatchMode = "Exclusive" | "Shared";

export interface SubscriptionMemberDto {
  memberId: string;
  displayName: string;
  avatarColor: string;
}

export interface SubscriptionDto {
  id: string;
  groupId: string;
  name: string;
  color: string;
  watchMode: WatchMode;
  price: number;
  billingCycle: BillingCycle;
  ownerId: string;
  ownerDisplayName: string;
  ownerAvatarColor: string;
  members: SubscriptionMemberDto[];
  activeMemberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  name: string;
  color: string;
  watchMode: WatchMode;
  price: number;
  billingCycle: BillingCycle;
  ownerId: string;
}

export interface UpdateSubscriptionRequest {
  name: string;
  color: string;
  watchMode: WatchMode;
  price: number;
  billingCycle: BillingCycle;
  ownerId: string;
}

export interface SetActiveUserRequest {
  memberId: string;
}

export interface CredentialDto {
  subscriptionId: string;
  username: string;
  password: string;
}

export interface UpsertCredentialRequest {
  username: string;
  password: string;
}

export interface GroupMemberDto {
  id: string;
  displayName: string;
  avatarColor: string;
}

export interface GroupDto {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMemberDto[];
}

export interface CreateGroupRequest {
  name: string;
  userId: string;
  displayName: string;
  avatarColor?: string;
}

export interface CreateGroupResponse {
  groupId: string;
  memberId: string;
  inviteCode: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
  userId: string;
  displayName: string;
  avatarColor?: string;
}

export interface JoinGroupResponse {
  groupId: string;
  memberId: string;
}

export interface ApiError {
  message: string;
  status: number;
}
