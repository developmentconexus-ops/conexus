# Autenticação e papéis

O login no Hub, a empresa, os convites, os papéis, quem lê o quê, o Registro de dados e a política de
dados pessoais. As regras estão no guia [security](../guides/security.md); quem lê no lago, em
[Lago e AWS](lago-e-aws.md).

## Decidido

- [0013](../decisions/0013-who-holds-the-hub-session.md), [0014](../decisions/0014-better-auth-for-passwords.md), [0015](../decisions/0015-where-companies-members-invitations-live.md) e [0016](../decisions/0016-closed-sign-up.md): quem guarda a sessão do Hub, o Better Auth para senha, onde moram
  empresas, membros e convites, e o cadastro fechado por convite.
- [0039](../decisions/0039-company-scope-and-row-policy-in-the-hub.md): o escopo da empresa e a política de linha no Hub.
- [0078](../decisions/0078-how-the-lake-knows-who-reads.md): no lago, o Hub decide quem lê e a AWS impõe.
- Aprovações: [papeis-da-empresa](../approvals/papeis-da-empresa.md),
  [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md) (com a emenda de 2026-11-16: fora do
  papel ninguém vê, nem o Desenvolvedor),
  [registro-e-conformidade](../approvals/registro-e-conformidade.md) (com a emenda do PR 1208: só Dono
  e Administrador veem o Registro),
  [a-politica-de-dados-pessoais](../approvals/a-politica-de-dados-pessoais.md) (a política P2),
  [e2434-papeis-e-pedidos](../approvals/e2434-papeis-e-pedidos.md).
