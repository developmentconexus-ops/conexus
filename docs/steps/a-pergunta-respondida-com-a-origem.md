# A pergunta respondida com a origem

Trilha Dados, primeira etapa do que a spec da camada de dados ainda não construiu, no caminho do marco
`D2` do [roteiro](../roadmap.md). O cartão segue o modelo da opção A (o fundador, 2026-11-15: "A"):
um cartão só, com a ficha de cada unidade. A ordem é a dele, no mesmo dia: "A Essas juntas", a linha
principal e, ao lado, o explorador e a passada semanal; depois o Negócio e o Contexto. Sobre as telas
da proposta aprovada: "2. Sim Para a gente seguir esse documento, essas telas, elas vão ser
referências em como a gente vai fazer e implementar".

A entrada já estava estudada e aprovada: a spec das partes 1 a 4 em
[dados-spec/](trilhas/dados-spec/README.md), as emendas de 2026-11-15 (a tabela que o papel não lê
fica escondida; cada pessoa vê as próprias leituras; nenhuma regra de dado pessoal) e os itens do
explorador e da passada semanal, com as telas da proposta. Os estudos e as capturas das plataformas
de dados de referência ficam fora do repositório (delivery L21); a tabela de referência diz a
situação e o rótulo de cada uma sem nomeá-las. Cada linha citada foi lida no `main` em `5d02e643`,
com `@mastra/core` 1.82.0; o que se apoia num pull request aberto diz o head dele: o explorador,
grupo 1 (PR 1085, `689ece4a`), e as colunas e tabelas da passada semanal (PR 1088, `4d498ada`).

Este cartão substitui, da spec do repositório: a parte 3, grupos 3 e 4; o item das emendas, grupo 2
(o contrato sem `withheld`), que a spec do repositório não tinha; e, de fora dela, o explorador,
grupo 2, e a passada semanal, grupos 2 e 3. O que a spec ainda guarda para as etapas seguintes fica
nela até o cartão de cada uma.

## A página do fundador

**No fim desta etapa** você pergunta ao Assistente, ou ao Builder num Projeto, sobre um dado copiado
de um sistema, por exemplo quanto se vendeu ontem. Ele acha a tabela no catálogo, consulta a cópia e
responde. Embaixo da resposta vem a origem: de qual sistema, de qual tabela e de quando é a cópia,
com a consulta que ele rodou, que você abre e copia. Em Dados, a página de cada tabela passa a mostrar
o caminho, de quando é a cópia e quantas linhas ela tem, as abas Visão geral, Colunas, Amostra e
Rodadas, e um painel de detalhes ao lado. Toda cópia incremental ganha uma passada inteira aos
domingos de madrugada, que relê tudo e apaga da cópia o que foi apagado no sistema.

**O roteiro de uso.**

1. No Hub no ar, abra o Assistente e pergunte "Quanto vendemos ontem?". Aparecem as linhas
   "Consultou o catálogo" e "Consultou sankhya_vendas, 1 linha", e a resposta termina com o bloco
   Fontes: a logo do Sankhya, "Sankhya · Matriz", a tabela em letra de código e, à direita, um ponto
   verde com "copiado hoje às …".
2. Abra a linha "Consultou sankhya_vendas". Aparece a consulta que o agente rodou. Toque em
   **Copiar a consulta** e cole num lugar qualquer.
3. Num Projeto com a cópia de vendas liberada, faça a mesma pergunta ao Builder. Ele usa as mesmas
   duas ferramentas e responde com a mesma origem.
4. Em Dados, abra a tabela de vendas. No topo aparece "Dados › Sankhya › sankhya_vendas", com a linha
   "Copiada do Sankhya em … · N linhas". A página abre na Visão geral, e o painel Detalhes fica ao lado.
   Na aba Amostra, cada coluna mostra o ícone do tipo, e cada linha mostra o seu número.
5. Na segunda-feira, abra a aba Rodadas da mesma tabela. A rodada de domingo às 04:07 aparece marcada
   **Passada inteira**. Um registro apagado no sistema durante a semana já não está na Amostra.
6. Diga o que viu e aprove os textos das telas.

**O que você faz, e quando.** Antes: nada; o Hub no ar já tem uma empresa de teste com o Sankhya e a
cópia de vendas. No começo: aprova esta página; as letras você já escolheu. No meio: dá a palavra
de merge do PR da permissão (letra A). No fim: faz o roteiro, diz o que viu e aprova os textos das telas,
que cada PR lista.

**Fica de fora.**

- Cada papel ler só as tabelas dele, as telas de quem lê, o Registro de dados e a conformidade
  contra a implementação real. São a etapa 2 e a etapa 3, nesta ordem. Até lá, o Assistente lê toda
  cópia da empresa, como hoje.
- A mensagem do sistema na rodada que falhou, a ferramenta que explica a causa, Seguir, a seção Avisos
  e o aviso na primeira falha. São da passada semanal, etapas 2 e 3.
- Na página da tabela: o botão Perguntar ao Assistente, a aba Quem lê, a aba Qualidade, o nome de
  negócio, Conceito e Ligações. Cada um entra com a parte que o faz funcionar. Também ficam de fora
  a contagem "18 de 22 descrições" e os botões Buscar, Filtrar e Colunas sobre a grade da Amostra,
  porque nenhuma referência conta descrições e uma amostra de 5 linhas não tem o que filtrar.
- Das pendências guardadas para o próximo cartão, a etapa toma uma: a 940, a linha com a data de
  alteração vazia que a cópia incremental nunca corrige, porque a passada inteira de domingo relê
  tudo e a corrige. As outras que tocam esta etapa esperam. A 1016 (as leituras ao vivo devolvem a
  falha ao modelo como resposta, e não como erro) muda as linhas de leitura de todos os agentes,
  também as do Construtor, que está congelado; as duas ferramentas novas já nascem do jeito certo,
  e a etapa só põe a hora na leitura que deu certo. A 942 (ver o relógio da cópia rodar sozinho no
  Hub no ar) fica pela metade: no passo 5 você vê a rodada de domingo disparada sozinha, mas não o
  segundo ciclo da rodada normal. A 944 (o número exato acima de 10.000 linhas) é da tela de Dados
  do Projeto, que esta etapa não toca, e pede uma palavra sua. A 946 (a coluna interna `_pass`
  aparece numa consulta que pede todas as colunas) não traz dado da empresa, e o conserto pede uma
  escolha entre uma permissão por coluna e uma visão.

**As decisões suas nesta etapa.** Escolhidas por você em 2026-11-15: "2. A1 / 3. B1". As sete
permissões entram num PR só, e a página da tabela abre na Visão geral. As letras ficam abaixo como
foram postas.

- **A. As permissões da passada semanal e dos avisos** (data D11: uma permissão nova no banco do
  Hub pede a sua palavra, num PR só dela). As tabelas e as colunas estão no PR 1088. O que o login do
  Hub passa a poder:

  | O quê | O que o login do Hub passa a poder |
  | --- | --- |
  | `copies.copy_run`, colunas `system_status`, `system_code` e `system_message` | Gravar, no fim de uma rodada que falhou, o status, o código e a mensagem que o sistema mandou ao recusar a leitura. Nunca o corpo da resposta, e no máximo 1.000 caracteres, porque o banco recusa mais |
  | `notifications.alert_recipient`, a lista de avisos da empresa | Ler a lista da empresa, pôr um e-mail e tirar um e-mail. Mudar um e-mail é tirar e pôr de novo. Cada empresa só vê a sua |
  | `notifications.copy_follower`, quem segue cada cópia | Ler quem segue as cópias da empresa, e cada pessoa seguir ou deixar de seguir por si. Ninguém segue por outra pessoa |
  | `notifications.copy_notice`, o aviso de falha no sino | Gravar o aviso de uma falha para cada pessoa que segue, ler os próprios avisos e marcá-los como lidos. Ninguém apaga nem muda um aviso. Ele sai junto com a pessoa ou com a cópia |

  - **A1 (recomendada).** As sete agora, num PR só, como a spec ordena: as permissões logo depois
    das tabelas. Nenhuma unidade desta etapa as usa ainda; as três de `copy_run` servem à etapa 2 e
    as quatro de avisos à etapa 3. Veredito: nativo; é o molde da permissão do registro de escrita,
    que já passou por você.
  - **A2.** Dividir: as três de `copy_run` num PR da etapa 2, e as quatro de avisos num PR da etapa 3.
    São duas palavras suas em vez de uma, e cada permissão chega junto com quem a usa.
- **B. A aba em que a página da tabela abre.** A tela `v10` da proposta, que você aprovou como
  referência, desenha a Amostra aberta. As duas plataformas de dados de referência abrem a tabela na
  visão geral.
  - **B1 (recomendada).** Abre na Visão geral, como as duas referências. A Amostra fica a um toque.
    Veredito: nativo; é a aba padrão do componente de abas que a página já usa.
  - **B2.** Abre na Amostra, como a `v10`.

**A emenda de 2026-11-15.** Três mudanças, com as suas palavras do mesmo dia no arquivo de
aprovação. O roteiro de uso não muda.

- Uma tabela copiada de um sistema cuja conexão espera nova autorização, ou que o Projeto não
  recebeu, continua legível pelo agente, como já é na página da tabela, na Amostra e no app.
  O agente diz a origem pelo registro gravado da cópia, com o estado da conexão e de quando é a
  cópia: no Início, "Sankhya · Matriz, conexão a reautorizar". Só num Projeto que não recebeu a
  conexão ele nomeia apenas o sistema ("Sankhya"), nunca a conexão ("Matriz"), que é o que o app do
  Projeto já vê. Antes, o agente recusava a tabela.
- Uma consulta que o banco recusa por permissão diz na tela "Essa tabela não está no catálogo.", e
  não mais "Seu papel não lê esta tabela.", que era falso num Projeto e revelava a tabela.
- Um grupo novo, G2b, faz a primeira mudança e os consertos que a revisão de G2 deixou, antes de G3.

**A emenda de 2026-11-16.** O texto deste cartão descreveu o bloco Fontes mais pobre que a tela que
você aprovou, e a construção seguiu o texto. Você escolheu a tela A. Muda o passo 1 do roteiro; as
suas palavras estão no arquivo de aprovação.

- Antes, cada fonte era uma linha de texto cinza: "Sankhya · sankhya_vendas · copiado hoje às 08:45",
  sem logo, sem o nome da conexão e com a rodada parada no mesmo cinza da cópia em dia.
- Depois, cada fonte é uma linha com a logo do sistema, o sistema e a conexão ("Sankhya · Matriz",
  sem repetir quando a conexão tem o nome do sistema), a tabela em letra de código numa pastilha e,
  à direita, um ponto com as palavras de hoje: verde na cópia em dia e na leitura ao vivo, amarelo
  na rodada parcial, vermelho na parada. A conexão que espera nova autorização ganha o selo
  vermelho de Integrações ("Chaves recusadas"). No Projeto que não recebeu a conexão, só o sistema e
  a logo. A leitura ao vivo diz "ao vivo · lido agora, às 00:37". A 390 px, a tabela e o ponto descem
  para a segunda linha.
- A conversa do Builder passa a mostrar a fonte com o mesmo nome e a mesma logo do Assistente
  ("Sankhya", e não mais "sankhya").
- Um grupo novo, G7, um PR só da tela, faz a mudança depois de G3.

```
1280 px
  Fontes
  [logo] Sankhya · Matriz  [sankhya_vendas]                  ● copiado hoje às 08:45
390 px
  Fontes
  [logo] Sankhya · Matriz
         [sankhya_vendas]  ● copiado hoje às 08:45
```

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 (um PR só do contrato e da conformidade, issue `contrato`) | U1 `withheld` sai do contrato e a lei da tabela escondida | O catálogo perde a segunda lista: a tabela que o papel não lê não aparece em lugar nenhum de `describe`, e pedi-la pelo nome responde `NOT_IN_CATALOG`, igual a um nome que não existe. A conformidade troca a lei da tabela retida pela lei da tabela escondida; a lei da consulta recusada pelo banco fica | `packages/hub-api/src/`, `apps/server/src/hub/data/` (uma linha e um teste), `scripts/rerun-never.json` | testing (T5, T10, T27); security S10 | nada; entra antes das ferramentas (parte 3, grupo 3) e do catálogo por papel (parte 4, grupo 6) |
| G2 | U2 As duas ferramentas, os nomes, o fecho do Builder e o verificador | `data_describe` e `data_query` sobre o contrato, com a origem de cada tabela e a recusa lançada como erro da ferramenta; os nomes e a forma do resultado no dono único; a ordem do agente num texto só; a pasta nova fora da lista de migração; a linha mínima de cada uma na conversa | `apps/server/src/builder/data-tools/` (nova), `packages/hub-api/src/tools.ts`, `packages/hub-api/src/assistant.ts`, `apps/server/src/builder/conversation/permissions.ts`, `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts`, `apps/web/src/builder/conversation/` | testing, web | U1 (o catálogo sem `withheld`); a fonte de consulta, já no `main` (PR 1077) |
| G2 | U3 A montagem nos três agentes, com a porta na raiz do servidor | O `data` da raiz do servidor chega ao Assistente, ao Builder e ao agente salvo; os três oferecem as duas ferramentas e trazem a ordem; o Construtor não; o bloco "## Data" do Builder manda ver linhas com `data_describe` | `apps/server/src/main.ts`, `apps/server/src/conversations-of.ts`, `apps/server/src/builder/assistant/`, `apps/server/src/builder/conversation/`, `apps/server/src/builder/agents/`, `apps/server/src/builder/app-data/context.ts` | testing | U2 |
| G2b (um PR só, emenda de 2026-11-15) | U2b A origem pelo registro gravado da cópia, e os fechamentos de G2 | O contrato leva em `kept` a fonte gravada de cada tabela no lugar de só o id: o nome, o conector e o estado da conexão (`NAMED`), ou, no catálogo de um Projeto que não recebeu a conexão, só o conector (`NOT_GIVEN`); quem monta o catálogo de cada lugar decide; as duas ferramentas leem toda tabela do catálogo e dizem a origem pelo que `kept` traz; sai a recusa por conexão fora de `systems` e o log `DATA_ORIGIN_UNREAD`; a frase de `NOT_IN_ROLE` manda listar o catálogo; os Fechamentos A, B e C do delta de G2 e o 6 da revisão | `packages/hub-api/src/` (`company-data.ts`, a conformidade, `assistant.ts`), `apps/server/src/hub/connectors/` (só `catalog-systems.ts`, `public.ts` e um teste), `apps/server/src/hub/data/` (`catalog.ts`, `deps.ts` e um teste), `apps/server/src/hub/copies/` (só `catalog-view.ts` e o seu teste), `apps/server/src/builder/data-tools/`, os três chamadores de `dataTools` (uma linha cada), `scripts/rerun-never.json`, `apps/web/src/builder/conversation/` (só a divisão de `tool-registry.ts`) | testing | G2 no `main` (PR 1095, merge `f1067f05`) |
| G3 (um PR; depois dele, a QA, testing T25) | U4 O `at` da leitura ao vivo, os cenários `data-query` e `reads`, e as perguntas com resposta conhecida | A leitura ao vivo guarda a hora em que a resposta voltou; o fluxo nativo do Mastra gravado com as duas ferramentas de dado, de onde as telas leem o resultado; seis perguntas sobre o dado copiado no placar, com o número calculado do dublê | `apps/server/src/builder/connectors/`, `apps/server/src/builder/data-tools/` (só o ajudante de teste), `apps/server/src/builder/assistant/`, `apps/server/src/platform/` (gravações e o teste delas), `packages/hub-api/src/assistant.ts`, `scripts/`, `apps/web/src/builder/conversation/test-recorded.ts` | testing | U2, U3, U2b (a forma da origem) |
| G3 | U5 As linhas das duas ferramentas, o corpo com a consulta e os textos de recusa | Telas `p3-02`, `p3-06`, `p3-07`: a frase de cada estado, o detalhe ao lado, a consulta no corpo aberto com **Copiar a consulta**, o texto de cada recusa | `apps/web/src/builder/conversation/` | web, testing | U3, U2b, U4 (o cenário `data-query`) |
| G3 | U6 O bloco Fontes com a origem do dado e a leitura ao vivo | Telas `p3-01`, `p3-04`, `p3-05`: a fonte de cada tabela lida (conector, tabela, hora da cópia, rodada parcial ou parada) e a da leitura ao vivo ("lido agora, às") | `apps/web/src/builder/conversation/`, `apps/web/sources.layout.test.ts` | web, testing | U3, U2b, U4 (os cenários `data-query` e `reads`) |
| G4 | U7 O caminho, a linha da cópia, as abas e a Visão geral | A página da tabela abre com "Dados › {sistema} › {tabela}", o logo, a linha "Copiada do {sistema} em … · N linhas" e as abas Visão geral (a de abertura), Colunas N, Amostra e Rodadas | `apps/web/src/hub/copies/`, `apps/web/src/routes/_app/companies/$companyId/` (só `data.$copyId.tsx`), `apps/web/` (só `sweep-table-states.ts`), `docs/reference/` (só `screens.md`) | web, design, testing | PR 1085 mesclado (explorador, grupo 1) |
| G4 | U8 O painel Detalhes | O painel ao lado das abas com Sistema, Frequência, Última rodada, Linhas e a frase do que fica no Hub; sai Ligação, Chave, Modo e Camada | `apps/web/src/hub/copies/`, `docs/reference/` (só `screens.md`) | web, design, testing | U7 |
| G4 | U9 O ícone do tipo e o número da linha na amostra | Cada cabeçalho da Amostra com o ícone do tipo e o nome em mono; a primeira coluna com o número da linha | `apps/web/src/hub/copies/` | web, design, testing | U7 |
| G5 | U10 As permissões da passada semanal e dos avisos | As sete permissões do login do Hub sobre as três colunas `system_*` de `copies.copy_run` e as três tabelas de avisos, num PR só delas, com a palavra do fundador | `apps/server/database-grants.sql`, `apps/server/migrations/`, `apps/server/src/platform/` (só o teste) | data (D5, D10, D11, D12) | PR 1088 mesclado (as colunas e as tabelas) |
| G6 | U11 A passada inteira no motor | Uma rodada pedida como inteira começa cada fonte do zero, fica marcada, e a fonte que fecha uma passada que leu tudo apaga o que sumiu, também numa cópia incremental | `apps/server/src/hub/copies/`, `apps/server/src/platform/` | data, testing | PR 1088 mesclado (a coluna `whole`) |
| G6 | U12 A segunda linha do relógio | Toda cópia incremental ganha a linha semanal `schedule_<cópia>-whole` (domingo, 04:07, São Paulo), que anda com a normal; ela dispara a passada inteira ou é pulada com outra rodada aberta; ao subir, a cópia antiga ganha a linha que falta | `apps/server/src/builder/copy-clock/`, `apps/server/src/hub/copies/`, `apps/server/src/hub/connectors/` (só um teste), `apps/server/src/main.ts` | testing | U11 |
| G6 | U13 Passada inteira na aba Rodadas | A rota de rodadas devolve `whole`; a linha da rodada mostra "Passada inteira" depois do resultado, no computador e no celular | `packages/hub-api/src/`, `apps/server/src/hub/copies/`, `apps/web/src/hub/copies/` | web | U11 |
| G7 (um PR só do web, emenda de 2026-11-16; depois dele, a QA, testing T25) | U14 O bloco Fontes da tela A | Cada fonte numa linha com a logo, o sistema e a conexão sem repetir, a tabela numa pastilha de código, o estado com ponto e cor, o selo da conexão a reautorizar, a fonte `NOT_GIVEN` só com o sistema, a leitura ao vivo "ao vivo · lido agora, às"; a sala do Builder com o nome e a logo do catálogo; a 390 px, a tabela e o estado na segunda linha | `apps/web/src/builder/conversation/` (`sources.ts`, `sources.tsx`, `connector-words.ts`, `tool-spec.ts`, `connector-specs.ts`, `panel.tsx`, o hook do catálogo e os testes), `apps/web/src/builder/assistant/` (só `connector-names.ts`), `apps/web/src/ui/` (só `block.tsx`), `apps/web/sources.layout.test.ts` | web, design, testing | G3 no `main` (PR 1107, merge `d9f56971`) e o PR 1111 mesclado (`systemText` na porta de `hub/copies/`) |

Oito grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade.

- **A linha principal.** G1, G2, G2b e G3, nesta ordem. G1 muda só o contrato e a conformidade, pela
  issue `contrato`. G2 é da trilha Agentes e Apps (delivery L1): suas pastas são as do Assistente, do
  Builder e da conversa, e a trilha Dados o lê, porque ele muda `packages/hub-api` (delivery L27).
  G2b muda o contrato de G1 pela issue `contrato` e leva no mesmo PR quem o escreve e quem o lê
  (decisão 29); as duas trilhas o leem.
- **Ao lado.** G4, a página da tabela, parte do `main` com o PR 1085 mesclado e não divide pasta
  com os outros grupos. G5 e G6 partem do `main` com o PR 1088 mesclado. G6 não depende de G5,
  porque a passada inteira só usa permissões que já existem (`apps/server/database-grants.sql:406`,
  `:418-421`).
- **Quem corre junto.** Depois de G1, os grupos G2, G4, G5 e G6 correm em paralelo, porque não
  dividem arquivo. G2b espera G2, e G3 espera G2b. Dentro de G3, U5 e U6 correm em paralelo depois de U4. Dentro de
  G4, U8 vem antes de U9.
- **A QA** ([testing T25](../guides/testing.md)) roda depois de G3 e de G4, que têm tela, e anda
  pelo roteiro de uso e pela matriz de estados.
- **A emenda de 2026-11-16.** G7 parte do `main` com G3 e o PR 1111 mesclados; não divide arquivo
  com G4, G5 nem G6. A QA de G7 compara o bloco com a tela A, elemento por elemento.

**Orçamento de código alterado.** Total da etapa: cerca de 1.620 linhas, sem testes nem gerados,
mais as cerca de 120 que a U2b só move de arquivo. Cada unidade tem a sua estimativa abaixo.

- U1: cerca de 30 linhas alteradas (sai mais do que entra), sem testes nem gerados.

G2 é um PR da trilha Agentes e Apps (delivery L1), lido pela trilha Dados por mudar `packages/hub-api` (delivery L27). Não divide arquivo com G1.

- U2: cerca de 320 linhas (`tools.ts` 220, `order.ts` 25, `data-specs.ts` 35, o resto 40).
- U3: cerca de 90 linhas.

G2b é um PR só, do contrato, de quem o escreve e de quem o lê; não divide arquivo com G4, G5 nem G6.

- U2b: cerca de 100 linhas (`tools.ts` 35, `assistant.ts` 10, `company-data.ts` e a conformidade 20, `catalog-systems.ts` 20, `catalog.ts`, `deps.ts` e `public.ts` 5, `catalog-view.ts`, os três chamadores, `app-data-specs.ts` e `tool-registry.ts` 10), mais cerca de 120 movidas de `tool-registry.ts` para `workspace-specs.ts`.

U5 e U6 correm em paralelo depois de U4: dividem a pasta, mas não um arquivo (U5 muda `data-specs.ts`, `tool-spec.ts`, `tool-row.tsx`, `tool-bodies.tsx`; U6 muda `sources.ts`, `sources.tsx`).

- U4: cerca de 70 linhas (`connector-tools.ts` 8, `assistant.ts` 1, `scripts/record.ts` e `scripts/record-calls.ts` 60), sem os ajudantes de teste nem as gravações geradas.
- U5: cerca de 170 linhas (`data-specs.ts` 130, `tool-bodies.tsx` 30, `tool-row.tsx` e `tool-spec.ts` 10).
- U6: cerca de 110 linhas (`sources.ts` 70, `sources.tsx` 40).

U8 e U9 partem de U7 e não dividem arquivo de produção além de `copy-detail.tsx` (U8 troca o painel, U9 passa as colunas à Amostra) e `text.ts`: correm em sequência no mesmo PR, U8 antes de U9.

- U7: ~170 linhas (sem testes nem gerados).
- U8: ~70 linhas.
- U9: ~60 linhas.

- U10: cerca de 25 linhas (sete `GRANT` com o comentário em `database-grants.sql` e as mesmas sete na migração à mão; o `snapshot.json` gerado não conta).

- U11: cerca de 70 linhas.
- U12: cerca de 160 linhas.
- U13: cerca de 25 linhas.

G7 é um PR só do web, sem contrato, tabela, migração nem servidor.

- U14: cerca de 150 linhas (`sources.tsx` 80, `sources.ts` 30, `connector-words.ts`, `tool-spec.ts` e `connector-specs.ts` 15, `panel.tsx` 20, `block.tsx` 5), e perto de 150 de teste.

## Os critérios de aceite

Cada grupo tem a sua faixa de números (G1 de 1 a 9, G2 de 10 a 29, G3 de 30 a 49, G4 de 50 a 69 e de 74 a 79, G5 de 70 a 73, G6 de 80 a 99, G2b de 100 a 109, G7 de 110 a 119), e os números que sobram ficam livres para um critério que a leitura do cartão acrescentar. A faixa de G4 encheu com a conferência no ar do explorador, e G5 só usa 70 a 73. Os critérios 15, 17 e 28 eram de U2 e passam a U2b, que os reescreve (emenda de 2026-11-15). Os critérios 42, 43, 45 e 47 eram de U6 e passam a U14: o 42 é reescrito, e o 43, o 45 e o 47 ganham o desenho da tela A (emenda de 2026-11-16).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O catálogo que `describe` devolve tem só `kind`, `systems` e `tables`: o contrato não exporta `WithheldTable` e nenhuma parte da resposta nomeia a tabela que o papel não lê. Recusa: pôr o nome da tabela escondida em `tables`, no nome de um sistema ou no rótulo de uma leitura faz a lei falhar com "the catalog names the hidden table" | `packages/hub-api/src/company-data.test.ts`, suíte "o contrato sobre um ERP e um correio falsos", lei "uma tabela que o papel não lê não aparece no catálogo e pedir pelo nome responde NOT_IN_CATALOG sem pedir linhas" | must |
| 2 | U1 | `read({ kind: 'TABLE', table })` da tabela escondida responde exatamente `{ kind: 'NOT_IN_CATALOG' }`, a mesma resposta de `nao_existe` (S10), e nenhuma linha é pedida a quem guarda as tabelas (`world.reached.rows` vazio). Recusa: o `read` do contrato, para a tabela escondida | a mesma lei do critério 1, e a lei de hoje "recusa, sem chamar nada, a leitura ou a tabela fora do catálogo e a ação lida como leitura" (`company-data-conformance.ts:198-207`), que dá a mesma resposta a `nao_existe` | must |
| 3 | U1 | A consulta que lê a tabela escondida continua recusada pelo banco: `read({ kind: 'QUERY', sql: world.hidden.query })` responde `{ kind: 'NOT_IN_ROLE' }` sem o campo `rows`. Recusa: o `read` do contrato, pela fonte `query` | `company-data.test.ts`, lei "uma consulta que o banco recusa por permissão responde NOT_IN_ROLE e não devolve linha", agora lendo `world.hidden` | must |
| 4 | U1 | O catálogo do servidor, pela porta `createCompanyData`, responde sem a chave `withheld`: as chaves do `describe` cru, antes de `Catalog.parse`, são `kind`, `systems`, `tables` | `apps/server/src/hub/data/data.test.ts`, caso "descrever na empresa: o dono vê as cópias, o desenvolvedor e o membro não", com uma asserção nova sobre as chaves do `describe` do dono | must |
| 5 | U1 | A conformidade continua com 22 leis no mundo falso (15 de `LAWS`, 2 de `roleLaws`, 5 de `queryLaws`): uma lei sai e uma entra | a saída de `npm test -w @conexus/hub-api`, a suíte "o contrato sobre um ERP e um correio falsos" | should |
| 6 | U1 | Nenhum `withheld` sobra: `git grep -n -i withheld -- packages/hub-api apps/server/src/hub/data scripts/rerun-never.json` não mostra nada, e `scripts/rerun-never.json` traz o nome da lei nova no lugar da antiga | `scripts/rerun-exempt.test.ts` (cruza a lista com os nomes dos testes) e o comando `git grep` no ponto de conferência | should |
| 10 | U2 | `data_describe` e `data_query` chamadas sem `requestContext` falham com o erro da ferramenta de `kind` `NOT_GRANTED`, e nenhuma fonte do contrato é chamada | `apps/server/src/builder/data-tools/tools.test.ts`, "sem requestContext, NOT_GRANTED e nenhuma fonte chamada" | must |
| 11 | U2 | Com `dataOf` devolvendo `undefined` (conversa sem escopo), as duas falham com `NOT_GRANTED` | `tools.test.ts`, "dataOf undefined, NOT_GRANTED" | must |
| 12 | U2 | `data_describe` sem tabela devolve `CATALOG` com cada sistema (nome, conector, leituras) e cada tabela (nome, rótulo, descrição, sistemas, conector, `lastRunEndedAt`, `lastRun`), sem colunas; `lastRunEndedAt` é o `endedAt` de `kept.lastRun`, a última rodada encerrada com qualquer resultado, e é nulo com `lastRun: 'NONE'`; nenhum campo se chama `copiedAt`. A empresa sem sistema nem cópia recebe as duas listas vazias | `tools.test.ts`, "describe sem tabela não traz colunas e traz o conector, a hora do fim e o estado da última rodada" (uma tabela com a última rodada `ERROR`, outra sem rodada) e "o catálogo vazio dá CATALOG com as duas listas vazias" | must |
| 13 | U2 | `data_describe({ table })` de uma tabela do catálogo devolve `TABLE` com as colunas, no máximo 5 linhas, `more: true` quando a página tem mais ou veio cortada, e a origem | `tools.test.ts`, "describe com tabela corta 200 linhas em 5 e diz more" | must |
| 14 | U2 | `data_describe({ table })` de um nome fora de `tables` (inexistente, ou de uma cópia que o lugar não lê) falha com o erro da ferramenta `NOT_IN_CATALOG`, com "No such table in the catalog. Call data_describe with no table to list them." no `reason`, e não pede linha nenhuma à fonte | `tools.test.ts`, "describe de tabela fora do catálogo dá NOT_IN_CATALOG com a frase e não lê linha" | must |
| 15 | U2b | `data_query` devolve `ROWS` com colunas, linhas, `complete` e uma origem por tabela lida, com o nome e o conector de cada fonte tirados do registro gravado da cópia (`kept.sources`), não de `systems`; numa junção, as duas | `tools.test.ts`, "query devolve a origem com o nome gravado e o conector da cópia" | must |
| 16 | U2 | `data_query` cujo plano não nomeia tabela de `sync` devolve as linhas, `origin: []` e a frase "The origin of these rows was not identified: say so." | `tools.test.ts`, "query sem tabela no plano diz que a origem não foi identificada" | must |
| 17 | U2b | Uma tabela é lida como as outras qualquer que seja o estado da sua conexão, e a origem diz o que `kept.sources` traz, sem olhar `systems`: `data_describe` sem tabela a lista, `data_describe({ table })` devolve `TABLE` com as linhas e `data_query` devolve `ROWS`. Uma fonte `NAMED` vira `{ kind: 'NAMED', name, state }`, com o nome gravado e o estado da conexão (`{ kind: 'NAMED', name: 'Loja A', state: 'NEEDS_REAUTH' }`); uma fonte `NOT_GIVEN` vira `{ kind: 'NOT_GIVEN' }`, sem nome nem id; numa cópia de duas conexões com uma `NOT_GIVEN`, `systems` é `[{ kind: 'NAMED', name: 'Loja A', state: 'ACTIVE' }, { kind: 'NOT_GIVEN' }]`. `DESCRIBE_DESCRIPTION` e `QUERY_DESCRIPTION` trazem a frase de U2b sobre o estado e `NOT_GIVEN`. Recusa: nenhum `CATALOG_UNAVAILABLE` por conexão fora de `systems`, nenhum log `DATA_ORIGIN_UNREAD`, e nem o id nem o nome de uma fonte `NOT_GIVEN` aparecem no resultado | `tools.test.ts`, "a conexão à espera de nova autorização: a tabela é lida e a origem diz o nome e o estado", "a fonte não dada ao Projeto: a origem diz só NOT_GIVEN, sem nome", "uma cópia de duas conexões com uma não dada nomeia só a dada" e "as duas descrições dizem o estado da conexão e o que é NOT_GIVEN" | must |
| 18 | U2 | Cada recusa (`QUERY_REFUSED`, `QUERY_TOO_LARGE`, `DEADLINE`, `TABLE_UNAVAILABLE`, `NOT_IN_ROLE`, `NOT_IN_CATALOG`, `CATALOG_UNAVAILABLE`) sai pelo caminho nativo de falha da Mastra, como erro da ferramenta (code C79), com o seu `kind` e a frase ao modelo da tabela de U2 em `reason`; `QUERY_REFUSED` leva o SQLSTATE em `code` e a mensagem inteira do PostgreSQL em `message`. Recusa: nenhuma recusa volta como resultado de sucesso | `tools.test.ts`, "cada recusa sai como erro da ferramenta com a sua frase" (`test.each`, com `assert.rejects` sobre o JSON lançado) | must |
| 19 | U2 | `data_query` com SQL vazio ou acima de 4000 caracteres é recusada pelo esquema de entrada, e a fonte `query` não é chamada | `tools.test.ts`, "o SQL vazio ou acima de 4000 caracteres é recusado pelo esquema" | must |
| 20 | U2 | O conjunto fechado do Builder e o da tela são o mesmo e contêm `data_describe` e `data_query`; tirar os nomes de `READ` quebra a igualdade | `apps/server/src/builder/conversation/permissions.test.ts`, "a tela e o Builder nomeiam o mesmo conjunto fechado" | must |
| 21 | U2 | Um arquivo de `builder/data-tools/` que importe `hub/connectors/public.ts` é recusado pelo verificador; a pasta não está na lista de migração | `scripts/rules-doors.test.ts`, o caso `BAD` de `agents-and-apps-reach-data-only-through-the-contract` | must |
| 22 | U2 | Na conversa, `data_describe` e `data_query` têm frase de rodando, feito e falha | `apps/web/src/builder/conversation/tool-row.test.tsx`, "cada ferramenta do conjunto fechado e do Assistente tem frase e abre no corpo da tabela (Critério 8)" | must |
| 28 | U2b | Uma tabela copiada de duas conexões traz na origem as duas, na ordem de `kept.sources`: `data_describe({ table })` e `data_query` dizem `systems: [{ kind: 'NAMED', name: 'Loja A', state: 'ACTIVE' }, { kind: 'NAMED', name: 'Loja B', state: 'ACTIVE' }]`; o catálogo traz as mesmas duas na tabela | `tools.test.ts`, "uma cópia de duas conexões nomeia as duas na origem" | must |
| 23 | U3 | O Assistente, o Builder e o agente salvo oferecem `data_describe` e `data_query` ao modelo com a mesma descrição e o mesmo esquema | `apps/server/src/builder/data-tools/mounted.test.ts`, "o Assistente, o Builder e o agente salvo oferecem data_describe e data_query com a mesma descrição e o mesmo esquema" | must |
| 24 | U3 | O Construtor não oferece nenhuma das duas | `mounted.test.ts`, "o Construtor não oferece data_describe nem data_query" | must |
| 25 | U3 | As instruções dos três trazem `## Company data`, também o Builder num Projeto sem cópia liberada | `mounted.test.ts`, "a ordem do agente está nas instruções dos três, também num Projeto sem cópia" | must |
| 26 | U3 | O bloco "## Data" do Builder, num Projeto com cópia liberada, manda ver colunas e linhas com `data_describe` e não diz mais "see a few rows with `app_data_read`" | `mounted.test.ts`, "o bloco de dados do Builder não manda ver linhas com app_data_read" | must |
| 27 | U3 | Pela porta da raiz, o lugar decide o catálogo: o dono no Início chamando `data_describe` recebe a cópia da empresa; o Builder e o agente salvo do Projeto recebem só a cópia liberada a ele | `mounted.test.ts`, "data_describe responde o catálogo do lugar: o Início lista a cópia da empresa, o Projeto só a liberada" | must |
| 29 | U3 | O agente salvo do Projeto, usado por um membro que não é o seu autor, lê com o escopo de quem usa (`run.scope.personId`, `apps/server/src/builder/agents/agent.ts:178`): recebe a mesma cópia liberada ao Projeto que o autor recebe, e nenhuma outra cópia da empresa. Nesta etapa o papel não muda o catálogo do Projeto (a leitura por papel é a etapa 2) | `mounted.test.ts`, "o agente salvo usado por um membro lê o catálogo do Projeto, como o autor" | must |
| 100 | U2b | Pela porta da raiz, no Início, com a conexão da cópia em `NEEDS_REAUTH`, o dono recebe de `data_describe` a tabela na lista com `systems: [{ kind: 'NAMED', name: 'Matriz', state: 'NEEDS_REAUTH' }]`, e `data_query` sobre ela devolve `ROWS` com as linhas da cópia e a mesma origem: o nome gravado e o estado, nunca só o conector | `mounted.test.ts`, "no Início, a conexão à espera de nova autorização: a tabela é lida, e a origem diz o nome e o estado" (o caso de hoje em `:160-170`, reescrito) | must |
| 101 | U2b | Num Projeto que não recebeu a conexão (a Filial do mundo de teste) e tem a cópia dela liberada, o Builder recebe a tabela de `data_describe` com `systems: [{ kind: 'NOT_GIVEN' }]` e o conector `sankhya`; o resultado nunca contém "Filial". Recusa: o nome da conexão não sai num lugar que não a recebeu | `mounted.test.ts`, "o Projeto que não recebeu a conexão lê a cópia liberada e a origem diz só o conector" | must |
| 102 | U2b | O arquivo das recusas das ferramentas de dado volta a se chamar `tools-refusals.test.ts` e está em `scripts/rerun-never.json`; `scripts/rerun-exempt.test.ts` passa e falha sem a linha (testing T4) | `scripts/rerun-exempt.test.ts`, o caso de `:36-46` | must |
| 103 | U2b | `DATA_SPECS` entra em `TOOLS` ao lado de `APP_DATA_SPECS`, que volta a ter só as duas ferramentas do dado do app; `tool-registry.ts` fica abaixo de 300 linhas sem as vazias, e as linhas da conversa não mudam | `apps/web/src/builder/conversation/tool-row.test.tsx`, o caso de `:185`; `npm run check` (Biome, `noExcessiveLinesPerFile`) | should |
| 104 | U2b | O catálogo que o servidor monta para cada lugar (`createCompanyData`, `describe`) leva em `kept.sources` o nome, o conector e o estado de cada conexão: no Início, toda fonte é `NAMED`, também a de uma conexão em `NEEDS_REAUTH`; no catálogo de um Projeto, a fonte de uma conexão que o Projeto recebeu é `NAMED`, em qualquer estado, e a de uma que ele não recebeu é `{ kind: 'NOT_GIVEN', connector }`. Recusa: o catálogo de um Projeto nunca traz o nome de uma conexão que ele não recebeu | `apps/server/src/hub/data/data.test.ts`, caso novo "o catálogo do lugar diz o estado da conexão, e o do Projeto não nomeia a conexão que ele não recebeu" | must |

