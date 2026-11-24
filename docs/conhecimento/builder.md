# Builder

Como o Builder constrói um app: o turno, a máquina E2B, o navegador que vê o app e a conferência do
fim do turno. O desenho está em [turno](../explanation/builder-turn.md) e no
[prompt](../reference/builder-prompt.md); a Prévia e o app publicado estão em [Prévia e apps](previa-e-apps.md).

## Decidido

- [0028](../decisions/0028-e2b-build-machine.md): a E2B é a máquina de construção. [0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md), proposto em 2026-10-21: o Builder escreve na máquina
  E2B, e o Git de cada app é nosso, copiado no R2.
- [0053](../decisions/0053-builder-tools-run-without-asking.md), aceito em 2026-10-20: as ferramentas do Builder rodam sem perguntar.
- [0055](../decisions/0055-apps-on-the-platform-contract.md), aceito em 2026-10-22: o app é escrito contra o contrato da plataforma, sobre um ponto de
  partida que o Builder edita.
- O roteiro dos marcos A1 a A4 nasceu dos quatro estudos "Builder ideal" de 2026-11-09.
- Aprovação: [o-arquivo-do-turno-anterior](../approvals/o-arquivo-do-turno-anterior.md).
- Aprovação: [o-builder-ve-o-que-construiu](../approvals/o-builder-ve-o-que-construiu.md), o A1, fechado em 2026-11-24
  (v0.24.122); o cartão foi apagado. Veio depois de [Uma ficha por agente](../approvals/uma-ficha-por-agente.md).

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| O navegador `agent-browser` dentro da máquina E2B | 230 ms por ação, contra 1,7 s pelo proxy | `conexus-a1-navegador-implementacao` |
| O CDP do Hub ao Chromium da máquina | só passou com dois remendos; 1,28 a 1,36 s por ação; pico de 373 MiB | `conexus-a1-provas-e2b` |
| A memória com e sem buffer | o mesmo app em 12,5 min; o buffer custou 30% mais banco por hora | `conexus-om-buffer-ab` |
| Por que os apps saem iguais | os 24 apps medidos têm a mesma cor principal, ditada pela nossa skill e pelo ponto de partida | `conexus-builder-output-study` |
| A máquina ligada a cada mensagem | o nativo da Factory deixa o E2B pausar depois de 5 min parado | `conexus-machine-files-study` |

## Lido

- Dezesseis construtores (Dyad, bolt.diy, Chef, Kiro, Lovable, v0, vibesdk e outros): quase todos
  perguntam e planejam antes, e os melhores rodam o app enquanto constroem, com o fim decidido em
  código (`conexus-builder-ideal-builders`, `conexus-builder-ideal-flow`).
- Galerias de ToolJet, Budibase, Twenty e cal.com: uns doze tipos de app, quase todos com a mesma
  espinha (`conexus-builder-ideal-apps`).
- Mastra 1.82: workflows, subagentes, juiz de meta, máquina e quatro provedores de navegador; não
  tem a ferramenta do endereço da prévia (`conexus-builder-ideal-mastra`).
- `agent-browser` 0.43.0, `e2b` 2.63.0, `@mastra/agent-browser` 0.6.0.
- Kiro (`kiro-cli` 3.3.0): o modo spec existe só no motor V3 (`conexus-kiro-observations`).

## Superado

- O navegador do Builder no Hub (`conexus-a1-estudo-navegador`): o navegador abre o app dentro da
  máquina E2B, nunca no servidor do Hub.
- O dado copiado por app (`conexus-builder-advisor`, `-2`): a cópia é da empresa e mora no lago ([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)).

## Aberto