- O desenho de identidade de 2026-11-22: um modelo só, conferido no Hub e na política de linha; as
  respostas `D2`, `D3` e D4 do fundador estão no estudo `conexus-auth-arquitetura-estudo` e na página
  [Mapa auth do Conexus](https://claude.ai/artifact/9VHqeE9GViDK4FY1Pagywz). Nenhum registro as guarda ainda.

## Provado

| O que | O número | Estudo |
| --- | --- | --- |
| Os papéis dinâmicos do Better Auth | servem semeando Membro e Desenvolvedor por empresa; a perda de 12 em 200 leituras vinha da configuração, não do caminho nativo | `conexus-papeis-card` |
| O Registro no lago | oito de doze unidades valem sem refazer; a AWS não guarda o texto da consulta | `conexus-registro-vs-lago-e-ao-vivo` |
| O aviso a cada falha | uma senha vencida daria 480 avisos por dia | `conexus-registro-redesenho` |

## Lido

- Nove referências de permissão: nenhuma usa ReBAC; sete usam papel, objeto e ações curtas
  (`conexus-arquitetura-permissoes-estudo`).
- Better Auth: a lista de recursos da permissão é fixa na subida, e as equipes vêm prontas e
  desligadas (`conexus-papeis-better-auth-conferencia`, `conexus-identity-link-study`).
- Nenhuma referência tem "administra mas não lê", e nenhuma tira os leitores da permissão da
  conexão (`conexus-fora-do-papel-referencias`, `conexus-leitores-iniciais-referencias`).
- Nenhuma de nove plataformas dá a quem conversa uma página das próprias leituras
  (`conexus-registro-quem-ve`).
- LGPD: a empresa é controladora e o Conexus é operador (`conexus-personal-data-policy-study`).

## Superado

- O protótipo do Registro do Membro (`conexus-registro-prototipo-membro`): só Dono e Administrador
  veem o Registro.
- Seguir, Avisos e o aviso de falha do Registro saíram para o cartão do lago (emenda do PR 1208).

## Aberto

- As respostas `D2` a D4 do desenho de identidade ainda não viraram registro.
- O vínculo de identidade entre sistemas e as áreas (`conexus-identity-link-study`).

## Estudos de origem

Uma linha por estudo, da data mais nova para a mais velha. "Virou" é o registro, a aprovação, o cartão ou o PR em que o estudo deu.

| Data | Estudo | Estado | Virou | Em uma frase |
| --- | --- | --- | --- | --- |
| 2026-11-22 | `conexus-auth-arquitetura-estudo` | decidido | palavras do fundador 2026-11-22 (`D2`, `D3`, D4) | Um modelo só de identidade, conferido no Hub e na política de linha; as bordas confiam em vez de conferir, e a AWS é a maior divergência. |
| 2026-11-21 | `conexus-registro-vs-lago-e-ao-vivo` | decidido | PR 1208 (B1 a, `C1` a, `C2` a) | O Registro grava acima da fonte e do motor e segue necessário no lago: oito de doze unidades valem sem refazer; a AWS não guarda o texto da consulta. |
| 2026-11-21 | `conexus-registro-redesenho` | decidido | PR 1208 | O centro do cartão vale no lago; quem vê, quem segue e o aviso a cada falha eram remendos de frases da Nekt; uma senha vencida daria 480 avisos diários. |
| 2026-11-21 | `conexus-registro-quem-ve` | decidido | PR 1208 (D1 a, `D2` a) | Nenhuma de nove plataformas dá a quem conversa uma página das próprias leituras; a regra veio de uma frase da Nekt sobre tokens; só Dono e Administrador veem. |
| 2026-11-21 | `conexus-registro-prototipo-membro` | superado, por conexus-registro-quem-ve | - | Protótipo de 23 estados das versões do Membro do Registro e dos Avisos, desenhado das descrições em texto porque as imagens aprovadas não foram achadas; o fundador respondeu P1 (b). |
| 2026-11-21 | `conexus-registro-emenda-2` | decidido | PR 1208; [registro-e-conformidade](../approvals/registro-e-conformidade.md) | Emenda: só Dono e Administrador veem o Registro, em Pessoas e acesso ao lado de Papéis; Seguir, Avisos e o aviso de falha (G6) saem para o cartão do lago. |
| 2026-11-17 | `conexus-registro-reanalise` | decidido | PR 1187 | O núcleo do Registro tem origem na Nekt e no Databricks; a U4 (REVOKE de query_to_xml) não tinha referência e deve sair; a guarda do plano tem par no Superset. |
| 2026-11-16 | `conexus-registro-conformidade-estudo` | decidido | [registro-e-conformidade](../approvals/registro-e-conformidade.md) | Cada leitura de agente deixa uma linha no Registro de dados, sem o resultado, com a consulta até 4.000 caracteres; uma prova na CI cobre todo leitor. |
| 2026-11-16 | `conexus-registro-cartao` | decidido | [registro-e-conformidade](../approvals/registro-e-conformidade.md); PR 1156 | Notas do cartão do Registro: o rastro do código de data.data_read, cuja política é da empresa inteira e não restringe por pessoa, com índice só por empresa e hora. |
| 2026-11-16 | `conexus-permissoes-causa-raiz` | decidido | [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md) (code C81) | Causa do 1138: o catálogo foi especificado pelo lugar e o filtro por quem pergunta ficou com cada consumidor; cinco lugares respondem isso; propõe uma porta única. |
| 2026-11-16 | `conexus-papeis-better-auth-conferencia` | decidido | [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md) | As tabelas de um papel não cabem na permissão do Better Auth, cuja lista de recursos é fixa na subida; guardá-las ali seria lógica paralela. |
| 2026-11-16 | `conexus-fora-do-papel-referencias` | decidido | [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md) (emenda 2026-11-16) | Nenhuma referência tem administra mas não lê; a emenda fez que fora do papel ninguém veja, nem o Desenvolvedor; Dono e Administrador leem todas. |
| 2026-11-16 | `conexus-arquitetura-permissoes-estudo` | decidido | [registro-e-conformidade](../approvals/registro-e-conformidade.md) | Uma porta só decide o que a pessoa alcança; nenhuma de nove referências usa ReBAC, sete usam papel, objeto e ações curtas. |
| 2026-11-15 | `conexus-leitores-iniciais-referencias` | decidido | [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md) | Nenhuma referência tira os leitores da permissão da conexão; a cópia nova nasce lida só por Dono e Administrador, e a dona marca os outros papéis. |
| 2026-11-15 | `conexus-dados-cartao-2` | decidido | [cada-papel-le-so-o-seu](../approvals/cada-papel-le-so-o-seu.md); PR 1106 | Cartão Cada papel lê só o seu: cada papel lê só as tabelas copiadas marcadas, garantido pelo banco; o fundador escolheu A1, B1, F1 e o recomendado nas outras. |
| 2026-11-12 | `conexus-pdp-premise-study` | decidido | [a-politica-de-dados-pessoais](../approvals/a-politica-de-dados-pessoais.md) (P2) | Recomenda a política enxuta P2: o tipo de dado pessoal deixa de ser permissão de papel e o documento nunca vai a modelo nem a cópia; o fundador escolheu P2. |
| 2026-11-12 | `conexus-identity-link-study` | aberto | - | Áreas: o Better Auth já tem equipes prontas e desligadas; vínculo entre sistemas: e-mail igual liga sozinho, sem e-mail o administrador escolhe, numa tabela do Hub. |
| 2026-11-11 | `conexus-personal-data-policy-study` | decidido | [a-politica-de-dados-pessoais](../approvals/a-politica-de-dados-pessoais.md) | A LGPD não pede que o operador corte o comprador: a empresa é controladora, o Conexus operador; o corte fixo no Mercado Livre era incoerente com o Sankhya. |
| 2026-11-10 | `conexus-cap4-refs` | decidido | cartão Capacidade 4 (marco A5) | Nenhuma referência cria login de banco por pessoa: o código do app filtra pela identidade que a plataforma entrega. |
| 2026-11-10 | `conexus-cap4-card` | decidido | cartão Capacidade 4 (marco A5) | O app declara os campos da pessoa e o vínculo fica na linha de acesso do app, digitado; nada de login de banco por pessoa. |
| 2026-11-07 | `conexus-roles-autonomy-study` | decidido | [e245-os-agentes-escrevem](../approvals/e245-os-agentes-escrevem.md) (D1 a `D3`) | A base está certa, mas publicar escrita sozinha estava no papel errado, havia dois juízes para a mesma pergunta e tirar a permissão não afetava o publicado. |
| 2026-11-06 | `conexus-papeis-card` | decidido | [papeis-da-empresa](../approvals/papeis-da-empresa.md) | Papéis dinâmicos do Better Auth servem semeando Membro e Desenvolvedor por empresa; a perda de 12 em 200 leituras vinha da configuração, não do caminho nativo. |
| 2026-11-01 | `conexus-roles-approvals-study` | decidido | [e2434-papeis-e-pedidos](../approvals/e2434-papeis-e-pedidos.md) | Um motor só de papéis e pedidos: o Desenvolvedor publica sozinho, o Membro pede e dono ou administrador aprova, nunca quem pediu; etapa curta depois da 24.3. |
| 2026-11-01 | `conexus-mastra-auth-study` | decidido | [0014](../decisions/0014-better-auth-for-passwords.md), [0050](../decisions/0050-conversation-on-the-agent-controller.md) | O Hub não usa peça de auth do Mastra; fica o Better Auth com o nosso porteiro, porque o auth do Mastra não sabe de empresa nem dono de conversa. |