| 30 | U4 | Uma leitura ao vivo que responde OK, por `connector_read` ou por uma leitura tipada, devolve ao modelo `at`, uma data ISO entre o antes e o depois da chamada, com e sem resposta inteira guardada na máquina. Recusa: uma leitura recusada (`REAUTH`, `REFUSED`, `READ_FAILED`, `NOT_GRANTED`) não ganha `at` | `apps/server/src/builder/connectors/connector-tools-scope.test.ts`, caso novo "uma leitura OK leva a hora em que voltou", com e sem `whole`, e o caso de recusa | must |
| 31 | U4 | `npm run record -- data-query` e `npm run record -- reads` gravam `apps/server/src/platform/recordings/mastra/data-query.jsonl` e `reads.jsonl` com o cabeçalho `@mastra/core` 1.82.0 e `source` `test-anthropic-stream.ts`, sem endereço nem credencial; `data-query` guarda `data_describe`, `data_describe({ table })`, `data_query` e a resposta, cada uma com o resultado real das ferramentas (`CATALOG`, `TABLE` e `ROWS` com `origin`). Recusa: uma gravação de `data-query` ou de `reads` com outra versão da Mastra, ou um `data-query` sem os três resultados, faz o caso falhar. As outras gravações, hoje em 1.79.0, não entram nesta conferência de versão | `apps/server/src/platform/recordings.test.ts`, caso novo "as gravações desta etapa são da Mastra instalada e guardam o resultado das ferramentas de dado" (a versão lida do `package.json` de `@mastra/core` comparada à do cabeçalho de `data-query` e de `reads`; os três `kind` lidos nas partes de `data-query`), e o caso de hoje com `data-query` em `NATIVE` e `STREAMED`; `apps/server/src/builder/assistant/numbers.test.ts` passa com `reads` regravado | must |
| 32 | U4 | As seis perguntas do dado copiado (c1 a c6) têm cada uma a tabela da origem e o número esperado, calculados no teste pela função do dublê e pela consulta como dono no banco de teste, e os dois batem; as 27 do fundador continuam 27. Recusa: um número escrito à mão no teste | `apps/server/src/builder/assistant/assistant.scorecard.test.ts`, caso "as perguntas do dado copiado: cada uma com tabela, número e origem esperados, calculados do dublê" | must |
| 33 | U4 | O placar julga certo um turno do Assistente que chama `data_query` e responde com o número lido e a tabela de `origin` esperada; julga errado o turno que lê o sistema ao vivo (`connector_read`) e o que cita outra tabela na origem (`sankhya_clientes` para c1). Recusa: `judgedCopy` devolve falso | `assistant.scorecard.test.ts`, caso "o placar do dado copiado julga certo um turno que consulta e cita a origem, e errado um que lê o sistema ao vivo", pelo Assistente de `assisting` com o dublê de modelo (testing T28) | must |
| 34 | U4 | `CATALOG`, `TABLE` e `ROWS` de uma ferramenta de dado não contam como erro no placar (`errors` 0), porque o placar conta a falha pela regra do `noToolErrors` e reconhece o sucesso pela forma `DataResult`, sem nome de ferramenta, e "Quanto pagamos de comissão?" (c4) é certa com prosa que nomeia uma tabela que existe e nenhuma chamada em erro. Recusa: um turno de c4 com um número, ou com uma recusa, é julgado errado | `assistant.scorecard.test.ts`, caso "não achei é resposta" | must |
| 35 | U4 | O caso do modelo real das perguntas do dado copiado pula sem `CONEXUS_EVAL_REAL_MODEL`, com a razão começando por `opt-in:`; com a variável, grava um JSON por pergunta na pasta dela | `assistant.scorecard.test.ts`, caso "o modelo de verdade, as perguntas do dado copiado" | should |
| 36 | U5 | `data_describe` sem tabela diz "Consultando o catálogo" enquanto roda e "Consultou o catálogo" depois, com "5 tabelas" ao lado ("1 tabela" no singular). Recusa: com a chamada em erro ou negada, diz "Não conseguiu ler o catálogo agora." | `apps/web/src/builder/conversation/data-specs.test.tsx`, caso "o catálogo: Consultou o catálogo, 5 tabelas" | must |
| 37 | U5 | `data_describe({ table })` diz "Vendo sankhya_vendas" enquanto roda e "Viu sankhya_vendas" depois, com "5 linhas, há mais" quando a amostra tem `more`. Recusa: `NOT_IN_CATALOG` diz "Essa tabela não está no catálogo.", também para a tabela que o papel não lê (item (d): ela responde como uma que não existe) | `data-specs.test.tsx`, casos "a amostra: Viu sankhya_vendas, 5 linhas, há mais" e "cada recusa diz o seu texto" | must |
| 38 | U5 | `data_query` diz "Consultando os dados" enquanto roda e "Consultou sankhya_vendas" depois, com "1 linha" ("n linhas", ", há mais" quando `complete` é falso); duas tabelas na origem aparecem juntas, separadas por vírgula. Recusa: um resultado fora do esquema dá "Consultou os dados", sem detalhe | `data-specs.test.tsx`, casos "rodando: Consultando os dados", "a consulta: Consultou sankhya_vendas, 1 linha", "um resultado fora do esquema dá a linha genérica" | must |
| 39 | U5 | A linha nasce recolhida; aberta, a de `data_query` mostra a consulta inteira e o botão **Copiar a consulta**; tocá-lo põe o texto inteiro na área de transferência e o botão passa a "Consulta copiada". Recusa: sem área de transferência, ou com a escrita recusada, a linha mostra "Não deu para copiar. Selecione a consulta e copie." e o console registra `QUERY_NOT_COPIED` | `data-specs.test.tsx`, casos "aberta, a linha mostra a consulta e Copiar a consulta põe o texto na área de transferência" (com uma consulta de 1.200 caracteres, acima do corte de 800 de `shown`) e "a cópia recusada diz para selecionar" | must |
| 40 | U5 | Cada recusa de ferramenta de dado, lançada como erro da ferramenta e lida por `thrownOf`, diz o seu texto (`NOT_IN_ROLE`, `TABLE_UNAVAILABLE`, `CATALOG_UNAVAILABLE`, `QUERY_REFUSED`, `QUERY_TOO_LARGE`, `DEADLINE`, `NOT_IN_CATALOG`, `NOT_GRANTED`), e a linha fica em estado de erro. `NOT_IN_ROLE`, a consulta que o banco recusou com `42501`, diz "Essa tabela não está no catálogo.", o texto de `NOT_IN_CATALOG`: nenhum texto nomeia papel nem confirma que a tabela existe. Recusa: um `kind` fora da lista, ou um erro que não é o JSON lançado pelas ferramentas, cai na linha genérica, nunca num texto de outra recusa | `data-specs.test.tsx`, casos "cada recusa diz o seu texto" (`test.each` sobre `REFUSED_TEXT`, com a parte em erro) e "a consulta recusada pelo banco diz que a tabela não está no catálogo" | must |
| 41 | U5 | Na conversa do Builder (`BUILDER_ROOM`) as duas ferramentas têm as mesmas linhas e o mesmo corpo | `data-specs.test.tsx`, caso "na sala do Builder, as mesmas linhas" | must |
| 42 | U14 | A fonte de cópia mostra numa linha a logo do conector (`ConnectorLogo small`), "Sankhya · Matriz" (o sistema e a conexão, sem repetir quando são iguais, por `systemText`), a tabela `sankhya_vendas` em `font-mono` sobre `bg-surface-3` e "copiado hoje às 08:45". Recusa: nunca "Sankhya · Sankhya", e nenhuma fonte sem a logo quando o catálogo tem o conector | `apps/web/src/builder/conversation/sources.test.tsx`, casos "a fonte do dado: a logo, Sankhya · Matriz, a tabela e copiado hoje às 08:45" e "a conexão com o nome do sistema não se repete na fonte de cópia" | must |
| 43 | U14 | A rodada parcial diz "rodada parcial, copiado hoje às 08:45"; a rodada com erro ou interrompida diz "parada hoje às 08:45", com a hora do fim dessa rodada; sem rodada (`lastRun: 'NONE'`), "ainda sem cópia"; outro dia, "copiado ontem às", "copiado em 17/10/2026 às" ou "parada ontem às". O estado é um carimbo (`Stamp`, V35), como a tela A: a cópia em dia tem as palavras em `text-2` e só o ponto em `success`; "ainda sem cópia", as palavras em `text-2` e o ponto em `line-strong`; a parcial pinta palavras e ponto em `warning`, a parada em `danger`. Recusa: com `ERROR` ou `INTERRUPTED` nunca "copiado", porque a hora é de uma rodada que não copiou; nenhum estado só em cor; a cópia em dia nunca com as palavras verdes | `sources.test.tsx`, casos "a cópia em dia: as palavras em text-2 e o ponto em success", "a rodada parcial diz rodada parcial, em warning", "a rodada com erro ou interrompida diz parada, em danger, e nunca copiado", "sem rodada diz ainda sem cópia, com o ponto neutro", "outro dia diz ontem ou a data" | must |
| 44 | U6 | A mesma tabela lida duas vezes no turno aparece uma vez; as páginas da web citadas continuam como hoje | `sources.test.tsx`, caso "a mesma tabela lida duas vezes aparece uma vez" e o caso de web de hoje com `kind: 'web'` | must |
| 45 | U14 | A leitura ao vivo mostra a logo, o sistema e a conexão sem repetir, a operação na pastilha e o carimbo "ao vivo · lido agora, às HH:MM", com as palavras em `text-2` e só o ponto em `success`, no dia do `at` gravado; aberta noutro dia, a mesma fonte diz "ao vivo · lido ontem às HH:MM" ou "ao vivo · lido em 17/10/2026 às HH:MM", pelo mesmo dia da fonte de cópia. Recusa: uma leitura ao vivo sem `at` (gravação de antes da U4) não vira fonte, e "agora" nunca aparece noutro dia | `sources.test.tsx`, casos "a fonte da leitura ao vivo diz ao vivo · lido agora, às" com `reads` regravado, "a leitura ao vivo de uma conexão com o nome do sistema não o repete" (do PR 1111) e "a leitura ao vivo vista noutro dia diz o dia" (o relógio no dia seguinte ao `at`) | must |
| 46 | U6 | Um resultado de ferramenta de dado fora do esquema não vira fonte, e nenhuma chamada em erro vira fonte | `sources.test.tsx`, caso "um resultado fora do esquema não vira fonte" | must |
| 47 | U14 | A fonte de dado cabe a 390 px e a 1280 px, nos dois temas, sem passar da largura da tela. A 1280 px, a logo, o nome, a pastilha e o carimbo ficam numa linha só, com o carimbo na ponta direita; a 390 px, a pastilha e o carimbo descem para a segunda linha, alinhados ao começo do nome; o carimbo que não cabe desce inteiro a uma terceira linha, no começo da linha da fonte. Recusa: nem o carimbo nem o selo quebram no meio | `apps/web/sources.layout.test.ts`, caso "a fonte do dado" (testing T23), que mede a posição da pastilha e do nome nas duas larguras e nos dois temas | must |
| 110 | U14 | A fonte com a conexão em `NEEDS_REAUTH` mostra, depois do nome, o selo `danger` de `stateBadge`: "Chaves recusadas" num conector de chaves, "Pede para conectar de novo" num OAuth. Recusa: a conexão `ACTIVE` não mostra selo, nem "Funcionando" | `sources.test.tsx`, casos "a conexão à espera de nova autorização mostra o selo de Integrações" (os dois tipos de autenticação) e "a conexão ativa não mostra selo" | must |
| 111 | U14 | A fonte `NOT_GIVEN` mostra a logo e só o sistema ("Sankhya"); numa cópia de duas conexões com uma `NOT_GIVEN`, só o nome da dada. Recusa: nem o id nem um nome no lugar da não dada | `sources.test.tsx`, casos "a fonte não dada ao Projeto mostra só o sistema e a logo" e "uma cópia de duas conexões com uma não dada nomeia só a dada" | must |
| 112 | U14 | Na conversa do Builder, a fonte tem o nome ("Sankhya", não "sankhya") e a logo da conversa do Assistente, pelo catálogo de conectores; as recusas de conector do Builder continuam "Não conseguiu ler o sistema da empresa.". Recusa: com o catálogo não lido ou falho, o conector pelo id e sem logo, sem erro na tela | `apps/web/src/builder/conversation/panel.test.tsx`, casos novos "na conversa do Builder, a fonte tem o nome e a logo do catálogo" (a conversa do Projeto aberta pela porta da tela, com a mensagem de `data-query` e a lista de conexões respondida) e "sem o catálogo, a fonte do Builder nomeia o conector pelo id", e o caso de hoje da recusa de conector no Builder; `apps/web/sources.layout.test.ts`, caso "a fonte do dado", que abre a conversa do Projeto e lê "Sankhya · Matriz" | must |
| 113 | U14 | Duas fontes na mesma resposta são duas linhas, cada uma com a sua logo, com uma linha fina entre elas e outra acima de "Fontes"; cada linha tem pelo menos 32 px. Recusa: duas fontes nunca na mesma linha | `sources.test.tsx`, caso "duas fontes são duas linhas, cada uma com a sua logo"; `sources.layout.test.ts`, "a fonte do dado" (as linhas finas e a altura) | must |
| 50 | U7 | Em `/companies/<c>/data/<id>`, a navegação "Caminho" tem os links "Dados" e "{sistema}" e o nome da tabela em texto; os dois links levam a `/data` sem `layer` e com o `q` do endereço; nenhum dos dois tem `aria-current`. O link "← Dados" de hoje não existe mais | `copy-detail.test.tsx`, "o caminho" e "o caminho leva a busca" | must |
| 51 | U7 | O topo mostra o nome da tabela como título, o estado, **Rodar agora** e o menu da cópia, como hoje; a frase "{sistema} · a cada {intervalo}" não aparece | `copy-detail.test.tsx`, "o caminho leva a Dados" (o antigo `:47-52`) e "as rodadas…" (`:15-45`, ajustado) | must |
| 52 | U7 | Com a última rodada COMPLETE ou PARTIAL, a linha abaixo do título diz "Copiada do {sistema} em {dia e hora do fim} · {linhas} linhas" | `copy-detail.test.tsx`, "a linha da cópia: a hora do fim da rodada e as linhas" | must |
| 53 | U7 | Com uma rodada aberta, ERROR ou INTERRUPTED, a linha diz exatamente "{sistema} · {linhas} linhas"; "Copiada" não aparece (recusa: nenhuma hora de rodada que não copiou) | `copy-detail.test.tsx`, "a linha da cópia sem hora quando a rodada não copiou" | must |
| 54 | U7 | Sem rodada nenhuma, a linha diz "{sistema} · a primeira rodada ainda não terminou"; com rodada e sem linhas (`rows` nulo), só "{sistema}" | `copy-detail.test.tsx`, "a linha da cópia sem rodada e sem linhas" | must |
| 55 | U7 | As abas, nesta ordem, têm os nomes "Visão geral", "Colunas {n}", "Amostra" e "Rodadas"; o desenvolvedor não vê "Amostra" | `copy-detail.test.tsx`, "as abas na ordem, com a contagem de colunas"; `copy-sample.test.tsx`, "o desenvolvedor não vê a aba Amostra" | must |
| 56 | U7 | Sem `tab`, com `tab` desconhecido, ou com `?tab=sample` para o desenvolvedor, a aba aberta é Visão geral; `?tab=columns` (link antigo) abre Colunas | `copy-detail.test.tsx`, "a tabela abre na Visão geral" e "a aba fica no endereço"; `copy-sample.test.tsx`, "o desenvolvedor que abre ?tab=sample cai na Visão geral" | must |
| 57 | U7 | A Visão geral mostra a descrição, Ligação, Chave (em mono) e Modo; "Leitura de origem" com o rótulo só quando a origem é `OPERATION`; numa cópia da versão 1 (`QUERY`) a linha não aparece | `copy-detail.test.tsx`, "a tabela abre na Visão geral" e "a Visão geral de uma leitura da versão 2 diz a leitura de origem" | must |
| 58 | U7 | Sem descrição na definição, a Visão geral diz "Sem descrição." | `copy-detail.test.tsx`, "sem descrição, a frase de vazio" | must |
| 59 | U7 | O aviso de coluna inativa fica acima das abas também na Visão geral; a marca "Inativa desde …" fica na aba Colunas | `copy-detail.test.tsx`, "a coluna inativa: o aviso no topo e a marca na coluna" (ajustado) | must |
| 60 | U7 | A página da tabela, na Visão geral, em Colunas e em Amostra, a 1366, 390 e 320 px e nos dois temas, não rola de lado e cada parada do Tab tem o contorno | `sweep.test.ts`, os estados "A tabela, a visão geral", "A tabela, as colunas com uma inativa" e "A tabela, a amostra" de `sweep-table-states.ts` | must |
| 61 | U8 | O complementar "Detalhes" mostra, nesta ordem, Sistema com o nome do sistema, Frequência "A cada 30 min", Última rodada "Completa · {dia e hora}", Linhas "118.402" e a frase "Só os nomes e as descrições ficam no Hub. As linhas ficam na cópia, no banco da empresa." | `copy-detail.test.tsx`, "o painel Detalhes" | must |
| 62 | U8 | A hora da Última rodada é a mesma da linha da cópia (o fim da rodada, nunca o começo) | `copy-detail.test.tsx`, "o painel e a linha da cópia dizem a mesma hora" | must |
| 63 | U8 | O painel não mostra Ligação, Chave, Modo nem Camada; "Camada" não aparece em lugar nenhum da página (recusa) | `copy-detail.test.tsx`, "o painel Detalhes" | must |
| 64 | U8 | Com a rodada aberta, a Última rodada diz só "Rodando…"; sem agendamento, a Frequência é "—" | `copy-detail.test.tsx`, "a última rodada de um painel com a rodada aberta não diz hora" e "sem agendamento, a frequência é um traço" | must |
| 65 | U8 | O painel vem depois das abas na ordem do documento, e abaixo delas abaixo de 768 px | `copy-detail.test.tsx`, "o painel vem depois das abas"; `sweep.test.ts` a 390 e 320 px (critério 60) | should |
| 66 | U9 | Na Amostra, cada coluna da definição com tipo conhecido tem, antes do nome em mono, um ícone com o tipo em palavras como nome acessível ("Número", "Texto"…) | `copy-sample.test.tsx`, "a amostra mostra o tipo de cada coluna" | must |
| 67 | U9 | Uma coluna da amostra fora da definição, ou com um tipo sem ícone, fica só com o nome; nenhum ícone sem nome (recusa) | `copy-sample.test.tsx`, "uma coluna fora da definição fica só com o nome" | must |
| 68 | U9 | A primeira célula de cada linha da Amostra é o número da linha, 1 a 5; o cabeçalho dela tem o nome "Linha" só para leitor de tela | `copy-sample.test.tsx`, "o número da linha" | must |
| 69 | U9 | As frases "Cinco linhas da cópia.", "A cópia tem mais linhas que estas cinco." e "A cópia ainda não tem linhas." continuam, e a falha da amostra tem "Tentar de novo" | `copy-sample.test.tsx`, os casos de hoje (`:10-17`, `:19-24`, `:32-36`, `:38-52`) | must |
| 74 | U7 | Na lista de Dados, o cabeçalho do grupo não repete o nome: uma ligação com o mesmo nome do sistema não aparece ("Mercado Livre · 1 tabela", nunca "Mercado Livre · Mercado Livre · 1 tabela"); as ligações de outro nome continuam ("Mercado Livre · Loja A, Loja B · 1 tabela") | `apps/web/src/hub/copies/copy-list.test.tsx`, caso novo "a ligação com o nome do sistema não se repete no cabeçalho do grupo" e o caso de hoje "a origem da cópia" | must |
| 75 | U9 | A 1366 px, na Amostra de uma tabela de 11 colunas, a grade rola na horizontal dentro da sua própria caixa (`table-container`), a página não rola de lado, a caixa termina antes do painel Detalhes, e rolada até o fim a última coluna aparece inteira dentro da caixa | `apps/web/tables.layout.test.ts`, caso novo "a amostra larga rola dentro da sua caixa e o painel Detalhes não a corta, a 1366px", sobre o estado "A tabela, a amostra larga" de `sweep-table-states.ts` | must |
| 70 | U10 | O banco depois de `migrate` tem exatamente as permissões de `database-grants.sql`, com as sete linhas novas. Uma migração sem uma delas, ou com uma a mais, é recusada pelo instantâneo | `apps/server/src/platform/catalog.test.ts`, `'o instantâneo depois de migrate é o de database-grants.sql'` | must |
| 71 | U10 | O login do Hub executa cada verbo novo sem `42501`: `UPDATE` de `system_status`, `system_code` e `system_message` em `copies.copy_run`; `SELECT`, `INSERT` e `DELETE` em `notifications.alert_recipient` e `notifications.copy_follower`; `SELECT`, `INSERT` e `UPDATE(read_at)` em `notifications.copy_notice` | `catalog.test.ts`, caso novo `'o login do Hub tem os verbos dos avisos de cópia'` (cada instrução sobre zero linhas, `WHERE false`) | must |
| 72 | U10 | O login do Hub recebe `42501` no que fica de fora: `UPDATE` de `whole` em `copy_run`; `UPDATE` de qualquer coluna de `alert_recipient` e de `copy_follower`; `DELETE` de `copy_notice`; `UPDATE` de `copy_name`, `code` ou `run_id` de `copy_notice` | `catalog.test.ts`, os casos novos da lista `REFUSED` (`'o login do Hub recebe 42501 em …'`) | must |
| 73 | U10 | O PR muda só `database-grants.sql`, a migração à mão (com o seu `snapshot.json`) e `catalog.test.ts`; nenhum outro arquivo | revisão do diff (`git diff --stat` no PR); `npm run migrations -- --base origin/main` | must |
| 80 | U11 | Numa cópia incremental sem janela (`clientes`), um parceiro que sumiu da origem continua na cópia depois de uma rodada normal e sai depois de uma rodada inteira; as outras linhas ficam | `apps/server/src/hub/copies/run.test.ts`, `'a passada inteira apaga o que sumiu numa cópia incremental'` | must |
| 81 | U11 | Uma rodada inteira pedida no meio de uma passada começa do zero: nenhuma linha que existe na origem sai, e o número de linhas é o de antes | `run.test.ts`, `'a passada inteira começa do zero mesmo no meio de uma passada'` | must |
| 82 | U11 | Uma rodada inteira recusada pelo sistema termina `ERROR` e não apaga nada; a rodada normal seguinte relê tudo e apaga o que sumiu | `run.test.ts`, `'a passada inteira que falha não apaga'` | must |
| 83 | U11 | Uma passada inteira que não cabe numa rodada termina `PARTIAL` sem apagar; a rodada seguinte continua de onde parou e apaga só quando a fonte fecha | `run.test.ts`, `'a passada inteira que não cabe numa rodada continua na seguinte'` | must |
| 84 | U11 | A rodada inteira fica com `whole = true` em `copies.copy_run`; a normal, com `false` | `run.test.ts`, `'a rodada inteira fica marcada'` | must |
| 85 | U11 | Numa rodada normal de uma cópia com janela, o apagar da janela não muda: sai o que sumiu dentro da janela, fica o que está fora | `run.test.ts`, `'a janela apaga o que sumiu'` (de hoje, sem mudança) | must |
| 86 | U12 | Ligar uma cópia incremental cria duas linhas no agendador: a normal e `schedule_<cópia>-whole`, esta com cron `7 4 * * 0`, fuso `America/Sao_Paulo`, `inputData.whole === true` e `active` | `apps/server/src/builder/copy-clock/clock.test.ts`, `'a linha semanal anda com a cópia'` | must |
| 87 | U12 | Uma cópia sem data de alteração não tem linha semanal: mudar o intervalo dela pela rota deixa só a normal | `clock.test.ts`, `'a cópia que relê tudo não tem linha semanal'` | must |
| 88 | U12 | Pausar pela rota pausa as duas linhas; retomar retoma as duas; apagar a cópia pela rota não deixa nenhuma | `clock.test.ts`, `'a linha semanal anda com a cópia'` | must |
| 89 | U12 | `GET` das cópias devolve uma entrada por cópia, com o estado e o próximo horário da linha normal, mesmo com as duas linhas | `clock.test.ts`, `'a lista de cópias mostra uma entrada por cópia'` | must |
| 90 | U12 | Quando a linha semanal dispara sem rodada aberta, nasce uma rodada com `whole = true` | `clock.test.ts`, `'a linha semanal dispara a passada inteira'` | must |
| 91 | U12 | Quando a linha semanal dispara com outra rodada aberta, nenhuma rodada nasce, e o processo imprime `COPY_WHOLE_PASS_SKIPPED` com `companyId` e `copyId` | `clock.test.ts`, `'a linha semanal com uma rodada aberta é pulada'` | must |
| 92 | U12 | Ao subir, a cópia incremental sem linha semanal ganha a linha, no estado da normal (pausada se a normal está pausada), sem mudar o próximo horário da normal; rodar de novo não muda nada. O programa chama o passe ao subir: o processo imprime `COPY_WHOLE_LINES` uma vez | `clock.test.ts`, `'ao subir, a cópia antiga ganha a linha semanal'`; `apps/server/src/main.test.ts`, caso novo `'ao subir, o Hub passa as linhas semanais'` | must |
| 93 | U12 | Uma cópia que sumiu leva as duas linhas quando qualquer uma dispara | `clock.test.ts`, `'a cópia que sumiu leva as duas linhas'` | must |
| 94 | U12 | Apagar a empresa, desligar a conexão e apagar a cópia levam as duas linhas de cada cópia; com o agendador calado, as duas ficam e o processo imprime `COPY_SCHEDULE_LEFT` | `clock.test.ts` `'a empresa apagada leva as agendas'`, `apps/server/src/hub/copies/delete.test.ts` (os dois casos que contam agendas), `apps/server/src/hub/connectors/unlink-copies.test.ts` (o caso de `:115-122`), com as contagens dobradas | must |
| 95 | U12 | Se a linha semanal não nasce ao ligar, a rota responde a falha e a normal não existe; repetir o mesmo pedido cria as duas e dispara uma primeira rodada só | `clock.test.ts`, `'a linha semanal que falha ao nascer não perde a primeira rodada'` | must |
| 98 | U11 | Uma rodada inteira pedida no meio de uma passada apaga também a linha que a passada interrompida gravou e que depois sumiu da origem, quando a passada inteira fecha | `run.test.ts`, `'a passada inteira no meio de uma passada apaga o que a passada interrompida gravou e sumiu'` | must |
| 96 | U13 |
 Na aba Rodadas, uma rodada inteira mostra "Passada inteira" depois do resultado, em `text-2`, no computador e no celular; uma rodada normal não mostra | `apps/web/src/hub/copies/copy-detail.test.tsx`, `'as rodadas: a passada inteira aparece ao lado do resultado'` | must |
| 97 | U13 | `GET` das rodadas devolve `whole: true` na rodada inteira e `whole: false` na normal | `apps/server/src/hub/copies/routes.test.ts`, `'as rodadas dizem qual foi inteira'` | must |

## A matriz de estados

Cada grupo traz as suas telas e os campos de contrato que cria. Os desenhos de caixas a 1280 e 390 px
seguem os protótipos da proposta aprovada e da spec (`p3-01` a `p3-07`, `v10`, `a1` a `a5`, `b4`).
Esses protótipos e as capturas das referências ficam fora do repositório (delivery L21). Não há
captura do produto antigo: nenhuma destas telas existia nele.

### G1

Sem tela.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Catalog.tables` (agora o único dono do que o papel lê, C26) | `catalogOf`, `apps/server/src/hub/data/catalog.ts:17-22` | `sourceOf` e `queried` do contrato (`company-data.ts:257-273`, `:280-300`); as ferramentas da parte 3, grupo 3 (`listed`, `tabled`) |
| `DataWorld.hidden` (`{ table, query }`, troca `withheld`) | o mundo falso (`company-data.test.ts`); depois o mundo real da parte 3, grupo 6 | as duas leis de `roleLaws` |
| `Catalog.withheld` e `WithheldTable` | saem | ninguém fora do contrato e da conformidade (`git grep` em `5d02e643`) |

### G2

G2 não cria tela. A linha completa, o corpo e o bloco Fontes (tela `p3-02` da proposta) são de G3.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de `data_describe` na conversa (mínima) | nasce recolhida | "Consultou o catálogo" | "Consultando o catálogo" | "Não conseguiu ler o catálogo agora." | linha genérica de falha | linha genérica de falha | linha genérica de falha |
| Linha de `data_query` na conversa (mínima) | nasce recolhida | "Consultou os dados" | "Consultando os dados" | "Não conseguiu ler a tabela agora." | linha genérica de falha | linha genérica de falha | linha genérica de falha |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `DATA_TOOL.describe`, `DATA_TOOL.query` | U2, `packages/hub-api/src/tools.ts` | U3 (os três agentes), `permissions.ts`, a tela (`RowTool`, `TOOLS`) |
| `DESCRIBE_SAMPLE_ROWS` | U2, `packages/hub-api/src/tools.ts` | `data_describe` (U2); G3 (o texto "5 linhas, há mais") |
| `DataOrigin` (`systems`, `connector`, `table`, `lastRunEndedAt`, `lastRun`) e `DataResult` (`CATALOG`, `TABLE`, `ROWS`), esquemas Zod | U2, `packages/hub-api/src/assistant.ts`, ao lado de `ReadCut` (code C26); U2b troca `systems` por uma lista de `DataSystem` | `data-tools/tools.ts` (o tipo do resultado, por `z.infer`); o modelo; G3 (`presentDescribe`, `presentQuery`, `sourcesOf`) |
| `DataSystem` (`NAMED` com `name` e `state`, ou `NOT_GIVEN`) | U2b, `packages/hub-api/src/assistant.ts`, ao lado de `DataOrigin` | o modelo; `sourcesOf` (U6), na chave sem repetição |
| `TableKept.sources` (`KeptSource[]`: `NAMED` com a conexão de `CopySource` e o estado, ou `NOT_GIVEN` com o conector; no lugar de `connections`) | U2b; escreve `catalogTables` (`apps/server/src/hub/copies/catalog-view.ts:37-53`), com o que o lugar nomeia, dado por `catalogOf` (`apps/server/src/hub/data/catalog.ts:7-30`) | `keeps` (`packages/hub-api/src/company-data.ts:234-242`), a conformidade, `data-tools/tools.ts` |
| `catalogSources` (o estado de cada conexão que o lugar nomeia) | U2b, `apps/server/src/hub/connectors/catalog-systems.ts`, ao lado de `catalogSystemsOf` | `catalogOf`, pela porta `connectors()` de `DataDeps` |
| O erro lançado de cada recusa (`kind`, `status`, `code`, `message`, `body`, `reason`) | U2 | o modelo; G3 (`thrownOf`) |
| `DataOf` | U2 | U3 (cada agente o implementa) |
| `ConversationsDeps.companyData` | U3, `main.ts` | U3, os três agentes |

### G3

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Linha de `data_describe` sem tabela (`p3-02`, `p3-07`) | Como qualquer turno: a linha aparece no primeiro uso | "Consultou o catálogo" e "0 tabelas"; o agente diz em prosa que não há tabela (`p3-03`, sem peça nova) | "Consultando o catálogo" | "Não conseguiu ler o catálogo agora." (erro ou negada) e "Não conseguiu ler a tabela agora." (`CATALOG_UNAVAILABLE`), critérios 36 e 40 | não se aplica (sem tabela pedida) | `NOT_GRANTED`: "Esta ligação não está disponível nesta conversa." | resultado fora do esquema: "Consultou o catálogo" sem detalhe |
| Linha de `data_describe({ table })` (`p3-02`, `p3-07`) | igual | "Viu sankhya_vendas" e "Nenhuma linha." | "Vendo sankhya_vendas" | "Não conseguiu ler a tabela agora." (`TABLE_UNAVAILABLE`, `p3-06`) | "Essa tabela não está no catálogo." (também a tabela escondida, critério 37) | `NOT_GRANTED` como acima | fora do esquema: "Viu <tabela>" sem detalhe |
| Linha de `data_query` (`p3-02`, `p3-06`, `p3-07`) | igual; aberta, a consulta e **Copiar a consulta** | "Consultou sankhya_vendas" e "Nenhuma linha." | "Consultando os dados" | "A consulta não rodou.", "A consulta trouxe dados demais.", "A consulta demorou demais.", "Não conseguiu ler a tabela agora." (critério 40); cópia recusada: "Não deu para copiar. Selecione a consulta e copie." (critério 39) | "Essa tabela não está no catálogo." | "Essa tabela não está no catálogo." (`NOT_IN_ROLE`: o banco recusou com `42501`; nenhum texto nomeia papel, critério 40) | fora do esquema: "Consultou os dados" sem detalhe (critério 38) |
| Bloco Fontes, fonte de dado (`p3-01`, `p3-04`) | aparece na primeira resposta que leu uma tabela | resposta sem leitura de dado: nenhum bloco (como hoje) | enquanto a ferramenta roda, nenhuma fonte: a fonte nasce do resultado | recusa: nenhuma fonte (critério 46) | `NOT_IN_CATALOG`: nenhuma fonte | `NOT_IN_ROLE`: nenhuma fonte; a tabela escondida nunca é nomeada | "rodada parcial", "parada", "ainda sem cópia" (critério 43) |
| Bloco Fontes, fonte ao vivo (`p3-05`) | primeira leitura ao vivo do turno | sem leitura ao vivo: nenhuma fonte | enquanto lê, nenhuma fonte | leitura recusada: nenhuma fonte | não se aplica | `REAUTH`/`REFUSED`: nenhuma fonte | sem `at` (gravação antiga): nenhuma fonte (critério 45) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `at` do resultado OK de `readOn` | `readOn`, `apps/server/src/builder/connectors/connector-tools.ts:218-235` (U4) | `sourcesOf` (U6) pela `LiveResult`; o modelo ignora |
| `ReadCut.at` (opcional, `packages/hub-api/src/assistant.ts:85-91`) | o esquema (U4) | `LiveResult` de `sources.ts` (U6), que o exige |
| `origin[]` de `ROWS` (`systems`, `connector`, `table`, `lastRunEndedAt`, `lastRun`) | `data_query` (U2) | `presentQuery` (U5), `sourcesOf` (U6), `judgedCopy` (U4) |
| `origin` de `TABLE` | `data_describe({ table })` (U2) | `sourcesOf` (U6) |
| `sample.rows`, `sample.more` de `TABLE` | `data_describe({ table })` (U2) | `presentDescribe` (U5) |
| `tables` de `CATALOG` | `data_describe()` (U2) | `presentDescribe` (U5), a contagem |
| `kind` do erro lançado pelas ferramentas de dado | U2 | `thrownOf` e `REFUSED_TEXT` (U5), `failed` do placar (U4) |
| `args.sql` de `data_query` | o modelo | o corpo `query` (U5) |
| `MessageSource` `kind: 'data'` (`connector`, `system`, `table`, `at`, `state`) | `sourcesOf` (U6) | `Sources` (U6); `system` também na chave sem repetição |
| `CopyQuestion` (`n`, `text`, `asks`, `tables`, `truth`, `partial`, `released`) | `COPY_QUESTIONS` (U4) | `assistant.scorecard.test.ts` e `judgedCopy` (U4) |

Desenho de caixas, a resposta com a fonte e a linha aberta (sala do Assistente; o Builder igual):

```
1280 px
+-- rail --+---------------------------- conversa (coluna de leitura) -----------------------------+
|          | Quanto vendi em outubro?                                                  hoje, 08:51  |
|          | Assistente                                                                             |
|          |  [db] Consultou o catálogo                                         5 tabelas    >      |
|          |  [db] Viu sankhya_vendas                                    5 linhas, há mais   >      |
|          |  [db] Consultou sankhya_vendas                                       1 linha    v      |
|          |      +-------------------------------------------------------------------------+       |
|          |      | select sum("VLRNOTA") as total from sync.sankhya_vendas where ...       |       |
|          |      +-------------------------------------------------------------------------+       |
|          |      [Copiar a consulta]                                                               |
|          | Em outubro de 2026 a Padaria Sol vendeu **R$ 24.560,70**, de sankhya_vendas.           |
|          | ────────────────────────────────────────────────────────────────────────────────────── |
|          | Fontes                                                                                 |
|          |  [logo] Sankhya · Matriz  [sankhya_vendas]                     ● copiado hoje às 08:45  |
+----------+----------------------------------------------------------------------------------------+