- A aprovação do cartão do A1 (PR 1203).
- Instruções da empresa e um modo de modelo automático (`conexus-kiro-study`): sem decisão.

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-23 | `conexus-a1-cartao-ficha` | decidido | PR 1203; [o-builder-ve-o-que-construiu](../approvals/o-builder-ve-o-que-construiu.md) | O cartão do A1 passa a vir depois de Uma ficha por agente: a conferência entra pelo campo judge da ficha do Builder, sem nova decisão do fundador. |
| 2026-11-18 | `conexus-a1-provas-e2b` | superado, por conexus-a1-navegador-implementacao | - | O CDP do Hub ao Chromium da máquina só passou com dois remendos; 1,28 a 1,36 s por ação; pico de 373 MiB de memória. |
| 2026-11-18 | `conexus-a1-navegador-implementacao` | decidido | PR 1203 | O CLI agent-browser roda dentro da máquina E2B, sem proxy nem token no CDP: 230 ms por ação contra 1,7 s pelo proxy. |
| 2026-11-18 | `conexus-a1-cartao` | decidido | PR 1203; [o-builder-ve-o-que-construiu](../approvals/o-builder-ve-o-que-construiu.md) | Cartão do A1: o juiz do fim do turno sobe a versão num Worker de conferência com esquema vazio e roda agent-browser dentro da máquina; fechado em 2026-11-24. |
| 2026-11-17 | `conexus-a1-navegador-seguranca` | superado, por conexus-a1-navegador-implementacao | - | O navegador abre o app dentro da máquina E2B da conversa, nunca no servidor do Hub, com a rede aberta só ao endereço da conferência. |
| 2026-11-17 | `conexus-a1-estudo-navegador` | superado, por conexus-a1-navegador-seguranca | - | Recomendou o navegador do Builder no Hub, com base em Lovable, Base44, v0, vibesdk e agent-browser do Mastra. |
| 2026-11-17 | `conexus-a1-estudo-maquina-worker` | decidido | PR 1203 | Os dois: a máquina E2B escreve e confere rápido, mas ver o app pede o Worker de verdade com banco de teste e navegador dentro do turno. |
| 2026-11-13 | `conexus-machine-files-study` | decidido | [o-arquivo-do-turno-anterior](../approvals/o-arquivo-do-turno-anterior.md) | Um arquivo de turno anterior ligava a máquina a cada mensagem; o nativo da Factory deixa o E2B pausar depois de 5 min parado. |
| 2026-11-13 | `conexus-kiro-observations` | aberto | - | Notas do Kiro em uso como trabalhador: kiro-cli 3.3.0 no motor `V2`; o modo spec existe só no V3, que nenhum trabalhador usou. |
| 2026-11-09 | `conexus-builder-output-study` | decidido | docs/roadmap.md (A2) | Os apps saem iguais porque mandamos: os 24 apps medidos têm a mesma cor principal, ditada pela nossa skill e pelo ponto de partida. |
| 2026-11-09 | `conexus-builder-ideal-mastra` | decidido | docs/roadmap.md (A1 a A4) | O Mastra 1.82 dá workflows, subagentes, juiz de meta, máquina e quatro provedores de navegador; não dá a ferramenta do endereço da prévia. |
| 2026-11-09 | `conexus-builder-ideal-flow` | decidido | docs/roadmap.md (A1 a A4) | Síntese: o Builder deve rodar o app durante a construção e o código, não o modelo, decide que terminou; plano aprovado antes. |
| 2026-11-09 | `conexus-builder-ideal-builders` | decidido | docs/roadmap.md (A1 a A4) | Dezesseis construtores lidos: quase todos perguntam e planejam antes, e os melhores rodam o app enquanto constroem, com o fim decidido em código. |
| 2026-11-09 | `conexus-builder-ideal-apps` | decidido | docs/roadmap.md (A1 a A4) | As galerias caem em uns doze tipos de app, quase todos a mesma espinha: tabela de trabalho com situação, cadastro, início, lista e formulários. |
| 2026-11-09 | `conexus-builder-advisor-2` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | [capacidade-2-o-sync-da-empresa](../approvals/capacidade-2-o-sync-da-empresa.md) | Segunda rodada: o Builder vê o dado copiado (provado), uma só lógica de acesso; banco de teste e plano em fases não provados. |
| 2026-11-09 | `conexus-builder-advisor` | superado, por [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | [capacidade-2-o-sync-da-empresa](../approvals/capacidade-2-o-sync-da-empresa.md) | O dado copiado deve ser da empresa, não de cada app; a harness do Builder deve seguir o quadro de fases do Factory do Mastra. |
| 2026-11-03 | `conexus-kiro-study` | aberto | - | O Kiro guia por spec (requisitos, desenho, tarefas); recomenda instruções da empresa como cartão futuro e nenhum modo Auto de modelo agora. |
| 2026-11-02 | `conexus-om-buffer-ab` | decidido | - (mantém o B1 de 2026-10-31) | Sem buffer e com buffer o Builder chegou ao mesmo app em 12,5 min; o buffer custou 30% mais banco por hora, então fica o B1. |
