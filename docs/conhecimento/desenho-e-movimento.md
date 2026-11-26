# Desenho e movimento do Hub

A direção visual do Hub, os tokens, o movimento das peças e a trilha Redesenho. As regras estão no
[guia de design](../guides/design.md), os valores no [DESIGN.md](../../DESIGN.md), a folha de movimento
em [movimento](../reference/movimento.md) e as etapas na [trilha Redesenho](../steps/trilhas/redesenho.md).

## Decidido

- O fundador, em 2026-11-26, ao estudo do redesenho: a navegação do pedido e do objeto, a escala curta
  de movimento medida no G4 OS, abrir a fase visual do Impeccable, o processo em oito fases e as cinco
  jornadas críticas. À direção visual: a direção B em grafite, "Fecha".

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O movimento do G4 OS 0.99.539, ao vivo | 2.321 animações: hover de 75 a 160 ms, menu e dica 100 ms, troca de tela 160 ms; com reduzir, nada anima | `redesenho-estudo` |
| A CSP estrita do Hub no Chromium | `el.style`, WAAPI e View Transitions com folha externa passam; `style=` e `<style>` sem nonce são recusados | `redesenho-estudo` |

## Lido

- Mastra playground-ui (`mastra@252efe1`), Dify dify-ui (`dify@fce5d30`) e shadcn base (`ui@0e5b2e6`),
  todos sobre Base UI 1.9: entrada e saída por `data-starting-style` e `data-ending-style`, em CSS, sem
  biblioteca de movimento (`redesenho-estudo`, `redesenho-r1`).
- Craft Agents (`craft-agents-oss@ce04aa3`): durações e molas `linear()` em variáveis CSS e o reduzir
  por uma variável na raiz (`redesenho-r1`).
- Base UI 1.9.0 Toast: a base do aviso; o Sonner injeta `<style>` e fere a W22 (`redesenho-estudo`).

## Superado

- A folha de movimento de 2026-11-17 ("menu, popover e dica abrem na hora", "passar o mouse não
  anima"): a decisão de 2026-11-26 pela escala curta a substitui; a R1 reescreve a folha.

## Aberto

- As molas de 420 e 560 ms do protótipo da direção B: decisão A do cartão da R1, do fundador.
- As regras V5, V19, V22 e V28 que a direção B contradiz: decisão B do cartão da R1, do fundador.

## Estudos de origem

- 2026-11-26, `redesenho-r1`, fechado: o estudo da etapa R1; a tabela de referência está no cartão.
- 2026-11-26, `redesenho-estudo`, fechado: o estudo do redesenho, com as fases 4 e 5 em protótipo.