390 px
+------------------------------------+
| Quanto vendi em outubro?           |
| Assistente                         |
| [db] Consultou o catálogo          |
|      5 tabelas                   > |
| [db] Consultou sankhya_vendas      |
|      1 linha                     v |
|  +------------------------------+  |
|  | select sum("VLRNOTA") as     |  |
|  | total from sync.sankhya_...  |  |
|  +------------------------------+  |
|  [Copiar a consulta]               |
| Em outubro ... **R$ 24.560,70**    |
| ────────────────────────────────── |
| Fontes                             |
| [logo] Sankhya · Matriz            |
|        [sankhya_vendas]            |
|        ● copiado hoje às 08:45     |
+------------------------------------+
```

O bloco Fontes deste desenho é o da emenda de 2026-11-16 (a tela A, U14); a caixa de 390 px é
estreita demais para o desenho, e na tela a pastilha e o carimbo ficam na mesma segunda linha. O
desenho fiel e a matriz dos seus estados estão em G7.

As telas do protótipo que a unidade segue: `p3-01` (Resposta com origem), `p3-02` (Como cheguei), `p3-04` (Cópia atrasada), `p3-05` (Ao vivo), `p3-06` (O banco não respondeu) e `p3-07` (O Construtor) do escopo aprovado da camada de dados, seção 5. As frases vêm da spec (parte 3, `design.md`, `C5`), que o fundador aprovou depois do protótipo; onde o protótipo diz outra coisa, a spec vale, e a diferença está nas notas para a palavra dele.

### G4

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Página da tabela, topo e abas (U7) | sem rodada: a linha "{sistema} · a primeira rodada ainda não terminou" (54) | sem linhas: a linha só "{sistema}" (54) | o `Skeleton` de hoje no conteúdo; a árvore à esquerda já desenhada | a leitura das rodadas ou das conexões falhou: `ReadFailure` no conteúdo, como hoje (`copy-detail.tsx:134-143`) | uma cópia que não existe ou um id inválido: `NotFound` com "Voltar ao início", como hoje | o membro: o endereço é não encontrado e o rail não tem Dados (`manageCopiesOrNotFound`, no `main`, `public.ts:24-26`); o desenvolvedor não tem a aba Amostra (55) | rodada aberta, ERROR ou INTERRUPTED: a linha sem hora e o estado diz "Rodando…" ou "Com erro" (53); pausada: "Pausada" no estado |
| Aba Visão geral (U7) | a cópia da versão 1 sem descrição: "Sem descrição." (58) | idem | não tem leitura própria | não tem leitura própria | — | idem | origem `QUERY`: sem a linha Leitura de origem (57) |
| Painel Detalhes (U8) | sem rodada: Última rodada "—" | sem linhas: Linhas "—"; sem agendamento: Frequência "—" (64) | junto do topo | junto do topo | — | idem | rodada aberta: só "Rodando…" (64); ERROR: a frase do código e a hora do fim |
| Aba Amostra (U9) | — | "A cópia ainda não tem linhas." (69) | `Skeleton`, como hoje | `ReadFailure` com "Tentar de novo" (69) | — | o desenvolvedor não tem a aba, e `?tab=sample` cai na Visão geral (56) | coluna fora da definição: só o nome (67) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `CopySummary.run` (`outcome.kind`, `endedAt`): "The open run, else the last" (`packages/hub-api/src/copies.ts:79-80`, no `main`) | o servidor, `listCopyRuns` (`apps/server/src/hub/copies/routes.ts`) | `copiedText` (U7), `lastRunText` (U8), `StateBadge` |
| `CopySummary.rows`: "After the last complete pass" (`copies.ts:81-82`) | o servidor | `copiedText` (U7), o painel (U8) |
| `CopySummary.interval` | o servidor | `frequencyText` (U8); a linha "a cada" de hoje sai (U7) |
| `CopySummary.sources[].connection` (`name`, `connector`) | o servidor | a Visão geral, Ligação (U7); o logo e o nome do sistema no topo e no painel (U7, U8) |
| `CopySummary.mode` | o servidor | a Visão geral, Modo (U7) |
| `CopyShown.description`, `key`, `source` (`OPERATION` com `label`) (`packages/hub-api/src/copy-shown.ts:12-31`) | o servidor, da definição guardada | a Visão geral (U7) |
| `CopyShown.columns[]` (`name`, `type`) (`copy-shown.ts:32-40`) | o servidor | a contagem do gatilho Colunas (U7); `ColumnTypeIcon` (U9) |
| `CopySample.columns`, `rows` (`packages/hub-api/src/connection-copies.ts:40`) | o servidor, `sampleCopy` | `CopySample` (U9) |
| O `tab` do endereço, agora com `overview` | o `onValueChange` das abas (`copy-detail.tsx:200-208`) e o link "Ver a rodada" | `TableSearch` (`search.ts`), `CopyDetail` |
| O `q` do endereço na rota da tabela | a busca da árvore (no head do PR 1085 (`689ece4a`), `data-tree.tsx`) | a rota `data.$copyId.tsx`, que o passa a `CopyDetail`; os dois links do caminho (U7) |

**A página da tabela a 1280 px** (o rail, a árvore do grupo 1 e a área principal; a tela a1 do kit da spec 3, e a `v10` da proposta aprovada sem as partes que esperam):

```
┌──┬───────────────┬──────────────────────────────────────────────┬───────────────┐
│▣ │[⌕ Buscar …   ]│ Dados › Sankhya › sankhya_vendas             │               │
│⌂ │ Negócio     0 │ [logo] sankhya_vendas ● Em dia   [↻ Rodar agora] [⋯]          │
│▤ │ Bruto       7 │ Copiada do Sankhya em 14/11/2026, 08:45 · 2.184 linhas        │
│⏚ │ ▾ Sankhya   5 │ (aviso de coluna inativa, quando há)                          │
│◷ │ ▌vendas 2.184 │ Visão geral │ Colunas 22 │ Amostra │ Rodadas                  │
│▦◀│  clientes …   ├──────────────────────────────────────────────┬───────────────┤
│  │ ▸ Mercado L 2 │ As notas de venda emitidas no Sankhya…       │ Detalhes      │
│  │ Apps          │ Ligação          Chave                       │ Sistema       │
│  │               │ Matriz           NUNOTA                      │ [l] Sankhya   │
│  │               │ Modo             Leitura de origem           │ Frequência    │
│  │               │ só o alterado    Notas de venda              │ Última rodada │
│  │               │                                              │ Linhas        │
│  │               │                                              │ ───────────── │
│  │               │                                              │ Só os nomes…  │
└──┴───────────────┴──────────────────────────────────────────────┴───────────────┘
```

**A 390 px** (o rail e a árvore na gaveta, design V56; o painel abaixo das abas):

```
┌──────────────────────────────┐
│ [☰] Lume Acabamentos         │
├──────────────────────────────┤
│ Dados › Sankhya › sankhya_…  │
│ [logo] sankhya_vendas        │
│ ● Em dia  [↻ Rodar agora][⋯] │
│ Copiada do Sankhya em        │
│ 14/11/2026, 08:45 · 2.184 …  │
│ Visão geral│Colunas 22│Amos… │  ← a varredura a 320 px decide (U7, Parar se)
│ As notas de venda…           │
│ Ligação / Matriz             │
│ Chave / NUNOTA               │
│ Modo / só o alterado         │
│ Leitura de origem / Notas…   │
│ Detalhes                     │
│ Sistema · Frequência ·       │
│ Última rodada · Linhas       │
│ Só os nomes e as descrições… │
└──────────────────────────────┘
```

A tela que segue: a `v10` da proposta aprovada ("Tabela, amostra"), sem Perguntar ao Assistente, Qualidade, Quem lê, o nome de negócio, Conceito, Descrições e "lida com o seu papel"; a Visão geral, que a `v10` não desenhou, segue a tela a1 do kit da spec 3. Não há produto antigo para esta tela.

### G5

Sem tela.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| Permissão `UPDATE(system_status, system_code, system_message)` em `copies.copy_run` | U10 (`database-grants.sql` e migração) | `ended` em `run.ts`, quando a etapa 2 levar a mensagem do sistema (item (b), grupo 4) |
| Permissão `SELECT, INSERT, DELETE` em `notifications.alert_recipient` | U10 | as rotas da lista da empresa (etapa 3, item (b), grupo 5) |
| Permissão `SELECT, INSERT, DELETE` em `notifications.copy_follower` | U10 | Seguir e o aviso (etapa 3, item (b), grupos 5 e 6) |
| Permissão `SELECT, INSERT, UPDATE(read_at)` em `notifications.copy_notice` | U10 | o aviso e o sino (etapa 3, item (b), grupo 6) |

### G6

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Aba Rodadas, a linha da rodada (U13) | sem mudança: `NO_RUNS_YET` | sem mudança | sem mudança | sem mudança | sem mudança | sem mudança (`readCopies`) | a rodada inteira que falhou mostra a frase da falha e "Passada inteira" |

Desenho a 1280 px (a linha da rodada; o resto da página não muda):

```
| Quando            | Duração    | Lidas | Gravadas | Resultado                    |
| 15/11/2026, 04:07 | 4 min 51 s | 2.179 |    2.179 | Completa · Passada inteira   |
|                   |            |       |          |          '--- text-2 ---'    |
```

Desenho a 390 px (a linha do celular):

```
+--------------------------------------+
| 15/11/2026, 04:07 · 4 min 51 s       |
| 2.179 lidas · 2.179 gravadas ·       |
| Completa · Passada inteira  (text-2) |
+--------------------------------------+
```

Protótipo: tela `b2-rodadas-inteira` do kit do item (b) da spec 3.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `copies.copy_run.whole` | U11, o `INSERT` de `claim` | U13 (`runOf`); a ferramenta `copy_runs` (etapa 2) |
| `CopyRun.whole` (`packages/hub-api/src/copies.ts`) | U13 (`runOf`) | `RunRow` e `RunPhoneRow` (U13) |
| `CopyInput.whole` (`inputData` da linha) | U12 (`clock.ts`, a linha semanal) | o passo `run` do workflow (U12) e `states` (U12, para pular a linha) |
| Entrada `whole` de `service.run` e `runCopy` | o passo `run` (U12); `on.run` nos testes (U11) | `claim` (U11) |
| `readAll` de `closePass` | `sourcePass` (U11) | `closePass` em `copy-sql.ts` (U11) |

### G7

A tela A do bloco Fontes, aprovada pelo fundador em 2026-11-16, fica fora do repositório, como
`p3-01` (delivery L21); o desenho abaixo a descreve. As palavras são as de hoje; muda a forma.

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bloco Fontes, fonte de cópia (U14) | logo, nome, pastilha, carimbo (42) | "ainda sem cópia" (43); sem leitura de dado, nenhum bloco | catálogo não lido: o id, sem logo (112) | catálogo falho: igual (112); recusa: nenhuma fonte (46) | nenhuma fonte | `NOT_GIVEN`: só o sistema (111); `NOT_IN_ROLE`: nenhuma fonte | parcial `warning`, parada `danger` (43); `NEEDS_REAUTH`: o selo (110) |
| Bloco Fontes, fonte ao vivo (U14) | logo, nome, operação na pastilha, "ao vivo · lido agora, às" (45) | nenhuma fonte | nenhuma fonte | nenhuma fonte | não se aplica | `REAUTH`/`REFUSED`: nenhuma fonte | sem `at`: nenhuma; outro dia: "ao vivo · lido ontem às" (45) |

Desenho dos estados a 1280 px, um estado por linha, com o tom à direita fora da tela (a coluna de
leitura; uma linha fina sobre "Fontes"; cada fonte numa linha de 32 px; `[...]` é a pastilha de
código em `surface-3`; `●` é o ponto de 6 px na cor do carimbo; `(…)` é o selo):

```
────────────────────────────────────────────────────────────────────────────────
Fontes
[logo] Sankhya · Matriz  [sankhya_vendas]                  ● copiado hoje às 08:45     success
[logo] Sankhya  [consultar]                       ● ao vivo · lido agora, às 00:37     success
[logo] Sankhya · Matriz  [sankhya_vendas]   ● rodada parcial, copiado hoje às 08:45    warning
[logo] Sankhya · Matriz  [sankhya_vendas]                    ● parada hoje às 08:45    danger
[logo] Sankhya · Matriz (● Chaves recusadas)  [sankhya_vendas]  ● copiado ontem às 22:30  selo danger
[logo] Sankhya  [sankhya_vendas]                            ● copiado hoje às 08:45    NOT_GIVEN
[logo] Sankhya · Matriz  [sankhya_vendas]                            ● ainda sem cópia  line-strong
```

Duas fontes na mesma resposta são duas linhas, cada uma com a sua logo:

```
Fontes
[logo] Mercado Livre · Loja oficial  [mercado_livre_pedidos]       ● copiado hoje às 08:30
────────────────────────────────────────────────────────────────────────────────
[logo] Sankhya · Matriz  [sankhya_notas]                          ● parada ontem às 22:30
```

A 390 px, a pastilha e o carimbo descem para a segunda linha, alinhados ao nome; o carimbo que não
cabe desce inteiro à terceira, no começo da fonte:

```
──────────────────────────────────────────────
Fontes
[logo] Sankhya · Matriz
       [sankhya_vendas] ● copiado hoje às 08:45
──────────────────────────────────────────────
[logo] Sankhya · Matriz (● Chaves recusadas)
       [sankhya_vendas] ● copiado ontem às 22:30
──────────────────────────────────────────────
[logo] Sankhya · Matriz
       [sankhya_vendas]
● rodada parcial, copiado hoje às 08:45
```

| Elemento da tela A | Classe ou peça no Hub |
| --- | --- |
| Linha fina acima e "Fontes" em 600 | `border-t border-line pt-sm` na seção; o `h3` de hoje (`font-semibold text-text`) |
| Linha da fonte | `li` com `flex flex-wrap items-center gap-x-sm min-h-8`; linha fina entre duas fontes (`border-t border-line` do segundo em diante) |
| Logo | `ConnectorLogo small` (20/14 px) |
| Sistema e conexão | `text-label font-medium text-text` |
| Selo | `Badge` com o `tone` e o texto de `stateBadge` |
| Tabela | `font-mono text-fact text-text`, `rounded-control bg-surface-3 px-xs`, quebra em qualquer ponto |
| Carimbo | `Stamp` na ponta direita (`ml-auto`) a partir de `sm`; cópia em dia e ao vivo: `text-text-2` e o ponto em `success`; neutro: o ponto em `line-strong`; parcial e parada: o tom inteiro (decisão 33) |
| 390 px | um quebrador `basis-full` abaixo de `sm` antes da pastilha; a pastilha com a margem da logo mais o espaço (`ml-7`) |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `MessageSource` `kind: 'data'` (`connector`, `connections`, `reauth`, `table`, `at`, `state`): `connections` troca a `system` juntada por vírgula | `sourcesOf` (U14), de `DataOrigin.systems` e do `args.connection` da leitura ao vivo | `Sources` (U14); `keyOf`, na chave sem repetição |
| `ConnectorWords.logo(connector)` e `ConnectorWords.auth(connector)` | `wordsOf` (U14); `PLAIN_WORDS` responde `undefined` e `'oauth2_code'` | `Sources` (U14); `useConnectorCatalog().logo`, que passa a ser `words.logo` |
| O `Room` do Builder com o nome e a logo do catálogo; `refusal` fica a de `PLAIN_WORDS` | `BuilderChat` em `panel.tsx` (U14), por `useConnectorCatalog` | as linhas da conversa do Projeto (`useRoom().connectors`) |

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `data_describe` (comando de leitura, sem gravação) | Independentes: não dividem estado | O `abortSignal` vai a `describe` e a `read`; nada a desfazer | O banco do Hub calado: `CATALOG_UNAVAILABLE`; o banco da empresa calado: `TABLE_UNAVAILABLE`; a conexão da cópia fora de `systems`: a tabela é lida, com a fonte que `kept` traz, `NAMED` com o estado ou `NOT_GIVEN` (U2b) | nada novo: a ferramenta não registra a conexão fora de `systems`, que é estado normal (U2b tira o `DATA_ORIGIN_UNREAD` de U2) | 14, 17, 18, 100, 101 |
| `data_query` (comando de leitura, uma transação só de leitura da fonte do `main`) | Duas transações só de leitura | O sinal vai a `read` e a `describe`; o prazo vira `DEADLINE` | Banco da empresa calado: `TABLE_UNAVAILABLE`, sem leitura ao vivo no lugar; Hub calado: `CATALOG_UNAVAILABLE`; a conexão da cópia fora de `systems`: as linhas voltam, com a fonte que `kept` traz (U2b) | `DATA_QUERY_FAILED`, `DATA_READ_REFUSED`, `DATA_PLAN_UNREAD` já vêm da fonte (`apps/server/src/hub/data/query.ts:88`) | 15, 16, 17, 18, 19, 100 |
| `npm run record -- data-query` (U4) | os dois escrevem o mesmo `data-query.jsonl`; o roteiro é fixo, e o último a terminar fica, igual ao outro salvo a data | uma chamada de modelo a mais que `DATA_QUERY_CALLS` lança e nada é escrito; o arquivo antigo fica | nenhuma rede: `fetch` a outro endereço lança "The recording reaches no other address" | o erro, com código de saída diferente de zero | 31 |
| `npm run record -- reads` (U4) | igual | igual, com `READS_CALLS` | igual | igual | 31 |
| `saveWhole` da leitura ao vivo, agora com `at` no corte (U4, gravação de hoje) | cada leitura tem o seu caminho na máquina, como hoje | o arquivo que não se grava dá `saved: false` com `at` no corte, como hoje | a máquina fora: a resposta volta sem arquivo e com `at` | a linha de log de hoje de `saveWhole` | 30 |
| JSON do placar do modelo real (U4, `pergunta-c<n>.json` na pasta de `CONEXUS_EVAL_REAL_MODEL`) | um arquivo por pergunta; duas rodadas na mesma pasta sobrescrevem | o teste falha na pergunta e os arquivos anteriores ficam | o modelo fora: a pergunta conta errada, sem parar a lista | `placar em <pasta>` | 35 |
| `navigator.clipboard.writeText` de **Copiar a consulta** (U5) | dois toques escrevem o mesmo texto | a promessa recusada vira `FAILED`: o texto de `L4` ao lado e `QUERY_NOT_COPIED` no console | sem `navigator.clipboard` (contexto inseguro): o mesmo `FAILED`, sem lançar | `console.error('QUERY_NOT_COPIED', causa)` | 39 |
| A migração à mão (`migrate`) | o `migrate` é um só processo antes do Hub (data D9); um `GRANT` repetido não muda nada | a migração roda numa transação: um `GRANT` recusado desfaz os sete e o `migrate` para | banco fora: o `migrate` falha e o Hub não sobe, como hoje (data D9) | a falha do `migrate` de hoje, com o nome da migração | 70 |
| `wholePasses` (zera o ponto de partida e a posição e soma um a `pass`) e o `INSERT` da rodada com `whole`, em `claim` | a trava de `claim` deixa uma só; a outra vê `RUNNING` | a transação de `claim` desfaz tudo: nada zerado, nenhuma rodada | banco do Hub fora: o passo falha como hoje, sem rodada | o que `claim` imprime hoje | 81, 84, 91, 98 |
| `closePass` com `readAll` (o `DELETE` de `_pass`) | só quem segura a trava chega aqui | o `DELETE`, o `UPDATE` do nome e a contagem vão num só envio (`copy-sql.ts:280-284`); recusado, nada sai e a rodada termina `COPY_DATABASE_UNAVAILABLE` | banco da empresa fora: o mesmo; o `watermark` fica nulo e a próxima relê tudo | `COPY_RUN_ENDED` com o código | 80, 82, 83 |
| `schedules.create` da linha semanal (`set`, `ensureWhole`) | o `create` que perde a corrida lê a linha de novo e segue, como `clock.ts:77-81` | a semanal nasce antes da normal: se falha, a normal não existe, e a repetição de Ligar ainda vê `CREATED` | storage do Mastra fora: `databaseFailure` como hoje; a rota responde a falha | a falha da rota de hoje | 86, 95 |
| `pause` e `resume` das duas linhas | o Mastra devolve a linha como está quando já está no estado (`schedules-D8PrAbVN.js:666-699`) | a normal muda e a semanal falha: a rota responde a falha; repetir converge | o mesmo | a falha da rota de hoje | 88 |
| `remove` das duas linhas (apagar, desligar, empresa apagada, `GONE`) | `delete` de um id que não existe volta sem erro (`:660-665`) | a semanal sai primeiro; se a normal falha, `releaseCopies`, que acha a cópia pela normal, tenta de novo | agendador calado: as duas ficam | `COPY_SCHEDULE_LEFT` (de hoje) | 93, 94 |
| `ensureWholeLines` ao subir | dois Hubs ao mesmo tempo: o `create` perdido é tratado como em `set` | uma empresa que falha não para as outras | banco do Hub fora: a empresa falha | `COPY_WHOLE_LINES_FAILED` com `companyId` e `code`; `COPY_WHOLE_LINES` uma vez no fim, com `companies` e `count` | 92 |
| A linha semanal disparada com a trava ocupada | — | — | — | `COPY_WHOLE_PASS_SKIPPED` com `companyId` e `copyId` | 91 |

Sem linha nesta tabela, porque não acrescentam gravação nem comando: U1 (tira um campo de resposta montado em memória), U3 (liga as ferramentas aos agentes), U6 e U14 (só leem o resultado guardado e a lista de conexões, que já existe), U7, U8 e U9 (só leem `listCopyRuns`, `listConnections` e `sampleCopy`, que já existem; **Rodar agora** e o menu da cópia ficam como estão) e U13 (lê `whole` na rota de rodadas).


## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O catálogo esconde a tabela que o papel não lê | U1 | `WithheldTable` e `Catalog.withheld`, `packages/hub-api/src/company-data.ts:60-70`; `withheld: []` em `apps/server/src/hub/data/catalog.ts:23` | Mesma situação: a lista de tabelas que o agente recebe, filtrada pela permissão de quem pergunta. A plataforma de ingestão de referência, página de permissões do servidor MCP (documentado); a plataforma de dados com catálogo e linhagem, o `information_schema` (documentado); estudo de referência (fora do repositório, delivery L21), seção "O que cada referência faz no mesmo ponto" do item (d) | Quem não tem permissão não vê o recurso; a listagem devolve só as tabelas acessíveis; o esquema de informação filtra pelo privilégio de quem lê. Nenhuma marca de "existe e você não lê" | nativo | — | `tables` é a lista inteira; a segunda lista sai (C26) | nenhum |
| O nome pedido responde como inexistente | U1 | `sourceOf`, `company-data.ts:259` (`NOT_IN_ROLE`) | Mesma situação: pedir pelo nome uma tabela inacessível. A plataforma de ingestão de referência, a mesma página (documentado): a prévia da tabela volta erro e a listagem deixa de incluí-la | Erro igual ao de uma tabela fora da lista | nativo | — | o `NOT_IN_CATALOG` de hoje, `company-data.ts:260-261` | nenhum |
| A consulta recusada pelo banco | U1 (só a lei, que fica) | `pageOf`, `apps/server/src/hub/data/query.ts:106-109` (`42501` vira `NOT_IN_ROLE`) | Mesma situação: SQL que cita uma tabela inacessível. A plataforma de ingestão de referência (documentado): erro aplicado pelo controle de acesso da nuvem, não pela leitura do SQL; PostgreSQL 18, SQLSTATE `42501` | O banco recusa | nativo | — | sem mudança no servidor | nenhum |
| A lei da tabela escondida | U1 | `keepsWithheldTableOut`, `packages/hub-api/src/company-data-role-conformance.ts:8-21` | Molde: a lei vizinha `refusesReadOutsideCatalog` (`company-data-conformance.ts:198-207`) e `bb03b122` (#1072), ao contrário | — | nativo | — | uma lei sai e uma entra; a conta fica em 22 | nenhum |
| As duas ferramentas | U2 | `apps/server/src/builder/app-data/tools.ts:65-86`, `apps/server/src/builder/connectors/typed-reads.ts:97-126` | O modelo oficial de agente SQL do Mastra 1.82 (`text-to-sql`, `introspect-database.ts:7-54`, `execute-sql.ts:14-44`): mesma situação. A plataforma de dados com catálogo e linhagem dá colunas, 5 linhas e depois a consulta (estudo de referência, fora do repositório, delivery L21, conferência P3.2; documentado) | Uma ferramenta inspeciona, outra executa; `createTool` com `inputSchema` Zod e `execute(input, context)` (`@mastra/core@1.82.0 dist/docs/references/reference-tools-create-tool.md:93-109`) | nativo | — | Igual. Diferente do modelo: quem recusa é o banco, e a ferramenta lança a recusa pelo caminho nativo de falha da Mastra (`TOOL_EXECUTION_FAILED`, `@mastra/core@1.82.0 dist/utils-BcF5eERx.js:1116-1125`), na forma que `refuse()` já lança (`apps/server/src/builder/agents/tools.ts:68-75`) e que `thrownOf` lê na tela (`apps/web/src/builder/conversation/connector-specs.ts:181-201`) (code C79) | `apps/server/src/builder/data-tools/tools.ts` |
| Os nomes no dono único | U2 | `APP_DATA_TOOL`, `BUILDER_TOOL`, `CLOSED_TOOLS` em `packages/hub-api/src/tools.ts:40-68` | O Mastra Code fecha o conjunto num lugar (`mastracode/sdk/src/index.ts:858,1331`, citado em `permissions.ts:55-56`): mesma situação | Uma constante; o fecho e a tela a herdam | nativo | — | code C26 | — |
| A origem de cada tabela | U2, U2b | `TableKept.connections` só com o id (`packages/hub-api/src/company-data.ts:34-42`); `catalogTables` lê o nome e o conector de cada fonte e os descarta (`apps/server/src/hub/copies/catalog-view.ts:24-57`); `catalogOf` monta o catálogo por lugar (`apps/server/src/hub/data/catalog.ts:7-30`); a ferramenta liga cada id a `systems` e recusa ou tira a tabela sem par (`apps/server/src/builder/data-tools/tools.ts:81-112`, `:136-141`); a página da tabela já diz a origem por `CopySource` (`packages/hub-api/src/copy-shown.ts:5-9`, `apps/web/src/hub/copies/copy-facts.tsx:75-77`) | Situação parecida, com três diferenças. Nossa situação: uma tabela já copiada cuja conexão espera nova autorização, ou que o Projeto não recebeu. A plataforma de ingestão de referência foi testada ao vivo com a fonte ativa, desativada e arquivada (visto), e a sua página de permissões (documentado); diferença 1: ela não testou uma credencial vencida, e a tabela estava vazia, então não provou que as linhas antigas ficam. A plataforma de dados com catálogo e linhagem tem os privilégios de tabela e de conexão como objetos separados (visto) e a tabela de streaming legível sem acesso à fonte (documentado); diferença 2: essa fonte é do próprio catálogo, não uma conexão com credencial vencida. Diferença 3: "quem lê não tem a conexão" foi provado só na forma (o formulário do token) e na documentação, e ninguém rodou o caso. A mesma plataforma mostra as tabelas usadas no passo da consulta (conferência P3.6; documentado). Estudos de referência do critério 17, fora do repositório (delivery L21) | A tabela é recurso próprio, com permissão própria, e a conexão governa só a ingestão: a tabela continua no catálogo e consultável com a fonte inativa, e a tela da tabela continua dizendo a origem pelo registro gravado da fonte e o estado dela; as tabelas usadas saem do motor de consulta | nativo (o `EXPLAIN` da fonte; a origem pelo `CopySource` que já tem dono) | — | A origem vem de `kept.sources`, que o catálogo de cada lugar monta: `NAMED` com o nome gravado e o estado, ou `NOT_GIVEN` só com o conector no Projeto que não recebeu a conexão (decisão 28); nenhuma recusa nem log. A referência mostra o identificador da fonte, não o nome dado pela pessoa; a conexão do Conexus não tem identificador legível (o id é um UUID, que nunca é nome, security S41), e o nome gravado é o que a pessoa vê na página da tabela; por isso dizemos o nome onde o lugar recebeu a conexão. As três diferenças não mudam o veredito: o que elas deixam sem prova (as linhas antigas ficam legíveis) o Conexus prova nos critérios 100 e 101 | — |
| A recusa com frase ao modelo | U2 | `NOT_GRANTED` e as frases em `apps/server/src/builder/connectors/connector-tools.ts:58`, `:171-186`; `refuse()` em `apps/server/src/builder/agents/tools.ts:68-75` | A plataforma de ingestão de referência devolve o erro com uma explicação provável (estudo de referência, conferência P3.10; documentado) | O texto do motor e uma frase do que fazer | nativo (o SQLSTATE e a mensagem do Postgres, lançados como erro da ferramenta) | — | o JSON de `refuse()` com `reason` a mais; a issue 1016 leva as leituras ao vivo ao mesmo caminho. U2b troca a frase de `NOT_IN_ROLE`, que manda listar o catálogo | — |
| A pasta fora da lista de migração | U2 | `AGENTS_AND_APPS` e `CONTRACT_MIGRATION` em `.dependency-cruiser.cjs:21-56`; `BAD` em `scripts/rules-doors.test.ts:20-33` | nenhuma: regra de engenharia nossa (conferência P3.13) | — | nativo (o `forbidden` do dependency-cruiser) | — | A pasta entra em `AGENTS_AND_APPS` e não na lista | — |
| A linha mínima na conversa | U2, U2b | `APP_DATA_SPECS` em `apps/web/src/builder/conversation/app-data-specs.ts:23-45`, com `...DATA_SPECS` dentro (`:25`); `TOOLS` em `tool-registry.ts:47`, `:202` | O Factory do Mastra 1.82, uma linha por chamada (`mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:152`, `docs/reference/stack.md:20`): mesma situação | Uma linha por parte de ferramenta | nativo | — | Só o mínimo; G3 completa. U2b devolve `DATA_SPECS` a `TOOLS`, dividindo `tool-registry.ts` | `apps/web/src/builder/conversation/data-specs.ts` |
| A ordem do agente | U2, U3 | `HOW_TO_READ` em `apps/server/src/builder/app-data/context.ts:19-25` | A plataforma de dados com catálogo e linhagem ensina buscar, ver 5 linhas, consultar com `LIMIT`, e "não achei" é resposta (estudo de referência, conferência P3.2 e P3.11; documentado) | Texto nas instruções | nativo (texto) | — | Um texto, três agentes | `apps/server/src/builder/data-tools/order.ts` |
| A porta na raiz | U3 | `doorOf` em `apps/server/src/conversations-of.ts:34-48`, `:186`; `connectors: () => connectors` em `main.ts:162` | nenhuma de fora | A chamada tardia de `send` (`main.ts:155`) | nativo | — | Um só `createCompanyData`, o de `main.ts:205` | — |
| A montagem nos três agentes | U3 | `tools` dinâmico em `assistant.ts:235-250`, `builder.ts:140-156`, `agent.ts:280-302` | `tools` como função da requisição (`@mastra/core@1.82.0 dist/agent/types.d.ts:673-675`): mesma situação | `DynamicArgument<ToolsInput>` | nativo | — | — | — |
| A ferramenta dentro do modo código | U3 | `codeModeOf(ofTheAgent, …)` em `agent.ts:290` | `createCodeMode` chama `execute` com `requestContext` e `abortSignal`, sem `agent` (`@mastra/core@1.82.0 dist/tools-BVDic2bB.js:478-485`) | — | nativo | — | Aceito: o agente salvo numa máquina chama as duas do programa | — |
| A hora da leitura ao vivo | U4 | `readOn` devolve o corte sem hora, `connector-tools.ts:218-235` | Mastra 1.82, mesma situação: o resultado da ferramenta é guardado na mensagem (`@mastra/core@1.82.0 dist/docs/references/reference-storage-overview.md:54`, a parte `tool-invocation`) | o que a tela precisa ler depois vai no resultado da chamada | nativo (o resultado da ferramenta) | | o `at` entra uma vez em `readOn`, para `connector_read` e as leituras tipadas | nenhum |
| O cenário gravado `data-query` | U4 | `nativeRecording`, `apps/server/src/platform/test-recordings.ts:77-89`; o cenário `reads`, `scripts/record.ts:12-14`, `:89`, `:137`, `:148` | o `AgentController` real do Mastra 1.82 com a loja em memória (testing T26), mesma situação | grava os eventos e as linhas que o Mastra emite e guarda | nativo | | um cenário a mais em `Scenario`, `CALLS` e `asked` | `apps/server/src/platform/recordings/mastra/data-query.jsonl` (gerado), `apps/server/src/builder/data-tools/test-data.ts` |
| As perguntas com resposta conhecida | U4 | `test-scorecard.ts:58-161` (27 perguntas, nenhuma de cópia), `failed` `:169-178` | a regra do próprio Mastra para ferramenta que falhou (`checks.noToolErrors`, `@mastra/evals@1.10.11 dist/checks-DXG9awTJ.js:317-345`, citada em `failed`); a plataforma de dados de referência avalia o agente com perguntas de resposta conhecida (estudo de referência, fora do repositório, delivery L21, seção 11.6; visto, a tela com as perguntas e a coluna de acerto, sem rodada feita) | um conjunto de perguntas com a resposta certa calculada, julgado por turno | nativo (o placar de hoje, uma lista a mais) | | `COPY_QUESTIONS` separada das 27; `failed` conta a falha pela regra do `noToolErrors` e reconhece o sucesso de dado pela forma `DataResult`, sem exceção por nome de ferramenta | nenhum |
| A linha da ferramenta e a consulta recolhida | U5 | `ToolRow`, `tool-row.tsx:370`; `Block`, `:129`; `ToolBody` no molde do Factory (`tool-spec.ts:34`) | a plataforma de dados de referência mostra a consulta gerada, recolhida, embaixo da resposta (estudo de referência, fora do repositório, delivery L21, seção 11.6; decisão E3a do escopo; visto); o Mastra Code Factory, `ToolCard.tsx:32-67` | a chamada recolhida, o corpo aberto com a entrada | nativo (o molde do Factory, um corpo a mais) | | `ToolBody` ganha `'query'` | nenhum |
| Os textos de recusa | U5 | `LOCAL_REFUSALS`, `connector-specs.ts:144-148`; `refusal` e `Refusal`, `tool-spec.ts:68`, `:106-107` | o molde de hoje das ferramentas dos agentes que lançam a recusa (`thrownOf` e `failureDetail`, `connector-specs.ts:181-235`), mesma situação | a recusa é o erro da ferramenta com `kind`, e a linha o lê | nativo | | sem `withheld`: a tabela escondida cai em `NOT_IN_CATALOG` (item (d)); `NOT_IN_ROLE` de uma consulta diz o mesmo texto, porque o `42501` também sai num Projeto e numa escrita, onde "seu papel" é falso, e confirmaria a tabela escondida | nenhum |
| **Copiar a consulta** | U5 | nenhum `navigator.clipboard` em `apps/web/src` | a plataforma de dados de referência abre a consulta gerada num bloco com um botão de copiar no canto (estudo de referência, fora do repositório, delivery L21, seção 11.6; visto); a API de área de transferência do navegador (`navigator.clipboard.writeText`) | escreve o texto e responde por promessa | nativo | | | nenhum |
| A origem até a tela | U6 | `sourcesOf`, `sources.ts:8-46`; `specOf` lê o resultado, `tool-registry.ts:244` | o resultado da ferramenta, que o Mastra guarda; `writer.custom` não chega vivo sob o controlador (`apps/server/src/builder/model-accounts/processors.ts:64-68`; `@mastra/core` 1.82 `agent-controller/session-run-engine.ts:1618-1619`) | a tela lê o resultado guardado da chamada | nativo | | a origem vai em `origin` do resultado (U2), com a forma em `DataResult` de `@conexus/hub-api` | nenhum |
| O bloco Fontes de dado | U6 | `Sources`, `sources.tsx:4-34`, só páginas da web | a plataforma de dados de referência diz a tabela de onde a resposta veio (estudo de referência, fora do repositório, delivery L21, seção 11.6; visto); a parte `source` do Mastra para a web, mesma peça | a origem embaixo da resposta | nativo (o bloco de hoje, um caso a mais na união) | | `MessageSource` vira união com `kind` | nenhum |
| O caminho da tabela | U7 | `copy-detail.tsx:152-159`, o link "← Dados" com `ArrowLeftIcon` | a plataforma de dados com catálogo e linhagem, na página da tabela (estudo de referência, fora do repositório, delivery L21, seção 11.3; visto nas capturas, não oficial); a `v10` aprovada | um caminho de links acima do título; aqui com `Link` do TanStack Router e `activeOptions={{ exact: true }}` (`@tanstack/react-router@1.170.44 dist/esm/link.js:35-37`, `:235-238`) | nativo | — | os dois links vão a `/data` sem `layer` (a camada de hoje é a Bruta) e levam o `q` | — |
| A linha da cópia | U7 | `copy-detail.tsx:164-168`, "{sistema} · a cada {intervalo}" | a plataforma de ingestão de referência, no painel da tabela com linhas e datas (estudo de referência, seção 3.5; visto, não oficial); a `v10` | a hora e as linhas da última carga ao lado do nome | nativo | — | "Copiada do … em" só com COMPLETE ou PARTIAL, a hora é `endedAt` | — |
| As abas da tabela e a de abertura | U7 | `copy-detail.tsx:197-226`; a aba padrão `columns` em `:146`; `TableTab` em `search.ts:12` (no head do PR 1085 (`689ece4a`)) | as duas plataformas abrem a tabela na visão geral (estudo de referência, seções 3.5 e 11.3; visto, não oficial) | Overview primeiro, as outras abas depois | nativo | — | `Tabs` do Base UI (`ui/tabs.tsx`), sem mudança na peça | — |
| A aba Visão geral | U7 | não existe; Ligação, Chave e Modo estão no painel (`copy-columns.tsx:61-82`) | a plataforma de ingestão de referência, aba Overview com a descrição (seção 3.5; visto, não oficial); a tela a1 do kit | a descrição e os fatos de como a tabela é copiada numa aba | nativo | — | `OverviewTab` em `copy-facts.tsx` (o `copy-columns.tsx` renomeado) | — |
| A linha de tela | U7, U8 | `docs/reference/screens.md:24` | web W29 | — | nativo | — | o trecho de antes e o de depois estão nas unidades | — |
| O painel Detalhes | U8 | `copy-columns.tsx:61-82`, `TablePanel` com oito linhas | a plataforma de ingestão de referência, "Painel com tamanho, linhas e datas, e Source details" (seção 3.5; visto, não oficial) | um painel de fatos ao lado das abas, em qualquer aba | nativo | — | `DetailsPanel` em `copy-facts.tsx`; sai Ligação, Chave, Modo, Intervalo e Camada | — |
| A hora da última rodada | U8 | `copy-columns.tsx:69`, `dayAndHour(copy.run.startedAt)` | mesma situação: o contrato diz "The open run, else the last" (`packages/hub-api/src/copies.ts:79-80`) | — | nativo | — | `endedAt`, a mesma hora da linha da cópia (critério 62) | — |
| O tipo na amostra | U9 | `copy-sample.tsx:31-39`, só o nome em mono | a plataforma de dados com catálogo e linhagem, grade de amostra (estudo de referência, seção 11.3, captura do catálogo; visto, não oficial) | o ícone do tipo antes do nome de cada coluna | nativo | — | ícones do `lucide-react@1.57.0`; com `aria-label`, o ícone não leva `aria-hidden` (`dist/esm/Icon.mjs:43`, `shared/src/utils/hasA11yProp.mjs:8-15`) | `apps/web/src/hub/copies/column-type.tsx` |
| O número da linha na amostra | U9 | não existe | a mesma grade de amostra (mesma captura; visto, não oficial) | uma primeira coluna numerada | nativo | — | `TableCell` em `text-2` | — |
| A amostra de 5 linhas | U9 | `COPY_SAMPLE_ROWS = 5`, `packages/hub-api/src/connection-copies.ts:38` | a skill oficial de descoberta de esquema da plataforma de dados com catálogo dá 5 linhas (estudo de referência, seção 3.9; documentado) | 5 linhas de amostra | nativo, sem mudança | — | — | — |
| Permissões de colunas novas de uma tabela que já tem permissão | U10 | `copy_run` com `UPDATE` por coluna, `database-grants.sql:406-412` | Postgres: `GRANT UPDATE (coluna)`; mesma situação no commit `d848c6b1` (o PR de permissões da parte 4, grupo 3) | um `GRANT` por coluna, o mesmo texto em `database-grants.sql` e numa migração à mão, uma instrução por `--> statement-breakpoint` | nativo | — | seguir a forma de `d848c6b1` | migração à mão em `apps/server/migrations/` |
| Permissões de tabelas novas "ao lado" | U10 | `notifications.notification` e `request_notice` com `SELECT, INSERT` e `UPDATE(read_at)`, `database-grants.sql:433-439` | mesma situação: `request_notice` | `SELECT, INSERT` e `UPDATE(read_at)`; nunca `DELETE`, a linha sai pela cascata | nativo | — | `copy_notice` igual a `request_notice`; `alert_recipient` e `copy_follower` com `DELETE`, porque tirar e deixar de seguir apagam | — |
| A prova das permissões | U10 | `catalog.test.ts:95-99` (instantâneo) e `:171-197` (a lista `REFUSED`) | mesma situação: data D11 aponta `catalog.test.ts` | o instantâneo compara o catálogo com o arquivo; a lista de recusas prova o que fica de fora | nativo | — | acrescentar as recusas e um caso positivo | — |
| Apagar no fim de uma passada que leu tudo | U11 | `closePass` em `copy-sql.ts:243-288`; decide por `changedSince === null` (`:254-255`) | a plataforma de ingestão de referência: a releitura inteira traz também o que foi apagado na origem (estudo de referência, fora do repositório, delivery L21, seção "sync types", documentado) | relê a fonte e apaga o que não veio | nativo (o `DELETE` de `_pass` de hoje) | — | decidir por `readAll`, não pela definição | — |
| Começar cada fonte do zero | U11 | `datedPasses` em `sources.ts:56-61`; `datesOf` dá `since: null` com `watermark` nulo (`source-pass.ts:39-47`); o contrato do kit lê tudo sem `since` (#940) | mesma situação: a primeira passada de hoje | zera o ponto de partida e a posição | nativo | — | `wholePasses`, na forma de `datedPasses`, e soma um a `pass`, como `passed` (`sources.ts:127-149`), para que as linhas da passada interrompida contem como velhas | — |
| A linha semanal | U12 | uma linha por cópia, `createCopyClock` em `clock.ts:57-106` | a plataforma de ingestão de referência agenda uma releitura inteira periódica ao lado da cópia incremental, numa agenda própria (estudo de referência, seção "sync types", documentado); `@mastra/core@1.82.0` `schedules.create` com `id` e `status` (`dist/schedules/schedules.d.ts:95-115`, `dist/schedules-D8PrAbVN.js:492-525`) | uma segunda agenda, semanal | nativo (uma linha a mais do agendador do Mastra) | — | domingo, 04:07, só cópia incremental | — |
| O id da linha | U12 | `scheduleIdOf` em `workflow.ts:82-84` | `@mastra/core@1.82.0` `canonicalizeScheduleId` (`dist/schedules-D8PrAbVN.js:316-322`) passa o id pelo `slugify`, que troca `_` por `-` (medido: `<uuid>_whole` dá `<uuid>-whole`); `#load` procura o id exato (`:409-417`) | — | nativo | — | sufixo `-whole` | — |
| Pausar, retomar, apagar e ler | U12 | `pause`, `resume`, `remove`, `states` em `clock.ts:84-104` | `@mastra/core@1.82.0`: `get` devolve `null` sem a linha (`:536-540`); `pause` e `resume` lançam `SCHEDULES_NOT_FOUND` sem a linha (`:666-699`); `delete` volta sem erro (`:660-665`); `update` com `cron` recalcula `nextFireAt` (`:561-600`) | — | nativo | — | `get` antes de pausar a semanal; `ensureWhole` nunca chama `update` na normal | — |
| Pular com outra rodada aberta | U12 | a trava de `claim` em `run.ts` devolve `RUNNING` | a plataforma de dados com catálogo e linhagem pula a execução que chega com outra em curso (estudo de referência, documentado) | pula, sem fila | nativo | — | pular e imprimir o código | — |
| A passada ao subir | U12 | os passes de `main.ts:261-274`; o escopo de empresa sem pessoa e o log por empresa em `repairApps`, `hub/apps/repair.ts:218-236` | mesma situação: `repairApps` | por empresa, falha registrada, segue | nativo | — | `ensureWholeLines` na forma de `repairApps` | `apps/server/src/hub/copies/whole.ts` |
| "Passada inteira" na linha da rodada | U13 | `RunRow` e `RunPhoneRow` em `copy-detail.tsx:36-60`; `outcomeText` em `text.ts:175-189` | o protótipo `b2-rodadas-inteira` | a marca em `text-2` depois do resultado | nativo | — | — | — |
| A linha fina e "Fontes" (tela A) | U14 | `sources.tsx:31-36`, sem linha | o protótipo `p3-01` | uma linha fina sobre o título | nativo | — | — | — |
| A logo da fonte (tela A) | U14 | sem logo no bloco; `ConnectorLogo small` nas linhas de ferramenta (`tool-bodies.tsx:147-151`); o `logo` do kit no catálogo (`packages/hub-api/src/connectors.ts:58`) | `p3-01`; a plataforma de ingestão de referência põe a logo do conector em cada fonte (capturas fora do repositório, delivery L21; visto, não oficial) | a logo numa placa antes do nome | nativo | — | `ConnectorWords.logo` | — |
| O sistema e a conexão, sem repetir (tela A) | U14 | `copiedFrom` junta os nomes e a fonte de cópia não os mostra (`sources.ts:71-90`); `systemText` (`apps/web/src/hub/copies/text.ts:37-41`, critério 74, PR 1111) | `p3-01` ("Sankhya · Matriz") | o sistema e a conexão ao lado | nativo (`systemText`) | — | `NOT_GIVEN` fora da lista (decisão 28) | — |
| A tabela numa pastilha de código (tela A) | U14 | a tabela no cinza da frase (`sources.tsx:34`) | `p3-01` (mono); a plataforma de dados com catálogo e linhagem põe as tabelas usadas em pastilhas (capturas fora do repositório; visto, não oficial) | a tabela em mono num fundo próprio | nativo (o mono em `surface-3` de `tool-bodies.tsx:20`) | — | — | — |
| O estado com ponto e cor (tela A) | U14 | `copiedText` só em palavras, em `text-2` (`sources.tsx:8-19`) | `p3-04` (ponto vermelho na parada); a plataforma de ingestão de referência diz o estado da fonte em palavra e cor (capturas fora do repositório; visto, não oficial); o Stamp do `DESIGN.md:558-561` | a palavra com o ponto na cor, na ponta | nativo (`Stamp`, `block.tsx:37-48`, V35) | — | o neutro em `line-strong` (decisão 33) | — |
| "ao vivo" (tela A) | U14 | `liveText`, `sources.tsx:21-25` | `p3-05` | "ao vivo" junto da hora | nativo | — | decisão 34 | — |
| O selo da conexão a reautorizar (tela A) | U14 | `copiedFrom` descarta `systems[].state` (`sources.ts:72-74`) | nenhuma: nosso, `stateBadge` de Integrações (`apps/web/src/hub/connectors/text.ts:35-45`) | o selo com a palavra depois do nome | nativo (`stateBadge`, `Badge`) | — | decisão 32 | — |
| O nome e a logo do catálogo na sala do Builder | U14 | `BUILDER_ROOM` com `PLAIN_WORDS` (`room.ts:80-86`); o Assistente lê o catálogo (`connector-names.ts:14-21`) | o Assistente desta etapa | `wordsOf` sobre `connectionsQuery`, que todo membro lê (`apps/server/src/hub/connectors/connections.ts:57-58`) | nativo | — | o hook vai para `builder/conversation/`, um dono; as recusas ficam as de `PLAIN_WORDS` | o hook em `builder/conversation/` |

