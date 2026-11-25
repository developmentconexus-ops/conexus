# Apps com identidade

Trilho: apps

Trilha Agentes e Apps, marco `A2` do [roteiro](../roadmap.md) (a Capacidade 5 da
[página da trilha](trilhas/agentes-e-apps.md), mais a direção de design de cada app). A ordem é a do
fundador em 2026-11-22: depois da etapa 2 do harness ("Uma sala e os nomes certos") e antes do `A3`.
Este cartão espera, num pull request em rascunho (delivery L5), o fechamento da etapa 2.

Lido em `main` `99b5eceb` (2026-11-25, depois do pull request 1360, que moveu `builder/` para
`agents/`). Versões lidas: `better-auth` 1.7.8, `@mastra/core` 1.83.0, o formato aberto DESIGN.md
(google-labs-code/design.md, commit `db977b3`, versão `alpha`) e a skill Impeccable instalada.
Segunda versão do cartão: a primeira, de 2026-11-24, foi recusada pelo fundador em 2026-11-25 ("ficou
muito básico, muito simples"; "cores de gráfico, pra mim é ridículo") e o estudo foi refeito.

## A página do fundador

**No fim desta etapa** você abre a identidade da empresa nas configurações, dá o site, o manual da
marca, o logotipo ou capturas, e um assistente monta o DESIGN.md da empresa: atmosfera, cores com
papéis no claro e no escuro, tipografia em níveis, espaço, profundidade, forma, movimento, voz,
ícones, imagem, componentes com estados e o que fazer e não fazer. Você refina conversando, vendo ao
lado um app de exemplo feito com o rascunho, e publica uma versão que o Hub conferiu. Em duas
empresas de teste, o mesmo pedido ao Builder dá dois apps que você distingue lado a lado, e o plano
de cada um mostra a direção de design antes de construir.

**O roteiro de uso.**

1. Na empresa de teste A, como dono, abre Configurações, Identidade. Dá o endereço de um site e
   anexa um manual em PDF, um logotipo em SVG e duas capturas. O assistente diz o que leu e mostra o
   rascunho: a prévia de um app de agenda, a ficha e o próprio DESIGN.md.
2. Responde às perguntas do assistente e pede uma mudança ("o texto secundário mais escuro, o app é
   usado no sol"). A prévia marca o que mudou. Publica a versão 1 depois de ler o que vai e quem
   recebe.
3. Na empresa de teste B, começa conversando do zero e publica uma identidade bem diferente.
4. Em cada empresa, pede ao Builder o mesmo app: "a agenda do dia da equipe: o que está marcado, o
   que atrasou e registrar um novo". O plano de cada um traz "A direção de design". Aprova os dois
   planos, abre as duas Prévias lado a lado e distingue qual é de qual empresa.
5. Na empresa A, muda a identidade conversando e publica a versão 2. O app que já existe não muda;
   na próxima conversa sobre ele, o Builder oferece a versão 2 no plano.
6. Entra como desenvolvedor da empresa A e abre a identidade: vê a ficha e baixa o arquivo, sem
   conversa nem "Publicar".

**O que você faz, e quando.** Antes: nada novo; as duas empresas de teste já existem. No começo:
nada, esta página e o protótipo já estão aprovados. No fim: faz o roteiro na nuvem, diz o que viu e
aprova os textos das telas.

**A visão.** "O app tem a cara da empresa, e os apps da mesma empresa parecem da mesma casa" (Conexus
Apps). "Cria-se conversando" e o que se vê num canvas "se muda conversando" (VISION.md:74, :95);
"edita fora da conversa" é recusa (VISION.md:101). "O plano vem antes do código" (Conexus Apps).
"Mantém cada empresa e cada app no seu lugar" (Escopo): a identidade de uma empresa nunca entra no
app de outra. "Publica um app sem o contrato e a conferência do Builder" é recusa, e por isso a
identidade entra no código do app e passa pela conferência.

**Fica de fora.**

- Cores de gráfico na identidade: nenhuma das fontes pesquisadas as trata como marca (o seu "ninguém
  faz isso"). O app guarda as do starter, e o gerador não as toca.
- Mudar apps já publicados sem uma versão nova (A.1).
- Várias identidades por empresa (marcas, filiais).
- O Hub com a cara de cada empresa: o Hub segue a Pauta (`DESIGN.md` da raiz).
- Editar a identidade fora da conversa, num formulário ou à mão no arquivo (E.1).

**As decisões suas nesta etapa.** Todas respondidas: A a D em 2026-11-24 ("Todas decisoes
recomendadas"), revistas no estudo refeito e mantidas; E a G no quadro do estudo refeito, aprovado em
2026-11-25 com a página. As palavras estão no [arquivo de aprovação](../approvals/apps-com-identidade.md).

- **A. Quando a identidade muda, os apps que já existem?** **A.1.** Seguem na próxima versão: o app
  guarda a versão com que nasceu, e o Builder oferece a nova no plano da próxima conversa. Lovable, v0,
  Bolt e Base44 fazem igual ("Existing projects don't update automatically", v0).
- **B. Até onde vai a direção de cada app?** **B.2.** O plano escolhe a direção dentro da identidade;
  um desvio pedido pela pessoa fica escrito no plano e aparece na tela de identidade.
- **C. O logotipo entra?** **C.1.** Entra, com a versão clara e a escura e a regra de onde vai.
- **D. Empresa sem identidade?** **D.1.** O app nasce com a padrão do Conexus, e a tela convida a
  criar a identidade.
- **E. Como a pessoa muda a identidade?** **E.1.** Só conversando, com a prévia, a ficha e o arquivo
  ao lado. Não há campo de edição direta.
- **F. O assistente lê o site da empresa?** **F.1.** Lê o site, os arquivos e as capturas; o site é
  aberto num navegador na máquina da conversa e medido na tela.
- **G. Que fontes?** **G.1.** Qualquer fonte aberta do Fontsource, empacotada no app, e o arquivo da
  própria empresa, com a licença declarada por quem publica.

## Como vai ser feito

As peças abaixo foram provadas num protótipo fora do repositório (a pasta da tarefa
`conexus-a2-identidade-estudo`, delivery L21): o gerador `prototipo/gerador/identidade-v2.mjs`, os
dois exemplos `exemplo-v2/DESIGN.md` e `exemplo-v2/DESIGN-bem-viver.md`, as telas
`prototipo/tela-v2/` e as 18 capturas aprovadas em `capturas-v2/`. A pesquisa e suas citações estão
em `refs/notas-formatos.md`, `refs/notas-marcas.md` e `refs/produtos/`.

### 1. O que a identidade guarda

Um DESIGN.md no formato aberto, com as dez seções na ordem da especificação (`docs/spec.md:202-211`)
e mais duas que ela aceita como seção extra (`:613`): Overview, Colors, Typography, Layout, Elevation
& Depth, Shapes, Motion & Micro-interaction, Voice & Content Strategy, Iconography, Imagery,
Components e Do's and Don'ts. Em cima, os valores (`colors` com `light` e `dark`, `typography`,
`rounded`, `spacing`, `motion`, `components` com os estados como chaves irmãs); embaixo, a intenção
em texto, que o formato chama de "the most vital part" (`PHILOSOPHY.md:21`). Nenhuma cor de gráfico.

O exemplo da Atlas Distribuição, fictícia, tem 332 linhas; a U1 o copia como a identidade rica dos
testes. O começo dele:

```markdown
---
version: alpha
name: Atlas Distribuição
description: "Prancheta de obra: papel cimento, tinta grafite e um laranja de sinalização que marca só a próxima ação."
colors:
  primary: "#C2410C"
  on-primary: "#FFFFFF"
  primary-container: "#FFE4D6"
  secondary: "#1E4E79"
  error: "#B42318"
  success: "#1F7A45"
  warning: "#9A5B00"
  light:
    background: "#F3F1EC"
    surface: "#FFFFFF"
    on-surface: "#1C1B19"
    on-surface-variant: "#5B5750"
    outline-variant: "#DAD5CC"
    focus: "#1E4E79"
  dark:
    background: "#151412"
    on-surface: "#EEEBE5"
    focus: "#8DB8E3"
typography:
  display: { fontFamily: IBM Plex Sans, fontSize: 32px, fontWeight: 600, lineHeight: 40px }
  body-md: { fontFamily: IBM Plex Sans, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  figure-lg: { fontFamily: IBM Plex Mono, fontSize: 28px, fontWeight: 600, lineHeight: 32px, fontFeature: '"tnum"' }
rounded: { sm: 3px, md: 4px, lg: 6px, full: 9999px }
spacing: { base: 4px, row-compact: 36px, row-comfortable: 44px, sidebar: 248px }
motion:
  state-change: { duration: 100ms, delay: 0ms, timingFunction: ease-out }
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.md}", height: 40px }
  button-primary-disabled: { backgroundColor: "{colors.light.surface-container}" }
  table-header: { typography: "{typography.label-sm}", height: "{spacing.row-compact}" }
---

## Overview

**Estrela-guia: "A prancheta de obra".** Quem usa os apps é o vendedor no carro, o comprador no
balcão e o gestor no escritório. [...] **Assinatura.** A etiqueta laranja: uma barra de 3 px à
esquerda do item que pede ação.

## Voice & Content Strategy

- **Termos.** "Pedido" (nunca "ordem"), "cliente" (nunca "conta"), "obra" para o endereço de entrega.
- **Botões.** Verbo e objeto: "Lançar pedido", "Registrar visita". Nunca "OK" nem "Enviar".

## Do's and Don'ts

- Não faça: tabelas densas... (na Bem Viver); laranja em fundo de área (na Atlas).
```

### 2. Como nasce e muda: a conversa

A conversa é a do Assistente do Hub (`apps/server/src/agents/assistant/`), aberta pela tela de
identidade, com uma skill `identidade` e duas ferramentas novas:

- `read_identity`: o rascunho, a versão publicada e os problemas da conferência.
- `write_identity_draft`: grava o DESIGN.md inteiro como rascunho e devolve os problemas. Só para quem
  tem `organization: ['update']` na empresa da conversa. O rascunho nunca chega a um app; só
  "Publicar", um botão da tela, cria uma versão.

O material entra pelos anexos de hoje (`files.ts:173-186`: PDF e imagens), mais SVG e fontes `woff2`
e `ttf`. O site (F.1) é aberto com o `agent-browser` na máquina da conversa: a skill manda medir as
cores, fontes e cantos calculados das páginas e ler os textos para achar a voz, como o modo de leitura
do Impeccable (`reference/document.md:84-92`). Depois, a skill manda perguntar o que o material não
responde (o modo escuro, onde o destaque vai) e nunca inventar um valor que o material não mostrou
sem dizer.

### 3. A conferência antes de publicar

`identityProblems(design)`, dona única em `packages/hub-api/src/company-identity.ts`, roda a cada
gravação do rascunho e no "Publicar". Quatro regras são do linter do formato, lidas no código dele
(`packages/cli/src/rules/`): `broken-ref`, `missing-primary`, `contrast-ratio` e `section-order`. Duas
são da plataforma: as seções obrigatórias (Overview, Colors, Typography, Components, Do's and Don'ts)
e as fontes empacotáveis (G.1). O contraste é medido em 12 pares, no claro e no escuro: texto sobre
fundo e superfície, texto secundário, texto sobre o destaque, sobre o erro e sobre o destaque claro.
O mínimo é 4,5:1; a empresa pode pedir mais no texto, como a Atlas pede 7:1. O protótipo recusou um
rascunho com 2,53:1 e uma referência a `label-xl`, que não existe (captura 08).

### 4. Como o app nasce com ela

`stylesOf(design, starterCss)` escreve o `styles.css` do app: as variáveis do starter recebem o valor
do papel correspondente (`--primary` de `primary`, `--foreground` de `on-surface`, `--border` de
`outline-variant`, e assim por diante, em claro e escuro), `--radius` vem de `rounded.md`, o
movimento vira `--motion-*` e as fontes viram `@import` do `@fontsource`, empacotadas pelo Vite (a
política do app só aceita a própria origem). As `--chart-*` ficam as do starter. Nas duas empresas
fictícias:

```css
/* Atlas */                                        /* Bem Viver */
@import "@fontsource/ibm-plex-sans/400.css";       @import "@fontsource/fraunces/500.css";
@import "@fontsource/ibm-plex-mono/600.css";       @import "@fontsource/nunito-sans/400.css";
  --background: #f3f1ec;                             --background: #fbf8f3;
  --primary: #c2410c;                                --primary: #0f6b5c;
  --radius: 4px;                                     --radius: 12px;
  --motion-state-change: 100ms ease-out;             --motion-state-change: 160ms ease-out;
  --chart-1: #b07a0c;  (o do starter)                --chart-1: #b07a0c;  (o do starter)
  --font-sans: "IBM Plex Sans", ...                  --font-sans: "Nunito Sans", ...
                                                     --font-display: "Fraunces", ...
```

O primeiro commit (`apps/server/src/agents/app-builder/git/repository.ts:66-72`) passa a levar, além
do starter, o `DESIGN.md` da versão publicada, o `src/styles.css` gerado dele, os arquivos de logotipo
e de fonte da empresa em `public/identity/` e `.conexus/identity.json` (`{ "version": 3 }`), gravados
por `hash-object` e `update-index` antes do `write-tree`.

O valor não basta: sombra, assinatura, densidade e a forma da lista estão só no texto, como o formato
quer. No protótipo, a Atlas ganhou tabela densa e a barra laranja; a Bem Viver ganhou cartões
redondos, títulos com serifa e nenhuma tabela, porque o arquivo dela diz "Não faça: tabelas densas"
(captura 12). Quem lê o texto é o Builder (o item 6).

### 5. A conferência do app pega o desvio

Um passo novo da conferência (`packages/app/src/check/`), `TOKENS_DRIFT`, recalcula o `styles.css` a
partir do `DESIGN.md` do app e compara as variáveis da identidade. No protótipo, um `--primary`
trocado à mão deu:

```json
{ "code": "TOKENS_DRIFT", "file": "src/styles.css", "line": 17,
  "message": "--primary é #15803d; o DESIGN.md do app diz #c2410c (primary, claro)" }
```

Mudar a identidade de um app (B.2) é mudar os dois arquivos juntos, e a conferência aceita.

### 6. O Builder segue a identidade e diz a direção

A skill `conexus-app` passa a mandar ler o `DESIGN.md` do app inteiro antes de desenhar, seguir o
texto (a estrela-guia, as regras com nome, a voz nos textos das telas, o que não fazer) e mudar
`DESIGN.md` e `styles.css` juntos quando a pessoa pede um desvio. O modelo do plano ganha "A direção de
design":

```markdown
## A direção de design

- **Identidade:** Atlas Distribuição, versão 3.
- **Direção:** a agenda como prancheta: o número do dia em cima, a tabela densa embaixo, a etiqueta
  laranja só nas visitas atrasadas.
- **Densidade:** compacta no computador, linha de 44 px no celular, como a identidade manda.
- **Desvios da identidade:** nenhum.
```

Quando a versão de `.conexus/identity.json` no `main` do app é mais velha que a publicada, as
instruções do turno dizem isso uma vez, e o Builder oferece a atualização no plano (A.1).

### 7. A tela

Configurações, Identidade, sobre a Pauta do Hub, como nas capturas aprovadas: o começo com três
entradas (site, arquivos, conversa) e as doze dimensões explicadas (01); a leitura (02); o rascunho
com perguntas e a prévia (03); a ficha (04); o arquivo (05); a mudança marcada (06); o escuro (07); a
recusa (08); o diálogo de publicar (09); a publicada com versões e apps (10); só leitura (11); lado a
lado (12); celular (13 a 15, 18); o Hub escuro (16, 17).

```text
1280 px
+--------------------------------------------------------------------------------------+
| Identidade [Rascunho]                                         [Descartar] [Publicar] |
| +------------------------------+  +------------------------------------------------+ |
| | Conversa com o assistente    |  | (Prévia | Ficha | DESIGN.md)  (Claro|Escuro)   | |
| |  anexos, passos lidos,       |  | (Quadro | Celular) [Abrir em tela cheia]       | |
| |  perguntas com respostas,    |  | +--------------------------------------------+ | |
| |  mudanças com antes e depois |  | | o app de agenda feito com o rascunho:      | | |
| | [escreva o que mudar]   [>]  |  | | logotipo, números, lista, formulário,      | | |
| +------------------------------+  | | botões e estados, vazio, aviso             | | |
|                                   +------------------------------------------------+ |
+--------------------------------------------------------------------------------------+

390 px: a conversa em cima, as vistas embaixo; a prévia se arruma como no celular.
```

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 | U1 A identidade da empresa | O contrato, a conferência `identityProblems`, as tabelas de versões e de arquivos, as rotas de ler, publicar, descartar e baixar | `packages/hub-api`, `apps/server/src/hub/identity`, `apps/server/migrations` | [data](../guides/data.md) | nada |
| G1 | U2 O assistente escreve a identidade | A skill `identidade`, `read_identity` e `write_identity_draft`, os anexos de SVG e fonte, a leitura do site | `apps/server/src/agents/assistant` | [testing](../guides/testing.md) | U1 |
| G2 | U3 A tela de identidade | Configurações, Identidade: o começo, a conversa, a prévia, a ficha, o arquivo, publicar, versões e apps, só leitura | `apps/web/src/routes/_app/companies/$companyId_/settings`, `apps/web/src/hub/identity`, `apps/web/src/ui` | [design](../guides/design.md) | U1, U2 |
| G3 | U4 O app nasce com a identidade | O gerador, o primeiro commit com a identidade, o passo `TOKENS_DRIFT` | `packages/app/src`, `apps/server/src/agents/app-builder/git` | [testing](../guides/testing.md) | U1 |
| G3 | U5 O Builder segue a identidade | A skill `conexus-app`, "A direção de design" no plano, o aviso de versão nova | `packages/app/skills`, `apps/server/src/agents/app-builder` | [builder-prompt](../reference/builder-prompt.md) | U4 |

Três pull requests (delivery L9). O contrato entra com U1, seu primeiro implementador; a migração de
U1 entra com o dono de `database-grants.sql`, no mesmo grupo.

**Orçamento de código alterado.** U1: 900. U2: 650. U3: 1.300. U4: 550. U5: 300. Total: 3.700
linhas, dentro de delivery L2.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/:companyId/identity` devolve a versão publicada, o rascunho, as versões e os apps com a versão que cada um segue; de outra empresa, `404` | `apps/server/src/hub/identity/identity-routes.test.ts`, "lê a identidade da sua empresa" | must |
| 2 | U1 | `POST .../identity/publish` com `If-Match` do rascunho cria a versão seguinte para dono e administrador; desenvolvedor e membro recebem `403 FORBIDDEN`; um rascunho com problema recebe `422 IDENTITY_PROBLEMS` com cada regra e mensagem; um `If-Match` velho recebe `409 IDENTITY_STALE` | `identity-routes.test.ts`, "publica só o rascunho conferido e atual" | must |
| 3 | U1 | `identityProblems` dá vazio para os dois exemplos e acusa, nomeando a regra: referência quebrada, falta de `primary`, contraste abaixo do mínimo em qualquer dos 12 pares no claro ou no escuro, seção fora de ordem, seção obrigatória ausente, fonte que não é do Fontsource nem da empresa | `packages/hub-api/src/company-identity.test.ts`, "a conferência da identidade" | must |
| 4 | U1 | Um arquivo de logotipo ou de fonte que não é o que diz ser (assinatura de SVG, PNG, `woff2` ou `ttf`), ou acima de 512 KB, é recusado com `IDENTITY_ASSET_INVALID` e não é gravado | `identity-routes.test.ts`, "recusa o arquivo que não é o que diz" | must |
| 5 | U2 | Na conversa de dono ou administrador, `write_identity_draft` grava o rascunho e devolve os problemas; na de desenvolvedor ou membro, a ferramenta não existe | `apps/server/src/agents/assistant/identity-tools.test.ts`, "só quem muda a empresa escreve o rascunho" | must |
| 6 | U2 | Com o modelo dublê, um PDF, um SVG e capturas anexados e um site de teste servido localmente: o rascunho gravado tem as cores e a fonte do material e passa na conferência | `identity-tools.test.ts`, "o rascunho nasce do material" e o retrato T26 de uma conversa gravada | must |
| 7 | U3 | Dono e administrador veem a conversa, as três vistas e "Publicar"; a prévia muda quando o rascunho muda, sem recarregar, em claro, escuro e celular | `apps/web/src/hub/identity/company-identity.test.tsx`, "a prévia segue o rascunho" | must |
| 8 | U3 | Com problemas, "Publicar" fica desligado e a tela lista cada um, como na captura 08; o diálogo de publicar diz o que vai, quem recebe e o que foi conferido | `company-identity.test.tsx`, "publicar só conferido" | must |
| 9 | U3 | Desenvolvedor e membro veem a ficha e "Baixar DESIGN.md", sem conversa nem "Publicar" | `company-identity.test.tsx`, "só leitura sem a permissão" | must |
| 10 | U3 | A tela bate com as capturas aprovadas, a 1366 e a 390 px, nos dois temas | QA (testing T25) | must |
| 11 | U4 | O mesmo pedido em duas empresas dá primeiros commits com o `DESIGN.md` de cada uma, `styles.css` diferentes e `.conexus/identity.json` com a versão; as `--chart-*` são as do starter | `apps/server/src/agents/app-builder/git/repository.test.ts`, "o app nasce com a identidade da sua empresa" | must |
| 12 | U4 | Empresa sem identidade: o app nasce com o starter de hoje, byte a byte | `repository.test.ts`, "sem identidade, o padrão" | must |
| 13 | U4 | A conferência recusa um `styles.css` cuja variável difere do `DESIGN.md` do app, com `TOKENS_DRIFT`, o arquivo, a linha e o papel; aceita quando os dois mudam juntos | `packages/app/src/check/check.test.ts`, "tokens fora do DESIGN.md" | must |
| 14 | U5 | O plano de um app novo traz "A direção de design" com a identidade e a versão, a direção, a densidade e os desvios; o portão de `submit_plan` não muda | `apps/server/src/agents/app-builder/plan-tools.test.ts`, "o modelo do plano pede a direção" e o retrato T26 de um plano gravado | must |
| 15 | U5 | Quando a versão do app é mais velha que a publicada, as instruções do turno dizem isso uma vez; quando é a mesma, nada | `apps/server/src/agents/app-builder/instructions.test.ts`, "aviso de identidade nova" | must |
| 16 | U5 | Com modelo real, nas duas empresas de teste: o fundador distingue as duas Prévias lado a lado, e os textos das telas usam os termos da voz de cada empresa | o roteiro do fundador, passo 4 | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configurações, Identidade | "Os 3 apps da Atlas usam a identidade padrão do Conexus." e as três entradas (captura 01) | Sem rascunho: a publicada e "Mudar conversando" (10) | A leitura do material, passo a passo, na conversa (02); esqueleto ao abrir | "Não deu para carregar a identidade." com "Tentar de novo"; a falha de um turno, como no Assistente de hoje | A página de não encontrado do Hub | A ficha e "Baixar DESIGN.md", com "Só a dona e os administradores mudam a identidade." (11) | Problemas: "Publicar" desligado e a lista (08); `409`: "Alguém publicou antes de você." com "Recarregar" |
| Plano no Builder (seção nova) | Empresa sem identidade: "Usei a identidade padrão do Conexus" | Não se aplica | O do cartão do plano | O do cartão do plano | Não se aplica | Não se aplica | Não se aplica |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| Rascunho (`design`, `revision`) | U2, `write_identity_draft` | U1 (publicar), U3 (as vistas) |
| Versão publicada (`version`, `design`, `publishedBy`, `publishedAt`, `summary`) | U1, "Publicar" | U3, U4 (nascimento), U5 (aviso) |
| Arquivos (`kind`: logotipo claro, escuro, fonte; `sha256`; bytes) | U2, dos anexos | U1 (baixar), U3 (prévia), U4 (o app) |
| `.conexus/identity.json` do app | U4 no nascimento; o Builder ao seguir a versão nova | U1 (os apps e suas versões), U5 (o aviso) |

Peças de `ui/` (design V62): `Tabs`, `ToggleGroup`, `Button`, `Dialog`, `Badge` e a conversa do
Assistente, que já existem. Novas: a moldura da prévia (`AppPreview`), a ficha (`IdentitySheet`) e o
arquivo com linhas (`CodeView`, se a de hoje não servir), cada uma com sua linha na tabela de
referência, no mostruário e no `DESIGN.md` da raiz, na U3.

## A tabela de falhas

| Gravação ou comando | Duas vezes ao mesmo tempo | Recusada no meio | Uma dependência fora | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `write_identity_draft` (U2) | O rascunho guarda `revision`; a segunda escrita com a revisão velha volta ao modelo com a atual | Uma transação só: o rascunho e os arquivos, ou nada | Banco fora: a ferramenta falha e o turno diz | `IDENTITY_DRAFT_WRITTEN` com `companyId`, `revision` e a contagem de problemas; nunca o texto | 5, 6 |
| `POST .../publish` (U1) | `If-Match`: o primeiro publica, o segundo recebe `409 IDENTITY_STALE` | Uma transação: a versão nova e o rascunho apagado | `503` da plataforma, nada publicado | `IDENTITY_PUBLISHED` com `companyId` e `version` | 2 |
| A leitura do site (U2, F.1) | Uma por conversa, como o turno | A página que não abre fica fora do rascunho, e a conversa diz qual | Site fora: a conversa diz e segue com os arquivos | O passo da ferramenta da máquina de hoje | 6 |
| O primeiro commit com a identidade (U4) | O `rename` de hoje decide (`repository.ts:58-59`, `:75`) | Montado ao lado e renomeado; nada pela metade | A leitura da identidade falha: a criação falha com o erro de hoje; nunca nasce com a padrão por engano | `PROJECT_STARTED` de hoje, mais `identityVersion` | 11, 12 |

## A tabela de referência

| Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O que a identidade guarda | U1 | Trilha, 2026-11-09: "igual o design.md, que o Impeccable utiliza"; 2026-11-25: "muito básico", "cores de gráfico [...] ridículo" | `DESIGN.md:1-375` (a Pauta, 7 seções); `apps/web/src/brand/tokens.test.ts:6-27` | google-labs-code/design.md `db977b3` `docs/spec.md:84-109`, `:202-211`, `:463-507`, mesma situação; Impeccable `reference/document.md:132-249`; awesome-design-md `fcc7028`, 84 marcas (Typography, Colors, Components em 84; Do's and Don'ts em 83) | Valores em YAML e intenção em texto, nas dez seções; nenhuma das fontes põe cor de gráfico na identidade (**lido**) | nativo: o formato aberto, com Iconography e Imagery como seções extras (`spec.md:613`) | — | E a G, fundador, 2026-11-25 | `packages/hub-api/src/company-identity.ts` |
| A conferência da identidade | U1 | VISION.md, Conexus Agents: "Uma regra de comportamento que importa vira mecanismo do motor" | `tokens.test.ts:6-27` (o Hub confere a Pauta) | linter do formato `db977b3` `packages/cli/src/rules/index.ts:31-43` (11 regras), `contrast-ratio.ts:19` (4,5:1), mesma situação | Regras com nome, severidade e mensagem, rodadas sobre o arquivo (**lido**) | embrulhado: 4 regras do linter reescritas, mais 2 da plataforma; o pacote não entra como dependência (o protótipo não pôde instalá-lo) | o teste do critério 3 | firstmate 1 | — |
| Onde mora e as versões | U1 | Trilha, 2026-11-14: "3B. Identidade da empresa mais direção por app" | `apps/server/src/hub/identity/tables.ts:187-198` (`logo`, `metadata` sem uso) | Lovable "Release version" e projetos com a versão em que entraram; Bolt "version history [...] each time you sync"; v0 Revision History (documentados, `refs/produtos/`) | Uma versão por publicação, e o app guarda a sua (**documentado**) | embrulhado: tabela `company_identity_version` e o rascunho em `company_identity_draft`, do Drizzle | — | firstmate 2 | `apps/server/src/hub/identity/identity.ts` |
| Quem muda | U1, U2 | Trilha, 2026-11-09: "Dono e administrador editam a identidade da empresa" | `apps/server/src/hub/identity/roles.ts:91-108` | `better-auth@1.7.8` `access/statement.mjs:24-25`, `:44-45`, `:64-65`, mesma situação | `organization: ["update"]` só em `adminAc` e `ownerAc` (**lido**) | nativo | — | não precisa | — |
| Como nasce: o material e o agente | U2 | F.1, fundador, 2026-11-25 | `apps/server/src/agents/assistant/files.ts:173-186` (PDF, planilha, documento, texto, imagem); `harness/machine/confer.ts:12` (`agent-browser`) | Claude Design "extracts a reusable design system" de código, Figma, PDF, logotipo, capturas; Stitch "extract a design system from any URL"; Lovable, Bolt e Base44 aceitam site e arquivos (documentados); Impeccable `document.md:84-92` (lê o site no navegador) | Muitas fontes entram, e um agente as destila num artefato (**documentado**; Impeccable **lido**) | embrulhado: a skill `identidade` no Assistente, com os anexos e o navegador de hoje | o teste do critério 6 | F.1 | `apps/server/src/agents/assistant/identity-tools.ts`, `skills/identidade/SKILL.md` |
| Como muda: a conversa | U2, U3 | E.1, fundador, 2026-11-25; VISION.md:95, :101 | `apps/server/src/agents/assistant/propose-company-memory.ts` (o cartão de proposta) | Claude Design "Remix" em conversa; v0 muda por conversa (documentados) | O sistema muda por pedidos ao agente (**documentado**) | nativo: uma ferramenta do Assistente | — | E.1 | — |
| A tela | U3 | Protótipo aprovado, 2026-11-25 | `apps/web/src/routes/_app/companies/$companyId_/settings/general.tsx:11` | Base44, formulário com prévia ao vivo; Claude Design, prévia ao lado (documentados) | A identidade é vista aplicada antes de publicar (**documentado**) | nativo: peças `ui/` de hoje e três novas | as capturas aprovadas | não precisa | `apps/web/src/routes/_app/companies/$companyId_/settings/identity.tsx`, `apps/web/src/hub/identity/company-identity.tsx` |
| A fonte | U1, U4 | G.1, fundador, 2026-11-25 | `packages/app/skills/conexus-app/SKILL.md:116` ("No external fonts") | Claude Design e Bolt aceitam arquivo de fonte; Base44 guarda fontes (documentados); Fontsource empacota a fonte aberta como pacote npm | A fonte vai com o app (**documentado**) | nativo: `@fontsource/*` ou o arquivo em `public/identity/` | — | G.1 | — |
| O logotipo | U1, U3, U4 | C.1, fundador, 2026-11-24 | `tables.ts:193` (`logo` sem uso) | Dify `484404f` `api/services/workspace/service.py:130-132`, `web_app_runtime_query_service.py:107-114`, mesma situação | O logotipo do workspace vai para os web apps (**lido**) | nativo | — | C.1 | — |
| O app nasce com a identidade | U4 | A.1, fundador, 2026-11-24 | `repository.ts:66-72` (o primeiro commit é o starter, igual para todos) | Appsmith `69f0b84` `ApplicationPageServiceCEImpl.java:470-474`; Base44 "every new app you build starts on-brand"; Bolt "New projects use the latest version" | O tema entra no app quando ele nasce (**lido**, **documentado**) | embrulhado: o `git` de hoje com `hash-object` e `update-index` antes do `write-tree` | — | A.1 | `packages/app/src/identity.ts` |
| O `styles.css` segue o `DESIGN.md` | U4 | VISION.md, Conexus Agents (mecanismo do motor) | `tokens.test.ts:6-27` (**herdado**) | Lovable "When violations are found, Lovable automatically retries"; v0 "If a component, prop, or token cannot be verified [...] should not use it" (documentados) | A geração é conferida contra o sistema (**documentado**) | embrulhado: um passo da conferência de hoje | o teste do critério 13 | não precisa | `packages/app/src/check/tokens.ts` |
| O Builder lê a identidade e diz a direção | U5 | Roteiro, `A2`: "O plano mostra a direção de design antes de construir"; B.2 | `conexus-app/SKILL.md:8` ("you never invent a palette"), `:47`; `plan-template.md:5-24` | Figma Make "`Guidelines.md` [...] always looks at first"; Bolt "a reference for every UI decision" (documentados); Impeccable `new-work.md:75-89` (a direção de cada superfície) | O agente lê o sistema antes de gerar e diz a direção antes de construir (**documentado**, **lido**) | nativo: o `DESIGN.md` no repositório, lido pela skill; uma seção do plano em texto | — | B.2 | — |
| A versão nova chega ao app | U5 | A.1, fundador, 2026-11-24 | `apps/server/src/agents/app-builder/instructions.ts` | v0 "Existing projects don't update automatically"; Base44 aplica a um app pronto só quando pedem (documentados) | O app muda quando alguém pede (**documentado**) | nativo: um aviso nas instruções do turno | — | A.1 | — |

Procurado: o formato aberto e seu linter (`db977b3`), a skill Impeccable instalada, a coleção
awesome-design-md (`fcc7028`), a documentação pública de Claude Design, Google Stitch, Lovable, v0,
Figma Make, Bolt, Base44 e Canva (lida em 2026-11-25, com as citações na pasta da tarefa), a estante
(`appsmith` `69f0b84`, `dify` `484404f`) e o produto antigo em `e0353c36`, que não tinha identidade
de empresa. As páginas do Stitch e uma do Figma só abrem num navegador; ali vale o blog oficial e o
trecho da busca, marcados como tais.

**A medida do transplante.** Nada é trazido do produto antigo.

**A dívida.** O texto branco sobre o dourado do starter tem contraste de 3,73:1, abaixo de 4,5:1. A
padrão fica byte a byte (critério 12); o conserto vai numa issue.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A conferência reescreve 4 regras do linter em vez de depender do pacote `@google/design.md` | O formato é `alpha` (`spec.md`) e muda; o pacote traz um CLI inteiro; as regras são curtas (`rules/index.ts:31-43`) | Trocar `identityProblems` pela chamada ao pacote |
| 2 | Versões numa tabela própria, com o rascunho em outra, e não um campo da empresa | O fundador quer ver as versões e os apps em cada uma (captura 10); um campo só guarda a atual | Um campo `design` e o histórico na atividade |
| 3 | O catálogo de fontes abertas é um arquivo gerado no repositório pela lista pública do Fontsource, atualizado por script | A conferência não chama serviço de fora a cada publicação | Consultar o registro do npm na publicação |
| 4 | O texto da direção fica no plano, não no `DESIGN.md` do app | O Impeccable nunca leva a direção para o código entregue (`reference/new-work.md:77`) | Uma seção no `DESIGN.md` do app |

## U1 A identidade da empresa

**Base e modelo.** `main` depois do fechamento da etapa 2. Sonnet: um contrato, duas tabelas e quatro
rotas, num só módulo.

### As linhas da tabela

O que a identidade guarda; A conferência da identidade; Onde mora e as versões; Quem muda; A fonte;
O logotipo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/hub-api/src/company-identity.ts` | Cria o contrato, `identityProblems`, o catálogo de fontes | U2, U3, U4, o servidor |
| `apps/server/src/hub/identity/` | Cria `identity.ts`, `identity-routes.ts`; muda `tables.ts` | `hub/` |
| `apps/server/migrations/` e `database-grants.sql` | Cria a migração das três tabelas | CI |

### Os contratos que a unidade cria

- `GET /api/companies/:companyId/identity` (membro): `200 { published: { version: number, design: string, publishedBy, publishedAt, summary } | null, draft: { design: string, revision: IdentityRevision, problems: IdentityProblem[] } | null, versions: { version, summary, publishedAt }[], apps: { projectId, name, version: number | null, deviates: boolean }[], assets: { id, kind, name }[] }`; `404` fora da empresa.
- `POST .../identity/publish` (`organization: ['update']`), `If-Match: <revision>`, corpo `{ summary: string }`: `201 { version }`; `403`; `409 IDENTITY_STALE { revision }`; `422 IDENTITY_PROBLEMS { problems }`.
- `DELETE .../identity/draft` (`organization: ['update']`): `204`.
- `GET .../identity/versions/:version/design.md` e `GET .../identity/assets/:assetId` (membro): o arquivo.
- `IdentityProblem`: `{ rule: 'broken-ref' | 'missing-primary' | 'contrast-ratio' | 'section-order' | 'missing-section' | 'font-not-bundled', message: string, path?: string }`.
- Tabelas `company_identity_version` (`company_id`, `version`, `design`, `summary`, `published_by`, `published_at`), `company_identity_draft` (`company_id` chave, `design`, `revision`) e `company_identity_asset` (`id`, `company_id`, `version` nula no rascunho, `kind`, `name`, `sha256`, `bytes` até 512 KB).
- O arquivo modelo: `packages/hub-api/src/company-memory.ts` (marca nos ids, constante dona do limite).

### As skills e a leitura

`better-auth-best-practices`, `organization-best-practices`; `drizzle` (em
`node_modules/drizzle-kit/skills/`); `fastify-best-practices`. O `docs/spec.md` do formato.

### A ordem do trabalho

1. **O contrato e a conferência.** Critério 3. Os dois exemplos da pasta da tarefa viram os arquivos
   de teste. Mutações à mão: trocar 4,5 por 3; aceitar uma referência que não existe.
2. **As tabelas e as rotas.** Critérios 1, 2, 4. Mutação à mão: tirar a comparação do `If-Match`.

### Como se prova

Os testes pela porta pública do Hub (testing T5), com as duas empresas de teste do banco local.

### Parar se

A migração pedir permissão de tabela nova para o papel dos apps: é do fundador (delivery L6).

## U2 O assistente escreve a identidade

**Base e modelo.** Depois de U1. Sonnet.

### As linhas da tabela

Como nasce: o material e o agente; Como muda: a conversa; Quem muda.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/agents/assistant/identity-tools.ts` | Cria `read_identity` e `write_identity_draft` | `assistant.ts` |
| `apps/server/src/agents/assistant/skills/identidade/SKILL.md` | Cria a skill | `assistant.ts` |
| `apps/server/src/agents/assistant/files.ts` | Muda `KINDS`: SVG e fontes | os anexos |

### A ordem do trabalho

1. **As ferramentas.** Critério 5. Como `propose-company-memory.ts`, pela empresa da conversa;
   `write_identity_draft` existe só quando a pessoa tem `organization: ['update']`.
2. **A skill.** Critério 6. O que ler, o que medir no site com o `agent-browser`, o que perguntar e o
   que nunca inventar; o DESIGN.md sempre inteiro, nas seções do formato.

### Como se prova

O retrato T26 de uma conversa gravada, com o modelo dublê e um site de teste local.

### Parar se

A máquina da conversa do Assistente não tiver o `agent-browser`: a leitura do site volta ao cartão.

## U3 A tela de identidade

**Base e modelo.** Depois de U1 e U2. Sonnet.

### As linhas da tabela

A tela; Como muda: a conversa; O logotipo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/routes/_app/companies/$companyId_/settings/` | Cria `identity.tsx`; muda o índice | o roteador |
| `apps/web/src/hub/identity/` | Cria `company-identity.tsx` e o app de exemplo da prévia | a rota |
| `apps/web/src/ui/` | Cria `app-preview.tsx`, `identity-sheet.tsx` e suas entradas no mostruário | a tela |

### As skills e a leitura

`shadcn`; as skills `router-core` de `@tanstack/router-core`; a [referência do Impeccable](../reference/impeccable.md) (`layout`, `adapt`, `harden`, `clarify` e `detect`); as capturas aprovadas.

### A ordem do trabalho

1. **A prévia e a ficha.** Critério 7. A prévia aplica o rascunho como variáveis CSS no `style` do
   contêiner (a política do Hub proíbe `<style>`) e carrega as fontes da empresa pelo `FontFace`; o
   app de exemplo se arruma pela largura do quadro (`@container`), como o protótipo.
2. **A conversa, publicar e as versões.** Critérios 8, 9. Testes com MSW (T14).
3. **O QA.** Critério 10.

### Parar se

A conversa do Assistente não puder ser aberta dentro de outra página sem uma peça nova.

## U4 O app nasce com a identidade

**Base e modelo.** Depois de U1. Sonnet.

### As linhas da tabela

O app nasce com a identidade; O `styles.css` segue o `DESIGN.md`; A fonte; O logotipo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/src/identity.ts` | Cria `stylesOf` e `IDENTITY_FILE = '.conexus/identity.json'` | `repository.ts`, a conferência, U5, U1 |
| `packages/app/src/check/` | Cria `tokens.ts`, o passo `TOKENS_DRIFT` | a conferência |
| `apps/server/src/agents/app-builder/git/repository.ts` | Muda `ensure`: grava a identidade no primeiro commit | quem cria o Projeto |

### A ordem do trabalho

1. **O gerador.** Critérios 11, 12. O protótipo `identidade-v2.mjs` é a referência; a padrão é o
   starter de hoje, byte a byte.
2. **O primeiro commit.** Critério 11 (`repository.ts:66-72`).
3. **A conferência.** Critério 13.

### Parar se

A criação do Projeto não souber a empresa no ponto do `ensure`: o contrato entre U1 e U4 volta ao
cartão.

## U5 O Builder segue a identidade

**Base e modelo.** Depois de U4. Sonnet.

### As linhas da tabela

O Builder lê a identidade e diz a direção; A versão nova chega ao app.

### A ordem do trabalho

1. **O que sai.** `conexus-app/SKILL.md:8` e `:47`, que só se apoiam em "foi implementado assim".
2. **O que entra.** A skill manda ler o `DESIGN.md` inteiro, seguir o texto e a voz, e mudar
   `DESIGN.md` e `styles.css` juntos num desvio pedido; o modelo do plano ganha "A direção de
   design". Critério 14.
3. **O aviso.** Critério 15.

### Como se prova

O retrato T26 de um plano gravado com a seção nova; o critério 16 pelo fundador.

## G1 O ponto de conferência

O servidor local com a migração, as duas empresas de teste e uma conversa com o modelo dublê que
grava um rascunho, recusa a publicação com problema e publica sem.

## G2 O ponto de conferência

A tela local, os passos 1, 2 e 6 do roteiro em 1366 e 390 px, claro e escuro, ao lado das capturas
aprovadas.

## G3 O ponto de conferência

Duas criações de app no Hub local com dublês de modelo, uma por empresa: os primeiros commits
diferem no `styles.css`, e a conferência recusa um `styles.css` mexido à mão.
