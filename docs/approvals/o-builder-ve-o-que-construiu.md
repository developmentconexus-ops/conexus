# O Builder vê o que construiu

As palavras do fundador antes do cartão (`docs/steps/o-builder-ve-o-que-construiu.md`), em
2026-11-17 e 2026-11-18, às perguntas dos estudos do marco `A1`:

- De onde o navegador abre o app: a máquina E2B da conversa, nunca o servidor do Hub, com a
  Cloudflare como segunda opção. A escolha foi delegada ao firstmate: "preciso de você".
- Onde a conferência grava: um banco de teste vazio, "2. a".
- As provas na E2B do plano gratuito: "3. Aprovado".
- A emenda da decisão 0051, em que durante a conferência a máquina do Builder alcança só o endereço
  de conferência daquele app, fechado no fim: "Aprovo emenda".
- Depois das provas, o pedido de trazer "a implementação correta e validada".

Em 2026-11-22, ao estudo do harness, a ordem que põe este marco depois de Uma ficha por agente:
"A: Sua recomendacao" (a etapa 1 do harness antes do `A1`; a etapa 2 depois do `A1` e antes do
`A3`). As palavras estão também no [arquivo de aprovação da ficha](uma-ficha-por-agente.md).

Em 2026-11-23, às duas decisões da página do cartão (commit `205a1980`): "1. A" e "2. A".

- "1. A": em quem a conferência confia, (a) aceitar. O navegador da conferência roda na máquina da
  conversa, e o pior caso é uma versão quebrada chegar à Prévia; a porta dos apps não conta os
  pedidos falhos do lado dela.
- "2. A": a permissão nova, (a) aprovar. É a palavra D11 (`docs/guides/data.md`) para as três
  permissões do login `hub_runtime` (`SELECT`, `INSERT` e `DELETE`) só na tabela
  `apps.check_session`.

A aprovação da página do fundador, com o commit do cartão, entra aqui quando ele a der.

Cartão curto de O Builder vê o que construiu (`docs/steps/o-builder-ve-o-que-construiu.md`) aprovado em 2026-11-23 (commit fd27fdc77d4eaae0b9accfc40f98607e3ad18581), com as duas decisões da página respondidas e o merge e o início do A1 autorizados: "Pode".
Emenda do cartão curto de O Builder vê o que construiu (`docs/steps/o-builder-ve-o-que-construiu.md`) aprovada em 2026-11-24 (commit 936c7adc76b8837a8613a9861b0b0e65efa7b568), à conferência do G2 na nuvem (achado 3: a frase aberta da linha de `conexus_check` no meio do turno dizia "O código ficou guardado sem conferência", falso ali) e à revisão do pull request https://github.com/developmentconexus-ops/conexus/pull/1328; a emenda muda o critério 27 e a decisão 15 para a frase "Não consegui conferir o app agora. Isso não diz nada sobre o app." (o código da frase está no commit 9df4095e do pull request 1328) e não muda mais nada do cartão: "Aprovo a emenda"

Etapa O Builder vê o que construiu fechada neste pull request (L19), pela palavra do fundador com a etapa no ar. O cartão foi apagado; está no histórico do `main`, no commit `936c7adc`, o último que o mudou. As unidades entraram em quatro pull requests: G1, o navegador na máquina e `Machines.confer` (https://github.com/developmentconexus-ops/conexus/pull/1311); o primeiro passo da U2, a tabela `apps.check_session` e as três permissões de `hub_runtime` (https://github.com/developmentconexus-ops/conexus/pull/1315); G2, o Builder confere no navegador (https://github.com/developmentconexus-ops/conexus/pull/1318), no ar na v0.24.121; e os ajustes da conferência (https://github.com/developmentconexus-ops/conexus/pull/1328), no ar na v0.24.122. A tabela de referência não tinha linha remendo, e `docs/reference/boundaries.md` não muda. A arquitetura diz a máquina que abre o app de conferência e põe a dívida na seção 11. A dívida virou as issues `next-card` https://github.com/developmentconexus-ops/conexus/issues/1333 (o DNS para `8.8.8.8`), https://github.com/developmentconexus-ops/conexus/issues/1334 (o `setEnvs` do molde) e https://github.com/developmentconexus-ops/conexus/issues/1335 (a regra da E2B que olha o nome, o SNI). Dos itens `next-card` que o cartão levava, o 788 já estava fechado e o item 4 da 753 saiu, porque a U2 quebrou o comentário de `live.ts`.

Linha de uso de O Builder vê o que construiu, em 2026-11-24, na instalação da nuvem (https://hub.conexus.fun, v0.24.122), pelo roteiro do cartão: "Builder validado também".