**A medida do transplante.** Nenhuma parte vem do repositório antigo.

**A dívida.** Nenhuma nova. A sala do Builder com o nome técnico do sistema sai com U14 (emenda de
2026-11-16).

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A divisão em etapas: esta é a primeira de oito, com a linha principal (contrato, ferramentas, origem) e, ao lado, a página da tabela e a passada inteira | A ordem do fundador, "A Essas juntas"; a qualidade e a parte 2 ficam antes do Negócio, como na tabela de ordem da proposta aprovada. O orçamento da etapa ficou em cerca de 1.470 linhas com a emenda, abaixo do teto da delivery L2 | Mover unidades entre as etapas antes do cartão seguinte |
| 2 | O cartão entra num pull request em rascunho enquanto `a-ontologia-da-empresa.md` ocupa a vaga da trilha | Delivery L5: o próximo cartão de uma trilha espera no seu rascunho, e a verificação `processo` só fica vermelha num pull request fora do rascunho | Marcar o pull request como pronto quando a vaga abrir |
| 3 | A spec de três arquivos (`trilhas/dados-spec/`) fica no repositório até a última etapa que a substitui | Ela ainda guarda o que as etapas 2 a 6 vão converter; o método a tira quando o próximo cartão a substituir | Apagar a pasta no fechamento da última etapa que a usa |
| 4 | O critério 4 acrescenta uma asserção no teste do servidor sobre as chaves do `describe` cru | O tipo do retorno de `catalogOf` é inferido do callback de `deps.database.read`; um `withheld: []` esquecido provavelmente compila (inferido, não medido), e `Catalog.parse` no teste o apagaria (Zod tira chave desconhecida) | tirar a asserção; o critério 6 fica sozinho |
| 5 | `context.ts` fica na lista de migração (spec, decisão `L2`) | O bloco "## Data" usa campos que o `Catalog` não tem (`apps/server/src/hub/copies/project-view.ts:22-42`); a mudança é só de texto | Tirar o arquivo da lista quando a proposta de cópia passar pelo contrato |
| 6 | Os agentes não passam `by` ao contrato nesta etapa | `sourcesFor` ignora o contexto (`apps/server/src/hub/data/public.ts:38`) e nenhum critério poderia observá-lo; o Registro de dados, na etapa 3, é o primeiro leitor e liga o `by` com o seu critério | Passar `{ by: { agent, agentId?, threadId } }` em cada `DataOf` quando o Registro chegar |
| 7 | `DataOrigin.lastRun` derivado do dono, os `kind` de `CopyRun.shape.outcome` mais `'NONE'` | A união da spec não tem `RUNNING`, que `CopyRun` tem (`packages/hub-api/src/copies.ts:47-54`); escrita à mão, diverge (code C26) | Voltar à união da spec e tratar `RUNNING` |
| 8 | O critério 27 entra (a porta provada de ponta a ponta) | Nenhum teste da spec provava a porta ligada ao lugar certo; `Sent.toolResults` lê o resultado (`apps/server/src/platform/test-anthropic-body.ts:37-38`) | Tirar o caso |
| 9 | Os textos que o escopo não deu (`L4` da parte 3): "Não deu para copiar. Selecione a consulta e copie.", "ainda sem cópia", "copiado ontem às", "copiado em 17/10/2026 às", "parada hoje às" (no lugar de "parada, copiado"), "lido ontem às", "lido em 17/10/2026 às", e a fonte ao vivo pelo conector e a conexão ("Sankhya · Matriz") | parte 3, `tasks.md:745`: o construtor usa as propostas e o PR as lista para a palavra do fundador | trocar a frase em `data-specs.ts` ou `sources.tsx`; o teste do critério cita a frase nova |
| 10 | O catálogo gravado tem as cinco tabelas dos modelos de cópia do Sankhya, e a linha diz "5 tabelas", não "7 tabelas" | o kit tem cinco modelos (`packages/connectors/src/sankhya/copies.ts:85-160`: clientes, vendedores, produtos, vendas, itens de venda); o "7" da spec veio do protótipo `p3-03` | outra lista em `recordedData`; o teste lê a contagem gravada |
| 11 | Na conversa do Builder a fonte nomeia o conector pelo id ("sankhya"). Desfeita pela emenda de 2026-11-16: U14 dá à sala do Builder as palavras do catálogo (critério 112) | `BUILDER_ROOM` usa `PLAIN_WORDS` (`apps/web/src/builder/conversation/room.ts:80-86`, `connector-specs.ts:134-138`); dar à sala do Builder as palavras do catálogo muda a montagem da conversa do Projeto, fora das pastas de G3 | — |
| 12 | Visão geral é a aba de abertura, embora a `v10` desenhe a Amostra aberta | As duas referências abrem a tabela na visão geral (estudo de referência, seções 3.5 e 11.3); a `v10` abre a Amostra para mostrar a grade | Trocar `TableTab.enum.overview` pela aba desejada como padrão em `CopyDetail` |
| 13 | "Copiada do … em" só com a última rodada COMPLETE ou PARTIAL | `rows` é "After the last complete pass" (`copies.ts:81-82`); com ERROR ou INTERRUPTED a hora seria a de uma rodada que não copiou | Tirar a checagem de `outcome.kind` em `copiedText` |
| 14 | A contagem "18 de 22 descrições" da `v10` fica de fora | Nenhuma referência conta descrições | Uma linha a mais no `DetailsPanel`, com o texto aprovado |
| 15 | A frase do painel perde "códigos" ("Só os nomes e as descrições ficam no Hub…") | Os códigos do sistema só ficam no Hub com a Ontologia (parte 5) | Devolver a palavra quando a parte 5 chegar |
| 16 | **Rodar agora** fica no lugar onde a `v10` põe Perguntar ao Assistente | É a ação que existe hoje; o botão do Assistente espera a parte 3 (grupo 3 do explorador, fora desta etapa) | Nada a desfazer; o grupo 3.1 acrescenta o botão ao lado |
| 17 | Os botões Buscar, Filtrar e Colunas da grade da `v10` ficam de fora | Com 5 linhas não há o que buscar nem filtrar; Colunas volta com o nome de negócio (parte 5) | Uma barra sobre a grade, quando a parte 5 chegar |
| 18 | `copy_notice` sem `DELETE` e só com `UPDATE(read_at)` | a forma de `request_notice` (`database-grants.sql:438-439`); a notificação sai pela cascata da pessoa ou da cópia (PR 1088, `copy_notice_member_fkey` e `copy_notice_copy_fkey`) | um PR de permissões com o `DELETE` |
| 19 | `whole` sem permissão de `UPDATE` | só o `INSERT` da rodada o escreve; o `INSERT` já é da tabela inteira (`database-grants.sql:406`) | um PR de permissões com `UPDATE(whole)` |
| 20 | A linha semanal aos domingos, 04:07, só para cópia incremental | a proposta aprovada diz de madrugada; a referência agenda a releitura ao lado da incremental; uma cópia inteira já relê tudo; o minuto 7 fica fora de `*/15` e `*/30` | trocar `WHOLE_CRON` em `clock.ts` |
| 21 | O id `schedule_<cópia>-whole` | o Mastra troca `_` por `-` no id (`schedules-D8PrAbVN.js:316-322`), e o `get` com `_` não acharia a linha | um passo ao subir que recria as linhas com o id novo |
| 22 | Pular a passada inteira quando outra rodada está aberta | a referência pula a execução que chega com outra em curso; a próxima é no domingo seguinte | pôr a passada numa fila (outra unidade) |
| 23 | A linha semanal guarda o `interval` da normal em `metadata`, só para `ownedOf` aceitá-la; ninguém o lê (`states` pula a semanal), e ele pode ficar velho depois de mudar o intervalo | `ownedOf` exige `Metadata` (`clock.ts:25`, `:39-46`); um campo de `metadata` próprio pediria outro esquema | um esquema de `metadata` só da semanal |
| 24 | `stepOf`, `pageStep` e `closedPass` passam a levar `{ windowFrom, readAll }` no lugar de `windowFrom` | o fim da passada precisa saber se ela começou sem `since`, que só `sourcePass` sabe | voltar ao parâmetro solto |
| 25 | O `copiedAt` da spec vira `lastRunEndedAt`, e a fonte da rodada parada diz "parada hoje às", sem "copiado" | o contrato só dá a última rodada encerrada, de qualquer resultado (`ended` grava `lastRunId` em toda rodada, `apps/server/src/hub/copies/run.ts:114`); a spec define o campo como "quando a última rodada terminou" (parte 3, `design.md:255`) e pede "parada" junto da hora (`requirements.md:86`); com o nome `copiedAt`, o modelo e a tela diriam "copiado" na hora de uma rodada que não copiou, o que a decisão 13 já recusa na página da tabela | Voltar ao nome da spec e calcular, no catálogo, o fim da última rodada `COMPLETE` ou `PARTIAL` |
| 26 | Um resultado de ferramenta de dado fora de `DataResult` não vira fonte nem linha completa, sem log | a parte guardada é da Mastra e a mesma gravação passa pelo esquema no teste (critérios 38 e 46); um log na tela se repetiria a cada desenho | um `console.error` com código no `sourcesOf` |
| 27 | Durante a implantação em rodízio, um Hub antigo pode ler a linha semanal | `CopyInput` de hoje é `z.object` e tira a chave `whole` (`workflow.ts`): o Hub antigo roda a semanal como uma rodada normal, inofensiva, e o seu `states` pode, por um instante, mostrar o horário da semanal no lugar da normal (o `Map` por cópia fica com a última linha lida). O Hub antigo sai quando o novo sobe; a passada inteira volta no domingo seguinte | implantar o Hub novo antes de ligar qualquer cópia, ou abrir issue se o rodízio durar mais que um domingo |
| 28 | Quem monta o catálogo de cada lugar decide o que `kept.sources` leva: no Início, toda fonte é `NAMED`, com o nome gravado e o estado da conexão, também a que espera nova autorização; no catálogo de um Projeto, a fonte de uma conexão que ele não recebeu é `NOT_GIVEN`, só com o conector. A ferramenta só diz o que `kept` traz | No Início, a opção (a) do fundador, "1. A": a origem pelo registro gravado, com o estado da conexão. No Projeto, escolha do firstmate pela palavra "2. O que voce quiser": só o nome do sistema, que é o que o app do Projeto já vê (`apps/server/src/builder/app-data/context.ts:51-56`). A ferramenta não sabe o lugar (`DataOf` devolve só `CompanyData`, `data-tools/tools.ts:10`), mas `catalogOf` sabe (`hub/data/catalog.ts:16-22`) e já monta o catálogo do Projeto à parte do da empresa; por isso a decisão fica lá, e `DataOf` não muda. `systems` não serve para decidir, porque deixa de fora tanto a conexão não dada ao Projeto quanto a que espera autorização (`hub/connectors/rows.ts:72`, `builder-port.ts:139-169`) | `catalogTables` grava toda fonte `NAMED`, e o Projeto passa a nomear a conexão que não recebeu |
| 29 | G2b muda o contrato, quem o escreve (`catalog-view.ts`) e quem o lê (`data-tools/tools.ts`) num PR só, com a issue `contrato` | O roteiro da trilha Dados manda o contrato num PR e o consumidor em outro (`docs/steps/trilhas/dados.md:74-79`); um campo renomeado com os leitores para trás não compila, e um campo novo ao lado do velho daria dois donos ao id (code C26). G1 já levou a sua linha do servidor junto | dois PRs, com `sources` ao lado de `connections` até o segundo |
| 30 | `REFUSED_TEXT.NOT_IN_ROLE` é "Essa tabela não está no catálogo.", também para `data_describe` | Fechamento do firstmate pela auditoria das referências, com a palavra do fundador "1. Sim pode ser essa frase"; um texto por `kind` (code C26), e `data_describe` só recebe `NOT_IN_ROLE` num catálogo que diz ler uma tabela que o login não lê | um texto próprio para `data_describe` |
| 31 | `failed` do placar reconhece o sucesso de uma ferramenta de dado pela forma `DataResult`, não pelo nome | A recusa das ferramentas de dado é lançada (U2) e já conta como `output-error` pela regra do `noToolErrors`; só a cláusula da recusa devolvida como resultado (`test-scorecard.ts:176`) confundia `CATALOG`, `TABLE` e `ROWS` com recusa. Migrar o placar para `runEvals` (`@mastra/core@1.82.0 dist/docs/references/reference-evals-run-evals.md:85`, `:105`) é maior que esta etapa | a exceção por `DATA_TOOL` em `failed` |
| 32 | O selo da conexão só em `NEEDS_REAUTH`, um por fonte, depois do nome, mesmo numa cópia de duas conexões | "Funcionando" em toda fonte repetiria o ponto verde; uma cópia de duas conexões é rara | um selo por conexão, com o nome dela |
| 33 | `Stamp` (`apps/web/src/ui/block.tsx:37-48`) passa a aceitar `className`: na cópia em dia e ao vivo, as palavras em `text-2` com o ponto em `success`; em "ainda sem cópia", o ponto em `line-strong` | O tom de `Badge` pinta palavras e ponto (`badge.tsx:14`), e o neutro do `Badge` esconde o ponto, que o `Stamp` mostra na cor do texto; a tela A tem as palavras em `text-2` e só o ponto no tom, menos na parcial e na parada | tirar o `className` e pintar as palavras no tom |
| 34 | A leitura ao vivo diz "ao vivo · " também noutro dia ("ao vivo · lido ontem às 22:46") | "ao vivo" diz o tipo da fonte, não a hora | dizer "ao vivo" só no dia do `at` |


## U1 `withheld` sai do contrato e a lei da tabela escondida

**Base e modelo.** Base: `main` em `5d02e643` ou depois; não depende de PR aberto (os PRs 1085, 1086 e 1088 não tocam estes arquivos). Modelo: Sonnet. A mudança é a volta de um commit conhecido (`bb03b122`), num pacote, sem concorrência nem algoritmo.

### As linhas da tabela

