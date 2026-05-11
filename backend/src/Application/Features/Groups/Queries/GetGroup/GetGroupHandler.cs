using Application.Features.Groups.Dtos;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Groups.Queries.GetGroup;

public class GetGroupHandler(IGroupRepository repo)
    : IRequestHandler<GetGroupQuery, OperationResult<GroupDto>>
{
    public async Task<OperationResult<GroupDto>> Handle(GetGroupQuery request, CancellationToken ct)
    {
        var group = await repo.GetWithMembersAsync(request.GroupId, ct);

        if (group is null)
            return OperationResult<GroupDto>.NotFound("Grupp hittades inte.");

        var dto = new GroupDto(
            group.Id,
            group.Name,
            group.InviteCode,
            group.Members
                .Select(m => new GroupMemberDto(m.Id, m.DisplayName, m.AvatarColor))
                .ToList());

        return dto;
    }
}
