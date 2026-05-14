namespace Application.Features.Groups.Dtos;

public record GroupDto(Guid Id, string Name, string InviteCode, List<GroupMemberDto> Members);
public record GroupMemberDto(Guid Id, string DisplayName, string AvatarColor);
public record UserGroupDto(Guid GroupId, Guid MemberId, string GroupName, bool IsCreator);
public record CreateGroupResult(Guid GroupId, Guid MemberId, string InviteCode);
public record JoinGroupResult(Guid GroupId, Guid MemberId, string GroupName);
