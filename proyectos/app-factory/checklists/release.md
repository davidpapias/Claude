# Checklist — Release Review

An application is never submitted automatically. A human must review and approve.

## Product

- [ ] MVP scope in `docs/03-PRD.md` matches what was built
- [ ] V1 exclusions still excluded
- [ ] No unapproved screens shipped
- [ ] No medical, therapeutic, financial, or legal claims beyond what was approved

## Quality

- [ ] `docs/12-QA.md` matrix complete; every case passed or marked `N/A` with a reason
- [ ] First launch, returning user, interrupted onboarding verified
- [ ] Empty, error, offline, invalid input states verified
- [ ] Data persists across app relaunch
- [ ] Verified on multiple device sizes
- [ ] Largest Dynamic Type size usable
- [ ] VoiceOver labels correct on every interactive element
- [ ] Dark and light appearance verified

## Subscription

- [ ] Product loading, including failure state
- [ ] Purchase success, cancellation, and failure verified in sandbox
- [ ] Restore purchases verified
- [ ] Entitlement verification correct
- [ ] Expired entitlement handled
- [ ] Offline behavior defined and verified
- [ ] Pricing and renewal language clear on the paywall
- [ ] Subscription analytics events fire

## Compliance and safety

- [ ] No secrets in source control
- [ ] Privacy nutrition label matches `docs/09-Analytics.md`
- [ ] Privacy policy and support URLs live
- [ ] No copied trademarks, assets, written content, or distinctive visual identity

## Sign-off

- [ ] Human reviewer named and decision recorded in `docs/13-Launch.md`
