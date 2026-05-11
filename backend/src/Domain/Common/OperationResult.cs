using System.Diagnostics.CodeAnalysis;

namespace Domain.Common;

public sealed class OperationResult<T>
{
    public T? Value { get; }
    public OperationError? Error { get; }

    [MemberNotNullWhen(true,  nameof(Value))]
    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess { get; }

    private OperationResult(T value)             { Value = value; IsSuccess = true; }
    private OperationResult(OperationError error) { Error = error; IsSuccess = false; }

    public static OperationResult<T> Ok(T value)                        => new(value);
    public static OperationResult<T> Fail(string code, string message)  => new(new OperationError(code, message));
    public static OperationResult<T> NotFound(string message = "Hittades inte") =>
        Fail("NOT_FOUND", message);

    public static implicit operator OperationResult<T>(T value) => Ok(value);
}

// Non-generic variant for commands that return no payload.
public sealed class OperationResult
{
    public OperationError? Error { get; }

    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess { get; }

    private OperationResult()                     { IsSuccess = true; }
    private OperationResult(OperationError error) { Error = error; IsSuccess = false; }

    public static OperationResult Ok()                                  => new();
    public static OperationResult Fail(string code, string message)    => new(new OperationError(code, message));
    public static OperationResult NotFound(string message = "Hittades inte") =>
        Fail("NOT_FOUND", message);
}

public sealed record OperationError(string Code, string Message);
