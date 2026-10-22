# O Builder constrói: o percurso e o roteiro

Como rodar e ler o percurso da etapa 14 (`tests/e2e/builder-builds.test.ts`, critério 26) e como o fundador faz o mesmo roteiro na nuvem. O roteiro é o do [card](../steps/e14-o-builder-constroi.md), "O roteiro de uso". Regras: [testes](../guides/testing.md) T14 e T23; [entrega](../guides/delivery.md) L17.

## Rodar o percurso

1. Ligue o banco de testes como em [banco local](local-database.md) e exporte as três variáveis.
2. Construa as telas e instale o Chromium: `npm run pree2e`.
3. Rode só este arquivo: `node --test --test-timeout=300000 tests/e2e/builder-builds.test.ts`. Ele também roda dentro de `npm run e2e`.

## O que ele prova e o que é dublê

O Hub é real, com banco, Git e telas construídas; o navegador é o Chromium. São dublês, nas portas deles:

- o modelo: o dublê da Anthropic toca as chamadas do Builder em ordem (`ask_user`, `submit_plan`, `task_write`, escritas, um comando, `conexus_check`);
- a máquina: uma pasta deste computador, onde o comando roda de verdade;
- a conferência: o programa da máquina é um script do teste que imprime um relatório que passa. Os passos de verdade são provados em `check.test.ts`.

Um percurso verde não prova o modelo de verdade nem o E2B (critérios 27 a 29 e 31, ao vivo).

## Ler uma falha

A mensagem diz o passo do roteiro: `questionsAndPlan` (1 e 2), `firstVersion` (3 e 4), `libraryAdded` (5), `screenOnly` (6). Um texto que não aparece é uma tela que mudou ou um defeito; nunca troque o texto do teste sem o texto aprovado no card.

## O roteiro do fundador, na nuvem

Padaria Sol, como Ana (dona), num Projeto "Encomendas":

1. Em **Conversa**: "Crie um app de encomendas com cliente, telefone, produto e data de entrega." Aparece um cartão de até 4 perguntas, a recomendada primeiro.
2. Responda. Aparece o plano, com **Aprovar e construir** e **Pedir ajustes**. Peça um ajuste; o plano volta mudado.
3. Aprove. A lista de tarefas aparece e cada tarefa é marcada quando a conferência passa. Abra uma linha de comando: ela mostra o comando e a saída.
4. No fim do turno: "Versão 1 guardada, montou". Em **Código**, as operações, a tabela e as telas sobre o starter.
5. "Agora mostre as entregas num calendário." O Builder acrescenta a biblioteca `react-big-calendar` sem perguntar; a versão 2 monta.
6. Num Projeto novo: "Uma página com a tabela de preços". O Builder pergunta os preços e guarda uma versão só de tela, que monta.

Depois aprove os textos dos cartões.
