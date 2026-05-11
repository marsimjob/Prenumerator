using FluentValidation;

namespace Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ValidationException ex)
        {
            logger.LogWarning("Validation failed for {Path}", ctx.Request.Path);
            ctx.Response.StatusCode  = StatusCodes.Status400BadRequest;
            ctx.Response.ContentType = "application/json";

            var errors = ex.Errors
                .Select(e => new { field = e.PropertyName, message = e.ErrorMessage });

            await ctx.Response.WriteAsJsonAsync(new { errors });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Path}", ctx.Request.Path);
            ctx.Response.StatusCode  = StatusCodes.Status500InternalServerError;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new { error = "Något gick fel. Försök igen senare." });
        }
    }
}
