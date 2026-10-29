# Etapa 19.2: Central de Ajuda

## A página do fundador

**No fim desta etapa** qualquer pessoa abre **ajuda.conexus.fun**, sem entrar no Hub, procura
"Sankhya" e lê "Ligar o Sankhya": o que precisa antes, onde achar o Client ID, o Client Secret e o
X-Token, com os seus prints e o link da documentação oficial do Sankhya. Na janela **Ligar** do
Hub, ao lado de cada chave, "Ver o passo a passo" abre essa página já no trecho daquela chave. O
guia mora ao lado do conector, no mesmo pull request do código, e um conector sem guia, ou com um
link que aponta para um trecho que não existe, é recusado pelo CI. A 19.1 já nasce assim: o Mercado
Livre chega com o guia dele.

**O roteiro de uso.** No computador e no celular, sem estar no Hub.

1. Você abre `https://ajuda.conexus.fun`. Vê "Ajuda do Conexus", com as cores e as fontes do Hub,
   claro por padrão e escuro se o seu sistema estiver escuro, a busca "Pesquisar" e, na barra
   lateral, **Conectores › Sankhya › Ligar o Sankhya**.
2. Você digita "x-token" na busca. O resultado é "Ligar o Sankhya", no trecho do X-Token. Você abre.
3. A página mostra "O que você precisa", depois **Client ID**, **Client Secret** e **X-Token**, cada
   um com os seus passos numerados, os seus prints e o link da documentação oficial do Sankhya, que
   abre o site do Sankhya. No celular, a página cabe na largura, sem rolar para o lado.
4. Você abre `https://ajuda.conexus.fun/nao-existe`: vê "Página não encontrada", com a busca e o
   caminho de volta para o início.
5. No Hub, como a Ana, você abre **Integrações › Sankhya › Ligar**. Em "Antes de colar", cada chave
   tem a linha curta que saiu do seu texto e **Ver o passo a passo**, que abre a página do passo 3
   em outra aba, já no trecho daquela chave.

**O que você faz, e quando.**

- **Antes da U2:** os passos que você segue no Sankhya para achar cada uma das três chaves, com os
  prints (a sua resposta `D3 A`, 2026-10-29). Os prints vêm de uma empresa de teste ou com nomes,
  CNPJs e valores cobertos: nada de dado de empresa no repositório (segurança S40). O agente
  escreve a página e a linha curta de cada chave a partir do seu texto, e confere cada print antes
  do commit.
- **No começo:** aprova esta página.
- **Depois que a U1 for publicada pela primeira vez** (o Release depois que a 19 fechar e a U1
  entrar no `main`), um clique, uma vez: no painel da Cloudflare, **Workers & Pages › conexus-help ›
  Settings › Domains & Routes › Add › Custom domain**, `ajuda.conexus.fun`. A própria Cloudflare cria
  o registro e o certificado na zona `conexus.fun` (o DNS dela responde na Cloudflare; o domínio
  continua registrado na Hostinger). Você não cria registro à mão, e o token de publicar continua
  sem permissão na zona do Hub. Custo: US$ 0 (arquivos estáticos não contam requisição no Workers
  Paid que você já paga).
- **No fim:** faz o roteiro no computador e no celular, diz o que viu e aprova os textos: a página
  do Sankhya, a página inicial e "Ver o passo a passo".

**Fica de fora.**

- Guias de Projetos, do Builder, de apps e de contas de modelo: a central nasce só com os
  conectores, que é o que a tela Ligar pede. Uma página nova é um arquivo Markdown, quando você
  pedir.
- "Respondeu à sua pergunta?", comentários, fórum ou atendimento: a central é só leitura (o estudo:
  Zapier separa a central da comunidade).
- Login na central: aberta (`D4 A`).
- O link "Editar esta página": o repositório é privado.
- Um segundo idioma: o roteiro deixa fora do lançamento.
- O guia do Mercado Livre: nasce com a 19.1, no mesmo molde. O da Jet, com a 20.3.
- Voltar a um Release de antes da 19.2 deixa a central como está: o script de publicar só a
  publica quando o Release tem `apps/help` (como faz com a borda dos apps).
- Os itens abertos com `next-card` não tocam a central nem o guia: cada um espera a etapa dele.

**A ligação com a etapa 19.** A 19 (em revisão) já dá a cada chave do Sankhya uma linha de ajuda e
um link para a página oficial do Sankhya. A 19.2 troca só para onde esse link aponta: o trecho do
guia, que por sua vez leva à página oficial. Por isso a U1 (o site, que não toca nada da 19) é
construída já, num ramo, ao mesmo tempo que a 19 fecha; a U2 (o guia, os links e o texto da
tela) espera o kit e a tela da 19 no `main` e os seus prints. As duas entram no `main` depois que a
19 fechar ([entrega L1, L5](../guides/delivery.md)).

