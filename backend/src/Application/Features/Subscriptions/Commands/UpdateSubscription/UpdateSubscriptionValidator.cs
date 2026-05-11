using FluentValidation;

namespace Application.Features.Subscriptions.Commands.UpdateSubscription;

public class UpdateSubscriptionValidator : AbstractValidator<UpdateSubscriptionCommand>
{
    public UpdateSubscriptionValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.OwnerId).NotEmpty();
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Namnet får inte vara tomt.")
            .MaximumLength(100);
        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Priset måste vara större än noll.");
        RuleFor(x => x.BillingCycle)
            .IsInEnum().WithMessage("Ogiltig faktureringsperiod.");
    }
}
