# 0017. Invitation e-mail by Cloudflare's e-mail service

## Context

Invitations need outbound e-mail.

## Decision

Cloudflare's own e-mail service sends invitations, with a delivery test before the first company and Resend as fallback. Basis: Founder's answer, after explanation.

## Criterion

**Question.** Does an invitation sent by the Hub through Cloudflare's REST API arrive, and does its link survive the inbox?

**Fixed.** Step 4 on the cloud installation; sender subdomain in Cloudflare; Workers Paid; founder's two inboxes at two providers.

1. **An invitation to each inbox.** Passes when reply lists `delivered` or `queued`, arriving in inbox, not spam, within 5 minutes, with SPF, DKIM and DMARC passing.
   *Failed at one inbox.* Both received it (`queued`); corporate Microsoft 365 mailbox filed it in Junk. SPF, DKIM (sender subdomain and Cloudflare's), DMARC and compauth passed; SCL 5, SFV:SPM, BCL 0.
2. **The invitation's link, then "Ainda não tenho senha".** Passes when the second message arrives, its password signs in, and invitation is accepted. *Passed.*
3. **The link opened again after acceptance.** Passes when nothing is spent and page shows invitation accepted. *Passed.* Signed out, it offered password and sign-in path.
4. **The account's daily quota.** 3 of 200 a day.
5. **An invitation to an address with no inbox.** `queued`; dashboard entry: read on 2026-10-17.

**Not covered.** Volume; a corporate scanner; other providers.

## Result

2026-10-16, v0.4.0 and v0.4.1, with founder; firstmate read log. Results are in italics above.
Repeated check (step 4.1): HTML invitation filed in Junk again at corporate Microsoft 365 mailbox. The founder accepted it as is ("nem ligo, podemos passar"), omitting allow-listing.

## Consequences

Delivery failed criterion at corporate mailbox, but was accepted for production.

## Reopens when

Delivery test fails. By its terms the condition was met, but the founder accepted delivery as is; does not reopen.

## State

Brought. Founder, 2026-10-12: "Se cloudflare tem e é incluso em nosso plano porque não usar?" and "8. Sim".
