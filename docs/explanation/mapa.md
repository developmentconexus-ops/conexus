# O mapa das áreas

Estado: **aprovado em 2026-11-17**. O trilho, a coluna, o mapa inteiro, Conhecimento, os grupos das Configurações (seção 6.4) e a coluna do menu (seção 5.3) estão decididos. O mapa está fechado.

Este documento é o parte da camada de produto. Ele diz quais são as áreas, o que mora em cada uma,
como a pessoa anda entre elas e o que a coluna ao lado do trilho mostra em cada lugar. O endereço de
cada tela continua em [`docs/reference/screens.md`](../reference/screens.md). Os andares continuam os de web W29.

## 1. O que não muda

- Os andares de W29: Entrada, Primeira entrada, Empresa, Projeto, Configurações, Central.
- A moldura aprovada em 2026-11-01 ("Ficou boa a versão do layout"): um trilho de ícones, uma coluna
  ao lado e a folha branca (web W30, design V19 e V56).
- O Projeto como a casa do que roda: a conversa, zero ou um app, os agentes, as automações, as
  liberações e as pessoas (decisão J1 do fundador, 2026-10-30). A empresa guarda o dado, as ligações,
  as pessoas e as visões gerais.
- As três áreas decididas em 2026-11-17: um produto só, com Dados e contexto,
  Agentes e Apps. Não são produtos vendidos à parte.
