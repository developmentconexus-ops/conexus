# 0017. Invitation e-mail by Cloudflare's e-mail service

## Context

Invitations need outbound e-mail.

## Decision

Cloudflare's own e-mail service sends invitations, with a delivery test before the first company and Resend as the fallback. Basis: The founder's answer, after explanation; the earlier answer was Resend.

## Criterion

**Question.** Does an invitation sent by the Hub through Cloudflare's REST API arrive, and does its
link survive the inbox?

**Fixed.** The Hub release of step 4 on the cloud installation; the sender on a subdomain of the
Hub's domain, onboarded in Cloudflare; Workers Paid; two inboxes of the founder at two providers.

1. **An invitation to each inbox.** Passes when the reply lists it under `delivered` or `queued`, and
   it arrives in the inbox, not spam, within 5 minutes, with SPF, DKIM and DMARC passing.
   *Failed at one inbox.* Both received it (`queued`); the corporate Microsoft 365 mailbox filed it
   in Junk. SPF, DKIM (the sender's subdomain and Cloudflare's), DMARC and compauth passed; SCL 5,
   SFV:SPM, BCL 0.
2. **The invitation's link, then "Ainda não tenho senha".** Passes when the second message arrives,
   its password signs in, and the invitation is accepted. *Passed.*
3. **The link opened again after acceptance.** Passes when nothing is spent and the page shows the
   invitation accepted. *Passed.* Signed out, it still offered the password and sign-in path.
4. **The account's daily quota.** 3 of 200 a day.
5. **An invitation to an address with no inbox.** `queued`; the dashboard's entry a day
   later: read on 2026-10-17.

**Not covered.** Volume; a corporate scanner; other providers.

## Result

2026-10-16, v0.4.0, with the founder; firstmate read the log. The results are in italics above.

## Consequences

A beta service on the only door in. Check 1's miss meets "Reopens when" for that mailbox; the
decision holds for one repeat.

## Reopens when

The delivery test fails. Step 4.1 sends HTML and text with a button and repeats check 1 at that
mailbox; Junk again means Resend.

## State

Brought. Founder, 2026-10-12: "Se cloudflare tem e é incluso em nosso plano porque não usar?" and "8. Sim".
