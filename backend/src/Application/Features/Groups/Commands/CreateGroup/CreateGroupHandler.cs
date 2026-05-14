using Application.Features.Groups.Dtos;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Groups.Commands.CreateGroup;

public class CreateGroupHandler(IGroupRepository repo, IUnitOfWork uow)
    : IRequestHandler<CreateGroupCommand, OperationResult<CreateGroupResult>>
{
    private static readonly string[] AvatarColors =
        ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

    public async Task<OperationResult<CreateGroupResult>> Handle(CreateGroupCommand request, CancellationToken ct)
    {
        var group = new Group
        {
            Id             = Guid.NewGuid(),
            Name           = request.Name.Trim(),
            InviteCode     = GenerateInviteCode(),
            CreatorUserId  = request.UserId,
        };

        var member = new GroupMember
        {
            Id          = Guid.NewGuid(),
            GroupId     = group.Id,
            UserId      = request.UserId,
            DisplayName = request.DisplayName.Trim(),
            AvatarColor = request.AvatarColor ?? AvatarColors[Random.Shared.Next(AvatarColors.Length)],
        };

        group.Members.Add(member);
        await repo.AddAsync(group, ct);
        await uow.SaveChangesAsync(ct);

        return new CreateGroupResult(group.Id, member.Id, group.InviteCode);
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[Random.Shared.Next(chars.Length)])
            .ToArray());
    }
}
