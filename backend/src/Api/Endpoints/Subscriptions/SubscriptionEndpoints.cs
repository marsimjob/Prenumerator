using Application.Features.Subscriptions.Commands.AddSubscriptionMember;
using Application.Features.Subscriptions.Commands.ClearActiveUser;
using Application.Features.Subscriptions.Commands.RemoveSubscriptionMember;
using Application.Features.Subscriptions.Commands.RequestWatch;
using Application.Features.Subscriptions.Commands.ResolveWatch;
using Application.Features.Subscriptions.Commands.ToggleSharedWatcher;
using Application.Features.Subscriptions.Commands.CreateSubscription;
using Application.Features.Subscriptions.Commands.DeleteSubscription;
using Application.Features.Subscriptions.Commands.SetActiveUser;
using Application.Features.Subscriptions.Commands.UpdateSubscription;
using Application.Features.Subscriptions.Queries.GetSubscriptionById;
using Application.Features.Subscriptions.Queries.GetSubscriptionsByGroupId;
using Domain.Enums;
using MediatR;


namespace Api.Endpoints.Subscriptions;

public static class SubscriptionEndpoints
{
    public static void MapSubscriptionEndpoints(this WebApplication app)
    {
        // Grouped under a group: list + create
        var byGroup = app.MapGroup("/api/groups/{groupId:guid}/subscriptions")
            .WithTags("Subscriptions");

        byGroup.MapGet("/",   GetByGroup);
        byGroup.MapPost("/",  Create);

        // Single-resource operations
        var byId = app.MapGroup("/api/subscriptions")
            .WithTags("Subscriptions");

        byId.MapGet("/{id:guid}",                  GetById);
        byId.MapPut("/{id:guid}",                  Update);
        byId.MapDelete("/{id:guid}",               Delete);
        byId.MapPut("/{id:guid}/active-user",       SetActiveUser);
        byId.MapDelete("/{id:guid}/active-user",    ClearActiveUser);
        byId.MapPost("/{id:guid}/members",             AddMember);
        byId.MapDelete("/{id:guid}/members/{memberId:guid}", RemoveMember);
        byId.MapPost("/{id:guid}/shared-watcher",  ToggleSharedWatcher);
        byId.MapPost("/{id:guid}/request-watch",   RequestWatch);
        byId.MapPost("/{id:guid}/resolve-watch",   ResolveWatch);
    }

    // GET /api/groups/{groupId}/subscriptions
    private static async Task<IResult> GetByGroup(
        Guid groupId, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new GetSubscriptionsByGroupIdQuery(groupId), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(result.Error);
    }

    // GET /api/subscriptions/{id}
    private static async Task<IResult> GetById(
        Guid id, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new GetSubscriptionByIdQuery(id), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(result.Error);
    }

    // POST /api/groups/{groupId}/subscriptions
    private static async Task<IResult> Create(
        Guid groupId,
        CreateSubscriptionRequest req,
        ISender sender,
        CancellationToken ct)
    {
        if (!Enum.TryParse<BillingCycle>(req.BillingCycle, ignoreCase: true, out var cycle))
            return Results.BadRequest(new { error = "Ogiltig faktureringsperiod. Använd 'Monthly' eller 'Yearly'." });

        if (!Enum.TryParse<WatchMode>(req.WatchMode, ignoreCase: true, out var watchMode))
            return Results.BadRequest(new { error = "Ogiltigt visningsläge. Använd 'Exclusive' eller 'Shared'." });

        var result = await sender.Send(
            new CreateSubscriptionCommand(groupId, req.Name, req.Color, watchMode, req.Price, cycle, req.OwnerId), ct);

        return result.IsSuccess
            ? Results.Created($"/api/subscriptions/{result.Value}", new { id = result.Value })
            : Results.BadRequest(result.Error);
    }

    // PUT /api/subscriptions/{id}
    private static async Task<IResult> Update(
        Guid id,
        UpdateSubscriptionRequest req,
        ISender sender,
        CancellationToken ct)
    {
        if (!Enum.TryParse<BillingCycle>(req.BillingCycle, ignoreCase: true, out var cycle))
            return Results.BadRequest(new { error = "Ogiltig faktureringsperiod." });

        if (!Enum.TryParse<WatchMode>(req.WatchMode, ignoreCase: true, out var watchMode))
            return Results.BadRequest(new { error = "Ogiltigt visningsläge." });

        var result = await sender.Send(
            new UpdateSubscriptionCommand(id, req.Name, req.Color, watchMode, req.Price, cycle, req.OwnerId), ct);

        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }

    // DELETE /api/subscriptions/{id}
    private static async Task<IResult> Delete(
        Guid id, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new DeleteSubscriptionCommand(id), ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }

    // POST /api/subscriptions/{id}/members
    private static async Task<IResult> AddMember(
        Guid id,
        AddSubscriptionMemberRequest req,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new AddSubscriptionMemberCommand(id, req.MemberId), ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }

    // DELETE /api/subscriptions/{id}/members/{memberId}
    private static async Task<IResult> RemoveMember(
        Guid id,
        Guid memberId,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new RemoveSubscriptionMemberCommand(id, memberId), ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }

    // POST /api/subscriptions/{id}/shared-watcher
    private static async Task<IResult> ToggleSharedWatcher(
        Guid id, AddSubscriptionMemberRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new ToggleSharedWatcherCommand(id, req.MemberId), ct);
        return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
    }

    // POST /api/subscriptions/{id}/request-watch
    private static async Task<IResult> RequestWatch(
        Guid id, RequestWatchRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new RequestWatchCommand(id, req.RequestorMemberId), ct);
        return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
    }

    // POST /api/subscriptions/{id}/resolve-watch
    private static async Task<IResult> ResolveWatch(
        Guid id, ResolveWatchRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new ResolveWatchCommand(id, req.RequestorMemberId, req.Accepted), ct);
        return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
    }

    // PUT /api/subscriptions/{id}/active-user
    private static async Task<IResult> SetActiveUser(
        Guid id,
        SetActiveUserRequest req,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new SetActiveUserCommand(id, req.MemberId), ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }

    // DELETE /api/subscriptions/{id}/active-user?memberId={memberId}
    private static async Task<IResult> ClearActiveUser(
        Guid id,
        Guid memberId,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new ClearActiveUserCommand(id, memberId), ct);
        return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
    }
}

// ── Request bodies ───────────────────────────────────────────────────────────
public record CreateSubscriptionRequest(
    string Name,
    string Color,
    string WatchMode,
    decimal Price,
    string BillingCycle,
    Guid OwnerId);

public record UpdateSubscriptionRequest(
    string Name,
    string Color,
    string WatchMode,
    decimal Price,
    string BillingCycle,
    Guid OwnerId);

public record SetActiveUserRequest(Guid MemberId);

public record AddSubscriptionMemberRequest(Guid MemberId);
public record RequestWatchRequest(Guid RequestorMemberId);
public record ResolveWatchRequest(Guid RequestorMemberId, bool Accepted);
