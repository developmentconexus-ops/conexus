# A rede e o navegador sob pedido

Trilho: harness

Etapa 3 do harness, na ordem que o fundador fixou em 2026-11-25 ("Confirmo"): a etapa 2 ("Uma sala
e os nomes certos"), esta, o `A2` (que precisa dela para ler o site da empresa) e o `A3`. O pedido
dele, em 2026-11-25: "a e2b a gente via ter que poder liberar navegador e itnernet para automações,
scraping e etc. Igual claude code pede acesso" e "Imagina que quero criar uma automação com agente
ou sem agente que vai abre o navegador seja chromium loga na conta, clica no instagram vai no
concorretne pega as fotos ai o agente analisa as fotos e preenche por exemplo. Entende meu ponto, se
não liberar na e2b não daria certo." As respostas dele ao estudo, no mesmo dia: **A-a**, **B-a**,
**C aceitar**, **D-a** e **E sem limite por site**. Elas vão para o arquivo de aprovação deste cartão
quando ele aprovar.

As respostas dele a este cartão, pelo quadro, em 2026-11-25: **A a**, **B a** e **cartão aprovado**.
Nas decisões C e D ele pediu estudo antes de responder: C, "Estudar documentação e referencias"; D,
"Estudar e ter certeza todas recomendação e decisões trazer referencias, motivos e explicaçoes". A
segunda rodada, de 2026-11-26, refez C e D com o código da E2B, do Claude Code e do Codex (linhas 9,
15 e 16 da tabela) e mudou as duas recomendações. As respostas dele à segunda rodada, pelo quadro,
em 2026-11-26: **C a** e **D a**.

Lido em `main` `c74235a7` (2026-11-25, v0.24.131); conferido de novo em `57b81538` (2026-11-26),
onde só a infra do CDK mudou (#1414); e em `91f70650`, depois do fechamento da etapa 2, onde duas
citações mudaram de linha e foram corrigidas. O estudo foi feito sobre `49e6f8aa`; entre os dois,
`harness/machine/` mudou (`conversation.ts`, `machines.ts`, `spec.ts`, `workspace.ts`, `part.ts`,
`marks.ts`, a U9 da etapa 2), e cada `arquivo:linha` abaixo foi relido em `c74235a7`. Versões lidas:
`@mastra/core` 1.83.0, `@mastra/e2b` 0.17.0, `e2b` 2.63.0, `agent-browser` 0.43.0, `better-auth`
1.7.8. Prateleiras: `mastra-1.83` em `d60ba71b` (Mastra Code e Factory em `mastracode/`),
`claude-code` em `afb24c5e`, `codex` em `8b5223dd`. Abreviações: `H/` = `apps/server/src/harness/`,
`Ag/` = `apps/server/src/agents/`, `Hub/` = `apps/server/src/hub/`, `Wr/` =
`apps/web/src/harness/room/`, `API/` = `packages/hub-api/src/`, `MC/` = `mastracode/` na prateleira,
`NM/` = `node_modules/@mastra/core/dist/`.

O estudo reusado fica fora do repositório (delivery L21): "internet e navegador na máquina de cada
conversa, com pedido de acesso", sobre `49e6f8aa`, e o achado F1 do trabalhador do `A2` G1.

## A página do fundador

**Linhas sem referência, para você ver antes de tudo.** Uma peça sai do que as referências fazem e
por isso é decisão sua (delivery L28): quanto dura "Liberar nesta conversa". No Claude Code o "Sim"
vale até o fim da sessão, que é o processo aberto no computador. Uma conversa do Conexus dura dias, e
o Hub é atualizado várias vezes por dia. Nenhuma referência guarda uma liberação por conversa de um
dia para o outro. A decisão A abaixo, que você respondeu (a) em 2026-11-25.

**No fim desta etapa** você pede ao Conexus, numa conversa, que abra um site de verdade num navegador
e traga o que viu, com captura. Quando o agente precisa de um domínio que a empresa não liberou, a
conversa mostra um cartão com o domínio e o motivo, como o Claude Code pergunta. Você libera só
naquela conversa, para a empresa inteira, ou recusa. A lista da empresa fica em Configurações,
Internet, onde você vê quem liberou o quê e tira um domínio. Um agente salvo com Computador faz o
mesmo. Uma automação usa só a lista da empresa, porque ninguém está olhando para responder.

Uma diferença do Claude Code que você vai ver: lá o cartão aparece no instante em que o comando tenta
o site, porque o Claude Code segura a conexão e pergunta. A E2B só recusa a conexão, sem avisar
ninguém. Aqui o agente tenta, vê que falhou e pede o domínio com o motivo, como o Codex pede para
rodar um comando fora da caixa. O cartão é o mesmo; ele só vem um passo depois.

**O roteiro de uso.** Na nuvem, numa empresa de teste, como dono.

1. Abra **Configurações, Internet**. A lista está vazia: "Nenhum domínio liberado. Os agentes
   alcançam só os registros de pacote (npm e PyPI)."
2. Em **Conversas**, peça: "Abra a página inicial de `<um site público que você escolher>` num
   navegador, me diga os três primeiros produtos com o preço e me mostre uma captura." Antes do
   navegador, peça também: "Tente baixar a página com curl." O agente diz que o endereço não respondeu.
   Logo depois a conversa mostra o cartão "O Conexus quer acessar a internet", com o domínio e o
   motivo, e três botões: **Liberar nesta conversa**, **Liberar para a empresa** e **Recusar**.
   Toque em **Liberar nesta conversa**.
3. O agente abre a página, tira a captura e a mostra ao lado da conversa. Se a página trouxe imagens
   ou fontes de outro domínio que não abriram, ele pede esses domínios num segundo cartão, todos
   juntos. Toque em **Liberar para a empresa**.
4. Volte a **Configurações, Internet**. Os domínios do segundo cartão estão lá, com o motivo, o seu
   nome e a data. O domínio do primeiro cartão não está, porque valeu só para aquela conversa.
   Tire um deles com **Remover**.
5. Abra uma conversa nova e peça a mesma página. O cartão volta para o domínio do site, e não volta
   para os que ficaram na lista da empresa.
6. Entre como membro (sem papel de dono ou administrador) e peça um site novo. O agente diz que só o
   dono ou um administrador libera um domínio, sem botões. Crie uma automação que lê um site fora da
   lista: a execução termina dizendo qual domínio falta e que ele se libera em Configurações, Internet.

**O que você faz, e quando.** Antes: nada; a E2B é a conta grátis de hoje, e nenhum fornecedor
entra. No começo: aprova esta página e dá a palavra das permissões (decisão B). No fim: faz o
roteiro na nuvem, que é também a prova ao vivo de que a E2B fecha o domínio fora da lista (o passo
2, o curl), diz o que viu e aprova os textos do cartão e da tela.

**A visão.** "Agents põe a inteligência artificial para trabalhar sobre o contexto da empresa:
perguntar, analisar, automatizar e escrever": esta etapa leva o agente ao que fica fora dos sistemas
da empresa, o site dela e o de um concorrente. "Nada age sem dizer antes" e "Uma ação fora do papel
fica à vista, desligada, e diz quem pode": o cartão diz o domínio e o motivo antes de abrir, a lista
diz quem liberou, e o membro vê o pedido sem os botões. "O código gerado não guarda segredo e não
alcança a rede": a máquina do Construtor de apps não muda, só a das conversas.

**O que você já decidiu, e como entra.**

- **A-a**, até onde a rede abre: só domínios da lista, cada um pedido e liberado. Entra como a lista da
  empresa somada à lista da conversa, aplicadas pela troca de rede nativa da E2B (`updateNetwork`).
- **B-a**, quanto vale uma liberação: "Liberar nesta conversa" e "Liberar para a empresa", as duas no
  cartão. Só o dono ou um administrador libera (a sua resposta B do cartão do `A3`: "lista da empresa
  mantida por dono ou administrador em Configurações").
- **C aceitar**, o risco de levar dado para fora: um agente que leu dado da empresa e abre uma página
  estranha pode ser enganado pelo texto dela e mandar o dado a um domínio liberado. Nenhuma trava por
  código impede isso; a trava é a lista curta e o motivo escrito em cada liberação.
- **D-a**, login em conta de terceiros: fica para um cartão próprio, depois deste.
- **E sem limite por site**: o Conexus não proíbe nenhum site. O Instagram, por exemplo, se libera
  como qualquer outro. Os Termos do Instagram proíbem a coleta automatizada "logado ou não"; o risco
  para a conta é da empresa que libera.

**Fica de fora, e por quê.**

- **O login numa conta** (a sua D-a): a tela ao vivo da máquina, a senha digitada pela pessoa e a
  sessão guardada pedem um cartão próprio, porque guardar uma sessão logada na máquina contraria a
  regra de segurança S36 hoje.
- **A automação sem agente**, um fluxo que roda passos sem conversa: não existe no `main` (a 24.6 está
  congelada). Quando vier, ela abre a máquina pela mesma porta e herda a lista da empresa sem nada
  novo.
- **O Construtor de apps e o Construtor de agentes**: a máquina deles segue só com o npm (decisão
  0051). O Construtor de apps abre o endereço do próprio app só na conferência, como hoje.
- **O conector oficial do Instagram** (Business Discovery da Meta): é um conector, e entra pelo cartão
  dos conectores quando você o pedir.
- **Um navegador hospedado fora da E2B** (Browserbase, Steel): fornecedor novo, e o dado da empresa
  sairia para ele.

**As decisões suas nesta etapa.**

- **A. Quanto dura "Liberar nesta conversa"?** Você respondeu **(a)** em 2026-11-25. Exemplo: você libera `loja.exemplo.com.br` numa
  conversa de segunda; o Hub é atualizado à noite; na terça, na mesma conversa, o agente abre a loja
  de novo.
  - **(a)** Vale enquanto a conversa existir, mesmo depois de o Hub atualizar. Na terça, abre sem
    perguntar. A liberação some quando a conversa é apagada. **Recomendo**: a conversa do Conexus é o
    que a sessão é no Claude Code, e ela atravessa atualizações. Veredito: embrulhado; o nativo é a
    `updateNetwork` da E2B, e o nosso é uma linha por domínio liberado na conversa, apagada com ela.
  - **(b)** Vale até o Hub reiniciar, como o "Sim" do Claude Code vale até a sessão fechar. Na terça,
    o cartão volta. Nada novo é guardado.
- **B. As permissões no banco (data D11).** Você respondeu **(a)** em 2026-11-25. Duas tabelas novas, a lista da empresa e a da conversa. O
  login da empresa no banco lê, grava e apaga linhas delas, sem alterar uma linha (para mudar o motivo,
  tira-se e libera-se de novo). Nenhuma permissão para o papel dos apps. **(a)** Aprovar, num pull
  request só da migração e da permissão. **Recomendo.** (b) Não aprovar, e a etapa para.
- **C. Domínio com estrela** (segunda rodada; a primeira recomendação mudou). Você respondeu **(a)** em 2026-11-26. As imagens de muitos
  sites vêm de vários endereços de um mesmo domínio: as fotos do Instagram, por exemplo, vêm de
  `scontent-gru2-1.cdninstagram.com`, `scontent-gru1-1.cdninstagram.com` e outros, que mudam com a
  região. Uma estrela, `*.cdninstagram.com`, cobre todos.

  O que o estudo achou, com a prova:
  - **A E2B não confere nada.** O código que decide casa `*.x` com qualquer endereço que termina em
    `.x`, em qualquer profundidade, sem o próprio `x`, e casa `*` sozinho com a internet inteira
    (`e2b-dev/infra@86cb5033` `packages/orchestrator/pkg/tcpfirewall/handlers.go:228-245`); a API
    só confere os endereços IP da lista, nunca os nomes (`packages/api/internal/handlers/sandbox_create.go:923`).
    Então o que entra na lista é só o que o Hub deixar entrar.
  - **O Claude Code** recusa `*.com` e `*` e exige dois nomes depois da estrela: "Overly broad
    patterns like "*.com" or "*" are not allowed for security reasons"
    (`anthropic-experimental/sandbox-runtime@0bbebed0` `src/sandbox/domain-pattern.ts:99-125`). É a
    regra que a primeira rodada copiou.
  - **O Codex** recusa só `*` sozinho e aceita estrela em qualquer lugar (`codex-rs/network-proxy/README.md:57-60`,
    `:259-262`, no commit `8b5223dd`).
  - **Nos dois, o pedido feito durante o trabalho libera só o nome pedido, nunca uma estrela.** No
    Codex, "no futuro" grava só o nome aprovado, e outro nome dá erro (`codex-rs/core/src/session/mod.rs:3250-3258`).
    No Claude Code a estrela vem das configurações que a pessoa escreve; a documentação não diz que
    o pedido ofereça uma (inferido, sem o código do programa, que não é aberto).
  - **A regra dos dois nomes deixa passar estrelas perigosas.** Medi com a lista pública de
    sufixos (Public Suffix List, pelo pacote `tldts@7.4.18`, que já está no `package-lock.json` do
    Conexus): `*.com.br`, `*.co.uk`, `*.github.io`, `*.vercel.app`, `*.cloudfront.net` e
    `*.herokuapp.com` passam pela regra dos dois nomes, e cada uma cobre endereços que qualquer
    pessoa cria. `*.com.br` abriria todo site comercial brasileiro, e `*.github.io` abriria uma página
    que o autor de um ataque publica de graça para receber dado. A lista pública recusa as seis.
  - **O Claude Code avisa do resto:** "Users should be aware of potential risks that come from
    allowing broad domains like `github.com` that may allow for data exfiltration"
    (`sandbox-runtime@0bbebed0` `README.md:1326`). A lista pública não pega um
    domínio de fornecedor que hospeda conteúdo de terceiros mais abaixo (`*.amazonaws.com` passa; só
    `*.s3.amazonaws.com` é sufixo). Para esses, a trava é a pessoa que lê o cartão.

  As opções:
  - **(a)** O agente pode pedir uma estrela no cartão, e o dono ou o administrador também na tela,
    se o que vem depois dela não for um sufixo público pela lista pública (`*.cdninstagram.com` sim;
    `*.com.br`, `*.github.io` e `*` não). O cartão diz em palavras "qualquer endereço que termina em
    `.cdninstagram.com`, menos o próprio `cdninstagram.com`". **Recomendo**: é mais estrito que o
    Claude Code e o Codex, e cobre o caso das fotos do concorrente com um cartão só. Veredito:
    embrulhado. O casamento é nativo da E2B; o nosso é a conferência pela lista pública, com uma
    dependência nova no servidor (`tldts`, lista pública de sufixos, delivery L16).
  - **(b)** Como o Codex e o Claude Code: o cartão pede só o nome exato, e a estrela só entra por
    Configurações, Internet, escrita pelo dono ou administrador, com a mesma conferência de (a). Cada
    endereço novo de foto vira um cartão até alguém pôr a estrela na tela.
  - **(c)** Só nome exato em todo lugar. É a única opção que deixa a decisão D (c) possível.
- **D. As issues 1333 e 1335** (segunda rodada; a primeira recomendação mudou). Você respondeu **(a)** em 2026-11-26. As duas nasceram
  na máquina do Construtor de apps, que não guarda dado da empresa, e o gatilho das duas é "a próxima
  unidade que trocar a lista de domínios", que esta etapa é. A máquina das conversas guarda dado da
  empresa: "The data the Assistant reads still reaches only the machine" (decisão 0059). E esta etapa
  traz para ela texto de sites que ninguém controla, que pode tentar enganar o agente.

  O que o estudo achou, com a prova:
  - **1335, o nome pedido.** A issue diz que um código na máquina chega a qualquer servidor cujo
    endereço conheça, desde que use um nome liberado. O código da E2B diz que não: quando o nome
    casa, o proxy da E2B disca ele mesmo o nome, com o resolvedor dele, e recusa endereço interno
    ("dial the hostname directly (not the sandbox's resolved IP). This prevents DNS spoofing attacks",
    `handlers.go:79-87`, e a recusa em `:136-154`). Sobra uma coisa: na porta 443 a E2B lê só o SNI,
    sem abrir o TLS, e então outro site atrás do mesmo servidor do nome liberado pode responder. A
    E2B documenta isso ("allowing one hostname can also permit access to other destinations on the
    same endpoint", https://docs.e2b.dev/sandbox/internet-access). O Claude Code tem o mesmo limite e
    o escreve ("in some cases it may be possible to bypass the network filtering through domain
    fronting", `sandbox-runtime@0bbebed0` `README.md:1326`); a defesa dele só existe ligando a
    abertura do TLS, que é experimental (`src/sandbox/http-proxy.ts:302-308`).
  - **1333, o DNS.** Com um domínio na lista, a E2B libera o `8.8.8.8` para todo tráfego, não só DNS
    (`packages/api/internal/orchestrator/create_instance.go:113-123`; "all traffic to it is allowed",
    `e2b@2.63.0` `dist/index.d.ts:3147`). Por ele, um comando na máquina manda texto a **qualquer**
    domínio, não só aos liberados. Isso é maior que o risco da sua resposta C do estudo, que falava em
    "mandar o dado a um domínio liberado"; a primeira rodada deste cartão disse que era o mesmo risco,
    e estava errada. O canal já existe hoje na máquina do Assistente, desde a decisão 0059 (a lista
    tem o npm e o PyPI). O Claude Code no Linux não tem esse canal: o comando roda sem rede nenhuma e
    só fala com o proxy (`src/sandbox/linux-sandbox-utils.ts:1491-1498`); no Windows e no macOS ele
    deixa o resolvedor do sistema aberto e o escreve ("DNS resolution via the system resolver is not
    fenced", `README.md:1064`). Fechar na E2B é `dnsServers: []` e os nomes escritos em `/etc/hosts`
    da máquina (`dist/index.d.ts:9837-9848`); como a E2B disca o nome ela mesma, o endereço escrito
    talvez nem precise ser o certo (inferido do código, não provado). Uma estrela não cabe em
    `/etc/hosts`, então fechar o DNS desliga a estrela da decisão C.

  As opções:
  - **(a)** Fechar a 1335: a premissa dela caiu no código da E2B, e o que sobra é o limite que o
    Claude Code também tem e escreve. Manter a 1333 aberta, reescrita para toda máquina de conversa,
    com o gatilho no cartão do login (a sua D-a do estudo), que é o primeiro a pôr uma credencial na
    máquina. A decisão nova 0084 escreve os dois canais como são, e o caso ao vivo da U2 prova na
    E2B, de graça, que ela disca o nome liberado ela mesma. **Recomendo**: o canal do DNS já existe hoje
    sem dano registrado, a máquina não guarda segredo (S36), e o conserto custa a estrela; o momento de
    pagar é quando houver uma senha na máquina.
  - **(b)** Fechar as duas com o risco aceito, escrito na 0084 com o DNS como ele é (qualquer
    domínio). Nada fica para depois.
  - **(c)** Fechar o DNS nesta etapa: `dnsServers: []`, e o Hub escreve em `/etc/hosts` os nomes
    liberados a cada troca. Uma unidade a mais, a prova ao vivo de que o endereço escrito não importa,
    e a decisão C só pode ser (c).

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G1 (um PR, data D11) | U1 A lista da empresa e a da conversa | As duas tabelas, a migração e a permissão; a loja; a regra de papel `network: ['manage']`; as rotas de Configurações, Internet; os tipos do contrato (o domínio, o pedido, a resposta, o resultado) em `hub-api`, com a lista pública de sufixos (`tldts`, dependência nova) | `H/network/` (novo), `Hub/identity/` (só `roles.ts`, `admission.ts`, `companies.ts`), `API/`, `apps/server/migrations/`, `apps/server/database-grants.sql` | data | a etapa 2 fechada |
| G2 | U2 A máquina segue a lista | A rede de cada máquina de conversa passa a ser os registros de pacote, a lista da empresa e a da conversa, aplicada a cada partida e a cada mudança; a remoção fecha as máquinas ligadas; o que o modelo lê da máquina | `H/machine/`, `Ag/assistant/` e `Ag/saved-agent/` (só a montagem), `apps/server/src/main.ts` (a ligação) | testing | U1 |
| G2 | U3 O pedido na conversa | A ferramenta `request_network_access`, que suspende com o cartão e volta com a resposta; o caminho da automação e do membro, sem cartão; o prompt do Assistente e as linhas do navegador | `H/network/`, `Ag/assistant/` (ferramentas e `prompt/assistant.md`), `Ag/saved-agent/` (ferramentas) | testing | U1, U2 |
| G3 | U4 O cartão na conversa | O cartão de três botões no Assistente e no agente salvo, sem botões para quem não libera; a linha da ferramenta | `Wr/`, `apps/web/src/ui/ai/approval.tsx`, `apps/web/src/agents/assistant/`, `apps/web/src/agents/saved-agent/` (só o `Room`) | web, design | U1 (os tipos) |
| G3 | U5 Configurações, Internet | A seção nova: a lista, Adicionar e Remover para o dono e o administrador, a leitura para os outros | `apps/web/src/routes/_app/companies/$companyId_/settings/`, `apps/web/src/harness/network/` (novo) | web, design | U1 |
| G4 | U6 O fechamento | A decisão nova que emenda 0051 e 0059; as issues 1333 e 1335; `boundaries.md`; a explicação do harness; a página da trilha e o roteiro; o cartão apagado | `docs/` | delivery | o uso |

**Em paralelo.** Depois do G1, o G2 (servidor) e o G3 (web) andam ao mesmo tempo, por dois
construtores: o G3 lê só os tipos que a U1 põe em `hub-api` e não toca pasta do servidor. Dentro de
cada grupo as unidades vão em ordem (U2 antes de U3; U4 e U5 não dividem arquivo e podem ir em
qualquer ordem). O `A2` G1 pode construir a leitura do site quando o G2 estiver no `main`.

**Orçamento de código alterado.** U1: 420. U2: 180. U3: 300. U4: 220. U5: 320. U6: só documentos.
Total da etapa: cerca de 1 440 linhas, sem testes nem gerados.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `GET /api/companies/{companyId}/network/domains` devolve a lista da empresa (domínio, motivo, quem liberou, quando) a todo membro; uma empresa de que a pessoa não é membro dá `404 NOT_FOUND` | `H/network/network-routes.test.ts`, "todo membro lê a lista; fora da empresa, 404" | must |
| 2 | U1 | `POST …/network/domains` com `{ domain, reason }` grava para o dono e o administrador e devolve a linha; o desenvolvedor e o membro recebem `409 NOT_IN_ROLE` nomeando "a lista de internet da empresa", e nada se grava | `network-routes.test.ts`, "só dono e administrador adicionam", um caso por papel | must |
| 3 | U1 | O mesmo domínio duas vezes, ao mesmo tempo ou não, deixa uma linha só, e a segunda resposta é a mesma linha (`200`) | `network-routes.test.ts`, "o mesmo domínio duas vezes é uma linha" | must |
| 4 | U1 | Um domínio fora da forma é `400 NETWORK_DOMAIN_INVALID`: endereço IP, `localhost`, um nome só (`intranet`), porta ou caminho (`exemplo.com/a`), a estrela sozinha (`*`), estrela no meio, estrela sobre um sufixo público pela lista pública (`*.com`, `*.com.br`, `*.co.uk`, `*.github.io`, `*.cloudfront.net`), e um nome sob `e2b.app` ou `e2b.dev`; `Exemplo.COM` grava `exemplo.com`, e `münchen.de` grava `xn--mnchen-3ya.de` | `API/network.test.ts`, "a forma do domínio", um caso por linha | must |
| 5 | U1 | `DELETE …/network/domains/{domainId}` tira a linha para o dono e o administrador (`204`); outro papel é `409 NOT_IN_ROLE`; uma linha que não existe é `404 NOT_FOUND` | `network-routes.test.ts`, "só dono e administrador removem" | must |
| 6 | U1 | As permissões são as aprovadas: `hub_company` tem `SELECT`, `INSERT` e `DELETE` nas duas tabelas, nenhum `UPDATE`; `hub_app` nenhuma; a política de linha é a da empresa | `apps/server/src/platform/catalog.test.ts`, a foto do catálogo | must |
| 7 | U1 | Apagar a empresa apaga as duas listas; apagar a conta de quem liberou deixa a linha da empresa com "quem liberou" vazio | `H/network/network-store.test.ts`, "ao apagar" | must |
| 8 | U2 | Toda máquina de conversa do Assistente e do agente salvo parte com os registros de pacote, a lista da empresa e a da conversa, e nada mais, na criação, na volta de uma pausa e ao ser achada de novo depois de o Hub reiniciar | `H/machine/machine-network.test.ts`, "a rede na partida", um caso por forma de partida, com o dublê de rede | must |
| 9 | U2 | A máquina do Construtor de agentes e a do Construtor de apps seguem com `registry.npmjs.org` só, com a empresa tendo domínios liberados | `machine-network.test.ts`, "os construtores não seguem a lista"; `H/machine/machine-e2b.test.ts`, o caso de hoje (17) sem mudança | must |
| 10 | U2 | Remover um domínio da empresa fecha, em segundos, cada máquina ligada da empresa que o Hub segura; uma troca de rede que falha deixa a máquina marcada, e a próxima ferramenta da conversa aplica a lista de novo antes de rodar | `machine-network.test.ts`, "a remoção fecha as máquinas ligadas" e "a troca que falha refaz na próxima ferramenta" | must |
| 11 | U2 | A partida cuja troca de rede falha não entrega a máquina: o turno vê `MACHINE_UNAVAILABLE`, e a linha de log diz `reason: 'NETWORK'` | `machine-network.test.ts`, "a partida sem a rede certa falha" | must |
| 12 | U2 | No E2B de verdade: antes da liberação, `curl` do domínio não responde; depois, responde; depois de removido, não responde de novo, com a máquina ligada o tempo todo; com o domínio liberado e o `/etc/hosts` da máquina apontando o nome para `192.0.2.1` (um endereço de documentação, RFC 5737), o `curl` ainda responde, o que prova que a E2B disca o nome ela mesma (linha 16) | `machine-e2b.test.ts`, "opt-in: no E2B de verdade, a rede abre e fecha um domínio com a máquina ligada" (roda com a chave da instalação; o roteiro, passo 2, é a prova na nuvem) | must |
| 13 | U3 | Um domínio já na lista da empresa ou da conversa abre sem cartão: a ferramenta devolve `OPEN` e a máquina tem o domínio | `H/network/network-tool.test.ts`, "o que já está liberado abre sem cartão" | must |
| 14 | U3 | Um domínio fora das listas, pedido pelo dono numa conversa, suspende com `{ domains, reason }` (os que faltam, até dez, em um cartão); a resposta "conversa" grava só na conversa, "empresa" grava na empresa, "recusar" não grava e devolve `REFUSED`; o domínio liberado responde na máquina no mesmo turno | `network-tool.test.ts`, "o cartão e as três respostas", com o retrato T26 da suspensão e da volta | must |
| 15 | U3 | Quem perdeu o papel entre o cartão e a resposta recebe `NOT_OPEN` com `ROLE`, e nada se grava | `network-tool.test.ts`, "o papel é lido de novo na resposta" | must |
| 16 | U3 | Um membro, ou uma execução de automação, nunca vê cartão: a ferramenta devolve `NOT_OPEN` com `ROLE` ou `AUTOMATION` e os domínios que faltam, e o modelo diz em uma frase que se liberam em Configurações, Internet | `network-tool.test.ts`, "sem cartão para membro e automação"; `Ag/assistant/automations/run.test.ts`, "a automação fora da lista termina dizendo o domínio" | must |
| 17 | U3 | A conversa apagada leva a sua lista: uma conversa nova do mesmo dono pede de novo | `network-tool.test.ts`, "a lista morre com a conversa" | must |
| 18 | U3 | O Assistente e o agente salvo com Computador oferecem `request_network_access`; o agente salvo sem Computador e os construtores não | `Ag/assistant/prompt-tools.test.ts`; `Ag/saved-agent/machine.test.ts`, "a ferramenta vem com o Computador" | must |
| 19 | U3 | Com o modelo dublê, o agente abre um site de teste servido na máquina com `agent-browser`, tira a captura, a lê como imagem por `read_file` e a mostra por `show_file` | `Ag/assistant/browser.test.ts`, o retrato T26 de uma conversa gravada | should |
| 20 | U4 | O cartão aberto mostra o título, cada domínio pedido (a estrela em palavras), o motivo e os três botões; cada botão manda a sua resposta, e o cartão fecha com o que se fez ("Liberado nesta conversa", "Liberado para a empresa", "Recusado") | `Wr/network-card.test.tsx`, um caso por botão | must |
| 21 | U4 | Para quem não libera (`may.manageNetwork` falso), o cartão mostra a frase "Só o dono ou um administrador libera um domínio, em Configurações, Internet." no lugar dos botões; um resultado `NOT_OPEN` por papel aparece com o mesmo aviso | `network-card.test.tsx`, "sem botões para quem não libera" | must |
| 22 | U4 | Um pedido cujo argumento não passa no esquema desenha a linha comum e não quebra a conversa | `Wr/tool-registry.test.ts`, o caso do cartão com argumento inválido | must |
| 23 | U5 | Configurações, Internet aparece no índice para todo membro; o dono e o administrador veem Adicionar e Remover; os outros veem a lista sem os botões | `apps/web/src/harness/network/network-page.test.tsx`, um caso por papel | must |
| 24 | U5 | Adicionar recusa o domínio fora da forma com a frase do campo, e Remover pede confirmação e tira a linha da lista sem recarregar a página | `network-page.test.tsx`, "adicionar e remover" | must |
| 25 | U5 | A seção tem as telas da matriz de estados (vazio, carregando, erro com tentar de novo) a 1366 e 390 px, nos dois temas | as capturas da QA (T25), pela skill de verificação | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O cartão do pedido (U4) | aberto, com os três botões | não há cartão sem domínio | "Liberando…" no botão tocado, os outros apagados | a frase do erro abaixo dos botões, e os botões de volta | a chamada que o Hub não segura mais (Parar, um reinício): o cartão fecha como "Recusado" | a frase de quem não libera, sem botões | "Recusado"; o resultado `NOT_OPEN` com `MACHINE_UNAVAILABLE` mostra "Liberado, mas a máquina não respondeu; a próxima tentativa aplica" |
| Configurações, Internet (U5) | a lista vazia com a frase do passo 1 do roteiro | a mesma frase, e Adicionar para quem pode | o esqueleto da lista (`ui/states.tsx`) | `ReadFailure` com Tentar de novo | a página de não encontrado da empresa | a lista sem Adicionar e Remover | Remover de uma linha que outra pessoa já tirou: a lista relê e a linha some, sem erro |

**O desenho.** O cartão é a peça `Approval` de `ui/ai/approval.tsx` com um terceiro botão,
"Liberar para a empresa", à esquerda de "Liberar nesta conversa" (a primária) e "Recusar". A 390 px
os três ficam em coluna, a primária por cima. A seção usa `ui/list.tsx` (as linhas: o domínio, o
motivo em texto secundário, "Liberado por <nome> em <data>"), `ui/dialog.tsx` para Adicionar (dois
campos, Domínio e Motivo) e a confirmação de Remover que `settings/people.tsx` já usa. Nenhuma peça
nova em `ui/` além do terceiro botão. O protótipo das duas telas, em caixas, é a primeira tarefa da
U4 e da U5, aprovado pelo fundador com os textos (delivery L7) antes do código.

```text
1280 px, o cartão
┌────────────────────────────────────────────────────────────────┐
│ O Conexus quer acessar a internet                              │
│                                                                │
│ Domínios  loja.exemplo.com.br                                  │
│           qualquer endereço que termina em .cdn.exemplo.com    │
│ Motivo    ler os produtos e os preços da página inicial        │
│                                                                │
│ [Liberar para a empresa]  [Liberar nesta conversa]  [Recusar]  │
└────────────────────────────────────────────────────────────────┘

390 px, o cartão
┌────────────────────────────────┐
│ O Conexus quer acessar a       │
│ internet                       │
│                                │
│ Domínios                       │
│ loja.exemplo.com.br            │
│ qualquer endereço que termina  │
│ em .cdn.exemplo.com            │
│ Motivo                         │
│ ler os produtos e os preços    │
│                                │
│ [Liberar nesta conversa]       │
│ [Liberar para a empresa]       │
│ [Recusar]                      │
└────────────────────────────────┘
```

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `NetworkDomain` (o domínio na forma da U1) | o parse de `API/network.ts`, na rota, na ferramenta e no campo da tela | a loja, a máquina (`allowOut`), o cartão, a seção |
| `NetworkAsked` (`{ domains, reason }`, a suspensão) | `request_network_access` (U3) | o cartão (U4) |
| `NetworkAnswer` (`{ scope: 'CONVERSATION' \| 'COMPANY' \| 'REFUSED' }`) | o cartão (U4), por `POST …/tool-suspension` | a ferramenta na volta (U3) |
| `NetworkResult` (`OPEN`, `REFUSED`, `NOT_OPEN` com `reason`) | a ferramenta (U3) | o modelo (`toModelOutput`) e o cartão fechado (U4) |
| `CompanyNetworkDomain` (`id`, `domain`, `reason`, `grantedBy`, `grantedAt`) | a loja (U1) | a seção (U5) |
| `CompanyMay.manageNetwork` | `Hub/identity/companies.ts` (U1) | o cartão (U4), a seção (U5) |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `INSERT` em `company_network_domain` (rota e ferramenta) | `ON CONFLICT (company_id, domain) DO NOTHING` e a releitura: uma linha, a mesma resposta | uma instrução: grava ou não | banco fora: `503 DATABASE_UNAVAILABLE` na rota; na ferramenta, `NOT_OPEN` com `DATABASE`, nada aplicado | `NETWORK_DOMAIN_GRANTED` com `companyId`, `scope`, quantos domínios (nunca o domínio, S41) | 3, 14 |
| `INSERT` em `conversation_network_domain` (ferramenta) | o mesmo `ON CONFLICT (conversation_id, domain)` | uma instrução | como acima | a mesma linha, `scope: 'CONVERSATION'` | 14 |
| `DELETE` de uma linha da empresa (rota) | o segundo acha nada: `404`, e a tela relê | uma instrução; a troca de rede das máquinas vem depois e não desfaz o `DELETE` | banco fora: `503`, nada tirado | `NETWORK_DOMAIN_REMOVED` | 5, 10 |
| `DELETE` das linhas da conversa (no apagamento da conversa, junto do `kill` da máquina) | idempotente | o `kill` da máquina e o `DELETE` são dois passos; o `DELETE` primeiro, e uma falha do `kill` deixa a máquina para o `kill` de hoje repetir | banco fora: o apagamento da conversa falha como hoje | a linha de hoje do apagamento | 17 |
| `sandbox.e2b.updateNetwork` (E2B), na partida, depois de uma liberação e depois de uma remoção | duas trocas da mesma máquina: cada uma manda a lista inteira lida na hora, e a fila da conversa (`inLane`, code C65) põe uma depois da outra; a última vence com a lista de agora | não há meio: a E2B troca "atomically" (`e2b@2.63.0` `dist/index.d.ts:9916-9920`) | E2B fora: na partida, `MACHINE_UNAVAILABLE` (11); depois de liberar, `NOT_OPEN` com `MACHINE_UNAVAILABLE` e a liberação gravada; depois de remover, a máquina fica marcada e a próxima ferramenta refaz (10) | `MACHINE_NETWORK_FAILED` com `conversationId` e `reason` (`START`, `GRANT`, `REMOVE`) | 8, 10, 11, 12 |
| `suspend()` e a volta pela rota `tool-suspension` (Mastra) | duas respostas ao mesmo cartão: o Mastra aceita a primeira e a segunda recebe a falha de hoje do cartão do Caderno | a resposta que chega antes de o Mastra gravar a suspensão perde a disputa (medida em 1.82: 4 a 11% com resposta instantânea, 0 de 200 com 1,5 s); vale o que vale para o cartão do Caderno hoje | banco do Mastra fora: a suspensão não se grava, o turno falha como hoje | o que o Mastra imprime hoje | 14 |

## A tabela de referência

As linhas do estudo, com a unidade de cada uma; as que o estudo deixou "fica de fora" seguem fora
(o login, a sessão logada, o cofre, o navegador hospedado, o Instagram pela página e pelo conector).
Rótulos: **mesma situação**, **outra situação** (com a diferença), **lido** (o código aberto),
**documentado** (a página oficial).

| # | Peça | Unidade | O que o fundador já decidiu | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Decisão | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A rede da máquina: os registros de pacote somados à lista da empresa e à da conversa | U2 | A-a (2026-11-25); 0059 ("the web is the Hub's tools", 2026-10-31), que esta etapa emenda | `H/machine/kit.ts:31-35` (`ALLOWED_HOSTS`, `PACKAGE_HOSTS`); `H/machine/e2b.ts:26-28` (`egress`), `:58-59` (`openNetwork`, `closeNetwork`); `H/machine/spec.ts:8-9` (`hosts`); `H/machine/conversation.ts:194-200` (`started`, que só fecha) | `e2b@2.63.0`, **mesma situação** (a rede trocada com a máquina ligada); a conferência do Construtor de apps, **mesma situação** no próprio `main` (`H/machine/confer.ts:170`, `:231`) | "The update endpoint replaces all egress rules atomically — fields that are omitted are cleared on the server" (`dist/index.d.ts:9916-9920`); `allowOut` aceita "a domain name (e.g. "example.com", "*.example.com")", e com um domínio a lista abre o DNS (`:3141`). **lido**. O `@mastra/e2b@0.17.0` passa a rede só na criação (`src/sandbox/index.ts:423`) e não a refaz ao reconectar nem ao retomar (`:387-401`); o `onStart` recebe `outcome`, `'created'` ou `'connected'`, a retomada conta como `connected`, e "A thrown error is FATAL" (`packages/core/src/workspace/sandbox/mastra-sandbox.ts:50-83` na prateleira). **lido** | embrulhado: o nativo é a `updateNetwork`, chamada pelo `openNetwork` de hoje; o nosso é ler as duas listas a cada partida | — | A-a | `H/machine/network.ts` |
| 2 | O pedido de um domínio chega à pessoa | U3 | A-a, B-a | nenhum; o cartão do Caderno é a mesma forma (`H/tools/connectors/connector-tools.ts:272-311`, `suspend` e `NoteAnswer`) | Claude Code, **outra situação** (o computador da pessoa; o proxy dele segura a conexão e pergunta): "The first time a command needs a new network domain, Claude Code prompts for approval", e o comando "stays in the sandbox and waits for a decision" (https://code.claude.com/docs/en/sandboxing), **documentado**; Codex, **mesma situação** no pedido do agente: o argumento `require_escalated` com `justification`, "User-facing approval question" (`codex-rs/core/src/tools/handlers/shell_spec.rs:219-237`), e o pedido por domínio `NetworkApprovalContext { host, protocol }` (`codex-rs/protocol/src/approvals.rs:75-78`), **lido**; `@mastra/core@1.83.0`, **mesma situação** | Mastra: "The stream emits a `tool-call-suspended` chunk with a custom payload defined by the tool's `suspendSchema`. You resume by calling `resumeStream()` with data matching the tool's `resumeSchema`" (`NM/docs/references/docs-agents-human-in-the-loop.md:237`), e a aprovação por `suspend()` (`:360-410`); o chunk leva `toolCallId, toolName, suspendPayload, args, resumeSchema` (`packages/core/src/stream/types.ts:873-883` na prateleira). **lido**. A diferença: a E2B só recusa a conexão, sem gancho para perguntar (`e2b@2.63.0` `dist/index.d.ts:9750-9868`); o pedido vem do agente, como a escalada do Codex, e não do proxy | embrulhado: `suspend()` nativo; o nosso, o cartão e quem responde | A memória medida em 1.82 ("suspend() sobrevive a uma mensagem nova"; o `requireApproval` com `yolo:false` perde leituras): `suspend()`, como o Caderno | B-a | `H/network/network-tool.ts` |
| 3 | As três respostas | U3, U4 | B-a | nenhum | Codex, **mesma situação** (por domínio, numa conversa): "Yes, and allow this host for this conversation", "Yes, and allow this host in the future", "No, and block this host in the future" (`codex-rs/tui/src/bottom_pane/approval_overlay.rs:913`, `:929`, `:933`), e a resposta "no futuro" só grava o domínio que foi pedido ("does not match approved host", `codex-rs/core/src/session/mod.rs:3258`), **lido**; Claude Code, **outra situação**: "Yes" vale "for the rest of the current session", "Yes, and don't ask again" grava uma regra `WebFetch(domain:...)` nas configurações (página acima), **documentado** | Uma resposta para esta conversa, uma que fica, e a recusa; a que fica grava só o que o cartão pediu | embrulhado: as três respostas são o `resumeSchema`; "empresa" é o "no futuro" do Codex, guardado na lista da empresa. O "bloquear no futuro" do Codex fica de fora: a E2B não bloqueia por nome ("Domain names are not supported for deny rules", `dist/index.d.ts:3145`) | — | B-a; a duração é a decisão A | — |
| 4 | Quanto dura a liberação da conversa | U1, U3 | A a (2026-11-25) | nenhum | Claude Code ("for the rest of the current session"); Mastra Code `always_allow_category`, em memória por sessão (`MC/sdk/src/factory/remote-session.ts:428-438`, **lido**); Codex, `ApprovedForSession` em memória, `session_approved_hosts` (`codex-rs/core/src/tools/network_approval.rs:313-314`, `:1023-1033`), **lido** | Todas guardam a liberação da sessão em memória; nenhuma tem uma conversa que dura dias | remendo se (a): a linha por conversa | A decisão A, com o exemplo da terça; no `@mastra/core` 1.83.0 a permissão dada na sessão é um `Map` em memória (`NM/agent-controller-BhkzVgCi.js:4893-4895`, `:6952-6961`) | A a (2026-11-25) | `H/network/tables.ts` |
| 5 | Quem libera | U1, U3 | B do `A3` ("dono ou administrador"); 24.5 `D3-a` (o papel lido na hora da resposta) | `Hub/identity/roles.ts:24-32` (`MANAGE_COMPANY`); `Hub/identity/admission.ts:86-90` (`manageCompanyMemory`, o mesmo desenho); `Hub/connectors/approval.ts:48-55` (`mayApprove`, lido na hora) | Cowork, **mesma situação** (o administrador da organização mantém a lista de domínios dos comandos do agente): "your admin sets them for the whole organization in **Organization settings > Capabilities**" (https://claude.com/docs/cowork/guide/network-access), **documentado**; Factory, **mesma situação** em quem responde a um pedido suspenso: "Only a signed-in person's turn may answer" (`MC/factory/src/tools/approval-tools.ts:36`), a sessão privada só pelo dono (`:63-64`), e a execução retomada age como quem respondeu (`:101-102`), **lido** | O administrador mantém a lista; a pessoa sem o papel não a muda; quem responde é uma pessoa, lida na hora da resposta | embrulhado: a regra de papel do Hub (`hasPermission` do Better Auth, `Hub/identity/may-use.ts:86-95`) | — | não precisa | — |
| 6 | Sem pessoa para perguntar: a automação e o membro | U3 | B-a; a automação roda um turno do Assistente sem ninguém olhando (`Ag/assistant/mays.ts:18`, `H/spec/speakers.ts:50-51`) | nenhum | Claude Code, **mesma situação** (a regra da organização vale sem perguntar): com `allowManagedDomainsOnly`, "non-allowed domains are blocked automatically instead of prompting, and only `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are honored" (página acima), **documentado**; Cowork: só a lista do administrador vale, e "a blocked command fails, and its output usually says why" (página acima), **documentado** | Sem quem responda, só a lista da organização vale, e o bloqueio diz o motivo | embrulhado | — | não precisa | — |
| 7 | A lista da empresa na tela | U5 | B do `A3` ("em Configurações") | nenhum; o desenho de seção é `settings/company-memory.tsx` (uma seção, um arquivo, web W32) | Cowork, **mesma situação**: "**Additional allowed domains**" sob **Organization settings > Capabilities** (página acima), **documentado** | Uma lista de domínios que o administrador acrescenta e tira | nativo da forma: uma seção de Configurações | — | não precisa | `apps/web/src/routes/_app/companies/$companyId_/settings/network.tsx` |
| 8 | A remoção fecha as máquinas ligadas | U2 | A-a | `H/machine/machines.ts:95-108` (`networkOpen` e `closeAgain`: a troca que falhou se refaz no próximo uso) | `e2b@2.63.0` `updateNetwork` (linha 1); Codex, **mesma situação** (a lista muda com o trabalho ligado): a resposta "no futuro" entra no proxy que já roda, `proxy.add_allowed_domain(host)` (`codex-rs/core/src/exec_policy.rs:597-605`), **lido**. Nenhuma referência documenta a remoção com a sessão ligada | A mudança vale na hora, sem reiniciar o trabalho | embrulhado: a troca nativa, pela fila da conversa, com o refazer de `machines.ts` | — | não precisa | — |
| 9 | O domínio com estrela | U1 | nada registrado; a segunda rodada da decisão C | nenhum | E2B, **mesma situação**: o casamento é `*.x` em qualquer profundidade, sem o próprio `x`, e `*` casa tudo (`e2b-dev/infra@86cb5033` `packages/orchestrator/pkg/tcpfirewall/handlers.go:228-245`); a API não confere nome nenhum, só IP e CIDR (`packages/api/internal/handlers/sandbox_create.go:923`), **lido**; Claude Code, **mesma situação** (a lista que a pessoa escreve): `*.com` e `*` recusados, dois nomes depois da estrela, sem lista pública de sufixos (`anthropic-experimental/sandbox-runtime@0bbebed0` `src/sandbox/domain-pattern.ts:99-125`, `:189-200`), **lido**; Codex, **mesma situação**: só `*` sozinho recusado (`codex-rs/network-proxy/README.md:57-60`, `:259-262`), e o pedido em tempo de execução grava só o nome aprovado (`codex-rs/core/src/session/mod.rs:3250-3258`), **lido**; `tldts@7.4.18` (a lista pública de sufixos, no `package-lock.json` como dependência de `tough-cookie`): `parse(base, { allowPrivateDomains: true }).domain === null` para `com.br`, `co.uk`, `github.io`, `vercel.app`, `cloudfront.net`, `herokuapp.com`, e um domínio para `cdninstagram.com`, **medido** | A estrela só no começo; nenhuma referência confere a lista pública; o pedido durante o trabalho libera só o nome | embrulhado: o casamento é o da E2B; o nosso é a conferência de que a base da estrela não é um sufixo público | A medida da lista pública acima, e os casos do critério 4 | C a (2026-11-26) | — |
| 10 | A forma do domínio | U1 | nada registrado | nenhum | WHATWG URL no Node 24 (`new URL('https://' + d).hostname` dá o nome em minúsculas e em punycode), **lido**; Codex: "Use exact hosts or scoped wildcards" (`codex-rs/network-proxy/README.md:57-60`), **lido**; a E2B aceita IP e CIDR além do nome (`dist/index.d.ts:3141`), o que o pedido recusa (decisão 5 do firstmate e o critério 4) | Nome exato ou estrela no começo; nada de IP no pedido | nativo: o parse da URL | — | não precisa | `API/network.ts` |
| 11 | O navegador do agente | U3 | nada além da conferência (A1) | `infra/e2b/template.ts:48`, `:59-65`, `:103` (`agent-browser` e o Chromium); `H/machine/confer.ts:166-197` (o caminho que abre, espera e captura) | `@mastra/core@1.83.0`, **mesma situação**: o provedor CLI é para "workspace agents that control browsers through shell commands" (`NM/docs/references/docs-browser.md:17`), **lido**; o `agent-browser` lança o próprio navegador quando ninguém passa CDP (`NM/workspace-BAqspXXH.js:6225-6233`, a injeção só com um navegador do Mastra) | O agente roda `agent-browser open`, `wait`, `screenshot` no terminal da máquina | nativo | — | não precisa | — |
| 12 | Os domínios que a página pediu e não abriram | U3 | o achado F1 do `A2` (CSS e fontes de outro domínio) | `H/machine/confer.ts:190` (`network requests`, que a conferência já lê) | `agent-browser@0.43.0`: `network requests`, `--filter`, e `network request <requestId>` "Full request/response detail incl. body" (`skill-data/core/references/commands.md:260-262`), **lido**; os campos de cada pedido e como aparece um pedido que a rede recusou **não estão documentados**, e o pacote não traz o código do CLI | O agente lista os pedidos da página | nativo: o comando do CLI; o nosso, a linha do prompt que manda pedir todos juntos | A gravação da U3, passo 3: o `agent-browser` local abre uma página de teste cuja fonte vem de um nome que não resolve, e a saída de `network requests --json`, `errors` e `console` fica gravada como exemplo do prompt; sem custo, sem E2B | não precisa | — |
| 13 | A trava do navegador não é a fronteira | fica de fora | nada registrado | nenhum | `agent-browser@0.43.0`: `--allowed-domains` é "browser-level containment", e `--allowed-domains ""` a limpa (`skill-data/core/references/trust-boundaries.md:66`, `session-management.md:81`, **lido**; a página de segurança diz o contrário, que a lista vazia é recusada, https://agent-browser.dev/security, **documentado**) | O agente, que roda comandos na máquina, a desliga | nativo: a fronteira é só a rede da E2B, que o Hub controla | — | não precisa | — |
| 14 | A captura chega ao modelo | U3 | nada registrado | `Ag/assistant/assistant.ts:291-296` (`readMedia: READ_MEDIA`); `H/machine/workspace.ts:40-42` | `@mastra/core@1.83.0`: `read_file` devolve png, jpeg, webp e pdf como mídia (estudo, `packages/core/src/workspace/tools/read-file.ts:12-18`, `media.ts:20-62`), **lido** | `{ type: 'media', data, mediaType }` até 10 MiB | nativo | — | não precisa | — |
| 15 | O canal de DNS (issue 1333) | U2, U6 | C aceitar do estudo (o dado a um domínio liberado); a segunda rodada da decisão D | `H/machine/e2b.ts:26-28` (`egress`, sem `dnsServers`); 0051, a emenda de 2026-11-23; 0059 ("The data the Assistant reads still reaches only the machine") | E2B, **mesma situação**: com um domínio na lista, os `dnsServers` (padrão `8.8.8.8`) entram como endereço liberado para todo tráfego (`packages/api/internal/orchestrator/create_instance.go:113-123`, **lido**; "all traffic to it is allowed", `e2b@2.63.0` `dist/index.d.ts:3147`, **lido**; "This covers all traffic to `8.8.8.8`, not only DNS", https://docs.e2b.dev/sandbox/internet-access, **documentado**); `[]` fecha, e os nomes vão em `/etc/hosts` (`dist/index.d.ts:9837-9848`, **lido**); Claude Code no Linux, **outra situação** (o comando roda sem rede e só fala com o proxy, que resolve o nome): `src/sandbox/linux-sandbox-utils.ts:1491-1498`, **lido**; no Windows e no macOS, "DNS resolution via the system resolver is not fenced" (`README.md:1064`), **lido** | O Claude Code fecha o DNS no Linux porque não dá rede ao comando; na E2B, fechar é `dnsServers: []` com os nomes em `/etc/hosts`, onde estrela não cabe | nativo: o padrão da E2B; o canal fica, escrito na 0084; a 1333 aberta, com o gatilho no cartão do login (D a) | o caso ao vivo da U2, passo 3 | D a (2026-11-26) | a decisão nova em `docs/decisions/` |
| 16 | O nome pedido, não o endereço (issue 1335) | U2, U6 | a segunda rodada da decisão D | 0051, a emenda de 2026-11-23 ("so any server accepting an allowed name is reachable") | E2B, **mesma situação**: com o nome casado, o proxy disca o nome ele mesmo, com o resolvedor dele, "not the sandbox's resolved IP", e recusa endereço interno (`packages/orchestrator/pkg/tcpfirewall/handlers.go:79-87`, `:136-154`), **lido**; na 443 só o SNI é lido (`proxy.go:123-124`), e "allowing one hostname can also permit access to other destinations on the same endpoint" (https://docs.e2b.dev/sandbox/internet-access), **documentado**; Claude Code, **mesma situação**: "in some cases it may be possible to bypass the network filtering through domain fronting" (`sandbox-runtime@0bbebed0` `README.md:1326`), e a conferência do `Host` só com o TLS aberto, `requireHostMatch` (`src/sandbox/http-proxy.ts:300-309`), **lido** | O código da máquina não escolhe o endereço de um nome liberado; outro site atrás do mesmo servidor responde | nativo: o proxy da E2B disca o nome; o limite escrito na 0084, que corrige a frase de 0051; a 1335 fechada | o caso ao vivo da U2, passo 3 (lido em `HEAD` da infra; a produção da E2B não está provada no mesmo commit) | D a (2026-11-26) | — |

**A medida do transplante.** Nenhuma parte trazida.

**A dívida.** Nenhuma.

## As decisões do firstmate

| # | Decisão reversível (delivery L6) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| 1 | A lista nasce numa área nova, `H/network/` (tabelas, loja, rotas, ferramenta), e a máquina recebe só uma porta para ler as listas | A rede da máquina é da Plataforma (`docs/steps/trilhas/agentes-e-apps.md:88`), e `H/machine/` já tem quarenta arquivos; `H/model-accounts/` é o mesmo desenho (tabela, rotas de Configurações e uso pelos agentes numa área da Plataforma) | mover os arquivos para `H/machine/network/` |
| 2 | Duas tabelas, a da empresa e a da conversa, e não uma com `conversation_id` vazio | duas vidas diferentes (a da empresa fica quando quem liberou sai; a da conversa morre com ela): code C22, data D15 | juntar numa tabela com índices parciais |
| 3 | A rede é aplicada a cada partida da máquina, lida das duas listas, e não guardada na máquina | uma remoção feita com a máquina pausada vale na volta; o `@mastra/e2b` não refaz a rede ao retomar (linha 1); uma troca a mais por partida, que a E2B faz numa chamada | aplicar só na criação e nas mudanças |
| 4 | Até dez domínios por pedido, num cartão | uma página traz fontes e imagens de vários domínios (o achado F1 do `A2`); um cartão por domínio cansa a pessoa | outro teto em `API/network.ts` |
| 5 | Um nome sob `e2b.app` e `e2b.dev` é recusado | é onde ficam as portas das outras máquinas (`H/machine/e2b.ts:22-24`) | tirar da lista de recusas |
| 6 | O log nunca leva o domínio, só quantos | o domínio pode dizer o que a empresa pesquisa (S41, campos escalares deliberados) | acrescentar o campo |
| 7 | A frase do modelo sobre a rede sai do prompt fixo do Assistente e da máquina (`Ag/assistant/prompt/assistant.md:55`, `H/machine/conversation.ts:134`) e passa a dizer "os registros de pacote e os domínios que a empresa ou esta conversa liberaram; peça outro com request_network_access" | o pedido ao modelo fica igual em toda conversa (a etapa 1 do harness mediu o prompt byte a byte); a lista em si vem no resultado da ferramenta | pôr a lista na instrução da máquina |

## U1 A lista da empresa e a da conversa

**Base e modelo.** `main` depois da etapa 2. Sonnet: tabela, loja e rotas no desenho de
`H/model-accounts/`.

### As linhas da tabela

Linhas 4 (a tabela da conversa, decisão A a), 5 (o papel), 9 (a estrela) e 10 (a forma).
Ler na base: `Hub/identity/roles.ts:24-32`, `:69-87` e `:90-117` (`MANAGE_COMPANY`, o `ac` e os quatro
papéis); `Hub/identity/admission.ts:11-30` e `:86-90` (as ações e `manageCompanyMemory`);
`API/roles.ts:56-64` (`CompanyMay`); `Ag/assistant/tables.ts:15-43` (a tabela por conversa com as
chaves de empresa e de membro); `H/model-accounts/tables.ts` (`company_model`) e
`apps/server/database-grants.sql:292-294` (as permissões de uma tabela da empresa); `API/company-memory.ts`
(a forma de uma operação de Configurações).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/network/` | Cria: `tables.ts`, `store.ts`, `routes.ts`, `public.ts` | `main.ts` (as rotas); a U2 e a U3 |
| `API/network.ts`, `API/index.ts`, `API/machine.ts` | Cria `network.ts`; `MACHINE_TOOL.requestNetwork` | o servidor e a web |
| `API/roles.ts` | Muda: `CompanyMay.manageNetwork` | `Hub/identity/companies.ts`, a web |
| `Hub/identity/roles.ts`, `admission.ts`, `companies.ts` | Muda: `network: ['manage']` em `MANAGE_COMPANY` e no `ac`; `readNetwork`, `manageNetwork`; o `may` | todas as rotas que admitem |
| `apps/server/migrations/`, `database-grants.sql`, a foto do catálogo | Cria a migração e as permissões | `migrate`, `catalog.test.ts` |
| `apps/web/src/harness/room/machine-specs.ts` | Muda: a linha de `request_network_access` (o `Record` sobre `MACHINE_TOOL` exige) | consequência direta, L7 |

### Os contratos que a unidade cria

Em `API/network.ts`:

```ts
/** A domain the machines may reach: lowercase, punycode, an optional leading `*.` whose base is not a public suffix. */
export const NetworkDomain: z.ZodType<string & z.BRAND<'NetworkDomain'>>
export const NETWORK_LIMITS: { readonly domains: 10; readonly reason: 200 }
export const NetworkAsked: z.ZodObject<{ domains: z.ZodArray<typeof NetworkDomain>; reason: z.ZodString }>
export const NetworkAnswer: z.ZodObject<{ scope: z.ZodEnum<['CONVERSATION', 'COMPANY', 'REFUSED']> }>
export type NetworkResult =
  | { kind: 'OPEN'; domains: readonly NetworkDomain[]; scope: 'ALREADY' | 'CONVERSATION' | 'COMPANY' }
  | { kind: 'REFUSED'; domains: readonly NetworkDomain[] }
  | {
      kind: 'NOT_OPEN'
      domains: readonly NetworkDomain[]
      reason: 'ROLE' | 'AUTOMATION' | 'MACHINE_UNAVAILABLE' | 'DATABASE'
    }
export const NetworkDomainId: z.ZodType<string & z.BRAND<'NetworkDomainId'>> // uuid
export const CompanyNetworkDomain: z.ZodObject<{
  id: typeof NetworkDomainId; domain: typeof NetworkDomain; reason: z.ZodString
  grantedBy: z.ZodNullable<z.ZodString>; grantedAt: z.ZodISODateTime
}>
```

As rotas, por `defineOperation`, em `/api/companies/{companyId}/network/domains`:

| Operação | Método e caminho | Acesso | Entrada | Saída | Falhas |
| --- | --- | --- | --- | --- | --- |
| `listNetworkDomains` | `GET …/network/domains` | membro (`readNetwork`) | — | `{ domains: CompanyNetworkDomain[] }`, por `domain` | `NOT_FOUND`, `SESSION_REQUIRED`, `DATABASE_UNAVAILABLE` |
| `addNetworkDomain` | `POST …/network/domains` | `manageNetwork` | `{ domain: NetworkDomain, reason }` | `200 CompanyNetworkDomain` (nova ou a que já havia) | as de cima, `NOT_IN_ROLE`, `NETWORK_DOMAIN_INVALID` (`400`, novo, com a frase "Este domínio não pode ser liberado.") |
| `removeNetworkDomain` | `DELETE …/network/domains/{domainId}` | `manageNetwork` | — | `204` | as de cima |

As tabelas, no esquema `builder` (`H/schema/tables.ts:7`), com a política da empresa
(`policy(SCOPE_ROLES.COMPANY, 'all', OWN)`):

| Tabela | Coluna | Tipo e restrição | Ao apagar |
| --- | --- | --- | --- |
| `company_network_domain` | `id` | `uuid` chave | — |
| | `company_id` | `text not null` → `auth.organization.id` | `cascade` |
| | `domain` | `text not null`, `unique (company_id, domain)` | — |
| | `reason` | `text not null`, `check (char_length(reason) between 1 and 200)` | — |
| | `granted_by` | `text` → `auth.user.id` | `set null` |
| | `granted_at` | `timestamptz not null default now()` | — |
| `conversation_network_domain` | `conversation_id` | `uuid not null`, a conversa do Mastra; chave `(conversation_id, domain)` | apagada pela loja no apagamento da conversa (U3) |
| | `company_id`, `person_id` | `text not null` → `auth.member (organization_id, user_id)` | `cascade` (quem sai leva as suas conversas, como `assistant_conversation`) |
| | `domain`, `reason`, `granted_at` | como acima | — |

A tabela da conversa só nasce com a decisão A em (a); em (b), a lista da conversa mora em memória na
sessão da máquina (`H/machine/conversation.ts:80-102`) e a U1 cria só a da empresa.

A loja, em `H/network/store.ts`:

```ts
export type NetworkStore = {
  /** The domains the conversation's machine reaches beyond the package registries: the company's and the conversation's. */
  opened(where: { companyId: CompanyId; conversationId: ConversationId }): Promise<readonly NetworkDomain[]>
  grant(grant: {
    scope: 'CONVERSATION' | 'COMPANY'
    companyId: CompanyId; conversationId: ConversationId; personId: PersonId
    domains: readonly NetworkDomain[]; reason: string
  }): Promise<void>
  forget(conversationId: ConversationId): Promise<void>
  /** Tells the machines a company's list lost a domain. */
  onRemoved(listener: (companyId: CompanyId) => void): () => void
}
```

- **Cada estado** como união: `NetworkResult` por `kind`; `NetworkAnswer.scope`.
- **Cada id** com marca: `NetworkDomainId` conferido no parâmetro da rota; `NetworkDomain` no parse.
- **O dono de cada fato**: a forma do domínio e o teto em `API/network.ts`; quem libera em
  `roles.ts`; as frases da tela na U5.
- **O esquema Zod de cada entrada externa**: o corpo do `POST`, o argumento da ferramenta, a resposta do cartão.
- **O arquivo modelo**: `H/model-accounts/` (tabela da empresa, rotas de Configurações), que cumpre C21,
  C23 e C26.

### As skills e a leitura

`drizzle` (no pacote, só o CLI), `fastify-best-practices`, `better-auth-best-practices` e
`organization-best-practices`, nessa ordem; o guia de dados (D6, D10, D11, D12, D15).

### A ordem do trabalho

1. **A forma do domínio.** Critério: 4.
   - **Arquivos:** cria `API/network.ts`, `API/network.test.ts`.
   - **Referência a seguir:** `new URL('https://' + raw)` do Node 24: `hostname` em minúsculas e punycode; recusa se `port`, `pathname !== '/'`, `search`, `username` existem, se o nome é um IP (v4 ou `[`v6), um nome só, `localhost`, ou termina em `e2b.app`/`e2b.dev`; a estrela só como `*.` no começo, e a base dela recusada quando `parse(base, { allowPrivateDomains: true }).domain === null` no `tldts` (decisão C, linha 9); o `tldts` passa a ser dependência de `packages/hub-api`, listada no PR (delivery L16).
   - **Testes:** um caso por linha do critério 4.
   - **Mutações à mão:** trocar a lista pública pela regra dos dois nomes deixa vermelhos `*.com.br` e `*.github.io`; tirar `allowPrivateDomains` deixa vermelho `*.github.io`.
   - **Pronto quando:** o teste passa e `NetworkDomain` só nasce pelo parse.
2. **A migração e as permissões.** Critérios: 6, 7, com a palavra do fundador (data D11).
   - **Arquivos:** `H/network/tables.ts`, a migração por `drizzle-kit generate`, `database-grants.sql`, a foto do catálogo.
   - **Referência a seguir:** `Ag/assistant/tables.ts:15-43`; `database-grants.sql:292-294`.
   - **Testes:** `catalog.test.ts`; `network-store.test.ts`, "ao apagar".
   - **Pronto quando:** `migrate` roda num banco descartável e a foto mostra `SELECT, INSERT, DELETE` e nenhum `UPDATE`.
3. **O papel.** Critérios: 2, 5.
   - **Arquivos:** `roles.ts` (`network: ['manage']` em `MANAGE_COMPANY` e no `ac`), `admission.ts` (`readNetwork` sem declaração; `manageNetwork` com ela, `locks: true`), `companies.ts` e `API/roles.ts` (`manageNetwork`).
   - **Mutações à mão:** pôr `network` em `BUILD` deixa vermelho o caso do desenvolvedor.
4. **A loja e as rotas.** Critérios: 1, 2, 3, 5.
   - **Arquivos:** `store.ts`, `routes.ts`, `public.ts`, o registro em `main.ts`.
   - **O que entra:** `INSERT … ON CONFLICT DO NOTHING` e a releitura; `NOT_IN_ROLE` com `named: { operation: 'a lista de internet da empresa' }`; `onRemoved` chamado depois do `DELETE` confirmado.
   - **Testes:** `network-routes.test.ts`, pela porta pública (T5), um caso por papel.
   - **Mutações à mão:** tirar o `ON CONFLICT` deixa vermelho o critério 3.

### Como se prova

Os testes pela rota, num banco descartável com o `postgres` e o `conexus_owner` (a forma da CI);
`catalog.test.ts` mostra as permissões. Hoje nenhum desses testes existe, e a rota dá `404`.

### Parar se

- A foto do catálogo pedir uma permissão além de `SELECT, INSERT, DELETE`: é decisão do fundador.
- O Better Auth recusar o recurso `network` nos papéis já gravados de uma empresa: parar e medir.

## U2 A máquina segue a lista

**Base e modelo.** `main` depois do G1. Opus: a troca de rede corre na fila da conversa ao lado da
partida e do download (code C65), e a remoção alcança máquinas de outras conversas.

### As linhas da tabela

Linhas 1 e 8. Ler na base: `H/machine/conversation.ts:157-200` (`boot`, `started`), `:231-285`
(`open`, `workspace`), `:308-328` (`stop`, `kill`); `H/machine/spec.ts:7-22`; `H/machine/e2b.ts:26-60`;
`H/machine/machines.ts:90-110` (o refazer da rede que falhou); `Ag/assistant/assistant.ts:291-299` e
`Ag/saved-agent/controller.ts:242-249` (quem monta); `Ag/agent-builder/construtor.ts:307-308`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/machine/spec.ts` | Muda: `network` no lugar de `hosts` | os três que montam |
| `H/machine/conversation.ts` | Muda: `Session` ganha `companyId` e `networkStale`; `started` aplica sempre; `reopen` e `narrow` | a U3, `main.ts` |
| `H/machine/network.ts` | Cria: a lista de cada partida | `conversation.ts` |
| `Ag/assistant/assistant.ts`, `Ag/saved-agent/controller.ts`, `Ag/agent-builder/construtor.ts` | Muda: o `network` de cada um | — |
| `apps/server/src/main.ts` | Muda: `store.onRemoved` liga as máquinas dos dois agentes | — |

### Os contratos que a unidade cria

```ts
// H/machine/spec.ts: `hosts` sai.
network:
  | { kind: 'FIXED'; hosts: readonly string[] }            // the Construtor: decision 0051
  | { kind: 'ON_REQUEST'; hosts: readonly string[]; opened: NetworkStore['opened'] }

// H/machine/conversation.ts, em ConversationMachines:
/** Applies the conversation's two lists to its running machine now; false when the provider failed. */
reopen(conversationId: ConversationId): Promise<boolean>
/** A company's list lost a domain: every held, started machine of the company is narrowed. */
narrow(companyId: CompanyId): Promise<void>
```

O que sai: `MachineSpec.hosts` e o ramo `outcome === 'connected'` de `started`, que passa a aplicar
a lista em toda partida. `Kit.openNetwork` e `closeNetwork` ficam como estão (`e2b.ts:58-59`).

### As skills e a leitura

`mastra` (`@mastra/e2b`: `onStart`), e `node_modules/e2b/dist/index.d.ts` (`updateNetwork`,
`SandboxNetworkUpdate`); o guia de testes (T24, T26).

### A ordem do trabalho

1. **A lista na partida.** Critérios: 8, 9, 11.
   - **O que entra:** em `started`, para `ON_REQUEST` com `companyId`, `kit.openNetwork(await opened(...))`; sem `companyId` (o download), `closeNetwork`; uma falha lança e a partida dá `MACHINE_UNAVAILABLE` com `reason: 'NETWORK'`.
   - **Testes:** `machine-network.test.ts` com o dublê `H/machine/test-machine-network.ts`, um caso por forma de partida.
   - **Mutações à mão:** voltar a aplicar só em `connected` deixa vermelho o caso da criação.
2. **A troca depois de uma liberação e de uma remoção.** Critério: 10.
   - **O que entra:** `reopen` e `narrow` pela fila `inLane` da conversa; a falha marca `networkStale`, e o `beforeToolCall` de `workspace.ts:34` aplica de novo antes da ferramenta.
   - **Mutações à mão:** tirar o `networkStale` deixa vermelho "a troca que falha refaz na próxima ferramenta".
3. **A prova ao vivo, escrita.** Critério: 12.
   - **Arquivos:** um caso opt-in em `machine-e2b.test.ts`, ao lado dos de hoje (`:126`, `:175`).
   - **O que entra:** além de abrir e fechar, a linha de `/etc/hosts` que aponta o nome liberado para `192.0.2.1`. Se o `curl` não responder, a E2B de produção não segue o `handlers.go:79-87` lido em `HEAD`: parar, e a decisão D volta ao fundador com o resultado.

### Como se prova

O dublê de rede grava a lista que cada troca mandou; o caso opt-in roda só com a chave da E2B, que o
construtor não tem: ele fica escrito e o roteiro do fundador o prova na nuvem (passo 2).

### Parar se

- `sandbox.e2b` lançar `SandboxNotReadyError` dentro do `onStart` (o tipo diz só que lança antes da
  partida, `@mastra/e2b@0.17.0` `src/sandbox/index.ts:347-351`): parar e medir com o dublê.
- A lista de uma partida precisar de mais de uma chamada à E2B: a troca é uma só, a lista inteira.

## U3 O pedido na conversa

**Base e modelo.** `main` depois da U2. Sonnet: a forma é a do cartão do Caderno.

### As linhas da tabela

Linhas 2, 3, 4, 6, 11, 12 e 14. Ler na base: `H/tools/connectors/connector-tools.ts:272-311`
(`noteSaveTool`: suspender, voltar, recusar); `H/spec/ask-user.ts:42-64` (o `toModelOutput`);
`H/machine/show-file.ts:60-97` (a ferramenta da máquina dada aos dois agentes); `Ag/assistant/mays.ts:6-29`
e `H/spec/speakers.ts:30-60` (o que o papel e a execução permitem, lido uma vez por execução);
`Ag/assistant/assistant.ts:166-180` e `Ag/saved-agent/agent.ts:255-262` (onde entra `show_file`);
`Ag/assistant/prompt/assistant.md:55`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `H/network/network-tool.ts` | Cria | os dois agentes |
| `Ag/assistant/` | Muda: a ferramenta na lista, `mays.ts` (`network`), a frase da rede em `prompt/assistant.md`, o retrato regravado | — |
| `Ag/saved-agent/agent.ts` | Muda: a ferramenta ao lado de `show_file`, só com o Computador | — |
| O apagamento das conversas (`machinePart.each`, `H/machine/part.ts:13`) | Muda: `store.forget` antes do `kill` | os dois agentes |

### Os contratos que a unidade cria

```ts
// H/network/network-tool.ts
export function requestNetworkTool(deps: {
  store: Pick<NetworkStore, 'opened' | 'grant'>
  machines: Pick<ConversationMachines, 'reopen'>
  /** Who the run can ask, read once per run and again on the resume. */
  asking(requestContext: RequestContext): Promise<Asking>
}): Tool

type Asking =
  | { kind: 'ASKS'; companyId: CompanyId; conversationId: ConversationId; personId: PersonId }
  | { kind: 'LIST_ONLY'; companyId: CompanyId; conversationId: ConversationId; why: 'ROLE' | 'AUTOMATION' }
```

`inputSchema` e `suspendSchema` são `NetworkAsked`, `resumeSchema` é `NetworkAnswer`; o resultado é
`NetworkResult`, e `toModelOutput` dá ao modelo uma linha por caso (os domínios que abriram, ou por
que não, e onde se liberam).

### As skills e a leitura

`mastra` (`NM/docs/references/docs-agents-human-in-the-loop.md:233-262`, `:360-434`); o guia de testes
(T5, T26).

### A ordem do trabalho

1. **A ferramenta.** Critérios: 13, 14, 15, 16.
   - **O que entra:** o domínio já coberto (o nome igual, ou uma estrela que o cobre) abre sem cartão; `LIST_ONLY` devolve `NOT_OPEN` sem suspender; `ASKS` suspende com os que faltam; na volta, `asking` é lido de novo (a execução retomada é outra, `oncePerRun`), e só então `grant` e `reopen`.
   - **Testes:** `network-tool.test.ts`, com a gravação T26 da suspensão e da volta (`npm run record`), nunca um chunk digitado.
   - **Mutações à mão:** usar o papel da suspensão na volta deixa vermelho o critério 15.
2. **Nos dois agentes.** Critérios: 16, 17, 18.
   - **O que entra:** `Mays.network` (`identity.allows(role, 'manageNetwork')` e `byAutomation`); a frase da rede no prompt (decisão 7 do firstmate); `store.forget` no apagamento da conversa.
   - **Testes:** `prompt-tools.test.ts`, `Ag/saved-agent/machine.test.ts`, `automations/run.test.ts`.
3. **O navegador.** Critério: 19.
   - **O que entra:** as linhas do prompt: `agent-browser open`, `wait --load networkidle`, `screenshot` numa pasta da conversa, `network requests` para ver o que não abriu e pedir todos os domínios num cartão só; nunca um campo de senha (decisão D-a).
   - **Antes do prompt:** gravar, com o `agent-browser` local, uma página de teste cuja fonte vem de um nome que não resolve: a saída de `network requests --json`, `errors` e `console`. A documentação não diz como aparece um pedido recusado (linha 12); a linha do prompt nomeia o que a gravação mostrou.
   - **Testes:** `Ag/assistant/browser.test.ts`, com um site de teste servido na máquina do teste.

### Como se prova

O retrato T26 da suspensão e da volta, gravado pelo `npm run record`; os testes da ferramenta pela
rota `tool-suspension` (`H/routes/test-questions.ts:134-155`). Hoje a ferramenta não existe.

### Parar se

- A volta pela rota `tool-suspension` não trouxer o `requestContext` da pessoa que respondeu: parar,
  gravar e levar ao cartão.

## G1 O ponto de conferência

A migração num banco descartável, `catalog.test.ts`, as rotas pela porta pública e
`npm run check`; a palavra do fundador para as permissões no corpo do PR.

## G2 O ponto de conferência

O servidor local com o dublê da E2B, uma conversa do Assistente que pede, recebe o cartão, responde
e vê o domínio na lista do dublê; o retrato do Assistente regravado; `npm run check`.

## U4 O cartão na conversa

**Base e modelo.** `main` depois do G1. Sonnet: a forma é `Wr/note-card.tsx` com `Wr/note-parse.ts`.

### As linhas da tabela

Linhas 2, 3 e 5. Ler na base: `Wr/note-parse.ts:1-91`, `Wr/note-card.tsx:1-95`, `Wr/rows.ts:115-200`
(`invocationToItem`, onde o cartão do Caderno entra), `Wr/room.ts:55-101` (o `Room` por agente),
`apps/web/src/ui/ai/approval.tsx:1-179`, `Wr/approval-text.ts:42-51`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `Wr/network-parse.ts`, `Wr/network-card.tsx` | Cria | `rows.ts`, `transcript.tsx` |
| `Wr/rows.ts`, `Wr/room.ts` | Muda: o item do cartão; `Network = { network: { companyId } }` em `ASSISTANT` e `SAVED_AGENT` | os embrulhos |
| `apps/web/src/ui/ai/approval.tsx` e a vitrine | Muda: `wider?: { label; onClick }`, o terceiro botão (design V62) | o cartão do Caderno não muda |
| `Wr/approval-text.ts` | Muda: `NETWORK_TEXT` | — |

### Os contratos que a unidade cria

`NetworkCardItem` com `state: 'open' | 'conversation' | 'company' | 'refused' | 'not-open'` e
`asked: NetworkAsked | undefined`, no desenho de `NoteCardItem`. Os textos, que o fundador aprova
no protótipo: título "O Conexus quer acessar a internet"; rótulos "Domínios" e "Motivo"; a estrela
como "qualquer endereço que termina em `.<resto>`"; botões "Liberar nesta conversa", "Liberar para a
empresa", "Recusar"; fechado "Liberado nesta conversa.", "Liberado para a empresa.", "Recusado.";
sem papel "Só o dono ou um administrador libera um domínio, em Configurações, Internet.".

### As skills e a leitura

`shadcn` (`npx shadcn@latest info --json -c apps/web`), as skills do `router-core`; os guias web e
design (V62); `docs/reference/impeccable.md`.

### A ordem do trabalho

1. **O protótipo em caixas**, a 1280 e 390 px, aprovado com os textos.
2. **O parse e o item.** Critério: 22.
3. **O cartão.** Critérios: 20, 21. **Mutações à mão:** trocar `CONVERSATION` por `COMPANY` no botão do meio deixa vermelho o caso dele.

### Parar se

- A peça `Approval` não comportar o terceiro botão sem mudar o cartão do Caderno: parar.

## U5 Configurações, Internet

**Base e modelo.** `main` depois do G1. Sonnet.

### As linhas da tabela

Linha 7. Ler na base: `apps/web/src/routes/_app/companies/$companyId_/settings/route.tsx:26-45`
(as seções por `staticData`, W32), `settings/company-memory.tsx` (uma seção), `settings/people.tsx`
(a confirmação de remover).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `settings/network.tsx` | Cria: a seção (grupo `company`, rótulo "Internet", ordem 47) | o índice |
| `apps/web/src/harness/network/` | Cria: a página, as consultas e os textos, `public.ts` | `network.tsx` |

### A ordem do trabalho

1. **O protótipo em caixas**, aprovado com os textos.
2. **A lista e os estados.** Critérios: 23, 25.
3. **Adicionar e Remover.** Critério: 24. **Mutações à mão:** mostrar Adicionar sem `may.manageNetwork` deixa vermelho o caso do membro.

### Parar se

- A seção pedir uma peça de `ui/` que não existe: parar (V62).

## G3 O ponto de conferência

A web local com o Hub de teste, as duas telas olhadas a 1366 e 390 px nos dois temas (T23), pela
skill de verificação; `npm run check`.

## U6 O fechamento

A decisão nova (`docs/decisions/0084-…`), "Conversation machines reach the domains their company or
conversation opened", que emenda 0051 (o Construtor de apps segue só com o npm) e 0059 (o Assistente
alcança também as listas), com as respostas A a E e as decisões A a D deste cartão. Ela corrige a frase da emenda de 2026-11-23
de 0051 ("so any server accepting an allowed name is reachable"): a E2B disca o nome liberado ela
mesma e recusa endereço interno, e o que se alcança além do nome é outro site atrás do mesmo servidor
(linha 16, com o resultado do critério 12). Ela escreve o canal do DNS como ele é: `8.8.8.8` liberado
para todo tráfego, a qualquer domínio (linha 15). As issues seguem a decisão D a: a 1335
fechada pela 0084 e a 1333 reescrita para toda máquina de conversa (o caminho `builder/machine/`
dela não existe mais; a máquina é `H/machine/`), com o gatilho no cartão do login; a linha do risco aceito (C) em `docs/reference/boundaries.md`; a máquina em
`docs/explanation/harness.md`; a página da trilha e o roteiro com esta etapa e a ordem de 2026-11-25;
o cartão apagado.
