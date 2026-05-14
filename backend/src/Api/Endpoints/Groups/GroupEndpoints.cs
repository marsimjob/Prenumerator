using Application.Features.Groups.Commands.CreateGroup;
using Application.Features.Groups.Commands.DeleteGroup;
using Application.Features.Groups.Commands.JoinGroup;
using Application.Features.Groups.Commands.RenameGroup;
using Application.Features.Groups.Queries.GetGroup;
using MediatR;

namespace Api.Endpoints.Groups;

public static class GroupEndpoints
{
    public static void MapGroupEndpoints(this WebApplication app)
    {
        var groups = app.MapGroup("/api/groups").WithTags("Groups");

        groups.MapPost("/",              CreateGroup);
        groups.MapPost("/join",          JoinGroup);
        groups.MapGet("/{id:guid}",      GetGroup);
        groups.MapPatch("/{id:guid}",    RenameGroup);
        groups.MapDelete("/{id:guid}",   DeleteGroup);
    }

    private static async Task<IResult> CreateGroup(
        CreateGroupRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new CreateGroupCommand(req.Name, req.UserId, req.DisplayName, req.AvatarColor), ct);
        return result.IsSuccess
            ? Results.Created($"/api/groups/{result.Value.GroupId}", result.Value)
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> JoinGroup(
        JoinGroupRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new JoinGroupCommand(req.InviteCode, req.UserId, req.DisplayName, req.AvatarColor), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(result.Error);
    }

    private static async Task<IResult> GetGroup(
        Guid id, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new GetGroupQuery(id), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(result.Error);
    }

    private static async Task<IResult> RenameGroup(
        Guid id, RenameGroupRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new RenameGroupCommand(id, req.UserId, req.Name), ct);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> DeleteGroup(
        Guid id, string userId, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new DeleteGroupCommand(id, userId), ct);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }
}

public record CreateGroupRequest(string Name, string UserId, string DisplayName, string? AvatarColor);
public record JoinGroupRequest(string InviteCode, string UserId, string DisplayName, string? AvatarColor);
public record RenameGroupRequest(string UserId, string Name);