- O conceito que o fundador refez em 2026-11-17 ([o conceito](conceito.md#1-o-conceito)): a camada de contexto e
  ontologia é o centro, e os agentes e os apps trabalham sobre ela.

## 2. As áreas, e o que mora em cada uma

| Área | O trabalho da pessoa | Na empresa | Dentro de um Projeto | Marcos que mudam |
| --- | --- | --- | --- | --- |
| **Dados e contexto** | Ligar sistemas, ver o dado, dar nome aos conceitos, guardar como a empresa opera, saber quem lê | Integrações; Dados (com a árvore Negócio, Bruto, Apps); Conhecimento (seção 3.1) | Integrações do Projeto, Dados do Projeto | `D1` a `D4`, o Negócio, o Brain |
| **Agentes** | Perguntar, criar agentes e ferramentas, automatizar | Início e as conversas com o Assistente; Agentes e Automações como visão geral | Conversas, Agentes, Ferramentas, Construtor, Automações | `A6`, `D5` |
| **Apps** | Pedir um app, ver a prévia, publicar, dar acesso | Todos os projetos | Construir (Prévia, Código), Sobre e Versões, Quem usa o app | `A1` a `A5` |
| **Base** (não é área) | Entrar, preparar a empresa, configurar, operar | Entrada, Primeira entrada, Configurações, Central | · | quase nenhum |

As 65 rotas de hoje (`apps/web/src/routes/`, sem `__root.tsx` e sem os testes), contadas por lugar do
mapa:

| Lugar | Rotas |
| --- | --- |
| Entrada (`_public/*`) | 6 |
| Primeira entrada (`welcome/*`) | 6 |
| Moldura (as três rotas que só montam a casca) | 3 |
| Início e a conversa da empresa | 2 |
| Dados na empresa (`integrations.*`, `data.*`, `copies.*`, o retorno do login do provedor) | 7 |
| Agentes na empresa (`agents.index`, `automations.*`) | 3 |
| Todos os projetos | 1 |
| Projeto, app e casa (Construir, a conversa, Sobre, Quem usa o app) | 5 |
| Projeto, conversas com o Assistente | 2 |
| Projeto, agentes (Agentes, Ferramentas, Construtor, Automações) | 8 |
| Projeto, dados (Dados e Integrações do Projeto) | 5 |
| Configurações | 11 |
| Central | 6 |
| **Total** | **65** |

## 3. O trilho

Hoje são seis ícones sem texto e sem grupo, na ordem em que cada etapa os acrescentou: Início,
Projetos, Integrações, Automações, Agentes, Dados. Embaixo: Configurações, o sino e a conta.

Decidido: os mesmos seis e mais um, Conhecimento (seção 3.1), na ordem das áreas, com uma linha fina
entre os grupos.

| Grupo | Itens | Por quê nesta ordem |
| --- | --- | --- |
| · | Início | a porta: a conversa da empresa |
| Dados e contexto | Integrações, Dados, Conhecimento | primeiro se liga, depois se vê, depois se dá sentido (como uma plataforma de dados de referência: fontes, catálogo, camada de contexto) |
| Agentes | Agentes, Automações | o que trabalha sobre o dado |
| Apps | Projetos | a casa do que roda |
| pé | Configurações, sino, conta | como hoje |

Quem não usa um item não o vê (web W34): o membro continua sem Automações, Agentes e Cópias.

As referências: três plataformas agrupam a navegação por área, com título de grupo. Nenhuma das três
usa trilho só de ícones; uma ferramenta de agentes para desktop usa. O trilho do Conexus foi aprovado
em 2026-11-01 e fica; o que as referências acrescentam é o grupo.

### 3.1 Onde mora o contexto

Hoje o contexto está em dois lugares que não se veem do trilho. A Ontologia é a pasta "Negócio" da
árvore de Dados, vazia até o primeiro conceito. O conhecimento de como a empresa opera é "Memória da
empresa", uma seção das Configurações. Com o conceito novo, isso é o centro do produto, e está
escondido.

Decidido: um lugar próprio no trilho, **Conhecimento**, no grupo Dados e contexto. O nome não é novo:
a trilha Dados já fala em "a página Conhecimento", onde os conceitos são "provados e aprovados" e onde
fica "o Mapa" (`docs/steps/trilhas/dados.md`, itens 1 e 5).

| Quando | O que Conhecimento mostra |
| --- | --- |
| Agora | As instruções e as páginas da empresa, que hoje são "Memória da empresa" nas Configurações |
| Com a etapa do Negócio e o `D4` | Os conceitos da empresa, cada um com a tabela, a prova, quem aprovou e quando; as propostas à espera |
| Com o Brain | O Mapa; as fontes de conhecimento; a revisão semanal, que só propõe |

O item nasce com o que já existe, então não é um "em breve" (web W31). A pasta "Negócio" da árvore de
Dados continua: ela mostra os conceitos pelo lado do dado, e Conhecimento os mostra pelo lado do
sentido.

As referências: uma plataforma de dados tem a "camada de contexto" como item de primeiro nível, no
grupo de contexto, ao lado das fontes e do catálogo, e ali guarda os documentos do "cérebro da
empresa". As grandes plataformas de dados põem a camada de contexto do lado do dado, e uma delas chama
a ontologia de "o coração das nossas plataformas".

## 4. A coluna ao lado do trilho

Hoje a coluna mostra as conversas em toda área da empresa que não tem coluna própria: Integrações,
Automações, Agentes e Todos os projetos. O trilho marca
uma área e a coluna mostra outra.

Decidido: a coluna existe só onde o lugar tem uma lista ou árvore que é dele. Nos outros, a
página ocupa a largura. As conversas aparecem na coluna só no Início. O fundador, na mesma rodada:
"não faz sentido ter conversas aí no Dados, por exemplo, ou em Projetos e apps, que já vão ter as
opções de construir, conversar etc." (grafia corrigida). Dentro de um Projeto, as conversas dele são
um item do menu do Projeto, não a coluna da empresa.

| Lugar | A coluna mostra | A página |
| --- | --- | --- |
| Início e uma conversa | Nova conversa e as conversas por dia | a conversa |
| Dados | a busca e a árvore (Negócio, Bruto, Apps) | a lista ou a tabela aberta |
| Conhecimento | a árvore das páginas e, depois, dos conceitos | a página ou o conceito aberto |
| Dentro de um Projeto | o nome do Projeto e o menu dele | a parte aberta |
| Configurações | Voltar, a busca e o índice | a seção |
| Integrações, Agentes, Automações, Todos os projetos | nada: a página ocupa a largura | a lista |

As referências: numa plataforma de dados a segunda coluna aparece só no catálogo, no explorador e na
camada de contexto, onde há árvore; em fontes, execuções e MCPs a página ocupa a largura. Em outra, a
árvore aparece só no catálogo.

## 5. Dentro de um Projeto

Os itens e a ordem estão decididos : os mesmos oito, agrupados na ordem das áreas, e o título
de cada página diz o nível.

| Grupo | Itens |
| --- | --- |
| O app | Construir |
| Agentes | Conversas, Agentes, Automações |
| Dados | Integrações, Dados |
| O Projeto | Quem usa o app, Sobre |

Regra do nível (princípio E7): dentro de um Projeto, o título da página leva o nome dele ("Agentes de
Encomendas"); na empresa, o título é só o nome da área ("Agentes"), e cada linha diz o Projeto.

### 5.1 A coluna do menu: o que o fundador apontou

O fundador, na segunda rodada: "está muito grande, com muito vazio, está desalinhada com o ícone do
Conexus, por exemplo, e não é retrátil, que é ruim" (grafia corrigida). O que o código faz:

| O que ele viu | O que o código faz |
| --- | --- |
| Muito grande | A barra tem 328 px, 56 do trilho e 272 da coluna. A coluna sozinha é maior que a barra inteira do shadcn (256 px) e que a das referências (240 a 256 px) |
| Muito vazio | Oito itens de 32 px, com 4 px entre eles, ocupam 284 px de uma coluna da altura da tela |
| Desalinhada com o ícone do Conexus | A marca está numa caixa de 40 px e o nome do Projeto numa linha de 48 px: os centros ficam a 28 e 32 px do topo |
| Não é retrátil | Ela recolhe, mas ninguém vê como: só por uma borda invisível de 12 px (fora do Tab) ou por Ctrl+B. O botão de abrir existe só no celular. Recolhida, a coluna some inteira, e os ícones do Projeto somem com ela. O estado não fica guardado |

O mesmo vale para toda coluna do Hub (Dados, Configurações), não só a do Projeto: é a mesma peça.

### 5.2 Como as referências fazem

| Referência | Aberta / recolhida | Botão de recolher à vista | Guarda o estado | O menu de um lugar dentro de outro |
| --- | --- | --- | --- | --- |
| Construtor de fluxos de IA | 240 / 56 px | sim, com dica e Mod+B | cookie | a barra inteira troca para a do app |
| Mastra 1.83 | 240 (200 a 480) / 64 px | sim | localStorage | empilha na mesma barra; recolhida, mostra os ícones da raiz |
| Automação de fluxos | 200 a 500 / 42 px | sim, com a tecla `[` | localStorage | sem referência |
| Plataforma de backend | 256 px | sim | sem referência | segunda coluna ao lado do trilho, com cabeçalho da mesma altura do da página |
| Plataforma de dados | cerca de 240 px | sim, no pé da barra | sem referência | segunda coluna só onde há árvore (catálogo) |
| Plataforma de dados e IA | cerca de 200 px | sim, ao lado da marca | sem referência | segunda coluna só no catálogo; no espaço de conversa, abas no topo da página |

O que convergem: 240 a 256 px aberta; 42 a 64 px recolhida, mostrando os ícones; o botão de recolher
sempre à vista, com dica e atalho; o estado guardado. O menu de um lugar dentro de outro tem três
formas: segunda coluna (backend, dados, o Conexus hoje), troca na mesma barra (fluxos de IA, Mastra) ou
abas no topo (espaço de conversa de dados).

### 5.3 Decidido

**(a) A segunda coluna, consertada**: a moldura aprovada em 2026-11-01 fica, e as quatro
queixas viram regra da peça de navegação lateral ([o catálogo](../reference/catalogo.md)):

1. A coluna perto de 240 px, não 272. O número exato é do protótipo A3; o token `sidebar` é da Pauta
   (`DESIGN.md`), e muda só num pull request à parte.
2. A marca e o nome do lugar na mesma linha de topo, com a mesma altura.
3. Um botão de recolher à vista no topo da coluna, com dica e Ctrl+B. Recolhida, a coluna vira uma
   faixa de ícones do lugar (os do Projeto, dentro do Projeto), não some.
4. A escolha de cada pessoa fica guardada no navegador.

As outras: (b) a barra troca dentro do Projeto, como o construtor de fluxos de IA e o Mastra: uma coluna só, com "Voltar à
empresa"; perde o trilho da empresa a um clique. (c) Abas no topo, como o espaço de conversa de dados: oito abas não cabem
ao lado de Prévia e Código, que a página do Projeto já tem.

## 6. Configurações

O fundador escolheu (a), três grupos, e na mesma rodada pediu para pensar melhor: "IA é muito genérico;
investigar, e temos que analisar o que temos e o que vamos ter no futuro como configurações, para
estruturar corretamente" (grafia corrigida).

### 6.1 O que existe hoje

Dois grupos, Você e o nome da empresa.

| Grupo hoje | Seção | De quem é |
| --- | --- | --- |
| Você | Minha conta (perfil, cargo e área, o que o Conexus lembra de você) | da pessoa |
| Você | Contas de modelo (Suas contas, Contas da empresa, Troca automática) | **dos dois**: a única página com dois donos |
| Você | Meus padrões (conversa nova, modelo e raciocínio) | da pessoa |
| Empresa | Geral (nome e apelido, só leitura) | da empresa |
| Empresa | Pessoas e convites (com Quem usa os apps) | da empresa |
| Empresa | Papéis | da empresa |
| Empresa | Registro de dados (as leituras de todos, só para Dono e Administrador, 2026-11-21, `"D1 a D2 a"`) | da empresa |
| Empresa | Padrões da empresa (a mesma peça de Meus padrões) | da empresa |
| Empresa | Memória observacional (os modelos que resumem a conversa, tirados das contas da empresa) | da empresa |
| Empresa | Memória da empresa | da empresa; vai para Conhecimento  |

### 6.2 O que vem, segundo o repositório

| Configuração | Quando | Fonte | Doc ou inferido |
| --- | --- | --- | --- |
| Avisos: os e-mails da empresa que recebem o aviso de cópia parada | o cartão da etapa 2 do lago (2026-11-21, "R1 a R2 a") | `docs/steps/trilhas/dados.md`; web W32 | doc |
| Atividade e Uso, reservados | 21.1 e `D6` | web W32; `docs/roadmap.md` | doc; se ficam com a empresa ou com a Central, inferido |
| Identidade da empresa (cores, letras, formas que os apps seguem) | `A2` ("3B") | `docs/roadmap.md`; trilha Agentes e Apps | doc; que fique nas Configurações, inferido |
| Chaves para agentes de fora (a porta MCP) | cartão próprio, depois | `docs/steps/trilhas/dados.md`; spec dos dados, parte 8 | doc; a tela, inferido |
| Plano e cobrança | etapa 23 | `docs/roadmap.md` | doc; a tela, inferido |
| Segurança (sessões, dois fatores) | nenhum | nada no repositório | lacuna |

Integrações fica fora das Configurações (web W32, decisão "O1" de 2026-10-28).

### 6.3 Como as referências agrupam

| Referência | Grupos | "IA" como grupo? |
| --- | --- | --- |
| Ferramenta de agentes para desktop | Você, IA, Workspace, Conta (Plano e uso), Ajuda | sim, com **um** item, Modelos e conexões; a memória e o contexto da empresa ficam em Workspace |
| Automação de fluxos | general, personal, people, ai, integrations, security, operations, billing | sim, misto (uso, contexto, MCP, Assistente, Agentes, Chat); o próprio código chama a página "AI usage" de reserva |
| Plataforma de dados | Workspace settings; Plan and billing (Billing, Usage); a organização à parte | não |
| Construtor de fluxos de IA | Workspace; a pessoa; os provedores de modelo saíram para Integrações | não |
| Plataforma de backend | três níveis: a pessoa, a organização, o projeto; Billing com Usage | não |
| Busca corporativa com IA | Modelos no topo; Agents & Actions; Documents & Knowledge; Permissions; Organization; Usage | não |

O que convergem: separar por **dono** (pessoa, empresa) e, dentro da empresa, por **tarefa**:
pessoas e acesso juntos em todas; uso e cobrança juntos em todas; os padrões de modelo ao lado das
contas (duas das referências). "IA" como grupo aparece em duas, e fraco nas duas.

### 6.4 Decidido

**Por dono, e a empresa por tarefa**, sem "IA":

| Grupo | Hoje | Quando o cartão chegar |
| --- | --- | --- |
| Você | Minha conta; Suas contas de modelo; Meus padrões | nada previsto (2026-11-21: o Registro é de quem administra, e Seguir só entra se alguém pedir) |
| Empresa: Geral | Geral | Identidade da empresa (`A2`) |
| Empresa: Pessoas e acesso | Pessoas e convites; Papéis | Registro de dados, só Dono e Administrador; Chaves para agentes de fora |
| Empresa: Modelos | Contas da empresa e Troca automática; Padrões da empresa; Memória observacional, num "Avançado" (E2 b) | Limites por provedor |
| Empresa: Avisos e uso | nada ainda (o grupo nasce com o primeiro cartão, web W31) | Avisos; Uso; Atividade; Plano e cobrança |

Uma consequência: a página "Contas de modelo" se parte em duas, pelo dono, "Suas contas de modelo" em
Você e "Contas da empresa" em Modelos (princípio E7, um lugar por coisa). A ordem em que o Builder tenta as contas da pessoa fica em Meus padrões (E1 b). O que cada uma mostra está em [as telas](../reference/telas.md).

As outras: (b) só por dono, Você e a empresa, com a lista da empresa em ordem de tarefa, sem
subgrupos; fica longa quando os itens futuros chegarem (12 ou mais). (c) Como a ferramenta de agentes para desktop: Você, Modelos,
Empresa, Conta; "Modelos" junta as contas da pessoa e as da empresa num grupo só, e volta a misturar
dois donos.

## 7. No celular

A gaveta leva o trilho e a coluna do lugar juntos (design V56). Isso já é regra. Dois defeitos contra
ela, que o mapa não muda e que entram na área onde estão:

- Dentro de um Projeto, a gaveta não traz o menu do Projeto.
- Nas configurações a 390 px não há índice à vista.

## 8. O que este mapa não decide

- O desenho de nenhuma tela. Isso é a camada de área, A1 a A3.
- Se o trilho ganha o nome embaixo de cada ícone. É decisão visual, do protótipo da primeira área.
- As telas de marcos que ainda não existem (`D1` a `D6`, `A1` a `A6`). Cada uma entra no mapa pelo
  estudo do seu marco.
