# Atualização do Mastra para a 1.83

Em 2026-11-17, à pergunta "Subo o Mastra para a 1.83 agora, num PR próprio?": "Sim".

Cartão curto "Atualização do Mastra: de 1.82.0 para 1.83.0" (`docs/steps/mastra-1-83.md`) aprovado em 2026-11-17 (commit 5c1f52b5b5aab433d5b85c2acb6018e5667f0bfb), à pergunta "(a) cartão curto de uma unidade no mesmo PR, aprovado pela sua palavra, como a 1.82; (b) dispensa": "A". Lido pelo firstmate como a aprovação da página do cartão, com a sua única unidade U1, sem decisão aberta do fundador.

Etapa da atualização do Mastra para a 1.83 fechada neste pull request (L19), pela palavra do fundador com a etapa no ar. O cartão foi apagado; está no histórico do `main`, no commit `5c1f52b5`, o último que o mudou. A U1 está em https://github.com/developmentconexus-ops/conexus/pull/1151, no `main` desde a v0.24.103. As linhas remendo da tabela de referência são as seções que já estavam em `docs/reference/boundaries.md`; a U1 as releu na 1.83.0 e nenhuma entra nova.

Os testes de aceite. Os critérios do cartão em `5c1f52b5` foram conferidos contra `main`, arquivo e título. O critério 1 está em `apps/server/src/builder/conversation/conversation-routes.test.ts`, no caso "o cartão respondido duas vezes: a segunda o Mastra recusa, e o Builder segue uma vez". O critério 6, em `apps/server/src/platform/recordings.test.ts`, exige a versão instalada só de `data-query` e `reads`. O critério 7 (should) não se cumpriu inteiro: os streams retomáveis ficam ligados sem opção nossa, mas o caso "desligar para o turno em curso…" de `conversation-stream.test.ts` segue `todo`, pela https://github.com/developmentconexus-ops/conexus/issues/339. Os critérios 3 a 5 foram provados na avaliação e no CI do 1151, não de novo aqui.

A lista de Fechamento da revisão do 1151: as citações da 1.83.0 em `boundaries.md`, as linhas da prateleira em `stack.md` e o cartão curto que faltava entraram no commit `5c1f52b5`. A Issue futura da revisão, a dívida T26 que o cartão deixava "numa issue à parte" e que não tinha sido aberta, está em https://github.com/developmentconexus-ops/conexus/issues/1175 (as gravações nativas na 1.79 e na 1.82, e o roteiro `approval`).

Revisão de saúde do CI (L19, `docs/how-to/ci-health.md`): é a da semana, por quem não construiu a etapa, e não faz parte deste pull request.

Linha de uso da atualização do Mastra para a 1.83, em 2026-11-17, com a etapa no ar na v0.24.103, à pergunta se fechava as duas etapas no ar: "Fecha 1.83 e fgabrica"
