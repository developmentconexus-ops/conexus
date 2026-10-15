# 0017. Invitation e-mail by Cloudflare's e-mail service

## Context

Invitations need outbound e-mail.

## Decision

Cloudflare's own e-mail service sends invitations, with a delivery test before the first company and Resend as the fallback. Basis: The founder's answer, after explanation. The earlier answer was Resend; the change is his.

## Criterion

**Question.** Does an invitation sent by the Hub through Cloudflare's REST API arrive, and does its
link survive the inbox?

**Fixed.** The Hub release of step 4 on the cloud installation; the sender on a subdomain of the
Hub's domain, onboarded in Cloudflare's dashboard; Workers Paid; two inboxes of the founder at two
providers.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | An invitation to each inbox | Each arrives in the inbox, not spam, within 5 minutes, with SPF, DKIM and DMARC passing in its headers |
| 2 | The invitation's link, then "Ainda não tenho senha" | The second message arrives; the password set with its link signs in; the invitation is accepted |
| 3 | The link opened again after acceptance | Nothing is spent by opening it; the page shows the invitation accepted |
| 4 | The account's daily quota | Written down as the dashboard shows it |

**Not covered.** Volume; a corporate scanner unless the founder has such an inbox; providers not tried.

## Result

Not run. The service is in beta, needs the Workers Paid plan, and a new account starts with an unpublished daily quota.

## Consequences

A beta service on the only door in.

## Reopens when

The delivery test fails.

## State

The Criterion was one sentence until the step 4 study wrote it out, before any run. Brought. Founder, 2026-10-12: "Se cloudflare tem e é incluso em nosso plano porque não usar?" and "8. Sim".
