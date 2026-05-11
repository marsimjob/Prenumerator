using Application.Features.Groups.Dtos;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Groups.Commands.JoinGroup;

public class JoinGroupHandler(IGroupRepository repo, IUnitOfWork uow)
    : IRequestHandler<JoinGroupCommand, OperationResult<JoinGroupResult>>
{
    private static readonly string[] AvatarColors =
        ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

    public async Task<OperationResult<JoinGroupResult>> Handle(JoinGroupCommand request, CancellationToken ct)
    {
        var group = await repo.GetByInviteCodeAsync(request.InviteCode.Trim().ToUpperInvariant(), ct);

        if (group is null)
            return OperationResult<JoinGroupResult>.NotFound("Ogiltig inbjudningskod.");

        // Return existing membership if this userId already joined.
        var existing = group.Members.FirstOrDefault(m => m.UserId == request.UserId);
        if (existing is not null)
            return new JoinGroupResult(group.Id, existing.Id, group.Name);

        var member = new GroupMember
        {
            Id          = Guid.NewGuid(),
            GroupId     = group.Id,
            UserId      = request.UserId,
            DisplayName = request.DisplayName.Trim(),
            AvatarColor = request.AvatarColor ?? AvatarColors[Random.Shared.Next(AvatarColors.Length)],
        };

        await repo.AddMemberAsync(member, ct);
        await uow.SaveChangesAsync(ct);

        return new JoinGroupResult(group.Id, member.Id, group.Name);
    }
}
