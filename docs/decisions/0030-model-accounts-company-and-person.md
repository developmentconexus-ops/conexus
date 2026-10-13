# 0030. Model accounts of the company and the person, subscriptions included

## Context

The founder has no API key, and a company can open a subscription on one e-mail.

## Decision

From launch, a model account belongs to a company or to a person. Five forms: API key; Anthropic subscription sign-in; OpenAI sign-in through its official programme, if its terms confirm; Google subscription sign-in; a subscription connected at company level by an administrator. In a conversation the person's account comes first. Basis: The founder's purpose, stated, against the recommendation.

## Criterion

None written before. Brought from earlier work.

## Result

Not run.

## Consequences

Anthropic's and Google's terms forbid this use; the risk is an account blocked without notice. A company-level subscription has one usage limit for the whole company.

## Reopens when

A vendor blocks accounts, or changes its terms.

## State

Brought. Founder, 2026-10-12: "tem que entrar B as duas desde o lançamento", "4. Sim e eu autorizo", "7. Sim eu autorizo", "5. Vamos ter assinatura por empresa sim", "6. B vou trazer".