**As decisões suas nesta etapa.** Nenhuma nova. As quatro do estudo já têm a sua palavra
(2026-10-29, "D recomendado"): `D1 A` `ajuda.conexus.fun`; `D2 A` a 19.2 entre a 19 e a 19.1; `D3 A` você
dá os passos e os prints e o agente escreve; `D4 A` aberta. O subdomínio criado na Cloudflare pelo seu
clique: "Ah entendi, aprovado então do subdominio, tinha esquecido".

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O site `apps/help` (Starlight num Worker de arquivos estáticos `conexus-help`), a paleta do Hub num arquivo que o Hub e o site leem, a página inicial e a 404 em português, a busca, os cabeçalhos, a publicação no Release, o CI que monta o site e confere as páginas montadas | `apps/help/`, `apps/web/src/brand/`, `infra/publish-edge.sh`, `infra/hub.Dockerfile`, `scripts/publish-edge.test.ts`, `tests/help/`, `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, `knip.json`, `docs/reference/stack.md`, `docs/architecture.md` | design | `main` |
| U2 | O guia "Ligar o Sankhya" ao lado do conector, com os prints do fundador; o endereço da central no kit e o teste comum que exige o guia e confere cada link; os links das três chaves apontando para os trechos; "Ver o passo a passo" na janela Ligar; o teste que cruza o kit e o site montado | `packages/connectors/src/kernel/`, `packages/connectors/src/sankhya/`, `apps/web/src/hub/connectors/`, `tests/help/` | testes | U1; a U1 e a U4 da 19 no `main`; os passos e os prints do fundador |

**A entrega.** Cada unidade é o seu próprio pull request sobre o `main`
([entrega L9, L13](../guides/delivery.md)). A U1 é construída já, sobre o `main` de hoje: não toca
arquivo da 19 além dos da raiz que toda unidade muda (`package.json`, `package-lock.json`,
`ci.yml`, `stack.md`, `hub.Dockerfile`), que o builder refaz sobre o `main` quando a 19 fechar
(`npm install` de novo para o lockfile, as duas linhas de cada arquivo). A U2 começa quando os
prints chegarem e a U1 e a U4 da 19 estiverem no `main`; se a 19 ainda não tiver fechado, a U2 é
construída sobre o ramo da U1 da 19.2 com o ramo da U4 da 19 dentro, e refeita sobre o `main`
depois. Nenhuma unidade entra no `main` antes de a 19 fechar e de este cartão ir para
`docs/steps/` ([L5](../guides/delivery.md)). Não correm em paralelo: a U2 escreve em `tests/help/` e
precisa do site da U1.

**Orçamento de código alterado.** U1: ~360 (configuração do Astro e da coleção ~60, a paleta
separada do `tokens.css` ~130 linhas movidas, que o `numstat` conta dos dois lados, o mapa para o
Starlight ~60, `wrangler.jsonc` e `_headers` ~25, `package.json` ~25, o script de publicar ~20, CI e
Dockerfile ~10, documentos ~30). U2: ~70 (o endereço e a conferência no kit ~45, os três links ~10,
o texto da tela ~5, a leitura da pasta ~10). Total da etapa: ~430, longe do teto de 4.000
([L2](../guides/delivery.md)). Fora da conta: o texto do guia, da página inicial e da 404, e os
testes. Dependências novas ([L16](../guides/delivery.md)): `astro` e `@astrojs/starlight`, só no
`apps/help`; `wrangler` entra no `apps/help` na versão que o repositório já instala. Nenhuma está
entre as escolhas caras: é um site estático, que se troca sem migrar nada.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | O site montado (`apps/help/dist`) tem `index.html` com `lang="pt-BR"`, o título "Ajuda do Conexus", a busca "Pesquisar" e o índice do Pagefind (`pagefind/`); `404.html` com "Página não encontrada"; `<link rel="canonical">` com `https://ajuda.conexus.fun/`; e `_headers` com `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Content-Security-Policy: frame-ancestors 'none'` para `/*`. Recusa: sem `site` no `astro.config.ts`, a página sai sem canonical e o teste falha | `tests/help/site.test.ts`, "o site montado em português, com busca, 404 e cabeçalhos" | must |
| 2 | U1 | A folha do site montado declara as cores e as fontes do Hub: o `--sl-color-accent` do tema claro resolve para o mesmo valor do `--color-accent` do Hub, lido do mesmo arquivo da paleta, e as três fontes `.woff2` do Hub estão em `dist/_astro/`. Recusa: uma cor escrita à mão na pasta do site (fora de `apps/web/src/brand/`) é recusada pela regra da marca ([design V3](../guides/design.md)) que o teste lê como texto | `tests/help/site.test.ts`, "as cores e as fontes do Hub, de um só arquivo" | must |
| 3 | U1 | O Hub continua com as mesmas cores: depois da separação da paleta, os testes de tela e de componentes passam sem mudar um valor | os testes de hoje de `apps/web` (`npm run test:unit -w @conexus/web`, `npm run test:browser -w @conexus/web`) | must |
| 4 | U1 | `infra/publish-edge.sh`, num Release com `apps/help`, monta o site e publica `apps/help/wrangler.jsonc` com o mesmo `--env-file`, depois da borda dos apps, e imprime `publishing: --config ../help/wrangler.jsonc` e `help site published`; num Release sem `apps/help` (um anterior, na volta atrás) imprime `this release has no apps/help; the help site stays as it is` e termina com 0; o token nunca aparece no ambiente do `wrangler` nem numa linha de comando; uma montagem que falha termina com erro antes de chamar o `wrangler` para o site | `scripts/publish-edge.test.ts`, "publica o site de ajuda depois da borda", "um Release sem apps/help deixa a central", "a montagem que falha não publica" | must |
| 5 | U1 | `apps/help/wrangler.jsonc` não tem `routes` nem `custom_domain`, tem `workers_dev: false` e `assets.not_found_handling: "404-page"`: o publicar nunca pede permissão de zona e nunca muda o domínio que o fundador ligou | `tests/help/site.test.ts`, "o Worker sem rota, com a 404" | must |
| 6 | U1 | O CI monta o site em todo pull request e roda `tests/help/` depois da montagem, no job `web`; uma página que não monta deixa o `ci` vermelho ([L15](../guides/delivery.md)) | o job `web` de `.github/workflows/ci.yml` | must |
| 7 | U2 | `runConformance` recusa um conector sem `guide/` ou sem a página que um link nomeia, e um `help.url` fora de `https://ajuda.conexus.fun/conectores/<id do conector>/<página>/#<trecho>`; recusa uma página do guia sem nenhum link `https://` para fora da central (a documentação oficial do fornecedor). O teste planta um conector de mentira com cada falha e vê cada uma recusada | `packages/connectors/src/kernel/kernel.test.ts`, "o teste comum exige o guia e o endereço da central" | must |
| 8 | U2 | O Sankhya passa no teste comum com o guia: os três `help.url` apontam para `/conectores/sankhya/ligar/#client-id`, `#client-secret` e `#x-token`, cada `help.text` é uma linha | `packages/connectors/src/sankhya/sankhya.test.ts`, "o Sankhya passa no teste comum" | must |
| 9 | U2 | Cada `help.url` de cada conector do kit existe no site montado: a página `dist/conectores/<id>/<página>/index.html` e um elemento com o `id` do trecho. Recusa: trocar um título do guia ("X-Token" para "Token X") faz o teste falhar, sem tocar no kit | `tests/help/anchors.test.ts`, "cada link de chave abre um trecho que existe" | must |
| 10 | U2 | A página "Ligar o Sankhya" montada tem "O que você precisa", os títulos Client ID, Client Secret e X-Token, cada print com `alt` em português, e o link para `developer.sankhya.com.br`; a busca do Pagefind acha "X-Token" nela | `tests/help/anchors.test.ts`, "a página do Sankhya, com prints e a documentação oficial" | must |
| 11 | U2 | Na janela Ligar, cada chave mostra a linha de `help.text` e **Ver o passo a passo**, um link com `href` igual ao `help.url` do catálogo, `target="_blank"` e `rel="noreferrer"` | `apps/web/src/hub/connectors/integrations.test.tsx`, o caso da janela Ligar | must |
| 12 | U1, U2 | A 390 px e a 1280 px, nos dois temas, a página inicial, a do Sankhya e a 404 não rolam para o lado e o texto do corpo fica nos mínimos de leitura ([design V13, V18](../guides/design.md)) | o QA da etapa ([testing T25](../guides/testing.md)) | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Início da central (`/`) | "Ajuda do Conexus", uma linha do que a central é, e "Conectores" com o Sankhya | — (sempre há o Sankhya) | — (estático) | — | — | — (aberta, `D4 A`) | — |
| Uma página de guia (`/conectores/sankhya/ligar/`) | o título, "O que você precisa", os trechos por chave, o índice da página à direita (1280) ou no topo (390) | — | — | — | — | — | — |
| A busca | o campo "Pesquisar" | "Nenhum resultado para …" (a frase do Pagefind em pt-BR) | o Pagefind carregando o índice | o índice que não carrega: a frase do Pagefind | — | — | — |
| A 404 (`/qualquer-coisa`) | — | — | — | — | "Página não encontrada", com a busca e o link para o início | — | — |
| Ligar, no Hub ("Antes de colar") | como a 19, com **Ver o passo a passo** em cada chave | — | — | — | — | como a 19 | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `HELP_SITE` (`packages/connectors/src/kernel/guide.ts`) | U2 | o teste comum; `tests/help/anchors.test.ts`; a definição de cada conector, para montar os seus `help.url` |
| `help.url` de cada campo (o tipo `GuideUrl`) | a definição do conector (U2) | o Hub no catálogo (sem mudança da 19); a janela Ligar (U2); `tests/help/anchors.test.ts` |
| `help.text` | a definição do conector, do texto do fundador (U2) | a janela Ligar |
| a pasta `guide/` de cada conector | o autor do conector (U2 para o Sankhya) | o carregador do site (U1, pelo padrão de arquivos); o teste comum |
| `site` em `apps/help/astro.config.ts` | U1 | o Starlight (canonical, sitemap); `tests/help/site.test.ts` confere que é igual a `HELP_SITE` depois da U2 |

