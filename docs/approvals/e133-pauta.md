# Etapa 13.3

Em 2026-11-01, ao pedir o visual novo do Hub: "não é para você utilizar e tentar melhorar o que a gente tem hoje ... A gente pode mudar o que a gente hoje em estrutura, em visual ... ele tem simetria, ele tem matemática dentro do design"; "Isso é para a gente definir o design.md completo, igual o Cloud Design faz, que traz até os componentes, fonte, métricas, estilos ... pode refatorar, mudar tudo, desde que seja mais coeso"; "sempre seguindo o nosso ... o que a gente tem de front-end nos nossos guias e metodologias ... se a gente está realmente não repetindo, se a gente está seguindo uma arquitetura ... reutilização de componentes, em bibliotecas e padronização"; e, sobre a AffectUI (https://www.affectui.com/components/agent-handoff): "Esse cara faz muita coisa inter que podemos copiar ou fazer para nosso sistema no que for viavel".

Em 2026-11-01, às capturas da Pauta: "Ficou boa a versão do layout". À linha da caixa, que deve ser uma peça com a mesma ordem em toda tela: "mais, depois o símbolo de pasta, ferramentas ... e aí o modelo e o símbolo de ... memória tá mais à direita".

Em 2026-11-01, à pergunta se o modelo pode ser trocado dentro de uma conversa do Assistente ((a) sim, como no Builder; (b) só para leitura; (c) só no Início): "A".

Em 2026-11-01, à pergunta se aprova a Pauta revisada, para entrar por cartão próprio com os primeiros consertos da auditoria do front-end: "Aprovo". O cartão é `docs/steps/e133-pauta.md`; a aprovação da página dele, com o commit, vem numa linha própria quando ele a ler.

Em 2026-11-01, às duas decisões do cartão da 13.3 (A, onde a etapa entra; B, onde mora o DESIGN.md): "A1 B1". A 13.3 entra logo depois da 24.2, e o `DESIGN.md` da raiz vira o documento completo da Pauta, conferido contra o código, com o guia de desenho só com as regras. A página do cartão ainda não foi aprovada.

Cartão da etapa 13.3 aprovado em 2026-11-01 (commit 4e04581c6878ace0512df2cb26f6c1536746e038): "Aprovo pode mesclar"

Cartão da etapa 13.3 aprovado em 2026-11-02 (commit f7ce6c22590c3574b73668aad28b04939b738b4e): "APROVO O MARCADRO DE PAUTA"

Lido pelo firstmate como a aprovação do cartão com a linha `Trilho: desenho`, que faz da Pauta o trilho de desenho (L1, L5); o resto do cartão está como foi aprovado no commit 4e04581c, "Aprovo pode mesclar".

Em 2026-11-02, na revisão da unidade U0 da 13.3 (a Pauta), à decisão sobre a regra V5 (o ipê marca "só" o lugar atual, o foco, o cursor e a marca, contra a V57, "Dourado", e a V28, o arco do compositor ocupado), com as opções A e B: "B". Opção B: a V5 mantém o "só" e nomeia duas exceções, a marca do item que a pessoa escolheu (o ícone do toggle da V57 e o check do Projeto escolhido) e o arco do compositor ocupado (V28). O critério 12 do cartão (pull request 538, congelado) ganha as duas exceções; a emenda vai no corpo da pull request da U0, para o fechamento. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-02, na revisão da unidade U3 da 24.3, ao achado 7 (o erro do banco que o modelo recebe) e ao estudo da forma mais simples: "1". Lido pelo firstmate como: a recusa `APP_DATA_REFUSED` leva o SQLSTATE do PostgreSQL, e a descrição da ferramenta manda o agente listar as tabelas e as colunas em `information_schema.columns` e corrigir a consulta; sem código novo, sem lista de SQLSTATEs e sem mensagem do Postgres. Palavra de meio de etapa, vai direto para este livro (L6); o cartão fica congelado no commit aprovado, e a emenda do tipo `AppRead` e do critério 19 ("com o SQLSTATE") vai no fechamento da etapa.

Em 2026-11-02, na revisão da unidade U3 da 13.3 (a Pauta), às decisões sobre "Novo projeto" no bloco Projetos do Início, o sino no celular e a posição de Configurações: "1 A B preciso entender melhor 3A". (1) A: "Novo projeto" fica no bloco Projetos do Início, para dona e administradora. (3) A: o critério 5 do cartão passa a dizer Início, Projetos, Integrações e Automações no alto, e Configurações, o sino e a conta no pé do trilho, como o `DESIGN.md` e a W30 dizem. (2) B, depois de entendida: no topo do celular, com notificação não lida, um ponto pequeno no botão de menu, e o sino fica dentro da gaveta, no pé do trilho. Palavra de meio de etapa, vai direto para este livro (L6); o cartão fica congelado no commit aprovado, e a emenda do critério 5 vai no corpo da pull request da U3, para o fechamento.

Em 2026-11-02, na pull request 554 (a U0 da 13.3: o `DESIGN.md` e os guias, durante o congelamento do método), à pergunta se ela leva o rótulo emergência (L20): "Sim pode por". O rótulo conta na linha da etapa (L20). Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-02, na revisão da pull request 560 (a U1 da 13.3, os tokens), às duas decisões: "1 A / 2A". (1) A: abaixo de 1024 px a barra lateral abre fechada, no trilho de ícones. (2) A: a prosa das mensagens usa a leitura 15/24 do `DESIGN.md` (`reading`) já na U1. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-02, na revisão da pull request 561 (a U2 da 13.3, as medidas), à altura das linhas de lista no toque: "A". Opção a: no toque, as linhas de lista são desenhadas com 44 px, como a V58 diz; com o mouse, 32. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-02, na U3 da 13.3, aos lugares do trilho: "Opção 1". Automações entra no trilho logo depois de Integrações, só para dona e administradora; o sino fica no pé do trilho, acima da conta; a W30 e o `DESIGN.md` foram emendados na pull request da U3, sob o rótulo emergência. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-03, às decisões da rodada de conserto da 13.3, ao critério 17 (a caixa do Builder, que mede 416 px pela própria caixa e por isso, no painel estreito do Builder, já perde palavras): "1. AOkay". Opção A: a caixa mantém a medida pela caixa, e o critério 17 é emendado no fechamento: na caixa estreita do Builder saem as mesmas palavras da V60 (o modelo perde "Claude " e a memória vira o anel e a porcentagem). Com o cartão apagado no fechamento (L19), a decisão fica na tabela de larguras do `DESIGN.md`, e a V60 do guia de desenho é emendada no fechamento da 24.3 (o método fica congelado enquanto ela está em construção). Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-03, a "Sem ferramentas" numa caixa abaixo de 416 px: "2. A". Opção A: o texto fica inteiro, e quem trunca é o modelo. Fica na contagem de ferramentas do `DESIGN.md`, e a V60 é emendada no fechamento da 24.3. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-03, ao tom `neutral` do Alerta, que nenhuma tela usa: "3. A". Opção A: o tom sai, e o `Alert` fica só com `tone="danger"`. Palavra de meio de etapa, vai direto para este livro (L6).

Em 2026-11-03, à publicação das duas etapas, 13.3 e 24.3: "4. sIM". Publicar depois que a rodada de conserto fundir; as duas foram ao ar juntas na v0.24.9.

Etapa 13.3 no ar em https://hub.conexus.fun (v0.24.10), sem a linha de uso do fundador: ela entra aqui, com as palavras dele, depois do uso. A etapa foi ao ar na v0.24.9, junto com a 24.3, e a v0.24.10 levou o conserto do menu do celular (pull request 585). Duas pull requests com o rótulo emergência (554 e 565).
