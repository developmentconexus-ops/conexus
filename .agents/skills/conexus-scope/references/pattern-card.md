# The pattern card template

For a step of the pattern track ([delivery L27](../../../../docs/guides/delivery.md)): a connector
through the kit, or other work that has a template. A step with a new mechanism is frontier and uses
the [full card](card.md).

Name the card file `docs/steps/pattern-<step>.md`: the name is how `check-method-freeze` reads
the track. The card stays under 2,000 words. Firstmate reads it; there is no separate card reader, and the
founder approves its page from the chat summary. The study is only for a new login kind or a
provider's quirk; otherwise the kit is the study.

The light method, gate by gate:

- **Unit review.** One Opus review per unit, launched only when CI is green on that head. A unit
  that only adds kit operations covered by the conformance test is read in the step review.
- **Deltas.** At most one; a second returns to the card.
- **Step review.** One Opus review of the whole step, with QA when the step has screens.
- **Closing.** Folded into the last unit's pull request.
- **Ownership.** A unit stays in `packages/connectors/src/<provider>/` and its fakes; a shared
  contract in its diff goes to a frontier review.

```markdown
# Etapa <n>: <nome>

## O que a Ana recebe

<o que uma pessoa passa a fazer, pelo que ela vê>

## O roteiro de uso

1. <ação e o que aparece>

## As unidades

| Unidade | O que entrega | Pastas | Depende de |
| --- | --- | --- | --- |

## Linhas da tabela de referência

<só as peças novas: arquivo do `main`, como as referências fazem, veredito nativo, embrulhado ou
remendo; o que o kit já cobre fica de fora>

## Os critérios de aceite

<cada um observável de fora, recusas incluídas>
```