O desenho de caixas, a 1280 e a 390 px. É o layout do próprio Starlight, com a marca do Hub; não há
captura do produto antigo, que não tinha central.

```
1280                                                         390
┌──────────────────────────────────────────────────────┐    ┌───────────────────────────┐
│ ◆ Ajuda do Conexus          [ Pesquisar…  ]     ☀/☾   │    │ ◆ Ajuda do Conexus  🔍  ☰ │
├─────────────┬──────────────────────────┬─────────────┤    ├───────────────────────────┤
│ Conectores  │ Ligar o Sankhya          │ Nesta página│    │ Nesta página ▾            │
│  Sankhya    │ O que você precisa …     │ O que você  │    │ Ligar o Sankhya           │
│  › Ligar    │ Client ID                │ Client ID   │    │ O que você precisa …      │
│             │  1. … [print]            │ Client Sec… │    │ Client ID                 │
│             │  Documentação oficial ↗  │ X-Token     │    │  1. … [print]             │
│             │ Client Secret …          │             │    │ Client Secret …           │
│             │ X-Token …                │             │    │ X-Token …                 │
└─────────────┴──────────────────────────┴─────────────┘    └───────────────────────────┘
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| A montagem do site no Release (`npm run build -w @conexus/help`, dentro de `infra/publish-edge.sh`) | o runner roda um job por vez (`publish.yml`, um runner `hub`) | a montagem que falha termina o script com erro antes de chamar o `wrangler` para o site; a borda dos apps já publicada fica, como hoje ("each Worker already published stays") | nenhuma: a montagem não chama a rede | a saída do `astro build` | 4 |
| A publicação do Worker `conexus-help` (`wrangler deploy --config ../help/wrangler.jsonc`) | um job por vez, como a borda | o `wrangler deploy` sobe os arquivos e só então a versão nova passa a responder; um corte no meio deixa a versão anterior no ar, e rodar de novo com o mesmo código não muda nada (como o resto do script) | a Cloudflare fora: o `timeout` de 300 s do script e o erro do `wrangler`; o Release falha, o Hub e a borda ficam novos, a central fica na versão anterior; republicar o Release resolve | `publishing: --config ../help/wrangler.jsonc`, a saída do `wrangler`, e `help site published` | 4, 5 |
| A volta atrás (`rollback.yml`, o script do `main` sobre o código de um Release anterior) | um job por vez | — | como acima | `this release has no apps/help; the help site stays as it is`, quando o Release é de antes da 19.2 | 4 |

Nenhuma gravação no banco nem rota nova no Hub.

## A tabela de referência

As referências estão na estante de estudo (`~/conexus-study/refs/`, `MANIFEST.md`): Nango
`e6c6131`, Airbyte `8aed3123`, Activepieces `f34c43cd`. O Starlight e o Astro foram lidos pelo
Context7 e pela prova do estudo (Astro 7.4.4, Starlight 0.42.7, `wrangler deploy --dry-run` 4.151.1,
2026-10-29); o `wrangler` instalado é o 4.151.1.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O site de ajuda | U1 | nenhum | `@astrojs/starlight@0.42.7`: `starlight({ title, locales: { root: { label, lang: 'pt-BR' } }, sidebar, customCss })`; Airbyte `docusaurus/docusaurus.config.ts`; Nango `docs/docs.json:2` (Mintlify) | um gerador de site estático de documentação, no próprio repositório | nativo: o Starlight como vem, com a interface em pt-BR embutida | — | `D2 A` (2026-10-29) | `apps/help/astro.config.ts` |
| As páginas: as do site e os guias dos conectores numa coleção | U1 | nenhum | Astro `glob()` de `astro/loaders` com `docsSchema()` do Starlight (a prova do estudo: um só `glob` com as duas pastas, porque `docsLoader()` junto de um `glob()` apaga as do primeiro) | a coleção `docs` lê Markdown de pastas | nativo: um `glob({ base: '../..', pattern: [...], generateId })` | — | não precisa | `apps/help/src/content.config.ts` |
| A busca | U1 | nenhum | Starlight: Pagefind embutido, estático | a busca monta com o site, sem serviço | nativo | — | não precisa | — |
| A barra lateral | U1 | nenhum | Starlight `sidebar: [{ label, items: [{ autogenerate: { directory } }] }]` (desde a 0.39, `{ label, autogenerate }` é recusado: a prova do estudo); Linear "Integration Directory" | um grupo por conector | nativo | — | não precisa | — |
| A marca no site | U1 | `apps/web/src/brand/tokens.css` (as fontes, o `@theme` claro e os blocos escuros `:root`, `:243-312`) | Starlight `customCss` com `--sl-color-accent`, `--sl-color-accent-high`, `--sl-color-accent-low`, `--sl-color-white`, `--sl-color-gray-1` a `-6`, `--sl-color-black`, `--sl-font`, `--sl-font-mono`, nos seletores `:root` e `:root[data-theme='light']` | o tema muda por propriedades CSS | nativo: a paleta (fontes e valores, claro e escuro) sai do `tokens.css` para `apps/web/src/brand/palette.css`, CSS puro, que o `tokens.css` e o site importam; o site só mapeia `--sl-*` para ela | — | não precisa | `apps/web/src/brand/palette.css`, `apps/help/src/brand.css` |
| O tema claro e escuro | U1 | o Hub: claro por padrão, escuro pelo sistema ([V9](../guides/design.md)) | Starlight: o seletor de tema com "auto", que segue o sistema, e `data-theme` no `<html>` | o tema segue o sistema e a pessoa pode escolher | nativo | — | não precisa | — |
| O endereço | U1, o fundador | nenhum | Cloudflare Workers, domínio próprio pelo painel ("Cloudflare will create DNS records and issue necessary certificates on your behalf", `/workers/configuration/routing/custom-domains/`); `wrangler@4.151.1` `triggersDeploy` (`wrangler-dist/cli.js:165084`) só publica domínios listados na configuração (`:165206`), então um `wrangler.jsonc` sem `routes` deixa o domínio do painel | um Worker com o domínio dele | nativo: o clique do fundador; nenhuma rota na configuração | — | `D1 A`; "aprovado então do subdominio" (2026-10-29) | `apps/help/wrangler.jsonc` |
| O Worker de arquivos estáticos | U1 | `apps/edge/wrangler.jsonc` (Workers com código) | Cloudflare Workers static assets: `assets.directory`, `not_found_handling: '404-page'`, sem `main`; "Requests to static assets are free and unlimited" (`/workers/static-assets/billing-and-limitations/`) | um Worker só de arquivos | nativo | — | US$ 0 (2026-10-29) | — |
| Os cabeçalhos | U1 | o Hub ([segurança S24](../guides/security.md)) | Cloudflare Workers static assets: o arquivo `_headers` na pasta publicada | cabeçalhos por padrão de caminho | nativo: `apps/help/public/_headers` | — | não precisa | `apps/help/public/_headers` |
| A publicação no Release | U1 | `infra/publish-edge.sh` (a borda, `--env-file`, decisão 0042) | o próprio script: `publish()` com `timeout` e `--env-file` | o mesmo token, o mesmo passo, um Release | nativo: mais um `wrangler deploy` no script | — | não precisa | — |
| A montagem no CI | U1 | `.github/workflows/ci.yml`, job `web`, `npm run build` (todos os espaços de trabalho) | npm workspaces: `build` de cada um | o `build` do espaço novo entra sozinho | nativo: o `build` do `apps/help`; `tests/help/` depois dele | — | não precisa | `tests/help/site.test.ts` |
| O guia de cada conector | U2 | nenhum | Nango `docs/api-integrations/zendesk/connect.mdx:1-36` (Overview, Prerequisites, "Step 1", prints); Airbyte `docs/integrations/sources/stripe.md` (Setup guide e links para a documentação da Stripe) | o guia é Markdown no repositório, ao lado do fornecedor | nativo: `packages/connectors/src/<id>/guide/<página>.md`, em português ([L23](../guides/delivery.md)) | — | `D3 A` (2026-10-29) | `packages/connectors/src/sankhya/guide/ligar.md` |
| O link de cada campo para o seu trecho | U2 | o kit da 19: `help: { text, url }` em cada campo (`packages/connectors/src/kernel/auth.ts`, PR #449) | Nango `packages/providers/providers.yaml:30433` (`docs_connect`) e `:30443` (`doc_section`); `packages/connect-ui/src/views/Go.tsx:705-716` (o ⓘ leva a `${docsConnectUrl}${doc_section}`) | cada campo aponta para o trecho do guia | nativo: o `help.url` da 19 passa a ser o endereço do trecho na central; os trechos são os `id` que o Astro dá aos títulos ("Client ID" vira `#client-id`, a prova do estudo) | — | não precisa | `packages/connectors/src/kernel/guide.ts` |
| O teste comum confere o guia | U2 | `runConformance` (PR #449, `kernel/conformance.ts:122-130`, "declares the account, what the catalog shows and where each key comes from") | Nango: `doc_section` é dado sem conferência; nenhuma confere | — | embrulhado: o teste comum exige a página e o endereço; o trecho é conferido no site montado (`tests/help/anchors.test.ts`), onde o Astro já deu os `id` | o critério 7 e 9 | não precisa | — |
| "Ver o passo a passo" na tela | U2 | a janela Ligar da 19 (U4): a linha e o link de cada campo | Nango `Go.tsx:577-583` ("Need help? View guide") e `:705-716` | um link por campo, que abre o guia | nativo: o texto do link em `text.ts`; o `href` é o `help.url` do catálogo | — | os textos, no fim | — |

**A medida do transplante.** Nada vem do código antigo: o produto antigo não tinha central.

**A dívida.** Nenhuma nova.

## U1 O site

**Base e modelo.** `main` de hoje (`65b3fb44` ou depois). Sonnet: configuração de bibliotecas
documentadas, sem desenho entre módulos.

### As linhas da tabela

O site de ajuda, As páginas, A busca, A barra lateral, A marca no site, O tema claro e escuro, O
endereço, O Worker de arquivos estáticos, Os cabeçalhos, A publicação no Release, A montagem no CI.

- **Ler na base:** `apps/web/src/brand/tokens.css` inteiro (333 linhas: as fontes `:14-42`, o
  `@theme` claro, os blocos escuros `:243-312`); `infra/publish-edge.sh` inteiro;
  `scripts/publish-edge.test.ts` (o `wrangler` de mentira e `publish()`); `.github/workflows/ci.yml`
  job `web` (`:143-154`); `.github/workflows/publish.yml` job `edge` (`:181-197`);
  `.github/workflows/rollback.yml` job `edge` (`:52-86`); `infra/hub.Dockerfile` (`:6-13`,
  `:42-50`); `apps/edge/package.json` (o modelo de um espaço de trabalho com `wrangler`).
- **A prova do estudo** (fora do repositório, refeita aqui): `glob()` com as duas pastas e o
  `generateId` abaixo; "Found 3 HTML files"; `lang="pt-BR"`; `id="client-id"` e `id="x-token"` dos
  títulos; `wrangler deploy --dry-run` com `assets.directory: ./dist` leu os arquivos e parou.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/help/` | Cria: `package.json`, `astro.config.ts`, `src/content.config.ts`, `src/brand.css`, `src/content/docs/index.md`, `src/content/docs/404.md`, `public/_headers`, `wrangler.jsonc`, `tsconfig.json` | o CI (`npm run build`), `infra/publish-edge.sh` |
| `apps/web/src/brand/` | Cria `palette.css`; muda `tokens.css` (a paleta sai, um `@import "./palette.css"` entra) | o Hub (`main.tsx` importa `tokens.css`); `apps/help/src/brand.css` |
| `infra/publish-edge.sh` | Muda: o passo do site no fim | `publish.yml` e `rollback.yml`, job `edge` |
| `scripts/publish-edge.test.ts` | Muda: três casos | o job `scripts` |
| `infra/hub.Dockerfile` | Muda: `COPY apps/help/package.json apps/help/` nos dois estágios, antes de cada `npm ci` | o job `image` |
| `tests/help/` | Cria `site.test.ts` e `tsconfig.json` | o job `web` |
| `.github/workflows/ci.yml` | Muda: o job `web` roda `tests/help/` depois do `npm run build` | o `ci` |
| `package.json` (raiz), `package-lock.json` | Muda: `test:help` e o `tsc -p tests/help/tsconfig.json` no `typecheck`; o espaço novo pelo `npm install` | o CI |
| `knip.json` | Muda, se o `knip` pedir: a entrada de `apps/help` | `npm run knip` |
| `docs/reference/stack.md` | Muda: as linhas `astro` e `@astrojs/starlight`; `apps/help` em "Used in" do `wrangler` | `npm run docs` |
| `docs/architecture.md` | Muda: a linha Cloudflare de §7, com o mesmo número de palavras (o arquivo está no teto de 2.500) | `npm run docs` |

### Os contratos que a unidade cria

Nenhum tipo exportado, nenhuma rota. As formas:

```ts
// apps/help/astro.config.ts
export default defineConfig({
  site: 'https://ajuda.conexus.fun', // igual a HELP_SITE do kit; tests/help/anchors.test.ts (U2) confere
  integrations: [starlight({
    title: 'Ajuda do Conexus',
    locales: { root: { label: 'Português', lang: 'pt-BR' } },
    customCss: ['./src/brand.css'],
    sidebar: [{ label: 'Conectores', items: [{ autogenerate: { directory: 'conectores' } }] }],
  })],
})

// apps/help/src/content.config.ts: as páginas do site e o guia de cada conector, numa coleção
export const collections = {
  docs: defineCollection({
    loader: glob({
      base: '../..',
      pattern: ['apps/help/src/content/docs/**/*.md', 'packages/connectors/src/*/guide/**/*.md'],
      generateId: ({ entry }) => entry.startsWith('packages/')
        ? entry.replace(/^packages\/connectors\/src\/([^/]+)\/guide\/(.+)\.md$/, 'conectores/$1/$2')
        : entry.replace(/^apps\/help\/src\/content\/docs\//, '').replace(/\.md$/, ''),
    }),
    schema: docsSchema(),
  }),
}
```

```jsonc
// apps/help/wrangler.jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "conexus-help",
  "compatibility_date": "<a data do build>",
  "workers_dev": false,
  // Sem routes: o domínio ajuda.conexus.fun é ligado uma vez no painel (Workers & Pages ›
  // conexus-help › Domains & Routes › Custom domain), e o wrangler deploy deixa o que não lista.
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

- **O dono de cada fato:** a paleta e as fontes, `apps/web/src/brand/palette.css` (V3); o padrão
  de pastas dos guias, `src/content.config.ts` (a U2 escreve a pasta do Sankhya nele); o endereço
  `https://ajuda.conexus.fun`, `HELP_SITE` no kit a partir da U2 (aqui, o `site` do Astro, que a U2
  confere contra ele).
- **Nenhuma entrada de fora:** o site é estático; não há esquema Zod.
- **O modelo:** `apps/edge/package.json` para o espaço de trabalho; `publish()` de
  `infra/publish-edge.sh` para o passo novo.

### As skills e a leitura

`docs/reference/stack.md`: a linha `wrangler` (`cloudflare:wrangler`,
`cloudflare:workers-best-practices`, `developers.cloudflare.com/workers/llms.txt`, a página de
static assets); `tailwindcss` (para a separação da paleta). Para o Astro e o Starlight, as linhas
novas que esta unidade escreve: `starlight.astro.build` pelo Context7 (`/withastro/starlight`),
"Configuration Reference", "Customizing Starlight", "CSS & Styling", "Internationalization";
`docs.astro.build` "Content collections" (`glob`). Design V3, V9, V13, V18.

### A ordem do trabalho

1. **Subtrair antes:** em `apps/web/src/brand/`, mover para `palette.css` as três `@font-face`
   (`tokens.css:14-42`, com os `url("./fonts/…")` como estão, porque `palette.css` fica na mesma
   pasta) e os valores da paleta, claro e escuro, como propriedades CSS puras (`:root { --brand-…
   }`, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`,
   `:root[data-theme="dark"] { … }`, os mesmos seletores de hoje). `tokens.css` passa a importar
   `./palette.css` e o `@theme` passa a ler dela (`--color-accent: var(--brand-accent)` e assim
   por diante); os blocos escuros saem do `tokens.css`. Nenhum valor muda. Regras: V3, C26.
   Funções: `tailwindcss@4.3.3`, `@theme` com `var()` (a página "Theme variables" do Tailwind,
   "Referencing other variables": use `@theme inline` se a utilidade tiver de levar o valor
   resolvido).
2. **O espaço** `apps/help/package.json` (`@conexus/help`, `private`, `type: module`, `license:
   UNLICENSED`): `scripts.build: "astro build"`, `scripts.typecheck: "astro sync && tsc -p
   tsconfig.json"`; `dependencies` `astro` e `@astrojs/starlight` exatas, as versões da prova
   (`astro@7.4.4`, `@astrojs/starlight@0.42.7`) ou as últimas da mesma linha no dia; `devDependencies`
   `wrangler: 4.151.1`. `npm install` na raiz.
3. **A configuração** como nos contratos acima. `tsconfig.json` estende `astro/tsconfigs/strict`.
4. **A marca:** `apps/help/src/brand.css` importa `../../web/src/brand/palette.css` e só mapeia,
   sem valor cru: `--sl-font`, `--sl-font-mono`, e as cores `--sl-color-*` nos dois seletores que o
   Starlight usa (`:root` para o escuro, `:root[data-theme='light']` para o claro). O tema do
   Starlight põe `data-theme` sempre no `<html>`; os seletores da paleta já respondem a ele.
5. **As páginas**, em português, com `title` e `description` no frontmatter:
   `src/content/docs/index.md` (o início: uma linha do que a central é e "Conectores", com o link
   para cada guia que existir) e `src/content/docs/404.md` (`title: Página não encontrada`, a frase,
   o link para o início; o Starlight usa a página `404` da coleção quando ela existe). O texto é
   aprovado pelo fundador no fim.
6. **Os cabeçalhos:** `apps/help/public/_headers` com `/*`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors
   'none'`. Nenhum `script-src`: o Starlight põe um script em linha para o tema (fica para quando a
   central tiver algo além de leitura).
7. **O Worker:** `apps/help/wrangler.jsonc` como nos contratos.
8. **A publicação:** no fim de `infra/publish-edge.sh`, depois de `echo "edge published"`: se não
   houver `apps/help` (de volta na raiz do checkout, `cd ..`), imprimir `this release has no
   apps/help; the help site stays as it is` e sair com 0; senão `npm run build -w @conexus/help`
   (com `timeout`, como `publish()`), `publish --config ../help/wrangler.jsonc` e `echo "help site
   published"`. O passo da borda (`apps/edge`) fica antes e como está. Os três casos em
   `scripts/publish-edge.test.ts`, com o `npm` de mentira no `PATH` do teste, como o `id`.
9. **O Dockerfile:** `COPY apps/help/package.json apps/help/` ao lado de `COPY apps/edge/package.json`
   nos dois estágios (sem ele o `npm ci` do lockfile novo falha). O estágio final não instala o site
   (`-w @conexus/server`).
10. **O CI:** no job `web`, depois de `npm run build`, `npm run test:help`
    (`node --test --test-reporter=./scripts/test-reporter.ts tests/help/*.test.ts`, na raiz).
11. **`tests/help/site.test.ts`**, lendo `apps/help/dist` e `apps/help/wrangler.jsonc` (critérios 1,
    2 e 5). Para o 2: ler `palette.css`, achar o valor de `--brand-accent` claro, e conferir que a
    folha montada em `dist/_astro/*.css` liga `--sl-color-accent` a ele (pela `var()` ou pelo valor);
    e que nenhum arquivo de `apps/help/src/` tem uma cor crua (`#rgb`, `#rrggbb`, `rgb(`, `oklch(`).
12. **Os documentos:** `docs/reference/stack.md`, as linhas `astro` e `@astrojs/starlight` (Used in
    `apps/help`; Read first `starlight.astro.build` pelo Context7 e `docs.astro.build`; Skill none;
    Trap: a barra lateral `{ label, items: [{ autogenerate }] }` desde a 0.39, e um só `glob` para as
    duas pastas); `apps/help` no "Used in" do `wrangler`. `docs/architecture.md` §7, a linha
    Cloudflare, de "Tunnel, dispatcher, outbound wall, and a Workers for Platforms namespace for the
    apps, on a second domain, one host per app" para "Tunnel, dispatcher, outbound wall, help site,
    and a Workers for Platforms namespace for apps on a second domain, one host each" (21 palavras
    as duas). Nenhum how-to novo: o clique do domínio fica no comentário do `wrangler.jsonc` e nesta
    página do fundador; `docs/index.md` está a 4 palavras do teto.

### Como se prova

- A porta pública de um site estático são os arquivos que o Worker serve como estão: `dist/`,
  com o `_headers` e a 404 que o Worker aplica pelo `wrangler.jsonc` ([testing T5](../guides/testing.md)).
- Critérios 1, 2, 5: `npm run build -w @conexus/help && npm run test:help`. Falha hoje: não há
  `apps/help`. Para ver a recusa do 1, tirar `site` e ver o canonical sumir; do 2, escrever
  `--sl-color-accent: #b07a0c` em `brand.css` e ver o teste recusar.
- Critério 3: `npm run test:unit -w @conexus/web` e, se houver Chromium, `npm run test:browser -w
  @conexus/web`; abrir o Hub local antes e depois e comparar uma tela nos dois temas.
- Critério 4: `node --test scripts/publish-edge.test.ts`. Falha hoje: o script não conhece o site.
- Critério 6: o pull request.
- Nada chama a Cloudflare: o `wrangler deploy --dry-run --config apps/help/wrangler.jsonc` local
  basta para ver o Worker ler `dist/` (sem token, sem rede).

### Parar se

- O Starlight instalado não aceita o `glob` com `base: '../..'` (a prova usou 0.42.7 e Astro 7.4.4):
  parar e relatar com a mensagem; não copiar os guias para dentro de `apps/help`.
- Separar a paleta muda uma cor ou uma fonte do Hub (um teste de tela que falha, ou a comparação
  do passo de prova): parar; não ajustar o valor para o teste passar.
- O Tailwind recusa `@theme` lendo `var(--brand-…)` da paleta: parar e relatar com a mensagem.
- O `wrangler deploy --dry-run` do site pede uma permissão de zona, ou o `wrangler` instalado lista
  um domínio sem `routes`: parar.
- O `knip` ou o `biome` recusam os arquivos do Astro de um jeito que só uma supressão resolve:
  parar e relatar; nada de supressão nova sem o cartão.

## U2 O guia do Sankhya e os links das chaves

**Base e modelo.** `main` com a 19 fechada (o kit e a tela) e a U1; antes disso, como "A entrega"
diz. Sonnet: texto, uma conferência e um link.

### As linhas da tabela

O guia de cada conector, O link de cada campo para o seu trecho, O teste comum confere o guia, "Ver
o passo a passo" na tela.

- **Ler na base:** `packages/connectors/src/kernel/auth.ts` (o tipo de `help`, `:5-12` no PR #449);
  `kernel/conformance.ts` `runConformance` (`:95-130`, o caso "declares the account, what the
  catalog shows and where each key comes from"); `sankhya/definition.ts` (`KEYS_GUIDE`,
  `INTEGRATION_KEYS` e o `help` do X-Token, `:13-55`; `readSkill()` `:20-31`, o modelo de ler uma
  pasta do conector); `kernel/kernel.test.ts` (como ele planta um conector de mentira); a janela
  Ligar da U4 da 19 (`apps/web/src/hub/connectors/link-dialog.tsx` e `text.ts`) e o seu teste.
- **Referências:** Nango `providers.yaml:30433`, `:30443`; `Go.tsx:577-583`, `:705-716`;
  `docs/api-integrations/zendesk/connect.mdx:1-36` (a forma da página).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `guide.ts`; muda `auth.ts` (o tipo do `url`), `conformance.ts` e `kernel.test.ts`; `index.ts` exporta `HELP_SITE` | cada definição de conector; `apps/server/src/hub/connectors/` (sem mudança: o `url` continua `https://…`) |
| `packages/connectors/src/sankhya/` | Cria `guide/ligar.md` e `guide/prints/*.png` (ou `.webp`); muda `definition.ts` (apaga `KEYS_GUIDE` e os links do `developer.sankhya.com.br`, que vão para o guia) | o site (U1, pelo padrão de arquivos) |
| `apps/web/src/hub/connectors/` | Muda `text.ts` ("Ver o passo a passo"), a janela Ligar e o seu teste | a tela |
| `tests/help/` | Cria `anchors.test.ts` | o job `web` |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/guide.ts
/** The public help center; each field's help points into its connector's guide there. */
export const HELP_SITE = 'https://ajuda.conexus.fun'
/** A section of a connector's guide page: HELP_SITE/conectores/<connector id>/<page>/#<section>. */
export type GuideUrl = `${typeof HELP_SITE}/conectores/${string}/${string}/#${string}`
/** The pages of `src/<id>/guide/`, by file name without `.md`, read like the skill. */
export function readGuide(folder: URL): Readonly<Record<string, string>>

// packages/connectors/src/kernel/auth.ts (muda só o tipo do url)
help: Readonly<{ text: string; url: GuideUrl }>

// packages/connectors/src/kernel/definition.ts (Connector ganha)
guide: Readonly<Record<string, string>> // the pages of the guide folder; the conformance and nothing else at runtime
```

- **O que se apaga:** em `sankhya/definition.ts`, `KEYS_GUIDE` e as duas URLs de
  `developer.sankhya.com.br`; elas entram no guia, no trecho de cada chave.
- **O dono de cada fato:** o endereço da central, `HELP_SITE`; o caminho de cada trecho, o título
  do guia (o `id` é o que o Astro dá a ele); o texto curto de cada chave, `help.text` da definição.
- **Nenhuma entrada de fora:** o guia é arquivo do repositório.
- **O modelo:** `readSkill()` de `sankhya/definition.ts` para `readGuide`; ele cumpre C26 (uma
  leitura, um dono). Não há estado nem id novos (C21 e C23 não se aplicam).
- **Por que `url` e não `section`:** comparadas as duas formas, um `help: { text, section }` com o
  Hub montando o endereço mudaria `hub-api`, o catálogo e a tela; o `url` inteiro, como o Nango
  monta `docs_connect` + `doc_section`, não muda nada fora do kit e da linha da tela.

### As skills e a leitura

`docs/reference/stack.md`: `zod`, `typescript` (`typescript-magician`, para o tipo de modelo
literal). Testes T5; nenhuma linha de remoção ([T12](../guides/testing.md): o registro guarda só
proteções de segurança). Segurança S40 para os prints. Entrega L23 para o texto.

### A ordem do trabalho

1. **O guia** `packages/connectors/src/sankhya/guide/ligar.md`, do texto e dos prints do fundador:
   frontmatter `title: Ligar o Sankhya`, `description`, `sidebar.label: Ligar`; `## O que você
   precisa`; `## Client ID`, `## Client Secret`, `## X-Token`, cada um com os passos numerados, os
   prints (`![<o que o print mostra>](./prints/<nome>.png)`, imagem relativa, que o Astro otimiza) e
   o link da documentação oficial do Sankhya (os dois de hoje: o guia do Componente de Integração e
   "Gerando tokens de integração no SankhyaOm"); `## Depois de colar` (Ligar e testar, da 19).
   Antes do commit, abrir cada print e conferir que não há nome de empresa, CNPJ, pessoa ou valor
   (S40). Regras: L23, S40.
2. **O kit:** `guide.ts` como acima; `readGuide` com `readdirSync` de `.md`, ordenado, como
   `readSkill`; o `Connector` ganha `guide`, e `defineConnector` o exige.
3. **O teste comum**, no caso "declares the account, what the catalog shows and where each key comes
   from": `connector.guide` não vazio; para cada campo, `help.url` começa por
   `${HELP_SITE}/conectores/${connector.id}/`, o segmento seguinte é uma página de `guide`, e há um
   `#` com um trecho; cada página tem um link `https://` que não começa por `HELP_SITE`. Em
   `kernel.test.ts`, um conector de mentira para cada recusa (critério 7).
4. **O Sankhya:** `guide: readGuide(new URL('./guide/', import.meta.url))`; os três `help` com
   `url: \`${HELP_SITE}/conectores/sankhya/ligar/#client-id\``, `#client-secret`, `#x-token`, e o
   `text` de cada um em uma linha, do texto do fundador.
5. **A tela:** em `text.ts`, `VER_O_PASSO_A_PASSO = 'Ver o passo a passo'` (ou o nome que o arquivo
   usa para os outros textos); na janela Ligar, o link de cada campo com esse texto, `href` do
   `help.url`, `target="_blank"`, `rel="noreferrer"`, como a 19 já abre o link em outra aba. O caso
   no teste da janela (critério 11).
6. **`tests/help/anchors.test.ts`**, que pode importar o kit (`tests/` está na exceção da parede da
   19, `.dependency-cruiser.cjs` `connectors-kit-only-in-the-executor`): para cada conector que o
   kit exporta e cada `help.url`, ler `apps/help/dist/conectores/<id>/<página>/index.html` e achar
   `id="<trecho>"`; conferir que o `<link rel="canonical">` da página começa por `HELP_SITE` (o
   `site` da U1 igual ao do kit); e a página do Sankhya (critério 10): os títulos, o `alt` de cada
   `<img>`, o link para `developer.sankhya.com.br`, e "X-Token" no índice do Pagefind
   (`dist/pagefind/`, pela API `pagefind` de Node se o arquivo do índice não for legível como texto).

### Como se prova

- Critérios 7 e 8: `npm test -w @conexus/connectors`. Falha hoje: o teste comum aceita qualquer
  `https://`.
- Critérios 9 e 10: `npm run build -w @conexus/help && npm run test:help`. Para ver a recusa do 9,
  trocar o título "X-Token" do guia e ver o teste falhar sem tocar no kit.
- Critério 11: `npm run test:unit -w @conexus/web` com o arquivo do teste da janela.

### Parar se

- Os passos e os prints do fundador não chegaram: não escrever o guia de páginas públicas (a
  resposta dele foi `D3 A`); relatar `needs-decision` e esperar.
- Um print mostra dado de empresa e não dá para cobrir sem mudar o que ele ensina: parar e pedir
  outro ao fundador.
- O `id` que o Astro dá a um título não é o que o `help.url` espera (um acento, um sinal): mudar o
  `help.url` para o `id` que o site dá, nunca acrescentar uma função nossa que imita o Astro.
- A janela Ligar da 19 não tem o link de cada campo no `main` (a U4 da 19 mudou de forma): parar e
  relatar o que existe.