- **O catálogo esconde.** Ler na base `packages/hub-api/src/company-data.ts:60-62` (`WithheldTable`, com o comentário), `:64-71` (`Catalog`) e `apps/server/src/hub/data/catalog.ts:7-30` (`catalogOf`, o retorno em `:23`). O `withheld: []` do servidor veio da parte 1, grupo 4 (`637ca714`, #1075), não de `bb03b122`.
- **O nome responde como inexistente.** Ler `company-data.ts:228-229` (as duas constantes), `:251-255` (`Source`), `:257-262` (`sourceOf`, caso `TABLE`) e `:312-316` (o `switch` de `read`). Fica: `NOT_IN_ROLE` em `REFUSALS` (`:106`) e em `QueryPage` (`:205`), que são literais de tipo usados pela leitura ao vivo (`apps/server/src/hub/connectors/read.ts:155`) e pela consulta (`apps/server/src/hub/data/query.ts:50-53`).
- **A consulta recusada.** Ler `company-data-role-conformance.ts:23-30`; nada muda nela além de `world.hidden`.
- **A lei.** Ler `company-data-role-conformance.ts:8-21` e `:32-42`, `company-data-world.ts:30-31`, o mundo falso em `company-data.test.ts:117`, `:122-125`, `:163-164`, `:194`, e a entrada em `scripts/rerun-never.json:1166-1169`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/company-data.ts` (dono do contrato de acesso) | Apaga `WithheldTable`, `Catalog.withheld`, a constante `NOT_IN_ROLE`, o membro de `Source` e o `case` de `read` | `apps/server/src/hub/data/catalog.ts` (`Described`) e `apps/server/src/hub/data/data.test.ts` (`Catalog`) são os únicos importadores fora do pacote; ninguém importa `WithheldTable` (conferido com `git grep` em `5d02e643`) |
| `packages/hub-api/src/company-data-role-conformance.ts`, `company-data-world.ts` | Muda | `company-data-conformance.ts:292` (`...roleLaws`), `company-data.test.ts` |
| `packages/hub-api/src/company-data.test.ts` | Muda | — |
| `apps/server/src/hub/data/catalog.ts` | Muda uma linha (exceção declarada ao "PR só do contrato", `docs/steps/trilhas/dados.md:72-78`) | `createCompanyData`, `apps/server/src/hub/data/public.ts` |
| `apps/server/src/hub/data/data.test.ts` | Muda (uma asserção) | — |
| `scripts/rerun-never.json` | Muda um nome | `scripts/rerun-exempt.ts`, `scripts/test-run.ts` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/company-data.ts
export const Catalog = z.object({
  kind: z.literal('CATALOG'),
  systems: z.array(CatalogSystem),
  /** The tables the asker's role reads; a table outside it is not named anywhere. */
  tables: z.array(CatalogTable),
})
type Source =
  | Readonly<{ kind: 'TABLE'; table: CatalogTable }>
  | Readonly<{ kind: 'LIVE'; read: OperationRead }>
  | typeof NOT_IN_CATALOG

// packages/hub-api/src/company-data-world.ts, no lugar de `withheld`
/** A table the world's sources keep and its catalog does not name, and a query only it answers. */
hidden: Readonly<{ table: string; query: string }>
```

Sai do pacote exportado: `WithheldTable` (esquema e tipo). Nenhuma rota, coluna ou código de falha muda.

- **Cada estado.** `Described` continua união discriminada em `kind` (C21); `Source` perde uma variante e o `switch` de `read` fecha em `satisfies never`.
- **Cada id.** Nenhum id novo (C23).
- **O dono de cada fato.** O que o papel lê tem um dono, `Catalog.tables` (C26); a frase das leis fica na lista `roleLaws`.
- **O esquema Zod de cada entrada externa.** `Catalog` continua sendo o esquema que o teste e o servidor usam (C27); nenhuma entrada nova.
- **O arquivo modelo.** `company-data-query-conformance.ts` (a lista `queryLaws`, `:61-76`): cumpre C21 e C26; não tem id.

### As skills e a leitura

Linhas de `docs/reference/stack.md`: `zod` (`:34`, `zod.dev/llms.txt`), `typescript` (`:91`, skill `typescript-magician`), Node (`:101`, skill `node`). Ler primeiro `bb03b122`.

### A ordem do trabalho

1. **Tirar `withheld` do contrato e do servidor.** Critérios: 1, 2, 4, 6.
   - **Arquivos:** muda `packages/hub-api/src/company-data.ts`, `apps/server/src/hub/data/catalog.ts`, `apps/server/src/hub/data/data.test.ts`.
   - **Referência a seguir:** o diff de `bb03b122` em `company-data.ts`, ao contrário; `sourceOf` fica com as duas linhas de `:260-261`.
   - **O que sai:** `WithheldTable` (`:60-62`), `withheld` de `Catalog` (`:69`), a constante `NOT_IN_ROLE` (`:229`), `typeof NOT_IN_ROLE` de `Source` (`:255`), a linha `withheld.some` (`:259`), `case 'NOT_IN_ROLE':` de `read` (`:315`), e `withheld: []` em `catalog.ts:23`. Chamadores: só os listados no raio.
   - **O que entra:** o `Catalog` e o `Source` do contrato acima. Em `data.test.ts`, no caso "descrever na empresa…", as chaves do `describe` cru do dono: `assert.deepEqual(Object.keys(described).sort(), ['kind', 'systems', 'tables'])`, antes de `Catalog.parse`. Regras: C26, S10.
   - **Testes:** `data.test.ts`, o caso acima, no comando do servidor.
   - **Mutações à mão:** pôr de volta `withheld: []` em `catalog.ts:23` faz falhar "descrever na empresa…".
   - **Pronto quando:** `npm run typecheck` passa (o mundo falso ainda quebra até o passo 2: rode os dois passos antes do teste do pacote).

2. **A lei da tabela escondida.** Critérios: 1, 2, 3, 5, 6.
   - **Arquivos:** muda `company-data-role-conformance.ts`, `company-data-world.ts`, `company-data.test.ts`, `scripts/rerun-never.json`.
   - **Referência a seguir:** `refusesReadOutsideCatalog` (`company-data-conformance.ts:198-207`) para a forma da recusa sem chamada.
   - **O que sai:** `keepsWithheldTableOut` e o seu nome em `roleLaws`; `withheld` de `DataWorld`; no teste, a linha `withheld` do `CATALOG` (`:117`) e `WITHHELD` (`:122-125`, `:163`, `:194`), que viram `HIDDEN` com os mesmos valores (`erp_titulos`).
   - **O que entra:** o começo da lei, porque a asserção sobre o texto inteiro é a prova:
     ```ts
     async function keepsHiddenTableOut(world: DataWorld, data: CompanyData): Promise<void> {
       const { table } = world.hidden
       const described = Described.parse(await world.sources.catalog({}))
       assert.equal(described.kind, 'CATALOG')
       assert.ok(!JSON.stringify(described).includes(table), 'the catalog names the hidden table')
     ```
     e depois `read` dá `{ kind: 'NOT_IN_CATALOG' }` e `world.reached.rows` fica vazio. `roleLaws[0]` tem o nome "uma tabela que o papel não lê não aparece no catálogo e pedir pelo nome responde NOT_IN_CATALOG sem pedir linhas"; a segunda lei lê `world.hidden.query`. Em `rerun-never.json`, o nome antigo troca pelo novo, no mesmo arquivo de teste. Regras: T5 (a lei passa pela porta `companyData`), T10, T27.
   - **Testes:** `npm test -w @conexus/hub-api`; `node scripts/test-run.ts --test-reporter=./scripts/test-reporter.ts scripts/rerun-exempt.test.ts`.
   - **Mutações à mão:** (a) pôr `erp_titulos` em `tables` do `CATALOG` falso: a lei nova falha (`read` devolve `TABLE`). (b) Pôr `erp_titulos` no `name` de um sistema ou no `label` de uma leitura do `CATALOG` falso: falha com "the catalog names the hidden table". (c) Fazer `sourceOf` devolver `NOT_IN_ROLE` para o nome que não acha: reabre só durante a mutação a constante, o membro de `Source` e o `case` de `read`; a lei nova falha; desfaça tudo. (d) Fazer a fonte `query` falsa devolver `ROWS` para `HIDDEN.query`: a segunda lei falha.
   - **Pronto quando:** a suíte passa com 22 leis, e `git grep -n -i withheld -- packages/hub-api apps/server/src/hub/data scripts/rerun-never.json` não mostra nada.

### Como se prova

- Critérios 1 e 2: a lei nova roda `describe` e `read` do contrato sobre o mundo falso; hoje ela falharia, porque o catálogo nomeia `erp_titulos` em `withheld` e `read` responde `NOT_IN_ROLE`.
- Critério 3: a segunda lei de `roleLaws`, já verde hoje, continua verde lendo `hidden`.
- Critério 4: `data.test.ts` chama `on.hub.data(...).describe()` pela porta pública (T5); hoje falharia com a chave `withheld`.
- Critério 5: a contagem na saída do teste, 22 antes e depois.
- Critério 6: `rerun-exempt.test.ts` recusa um nome que nenhum teste tem; o `git grep` fecha.

### Parar se

- O `typecheck` acusar um leitor de `withheld` ou de `WithheldTable` fora dos arquivos do raio (por exemplo um PR das ferramentas mesclado antes, com `withheld: []` num catálogo falso): pare e reporte; tirar a linha lá é consequência direta (delivery L7), mas diga no PR.
- A contagem de leis não der 22: reconte `LAWS`, `roleLaws` e `queryLaws` e reporte o número medido; não ajuste lei para bater.
- Alguém pedir que a consulta sobre a tabela escondida também responda `NOT_IN_CATALOG`: é a pergunta 1 do desenho do item (d), do fundador; fica `NOT_IN_ROLE`.

## G1 O ponto de conferência

Depois de U1, antes do PR: os passos 6 e 7 do `conexus-build`. Neste grupo: `npm test -w @conexus/hub-api`; no servidor, `apps/server/src/hub/data/data.test.ts` no comando do servidor (depois de `npm ci` e `npm run build -w @conexus/server`); `scripts/rerun-exempt.test.ts`; `npm run typecheck`; `npm run check`; o `git grep` do critério 6; as quatro mutações do passo 2 e a do passo 1 listadas no corpo (T27). Sem servidor de pé, sem rota, sem migração, sem tela. O corpo do PR declara a exceção de um commit só (a mudança de contrato vai sozinha, `docs/steps/trilhas/dados.md:72-78`, como a parte 4, grupo 5), a linha de `catalog.ts` e o nome trocado em `scripts/rerun-never.json`.

## U2 As duas ferramentas, os nomes, o fecho do Builder e o verificador

**Base e modelo.** O `main` com o PR de G1 (U1, o catálogo sem `withheld`) mesclado; a fonte de
consulta já está no `main` desde `a1c7df27` (PR 1077). Sonnet: módulo novo, padrão conhecido
(`typedTool`), sem concorrência.

### As linhas da tabela

- **As duas ferramentas.** Leia na base `typedTool` (`apps/server/src/builder/connectors/typed-reads.ts:97-126`: `createTool`, o `requestContext` indefinido, o `NOT_GRANTED`), `appDataTools` (`apps/server/src/builder/app-data/tools.ts:65-86`) e o contrato `CompanyData`, `Described`, `ReadAnswer`, `QUERY_SQL_MAX` (`packages/hub-api/src/company-data.ts:65-93`, `:113-150`, `:222-226`). API: `@mastra/core@1.82.0 dist/docs/references/reference-tools-create-tool.md:93-109` (o contexto: `requestContext`, `abortSignal`). O modelo
 `text-to-sql` do Mastra (`introspect-database.ts:7-54`, `execute-sql.ts:14-44`).
- **Os nomes.** `packages/hub-api/src/tools.ts:40-41` (`APP_DATA_TOOL`), `:48-59` (`BUILDER_TOOL`), `:62-68` (`CLOSED_TOOLS`); `READ` em `apps/server/src/builder/conversation/permissions.ts:22-38`; `RowTool` em `apps/web/src/builder/conversation/tool-spec.ts:15-21`.
- **A origem e a recusa.** `NOT_GRANTED` em `connector-tools.ts:58`; as frases em `:171-186`; `FailureLog` em `apps/server/src/platform/failure.ts:12-15`. O caminho de falha: `refuse()` e `ConnectorRefused` em `apps/server/src/builder/agents/tools.ts:27-75`; a Mastra embrulha o que a ferramenta lança em `TOOL_EXECUTION_FAILED` (`@mastra/core@1.82.0 dist/utils-BcF5eERx.js:1116-1125`); a tela o lê por `thrownOf` (`apps/web/src/builder/conversation/connector-specs.ts:181-201`). `ReadCut` em `packages/hub-api/src/assistant.ts:85-91`, o molde do esquema do resultado guardado.
- **A pasta.** `.dependency-cruiser.cjs:21` (`AGENTS_AND_APPS`), `:23-56` (`CONTRACT_MIGRATION`), `:101-110` (a regra); `BAD` em `scripts/rules-doors.test.ts:20-33`.
- **A linha mínima.** `APP_DATA_SPECS` em `apps/web/src/builder/conversation/app-data-specs.ts:21-42`; `TOOLS` em `tool-registry.ts:47` e `:202`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/data-tools/` | Cria | U3 (assistente, builder, agentes) pelo `public.ts` |
| `packages/hub-api/src/tools.ts` | Muda (`DATA_TOOL`, `DESCRIBE_SAMPLE_ROWS`, `BUILDER_TOOL`) | `permissions.ts`, `assistant.ts`, a tela (`tool-spec.ts`, `tool-registry.ts`, `tool-row.test.tsx`) |
| `packages/hub-api/src/assistant.ts` | Muda (`DataOrigin`, `DataResult`, ao lado de `ReadCut`) | `data-tools/tools.ts`; G3 (`data-specs.ts`, `sources.ts`); lido pela trilha Dados (delivery L27) |
| `apps/server/src/builder/conversation/permissions.ts` | Muda (`READ`) | `TOOL_CLOSURE`, `permissions.test.ts` |
| `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts` | Muda | `npm run deps`, CI |
| `apps/web/src/builder/conversation/` | Cria `data-specs.ts`; muda `tool-registry.ts` | `TOOLS` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/tools.ts
export const DATA_TOOL = { describe: 'data_describe', query: 'data_query' } as const
export const DESCRIBE_SAMPLE_ROWS = 5            // decisão T7 do escopo
// BUILDER_TOOL ganha dataDescribe: DATA_TOOL.describe, dataQuery: DATA_TOOL.query (CLOSED_TOOLS e RowTool herdam)

// packages/hub-api/src/assistant.ts, ao lado de ReadCut (o dono da forma do resultado, code C26)
export const DataOrigin = z.object({ systems: z.array(z.string()).min(1), connector: z.string(),
  table: z.string(), lastRunEndedAt: z.iso.datetime().nullable(),
  lastRun: z.enum([...<os kind de CopyRun.shape.outcome>, 'NONE']) })   // decisão 7
export const DataResult = z.discriminatedUnion('kind', [ /* CATALOG, TABLE, ROWS, abaixo */ ])
export type DataOrigin = z.infer<typeof DataOrigin>

// apps/server/src/builder/data-tools/tools.ts
export type DataOf = (requestContext: RequestContext) => Promise<CompanyData | undefined>
export function dataTools(deps: { dataOf: DataOf; log: Pick<FailureLog, 'error'> }): ToolsInput

// apps/server/src/builder/data-tools/order.ts
export function dataOrder(): string              // o texto de `C4`, palavra por palavra

// apps/server/src/builder/data-tools/public.ts
export { dataTools, type DataOf } from './tools.ts'
export { dataOrder } from './order.ts'
```

O resultado ao modelo é `DataResult`, uma união com `kind` (code C21): `CATALOG` (`systems: [{ name,
connector, reads: [{ operation, label, summary }] }]`, `tables: [{ name, label, description,
...DataOrigin sem table }]`), `TABLE` (`name, label, description, columns: [{ name, type,
description, inactiveSince }], sample: { rows, more }, origin`) e `ROWS` (`columns, rows, complete,
origin: DataOrigin[]`, mais `reason` quando `origin` é vazia). `lastRunEndedAt` é
`kept.lastRun?.endedAt ?? null`, e `lastRun` é `kept.lastRun?.outcome.kind ?? 'NONE'` (decisão 25).
`systems` traz o nome de cada conexão de `kept.connections`, na mesma ordem. A emenda de
2026-11-15 troca essa forma: U2b lê a origem de `kept.sources`, que o catálogo de cada lugar já
monta com o nome e o estado, ou só o conector num Projeto que não recebeu a conexão.

Toda recusa, `NOT_GRANTED` e as do contrato, é lançada, nunca devolvida (code C79): a ferramenta
lança um `Error` cuja mensagem é o JSON `{ kind, status: null, code, message, body: null, reason }`,
a forma que `refuse()` lança e `thrownOf` lê, e a Mastra a entrega ao modelo como falha da
ferramenta. `QUERY_REFUSED` põe o SQLSTATE em `code` e a mensagem inteira do PostgreSQL em
`message`; as outras levam `code` e `message` nulos. O `switch` das recusas termina em
`satisfies never`.

| `kind` | `reason` ao modelo, no erro lançado (inglês, `C3`) |
| --- | --- |
| `NOT_GRANTED` | "This conversation has no access to the company's data." (`data-tools/tools.ts:25`, como U2 construiu) |
| `NOT_IN_CATALOG` | "No such table in the catalog. Call data_describe with no table to list them." |
| `NOT_IN_ROLE` | "PostgreSQL denied this statement: it reads a table outside the catalog of this place, or it is not a read. Call data_describe with no table to see the tables you may read; do not look for the data elsewhere." (a frase da emenda de 2026-11-15, construída na U2b; U2 construiu "...the role of the person does not read one of its tables... Say so; ...") |
| `QUERY_REFUSED` | `PostgreSQL refused the query (SQLSTATE ${sqlstate}); its message is in message. 42601 is a syntax error, 42703 a column that does not exist, 42P01 a table that does not exist, 25006 a write. A table is written sync.<name> with a name data_describe lists. Correct it and try again.` |
| `QUERY_TOO_LARGE` | "The answer is too large. Aggregate or add LIMIT." |
| `DEADLINE` | "The query took too long. Narrow it." |
| `TABLE_UNAVAILABLE` | "The company's database did not answer. Do not read the system live in its place; tell the person to try again." |
| `CATALOG_UNAVAILABLE` | "The catalog did not answer. Tell the person to try again." |

- **Ids.** Nenhum id novo entra pela borda: o `by` fica para a etapa 3 (decisão 6).
- **Donos.** Os nomes: `DATA_TOOL`. A amostra: `DESCRIBE_SAMPLE_ROWS`. O teto do SQL: `QUERY_SQL_MAX` do contrato. A forma do resultado: `DataOrigin` e `DataResult` em `@conexus/hub-api`; o servidor tira o tipo por `z.infer`. As frases: uma tabela `REASONS` em `tools.ts` (code C26).
- **Esquemas Zod.** `data_describe`: `z.object({ table: z.string().max(40).optional() })`. `data_query`: `z.object({ sql: z.string().trim().min(1).max(QUERY_SQL_MAX) })` (code C27).
- **Arquivo modelo.** `typed-reads.ts` (cumpre C21 e C26; não recebe id de marca, C23 não se aplica).

### As skills e a leitura

`docs/reference/stack.md:20` (`@mastra/core` em `apps/server/src/builder`): a skill `mastra` e
`node_modules/@mastra/core/dist/docs/` primeiro. Para a tela, a linha de `apps/web/src` e o guia
web; `DatabaseIcon` já vem de `lucide-react` (`apps/web/src/builder/conversation/construtor-specs.ts:13`).

### A ordem do trabalho

1. **Os nomes no dono único e no fecho.** Critérios: 20.
   - **Arquivos:** muda `packages/hub-api/src/tools.ts`, `packages/hub-api/src/assistant.ts`, `apps/server/src/builder/conversation/permissions.ts`.
   - **Referência a seguir:** "Os nomes", acima; `ReadCut` para o esquema.
   - **O que sai:** nada.
   - **O que entra:** `DATA_TOOL`, `DESCRIBE_SAMPLE_ROWS`; `BUILDER_TOOL.dataDescribe` e `.dataQuery`; os dois em `READ`; `DataOrigin` e `DataResult` em `assistant.ts`. Regras: code C26, C27.
   - **Testes:** `permissions.test.ts`, "a tela e o Builder nomeiam o mesmo conjunto fechado" (`:259-261`) passa.
   - **Mutações à mão:** tire os dois nomes de `READ`: o caso fica vermelho.
   - **Pronto quando:** `permissions.test.ts` passa no comando do servidor.
2. **As duas ferramentas e a ordem.** Critérios: 10 a 19, 28.
   - **Arquivos:** cria `data-tools/tools.ts`, `order.ts`, `public.ts`, `tools.test.ts`.

   - **Referência a seguir:** "As duas ferramentas" e "A origem e a recusa", acima.
   - **O que sai:** nada.
   - **O que entra:** `dataTools` e `dataOrder`, nos contratos acima. O começo do caminho comum:
     ```ts
     execute: async ({ sql }, { requestContext, abortSignal }) => {
       const data = requestContext === undefined ? undefined : await dataOf(requestContext)
       if (data === undefined) refused({ kind: 'NOT_GRANTED' })   // lança; nunca devolve
     ```
     `data_describe({ table })` confere `table` em `described.tables` antes de `read`, e lança `NOT_IN_CATALOG` sem ler. `data_query` lê, depois descreve, e liga cada conexão de `answer.tables[].kept.connections`, todas, a `systems[].connection`; uma sem par faz `log.error({ table, connection }, 'DATA_ORIGIN_UNREAD')` e lança `CATALOG_UNAVAILABLE` com a frase, sem linha (U2 construiu assim; U2b tira a recusa e o log). `DESCRIBE_DESCRIPTION` e `QUERY_DESCRIPTION` em inglês, no molde de `READ_DESCRIPTION` (`app-data/tools.ts:25`), mandam escrever a tabela como `sync.<name>`, com o nome exatamente como `data_describe` o lista, sem nome concreto de tabela no exemplo (#1108). Regras: code C21, C23, C26, C27, C79; security S41 (o log só com escalares).
   - **Testes:** `tools.test.ts`, os casos dos critérios 10 a 19 e 28 (a tabela de duas conexões com `connections: [lojaA, lojaB]` no `CATALOG` falso, como `copy-list.test.tsx:202-223`; a recusa lida por `assert.rejects` e `JSON.parse` da mensagem), sobre `companyData({ sources, now })` com fontes falsas no molde de `fakeWorld` (`packages/hub-api/src/company-data.test.ts:133-199`), um `log` que guarda as linhas, e `execute` chamado como `runOn` (`apps/server/src/builder/connectors/connector-tools-scope.test.ts:56-58`), importando de `./public.ts` (testing T5, como `connector-tools-scope.test.ts:5-6`).
   - **Mutações à mão:** (a) `DESCRIBE_SAMPLE_ROWS` por `200` no `slice`: o caso do critério 13 fica vermelho. (b) tire o `refused` de `dataOf` indefinido: critério 11. (c) `originOf` usando `String(connections[0])` como nome: critério 17. (d) tire a conferência em `described.tables`: critério 14. (e) ligue só `connections[0]`: critério 28. (f) devolva a recusa em vez de lançá-la: critério 18.
   - **Pronto quando:** `tools.test.ts` passa no comando do servidor.
3. **A pasta no verificador.** Critérios: 21.
   - **Arquivos:** muda `.dependency-cruiser.cjs`, `scripts/rules-doors.test.ts`.
   - **Referência a seguir:** "A pasta", acima; a entrada em `rules-doors.test.ts:28-31`.
   - **O que sai:** em `BAD`, o arquivo da regra `agents-and-apps-reach-data-only-through-the-contract`, hoje `${SRC}/builder/assistant/rows.ts`, troca por `${SRC}/builder/data-tools/x.ts` (`BAD` é `Record<regra, [arquivo, alvo]>`: uma entrada por regra).
   - **O que entra:** `data-tools` na lista de pastas de `AGENTS_AND_APPS`; nada em `CONTRACT_MIGRATION`.
   - **Testes:** `scripts/rules-doors.test.ts`, o caso `BAD` da regra.
   - **Mutações à mão:** tire `data-tools` de `AGENTS_AND_APPS`: o caso fica vermelho.
   - **Pronto quando:** `node scripts/test-run.ts --test-timeout=120000 --test-reporter=./scripts/test-reporter.ts scripts/rules-doors.test.ts` e `npm run deps` passam.
4. **A linha mínima na conversa.** Critérios: 22.
   - **Arquivos:** cria `apps/web/src/builder/conversation/data-specs.ts`; muda `tool-registry.ts`.
   - **Referência a seguir:** "A linha mínima", acima.
   - **O que sai:** nada.
   - **O que entra:** `DATA_SPECS` com, para `data_describe`, `icon: DatabaseIcon`, `running: 'Consultando o catálogo'`, `done: 'Consultou o catálogo'`, `failed: 'Não conseguiu ler o catálogo agora.'`, `verb: 'consultou'`, `body: 'generic'`, `groups: true`; para `data_query`, `running: 'Consultando os dados'`, `done: 'Consultou os dados'`, `failed: 'Não conseguiu ler a tabela agora.'`, o resto igual. `TOOLS` ganha `...DATA_SPECS` ao lado de `...APP_DATA_SPECS`. Regras: web (as do guia que a linha toca).
   - **Testes:** `tool-row.test.tsx`, o caso de `:185`.
   - **Mutações à mão:** tire `...DATA_SPECS`: o `typecheck` recusa (`Record<RowTool, ToolSpec>`).
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/tool-row.test.tsx` passa.

### Como se prova

- 10 a 19 e 28: `execute` sobre o contrato real (`companyData`) com fontes falsas; o 14 e o 19 contam zero chamadas a `rows` e a `query`; o 17 lia `DATA_ORIGIN_UNREAD` no `log` (U2b o reescreve). Hoje falha: a pasta não existe.
- 21: `rules-doors.test.ts` planta o arquivo e roda o verificador; hoje a pasta não está em `AGENTS_AND_APPS` e o caso passaria sem recusar.
- 20 e 22: hoje passam; passam a exigir os nomes e as linhas quando `BUILDER_TOOL` os ganha.

### Parar se

- O PR de U1 não estiver no `main`: o catálogo falso precisaria de `withheld: []`. Pare e espere; não escreva `withheld` em arquivo novo.
- A forma única de `refuse()` pedir que a classe saia de `builder/agents/tools.ts` para um lugar comum: pare e reporte; mover o dono é a issue 1016. Nesta unidade a ferramenta lança o mesmo JSON por um `Error` próprio de `data-tools/`.

- O texto de `C4` pedir outra palavra: reporte; ele não muda.

## U3 A montagem nos três agentes, com a porta na raiz do servidor

**Base e modelo.** O `main` com U2 (mesmo PR, commit anterior). Sonnet: fiação em três lugares
conhecidos, sem desenho novo.

### As linhas da tabela

- **A porta na raiz.** `const data = createCompanyData(...)` em `apps/server/src/main.ts:205-209`, depois de `conversationsOf` (`:158-165`); a chamada tardia de `send` (`:155`); `doorOf` em `apps/server/src/conversations-of.ts:34-48` e o seu uso em `:186-193`; `ConversationsDeps` em `:142-163`.
- **Assistente.** `Deps` em `apps/server/src/builder/assistant/assistant.ts:108-124`; `AVAILABLE_TOOLS` em `:82-97`; `tools` em `:235-250`; `scopeOf` (`:276`, `sessionScopes` em `context.ts:48-58`); `assistantInstructions` em `instructions.ts:44-70`.
- **Builder.** `createBuilder` em `apps/server/src/builder/conversation/builder.ts:104-156` (`data: BuilderData` em `:110`, `admittedFor` em `:55-66`, `grantedFor` em `:41-49`, a chamada de `builderInstructions` em `:126-132`, `tools` em `:140-156`, a ordem fixa em `:144`); `createBuilderConversations` em `public.ts:62-84`; `builderInstructions` em `instructions.ts:28-66`.
- **Agente salvo.** `AgentDeps` em `apps/server/src/builder/agents/agent.ts:112-129`; o `scope` do `plan` em `:203-210`; `neverAsking` em `:224-233`; `runToolsOf` em `:256-305` (o `scope` em `:264`, `ofTheAgent` em `:280-289`, `codeModeOf` em `:290`); as instruções em `:341-352`; `Deps` do controlador em `controller.ts:195-211`.
- **Construtor.** `construtor.ts:197-221`, intocado.
- **O bloco de dados.** `HOW_TO_READ` em `apps/server/src/builder/app-data/context.ts:19-25` (frase em `:22`); `dataContext` vazio sem cópia em `:77-78`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/main.ts` | Muda | `runServer`, o Hub de teste (`test-hub.ts:82`), `main.test.ts` |
| `apps/server/src/conversations-of.ts` | Muda (`ConversationsDeps.companyData`) | `main.ts:158` |
| `apps/server/src/builder/assistant/` | Muda; em `assistant.test.ts`, a lista exata de ferramentas do caso de `:76-112` ganha `data_describe` e `data_query` | `conversations-of.ts:187` |
| `apps/server/src/builder/conversation/` | Muda; em `conversation-tools.test.ts`, as três listas de `:56-73` ganham `data_describe` e `data_query`, na ordem que o caso ordena | `conversations-of.ts:216` |
| `apps/server/src/builder/agents/` | Muda (`AgentDeps`, `Deps` do controlador) | `agents/public.ts:68-75`, `conversations-of.ts:197` |
| `apps/server/src/builder/app-data/context.ts` | Muda (uma frase) | `builder.ts` (`dataFor`) |
| `apps/server/src/builder/data-tools/` | Cria `mounted.test.ts` | — |

### Os contratos que a unidade cria

```ts
// apps/server/src/conversations-of.ts, ConversationsDeps, passado a createAssistant, agentsAlive e createBuilderConversations
companyData: (scope: SessionScope, context?: DataContext) => CompanyData
// main.ts, em conversationsOf({...}):  companyData: (scope, context) => data(scope, context)
```

O nome não é `data`: `createBuilder` já tem `data: BuilderData` (`builder.ts:110`). Cada agente
implementa `DataOf` de U2 só com o escopo; nenhum passa `by` nem `turn` (decisão 6).

### As skills e a leitura

As de U2.

### A ordem do trabalho

1. **A porta.** Critérios: 27.
   - **Arquivos:** muda `main.ts`, `conversations-of.ts`.
   - **Referência a seguir:** `main.ts:155`, `:162`; `conversations-of.ts:186-193`.
   - **O que sai:** nada.
   - **O que entra:** `companyData` em `ConversationsDeps`, passado aos três; em `main.ts`, a chamada tardia ao `data` de `:205`. Regras: code C4.
   - **Testes:** o caso do critério 27 (passo 3).
   - **Mutações à mão:** passe `{ ...scope, place: { kind: 'COMPANY' } }` no Builder: o caso do critério 27 fica vermelho.
   - **Pronto quando:** `npm run typecheck` passa.
2. **Os três agentes e a frase.** Critérios: 23, 24, 25, 26.
   - **Arquivos:** muda `assistant.ts`, `assistant/instructions.ts`, `assistant/assistant.test.ts`, `conversation/builder.ts`, `conversation/public.ts`, `conversation/instructions.ts`, `conversation/conversation-tools.test.ts`, `agents/agent.ts`, `agents/controller.ts`, `app-data/context.ts`.
   - **Referência a seguir:** as linhas acima.
   - **O que sai:** em `HOW_TO_READ` (`context.ts:22`), "and see a few rows with `app_data_read`; the Project app".
   - **O que entra:** no Assistente, `dataOf` por `scopeOf(requestContext)`, `...dataTools({ dataOf, log: deps.log })` depois de `assistantConnectorTools`, `...Object.values(DATA_TOOL)` em `AVAILABLE_TOOLS`, `{ role: 'system', content: dataOrder() }` depois de `fixedSystem(FIXED)`. No Builder, `dataOf` por `admitted` e `granted`:
     ```ts
     const ids = await admitted(requestContext)
     if (ids === undefined) return undefined
     const chosen = (await granted(requestContext)).map((each) => each.connectionId)
     return deps.companyData({ companyId: ids.companyId, personId: ids.personId,
       place: { kind: 'PROJECT', projectId: ids.projectId }, chosen })
     ```
     com `...dataTools(...)` no fim do objeto (a ordem de `:144` muda só no fim) e `${dataOrder()}` num bloco próprio depois de `fillPrompt`, fora de `dataContext`. No agente salvo, `...dataTools({ dataOf: async () => deps.companyData(scope), log: deps.log })` dentro de `neverAsking` de `ofTheAgent`, e `dataOrder()` depois de `fixedSystem(FIXED)`. A frase nova de `HOW_TO_READ`: "Count a read on the real data with `app_data_check`, and see the columns and a few rows of a copy with `data_describe`, in the order of `## Company data`; the Project app reads the same table through `db`. A copy has no row count here: ask `app_data_check`." Regras: code C26; decisão `L2` (o arquivo fica na lista).
   - **Testes:** `mounted.test.ts`, os casos dos critérios 23 a 26: o Assistente por `assisting` (`apps/server/src/builder/assistant/test-assistant.ts:74`), o Builder por `conversing` (`apps/server/src/builder/conversation/test-conversation.ts:55`, como `apps/server/src/builder/app-data/access.test.ts:37-55`), o agente salvo por `agentsOn` (`apps/server/src/builder/agents/test-agents.ts:55`), o Construtor pelo seu teste; cada um lê a primeira chamada ao dublê (`Sent`, `apps/server/src/platform/test-anthropic-body.ts:9-40`: `tools`, `descriptions`, `schemas`, `system`). O Projeto com cópia por `releasing` (`apps/server/src/hub/copies/test-released.ts:49`). `context.test.ts` (o caso de `:126`) e `permissions.test.ts` continuam passando.
   - **Mutações à mão:** (a) tire `...Object.values(DATA_TOOL)` de `AVAILABLE_TOOLS`: critério 23 (o controlador tira a ferramenta). (b) tire `...dataTools(...)` de `runToolsOf`: critério 23. (c) mova `dataOrder()` do Builder para dentro de `dataContext`: critério 25. (d) volte a frase antiga: critério 26.
   - **Pronto quando:** `mounted.test.ts`, `permissions.test.ts`, `context.test.ts`, `assistant.test.ts`, `conversation-tools.test.ts` e `instructions.test.ts` passam; se uma contagem de mensagens de sistema mudar com `dataOrder()`, o caso ganha a mensagem nova, com a razão.
3. **A porta provada de ponta a ponta.** Critérios: 27, 29.
   - **Arquivos:** muda `mounted.test.ts`.
   - **Referência a seguir:** `stepped` (`apps/server/src/builder/conversation/test-questions.ts:57-72`) com uma chamada `data_describe` e depois "Pronto."; o resultado em `Sent.toolResults` (`test-anthropic-body.ts:37-38`).
   - **O que sai:** nada.
   - **O que entra:** o caso "data_describe responde o catálogo do lugar: o Início lista a cópia da empresa, o Projeto só a liberada": a empresa com duas cópias, uma liberada ao Projeto; o dono no Assistente lê as duas em `tables`; o Builder e o agente salvo do Projeto leem só a liberada. E o caso "o agente salvo usado por um membro lê o catálogo do Projeto, como o autor": o agente publicado pelo dono, usado por um membro do Projeto, lê em `tables` só a cópia liberada.
   - **Testes:** os dois casos.
   - **Mutações à mão:** a do passo 1; no agente salvo, passe `{ ...scope, place: { kind: 'COMPANY' } }`: o membro, sem `readCopyRows`, recebe `tables` vazia (`catalog.ts:20-22`) e o caso do critério 29 fica vermelho.

   - **Pronto quando:** o caso passa no comando do servidor.

### Como se prova

- 23 a 26: um turno de cada agente com o dublê de modelo pela porta HTTP do Hub de teste (testing T5); a prova é o corpo que o servidor mandou ao modelo. Hoje falha: nenhum dos três oferece as duas.
- 27: o resultado da ferramenta que o servidor devolveu ao modelo, com o catálogo do lugar, lido pelo login de leitura real no banco de teste. Hoje falha: `companyData` não chega aos agentes.
- O modo código (as duas dentro do programa do agente salvo) é efeito aceito, sem critério: o `dispatch` do Mastra chama o mesmo `execute` (`@mastra/core@1.82.0 dist/tools-BVDic2bB.js:478-485`).

### Parar se

- `agentsOn` não conseguir rodar o agente salvo como um membro que não é o autor (critério 29): faça o caso com o dono, reporte o que falta no ajudante, e não monte o escopo à mão.
- `agentsOn` não conseguir um agente salvo num Projeto com cópia liberada para o critério 27: faça o caso com o Assistente e o Builder e reporte o que falta no ajudante; não crie um ajudante de teste fora de `test-*.ts`.
- O Construtor passar a receber as duas por algum caminho (o `toolsOf` dele é outro, `construtor.ts:197-221`): pare; o Construtor está congelado.

## G2 O ponto de conferência

Rode os testes dos passos das duas unidades, mais `assistant.test.ts` e `conversation-tools.test.ts`; depois
 `npm run deps` e
`npm run check`. Passos 6 e 7 de `conexus-build`: `npm run build -w @conexus/server`
e um turno do Assistente com o dublê, que mostra `data_describe` e `data_query` em `Sent.tools` e o
resultado `CATALOG` de uma chamada; pstack `deslop` e `no-comments`; as mutações das duas unidades
feitas e desfeitas, com o resultado no PR (testing T27). O PR cita delivery L1 e L27 (a trilha
Dados lê a mudança de `packages/hub-api/src/tools.ts`).

## U2b A origem pelo registro gravado da cópia, e os fechamentos de G2

**Base e modelo.** O `main` em `b2c23dc0`, com G2 mesclado (PR 1095, merge `f1067f05`); cada linha
abaixo foi lida nesse commit, com `@mastra/core` 1.82.0. Sonnet: um campo de contrato trocado, os
seus leitores migrados na mesma onda e uma leitura nova ao lado de uma que já existe; o `typecheck`
aponta cada leitor.

### As linhas da tabela

- **A origem de cada tabela.** `TableKept` em `packages/hub-api/src/company-data.ts:34-42` (o campo em
  `:37`) e `keeps` em `:234-242`; `CopySource` em `packages/hub-api/src/copy-shown.ts:5-9`, já a forma
  de `CopySummary.sources` (`packages/hub-api/src/copies.ts:79`), escrita por `sourcesNamed`
  (`apps/server/src/hub/copies/store.ts:227-243`) e lida na página da tabela
  (`apps/web/src/hub/copies/copy-facts.tsx:75-77`); `catalogTables` com `named` em
  `apps/server/src/hub/copies/catalog-view.ts:24-57` (o campo escrito em `:50`); o catálogo de cada
  lugar em `catalogOf` (`apps/server/src/hub/data/catalog.ts:7-30`), que já separa o Projeto (`:18-19`)
  do Início (`:20-22`); as conexões de um lugar em `offeredIn`
  (`apps/server/src/hub/connectors/builder-port.ts:139-169`), só as `ACTIVE` (`usable`,
  `hub/connectors/rows.ts:72`), e `catalogSystemsOf` (`hub/connectors/catalog-systems.ts:12-30`); o
  estado em `Connection.state` (`packages/hub-api/src/connectors.ts:86`); na ferramenta, `originIn` e
  `originOf` em `apps/server/src/builder/data-tools/tools.ts:81-112`, `listed` em `:128-143`, `tabled`
  em `:145-160`, `queried` em `:162-181`, as descrições em `:114-118`; `DataOrigin` em
  `packages/hub-api/src/assistant.ts:101-107`.
- **A recusa com frase ao modelo.** Só a frase de `NOT_IN_ROLE`, `tools.ts:27-28`.
- **A linha mínima na conversa.** Só o Fechamento 6 da revisão de G2: `...DATA_SPECS` dentro de
  `APP_DATA_SPECS` (`apps/web/src/builder/conversation/app-data-specs.ts:18-25`), porque
  `tool-registry.ts` está no teto de 300 linhas que o Biome conta (`biome.json:64-69`; uma linha a
  mais dá "too many lines (301)"); as entradas das ferramentas da máquina em `tool-registry.ts:31-43`
  (os nomes) e `:48-156` (as entradas).

### O raio da mudança

Os leitores saem do `tsc` com o campo trocado, medido em `b2c23dc0`. Na produção são sete:
`company-data.ts:241`, `company-data-conformance.ts:49`, `:121`, `:141` e `:179`, `catalog-view.ts:50`
(quem escreve) e `data-tools/tools.ts:89`. Nos testes, `catalog-view.test.ts:32` e `data.test.ts:100`,
e quatro montagens que só o Zod lê: `company-data.test.ts:69-72`, `:96-99`, `:110-113` e
`data-tools/test-world.ts:22-30`. `builder/assistant/context.ts:36` e `handoff.ts:303` leem
`connections` de outro tipo, a escolha da conversa (`context.ts:23`), e ficam como estão. Sem o log
`DATA_ORIGIN_UNREAD`, o `log` de `dataTools` (`tools.ts:184`) fica sem uso, e os três chamadores
deixam de passá-lo: `builder/agents/agent.ts:273`, `builder/assistant/assistant.ts:263` e
`builder/conversation/builder.ts:178-181` (code C74).

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/company-data.ts` (o contrato de G1) | Cria `KeptSource`; muda `TableKept` (`connections` vira `sources`) e `keeps` | a conformidade, `catalog-view.ts`, `data-tools/tools.ts`; a issue `contrato` (L1) e as duas trilhas (L27) |
| `packages/hub-api/src/company-data-conformance.ts`, `company-data.test.ts` | Muda as quatro leituras e as montagens do `CATALOG` falso (`:69-72`, `:96-99`, `:110-113`, `:206`) | `runDataConformance`, `npm test -w @conexus/hub-api` |
| `packages/hub-api/src/assistant.ts` | Cria `DataSystem`; muda `DataOrigin.systems` | `data-tools/tools.ts`; G3 (U4, U5, U6) |
| `apps/server/src/hub/connectors/` | Cria `catalogSourcesOf` em `catalog-systems.ts`; muda `public.ts` (a porta `catalogSources`, ao lado de `catalogSystems`, `:165-166`) | `catalogOf` |
| `apps/server/src/hub/data/` | Muda `catalog.ts` (passa o que o lugar nomeia a `catalogTables`), `deps.ts:14` (a porta) e `data.test.ts` (`:100` e o caso do critério 104) | o comando do servidor |
| `apps/server/src/hub/copies/catalog-view.ts` e `catalog-view.test.ts` | Muda `catalogTables` (a entrada e `:50`) e a asserção de `:32` | `catalogOf` |
| `apps/server/src/builder/data-tools/` | Muda `tools.ts`, `test-world.ts`, `tools.test.ts`, `mounted.test.ts`; renomeia `tools-failures.test.ts` para `tools-refusals.test.ts` | os três agentes (U3) |
| `agent.ts:273`, `assistant.ts:263`, `builder.ts:178-181` | Muda (tira `log`, uma linha cada; declarado no PR, L7) | os três agentes |
| `scripts/rerun-never.json` | Muda (uma linha) | `scripts/rerun-exempt.test.ts:36-46` |
| `apps/web/src/builder/conversation/` | Cria `workspace-specs.ts`; muda `tool-registry.ts` e `app-data-specs.ts` | `TOOLS` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/company-data.ts, ao lado de TableKept
/** One connection a table was copied from, as the place that reads it may name it. */
export const KeptSource = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NAMED'), connection: CopySource.shape.connection, state: z.enum(CONNECTION_STATES) }),
  z.object({ kind: z.literal('NOT_GIVEN'), connector: ConnectorId }), // a Projeto's copy of a connection it was not given
])
// TableKept, no lugar de connections: ConnectionId[]
sources: z.array(KeptSource).min(1),

// packages/hub-api/src/assistant.ts, ao lado de DataOrigin
export const DataSystem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NAMED'), name: z.string(), state: z.enum(CONNECTION_STATES) }),
  z.object({ kind: z.literal('NOT_GIVEN') }),
])
// DataOrigin.systems: z.array(DataSystem).min(1); o resto de DataOrigin fica como está

// apps/server/src/hub/connectors/catalog-systems.ts, ao lado de catalogSystemsOf
/** The state of each connection the scope's place was given, in any state; admits nobody. */
export async function catalogSourcesOf(tx: ReadTx, scope: SessionScope): Promise<ReadonlyMap<ConnectionId, ConnectionState>>
```

- **Quem decide o nome é o catálogo do lugar.** `catalogOf` (`catalog.ts:16-22`) já monta o catálogo
  com o lugar da conversa. Ele lê `catalogSources(tx, scope)` e passa o mapa a `catalogTables`
  (`catalogTables(tx, { companyId, only, given })`). No Início, o mapa traz toda conexão da empresa;
  num Projeto, só as de `project_connection`, como `offeredIn`, mas sem `usable`. `catalogTables`
  grava cada fonte como `NAMED`, com a conexão de `CopySource` e o estado, quando o id está no mapa,
  e como `NOT_GIVEN`, com o conector, quando não está. `DataOf` não muda (`tools.ts:10`).
- **A regra da origem na ferramenta.** Para cada fonte de `kept.sources`, na ordem: `NAMED` vira
  `{ kind: 'NAMED', name: connection.name, state }`; `NOT_GIVEN` vira `{ kind: 'NOT_GIVEN' }`.
  `connector` é o da primeira fonte. A ferramenta não olha `systems` para a origem: só diz o que
  `kept` traz. Uma função pura, sem recusa e sem log.
- **As frases.** `NOT_IN_ROLE` passa à frase da tabela de U2. `DESCRIBE_DESCRIPTION` e
  `QUERY_DESCRIPTION` ganham: "Each system says its state: a state other than ACTIVE means the rows
  are its last copy, so say it and when the rows were copied. A system NOT_GIVEN is a connection this
  place was not given: name only its connector."
- **Estados.** `NAMED` e `NOT_GIVEN` são uniões com `kind` (C21). **Ids.** Nenhum novo pela borda;
  o id de uma fonte `NOT_GIVEN` não sai do Hub. **Donos.** A conexão gravada é `CopySource` (C26);
  o que um lugar nomeia, `catalogSourcesOf`; a forma do resultado continua em `assistant.ts`.
  **Esquemas Zod.** Os de U2, sem mudança. **Arquivo modelo.** `tools.ts` de U2;
  `catalogSystemsOf` para a leitura nova.

### As skills e a leitura

As de U2, mais as linhas de `zod` e `drizzle-orm` em `docs/reference/stack.md:34` e `:41`, e testing T4, T5, T27.

### A ordem do trabalho

1. **O contrato, quem o escreve e a conformidade.** Critérios: 17 (a parte do contrato), 104.
   - **Arquivos:** muda `company-data.ts`, `company-data-conformance.ts`, `company-data.test.ts`, `catalog-systems.ts`, `connectors/public.ts`, `data/catalog.ts`, `data/deps.ts`, `data.test.ts`, `catalog-view.ts`, `catalog-view.test.ts`.
   - **Referência a seguir:** "A origem de cada tabela", acima; `sourcesNamed` como a forma da conexão; `offeredIn` como a forma da leitura por lugar.
   - **O que sai:** `connections: z.array(ConnectionId).min(1)` (`company-data.ts:37`); `named.map(({ connection }) => ConnectionId.parse(connection.id))` (`catalog-view.ts:50`).
   - **O que entra:** `KeptSource`, `sources`, `catalogSourcesOf` e a porta; `catalogOf` passa o mapa; `catalogTables` grava `NAMED` ou `NOT_GIVEN`. Em `keeps` e na conformidade, a busca pelo id passa às fontes `NAMED` (`:49` e `:141` tomam a primeira fonte `NAMED`). Regras: code C8, C21, C26, C27.
   - **Testes:** `npm test -w @conexus/hub-api` (as 22 leis passam); `catalog-view.test.ts:32` confere a fonte `NAMED` com o id, o nome, o conector e `ACTIVE`; o caso do critério 104 em `data.test.ts` (o Início com a conexão em `NEEDS_REAUTH` pelo `on.hub.test.asOwner`, e o Projeto com a cópia da Filial liberada).
   - **Mutações à mão:** (a) em `catalogTables`, toda fonte `NAMED`: o 104 fica vermelho ("Filial" no Projeto). (b) `catalogSourcesOf` com `usable`: o 104 fica vermelho (a fonte em `NEEDS_REAUTH` vira `NOT_GIVEN` no Início).
   - **Pronto quando:** os testes passam, e o `typecheck` só acusa `data-tools/tools.ts` (passo 2).
2. **A ferramenta diz o que `kept` traz.** Critérios: 15, 17, 18 (a frase de `NOT_IN_ROLE`), 28.
   - **Arquivos:** muda `assistant.ts`, `data-tools/tools.ts`, `test-world.ts`, `tools.test.ts`, e uma linha em `agent.ts`, `assistant/assistant.ts` e `conversation/builder.ts`.
   - **O que sai:** `originIn` e `originOf` (`tools.ts:81-112`), o log `DATA_ORIGIN_UNREAD` (`:92`), o `flatMap` que tira a tabela sem par (`:136-141`), o `log` de `dataTools` (`:184-185`) e dos três chamadores; os casos `tools.test.ts:115-133` e `:135-147`.
   - **O que entra:** a regra da origem acima; `listed` volta a `map`; as duas frases nas descrições. `table()` de `test-world.ts` monta `sources` com `KeptSource`; `FORA` vira uma fonte `NOT_GIVEN` de uma conexão com o nome "Loja Fora", para provar que o nome não sai; os casos do critério 17, com uma fonte `NAMED` em `NEEDS_REAUTH`, uma `NOT_GIVEN` e a cópia de `[LOJA_A, FORA]` (o Fechamento B do delta de G2); o 15 e o 28 com a forma nova. Regras: code C21, C26, C74, C79; security S41.
   - **Mutações à mão:** (a) toda fonte vira `NAMED` com `state: 'ACTIVE'`: o 17 fica vermelho. (b) a recusa `CATALOG_UNAVAILABLE` de volta em `tabled`: 17. (c) só a primeira fonte: 28. (d) a frase antiga de `NOT_IN_ROLE`: 18. (e) tire de `QUERY_DESCRIPTION` a frase do estado: o caso "as duas descrições" fica vermelho.
   - **Pronto quando:** `tools.test.ts` e `tools-refusals.test.ts` passam no comando do servidor.
3. **De ponta a ponta pela porta da raiz.** Critérios: 100, 101.
   - **Arquivos:** muda `mounted.test.ts`.
   - **Referência a seguir:** o caso de hoje em `mounted.test.ts:160-170` (a conexão em `NEEDS_REAUTH` por `on.hub.test.asOwner`); `agentsOn` dá a Matriz ao Projeto e não a Filial (`apps/server/src/builder/agents/test-agents.ts:50-66`, `on.filial` em `apps/server/src/builder/assistant/test-assistant.ts:137`); `releasing(t, on, { connectionId: on.filial }, ['vendas'])` libera a cópia da Filial ao Projeto (`apps/server/src/hub/copies/test-released.ts:49-92`), sem conferir a conexão (`hub/copies/grants.ts:74-99`).
   - **O que entra:** o caso de `:160-170` reescrito para o critério 100, no Início, com uma chamada `data_query` depois da lista; o caso do critério 101, pelo Builder.
   - **Mutações à mão:** a (a) do passo 1: o 101 fica vermelho ("Filial" aparece). A (b) do passo 1: o 100 fica vermelho (a fonte perde o nome no Início).
   - **Pronto quando:** `mounted.test.ts` passa com o Postgres de teste.
4. **Os fechamentos de G2.** Critérios: 102, 103.
   - **Arquivos:** renomeia `tools-failures.test.ts` para `tools-refusals.test.ts`; muda `scripts/rerun-never.json`; cria `apps/web/src/builder/conversation/workspace-specs.ts`; muda `tool-registry.ts`, `app-data-specs.ts`.
   - **O que sai:** de `tool-registry.ts`, os nomes de `:31-43` e as entradas de `:48-156`; de `app-data-specs.ts`, `...DATA_SPECS`, o tipo `typeof DATA_SPECS &` e a frase do comentário sobre o limite (`:18-25`).
   - **O que entra:** o Fechamento A (o nome de volta e a linha em `rerun-never.json`); o Fechamento 6 (`WORKSPACE_SPECS` em `workspace-specs.ts`, e `TOOLS` com `...WORKSPACE_SPECS` e `...DATA_SPECS`); o Fechamento C (o corpo deste PR traz a linha que faltou na tabela de commits do PR 1095, o `2a8255db`, e um comentário no PR 1095 aponta para ela).
   - **Mutações à mão:** tire a linha de `rerun-never.json`: `rerun-exempt.test.ts` fica vermelho. Tire `...DATA_SPECS` de `TOOLS`: o `typecheck` recusa (`Record<RowTool, ToolSpec>`).
   - **Pronto quando:** `rerun-exempt.test.ts`, `tool-row.test.tsx` e `npm run check` passam.

### Como se prova

- 104: `describe` pelo Hub de teste, no Início e num Projeto; hoje `kept` só traz o id.
- 15, 17 e 28: `execute` sobre o contrato real (`companyData`) com fontes falsas; hoje o 17 falha,
  porque a tabela de `FORA` dá `CATALOG_UNAVAILABLE` e sai da lista.
- 100 e 101: um turno pelo Hub de teste e o resultado que o servidor devolveu ao modelo, lido pelo
  login de leitura no banco de teste; hoje os dois dão `tables` vazia.
- 102 e 103: o verificador da lista e o Biome; hoje o nome do arquivo foge da lista e
  `DATA_SPECS` está fora de `TOOLS`.

### Parar se

- O `typecheck` acusar um leitor fora da lista acima: migre-o no mesmo commit e declare no PR (L7);
  se ele estiver numa pasta de outra unidade em construção, pare e reporte.
- A trilha Dados recusar o contrato e o seu leitor num PR só: pare; é a decisão 29.
- `catalogOf` não conseguir ler `catalogSources` na mesma transação de `catalogSystems`: pare; não
  abra uma segunda transação.
- `releasing` não conseguir liberar ao Projeto a cópia da Filial: reporte o que falta no ajudante; não
  grave a linha de liberação à mão.
- A divisão de `tool-registry.ts` pedir mover mais que as entradas das ferramentas da máquina: pare.

## G2b O ponto de conferência

Comando de `hub-api`: `npm test -w @conexus/hub-api`. Comando do servidor, depois de `npm ci` e
`npm run build -w @conexus/server`: `apps/server/src/hub/copies/catalog-view.test.ts`,
`apps/server/src/hub/data/data.test.ts`, `apps/server/src/builder/data-tools/tools.test.ts`,
`tools-refusals.test.ts` e `mounted.test.ts` (Postgres de teste), e
`apps/server/src/builder/agents/agent-read.test.ts`. Depois `scripts/rerun-exempt.test.ts`,
`npm run test:unit -w @conexus/web -- src/builder/conversation/tool-row.test.tsx`, `npm run typecheck`,
`npm run deps` e `npm run check`. Passos 6 e 7 de `conexus-build`: pstack `deslop` e `no-comments`;
as mutações dos quatro passos feitas e desfeitas, com o resultado no PR (testing T27). O PR cita a
issue `contrato`, delivery L1 e L27, e a decisão 29.

## U4 O `at` da leitura ao vivo, os cenários `data-query` e `reads`, e as perguntas com resposta conhecida

**Base e modelo.** O `main` com o PR do G1 (o contrato sem `withheld`), o do G2 (U2 e U3: `apps/server/src/builder/data-tools/` e a linha mínima de `data-specs.ts`) e o do G2b (U2b: a origem com `DataSystem`). O PR 1082 já está em `5d02e643`. Sonnet: um campo, um cenário no molde dos outros e uma lista de perguntas, sem desenho entre módulos.

### As linhas da tabela

- A hora da leitura ao vivo: `readOn`, `apps/server/src/builder/connectors/connector-tools.ts:218-235`. O OK sem `whole` volta em `:230`; com `whole`, o corte volta sem máquina em `:232` e pela máquina em `:234` (`saveWhole`, `:146-165`). A leitura tipada passa por aqui (`typed-reads.ts:119`), e `connector_read` também (`connector-tools.ts:267`).
- O cenário gravado: `Scenario` `scripts/record.ts:82-95`, `CALLS` `:133-143`, `asked` `:146-152`, `RECORDED_TOOLS` `:238-258` (o `connector_read` inventado devolve o OK em `:256`); `READS_PROMPT`/`READS_CALLS` em `scripts/record-calls.ts:18-40`; `nativeRecording` em `apps/server/src/platform/test-recordings.ts:77-89`; as listas `NATIVE` (`apps/server/src/platform/recordings.test.ts:57`) e `STREAMED` (`:76`); `recordedPart` e `SubagentPart` em `apps/web/src/builder/conversation/test-recorded.ts:127-161`.
- As perguntas: `Data` em `apps/server/src/builder/assistant/test-scorecard.ts:27`, `Question` `:32-45`, `failed` `:169-178`, `judged` `:211-227`; `shows` em `test-truths.ts:249`; o caso das 27 em `assistant.scorecard.test.ts:62-80` e o do modelo real em `:82-127`; o dublê de modelo `reader()` em `assistant.eval.test.ts:45-77`; `soldBy` e `PADARIA_SOL_MATRIZ` em `packages/connectors/src/sankhya/fake-sales.ts:79-109`, `PARCEIROS` `:29-34`, `VLRNOTA` por nota `:150-161`; `asSync` em `apps/server/src/hub/copies/test-copies.ts:249`; `releasing` em `apps/server/src/hub/copies/test-released.ts:49-92`; a rodada parcial pelo teto de páginas em `apps/server/src/hub/copies/run.test.ts:117-122` (`runPages: 2`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/connector-tools.ts` | Muda `readOn` | `typed-reads.ts:119`, `connector-tools.ts:267` |
| `packages/hub-api/src/assistant.ts` (`ReadCut`) | Muda | `apps/web/src/builder/conversation/connector-specs.ts` (`readOutcome`), U6 |
| `scripts/record.ts`, `scripts/record-calls.ts` | Muda | `npm run record` |
| `apps/server/src/platform/recordings/mastra/` | Cria `data-query.jsonl`, regrava `reads.jsonl` | `recordings.test.ts`, `numbers.test.ts:15`, os testes de tela da U5 e da U6 |
| `apps/server/src/platform/recordings.test.ts` | Muda `NATIVE` e `STREAMED` | o comando do servidor |
| `apps/server/src/builder/data-tools/test-data.ts` | Cria | `scripts/record.ts` |
| `apps/server/src/builder/assistant/test-scorecard.ts`, `assistant.scorecard.test.ts` | Muda | o comando do servidor |
| `apps/web/src/builder/conversation/test-recorded.ts` | Cria `DataPart` | U5, U6 |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/assistant.ts
export const ReadCut = z.object({ kind: z.literal('OK'), value: …, complete: …, empty: …,
  /** When the answer came back, for the screen's "lido agora, às". */
  at: z.iso.datetime().optional() })

// apps/server/src/builder/data-tools/test-data.ts (ajudante de teste; conteúdo inventado, security S40)
export function recordedData(): CompanyData

// scripts/record-calls.ts
export const DATA_QUERY_PROMPT: string
export const DATA_QUERY_CALLS: Block[][]

// apps/web/src/builder/conversation/test-recorded.ts
export const DataPart: z.ZodType  // tool-invocation em 'result' de data_describe ou data_query

// apps/server/src/builder/assistant/test-scorecard.ts
export type Data = 'SV' | 'SC' | 'ML' | 'AQ' | 'PL' | 'WEB' | 'CP' | 'none'
export type CopyQuestion = Readonly<{ n: `c${1|2|3|4|5|6}`; text: string; asks: 'OWNER' | 'BUILDER';
  tables: readonly string[]; truth: () => number | string | null; partial?: true; released?: readonly string[] }>
export const COPY_QUESTIONS: readonly CopyQuestion[]
export function judgedCopy(asked: CopyQuestion, parts: readonly MastraMessagePart[]): boolean
```

- **Estados.** `at` existe só no OK (o `kind` separa). `CopyQuestion.asks` separa quem pergunta (C21).
- **Ids.** Nenhum id novo; a tabela é o nome do catálogo.
- **Donos.** O nome das ferramentas é `DATA_TOOL` (U2, `packages/hub-api/src/tools.ts`); o número esperado é do dublê (`soldBy`), nunca do teste (C26).
- **Esquema de entrada externa.** `ReadCut` é o esquema da tela para o resultado guardado (C27).
- **Arquivo modelo.** `test-recorded.ts` (`SubagentPart`): cumpre C21 e C26.

### As skills e a leitura

`mastra` (Skill; `@mastra/core` 1.82.0, `node_modules/@mastra/core/dist/docs/`), linha de `apps/server/src/builder` em `docs/reference/stack.md:20`; `ai` em `scripts` (`stack.md:31`). Ler primeiro `scripts/record.ts:1-16` e testing T24, T26, T28.

### A ordem do trabalho

1. **O `at` em `readOn`.** Critérios: 30.
   - **Arquivos:** muda `connector-tools.ts`, `assistant.ts`, `connector-tools-scope.test.ts`.
   - **Referência a seguir:** `connector-tools.ts:228-234`.
   - **O que sai:** nada.
   - **O que entra:** depois de `access.read`, `const at = new Date().toISOString()`; os três retornos de OK (`:230` sem `whole`, `:232`, `:234`) levam `{ ...cut, at }`, e `saveWhole` recebe o corte já com `at`. `ReadCut` ganha `at` opcional. Regras: C79, S41 (o `at` não entra em log).
   - **Testes:** "uma leitura OK leva a hora em que voltou", com e sem `whole`, no molde de `connector-tools-scope.test.ts:30-58`; e uma recusa sem `at`.
   - **Mutações à mão:** tire o `at` do retorno de `:230`: o caso sem `whole` fica vermelho.
   - **Pronto quando:** `connector-tools-scope.test.ts` passa no comando do servidor.
2. **O ajudante e o cenário `data-query`.** Critérios: 31.
   - **Arquivos:** cria `test-data.ts`; muda `record.ts`, `record-calls.ts`, `recordings.test.ts`, `test-recorded.ts`; gera `data-query.jsonl`.
   - **Referência a seguir:** `scripts/record.ts:82-152`, `:238-258`; `record-calls.ts:18-40`.
   - **O que sai:** nada.
   - **O que entra:** `recordedData()` é `companyData({ now, sources })` sobre um `CATALOG` com as cinco tabelas `sankhya_*` dos modelos de cópia, sistema "Matriz", conector `sankhya`, última rodada completa terminada às 08:45 de 2026-11-14; `rows` com 6 notas de `PADARIA_SOL_MATRIZ` (`complete: false`); `query` com `{ kind: 'ROWS', columns: ['total'], rows: [[TOTAL_OUTUBRO]], complete: true, used: ['sankhya_vendas'] }`, `TOTAL_OUTUBRO` somado de `soldBy(PADARIA_SOL_MATRIZ, '2026-10')`; `live` e `funnel` `NOT_GRANTED`. Nenhuma lista `withheld`. `DATA_QUERY_PROMPT = 'Quanto a Padaria Sol vendeu em outubro de 2026?'`, e `DATA_QUERY_CALLS` com quatro chamadas: `data_describe {}`, `data_describe { table: 'sankhya_vendas' }`, `data_query { sql: OCTOBER_SQL }` e o texto com o número. `RECORDED_TOOLS` ganha `...dataTools({ dataOf: async () => recordedData(), log })` de `apps/server/src/builder/data-tools/public.ts`; `'data-query'` entra em `Scenario`, `CALLS`, `asked` e no comentário de `:2`; `NATIVE` e `STREAMED` ganham `'data-query'`. `DataPart` no molde de `SubagentPart`.
   - **Testes:** `recordings.test.ts` (cabeçalho e `LEAK`) e o caso novo do critério 31, que lê a versão de `node_modules/@mastra/core/package.json` e a compara com a do cabeçalho de `data-query` e de `reads`, e acha nas partes de `data-query` os resultados `CATALOG`, `TABLE` e `ROWS` com `origin`.
   - **Mutações à mão:** tire `'data-query'` de `NATIVE`: o caso fica vermelho pela lista do diretório. Troque `1.82.0` por `1.79.0` no cabeçalho de `reads.jsonl`: o caso novo fica vermelho. Tire o `origin` do `ROWS` gravado: o caso novo fica vermelho.
   - **Pronto quando:** `npm run record -- data-query` grava sem `LEAK`, e o arquivo guarda os quatro passos com o resultado real.
3. **O `reads` regravado.** Critérios: 30, 31.
   - **Arquivos:** muda `record.ts`; regrava `reads.jsonl`.
   - **O que entra:** o `connector_read` inventado (`:256`) devolve `{ kind: 'OK', value, complete: true, at: new Date().toISOString() }`.
   - **Testes:** `recordings.test.ts`; `numbers.test.ts` passa sem mudança.
   - **Pronto quando:** `npm run record -- reads` grava com cabeçalho 1.82.0 e o resultado de `connector_read` tem `at`.
4. **As perguntas do dado copiado.** Critérios: 32, 33, 34, 35.
   - **Arquivos:** muda `test-scorecard.ts`, `assistant.scorecard.test.ts`.
   - **Referência a seguir:** `test-scorecard.ts:169-227`; `assistant.eval.test.ts:45-77`; `assistant.scorecard.test.ts:82-127`.
   - **O que entra:** `COPY_QUESTIONS` com c1 a c6 como a parte 3, `tasks.md:499-504` (c1 "Quanto vendi em outubro?", `sankhya_vendas`; c2 clientes ativos, `sankhya_clientes`, contagem de `ATIVO = 'S'` e `CLIENTE = 'S'`; c3 vendedor do mês, `sankhya_vendas` e `sankhya_vendedores`; c4 comissão, nenhuma tabela; c5 c1 com a última rodada parcial e `/incomplet|parcial/i`; c6 o Builder no Projeto, `sankhya_clientes` e nenhuma outra). `failed` (`test-scorecard.ts:170-178`) guarda a regra do `noToolErrors` (`:172-175`, a mesma de `isErrorInvocation` em `@mastra/evals@1.10.11 dist/checks-DXG9awTJ.js:344-345`), e a cláusula da recusa devolvida como resultado (`:176`, um `kind` diferente de `OK`) passa a valer só para um resultado que `DataResult` não lê: `CATALOG`, `TABLE` e `ROWS` passam em `DataResult`, e a recusa de uma ferramenta de dado já conta, por `output-error`, porque é lançada (U2). Nenhum nome de ferramenta em `failed` (decisão 31). `judgedCopy`: chamou `data_query` (menos c4 e c6), as tabelas de `origin` do último `data_query` são `asked.tables`, e o texto mostra o número por `shows`. Regras: T28 (o dublê compõe a resposta com o número do resultado), T5.
   - **Testes:** os quatro casos da coluna de teste dos critérios 32 a 35; o turno pelo Assistente de `assisting`, com as cópias de `releasing(t, ..., ['vendas', 'vendedores', 'clientes'], [])`.
   - **Mutações à mão:** tire a conferência por `DataResult` em `failed`: o caso que julga certo fica vermelho; não confira as tabelas em `judgedCopy`: o turno com `sankhya_clientes` para c1 passa a certo e o caso negativo fica vermelho.
   - **Pronto quando:** `assistant.scorecard.test.ts` passa, e o caso do modelo real pula com `opt-in:`.

### Como se prova

- 30: `connector-tools-scope.test.ts` chama a ferramenta pela porta de `connectorTools` e lê o resultado; hoje o resultado não tem `at`.
- 31: `recordings.test.ts` lê o diretório, cada cabeçalho, a versão instalada e as partes de `data-query`; hoje `data-query.jsonl` não existe e `reads.jsonl` diz 1.79.0. A parada na chamada de modelo a mais é de `scripts/record.ts:120-121`, de hoje, e fica na tabela de falhas, sem critério.

- 32 a 34: o turno passa pela porta do Assistente (`assisting`) e o placar lê as partes guardadas; hoje não há pergunta de cópia e `failed` conta `ROWS` como erro.
- 35: sem a variável, a saída do teste mostra `# SKIP opt-in:`.

### Parar se

- O hub de `assisting` não aceita o teto de páginas (`runPages`) para a rodada parcial de c5: pare e relate; não invente um gancho de teste.
- O resultado guardado de `data_query` no cenário não passa em `DataResult` (as cinco chaves de `DataOrigin` que U2 promete, com `systems` de U2b): o defeito é de U2 ou de U2b; relate com a linha da gravação.
- `numbers.test.ts` falha com `reads` regravado: relate o número que mudou; não ajuste o teste para passar.

## U5 As linhas das duas ferramentas, o corpo com a consulta e os textos de recusa

**Base e modelo.** O commit de U4 no ramo do G3. Sonnet: frases por estado no molde de `presentRead`.

### As linhas da tabela

- `presentRead` e `rowsText`, `apps/web/src/builder/conversation/connector-specs.ts:250-305`; `LOCAL_REFUSALS` `:144-148`; `said` `:276-278`.
- `refusal` e `present` de `ToolSpec`, `tool-spec.ts:106-115`; `Refusal` `:68`; `ToolBody` `:35-51`; `toolStatus` lê a recusa e põe `error` (`tool-registry.ts:254-263`).
- `Block`, `tool-row.tsx:129`, um `case` por `ToolBody`; `ToolRow` nasce recolhida (`:370`); os corpos em `tool-bodies.tsx` (`BLOCK` `:17`); `stringArg` e `shown` em `tool-args.ts:1`, `:40`.
- `Button` de `apps/web/src/ui/button.tsx` (variante `ghost` `:19`, tamanho `sm` `:28`).
- A linha mínima de U2 em `data-specs.ts` e o caso de `tool-row.test.tsx:185`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/data-specs.ts` | Muda (de mínima a completa) | `tool-registry.ts` (`TOOLS`, `:202`) |
| `apps/web/src/builder/conversation/tool-spec.ts` | Muda `ToolBody` | todo spec de ferramenta |
| `apps/web/src/builder/conversation/tool-row.tsx`, `tool-bodies.tsx` | Muda `Block`; cria `QueryBlock` | `ToolRow` |
| `apps/web/src/builder/conversation/data-specs.test.tsx` | Cria | `npm run test:unit -w @conexus/web` |

### Os contratos que a unidade cria

```ts
// apps/web/src/builder/conversation/data-specs.ts
// o resultado guardado passa por DataResult de @conexus/hub-api (U2); a recusa vem lançada e é lida por thrownOf
type DataRefusal = 'NOT_IN_ROLE' | 'TABLE_UNAVAILABLE' | 'CATALOG_UNAVAILABLE' | 'QUERY_REFUSED'
  | 'QUERY_TOO_LARGE' | 'DEADLINE' | 'NOT_IN_CATALOG' | 'NOT_GRANTED'
export const REFUSED_TEXT: { readonly [K in DataRefusal]: string }
//  os textos de design.md, C5, e NOT_GRANTED: LOCAL_REFUSALS.NOT_GRANTED;
//  NOT_IN_ROLE: 'Essa tabela não está no catálogo.', o texto de NOT_IN_CATALOG (decisão 30)
export const DATA_SPECS: Record<(typeof DATA_TOOL)[keyof typeof DATA_TOOL], ToolSpec>

// apps/web/src/builder/conversation/tool-spec.ts
export type ToolBody = … | 'query'

// apps/web/src/builder/conversation/tool-bodies.tsx
export function QueryBlock({ sql }: { sql: string }): ReactNode
type Copied = 'IDLE' | 'DONE' | 'FAILED'
```

- **Estados.** `Copied` como união (C21); a recusa pelo `kind` do erro lançado (C22).
- **Donos.** `REFUSED_TEXT` é o dono das frases de recusa de dado; `NOT_GRANTED` continua dono em `LOCAL_REFUSALS`; a forma do resultado é `DataResult`, de `@conexus/hub-api` (C26). Sem `withheld`: nenhuma frase nomeia uma tabela que o papel não lê.
- **Esquema de entrada externa.** O resultado guardado passa por `DataResult`; o erro, por `thrownOf` (C27).
- **Arquivo modelo.** `connector-specs.ts` (`presentRead`): cumpre C21 e C26.

### As skills e a leitura

`shadcn` para o `Button` (`stack.md:63`); `mastra` só para a forma da parte (`@mastra/client-js`, `stack.md:30`); web W7, W21; testing T5, T26.

### A ordem do trabalho

1. **As frases das duas linhas.** Critérios: 36, 37, 38, 40, 41.
   - **Arquivos:** muda `data-specs.ts`; cria `data-specs.test.tsx`.
   - **Referência a seguir:** `connector-specs.ts:250-305`.
   - **O que sai:** `body: 'generic'` e as frases fixas da linha mínima de U2.
   - **O que entra:** `presentDescribe(tool, status)`: com o erro lançado de um `kind` de `REFUSED_TEXT` (`thrownOf(tool)?.kind`), `said(REFUSED_TEXT[kind])`; em erro ou negada sem esse `kind`, "Não conseguiu ler o catálogo agora." sem tabela e `REFUSED_TEXT.TABLE_UNAVAILABLE` com tabela; sem tabela, "Consultando o catálogo"/"Consultou o catálogo" e "n tabelas"; com tabela, `Vendo ${table}`/`Viu ${table}` e a contagem da amostra por `rowsText`. `presentQuery`: rodando, "Consultando os dados"; feita, `Consultou ${origin.map(t => t.table).join(', ')}` e a contagem; origem vazia ou fora de `DataResult`, "Consultou os dados". Nenhum `refusal` lê o resultado: a recusa não é resultado. Regras: C21, C79.
   - **Testes:** `data-specs.test.tsx` com as partes de `recordedPart('data-query', DataPart, ...)`; um caso troca a parte por uma em erro com o JSON lançado (as duas formas que `thrownOf` lê, `errorText` ou `isError` com o texto em `result`), como `source()` em `sources.test.tsx:20-30`. Os casos dos critérios 36 a 38, 40 e 41.
   - **Mutações à mão:** `more` sempre `false`: "a amostra" fica vermelho; tire `NOT_IN_ROLE` de `REFUSED_TEXT`: "cada recusa" fica vermelho; volte `NOT_IN_ROLE` a "Seu papel não lê esta tabela. Peça a quem administra a empresa.": "a consulta recusada pelo banco" fica vermelho; leia a recusa do `result` em vez de `thrownOf`: "cada recusa" fica vermelho.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/data-specs.test.tsx` passa.
2. **O corpo com a consulta.** Critérios: 39.
   - **Arquivos:** muda `tool-spec.ts`, `tool-row.tsx`, `tool-bodies.tsx`, `data-specs.ts`.
   - **Referência a seguir:** `tool-row.tsx:134-149` (o `case 'command'`); `button.tsx`.
   - **O que entra:** `data_query` com `body: 'query'`; `case 'query'` desenha `<QueryBlock sql={stringArg(tool.args, 'sql') ?? ''} />`. O estado da cópia fica em `QueryBlock`, porque `Block` é um `switch` sem gancho. O começo:
     ```tsx
     const copy = () =>
       (navigator.clipboard?.writeText(sql) ?? Promise.reject(new Error('no clipboard'))).then(
         () => setCopied('DONE'),
         (cause: unknown) => { console.error('QUERY_NOT_COPIED', cause); setCopied('FAILED') })
     ```
     `<pre className={BLOCK}>{sql}</pre>`, a consulta inteira, sem `shown` (que corta em 800 caracteres, `tool-args.ts:38-42`, e a consulta vai a `QUERY_SQL_MAX`, 4.000), o `Button` `ghost` `sm` "Copiar a consulta" ("Consulta copiada" em `DONE`), e em `FAILED` o texto de `L4` ao lado. Regras: W21; nenhum erro calado (o console leva o código).
   - **Testes:** "aberta, a linha mostra a consulta e Copiar a consulta põe o texto na área de transferência" (`vi.spyOn(navigator.clipboard, 'writeText')`), com uma consulta de 1.200 caracteres: o texto na tela e o texto copiado são a consulta inteira, sem reticências; e "a cópia recusada diz para selecionar" (a promessa recusada).
   - **Mutações à mão:** tire o `onClick`: o caso da cópia fica vermelho. Ponha `shown(sql)` no `<pre>` e na cópia: o caso da consulta de 1.200 caracteres fica vermelho.

   - **Pronto quando:** os dois casos e `tool-row.test.tsx` passam.

### Como se prova

36 a 41: o teste desenha `ToolRow` com a parte gravada pelo Mastra (T26) dentro da sala (`RoomContext`), como a conversa a desenha; hoje a linha mínima diz "Consultou os dados" sem detalhe e o corpo é o genérico. O texto aparece na tela do teste.

### Parar se

- O jsdom do teste não tem `navigator.clipboard`: defina-o no próprio teste com `Object.defineProperty`, como um navegador seguro; não mude o código para escapar.
- O cenário gravado não traz `sample.more` verdadeiro: o critério 37 depende de U4 (`rows` com `complete: false`); relate.

## U6 O bloco Fontes com a origem do dado e a leitura ao vivo

**Base e modelo.** O commit de U4 no ramo do G3 (corre ao lado de U5). Sonnet.

**Emenda de 2026-11-16.** U6 está no `main` (PR 1107). O desenho do bloco passa ao da tela A, em
U14 (G7), e os critérios 42, 43, 45 e 47 passam a U14; esta ficha fica como foi construída.

### As linhas da tabela

- `MessageSource` `apps/web/src/builder/conversation/sources.ts:8-13`; `SourcePart` `:17-24`; `sourceOf` e `sourcesOf` `:26-46`; `fromParts` chama `sourcesOf(message.parts)` em `rows.ts:262`, sem mudança.
- `Sources`, `sources.tsx:4-34`; `useRoom().connectors.name` (`room.ts:41-45`; `PLAIN_WORDS` em `connector-specs.ts:134-138`).
- `clockOf` `apps/web/src/platform/dates.ts:12-14`, `dayOf` `:24`, `dayGroupOf` `:48-53`.
- `ReadCut` de `@conexus/hub-api` (U4); o `connectorOf` de hoje pela operação, `connector-specs.ts:246-248`.
- A gravação `cited` e o molde do caso de web, `sources.test.tsx:15-60`; `sources.layout.test.ts:19-40`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/sources.ts` (`MessageSource`) | Muda para união | `rows.ts:262`, `sources.tsx`, `CitedRow` |
| `apps/web/src/builder/conversation/sources.tsx` | Muda | a linha `sources` da conversa |
| `apps/web/src/builder/conversation/sources.test.tsx`, `apps/web/sources.layout.test.ts` | Muda | `npm run test:unit` e `npm run test:browser -w @conexus/web` |

### Os contratos que a unidade cria

```ts
// apps/web/src/builder/conversation/sources.ts
export type MessageSource =
  | { kind: 'web'; url: string; title: string | undefined; domain: string; linked: boolean }
  | { kind: 'data'; connector: string; system: string; table: string; at: string | null;
      state: 'FRESH' | 'PARTIAL' | 'STOPPED' | 'LIVE' }
// DataResult e DataOrigin de @conexus/hub-api (U2): só ROWS e TABLE trazem origem
const LiveResult = ReadCut.extend({ at: z.iso.datetime() })
export function sourcesOf(parts: readonly MastraMessagePart[]): MessageSource[]
```

- **Estados.** `kind` separa web e dado; `state` separa a cópia e a leitura ao vivo (C21, C22). `COMPLETE` é `FRESH`; `PARTIAL` é `PARTIAL`; `ERROR` e `INTERRUPTED` são `STOPPED`, sempre com hora; `NONE` vem com `at` nulo e diz "ainda sem cópia".
- **Donos.** A chave sem repetição é `${connector}:${system}:${table}` para dado e a `url` para web, escrita uma vez em `sourcesOf` (C26). Na fonte de cópia, `system` junta por vírgula o `name` de cada `DataSystem` `NAMED` e o conector no lugar de cada `NOT_GIVEN` (U2b), como a lista de Dados escreve as contas ("Loja A, Loja B", `copy-list.test.tsx:212`); a fonte nunca nomeia uma conexão `NOT_GIVEN`. O dia e a hora de toda fonte de dado saem de uma função só, `whenOf(at, now)`: "hoje às", "ontem às" ou "em 17/10/2026 às", por `dayGroupOf`, `dayOf` e `clockOf`.
- **Esquema de entrada externa.** O resultado guardado passa por `DataResult` (de `@conexus/hub-api`) ou `LiveResult`; fora deles, nenhuma fonte, sem log (decisão 26) (C27).
- **Arquivo modelo.** `sources.ts`: cumpre C21 e C26.

### As skills e a leitura

`mastra` para a forma da parte `tool-invocation` (`@mastra/client-js`, `stack.md:30`); web W7, W34; testing T5, T23, T26.

### A ordem do trabalho

1. **A união e a origem do dado.** Critérios: 42, 43, 44, 46.
   - **Arquivos:** muda `sources.ts`, `sources.tsx`, `sources.test.tsx`.
   - **Referência a seguir:** `sources.ts:35-46`; `sources.tsx:12-31`.
   - **O que sai:** o `MessageSource` de hoje vira o caso `web`; nenhum chamador lê os campos sem passar por `kind`.
   - **O que entra:** em `sourcesOf`, cada parte `tool-invocation` com `state: 'result'` de `data_query`, ou de `data_describe` com `args.table`, passa por `DataResult`; cada origem vira `{ kind: 'data', connector, system, table, at: lastRunEndedAt, state }`, com `system` pela regra de "Donos" acima. Em `Sources`, `kind: 'data'` desenha `<li>` em `text-fact` com `${words.name(connector)} · ${table} · ${quando}`: `FRESH` "copiado hoje às 08:45", `PARTIAL` "rodada parcial, copiado hoje às 08:45", `STOPPED` "parada hoje às 08:45", `at` nulo "ainda sem cópia"; o dia e a hora por `whenOf(at, new Date())`. A `key` é a chave de `sourcesOf`.
   - **Testes:** os casos dos critérios 42, 43, 44 e 46, com `recordedPart('data-query', DataPart)` e o relógio fixo por `vi.setSystemTime` no dia da cópia gravada; para 43, a origem trocada para `ERROR`, `INTERRUPTED` e `NONE`; o caso de web de hoje (`:44-60`) com `kind: 'web'`.
   - **Mutações à mão:** `PARTIAL` para `FRESH`: "a rodada parcial" fica vermelho; "parada, copiado" no lugar de "parada": "a rodada com erro ou interrompida" fica vermelho; tire a chave de dado do conjunto: "a mesma tabela" fica vermelho; `system` no lugar de `words.name(connector)`: "a fonte do dado" fica vermelho.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/sources.test.tsx` passa.
2. **A fonte da leitura ao vivo.** Critérios: 45.
   - **Arquivos:** muda `sources.ts`, `sources.tsx`, `sources.test.tsx`.
   - **O que entra:** `connector_read` ou uma leitura tipada (`<conector>_<operação>`, `typed-reads.ts:14-16`) cujo resultado passa em `LiveResult` vira `{ kind: 'data', connector, system: args.connection, table: <operação>, at, state: 'LIVE' }`; o conector de `connector_read` sai da operação, como `connector-specs.ts:246-248`, e o da leitura tipada é o nome antes do primeiro `_`. Só `readOn` põe `at` (U4), por isso outro nome com `_` não vira fonte. `LIVE` desenha `${words.name(connector)} · ${system} · ` e, no dia do `at`, "lido agora, às 10:02"; noutro dia, `lido ${whenOf(at, new Date())}` ("lido ontem às 10:02", "lido em 17/10/2026 às 10:02").
   - **Testes:** "a fonte da leitura ao vivo diz lido agora, às", com a parte de `reads` regravada; "a leitura ao vivo vista noutro dia diz o dia", com `vi.setSystemTime` no dia seguinte ao `at`; e a mesma parte sem `at`, que não vira fonte.
   - **Mutações à mão:** use só `clockOf(at)` na fonte ao vivo: "a leitura ao vivo vista noutro dia" fica vermelho.
   - **Pronto quando:** os casos passam.

3. **A largura.** Critérios: 47.
   - **Arquivos:** muda `apps/web/sources.layout.test.ts`.
   - **Referência a seguir:** o caso "as fontes" (`:23-40`), com a mensagem do Assistente de `data-query` (`recordedRun('data-query')`).
   - **Pronto quando:** `npm run test:browser -w @conexus/web` passa a 390 e a 1280 px, nos dois temas.

### Como se prova

42 a 46: o teste monta a mensagem guardada pelo Mastra, passa por `itemsOf` (a porta da conversa, `sources.test.tsx:32-42`) e desenha `Sources` na sala do Assistente com palavras de catálogo; hoje nenhuma fonte de dado sai, porque `sourcesOf` só lê `source`. 47: o navegador real mede a largura.

### Parar se

- `dayOf` não dá "17/10/2026": relate; não escreva outro formatador.
- A conversa do Builder mostrar "sankhya" no lugar de "Sankhya" for recusado na QA: é a decisão do firstmate acima; não monte as palavras do catálogo nesta unidade.

## G3 O ponto de conferência

- Comando do servidor: `apps/server/src/builder/connectors/connector-tools-scope.test.ts`, `apps/server/src/platform/recordings.test.ts`, `apps/server/src/builder/assistant/numbers.test.ts`, `apps/server/src/builder/assistant/assistant.scorecard.test.ts`. Web: `npm run test:unit -w @conexus/web -- src/builder/conversation/data-specs.test.tsx src/builder/conversation/sources.test.tsx src/builder/conversation/tool-row.test.tsx` e `npm run test:browser -w @conexus/web`. Depois `npm run check`.
- Passos 6 e 7 de `conexus-build`: `npm run record -- data-query` e `npm run record -- reads` rodados de novo sem diferença além da data; o Hub local com os dublês, como dono, "Quanto vendi em outubro?", olhado num navegador real a 1366 e 390 px, nos dois temas (T23): a resposta com a fonte, a linha de `data_query` aberta com **Copiar a consulta**, uma recusa ("Não conseguiu ler a tabela agora." com o banco da empresa parado), os dois textos enganosos da linha mínima de G2 vistos no ar na v0.24.94 já com o texto de U5 (uma consulta com nome de tabela errado diz "A consulta não rodou.", critério 40, e não "Não conseguiu ler a tabela agora."; a pergunta por uma tabela que não existe diz "Essa tabela não está no catálogo.", critério 37, e não "Não conseguiu ler o catálogo agora.") e a fonte ao vivo de uma leitura do Sankhya. As mutações das três unidades feitas e desfeitas, com o resultado (T27).
- Depois do PR, a QA (`conexus-qa`, T25) das telas `p3-01` a `p3-07`, por um agente que não construiu, com a matriz de estados acima; o relatório vai no PR antes da revisão.

## U7 O caminho, a linha da cópia, as abas e a Visão geral

**Base e modelo.** O `main` com o PR 1085 (explorador, grupo 1) mesclado; até lá, o head do PR 1085 (`689ece4a`), cuja base é `82abe21e` e que não diverge do `main` `5d02e643` em `apps/web`. Sonnet: uma tela, sem desenho entre módulos nem concorrência.

### As linhas da tabela

- **O caminho da tabela.** Ler `copy-detail.tsx:150-182` (o topo; o link "← Dados" em `:152-159`). Seguir o `Link` da linha de tabela da árvore no head do PR 1085 (`689ece4a`), `data-tree.tsx`, que já leva `search={{ q }}`, e `link.js:35-37` (sem `exact`, "Dados" ficaria ativo por prefixo de caminho e ganharia `aria-current`, `:237`).
- **A linha da cópia.** Ler `copy-detail.tsx:164-168`; o contrato, `packages/hub-api/src/copies.ts:79-82` (no `main`).
- **As abas e a de abertura.** Ler `copy-detail.tsx:144-146` e `:197-226`; `search.ts:12-20` no head do PR 1085 (`689ece4a`), onde o `q` já está em `TableSearch` (`:19`).
- **A aba Visão geral.** Ler o `Line` de `copy-columns.tsx:51-58` e o `TablePanel` de `:61-82`; `modeText` em `text.ts:216-225` (no head do PR 1085 (`689ece4a`)); `CopyOrigin` em `packages/hub-api/src/copy-shown.ts:12-20`.
- **A linha de tela.** `docs/reference/screens.md:24` (igual no `main` e no PR 1085).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/copy-detail.tsx` | Muda | a rota `data.$copyId.tsx`, por `public.ts` |
| `apps/web/src/hub/copies/copy-columns.tsx` → `copy-facts.tsx` (`git mv`) | Renomeia e muda | `copy-detail.tsx` (`:16`) |
| `apps/web/src/hub/copies/search.ts` | Muda (`TableTab`) | `copy-detail.tsx`, a rota `data.$copyId.tsx` (`validateSearch`) |
| `apps/web/src/hub/copies/text.ts` | Muda | `copy-detail.tsx`, `copy-facts.tsx` |
| `apps/web/src/routes/_app/companies/$companyId/data.$copyId.tsx` | Muda (passa `q`) | o roteador |
| `apps/web/sweep-table-states.ts` | Muda | `sweep-states.ts:39`, `:65` → `sweep.test.ts` |
| `apps/web/src/hub/copies/copy-detail.test.tsx`, `copy-sample.test.tsx`, `copy-list.test.tsx` | Mudam | — |
| `docs/reference/screens.md` | Muda (`:24`) | — |

### Os contratos que a unidade cria

Nenhuma rota, coluna, migração ou tipo do `hub-api` muda. Na tela:

```ts
// apps/web/src/hub/copies/search.ts
export const TableTab = z.enum(['overview', 'columns', 'sample', 'runs'])

// apps/web/src/hub/copies/text.ts
export const OVERVIEW_TITLE = 'Visão geral'
export const NO_DESCRIPTION = 'Sem descrição.'
export const ORIGIN_READ = 'Leitura de origem'
export const OVERVIEW_LABELS = { connection: 'Ligação', key: 'Chave', mode: 'Modo' } as const
export const CRUMBS_LABEL = 'Caminho'
export function copiedText(system: string, copy: Pick<CopySummary, 'run' | 'rows'>): string

// apps/web/src/hub/copies/copy-facts.tsx
export function OverviewTab(props: { copy: CopySummary }): ReactNode

// apps/web/src/hub/copies/copy-detail.tsx
export function CopyDetail(props: {
  companyId: CompanyId; copyId: CopyId; tab: TableTab | undefined
  page?: string; q?: string; mayReadRows: boolean
}): ReactNode
```

Sai: `BACK_TO_DATA` (`text.ts:29`, lido só por `copy-detail.tsx:23`, `:158`) e o import de `ArrowLeftIcon`.

- **Cada estado.** A origem é a união `CopyOrigin` discriminada em `kind` (`copy-shown.ts:12-20`); a Visão geral estreita em `source.kind === 'OPERATION'` (C22). A rodada é `CopyRun['outcome']`, discriminada em `kind`; `copiedText` lê `kind` e `endedAt`, nunca o texto.
- **Cada id.** `CompanyId` e `CopyId` chegam marcados pela rota (`copyParams`), sem conversão nova (C23).
- **O dono de cada fato.** As palavras novas em `text.ts` (C26); `countText` e `dayAndHour` (`apps/web/src/platform/dates.ts:5-7`) são os de hoje. `text.ts` passa a importar `dayAndHour`.
- **O esquema Zod.** `TableTab` com `.catch(undefined)` em `TableSearch` (`search.ts:17`): um `tab` desconhecido abre a Visão geral (C27).
- **O arquivo modelo.** `copy-columns.tsx` cumpre C21, C23 e C26 (sem estado, palavras em `text.ts`): é modelo para `copy-facts.tsx`.

### As skills e a leitura

Pelas linhas de `docs/reference/stack.md` de `apps/web/src`: `router-core` (`node_modules/@tanstack/router-core/skills/router-core/SKILL.md` e o sub-skill `search-params`), para `Link`, `activeOptions` e `validateSearch` (web W18); `@base-ui/react` (`node_modules/@base-ui/react/docs/`) para as abas; `shadcn` só para ler as peças de `apps/web/src/ui` (nenhuma peça nova); `lucide-react` para `ChevronRightIcon`. Impeccable: `layout` e `adapt` nesta tela, `impeccable detect` nos arquivos mudados (`docs/reference/impeccable.md`). Ler antes: web W18, W29, W31, W34; design V5, V11, V34, V35; testing T5, T27.

### A ordem do trabalho

1. **Apagar o link de volta e a frase do intervalo.** Critérios: 50, 51.
   - **Arquivos:** muda `copy-detail.tsx`, `text.ts`.
   - **Referência a seguir:** `copy-detail.tsx:152-159`, `:164-168`.
   - **O que sai:** o `Link` `BACK_TO_DATA` e `ArrowLeftIcon` (`:4`, `:152-159`); o `span` "{sistema} · a cada {intervalo}" (`:164-168`) e o import de `INTERVAL_LABEL` em `copy-detail.tsx` (`:27`); `BACK_TO_DATA` de `text.ts:29`.
   - **O que entra:** nada ainda. Regras: C75.
   - **Testes:** os existentes que quebram são ajustados no passo 4.
   - **Mutações à mão:** — (só apaga).
   - **Pronto quando:** `npm run typecheck` acusa só os testes que o passo 4 ajusta.

2. **O caminho, o logo e a linha da cópia.** Critérios: 50, 51, 52, 53, 54.
   - **Arquivos:** muda `copy-detail.tsx`, `text.ts`, `data.$copyId.tsx`.
   - **Referência a seguir:** o `Link` com `search={{ q }}` da árvore (no head do PR 1085 (`689ece4a`), `data-tree.tsx`); `ConnectorLogo` (`apps/web/src/hub/connectors/logo.tsx:9-32`), sem `small` no topo; `entry` como `data-tree.tsx:115` (`connectors.find((one) => one.id === …)`).
   - **O que sai:** —.
   - **O que entra:** em `CopyDetail`, um `nav aria-label={CRUMBS_LABEL}` com dois `Link` para `/companies/$companyId/data`, `search={{ q }}` e `activeOptions={{ exact: true }}`, o `ChevronRightIcon` de 16 px (design V34) com `aria-hidden`, e o nome da tabela em mono, sem link. O logo antes do `PageTitle`. Abaixo do título, `<p className="text-text-2 tabular-nums">{copiedText(system, copy)}</p>`. A rota passa `q` (`const { tab, page, q } = Route.useSearch()`, hoje `:28`). O começo de `copiedText`, que não é óbvio:
     ```ts
     const rows = copy.rows === null ? '' : ` · ${countText(copy.rows)} linhas`
     if (copy.run === null) return `${system} · a primeira rodada ainda não terminou`
     const { outcome, endedAt } = copy.run
     if (endedAt !== null && (outcome.kind === 'COMPLETE' || outcome.kind === 'PARTIAL')) {
     ```
     Regras: C22, C26, web W18, design V11, V34.
   - **Testes:** `copy-detail.test.tsx`: "o caminho" (dentro de `navigation` "Caminho", os links "Dados" e "Sankhya" e o texto "vendas"; nenhum `aria-current`; clicar em "Sankhya" leva ao `heading` "Dados"); "o caminho leva a busca" (abre `${DETAIL}?q=NUNOTA`; o `href` dos dois links tem `q=NUNOTA` e não tem `layer`); "a linha da cópia: a hora do fim da rodada e as linhas" (`toMatch(/^Copiada do Sankhya em .+ · 118\.402 linhas$/)`, para COMPLETE e para `{ kind: 'PARTIAL', reason: 'CAP' }`); "a linha da cópia sem hora quando a rodada não copiou" (RUNNING com `endedAt: null`, ERROR `COPY_SOURCE_UNREACHABLE`, INTERRUPTED: o texto é exatamente "Sankhya · 118.402 linhas"); "a linha da cópia sem rodada e sem linhas" (`copy({ run: null })` dá "Sankhya · a primeira rodada ainda não terminou"; `copy({ rows: null })` dá "Sankhya").
   - **Mutações à mão:** (a) tire a checagem de `outcome.kind`: o teste de ERROR e INTERRUPTED fica vermelho. (b) Tire `endedAt !== null`: o teste da rodada aberta fica vermelho. (c) Tire `activeOptions` do link "Dados": "o caminho" fica vermelho. (d) Tire `search={{ q }}` de um link: "o caminho leva a busca" fica vermelho.
   - **Pronto quando:** os cinco testes passam.

3. **As abas, a contagem e a Visão geral.** Critérios: 55, 56, 57, 58, 59.
   - **Arquivos:** muda `search.ts`, `text.ts`, `copy-detail.tsx`; `git mv copy-columns.tsx copy-facts.tsx` e muda.
   - **Referência a seguir:** `copy-detail.tsx:210-226`; o `Line` de `copy-columns.tsx:51-58`; a forma da tela a1 (descrição em `max-w-message`, a lista em `grid gap-md sm:grid-cols-2`).
   - **O que sai:** o padrão `TableTab.enum.columns` (`copy-detail.tsx:146`).
   - **O que entra:** `TableTab` com `overview` primeiro; `const tab = shown ?? TableTab.enum.overview`; o gatilho Visão geral antes de Colunas; o gatilho Colunas com `{COLUMNS_TITLE}{' '}<span className="text-text-2 tabular-nums">{copy.shown.columns.length}</span>` (o `{' '}` dá o nome "Colunas 3" no jsdom, a mesma razão da árvore do PR 1085); `<TabsContent value={TableTab.enum.overview}><OverviewTab copy={copy} /></TabsContent>`. Em `copy-facts.tsx`, `Line` passa a aceitar `children: ReactNode` (a chave em mono cabe nele, sem peça irmã) e `OverviewTab` mostra a descrição ou `NO_DESCRIPTION` em `text-2`, Ligação, Chave (`font-mono text-fact`), Modo e, só para `OPERATION`, `ORIGIN_READ` com `source.label`. Regras: C22, design V11, web W31 (nada de "em breve" para Quem lê ou Qualidade).
   - **Testes:** `copy-detail.test.tsx`: "a tabela abre na Visão geral" (a aba com `aria-selected="true"`; dentro de `within(screen.getByRole('tabpanel'))`, "As notas de venda", "Ligação", "Matriz", "Chave", "NUNOTA", "Modo"; "Leitura de origem" não, porque `copy()` é `QUERY`, `test-hub.tsx:72`); "a Visão geral de uma leitura da versão 2 diz a leitura de origem"; "sem descrição, a frase de vazio"; "as abas na ordem, com a contagem de colunas" (`['Visão geral', 'Colunas 3', 'Amostra', 'Rodadas']`); "a aba fica no endereço" também abre `${DETAIL}?tab=zzz` e cai na Visão geral.
   - **Mutações à mão:** (a) volte o padrão para `columns`: "a tabela abre na Visão geral" fica vermelho. (b) Mostre "Leitura de origem" também para `QUERY`: o mesmo teste fica vermelho. (c) Tire o `{' '}`: "as abas na ordem" fica vermelho.
   - **Pronto quando:** os testes novos passam.

4. **Os testes que a página nova quebra, a varredura e a linha de tela.** Critérios: 51, 56, 59, 60.
   - **Arquivos:** muda `copy-detail.test.tsx`, `copy-sample.test.tsx`, `copy-list.test.tsx`, `apps/web/sweep-table-states.ts`, `docs/reference/screens.md`.
   - **Referência a seguir:** os estados de `sweep-table-states.ts:133-185` (no head do PR 1085 (`689ece4a`)).
   - **O que sai:** as consultas a "Sankhya · a cada 30 min" e ao título "Voltar a Dados".
   - **O que entra (linhas no head do PR 1085):** `copy-detail.test.tsx:36` e `:164` passam a casar `/^Copiada do Sankhya em .+ · 118\.402 linhas$/`; `:47` vira "o caminho leva a Dados"; `:80-91` e `:93-98` abrem `${DETAIL}?tab=columns` (o título de `:80` vira "a aba Colunas tem tipo, chave e descrição"; as duas linhas de "Camada" e "Bruto" de `:88-90` saem na U8); `:100-107` confere o aviso na Visão geral e abre `?tab=columns` para "Inativa desde 10/11" (`:105`); `:134` usa `{ name: /Colunas/ }`. `copy-sample.test.tsx:54-59` vira "o desenvolvedor que abre ?tab=sample cai na Visão geral". `copy-list.test.tsx:204-223` ("a origem da cópia"): depois do clique, confere "Loja A, Loja B" e "só o alterado" dentro do `tabpanel`, clica na aba `/Colunas/` e só então procura a `table` (`:216-220`). `sweep-table-states.ts:147-151` passa a abrir `${PAGE}/${VENDAS}?tab=columns` (hoje espera "Inativa desde 10/11", que a Visão geral não mostra, e travaria a varredura) e ganha o estado "A tabela, a visão geral" (`columnedPage()`, `waitFor(p, 'As notas de venda da Matriz')`). `screens.md:24`: "its name, state and system, the tabs Colunas (…), Amostra (…) and Rodadas (20 to a page)" vira "the path Dados › system › table, the system's logo, its name and state, the line of when it was last copied and its rows, the tabs Visão geral (the description, the connection, the key, the mode and the read it comes from; the default tab), Colunas with the count (…), Amostra (…) and Rodadas (20 to a page)". Regras: web W29, testing T5.
   - **Testes:** os arquivos acima.
   - **Mutações à mão:** — (ajustes).
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/hub/copies/copy-detail.test.tsx src/hub/copies/copy-sample.test.tsx src/hub/copies/copy-list.test.tsx` passa.

5. **O cabeçalho do grupo sem o nome repetido.** Critérios: 74.
   - **Arquivos:** muda `text.ts`, `copy-list.test.tsx`.
   - **Referência a seguir:** `systemText`, `text.ts:36-39` no head do PR 1085 (`689ece4a`), lido por `raw-layer.tsx:33` e `apps-layer.tsx:72`.
   - **O que sai:** nada.
   - **O que entra:** em `systemText`, as ligações cujo nome é igual ao do sistema saem antes do `join(', ')`; com nenhuma sobrando, o cabeçalho fica "{sistema} · {n} tabela(s)". Regras: C26 (o texto continua num dono só).
   - **Testes:** `copy-list.test.tsx`, caso novo "a ligação com o nome do sistema não se repete no cabeçalho do grupo" (uma cópia cuja ligação se chama "Mercado Livre", do conector Mercado Livre: o cabeçalho é exatamente "Mercado Livre · 1 tabela"); "a origem da cópia" (`:202-223`) continua com "Mercado Livre · Loja A, Loja B · 1 tabela".
   - **Mutações à mão:** tire o filtro: o caso novo fica vermelho.
   - **Pronto quando:** `copy-list.test.tsx` passa.

### Como se prova

Nenhum critério toca gravação (T26 não se aplica). 74: o cabeçalho da lista pelo Hub inteiro (`openCopies`); hoje repete o nome, como a conferência no ar do explorador v0.24.91 viu. 50 a 59: os testes abrem o Hub inteiro pelo roteador com `openCopies` (`test-hub.tsx:311-322`, no head do PR 1085), testing T5; hoje falham porque não há "Caminho", a aba de abertura é Colunas e a linha diz "Sankhya · a cada 30 min". A recusa de 53 é o texto exato sem "Copiada"; a de 50, nenhum `aria-current` e nenhum link "← Dados". 60: `npm run test:sweep -w @conexus/web` no ponto de conferência (ou a CI); hoje o estado "A tabela, a visão geral" não existe.

### Parar se

- A varredura a 320 px rolar de lado por causa das quatro abas (o `TabsList` é `inline-flex w-fit`, `ui/tabs.tsx:16-23`, e a coluna tem cerca de 288 px): pôr `className="max-w-full flex-wrap"` no `TabsList` desta página, sem mudar `ui/tabs.tsx`, rodar de novo e anotar no PR. Se nem isso couber, parar e reportar com a captura.
- O `q` vazio produzir `?q=` no `href` dos links do caminho: seguir como a árvore do PR 1085 faz e reportar a diferença, sem inventar regra.
- Um texto novo (C5 e C6 da spec) parecer errado: ele vai no corpo do PR para a palavra do fundador; não trocar.

## U8 O painel Detalhes

**Base e modelo.** O commit da U7 no mesmo ramo. Sonnet.

### As linhas da tabela

- **O painel Detalhes.** Ler `TablePanel` (`copy-columns.tsx:61-82`, agora `copy-facts.tsx`) e `PANEL_LABELS` (`text.ts:69-78`), `RAW_LAYER` (`:79`), `INTERVAL_LABEL` (`:142-149`), `NO_SCHEDULE` (`:116`), `outcomeText` (`:178-192`), todos no head do PR 1085 (`689ece4a`). Seguir a tela a1 do kit (o `aside` com título, a lista e a frase depois de um `hr`).
- **A hora da última rodada.** Ler `copy-columns.tsx:69` (`startedAt`) e o contrato `copies.ts:79-80`.
- **A linha de tela.** `docs/reference/screens.md:24`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/copy-facts.tsx` | Muda (sai `TablePanel`, entra `DetailsPanel`) | `copy-detail.tsx` |
| `apps/web/src/hub/copies/copy-detail.tsx` | Muda | a rota da tabela |
| `apps/web/src/hub/copies/text.ts` | Muda | `copy-facts.tsx` |
| `apps/web/src/hub/copies/copy-detail.test.tsx`, `copy-list.test.tsx` | Mudam | — |
| `docs/reference/screens.md` | Muda (`:24`) | — |

### Os contratos que a unidade cria

```ts
// apps/web/src/hub/copies/text.ts
export const DETAILS_TITLE = 'Detalhes'
export const PANEL_LABELS = { system: 'Sistema', frequency: 'Frequência', lastRun: 'Última rodada', rows: 'Linhas' } as const
export const KEPT_IN_HUB = 'Só os nomes e as descrições ficam no Hub. As linhas ficam na cópia, no banco da empresa.'
export function frequencyText(interval: CopyInterval | null): string
export function lastRunText(run: CopyRun | null): string

// apps/web/src/hub/copies/copy-facts.tsx
export function DetailsPanel(props: { copy: CopySummary; system: string; entry: ConnectorEntry | undefined }): ReactNode
```

Sai: `TablePanel`; de `PANEL_LABELS` as chaves `connection`, `key`, `mode`, `interval` e `layer` (só o `TablePanel` as lê); `RAW_LAYER` (`text.ts:79`, lido só por `copy-columns.tsx:14`, `:71`, conferido no head do PR 1085).

- **Cada estado.** `lastRunText` decide por `run === null` e `run.endedAt === null`; o resultado em palavras é `outcomeText`, que já cobre a união (C21, C22).
- **O dono de cada fato.** A hora é `endedAt`, a mesma de `copiedText` (U7): um fato, duas leituras, e o critério 62 cruza as duas.
- **O arquivo modelo.** `copy-facts.tsx`, como na U7.

### As skills e a leitura

As da U7, sem `router-core`. Ler antes: design V11, V34, V35; web W34.

### A ordem do trabalho

1. **Apagar o painel de hoje e as chaves que só ele lê.** Critérios: 63.
   - **Arquivos:** muda `copy-facts.tsx`, `text.ts`, `copy-detail.tsx`.
   - **Referência a seguir:** `copy-columns.tsx:61-82`.
   - **O que sai:** `TablePanel`; as chaves `connection`, `key`, `mode`, `interval`, `layer` de `PANEL_LABELS`; `RAW_LAYER` (depois de `grep -rn RAW_LAYER apps/web/src`); os imports que sobram.
   - **O que entra:** nada ainda.
   - **Testes:** `copy-detail.test.tsx:88-90` (as consultas a "Camada" e "Bruto" em `main`) saem.
   - **Mutações à mão:** —.
   - **Pronto quando:** `npm run typecheck` acusa só o uso de `TablePanel` em `copy-detail.tsx`.

2. **O painel Detalhes.** Critérios: 61, 62, 63, 64, 65.
   - **Arquivos:** muda `copy-facts.tsx`, `text.ts`, `copy-detail.tsx`, `copy-detail.test.tsx`, `copy-list.test.tsx`, `docs/reference/screens.md`.
   - **Referência a seguir:** a tela a1; `ConnectorLogo` com `small` (`logo.tsx:13`).
   - **O que sai:** —.
   - **O que entra:** `<aside aria-labelledby="table-details" className="flex min-w-0 flex-col gap-md md:w-list md:shrink-0">` com `<h2 id="table-details">` `DETAILS_TITLE`, um `dl` com Sistema (logo pequeno e nome, pelo `Line` com `ReactNode`), Frequência (`frequencyText`), Última rodada (`lastRunText`), Linhas, um `hr` e `KEPT_IN_HUB` em `text-2`. `CopyDetail` passa o `entry` que já calcula para o logo do topo. O começo de `lastRunText`:
     ```ts
     if (run === null) return '—'
     return run.endedAt === null ? outcomeText(run) : `${outcomeText(run)} · ${dayAndHour(run.endedAt)}`
     ```
     `screens.md:24`: "and a panel with the system, the connection, the key, the mode, the interval, the last run, the rows and the layer" vira "and the panel Detalhes with the system, the frequency, the last run, the rows and the sentence that only names and descriptions are kept in the Hub". Regras: C26, design V35, web W29.
   - **Testes:** `copy-detail.test.tsx`: "o painel Detalhes" (dentro de `complementary` "Detalhes": "Sistema", "Sankhya", "Frequência", "A cada 30 min", "Última rodada" e um texto que casa `/^Completa · .+/`, "Linhas", "118.402", `KEPT_IN_HUB`; `queryByText('Camada')` nulo na página inteira; "Ligação", "Chave" e "Modo" ausentes do `complementary`); "o painel e a linha da cópia dizem a mesma hora" (o trecho depois de "Completa · " no painel é igual ao trecho entre "em " e " · " da linha da cópia, com `copyRun({ startedAt: '2026-11-02T09:00:00.000Z' })`, para o começo e o fim diferirem de uma hora); "a última rodada de um painel com a rodada aberta não diz hora"; "sem agendamento, a frequência é um traço" (`copy({ interval: null, schedule: { kind: 'MISSING' } })`); "o painel vem depois das abas" (o `tablist` "Tabela" precede o `complementary` em `compareDocumentPosition`). `copy-list.test.tsx:221-222` ficam como a U7 os deixou.
   - **Mutações à mão:** (a) `frequencyText` sem "A cada": "o painel Detalhes" fica vermelho. (b) Tire `KEPT_IN_HUB`: o mesmo. (c) Devolva a linha da camada: o mesmo (ausência de "Camada"). (d) Use `startedAt` em `lastRunText`: "o painel e a linha da cópia dizem a mesma hora" fica vermelho.
   - **Pronto quando:** `copy-detail.test.tsx` e `copy-list.test.tsx` passam.

### Como se prova

Nenhuma gravação. 61 a 65 pelo Hub inteiro (`openCopies`), testing T5; hoje falham porque o painel não tem título nem "Frequência", mostra "Camada" e usa `startedAt` (`copy-columns.tsx:69`). A recusa de 63 é a ausência de "Camada" na página e de Ligação, Chave e Modo no painel. A parte "abaixo de 768 px" de 65 vem da varredura a 390 e 320 px (critério 60) e da QA.

### Parar se

- O `id` `table-details` colidir com outro na página: escolher um id único e reportar.
- A frase `KEPT_IN_HUB` precisar dizer "códigos" antes da parte 5: é texto do fundador; não mudar.

## U9 O ícone do tipo e o número da linha na amostra

**Base e modelo.** O commit da U8 no mesmo ramo. Sonnet.

### As linhas da tabela

- **O tipo na amostra.** Ler `copy-sample.tsx:19` (a assinatura) e `:31-50` (cabeçalho e linhas); `typeText` (`text.ts:92-94`) e `TYPE_LABEL` (`:81-89`), no head do PR 1085 (`689ece4a`); os tipos, `CopyColumnType` e `CopyColumnTypeV2` (`packages/connectors/src/kernel/copy.ts:22`, `:95`, no `main`); `type` é `z.string()` no contrato (`copy-shown.ts:35`). Seguir `lucide-react@1.57.0 dist/esm/Icon.mjs:43` (com `role` ou `aria-*`, o ícone não leva `aria-hidden`).
- **O número da linha.** O mesmo arquivo, `:41-48`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/copies/column-type.tsx` | Cria | `copy-sample.tsx` |
| `apps/web/src/hub/copies/copy-sample.tsx` | Muda (recebe `columns`) | `copy-detail.tsx` |
| `apps/web/src/hub/copies/copy-detail.tsx` | Muda (passa `copy.shown.columns`) | a rota da tabela |
| `apps/web/src/hub/copies/text.ts` | Muda (`ROW_NUMBER`) | `copy-sample.tsx` |
| `apps/web/src/hub/copies/copy-sample.test.tsx` | Muda | — |
| `apps/web/sweep-table-states.ts`, `apps/web/tables.layout.test.ts` | Muda (o estado "A tabela, a amostra larga" e o caso de layout) | `sweep.test.ts`, `npm run test:browser -w @conexus/web` |

### Os contratos que a unidade cria

```ts
// apps/web/src/hub/copies/column-type.tsx
export function ColumnTypeIcon(props: { type: string | undefined }): ReactNode

// apps/web/src/hub/copies/copy-sample.tsx
export function CopySample(props: { companyId: CompanyId; copyId: CopyId; columns: CopySummary['shown']['columns'] }): ReactNode

// apps/web/src/hub/copies/text.ts
export const ROW_NUMBER = 'Linha'
```

- **O dono de cada fato.** O nome do tipo em palavras é `typeText` (C26); `column-type.tsx` guarda só a tabela tipo → ícone (`bigint` `HashIcon`, `numeric` `DecimalsArrowRightIcon`, `text` `TypeIcon`, `date` `CalendarIcon`, `timestamp` `CalendarClockIcon`, `boolean` `ToggleLeftIcon`, `json` `BracesIcon`, conferidos em `lucide-react.suffixed.d.ts`).
- **Cada estado.** Sem tipo ou tipo sem ícone: `null` (critério 67).

### As skills e a leitura

As da U7, sem `router-core`; `lucide-react` (`lucide.dev/llms.txt`). Ler antes: design V11, V34, V35.

### A ordem do trabalho

1. **O ícone do tipo.** Critérios: 66, 67.
   - **Arquivos:** cria `column-type.tsx`; muda `copy-sample.tsx`, `copy-detail.tsx`.
   - **Referência a seguir:** `copy-sample.tsx:31-39`; `ConnectorLogo` como forma de peça pequena da pasta.
   - **O que sai:** a `className="font-mono text-fact"` do `TableHead` (`:34`), que passa ao `span` do nome.
   - **O que entra:** `types = new Map(props.columns.map((one) => [one.name, one.type]))`; cada `TableHead` com `<span className="inline-flex items-center gap-xs"><ColumnTypeIcon type={types.get(column)} /><span className="font-mono text-fact">{column}</span></span>`. O começo de `ColumnTypeIcon`:
     ```tsx
     if (type === undefined) return null
     const Icon = TYPE_ICON[type]
     if (Icon === undefined) return null
     return <Icon role="img" aria-label={typeText(type)} className="size-4 shrink-0 text-text-2" />
     ```
     Regras: design V34 (16 px ao lado de rótulo), V35, C26.
   - **Testes:** `copy-sample.test.tsx`: "a amostra mostra o tipo de cada coluna" (`copy({ shown: { ...copy().shown, columns: [NUNOTA bigint, CODPARC text] } })` no endereço `SAMPLE` de `:8`; na tabela, `getByRole('img', { name: 'Número' })` e `{ name: 'Texto' }`); "uma coluna fora da definição fica só com o nome" (`copy()`, sem colunas, `test-hub.tsx:77`; o cabeçalho tem "NUNOTA" e a tabela não tem `img`). A amostra `SAMPLE` de `test-sources.ts:43-47` é o dado; o `SAMPLE` de `copy-sample.test.tsx:8` é o endereço.
   - **Mutações à mão:** (a) tire o `aria-label`: o teste do tipo fica vermelho. (b) Troque `types.get(column)` por `undefined`: o mesmo.
   - **Pronto quando:** os dois testes passam.

2. **O número da linha.** Critérios: 68, 69.
   - **Arquivos:** muda `copy-sample.tsx`, `text.ts`, `copy-sample.test.tsx`.
   - **Referência a seguir:** `copy-sample.tsx:41-48`.
   - **O que sai:** —.
   - **O que entra:** `<TableHead className="w-8"><span className="sr-only">{ROW_NUMBER}</span></TableHead>` antes das colunas; em cada linha, `<TableCell className="text-text-2 tabular-nums">{at + 1}</TableCell>` antes das células. Regras: design V35.
   - **Testes:** "o número da linha" (a primeira célula de `getAllByRole('row').slice(1)` é 1 a 5; o primeiro `columnheader` tem o nome "Linha"); os casos de hoje seguem (`:10-17` com 6 linhas, `:19-24`, `:32-36`, `:38-52`).
   - **Mutações à mão:** (c) troque `at + 1` por `at`: "o número da linha" fica vermelho.
   - **Pronto quando:** `copy-sample.test.tsx` passa.

3. **A amostra larga rola na sua caixa.** Critérios: 75.
   - **Arquivos:** muda `copy-sample.tsx` e `copy-detail.tsx` (só as classes de largura), `apps/web/sweep-table-states.ts`, `apps/web/tables.layout.test.ts`.
   - **Referência a seguir:** `Table` de `apps/web/src/ui/table.tsx:7-16` (a caixa `table-container` já tem `overflow-x-auto`); a coluna das abas, `copy-detail.tsx:196-199` no head do PR 1085 (`min-w-0 flex-1`); o `aside` do painel da U8 (`md:w-list md:shrink-0`); o molde de `tables.layout.test.ts:39-50` (`createHarness`, `DESKTOP`, `stateNamed`).
   - **O que sai:** nada.
   - **O que entra:** no estado novo "A tabela, a amostra larga" (`${PAGE}/${VENDAS}?tab=sample`, a amostra com 11 colunas de nomes como os do Sankhya), o caso de layout lê, a 1366 px: `scrollWidth` do documento igual à largura; o `scrollWidth` da caixa `[data-slot="table-container"]` da Amostra maior que o seu `clientWidth`; a borda direita da caixa à esquerda do `complementary` "Detalhes"; e, com a caixa rolada até o fim, a borda direita do último `columnheader` dentro da caixa. Para passar, cada ancestral da grade entre a coluna das abas e a caixa leva `min-w-0` (o `TabsContent` da Amostra e o que `CopySample` desenha em volta da `Table`); `ui/table.tsx` não muda. Regras: design V18, testing T23.
   - **Testes:** o caso novo de `tables.layout.test.ts` e a varredura do estado novo a 1366, 390 e 320 px (critério 60).
   - **Mutações à mão:** tire o `min-w-0` que o passo pôs: o caso novo fica vermelho (a grade empurra a página ou passa por baixo do painel).
   - **Pronto quando:** `npm run test:browser -w @conexus/web -- tables.layout.test.ts` passa; se a máquina não aguentar, a CI, dito no PR.

### Como se prova

Nenhuma gravação. 66 a 69 pelo Hub inteiro (`openCopies`, `?tab=sample`), testing T5; hoje falham porque o cabeçalho só tem o nome e não há coluna de número. A recusa de 67 é a tabela sem `img`. 75: o navegador real mede a caixa e o painel (testing T23); hoje, como a conferência no ar do explorador v0.24.91 viu, a grade de 11 colunas rola com a página e o painel corta a última coluna.

### Parar se

- Um tipo novo aparecer no contrato sem ícone: fica só com o nome (67); não escolher ícone sem a palavra do fundador.
- O ícone com `role="img"` quebrar o contorno do Tab na varredura (não é focável; não deveria): reportar com a captura.
- O `min-w-0` nos ancestrais não fizer a grade rolar na sua caixa (critério 75): parar e reportar com a medida; não mudar `ui/table.tsx` nem tirar o painel de lado.


## G4 O ponto de conferência

Depois da U9, antes do PR. Rodar `npm run test:unit -w @conexus/web -- src/hub/copies`, `npm run typecheck` e `npm run check`; `npm run test:browser -w @conexus/web -- tables.layout.test.ts` para o critério 75 e `npm run test:sweep -w @conexus/web` para o critério 60
 (os estados da tabela a 1366, 390 e 320 px, nos dois temas), ou deixá-lo à CI se a máquina não aguentar, dizendo isso no PR. `npm run quality` inteiro em segundo plano antes do PR (a CI roda só `quality --fast`). Os passos 6 e 7 da `conexus-build`: `deslop` e `no-comments` no diff, as mutações de U7, U8 e U9 feitas e desfeitas com o resultado anotado (testing T27), `impeccable detect` nos arquivos mudados. Abrir o Hub local com os dublês, como dona, em `/data/<id>` sem `tab`, com `?tab=sample` e com `?q=NUNOTA`, a 1280 e 390 px nos dois temas, e comparar com a tela a1 e com a `v10`. O corpo do PR lista os textos novos (Visão geral, Sem descrição., Leitura de origem, Ligação, Chave, Modo, Caminho, a linha "Copiada do … em …", Detalhes, Frequência, "A cada …", a frase do Hub, Linha) para a palavra do fundador e as linhas da tabela de referência deste grupo. Depois do PR, a QA (`conexus-qa`) por um agente que não construiu, com a matriz de estados acima.

**Fica de fora deste grupo** (grupo 3 do explorador, espera outras partes; web W31): Perguntar ao Assistente (parte 3, grupo 3); a aba e a linha Quem lê e "lida com o seu papel" (parte 4, grupos 4, 6 e 7: etapa 2); a aba Qualidade (item (c): etapa 4); o nome de negócio sobre a coluna, "{n} de {m} colunas", Conceito, Ligações e o botão Colunas da grade (parte 5: etapa 7); a contagem de descrições (ideia nossa, às perguntas).

## U10 As permissões da passada semanal e dos avisos

**Base e modelo.** O `main` com o PR 1088 mesclado (as colunas `whole` e `system_*` e as tabelas `alert_recipient`, `copy_follower` e `copy_notice`; hoje no head do PR 1088, `4d498ada`). Sonnet: sete linhas de SQL na forma de um commit que já existe.

### As linhas da tabela

- Permissões de colunas novas: ler `apps/server/database-grants.sql:406-412` (as permissões de hoje de `copy_run`) e o commit `d848c6b1` inteiro (`database-grants.sql` com o comentário de palavra do fundador, e `apps/server/migrations/20261115083959_data_read_grants/migration.sql`, com o comentário de "Custom SQL", data D5).
- Tabelas "ao lado": `database-grants.sql:433-439` (`notification` e `request_notice`, com o comentário de cada uma).
- As tabelas e as políticas, no head do PR 1088 (`4d498ada`): `apps/server/migrations/20261115182500_copy_alerts/migration.sql` (as políticas `company_all` de `alert_recipient`; `company_select`, `company_insert`, `company_delete` de `copy_follower`; `company_select`, `company_update`, `company_insert` de `copy_notice`) e `20261115182041_copy_run_system/migration.sql`.
- A prova: `apps/server/src/platform/catalog.test.ts:95-99` e `:171-197`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/database-grants.sql` | Muda (sete linhas e um comentário) | `catalog.test.ts:14` lê o arquivo |
| `apps/server/migrations/` | Cria uma migração à mão | o `migrate` do programa (data D9) |
| `apps/server/src/platform/catalog.test.ts` | Muda (um caso positivo e as recusas) | ninguém |

### Os contratos que a unidade cria

Nenhum tipo, rota ou coluna. O contrato é a lista de permissões do login `hub_company`:

```sql
GRANT UPDATE(system_status) ON TABLE copies.copy_run TO hub_company;
GRANT UPDATE(system_code) ON TABLE copies.copy_run TO hub_company;
GRANT UPDATE(system_message) ON TABLE copies.copy_run TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE notifications.alert_recipient TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE notifications.copy_follower TO hub_company;
GRANT SELECT,INSERT ON TABLE notifications.copy_notice TO hub_company;
GRANT UPDATE(read_at) ON TABLE notifications.copy_notice TO hub_company;
```

Cada linha entra na ordem que o instantâneo dá (o `pg_dump` ordena por objeto): as três de `copy_run` logo depois de `:412`, as quatro de `notifications` antes de `notifications.notification` (`:433`). As linhas de linha (quem vê o quê) são das políticas do PR 1088, não destas permissões (data D12, security S7).

### As skills e a leitura

`docs/reference/stack.md`: `drizzle-orm` e `pg` (`apps/server/src`, `apps/server/src/platform`), sem skill; ler `docs/guides/data.md` D5, D9 a D12. Nenhuma skill de biblioteca.

### A ordem do trabalho

1. **As sete permissões, nos dois arquivos.** Critérios: 70, 73.
   - **Arquivos:** muda `apps/server/database-grants.sql`; cria `apps/server/migrations/<carimbo>_copy_alerts_grants/migration.sql` com `npm run generate -w @conexus/server -- --custom --name copy_alerts_grants` (confira a opção no `drizzle-kit` instalado; o commit `d848c6b1` mostra o resultado, com o `snapshot.json`).
   - **Referência a seguir:** `d848c6b1`, os dois arquivos.
   - **O que sai:** nada.
   - **O que entra:** as sete linhas acima, as mesmas nos dois arquivos, uma instrução por `--> statement-breakpoint`; em `database-grants.sql`, um comentário por bloco que cita a palavra do fundador com a data e o rótulo que ele der (data D11), no texto dos comentários de `:423-424`. Regras: data D5, D11, D12.
   - **Testes:** `catalog.test.ts`, `'o instantâneo depois de migrate é o de database-grants.sql'`.
   - **Mutações à mão:** tire da migração só a linha `UPDATE(read_at)` de `copy_notice`: o instantâneo fica vermelho. Ponha `UPDATE` em `copy_notice` inteira nos dois arquivos: o caso de recusa de `copy_name` (passo 2) fica vermelho.
   - **Pronto quando:** o instantâneo passa e `npm run migrations -- --base origin/main` passa.
2. **O que o login pode e o que não pode.** Critérios: 71, 72.
   - **Arquivos:** muda `apps/server/src/platform/catalog.test.ts`.
   - **Referência a seguir:** a lista `REFUSED` e o seu laço, `catalog.test.ts:171-197`.
   - **O que sai:** nada.
   - **O que entra:** em `REFUSED`, as recusas do critério 72 (`update copies.copy_run set whole = true where false`, `update notifications.alert_recipient set email = '' where false`, `update notifications.copy_follower set created_at = now() where false`, `delete from notifications.copy_notice where false`, `update notifications.copy_notice set copy_name = '' where false`). O Postgres confere a permissão antes da política e do `WHERE`, então `42501` sai mesmo sem linha. Um caso novo, `'o login do Hub tem os verbos dos avisos de cópia'`, com o mesmo `database.installation` do laço, roda as doze instruções do critério 71 com `where false` e espera que nenhuma lance.
   - **Testes:** os casos acima.
   - **Mutações à mão:** tire `DELETE` de `copy_follower` nos dois arquivos: o caso positivo fica vermelho. Dê `UPDATE(whole)`: a recusa de `whole` fica vermelha.
   - **Pronto quando:** `catalog.test.ts` passa inteiro.

### Como se prova

- 70: o instantâneo lê o catálogo do banco migrado (a gravação é a migração); hoje falha porque o arquivo não tem as sete linhas.
- 71: doze instruções pelo login do Hub; hoje cada uma dá `42501`, porque as tabelas do PR 1088 têm só as linhas `OWNER`.
- 72: as recusas continuam `42501` depois da unidade; elas provam que as permissões ficaram estreitas (data D12).
- 73: o diff do PR.

### Parar se

- O fundador não deu a palavra sobre as sete linhas: o PR fica aberto e nada mais entra nele (data D11).
- O `drizzle-kit` instalado não gera a migração à mão como `d848c6b1`: pare e informe, com a saída.
- Uma das instruções positivas dá `42501` mesmo com a linha no arquivo: a política ou a ordem das migrações está errada; pare e informe, sem trocar a permissão por uma mais larga.

## G5 O ponto de conferência

Depois de U10, os passos 6 e 7 do `conexus-build`: `catalog.test.ts` e `notifications/tables.test.ts` (do PR 1088) pelo comando de testes do servidor; `npm run migrations -- --base origin/main`; o `migrate` num banco novo. O PR leva no corpo a tabela "o que o login do Hub passa a poder" das notas e pede a palavra do fundador; ele não se mescla sem ela.

## U11 A passada inteira no motor

**Base e modelo.** O `main` com o PR 1088 mesclado (a coluna `whole` de `copy_run`, hoje no head do PR 1088, `4d498ada`, `apps/server/src/hub/copies/tables.ts`, `copyRun`). Sonnet: muda um caminho que já existe, sem concorrência nova (a trava de hoje).

### As linhas da tabela

- `claim` em `apps/server/src/hub/copies/run.ts` (o PR 1078 mudou o arquivo: procure pelo nome) e `runCopy` no mesmo arquivo.
- `datedPasses` e `ofCopy`, `sources.ts:38-61`; `passed`, `sources.ts:127-149`, que move o `watermark` só quando a passada fecha.
- `datesOf`, `source-pass.ts:39-47`; `closedPass`, `:86-103`; `stepOf`, `:167-187`; `sourcePass`, `:194-214` (a linha de `:199-200`, a coluna inativa, não muda).
- `closePass`, `apps/server/src/platform/copy-sql.ts:243-288`; o tipo ligado em `company-postgres.ts:183` e `:360`.
- `service.run`, `service.ts:45-46`; `run` de `copiesOn`, `test-copies.ts:197-199`.
- O kit lê tudo sem `since`: `packages/connectors/src/kernel/copy.ts:191` (#940) e `packages/connectors/src/sankhya/copy-read.ts` (herdado da spec; confira as linhas).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/` (`run.ts`, `sources.ts`, `source-pass.ts`, `service.ts`, `test-copies.ts`) | Muda | o workflow `conexus-copy-run` chama `service.run`; os testes de cópias chamam `on.run` |
| `apps/server/src/platform/copy-sql.ts`, `company-postgres.ts` | Muda (a entrada de `closePass`) | `closedPass` em `source-pass.ts` |

### Os contratos que a unidade cria

```ts
// apps/server/src/hub/copies/service.ts
run: (input: { companyId: CompanyId; copyId: CopyId; whole?: boolean }, signal: AbortSignal) => Promise<CopyRunEnd>
// apps/server/src/hub/copies/run.ts
export async function runCopy(deps: CopiesDeps, ids: Ids & { whole: boolean }, signal: AbortSignal): Promise<CopyRunEnd>
// apps/server/src/hub/copies/sources.ts
export function wholePasses(tx: CommandTx, ids: Ids): /* o UPDATE de copySource */
// apps/server/src/platform/copy-sql.ts
input: CopyTable & { pass: number; windowFrom: string | null; readAll: boolean; account: CopyAccount }
// apps/server/src/hub/copies/test-copies.ts
run(copyId: CopyId, signal?: AbortSignal, whole?: boolean): Promise<CopyRunEnd>
```

- **Cada estado:** `whole` é um booleano da rodada, não um estado; `readAll` é derivado e nunca guardado.
- **Cada id:** `CompanyId`, `CopyId`, `CopyRunId` de `@conexus/hub-api`, conferidos onde já são.
- **O dono de cada fato:** "leu tudo" tem um dono só, `sourcePass` (`readAll = definition.changedSince === null || since === null`); `closePass` só obedece.
- **Esquema Zod:** nenhuma entrada externa nova.
- **O arquivo modelo:** `sources.ts` (`datedPasses`) cumpre C21, C23 e C26.

### As skills e a leitura

`docs/reference/stack.md`: `drizzle-orm` e `pg` (sem skill); `fastify` (`fastify-best-practices`) não é tocado. Ler testing T5, T26, T27 e data D25.

### A ordem do trabalho

1. **A rodada pedida como inteira.** Critérios: 81, 84, 98.
   - **Arquivos:** muda `service.ts`, `run.ts`, `sources.ts`, `test-copies.ts`.
   - **Referência a seguir:** `datedPasses`, `sources.ts:56-61`.
   - **O que sai:** nada.
   - **O que entra:** `whole` na entrada de `service.run` (ausente é falso) e de `runCopy`; em `claim`, o `INSERT` de `copyRun` leva `whole`, e depois de `datedPasses(tx, ids)`, só quando `whole`, `wholePasses(tx, ids)`, que põe `watermark: null`, `position: null`, `passStartedAt: statement_timestamp()` e `pass: pass + 1` em cada fonte da cópia; `waitUntil` fica. Somar um a `pass` faz as linhas que a passada interrompida gravou, com a marca dela (`copy-sql.ts:217-221`), contarem como velhas: a passada inteira que fecha apaga as que não releu (`copy-sql.ts:258`). `on.run` repassa `whole`. Regras: C26, data D25.
   - **Testes:** `run.test.ts`, `'a passada inteira começa do zero mesmo no meio de uma passada'` (depois de uma passada `COMPLETE` de `clientes`, `plantSource(on, copyId, 'position = $2', [{ kind: 'KEY', after: [<um CODPARC do meio>] }])`, rode com `whole`: as linhas e o número são os de antes), `'a rodada inteira fica marcada'` (lido pelo dono, como `delete.test.ts:173`) e `'a passada inteira no meio de uma passada apaga o que a passada interrompida gravou e sumiu'` (`TEST_TUNING` com `runPages: 1`: uma rodada normal de `clientes` termina `PARTIAL` com a primeira página gravada; ponha um `CODPARC` dessa página em `on.gate.gone`; rode com `whole` até `COMPLETE`: a linha sai). Este último caso depende do passo 2 e fica vermelho até ele.
   - **Mutações à mão:** em `wholePasses`, deixe de zerar `position`: o primeiro teste fica vermelho (linhas somem). Grave `whole: false` no `INSERT`: o segundo fica vermelho. Tire o `pass + 1`: o terceiro fica vermelho (a linha fica).
   - **Pronto quando:** os dois primeiros testes passam; o terceiro, depois do passo 2.
2. **O apagar decidido por "leu tudo".** Critérios: 80, 82, 83, 85.
   - **Arquivos:** muda `source-pass.ts`, `copy-sql.ts`, `company-postgres.ts` (o tipo, se não derivar sozinho).
   - **Referência a seguir:** `closePass`, `copy-sql.ts:254-269`.
   - **O que sai:** a decisão por `changedSince === null` em `copy-sql.ts:254-255`, com o seu único chamador, `closedPass`.
   - **O que entra:** em `sourcePass`, `readAll` ao lado de `since`; o parâmetro `windowFrom` de `stepOf`, `pageStep` e `closedPass` vira `ends: { windowFrom: string | null; readAll: boolean }`; `closedPass` passa `readAll` a `closePass`. Em `closePass`:

     ```ts
     const gone: SqlStatement[] = input.readAll
       ? [{ text: `DELETE FROM ${table} WHERE ${COPY_PASS_COLUMN} <> $1${whole.where}`, values: [input.pass, ...whole.values] }]
       : window !== undefined && input.windowFrom !== null
     ```

     O comentário de `closePass` (`:238-242`) passa a dizer "uma passada que leu tudo". Regras: C26.
   - **Testes:** em `run.test.ts`, na forma de `'a janela apaga o que sumiu'` (`:154-170`): `'a passada inteira apaga o que sumiu numa cópia incremental'` (ligue `clientes`, rode até `COMPLETE`, ponha um `CODPARC` em `on.gate.gone`, que filtra a primeira célula de toda página, `test-copies.ts:76-80`; rode sem `whole`: fica; com `whole`: sai); `'a passada inteira que falha não apaga'` (com `refuse.add('consultar')`, rode com `whole`: `ERROR` e as linhas de antes; tire a recusa e rode sem `whole`: sai); `'a passada inteira que não cabe numa rodada continua na seguinte'` (`TEST_TUNING` com `runPages: 1`: com `whole`, `PARTIAL` e a linha fica; sem `whole` até `COMPLETE`: sai). `'a janela apaga o que sumiu'` passa sem mudança.
   - **Mutações à mão:** troque `readAll` por `definition.changedSince === null`: o primeiro teste fica vermelho. Chame `wholePasses` também sem `whole`: o primeiro fica vermelho na rodada sem `whole`. Calcule `readAll` como `true`: `'a janela apaga o que sumiu'` fica vermelho (o que está fora da janela sai).
   - **Pronto quando:** os testes novos, `run.test.ts` e `run-v2.test.ts` passam.

### Como se prova

- 80: a gravação é o `DELETE` em `sync.sankhya_clientes`; lido por `syncRows`. Hoje a rodada inteira não existe e a incremental nunca apaga.
- 81: lê as linhas depois de uma rodada inteira com posição plantada; hoje não há como pedir a rodada.
- 98: lê as linhas depois de uma passada interrompida e de uma passada inteira; hoje a incremental nunca apaga.
- 82: a recusa do Sankhya falso; mostra `ERROR` e as linhas intactas, depois o apagar.
- 83: o teto de páginas; mostra `PARTIAL` sem apagar.
- 84: lê `copies.copy_run.whole` pelo dono.
- 85: o teste de hoje, que fica verde.

### Parar se

- O portão `gone` não filtra as linhas de `clientes` (a primeira célula não é `CODPARC`): acrescente o caso no portão de `test-copies.ts`, e só isso.
- Um teste de hoje que espera que uma cópia incremental de `watermark` nulo não apague fica vermelho: pare e informe; a mudança de comportamento é a desta unidade, e o teste de hoje precisa da palavra de quem o escreveu (card).

## U12 A segunda linha do relógio

**Base e modelo.** O `main` com o PR 1088 e U11. Opus: a ordem das duas criações decide se a repetição de Ligar ainda dispara a primeira rodada, e a corrida do `create` e a passada ao subir em dois Hubs são concorrência.

### As linhas da tabela

- `createCopyClock`, `ownedOf`, `stateOf`, `CRONS`, `COPY_TIMEZONE`, `Metadata` e `releaseCopies`, `apps/server/src/builder/copy-clock/clock.ts:11-121`.
- `CopyInput`, `copyRun` (o passo `run` e o caso `GONE`, `:58-62`) e `scheduleIdOf`, `workflow.ts:16-84`.
- `CopyClock`, `apps/server/src/hub/copies/store.ts:47-62`; `companyScope`, `store.ts:109`; `parsedCopy`, `enable.ts:126-135`.
- Quem chama `set`: `enable.ts:183`, `schedule.ts:53` (retomar sem linha) e `:66` (mudar o intervalo); `admitted`, `schedule.ts:16-26`.
- `copyModeOf`, `mode.ts:9-13`.
- A passada ao subir: `main.ts:261-274`; `repairApps`, `hub/apps/repair.ts:218-236`.
- `@mastra/core@1.82.0`: `dist/schedules-D8PrAbVN.js:316-322` (`canonicalizeScheduleId`), `:409-417` (`#load`), `:492-525` (`create` de workflow, com `status`), `:536-549` (`get`, `list`), `:561-600` (`update`), `:660-699` (`delete`, `pause`, `resume`), `:808-828` (a vista da linha, com `inputData`, `status`, `nextFireAt`); `dist/schedules/schedules.d.ts:95-115`; `dist/docs/references/reference-schedules-overview.md` (`status`, `get`, `update`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/copy-clock/` (`clock.ts`, `workflow.ts`, `clock.test.ts`) | Muda | `main.ts` monta o relógio e o workflow |
| `apps/server/src/hub/copies/` (`store.ts`, `enable.ts`, `schedule.ts`, `service.ts`, `test-copies.ts`, `delete.test.ts`) | Muda | as rotas de cópias; `releaseCopies` |
| `apps/server/src/hub/copies/whole.ts` | Cria | `service.ts` |
| `apps/server/src/hub/connectors/unlink-copies.test.ts` | Muda (a contagem) | ninguém |
| `apps/server/src/main.ts`, `main.test.ts` | Muda (um passe ao subir, e o caso que o vê) | o programa |

### Os contratos que a unidade cria

```ts
// apps/server/src/builder/copy-clock/workflow.ts
export const CopyInput = z.object({ version: z.literal(1), companyId: CompanyIdSchema, copyId: CopyIdSchema, whole: z.literal(true).optional() })
export function wholeScheduleIdOf(copyId: CopyId): string // `schedule_${copyId}-whole`
// apps/server/src/builder/copy-clock/clock.ts
const WHOLE_CRON = '7 4 * * 0' // ao lado de CRONS: o único lugar de crons (C26)
// apps/server/src/hub/copies/store.ts, CopyClock
set(input: { companyId: CompanyId; copyId: CopyId; interval: CopyInterval; incremental: boolean }): Promise<'CREATED' | 'UPDATED'>
ensureWhole(input: { companyId: CompanyId; copyId: CopyId }): Promise<void>
wholeMissing(): Promise<readonly { companyId: CompanyId; copyId: CopyId }[]>
// apps/server/src/hub/copies/whole.ts, exposta no serviço
export async function ensureWholeLines(deps: CopiesDeps): Promise<void>
```

- **Cada estado:** a linha semanal tem os estados do Mastra (`active`, `paused`); `states` continua `ReadonlyMap<CopyId, CopyState>` com só a normal.
- **Cada id:** o id da linha é um `string` montado só por `scheduleIdOf` e `wholeScheduleIdOf` (C26); `CopyId` conferido por `CopyInput` (C23, C27).
- **O dono de cada fato:** "incremental" é `copyModeOf(definition).kind !== 'WHOLE'`, calculado pelos três chamadores de `set` e por `ensureWholeLines`, nunca guardado na linha.
- **Esquema Zod:** `CopyInput` lê o `inputData` guardado; as linhas de hoje, sem `whole`, continuam válidas.
- **O arquivo modelo:** `clock.ts` cumpre C21, C23 e C26.

O comportamento: `set` com `incremental` cria primeiro a semanal (com o `status` da normal quando a normal existe; `active` quando não) e depois a normal, e `CREATED` continua dizendo que a normal nasceu nesta chamada; sem `incremental`, apaga a semanal. `pause` e `resume` agem primeiro na normal, depois na semanal só se `get` a acha. `remove` apaga primeiro a semanal, depois a normal, sem ler. `runNow` só na normal. `states` pula `input.whole === true`. `ensureWhole` lê a normal e, sem a semanal, cria a semanal com o `status` da normal e o tratamento de corrida de `clock.ts:77-81`; nunca chama `update` na normal. `wholeMissing` lê o mesmo `schedules.list` de `states`. Na implantação em rodízio, um Hub antigo que leia a linha semanal a roda como normal (decisão 27).

### As skills e a leitura

`docs/reference/stack.md`, `@mastra/core` (`apps/server/src/builder`): skill `mastra`; ler `node_modules/@mastra/core/dist/docs/` (as duas páginas de agendamento) e o `dist` citado acima. Ler testing T5, T20, T27.

### A ordem do trabalho

1. **As duas linhas no relógio.** Critérios: 86, 87, 88, 89, 95.
   - **Arquivos:** muda `workflow.ts`, `clock.ts`, `store.ts`, `enable.ts`, `schedule.ts`, `test-copies.ts` (`clockDouble`), `clock.test.ts`.
   - **Referência a seguir:** `set` e o seu `catch`, `clock.ts:64-83`; `@mastra/core@1.82.0` `dist/schedules-D8PrAbVN.js:492-525`, `:660-699`.
   - **O que sai:** nada.
   - **O que entra:** os contratos acima. `enable.ts:183` passa `incremental` de `stored.definition`; em `schedule.ts`, `admitted` passa a ler também `copy.definition` (parsed como `parsedCopy`) e devolvê-la, e `:53` e `:66` passam `incremental`. `clockDouble` anota `set ${copyId} ${interval} ${incremental}`, devolve `[]` em `wholeMissing` e nada faz em `ensureWhole`. Regras: C26, C27, C52.
   - **Testes:** em `clock.test.ts`, com o relógio real (`copiesOn(t, undefined, TICK_MS)`): `'a linha semanal anda com a cópia'` (ligue `clientes`; `hub.mastra.schedules.get('schedule_<id>-whole')` com cron, fuso, `inputData.whole` e `active`; pause pela rota: as duas `paused`; retome: as duas `active`; apague pela rota: nenhuma); `'a cópia que relê tudo não tem linha semanal'` (ponha `changedSince` nulo na definição com `plantCopy`; confira o caminho no JSON da definição; mude o intervalo pela rota: só a normal); `'a lista de cópias mostra uma entrada por cópia'`; `'a linha semanal que falha ao nascer não perde a primeira rodada'` (com `t.mock.method` em `schedules.create` lançando só para o id `-whole` na primeira chamada; Ligar responde a falha e não há linha; repita o pedido com a mesma chave: as duas linhas e uma rodada só). As contagens de hoje dobram, cada uma com a razão "a linha normal e a semanal de cada cópia": `clock.test.ts:138` e `:143` (2 para 4); `delete.test.ts:191` (2 para 4), `:193` (1 para 2), `:261` (1 para 2); `unlink-copies.test.ts:120` (2 para 4).
   - **Mutações à mão:** sufixo `_whole`: o primeiro teste fica vermelho no `get`. Tire a semanal de `pause`: o primeiro fica vermelho. Tire o filtro de `states`: o terceiro fica vermelho. Crie a normal antes da semanal: o quarto fica vermelho (a repetição vê `UPDATED` e não roda).
   - **Pronto quando:** os testes novos e os ajustados passam, e `npm run typecheck` passa.
2. **O disparo e o pulo.** Critérios: 90, 91, 93.
   - **Arquivos:** muda `workflow.ts`, `clock.test.ts`.
   - **Referência a seguir:** o passo `run`, `workflow.ts:46-66`; o disparo forçado, `clock.test.ts:62-65`.
   - **O que sai:** o `delete` só da normal no caso `GONE` (`workflow.ts:60`).
   - **O que entra:** o passo chama `run({ companyId, copyId, whole: read.data.whole === true }, abortSignal)`; `RUNNING` com `whole` imprime `deps.log.info({ companyId, copyId }, 'COPY_WHOLE_PASS_SKIPPED')`; `GONE` apaga a semanal e a normal. O tipo `Deps.copies` ganha `whole`. Regras: S41.
   - **Testes:** `'a linha semanal dispara a passada inteira'` (ponha o `nextFireAt` da semanal no passado e acorde o agendador: a rodada nova tem `whole = true`, lido pelo dono); `'a linha semanal com uma rodada aberta é pulada'` (com `holdPage(on)` segurando a normal, dispare a semanal: nenhuma rodada nova e a linha de log); `'a cópia que sumiu leva as duas linhas'` (apague a linha de `copies.copy` pelo dono, dispare a normal: nenhuma linha).
   - **Mutações à mão:** passe `whole: false` sempre: o primeiro teste fica vermelho. Tire o log: o segundo fica vermelho. Apague só a normal em `GONE`: o terceiro fica vermelho.
   - **Pronto quando:** os três testes passam.
3. **A cópia antiga ganha a linha ao subir.** Critérios: 92, 94.
   - **Arquivos:** cria `whole.ts`; muda `service.ts`, `main.ts`, `main.test.ts`, `clock.test.ts`.
   - **Referência a seguir:** `repairApps`, `hub/apps/repair.ts:218-236`; o passe de `main.ts:264-268`.
   - **O que sai:** nada.
   - **O que entra:** `ensureWholeLines` chama `wholeMissing`, agrupa por empresa e, para cada uma, lê as definições dessas cópias no escopo `companyScope(companyId)`; chama `ensureWhole` para cada incremental; uma empresa que falha imprime `COPY_WHOLE_LINES_FAILED` com `companyId` e `code`, e segue; no fim, uma linha só, `COPY_WHOLE_LINES` com `companies` e `count`, também com zero. Em `main.ts`, ao lado de `resumeCopies`, `void copies.ensureWholeLines().catch((error: unknown) => logFailure(log, databaseFailure(error)))`. Regras: C53, S41.
   - **Testes:** em `apps/server/src/main.test.ts`, `'ao subir, o Hub passa as linhas semanais'`: `startHub` e `until` (como `:220-233`) esperam uma linha `COPY_WHOLE_LINES`. E `'ao subir, a cópia antiga ganha a linha semanal'` (pause pela rota, apague só a semanal com `hub.mastra.schedules.delete`, guarde o `nextFireAt` da normal, chame `on.hub.copies.ensureWholeLines()`: a semanal volta `paused` e o `nextFireAt` da normal é o mesmo; chame de novo: nada muda). `'a empresa apagada leva as agendas'` com a contagem 4 para 0.
   - **Mutações à mão:** crie a semanal sem o `status` da normal: o teste fica vermelho (volta `active`). Chame `set` em vez de `ensureWhole`: fica vermelho no `nextFireAt`. Tire a chamada de `main.ts`: o caso de `main.test.ts` fica vermelho.
   - **Pronto quando:** os testes passam e o Hub local sobe com `COPY_WHOLE_LINES` no log.

### Como se prova

- 86, 88: a gravação é a linha do Mastra; lida por `schedules.get` e `list`. Hoje só há a normal.
- 87: a linha semanal sai ao mudar o intervalo de uma cópia sem data de alteração.
- 89: `GET` das cópias pela rota.
- 90, 91: o disparo real do agendador; lê `copy_run.whole` e `on.hub.lines`.
- 92: o passe chamado pelo serviço, e o processo real do Hub que o chama ao subir; hoje não existe.
- 93: o caso `GONE` do passo.
- 94: os testes de hoje, com as contagens dobradas; `COPY_SCHEDULE_LEFT` no agendador calado.
- 95: o mock no `create`; mostra a falha, depois uma rodada só.

### Parar se

- O `create` do Mastra não aceita `status: 'paused'` na versão instalada: pare e informe com a linha do `dist`.
- O caminho de `changedSince` na definição guardada não é o que `plantCopy` alcança: pare e informe; não troque o teste por uma cópia montada à mão.
- `resume` de uma cópia sem linha cai em `set` (`schedule.ts:53`) e a definição não está à mão: leia na transação de `admitted`, e só ali.

## U13 Passada inteira na aba Rodadas

**Base e modelo.** O `main` com o PR 1088 e U11. Sonnet: um campo do contrato e uma marca na tela.

### As linhas da tabela

- `CopyRun`, `packages/hub-api/src/copies.ts:43-57` (no `main`; com o PR 1088, `SYSTEM_MESSAGE_MAX` entra antes).
- `runOf`, `apps/server/src/hub/copies/list.ts:37-58`; `runsPage`, `test-routes.ts:28`; o caso de rodadas em `routes.test.ts:167-177`.
- `RunRow` e `RunPhoneRow`, `apps/web/src/hub/copies/copy-detail.tsx:36-60`; `outcomeText`, `text.ts:175-189`; `copyRun`, `test-hub.tsx:46`; `'as rodadas: cada uma em palavras, na aba Rodadas'`, `copy-detail.test.tsx:15`.
- O protótipo `b2-rodadas-inteira`: "Completa · Passada inteira", a marca em `text-2`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/copies.ts` | Muda (`CopyRun.whole`) | o servidor (`list.ts`) e a web (aba Rodadas); o contrato de acesso o leva em `kept.lastRun` (`company-data.ts:40`), lido pela trilha Agentes e Apps (delivery L27) |
| `packages/hub-api/src/company-data.test.ts` | Muda (o `lastRun` do mundo falso, `:78-85`, ganha `whole: false`) | `npm test -w @conexus/hub-api` |
| `apps/server/src/hub/copies/` (`list.ts`, `routes.test.ts`) | Muda | a rota de rodadas |
| `apps/web/src/hub/copies/` (`copy-detail.tsx`, `text.ts`, `test-hub.tsx`, `copy-detail.test.tsx`, `copy-list.test.tsx`, `run-follow.test.tsx`) | Muda (as rodadas escritas à mão ganham `whole`) | a página da tabela |
| `apps/web/sweep-copies-states.ts` | Muda (`DONE` ganha `whole: false`; `RUNNING` e `SOURCE_DOWN` herdam) | a varredura das cópias |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts, em CopyRun
whole: z.boolean(), // a rodada começou cada fonte do zero
// apps/web/src/hub/copies/text.ts
export const WHOLE_PASS = 'Passada inteira'
```

- **Cada estado:** `whole` é um booleano ao lado de `outcome`, que continua a união por `kind`.
- **O dono do texto:** `WHOLE_PASS` em `text.ts` (C26); o fundador aprova no fim da etapa (`text.ts:12`).
- **O arquivo modelo:** `list.ts` (`runOf`) cumpre C21 e C23.

### As skills e a leitura

`docs/reference/stack.md`: `react`, `@tanstack/react-query` (`apps/web/src`), sem skill; `@shadcn/react` (`apps/web/src/ui`), skill `shadcn`, só para ler a `TableCell`. Ler web W rules da página da tabela.

### A ordem do trabalho

1. **O campo no contrato e na rota.** Critério: 97.
   - **Arquivos:** muda `packages/hub-api/src/copies.ts`, `packages/hub-api/src/company-data.test.ts`, `list.ts`, `routes.test.ts`, `apps/web/src/hub/copies/test-hub.tsx` (`copyRun` ganha `whole: false`), `apps/web/sweep-copies-states.ts` e cada rodada escrita à mão que o `typecheck` apontar (`git grep -n "written: [0-9]"` acha as de hoje). O PR cita delivery L27: o campo novo entra no contrato de acesso pelo `kept.lastRun`.
   - **Referência a seguir:** `runOf`, `list.ts:38-44`.
   - **O que sai:** nada.
   - **O que entra:** `whole: row.whole` em `base`. Regras: C27.
   - **Testes:** `routes.test.ts`, `'as rodadas dizem qual foi inteira'` (uma rodada com `on.run(copyId, undefined, true)` e uma sem; `runsPage` devolve `true` e `false`).
   - **Mutações à mão:** `whole: false` fixo em `runOf`: o teste fica vermelho.
   - **Pronto quando:** o teste, `npm test -w @conexus/hub-api` e `npm run typecheck` passam.

2. **A marca na linha.** Critério: 96.
   - **Arquivos:** muda `copy-detail.tsx`, `text.ts`, `copy-detail.test.tsx`.
   - **Referência a seguir:** o `text-text-2` de `RunPhoneRow`, `copy-detail.tsx:54`.
   - **O que sai:** nada.
   - **O que entra:** em `RunRow`, a célula do resultado mostra `outcomeText(run)` e, com `run.whole`, `<span className="text-text-2"> · {WHOLE_PASS}</span>`; em `RunPhoneRow`, o texto ganha ` · ${WHOLE_PASS}` no fim quando `run.whole`. Regras: C26, W rules de texto.
   - **Testes:** `'as rodadas: a passada inteira aparece ao lado do resultado'`, na forma do caso de `:15`: uma rodada com `whole: true` mostra "Passada inteira" na tabela e na linha do celular; uma sem não mostra.
   - **Mutações à mão:** inverta a condição: o teste fica vermelho.
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- copy-detail.test.tsx` passa.

### Como se prova

- 96: a tela com o servidor falso; hoje "Passada inteira" não existe.
- 97: a rota de rodadas sobre a gravação de U11; hoje o campo não existe.

### Parar se

- A célula do resultado já recebe outra marca de outra unidade do cartão (o item (a)): ponha a marca depois dela e informe.

## G6 O ponto de conferência

Depois de U13, os passos 6 e 7 do `conexus-build`: os testes do servidor de `run.test.ts`, `run-v2.test.ts`, `clock.test.ts`, `delete.test.ts`, `unlink-copies.test.ts`, `routes.test.ts`; `copy-detail.test.tsx`; o contrato; o Hub local subindo com `COPY_WHOLE_LINES`, uma cópia ligada com as duas linhas no agendador, a semanal disparada à mão (`nextFireAt` no passado) e a aba Rodadas mostrando "Passada inteira" a 1366 e 390 px, nos dois temas. O PR diz o limite da coluna inativa: a passada inteira detecta a coluna que sumiu só quando cabe numa rodada (`source-pass.ts:199-200`). "Passada inteira" vai para a palavra do fundador no fim da etapa.

## U14 O bloco Fontes da tela A

**Base e modelo.** O `main` com G3 e o PR 1111 mesclados. Sonnet: peças que já existem. Linhas lidas
no `main` em `d9f56971`.

**A lição.** O critério escrito tinha ficado mais pobre que a tela aprovada; a conferência desta
unidade compara com a tela A, elemento por elemento.

### As linhas da tabela

- `Sources`, `apps/web/src/builder/conversation/sources.tsx:28-68` (a seção `:31-36`; `copiedText` e
  `liveText` `:8-25`); `MessageSource`, `copiedFrom`, `liveOf` e `keyOf`, `sources.ts:14-23`,
  `:71-90`, `:118-126`, `:129-131`; `systemText`, `apps/web/src/hub/copies/text.ts:37-41`, com o uso
  e o export do PR 1111.
- `ConnectorLogo small`, `apps/web/src/hub/connectors/logo.tsx:9-32`, e o molde numa linha,
  `tool-bodies.tsx:147-151`; `BLOCK`, `tool-bodies.tsx:19-20`; `wordsOf`, `connector-words.ts:11-41`;
  `ConnectorWords`, `tool-spec.ts:72-78`; `PLAIN_WORDS`, `connector-specs.ts:134-138`.
- `Stamp`, `apps/web/src/ui/block.tsx:37-48`; os tons de `Badge`, `badge.tsx:8-20`; `stateBadge`,
  `apps/web/src/hub/connectors/text.ts:35-45`, e o molde `apps/web/src/builder/assistant/day.tsx:101`; `DESIGN.md:558-561`.
- `BUILDER_ROOM`, `room.ts:80-86`; `BuilderChat`, `panel.tsx:34-56`; `useConnectorCatalog`,
  `apps/web/src/builder/assistant/connector-names.ts:14-21`; `connectionsQuery`,
  `apps/web/src/hub/connectors/queries.ts:26-28` (exportada em `public.ts:6`, como `stateBadge` `:28`
  e `ConnectorLogo` `:3`).
- Os testes: `sources.test.tsx:38-107` e `:152-236`; `openConversation`, `panel.test.tsx:28`;
  `apps/web/sweep-connections.ts:26`; `apps/web/sources.layout.test.ts:60-82`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/sources.ts` (`MessageSource`) | Muda: `connections` e `reauth` no lugar de `system` | `rows.ts:262`, `sources.tsx`, `CitedRow` |
| `apps/web/src/builder/conversation/sources.tsx` | Muda: a linha da fonte de dado | a linha `sources` da conversa |
| `apps/web/src/builder/conversation/tool-spec.ts` (`ConnectorWords`) | Muda: `logo` e `auth` | `wordsOf`, `PLAIN_WORDS`, todo `Room` |
| `apps/web/src/builder/conversation/connector-words.ts`, `connector-specs.ts` | Muda | `useConnectorCatalog`, `BUILDER_ROOM`, `ASSISTANT_ROOM`, os testes que montam palavras |
| `apps/web/src/builder/conversation/panel.tsx` | Muda: o `Room` do Builder com o nome e a logo do catálogo | a rota da conversa do Projeto |
| `useConnectorCatalog` (de `builder/assistant/connector-names.ts` para `builder/conversation/`) | Move; `logo` passa a `words.logo` | os oito chamadores de hoje em `builder/agents/` e `builder/assistant/`, pela reexportação, e `panel.tsx` |
| `apps/web/src/ui/block.tsx` (`Stamp`) | Muda: aceita `className` | os de `git grep -l Stamp apps/web/src` (`builder/agents/rows.tsx` entre eles) e `sources.tsx` |
| `sources.test.tsx`, `panel.test.tsx`, `apps/web/sources.layout.test.ts` | Muda | `npm run test:unit` e `npm run test:browser -w @conexus/web` |

### Os contratos que a unidade cria

```ts
// apps/web/src/builder/conversation/sources.ts
export type MessageSource =
  | { kind: 'web'; url: string; title: string | undefined; domain: string; linked: boolean }
  | { kind: 'data'; connector: string
      /** The names of the connections the place gives, in the order of `systems`; a NOT_GIVEN one is not here. */
      connections: readonly string[]
      /** Whether one of them waits for a new authorization (NEEDS_REAUTH). */
      reauth: boolean
      table: string; at: string | null; state: 'FRESH' | 'PARTIAL' | 'STOPPED' | 'LIVE' }

// apps/web/src/builder/conversation/tool-spec.ts
export type ConnectorWords = {
  name: (connector: string) => string
  /** The connector's logo, once the catalog is read. */
  logo: (connector: string) => string | undefined
  /** How the connector links, for the words of a refused connection; 'oauth2_code' for one the catalog lacks. */
  auth: (connector: string) => ConnectorEntry['auth']
  logoOf: (connectionId: string) => string | undefined
  refusal: (connector: string | undefined, why: ConnectorRefusal) => string
}

// apps/web/src/ui/block.tsx
export function Stamp(props: { tone: …; className?: string; children: ReactNode }): ReactNode
```

- **Estados.** `state` separa cópia e leitura ao vivo (C21, C22); o tom sai de uma função só:
  `FRESH` e `LIVE` `success`, `PARTIAL` `warning`, `STOPPED` `danger`, `at` nulo `neutral`.
- **Donos.** `copiedText` e `liveText` (as palavras), `systemText` (o nome), `stateBadge` (o selo),
  `wordsOf` (a logo e a autenticação) (C26). `keyOf` passa a `${connector}:${connections.join(',')}:${table}`.
- **Esquema de entrada externa.** O resultado guardado passa por `DataResult` ou `LiveResult`, como
  hoje (C27).
- **Arquivo modelo.** `sources.ts`: cumpre C21 e C26.

### As skills e a leitura

`shadcn` para `Badge` (`stack.md:63`); `impeccable` para conferir a linha com a tela A
(`docs/reference/impeccable.md`); web W7, W21, W34; design V3, V17, V35; testing T5, T23, T27.

### A ordem do trabalho

1. **A origem com a logo, as conexões e o estado.** Critérios: 42, 43, 110, 111, 113.
   - **Arquivos:** muda `sources.ts`, `sources.tsx`, `tool-spec.ts`, `connector-words.ts`,
     `connector-specs.ts`, `apps/web/src/ui/block.tsx`, `sources.test.tsx`.
   - **Referência a seguir:** a tela A, elemento por elemento (a tabela "Elemento da tela A" de G7);
     `tool-bodies.tsx:147-151` (a logo); `apps/web/src/builder/assistant/day.tsx:101` (o `Stamp`).
   - **O que sai:** `system` de `MessageSource` e a junção por vírgula de `copiedFrom`, com o id do
     conector no lugar de uma fonte `NOT_GIVEN` (`sources.ts:72-74`); a frase única em `text-fact
     text-text-2` da fonte de dado (`sources.tsx:39-44`); `named.get(connector)?.auth` repetido em
     `refusal` (`connector-words.ts:29`), que passa a ler `auth`.
   - **O que entra:** `copiedFrom` dá `connections` (o `name` de cada `NAMED`) e `reauth` (um deles
     em `NEEDS_REAUTH`); `wordsOf` ganha `logo` e `auth` pelo mesmo `named`, e `PLAIN_WORDS`,
     `() => undefined` e `() => 'oauth2_code'`; `Stamp` passa `cn(…, props.className)` ao `Badge`. A
     linha de `Sources` segue a tabela "Elemento da tela A" de G7: o nome por
     `systemText(connectors.name(connector), connections, 0)`, o selo por
     `stateBadge({ state: 'NEEDS_REAUTH' }, connectors.auth(connector))`, o carimbo com as palavras de
     `copiedText`. Regras: C21, C26, W21, V35.
   - **Testes:** os casos de 42, 43, 110 e 111, com `queried` aceitando `systems` e `WORDS` com um
     conector OAuth e um de chaves; cada peça lida por `within(item)` e o tom pela classe do carimbo,
     não pelo `textContent` juntado.
   - **Mutações à mão:** `PARTIAL` em `success` (vermelho: "a rodada parcial"); sem `reauth` ("a
     conexão à espera"); selo em `ACTIVE` ("a conexão ativa"); o id no lugar do `NOT_GIVEN` ("a fonte
     não dada"); sem `systemText` ("a conexão com o nome do sistema").
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/sources.test.tsx`
     passa.
2. **A leitura ao vivo da tela A.** Critérios: 45.
   - **Arquivos:** muda `sources.ts`, `sources.tsx`, `sources.test.tsx`.
   - **Referência a seguir:** `liveOf`, `sources.ts:118-126`.
   - **O que sai:** a frase de `sources.tsx:42`.
   - **O que entra:** `liveOf` dá `connections: [args.connection]` e `reauth: false`; a linha da
     cópia, com a operação na pastilha e o carimbo `ao vivo · ${liveText(at, now)}`.
   - **Testes:** os casos do critério 45 e a leitura tipada de hoje.
   - **Mutações à mão:** sem "ao vivo · " ("a fonte da leitura ao vivo"); só `clockOf(at)` ("vista
     noutro dia").
   - **Pronto quando:** os casos passam.
3. **A sala do Builder, com um dono do catálogo.** Critérios: 112.
   - **Arquivos:** move `useConnectorCatalog` de `builder/assistant/connector-names.ts` para
     `builder/conversation/` (o ciclo de C6, `.dependency-cruiser.cjs:62`, impede só o caminho
     contrário), com `connector-names.ts` reexportando; muda `panel.tsx`, `panel.test.tsx`.
   - **O que sai:** o `logo(connector)` do hook (`connector-names.ts:23-25`), que passa a ser
     `words.logo`; os quatro chamadores de `catalog.logo` não mudam.
   - **O que entra:** `BuilderChat` chama `useConnectorCatalog(companyId)` e põe `<Chat>` dentro de
     `<RoomContext.Provider value={{ ...BUILDER_ROOM, connectors: { ...words, refusal:
     PLAIN_WORDS.refusal } }}>`, num `useMemo`: do catálogo só o nome e a logo; as recusas do Builder
     ficam as de hoje. Regras: C26, L7.
   - **Testes:** os casos do critério 112, com a lista de conexões como `sweep-connections.ts:26` e,
     no segundo, com falha.
   - **Mutações à mão:** tire o `Provider` ("na conversa do Builder, a fonte tem o nome e a logo");
     tire o `refusal: PLAIN_WORDS.refusal` (a recusa de conector do Builder).
   - **Pronto quando:** `npm run test:unit -w @conexus/web -- src/builder/conversation/panel.test.tsx`
     passa.
4. **A largura.** Critérios: 47, 112, 113.
   - **Arquivos:** muda `apps/web/sources.layout.test.ts`.
   - **Referência a seguir:** o caso "a fonte do dado" (`:60-82`) e `sweep-connections.ts:26`.
   - **O que entra:** a lista de conexões nas `replies`; "Sankhya · Matriz" lido; a 1280 px a pastilha
     na linha do nome e o carimbo na borda direita; a 390 px a pastilha abaixo do nome, alinhada a
     ele, ou o carimbo inteiro na terceira; as linhas finas e 32 px por fonte; nada passa da largura.
   - **Pronto quando:** `npm run test:browser -w @conexus/web` passa.

### Como se prova

42, 43, 45, 110, 111 e 113: a mensagem gravada (T26) por `itemsOf`; hoje, uma frase cinza. 112: a
conversa do Projeto pela porta da tela; hoje, "sankhya". 47: o navegador mede as peças.

### Parar se

- O PR 1111 não está mesclado: relate; não refaça o `systemText` da leitura ao vivo nem o export.
- O ponto neutro não pega `line-strong` pelo `className` do `Stamp`: relate; não escreva outro carimbo.
- A linha não desce a 390 px pela quebra de `sm`: relate com as medidas; a quebra da tela ou uma
  consulta de contêiner é escolha do firstmate.
- Uma peça da tela A pede um token fora do `DESIGN.md`: relate.

## G7 O ponto de conferência

- Web: `npm run test:unit -w @conexus/web -- src/builder/conversation/sources.test.tsx src/builder/conversation/panel.test.tsx src/builder/conversation/tool-row.test.tsx` e `npm run test:browser -w @conexus/web`. Depois `npm run check`.
- Passos 6 e 7 de `conexus-build`: o Hub local com os dublês, no Assistente e no Builder, "Quanto
  vendi em outubro?" e uma leitura ao vivo, a 1366 e 390 px, nos dois temas (T23), ao lado da tela A,
  elemento por elemento, também o selo e o Projeto sem a conexão. As mutações, com o resultado (T27).
- Depois do PR, a QA (`conexus-qa`, T25) do bloco Fontes, por um agente que não construiu, com a
  matriz de G7 e a tela A; o relatório vai no PR antes da revisão.
