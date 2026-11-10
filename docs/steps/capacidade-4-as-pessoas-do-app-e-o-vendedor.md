# Capacidade 4: As pessoas do app e o vendedor

O roteiro diz: "**Capacidade 4. As pessoas do app e o vendedor.** Entra como vendedor de teste,
ligado ao vendedor do ERP, e vê só o seu." Este cartão escreve o estudo das referências de
2026-11-10, que vence onde diverge do estudo anterior, e as palavras do fundador de 2026-11-10. O
estudo anterior propunha um login de banco por pessoa e regra por linha no banco; o fundador o
recusou, e nada dele entra aqui além de fatos do `main` que o estudo novo não contradiz. Cada linha
do `main` citada foi lida em `3c6472e6`, com `better-auth` 1.7.8, `@better-auth/drizzle-adapter`
1.7.8, `drizzle-orm` 1.0.0-rc.4, `zod` 4.6.5, `react-hook-form` 7.90.0 e PostgreSQL 18.

Nenhuma peça nova de código, prompt ou skill desta capacidade fala de um sistema de origem pelo
nome. O vínculo é um texto que a pessoa da empresa digita ("10"); quem sabe que "10" é o código de um
vendedor num sistema é o código do app, que o Builder escreveu.

Hoje o servidor do app já recebe `caller` (quem entrou e o papel), preenchido pela plataforma e não
pelo navegador; o papel tranca a operação antes do código do app rodar; e a skill `conexus-data` já
manda filtrar as linhas no código pelo `caller`. Esta capacidade acrescenta só o vínculo: campos da
pessoa que o app declara, que Quem usa o app guarda na linha de acesso e que chegam em
`caller.fields`.

## A página do fundador

**No fim desta capacidade** você convida um segundo e-mail seu para o app de vendedores com o papel
**Vendedor**, digita na mesma linha que ele é o vendedor **10** do sistema da empresa, entra com
esse e-mail e vê só as vendas do vendedor 10; com o seu e-mail você continua vendo todas.

**O exemplo.** O app de acompanhamento de vendedores tem dois papéis, **Gestor** e **Vendedor**, e
declara um campo da pessoa, **Vendedor no sistema**. O João é Vendedor, e na linha dele em Quem usa
o app está "10". Quando o João abre a tela de vendas, o servidor do app recebe
`caller.fields.vendedor = "10"` e a leitura das vendas filtra pelo vendedor 10. A Maria é Gestora e
vê todos. Uma pessoa com o papel Vendedor e o campo vazio não vê venda nenhuma, até alguém digitar o
número. Se amanhã o João for o vendedor 20, você troca o "10" por "20" e o próximo clique dele já
mostra as vendas do 20.

**O roteiro de uso.** Você é dono da empresa, e o Projeto "Vendedores" da Capacidade 3 tem o app de
acompanhamento publicado (qualquer app com uma lista por vendedor serve).

1. No Projeto "Vendedores", peça ao Builder: "o vendedor entra e vê só as vendas, metas e clientes
   dele; o gestor vê tudo". O Builder declara os papéis **Gestor** e **Vendedor** e o campo
   **Vendedor no sistema**, filtra cada leitura pelo papel e pelo campo, e diz na mensagem final que
   cada Vendedor precisa do número dele em Quem usa o app, e que sem o número ele não vê nada. Você
   publica.
2. Em **Quem usa o app**, toque **Dar acesso**: escreva um segundo e-mail seu, escolha **Vendedor** e
   digite `10` em **Vendedor no sistema**. O convite pendente aparece na lista com "Vendedor no
   sistema: 10".
3. Abra o convite com esse e-mail numa janela anônima: a página diz para qual e-mail ele é; crie a
   senha, toque **Aceitar convite** e abra o app. As telas de vendas, metas e clientes mostram só o
   vendedor 10.
4. Volte com o seu e-mail a Quem usa o app: na linha da pessoa, troque `10` por `20`. O próximo
   clique no app, na outra janela, mostra o vendedor 20. Apague o número: o app não mostra venda
   nenhuma e diz por quê, com a frase que o Builder escreveu.
5. Abra o app com o seu e-mail: você vê todos os vendedores, como hoje.

**O que você faz, e quando.** Antes: a Capacidade 3 no ar, para o roteiro usar o app de
vendedores, e um segundo e-mail seu. No começo: aprova esta página e responde a ordem abaixo. No
fim: faz o roteiro, diz o que viu e aprova os textos das telas. Nenhuma chamada paga nem lista de
permissões do banco: a capacidade acrescenta duas colunas a tabelas que já existem, com as
permissões de hoje, e o molde da máquina do Builder sai refeito na publicação da versão, como em
toda versão.

**Fica de fora.**

- **Login de banco por pessoa e regra por linha no banco.** Você recusou; nenhuma das referências
  cria um login por pessoa (o estudo leu nove construtores de app e as plataformas de dados).
- **Escolher o vendedor numa lista da cópia** em vez de digitar. Sua resposta 2.a.
- **O mesmo valor para todos os apps da empresa** (o campo na pessoa da empresa, como no Retool).
  Sua resposta 1.a; pede um cadastro de pessoa da empresa que a pessoa de app ainda não tem.
- **Uma revisão automática do código do app que procura leitura sem filtro** (o Lovable e o Dyad
  têm). Fica para quando virar necessidade, nas suas palavras.
- **O agente dentro do app falando pelo vendedor.** É a Capacidade 6.
- **Os avisos guardados para um cartão** (`next-card`, 147 abertos em 2026-11-10). Entram quatro: a
  #457 (a aceitação de um convite de app lê a empresa duas vezes, e as mutações da etapa 18 que
  ficaram), porque o gatilho dela é "o próximo cartão que mexer no acesso a um app"; a #760 ("Senha
  criada. Você já entrou." antes de a pessoa estar na empresa) e a #761 (a página do convite não diz
  para qual e-mail é), porque o roteiro passa por essa página; e a #460 (`GET /api/caller` nunca
  rodou num Worker de verdade), que o passo 3 do roteiro faz rodar. Esperam, com o motivo: a #813
  (o app não tem a checagem de estado de módulo) toca a checagem do app, mas esta capacidade só
  muda o passo que leva o manifesto; uma regra nova que recusa apps é outro assunto, com prova de
  turno real; a #458 (as linhas de remoção de cinco proteções do acesso a um app) pede a sua
  escolha de quais contam como obrigatórias, e nada aqui a muda. As outras não tocam o assunto.

**As decisões suas nesta capacidade.** Três já respondidas por você, e uma aberta.

- **Sem login de banco por pessoa: a regra mora no código do app, com o que a plataforma entrega.**
  Em 2026-11-10, ao estudo anterior: "Cara, é complicação demais. ... agora você querer criar um
  usuário de banco para cada um, para cada membro do Conexus? Ah, não sei não. ... nossas pesquisas
  têm que ser baseado em repositórios de referência, que já tem time de engenheiros. Não pode
  assumir coisa." E: "eu acho que só da gente implementar ter o conector que a gente já tem de
  autenticação, que é o do Better Off, que a gente fez para os aplicativos, né? Que define roles e
  tudo. Só isso protegeria. ... o builder é o que vai fazer o código, a gente tá subestimando ele".
  É o que as referências fazem: o código gerado filtra com a identidade que o servidor entrega (Chef,
  Dyad com o Neon, Mitra, Budibase, Retool). Veredito: nativo, já existe no `main` (`caller`, o
  papel na operação, a regra da skill).
- **Pergunta 1: onde o valor mora. a) Na linha de acesso do app** (a forma do Budibase, que guarda
  colunas próprias por usuário do app). Exemplo: o João é o 10 no app de vendedores e pode ser o 7
  num app de outra empresa. Em 2026-11-10: "1.a". Veredito: nativo, uma coluna na tabela de acesso
  que existe desde a etapa 18.
- **Pergunta 2: digitar o valor. a) Digitar** (Retool, ToolJet e Budibase). Exemplo: você digita
  `10`. Em 2026-11-10: "2.a". Veredito: nativo, um campo de texto ao lado do papel.
- **A ordem, aberta.** Você perguntou em 2026-11-10: "a capacidade 4 depende da 3? Tô querendo
  executar em paralelo o que der." No código, não: o filtro vale para qualquer tabela que o app lê,
  cópia ou tabela do próprio app, e só um arquivo, a skill `conexus-data`, é tocado pelas duas. O
  roteiro de uso, sim: ele usa o app de vendedores da 3. E o roteiro do Conexus, na sua resposta
  "3. a" de 2026-11-10, põe "O Sync de qualquer conector" (ainda sem cartão) entre a 3 e a 4. A regra
  de entrega de hoje ([delivery L1](../guides/delivery.md)) deixa a etapa seguinte construir só
  depois do merge da anterior, mas, com o cartão aprovado, deixa as unidades que não tocam nenhum
  arquivo dos consertos da anterior começarem ao lado do uso, dos consertos e do fechamento dela.
  - **a) (recomendo)** A 4 vem antes do Sync de qualquer conector. A U1 e a U2 começam assim que o
    pull request de construção da 3 (https://github.com/developmentconexus-ops/conexus/pull/948)
    entrar no `main`, ao lado do uso e dos consertos da 3; a U3 entra por último, e espera um
    conserto da 3 que mexa em `conexus-data`. Cabe na regra de hoje.
  - **b)** A U1 e a U2 começam já, antes do merge da 3. Pede mudar a L1 num pull request só de
    documentos, com a sua palavra ([delivery L20](../guides/delivery.md)), antes do de construção.
  - **c)** A ordem de hoje: 3, depois o Sync de qualquer conector, depois a 4.

**Como as unidades viram pull requests.** U1, U2 e U3 vão num só pull request de construção, um
commit por unidade, nessa ordem, como a Capacidade 3 fez ([delivery L9, L13](../guides/delivery.md)).
Ao aprovar esta página você aprova também esse agrupamento.

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 O app declara os campos da pessoa | `FieldName` e `FieldValue` em `app-contract`; `fields` no manifesto; `Caller.fields`; o Worker do app entrega ao código só os campos que a versão declara, `null` quando vazio; `defineFields` e `fieldsOf` em `@conexus/app`; a checagem leva os campos ao manifesto, e ler um campo não declarado por `fieldsOf` reprova o passo `tipos`; `AppCaller.fields` em `hub-api` | `packages/app-contract/src/`, `packages/app/src/`, `packages/hub-api/src/apps.ts`, `apps/edge/{src,example}/` (só testes e ajudantes) | [security](../guides/security.md) | esta página aprovada; a ordem decidida |
| U2 Quem usa o app guarda o vínculo | A coluna `fields` em `projects.app_access` e `app_fields` no convite, com a política do convite; o campo extra do convite no Better Auth; a lista, o convite, a aceitação e a troca com os campos (`changeAppAccess` vira `PATCH`); `APP_FIELD_UNKNOWN`; o acesso ao app devolve os valores e a passagem os põe no `caller`; a tela Quem usa o app com os campos na linha, no convite e no convite pendente; a #457, a #760 e a #761 | `apps/server/src/hub/{projects,identity,apps}/`, `apps/server/migrations/`, `packages/hub-api/src/`, `apps/web/src/hub/{projects,identity}/`, `apps/web/sweep-app-states.ts` | [security](../guides/security.md) | U1 |
| U3 O Builder aprende o vínculo | A seção Roles de `conexus-data` com os campos da pessoa e a regra de filtrar pelo papel e pelo campo; o exemplo `references/` com um campo e o filtro; o que a mensagem final do Builder diz | `packages/app/skills/conexus-data/`, `docs/explanation/app-package.md` | [code](../guides/code.md) apenas | U1; o `main` com os consertos da Capacidade 3 que mexem em `conexus-data` |

**A ordem.** U1, depois U2, depois U3, cada commit verde sozinho; nenhuma corre em paralelo com
outra, porque cada uma lê o contrato da anterior. Pela L1, a U1 e a U2 não tocam nenhum arquivo do
pull request de construção da Capacidade 3 (lido em https://github.com/developmentconexus-ops/conexus/pull/948):
a única pasta comum é `apps/server/src/hub/apps/`, onde a 3 muda `app-check.ts`, `app-database.ts`,
`builder-data.ts`, `public.ts` e `send.ts`, e a U2 muda `handoff.ts` e `versions.ts` e uma linha do
export em `public.ts`; a U3 toca `conexus-data/SKILL.md`, que a 3 também muda, e por isso vem por
último. Quando cada uma pode começar é a decisão da ordem, na página.

**Os trilhos.** Nenhuma unidade muda `packages/connectors/src/<provider>/` (o trilho do molde,
[delivery L27](../guides/delivery.md)) nem `apps/web/src/{brand,ui}/` (o trilho de desenho): a tela
usa `TextField`, `Select` e a tabela de `ui/` como estão. Se uma unidade precisar mudar uma peça de
`ui/`, para e espera a unidade de desenho.

**Orçamento de código alterado.** U1: ~170 linhas (o manifesto e os nomes ~30, `Caller` e o Worker
~45, `defineFields` e `fieldsOf` ~40, a checagem ~30, `AppCaller` e os índices ~25). U2: ~560 (as
tabelas, a política e o campo do convite ~50, o contrato e a falha ~60, a lista, a troca e o convite
no servidor ~170, o acesso e a passagem ~35, a tela ~200, as três issues ~45). U3: ~90 (a skill ~30,
o exemplo ~55, o documento ~5). Total da capacidade: ~820 linhas, abaixo do orçamento de [delivery
L2](../guides/delivery.md).

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Um app cujo `shared/operations.ts` exporta `fields = defineFields({ vendedor: 'Vendedor no sistema' })` sai da checagem com `fields: [{ name: 'vendedor', label: 'Vendedor no sistema' }]` no manifesto; um app sem `fields` sai sem a chave, e um manifesto antigo sem ela continua válido; um nome fora de `FieldName` (`'Vendedor'`, `'1x'`) ou um rótulo vazio ou acima de 40 caracteres reprova o passo `manifesto` com `MANIFEST_INVALID` e o caminho do erro | `packages/app/src/check/check.test.ts`, "o manifesto leva os campos da pessoa" | must |
| 2 | U1 | O handler recebe `caller.fields` com cada campo que a versão declara: o valor que a plataforma mandou, ou `null` quando não veio; um nome que a versão não declara, mandado pela plataforma, não chega ao handler; quem constrói (`BUILDER`) recebe todos os campos `null`; um app que não declara campos recebe `{}`; um campo declarado com nome de propriedade de objeto (`constructor`) e sem valor chega `null` | `packages/app-contract/src/runtime.test.ts`, "campos: o handler recebe só os declarados, null quando vazio" | must |
| 3 | U1 | `fieldsOf(caller, fields).vendedor` tem o tipo `string \| null`; ler `fieldsOf(caller, fields).outro`, que o app não declara, reprova o passo `tipos` com a linha; o Worker não sobe com um campo cujo nome `FieldName` recusa | `check.test.ts`, "ler um campo não declarado falha em tipos"; `runtime.test.ts`, "campos: nome inválido não sobe" | must |
| 4 | U1 | `GET /api/caller` continua respondendo só `personName` e `access`: nenhum campo vai ao navegador | `runtime.test.ts`, "GET /api/caller: quem chama e como detém o app" (o caso de hoje, com campos no `caller`) | must |
| 5 | U1 | O dispatcher passa ao Worker o `caller` com os campos que o Hub respondeu (`AppCaller.fields`); uma resposta do Hub com um nome fora de `FieldName`, um valor vazio ou acima de 100 caracteres, ou mais de 20 campos, é recusada pelo esquema e o app não roda | `apps/edge/src/dispatcher.test.ts`, "o caller leva os campos ao app" | must |
| 6 | U2 | `listAppAccess` traz `fields` (nome e rótulo) da versão publicada, os valores de cada pessoa (`AppAccessRow.fields`) e os de cada convite aberto (`AppAccessInvitation.fields`), só com os nomes que a versão declara; antes do primeiro Publicar, `fields` vazio; o membro lê a lista com os valores | `apps/server/src/hub/projects/app-access.test.ts`, "a lista traz os campos" | must |
| 7 | U2 | `PATCH …/access/{personId}` com `{ fields: { vendedor: '10' } }`, por dono ou administrador, responde 200 com a linha e o valor; `{ fields: { vendedor: null } }` apaga; um corpo só com `role` deixa os campos como estão, e só com `fields` deixa o papel; um nome que a versão publicada não declara responde 409 `APP_FIELD_UNKNOWN` e nada é gravado; um valor vazio depois de aparar, acima de 100 caracteres, ou um corpo sem `role` e sem `fields` responde 400 `REQUEST_MALFORMED`; desenvolvedor ou membro recebe 404 `NOT_FOUND`, igual a uma pessoa que não existe (S10); outra empresa, 404 | `app-access.test.ts`, "os campos: trocar, apagar e as recusas" | must |
| 8 | U2 | O valor de um campo que uma versão nova deixa de declarar fica na linha, inerte: some da lista e do `caller`; uma versão que volta a declará-lo o traz de volta; trocar outro campo não o apaga | `apps/server/src/hub/apps/app-access-journey.test.ts`, "o campo que a versão deixa de declarar" | must |
| 9 | U2 | `inviteToApp` com `{ email, role, fields: { vendedor: '10' } }` grava o convite com os campos; aceitar escreve a linha de `app_access` com os mesmos campos, numa transação com o aceite; um nome não declarado responde 409 `APP_FIELD_UNKNOWN` e nada é gravado; a mesma chave de tentativa com outros campos responde `IDEMPOTENCY_CONFLICT`; um convite aberto antes da capacidade (sem `app_fields`) aceita com `{}` | `apps/server/src/hub/identity/invitation-app.test.ts`, "o convite leva os campos" | must |
| 10 | U2 | O login do convite não escreve uma linha de `app_access` cujos campos diferem dos do convite que ele nomeia: o `INSERT` direto com outro valor é recusado pela política (`42501`) | `apps/server/src/hub/projects/tables.test.ts`, "o acesso a um app: o convite escreve só a linha que nomeia" (o caso dos campos) | must |
| 11 | U2 | Pela porta pública da passagem, com o dispatcher de teste: a pessoa com papel `vendedor` e campo `10` chama o app publicado e o `caller` traz `fields: { vendedor: '10' }`; trocado para `20`, a chamada seguinte traz `20`; apagado, `{}`; um membro e a Prévia trazem `{}`; uma linha com valores inertes de versões antigas manda só os nomes que a versão publicada declara | `app-access-journey.test.ts`, "os campos da pessoa na chamada seguinte" | must |
| 12 | U2 | Nenhum registro do servidor leva o valor de um campo (S41): a recusa `APP_FIELD_UNKNOWN` leva o nome do campo nos detalhes, nunca o valor; o registro do pedido de troca e de convite não leva o corpo | `app-access.test.ts`, "o registro não leva o valor" | must |
| 13 | U2 | Em Quem usa o app, para dono e administrador, cada linha de pessoa mostra, sob o papel, um campo de texto por campo declarado, com o rótulo do app e o nome acessível "<rótulo> de <nome>"; mudar o valor e sair do campo ou tocar Enter manda o `PATCH` só com esse campo e a linha mostra "Salvo"; esvaziar manda `null`; o formulário **Dar acesso** traz os campos, que vão com o convite e a chave de tentativa (W24); a linha do convite pendente mostra "<rótulo>: <valor>"; `APP_FIELD_UNKNOWN` mostra a frase e relê a lista; um app sem campos mostra a tela de hoje | `apps/web/src/hub/projects/access.test.tsx`, "os campos: a dona digita, salva e convida com eles" e "a troca de campo recusada" | must |
| 14 | U2 | O desenvolvedor e o membro veem os valores como texto, sem campo de texto e sem formulário; o construtor (membro) aparece com "Todos os papéis" e sem campos | `access.test.tsx`, "o membro vê os campos sem mudar" | must |
| 15 | U2 | A 390 px os campos descem para baixo do nome com o papel, e a página não rola de lado (V18); o estado com campos entra na varredura | `apps/web/sweep-app-states.ts` (o estado com campos), pela varredura de `layout.test.ts`; captura de QA a 390 px | must |
| 16 | U2 | A página do convite diz para qual e-mail ele é (#761); depois de criar a senha, a frase pede o toque em **Aceitar convite** em vez de dizer que a pessoa já entrou (#760) | `apps/web/src/hub/identity/invitation.test.tsx`, "o convite diz o e-mail" e "a senha criada pede o aceite" | must |
| 17 | U2 | QA percorre o roteiro de uso nos dois temas, a 1366 e a 390 px | relatório de QA ([testing T25](../guides/testing.md)) | should |
| 18 | U3 | O pedido ao modelo num turno do Builder leva, pela skill `conexus-data`: declarar os campos da pessoa com `defineFields` ao lado de `defineRoles`, com o rótulo em português; ler com `fieldsOf`; o papel que vê só o seu filtra cada leitura pelo campo, passado como parâmetro; campo `null` não mostra nada e a tela diz por quê; quem constrói e o papel que vê tudo não filtram; o valor nunca vem da entrada da operação; a mensagem final diz qual campo Quem usa o app pede; o texto novo da seção Roles e o exemplo não nomeiam sistema algum | `packages/app/src/skills.test.ts`, "a skill ensina os campos da pessoa" (as frases no texto da seção Roles e o exemplo de `references/` que passa na checagem de tipos do starter) | must |
| 19 | U3 | O exemplo de `references/` declara um campo e filtra por ele: rodado pelo Worker do contrato com um `caller` de cada tipo, o papel restrito com valor lê só as suas linhas, sem valor lê nenhuma, e o papel amplo e quem constrói leem todas | `packages/app/src/skills.test.ts`, "o exemplo filtra pelo campo" | must |
| 20 | U3 | No primeiro turno real depois da versão publicada (T14), o Builder escreve `defineFields` e `fieldsOf` na máquina e a checagem passa | o roteiro de uso, passo 1, conferido por firstmate ([delivery L17](../guides/delivery.md)) | should |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Quem usa o app, a linha da pessoa com os campos (`…/access`) | O app acabou de declarar campos: cada linha mostra os campos vazios, com o rótulo | App sem campos: a linha de hoje; ninguém dado ao app: só os membros, como hoje | A lista em esqueleto, como hoje; enquanto salva, o campo fica desabilitado | A falha de leitura da lista, como hoje; a gravação que falha mostra a frase do código sob a linha (`Refusal`) e o campo volta ao valor salvo | A pessoa que o Hub não encontra mais (`NOT_FOUND`): a frase e a lista relida, como o papel hoje | Desenvolvedor e membro: os valores como texto, sem campo de texto (W34, a ação fora do papel diz quem pode: "Só o dono ou um administrador dá ou tira acesso ao app.") | `APP_FIELD_UNKNOWN` (uma versão nova tirou o campo): "Este campo não existe mais na versão publicada.", e a lista relida |
| Dar acesso, com os campos | O formulário com o e-mail, o papel e os campos vazios | App sem campos: o formulário de hoje | O botão ocupado, um pedido só (W24) | `MAIL_UNAVAILABLE` e os demais de hoje | `NOT_FOUND`, como hoje | Não aparece para desenvolvedor e membro, como hoje | `APP_FIELD_UNKNOWN`: a frase no campo; `IDEMPOTENCY_CONFLICT`, como hoje |
| A linha do convite pendente | "<rótulo>: <valor>" sob o papel; campo vazio não aparece | Convite sem campos: a linha de hoje | Como hoje | Como hoje | Como hoje | Desenvolvedor e membro leem os valores; sem **Cancelar convite** | Vencido: some da lista, como hoje |
| Aceitar o convite (`/invitations/<id>`) | A frase de hoje e, embaixo, "Convite para <e-mail>." | não se aplica | Como hoje | Como hoje | Como hoje | Outro e-mail entrou: como hoje | Senha criada: "Senha criada. Toque em Aceitar convite para entrar." (#760) |

As frases entre aspas são a proposta do cartão; o fundador aprova os textos das telas no fim
([delivery L23](../guides/delivery.md)). Nenhuma célula declara "sem detalhe": cada estado mostra o
que a pessoa precisa.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `Manifest.fields` (`name`, `label`) | U1, a checagem (`packages/app/src/check/manifest.ts`), de `fields` em `shared/operations.ts` | U2, `hub/apps/versions.ts` (`publishedAccessOf`), para a lista, a troca e o convite |
| `AppAccessList.fields` | U2, `hub/projects/app-access.ts` (`readProjectAccess`) | U2, `apps/web/src/hub/projects/access.tsx` (os rótulos e quais campos mostrar) |
| `AppAccessRow.fields`, `AppAccessInvitation.fields` | U2, `app-access.ts` (`rowsOf`) e `identity/invitations.ts` (`appInvitationOf`), só os nomes declarados | U2, `access.tsx` (o valor do campo de texto; a linha do convite) |
| `projects.app_access.fields` | U2, `changeAccess` e a aceitação (`grant`) | U2, `hosts.ts` (`accessOf`), `rowsOf` |
| `auth.invitation.app_fields` | U2, `invitation-create.ts` (`written`) | U2, `invitation-response.ts` (`acceptedApp`), `invitations.ts` |
| `inviteToApp.body.fields`, `changeAppAccess.body.fields` | U2, `access.tsx` | U2, `app-access.ts`, `invitation-create.ts` |
| `AppAdmission.fields` | U2, `hosts.ts` (`accessOf`): os valores da linha de quem é `USER`, `{}` para quem constrói | U2, `handoff.ts` (`admitCall`), que monta o `caller` |
| `AppCaller.fields` | U2, `handoff.ts` | U1, o dispatcher (`apps/edge`), que passa ao Worker; o runtime do app (`seenBy`) |
| `Caller.fields` | U1, o runtime (`seenBy`), só os nomes declarados, `null` quando vazio | U1, `fieldsOf`; U3, o código que o Builder escreve |

**O desenho de caixas.** O produto antigo não tinha pessoa de app nem vínculo (estudo anterior,
busca em `conexus-os@e0353c36`), então não há captura a seguir. A tela é a de hoje: os campos entram
na coluna Papel, sob o papel, como o papel desce para baixo do nome no celular (`Cells` em
`access.tsx:40-58`). Nenhuma entrevista de forma do Impeccable rodou: a capacidade não cria tela,
só acrescenta um campo de texto a uma linha existente, com as peças de `ui/` de hoje.

```
1280 px, …/access (dono)
┌ ⌂ ─┬────────────────────┬───────────────────────────────────────────────────────────────┐
│    │ Vendedores ▾       │ Quem usa o app                                                │
│    │ Construir          │ Pessoa                         Papel                  Ações   │
│    │ Conversas          │ Ana Dona                       Todos os papéis                │
│    │ Sobre              │ ana@exemplo.com                                               │
│    │ Quem usa o app     │ João Silva                     [ Vendedor       ▾ ]   [Tirar  │
│    │ Integrações        │ joao@exemplo.com · desde 10/11 Vendedor no sistema     acesso]│
│    │                    │                                [ 10               ]           │
│    │                    │                                Salvo                          │
│    │                    │ maria@exemplo.com              Gestor                 [Cancelar│
│    │                    │ convite pendente · vence 12/11                         convite]│
│    │                    │ Dar acesso                                                    │
│    │                    │ E-mail [                    ]                                 │
│    │                    │ Papel  [ Vendedor ▾ ]                                         │
│    │                    │ Vendedor no sistema [       ]                                 │
│    │                    │ [ Dar acesso ]                                                │
└────┴────────────────────┴───────────────────────────────────────────────────────────────┘

390 px, …/access (dono)                390 px, …/access (membro)
┌──────────────────────────┐           ┌──────────────────────────┐
│ ☰  Quem usa o app        │           │ ☰  Quem usa o app        │
│ João Silva               │           │ Só o dono ou um adminis- │
│ joao@exemplo.com         │           │ trador dá ou tira acesso │
│ [ Vendedor          ▾ ]  │           │ João Silva               │
│ Vendedor no sistema      │           │ joao@exemplo.com         │
│ [ 10                  ]  │           │ Vendedor                 │
│ [ Tirar acesso ]         │           │ Vendedor no sistema: 10  │
│ maria@exemplo.com        │           │ maria@exemplo.com        │
│ convite pendente         │           │ convite pendente         │
│ Gestor                   │           │ Gestor                   │
└──────────────────────────┘           └──────────────────────────┘
```

Os nomes e e-mails do desenho são inventados (S40).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Trocar os campos (`changeAppAccess`, `PATCH`): a trava da empresa, a admissão `manageAppAccess`, a linha lida, a linha gravada | A trava da empresa (`admittedManager`, `app-access.ts:189`) serializa todo escritor, então a leitura da linha não precisa de trava própria; cada pedido muda só as chaves que manda, então campos diferentes não se apagam; a mesma chave fica com a última, como o papel hoje | Uma transação só (D22): nada fica pela metade | O banco do Hub: 503 `DATABASE_UNAVAILABLE`; a tela mostra a frase e o campo volta ao valor salvo | O registro do pedido por rota, estado e código, sem o corpo; `APP_FIELD_UNKNOWN` com o nome do campo | 7, 8, 12, 13 |
| Convidar com os campos (`inviteToApp`): o convite com `app_fields` pelo adaptador, depois o e-mail | A chave de tentativa e a trava da empresa, como hoje; a mesma chave com outros campos: `IDEMPOTENCY_CONFLICT` (`sameInvited` compara os campos) | Como hoje: o convite gravado e o e-mail que falha seguem o caminho de hoje | O banco do Hub: 503; o serviço de e-mail: `MAIL_UNAVAILABLE`, como hoje | Como hoje, sem os valores | 9, 12 |
| Aceitar o convite de app (`acceptedApp`): a linha de `app_access` com o papel e os campos, e o aceite | Como hoje (a trava da empresa e a revisão do convite) | Uma transação; a política `invitation_insert` recusa uma linha com campos diferentes dos do convite | O banco do Hub: 503, como hoje | Como hoje | 9, 10 |
| A migração das duas colunas | — | Uma transação por migração (D9) | O banco: `migrate` falha e o Hub não sobe sem ela (D9) | O registro de `migrate` | 6, 9, 10 |
| Chamar o app (`checkAppCall`): só leitura | — | — | O banco do Hub: como hoje | Como hoje, sem os valores | 11 |

## A tabela de referência

A tabela do estudo das referências de 2026-11-10, com a unidade e o arquivo novo de cada linha.

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Onde mora "vê só o seu": no código do app, com a identidade que o servidor entrega | U3 | `packages/app-contract/src/runtime.ts:156-173` (o `caller` de `ctx.props`, o papel trancando a operação antes da entrada); `apps/server/src/hub/apps/handoff.ts:184-188` (o Hub monta o `caller`); `packages/app/skills/conexus-data/SKILL.md:43`; `references/handlers.ts:54-67` (`ownerOf`) | `dyad@902829f` `src/prompts/neon_prompt.ts:161-168,237`; `chef@d8a6cb6` `chef-agent/prompts/solutionConstraints.ts:24-46`; Mitra, `conexus-os@729bdc5d` `docs/research/mitra/full-study.md:1659-1660`; `budibase@624d68a` `packages/server/src/threads/query.ts:116-121` | Com uma conexão de servidor, a autorização mora no código do servidor e nos filtros do SQL, com o usuário que a plataforma entrega | nativo: já existe; a skill passa a dizer como filtrar pelo campo | | 2026-11-10: "Só isso protegeria. ... o builder é o que vai fazer o código" | — |
| O app declara os campos da pessoa | U1 | `packages/app-contract/src/manifest.ts:35-41` (`roles`); `packages/app/src/operations.ts` (`defineRoles`); `packages/app/src/check/manifest.ts:52-58,159-171` | `budibase@624d68a` `packages/server/src/utilities/users.ts:22-54` (`getFullUser` junta o usuário global e as colunas próprias do usuário no app, lidas em `{{ user.<coluna> }}`); Retool, user attributes (página pública lida em 2026-11-10) | O app ou o administrador nomeia o atributo; a consulta o lê do usuário atual | embrulhado: `fields` no manifesto com a forma de `roles`, e `defineFields` como `defineRoles`; o nosso acrescenta o campo ao contrato | | 2026-11-10: "1.a" | `packages/app/src/fields.ts` |
| Onde o valor mora: a linha de acesso do app | U2 | `apps/server/migrations/20261028231456_e18_app_access/migration.sql:2-9`; `apps/server/src/hub/projects/tables.ts:81-126`; `hosts.ts:72-108` (`accessOf`) | `budibase@624d68a` `packages/server/src/utilities/users.ts:22-54` (o usuário global mais os metadados do usuário no app); `better-auth@1.7.8` `additionalFields` de `member` (documentação de 1.7.7, `organization.mdx:2481-2483`), que não alcança a pessoa de app (`hosts.ts:85-92`) | O valor por app fica na linha da pessoa naquele app | nativo: uma coluna `jsonb` com restrição, pelo Drizzle | | 2026-11-10: "1.a" | — |
| Quem digita, e digitar | U2 | `app-access.ts:201-230` (`changeAccess`); `identity/admission.ts:96` (`manageAppAccess`) | `tooljet@aa67409` `server/src/modules/organization-users/controller.ts:111-113` e `server/src/entities/user_details.entity.ts:30-32`; `budibase@624d68a` `packages/server/src/api/routes/user.ts:28-32`; Retool, Settings > Users; Auth0 `app_metadata` ("o usuário não edita") | O administrador digita o valor na tela de usuários; a pessoa não muda o próprio | nativo: um campo de texto ao lado do papel, com a mesma admissão do papel | | 2026-11-10: "2.a" | — |
| O valor viaja no convite | U2 | `hub/identity/organization.ts:39-45` (`projectId`, `appRole`); `invitation-create.ts:210`; `invitation-response.ts:151-170,203,244` | `@better-auth/core@1.7.8` `dist/db/type.d.mts:29` (o tipo `json` de um campo extra); `@better-auth/drizzle-adapter@1.7.8` `dist/index.mjs:550` (`supportsJSON` no PostgreSQL) e `@better-auth/core@1.7.8` `dist/db/adapter/factory.mjs:128` (sem `supportsJSON`, o objeto vira texto) | O campo extra do convite guarda um objeto | remendo já aprovado: a peça feita à mão do convite de app ([boundaries](../reference/boundaries.md), "Hand-made piece", etapa 18, `I1`); a capacidade soma um terceiro campo do Hub, `app_fields`, pelo mesmo caminho | `better-auth` 1.7.8: a da etapa 18 (`invitation-app.test.ts`, "o convite de um app: aceitar não faz membro, e leva ao app"); critério 9 | etapa 18, `I1` (2026-10-28); nada novo | — |
| O app lê o valor do `caller` | U1, U2 | `packages/app-contract/src/props.ts:9-15`; `runtime.ts:52-57` (`seenBy`); `packages/hub-api/src/apps.ts:23-29` (`AppCaller`) | Retool, `current_user.metadata.<atributo>` ("prevent query variable spoofing is on by default"); `budibase@624d68a` `threads/query.ts:116-121` (o usuário do servidor por último); `twenty@b76d0217` `packages/twenty-server/src/engine/permissions/rls/utils/build-row-level-permission-record-filter.util.ts:47-83` (o valor do membro resolvido no servidor) | O servidor entrega o valor; o navegador não o troca | nativo: `Caller.fields`, filtrado por `seenBy` como o papel | | 2026-11-10: "1.a 2.a" | — |
| Campo vazio não mostra nada | U1, U3 | — | `twenty@b76d0217` `build-row-level-permission-record-filter.util.ts:144-156` ("Dropping an unsatisfiable predicate would lift the restriction") | Sem o valor do membro, a regra não deixa passar nada | nativo: `null` no `caller` e a regra da skill | | não precisa | — |
| Ler um campo não declarado reprova a checagem | U1 | `packages/app/src/connectors.ts` (`connectorsOf`, o cliente tipado pelo que o app declara; um conector não declarado falha em tipos) | TypeScript, o tipo derivado da declaração | O cliente só tem o que foi declarado | nativo: `fieldsOf` tipado por `fields`, como `connectorsOf`; o runtime entrega `null` a um nome não declarado | | não precisa | `packages/app/src/fields.ts` |
| Entrar como vendedor de teste | U2 | `hosts.ts:85-92` (só quem não é membro chega a `app_access`, e só no publicado) | — | — | nativo: o convite de hoje, com um segundo e-mail, mais os campos | | não precisa | — |
| Quem constrói vê tudo | — | `hosts.ts:85-86` (o membro é `BUILDER`) | — | — | nativo, mantido; `fields` vazio | | não precisa | — |
| Login de banco por pessoa e regra por linha no banco | fica de fora | `platform/copy-sql.ts:175-188` (`grantCopy`, `SELECT` na cópia inteira) | nenhuma: `appsmith@fd78f12` `PostgresPlugin.java:1198-1219`, `budibase@624d68a` `integrations/postgres.ts:53-54,91-96`, `lowcoder@81f1134` `QueryExecutionServiceImpl.java:72-73`: uma credencial por fonte | Ninguém cria um login por pessoa | nativo: o login de execução do Projeto, como hoje (decisão 0043); o login por pessoa fica de fora | | 2026-11-10: "Cara, é complicação demais" | — |
| O campo no usuário do Better Auth | fica de fora | `hub/identity/tables.ts:70-77` (a empresa vê um usuário que é membro, convidou ou tem `app_access` nela: o usuário é um só para todas as empresas, inferido dessa política) | `better-auth@1.7.8` `additionalFields` no `user` (documentação de 1.7.7, `database.mdx:623,680-690`) | Um campo do usuário vale em toda parte | nativo: o campo fica na linha de acesso, não no usuário; fica de fora | | o João pode ser o 10 numa empresa e o 7 em outra | — |
| Escolher o vendedor numa lista da cópia | fica de fora | — | — | — | nativo: digitar, como Retool, ToolJet e Budibase; a lista fica de fora | | 2026-11-10: "2.a" | — |
| O valor para todos os apps da empresa | fica de fora | — | Retool e ToolJet (atributo na pessoa da organização) | Um atributo da pessoa vale em todos os apps | nativo: o valor por app; o da empresa fica de fora | | 2026-11-10: "1.a" | — |
| Revisão automática de leitura sem filtro | fica de fora | — | `dyad@902829f` `src/prompts/security_review_prompt.ts:9-16`; Lovable, a varredura profunda (página lida em 2026-11-10) | Um modelo revisa o código | nativo: a skill, o exemplo e a conferência da Capacidade 3; a revisão fica de fora | | 2026-11-10: "eu não começaria tão complicado assim. A menos que no futuro, por exemplo, vire uma necessidade." | — |

**A medida do transplante.** Nenhuma peça vem do produto antigo: ele não tinha pessoa de app nem
vínculo (estudo anterior, busca em `conexus-os@e0353c36`).

**A dívida.**

- Duas pessoas que gerenciam o acesso mudando o mesmo campo da mesma pessoa ao mesmo tempo: fica o
  último, como o papel hoje (`changeAppAccess` não confere revisão, [code C38](../guides/code.md)).
- Quem garante que o app filtra é o código que o Builder escreve; uma leitura nova sem filtro
  devolve tudo, como o Retool avisa ("A new query that omits the filter returns unfiltered data").
  A skill, o exemplo e a conferência da Capacidade 3 são o que a plataforma dá; a revisão automática
  fica de fora até virar necessidade.
- O comentário de `boundaries.md`, "Hand-made piece" do convite de app, diz "two Hub fields"; o
  fechamento o leva a três, com `app_fields` ([delivery L19](../guides/delivery.md)).

## U1 O app declara os campos da pessoa

**Base e modelo.** O `main` no ponto que a ordem decidir. Sonnet: estende um contrato que já tem a
forma (os papéis), com as assinaturas escritas abaixo.

### As linhas da tabela

- **O app declara os campos.** Ler `packages/app-contract/src/manifest.ts` inteiro (`RoleName`,
  `roles`, `connectors`, a nota de manifesto antigo), `packages/app/src/operations.ts` (`defineRoles`),
  `packages/app/src/check/manifest.ts:28-77,159-171` (`Answer`, `sharedOf`, `entryOf`, o manifesto),
  `packages/app/src/check/build.ts:30-40` (a entrada do Worker), `packages/app/src/index.ts`.
- **O app lê o valor do `caller`; campo vazio.** `packages/app-contract/src/props.ts`,
  `runtime.ts:44-57` (`seenBy`) e `:144-173` (`serveApp`), `packages/hub-api/src/apps.ts:22-30,80-100`.
- **Ler um campo não declarado reprova a checagem.** `packages/app/src/connectors.ts` (o modelo de
  cliente tipado pela declaração).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app-contract/src/manifest.ts` | Muda (`FieldName`, `FieldValue`, `fields`) | `packages/app`, `packages/hub-api`, `apps/server` |
| `packages/app-contract/src/{props,runtime,index}.ts` | Muda (`CallerFields`, `Caller.fields`, `Fields`, `serveApp` com `fields`, `seenBy`) | `packages/app`, `packages/hub-api`, os apps gerados |
| `packages/app/src/` | Cria `fields.ts` (`defineFields`, `fieldsOf`); muda `index.ts`, `check/manifest.ts`, `check/build.ts`, `check/check.test.ts`, `check/test-app.ts` se o app de teste precisar, e os testes que montam um `Caller` (`runtime.test.ts:21`, `client.test.ts:27`) | os apps gerados, pela máquina |
| `packages/hub-api/src/apps.ts`, `index.ts` | Muda (`AppCaller.fields`) | `apps/server` (`handoff.ts`), `apps/edge` |
| `apps/edge/src/`, `apps/edge/example/` | Muda só os ajudantes e os testes que montam um `caller` (`src/test-edge.ts:24`, `example/src/example.test.ts:5-11`), e o tipo de `props` do app de exemplo se ele repetir `Caller` | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** nada.

`packages/app-contract/src/manifest.ts`:

```ts
/** A person field of the app, as `defineFields` names it: the same shape as a role's name. */
export const FieldName = RoleName // the role's shape, one regex (code C26)
/** A field's value, as Quem usa o app keeps it: text, trimmed, never empty (an empty one is no value). */
export const FieldValue = z.string().trim().min(1).max(100)
/** How many fields an app may declare: the bound `roles` has (`.max(20)`), owned here for fields (read by the manifest and AppCaller). */
export const MAX_FIELDS = 20
// Manifest gains, beside `roles`, optional so a manifest before them stays valid (0019):
//   fields: z.array(z.strictObject({ name: FieldName, label: z.string().trim().min(1).max(40) }))
//     .max(MAX_FIELDS).refine((list) => unique(list.map(({ name }) => name))).optional()
```

`packages/app-contract/src/props.ts`:

```ts
/** The person's fields the version declares: the value given in Quem usa o app, or null. */
export type CallerFields = Readonly<Record<string, string | null>>
// Caller gains `fields: CallerFields`; the comment of Caller keeps "never an e-mail or a company".
```

`packages/app-contract/src/runtime.ts`:

```ts
/** The app's person fields, by name, with the label a person reads in Quem usa o app (as Roles). */
export type Fields = Readonly<Record<string, string>>
// serveApp(app: { operations; handlers; roles?: Roles; fields?: Fields })
// seenBy(declared: { roles: Roles; fields: Fields }, caller): the caller with
//   fields = each declared name → (Object.hasOwn(caller.fields, name) ? caller.fields[name] : null),
//   and nothing else, Object.hasOwn as for the role today (runtime.ts:53-54) (code C26: the one
//   place that decides what the app sees of the caller, for the role and for the fields)
// A declared name that FieldName refuses stops the Worker from starting, as a role the app names
//   without declaring does (lockOf).
```

`packages/app/src/fields.ts`:

```ts
/** Declares once the person fields the app reads (code C26): the check carries them to the manifest. */
export function defineFields<const F extends Fields>(fields: F): F
/** The caller's declared fields, typed by the declaration: a field not declared fails the check; `Object.hasOwn`, never `in`. */
export function fieldsOf<const F extends Fields>(
  caller: Caller,
  fields: F,
): Readonly<{ [K in keyof F & string]: string | null }>
```

`packages/hub-api/src/apps.ts`:

```ts
// AppCaller gains, required:
//   fields: z.record(FieldName, FieldValue).refine((all) => Object.keys(all).length <= MAX_FIELDS)
// The Hub sends only the values given; an absent name is an empty field. `satisfies z.ZodType<Caller>` holds.
```

A forma de cada coisa:

- **Estados.** Um campo é um valor ou `null`; nenhuma variante nova. `CallerAccess` não muda (C21).
- **Ids.** Nenhum id novo; `FieldName` é um nome, não um id, como `RoleName` (C23).
- **Donos.** `FieldName`, `FieldValue` e `MAX_FIELDS` em `manifest.ts`; o que o app vê do `caller`
  só em `seenBy` (C26).
- **Entrada externa.** O manifesto pelo `Manifest` (a checagem e o Hub); o `caller` que o
  dispatcher recebe do Hub pelo `AppCall` (C27).
- **Modelo.** `connectorsOf` e `defineConnectors` (`packages/app/src/connectors.ts`) cumprem C21,
  C23 e C26 e são o modelo de `fieldsOf`; `seenBy` é o modelo do filtro.

### As skills e a leitura

Das linhas de [stack](../reference/stack.md) dos pacotes que a unidade toca.

- `zod.dev/llms.txt` (`zod`, todos os pacotes): `z.record` com chave por regex e `refine`.
- `typescript-magician` (`typescript`): o tipo mapeado de `fieldsOf`.
- `cloudflare:wrangler` e `cloudflare:workers-best-practices` (`wrangler`, `apps/edge`): só para ler
  os testes do dispatcher que montam o `caller`.

### A ordem do trabalho

1. `FieldName`, `FieldValue`, `MAX_FIELDS` e `fields` no manifesto. Regras: C26, C27, C45.
2. `CallerFields`, `Fields`, `serveApp` com `fields` e `seenBy` com os campos; o Worker recusa um
   nome inválido ao subir. Regras: C21, C26, security S4.
3. `defineFields` e `fieldsOf` em `fields.ts`, exportados pelo índice. Regras: C11, C18.
4. A checagem: `Answer` com `fields`, `sharedOf` e `entryOf` levam `fields` ao `serveApp`, o
   manifesto com `fields`; `build.ts` passa `fields` ao `serveApp` do Worker. Regra: C26.
5. `AppCaller.fields` em `hub-api`; os testes de `apps/edge` que montam um `caller` passam a mandar
   `fields`.

### Como se prova

- Critérios 1 e 3: `packages/app/src/check/check.test.ts`, com o app de teste da checagem; falham
  hoje: o manifesto não tem `fields` e `fieldsOf` não existe.
- Critérios 2, 3 e 4: `packages/app-contract/src/runtime.test.ts`, pelo `fetch` do Worker; falha
  hoje: o `caller` não tem `fields`.
- Critério 5: `apps/edge/src/dispatcher.test.ts`, pelo dispatcher com o Hub de teste.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`.

### Parar se

- A checagem de tipos não recusar `fieldsOf(caller, fields).outro` com `fields` declarado `as const`
  pela forma de `defineFields`: parar e dizer; não trocar por checagem de texto.
- O dispatcher recusar a resposta do Hub por tamanho (`REPLY_CAP_BYTES`, 16 KB): parar e dizer o
  tamanho medido.

## U2 Quem usa o app guarda o vínculo

**Base e modelo.** O commit da U1. Sonnet: estende a tela, as rotas e a aceitação de hoje, com os
contratos abaixo.

### As linhas da tabela

- **Onde o valor mora.** `apps/server/src/hub/projects/tables.ts:81-126` (a tabela, a política
  `invitation_insert` em `:105-114`), `hosts.ts:62-122` (`AppAdmission`, `accessOf`),
  `hub/apps/handoff.ts:140-200` (`admitCall`, o `caller`), `hub/apps/versions.ts:285-302`
  (`publishedRolesOf`), `hub/projects/ports.ts` (`PublishedRolesOf`), `hub/apps/public.ts:26,49`.
- **Quem digita.** `hub/projects/app-access.ts` inteiro (`declared`, `projectAppsOf`, `rowsOf`,
  `readProjectAccess`, `admittedManager`, `changeAccess`), `packages/hub-api/src/app-access.ts`
  inteiro, `packages/hub-api/src/people-failures.ts:37-44` (`APP_ROLE_UNKNOWN`, o modelo da falha).
- **O valor viaja no convite.** `hub/identity/organization.ts:9-47`, `invitation-create.ts:78-87`
  (`sameInvited`) e `:190-260` (`written`, `checkInvited`), `invitation-response.ts:151-170`
  (`acceptedApp`) e `:190-250` (`acceptCommand`), `identity/invitations.ts:30-90` (`PendingRow`,
  `appInvitationOf`), `identity/tables.ts:300-350` (o convite e o check `invitation_kind`),
  [boundaries](../reference/boundaries.md), a entrada "Hand-made piece" do convite de app.
- **A tela.** `apps/web/src/hub/projects/access.tsx` inteiro, `queries.ts` (`sendAppRole`),
  `apps/web/src/hub/identity/invite-fields.tsx`, `invitation.tsx:40-55,255-270`,
  `apps/web/sweep-app-states.ts:36-60`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/migrations/` | Cria a migração gerada: `projects.app_access.fields jsonb NOT NULL DEFAULT '{}'` com `CHECK (jsonb_typeof(fields) = 'object')`; `auth.invitation.app_fields jsonb` com `CHECK (app_fields IS NULL OR project_id IS NOT NULL)`; a política `invitation_insert` com os campos | `migrate` |
| `apps/server/src/hub/projects/` | Muda `tables.ts`, `app-access.ts`, `hosts.ts`, `ports.ts` (`PublishedAccessOf`), `public.ts` | `main.ts`, `hub/apps`, `hub/identity` |
| `apps/server/src/hub/identity/` | Muda `organization.ts` (`appFields`), `tables.ts`, `invitation-create.ts`, `invitation-response.ts`, `invitations.ts`, `app-invitations.ts` (o tipo `ProjectApps`, `:18-45`, e `openAppInvitations`, `:97`, que monta as linhas de convite da lista) | `hub/projects` |
| `apps/server/src/hub/apps/` | Muda `versions.ts` (`publishedRolesOf` vira `publishedAccessOf`), `handoff.ts`, a linha do export em `public.ts` | `main.ts` |
| `apps/server/src/main.ts` | Muda a ligação de `publishedAccessOf`, se o nome passar por ela | — |
| `packages/hub-api/src/` | Muda `app-access.ts`, `people-failures.ts` (`APP_FIELD_UNKNOWN`), `index.ts` | `apps/server`, `apps/web` |
| `apps/web/src/hub/projects/` | Muda `access.tsx`, `queries.ts`, `access.test.tsx` | a rota do Projeto |
| `apps/web/src/platform/test-hub-access.tsx` | Muda (o `CARLA`, `changedRole` e `invitedToApp` com `fields`; a troca como `PATCH`) | os testes da tela |
| `apps/web/src/hub/identity/` | Muda `invite-fields.tsx` (os campos extras), `invitation.tsx` (#760, #761) e os testes | `hub/projects`, a rota do convite |
| `apps/web/sweep-app-states.ts` | Muda (o estado com campos) | `layout.test.ts`, `fields.layout.test.ts` |
| `docs/reference/boundaries.md` | Não muda nesta unidade; o fechamento soma `app_fields` à entrada | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** `changeAppAccess` como `PUT` com `{ role }` obrigatório
(vira `PATCH` parcial, servidor e tela juntos, C45); `publishedRolesOf` e `PublishedRolesOf` (viram
`publishedAccessOf` e `PublishedAccessOf`, que devolvem papéis e campos, C69); a segunda leitura da
empresa na aceitação de um convite de app (`invitation-response.ts:161` e `:246`, #457).

`packages/hub-api/src/app-access.ts`:

```ts
/** A person field the published version declares, with its label. */
const AppField = z.object({ name: FieldName, label: z.string() })
/** The values given to a person or an invitation: only declared names, never an empty value. */
export const AppFieldValues = z
  .record(FieldName, FieldValue)
  .refine((all) => Object.keys(all).length <= MAX_FIELDS)
// AppAccessRow gains fields: AppFieldValues; AppAccessInvitation gains fields: AppFieldValues
// AppAccessList gains fields: z.array(AppField), the published version's, none before Publicar
// inviteToApp: body { email, role, fields: AppFieldValues }; failures gain 'APP_FIELD_UNKNOWN'
// changeAppAccess: method 'PATCH', bodyLimit 4096,
//   body z.object({ role: RoleName.optional(), fields: z.record(FieldName, FieldValue.nullable()).optional() })
//     .refine((body) => body.role !== undefined || body.fields !== undefined)
//   summary 'Changes the role or the person fields of a person from outside the company in a Projeto’s app.'
//   failures ['NOT_FOUND', 'APP_ROLE_UNKNOWN', 'APP_FIELD_UNKNOWN', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE']
```

`packages/hub-api/src/people-failures.ts` (C48):

```ts
APP_FIELD_UNKNOWN: {
  category: 'USER', settles: true, status: 409,
  phrase: 'Este campo não existe mais na versão publicada.',
  action: 'Veja a lista de novo.', actionKind: 'NONE',
}
```

`apps/server/src/hub/projects/ports.ts`:

```ts
/** The roles and person fields the published version declares, with their labels (step 18, D). */
export type PublishedAccessOf = (
  tx: ReadTx,
  projectId: ProjectId,
) => Promise<{
  published: boolean
  roles: readonly { name: string; label: string }[]
  fields: readonly { name: string; label: string }[]
}>
```

`apps/server/src/hub/projects/hosts.ts`:

```ts
// AppAdmission's ADMITTED gains fields: AppFieldValues; accessOf answers { access, fields }:
// a member ({ kind: 'BUILDER' }, {}); a person given the app (USER with the row's role and, of the
// row's fields read now (S8), only the names the published version declares: what travels stays
// within MAX_FIELDS even when inert values pile up on the row). seenBy still decides what the
// handler sees, for the Prévia's version too (code C26).
```

`apps/server/src/hub/projects/tables.ts`: `appAccess.fields`, `jsonb`, não nulo, padrão `{}`,
lido pelo `AppFieldValues` na leitura (C27). A política `invitation_insert` ganha
`and coalesce(i.app_fields, '{}'::jsonb) = app_access.fields`.

`apps/server/src/hub/identity/organization.ts`: `invitation.additionalFields.appFields = { type:
'json', required: false, input: false }`, ao lado de `appRole`; `identity/tables.ts`:
`appFields: jsonb('app_fields')`. `ProjectApps.checkInvitation` (`identity/app-invitations.ts:18-45`) recebe `fields` e recusa um nome não
declarado com `APP_FIELD_UNKNOWN`, depois do papel; `ProjectApps.grant` recebe `fields`.

`changeAccess` (`app-access.ts`): sob `admittedManager`, cuja trava da empresa já serializa todo escritor, lê a linha (hoje é um `UPDATE … RETURNING` só, `:210-224`), confere o papel
(se veio) e cada nome de `fields` contra `publishedAccessOf`, e grava: o papel, se veio; os campos,
partindo dos guardados, com cada chave mandada posta ou, com `null`, tirada; os nomes guardados que a
versão não declara mais ficam (critério 8). A conta é TypeScript explícito sobre a linha decidida
(D16), numa transação (D22).

A forma de cada coisa:

- **Estados.** `AppAdmission` continua a união por `kind` (C21); os campos são valores, não
  estados.
- **Ids.** `PersonId`, `ProjectId`, `CompanyId`, `InvitationId` com a marca de hoje (C23).
- **Donos.** `AppFieldValues` em `hub-api`; os campos declarados só de `publishedAccessOf`; a
  regra "nome declarado" numa função de `app-access.ts`, ao lado de `declared` (C26); a frase de
  `APP_FIELD_UNKNOWN` em `people-failures.ts` (C48).
- **Entrada externa.** Os corpos por `inviteToApp` e `changeAppAccess`; a coluna `fields` e
  `app_fields` lidas por `AppFieldValues` (C27).
- **Modelo.** `changeAccess` e `checkInvitation` de hoje (admissão, Projeto vivo, papel declarado)
  cumprem C21, C23 e C26.

### As skills e a leitura

Das linhas de [stack](../reference/stack.md) dos pacotes que a unidade toca, cada skill carregada
inteira pelo construtor e pelo revisor.

- `better-auth-best-practices`, `better-auth-security-best-practices` e
  `organization-best-practices` (`better-auth`, `@better-auth/core`, `@better-auth/drizzle-adapter`,
  `apps/server/src/hub`): o campo extra `json` com `input: false`, escrito só pelo adaptador.
- `fastify-best-practices` (`fastify`, `apps/server/src`): a rota que vira `PATCH`.
- `orm.drizzle.team/llms.txt` (`drizzle-orm`) e a skill `drizzle` em `node_modules/drizzle-kit/skills/`
  (`drizzle-kit`): a coluna `jsonb`, o `check`, a política e a migração gerada.
- `neon:neon-postgres` (PostgreSQL): `jsonb`, `jsonb_typeof`, `ALTER POLICY`.
- `react-hook-form.com/docs` (`react-hook-form`) e o esquema do contrato (W23): os campos no
  formulário **Dar acesso**.
- `tanstack.com/query/latest/llms.txt` (`@tanstack/react-query`): a mutação da troca e a releitura
  (W10, W12).
- `zod.dev/llms.txt` (`zod`).

### A ordem do trabalho

1. **As colunas e a política.** `appAccess.fields` e `invitation.appFields` nas tabelas, a política
   `invitation_insert`, a migração gerada pelo `drizzle-kit`, só acrescentando (D5, D6). Nenhuma
   mudança em `database-grants.sql`: as permissões de `app_access` e de `invitation` são por tabela,
   e o instantâneo do catálogo não muda (D10, D11).
2. **O contrato e a falha.** `AppField`, `AppFieldValues`, as mudanças das quatro operações e
   `APP_FIELD_UNKNOWN`. Regras: C28, C45, C48.
3. **O que a versão declara.** `publishedAccessOf` em `versions.ts`, com `Manifest.parse(...).fields
   ?? []`; `PublishedAccessOf` em `ports.ts`; as ligações.
4. **A lista e a troca.** `rowsOf` com os campos declarados; `readProjectAccess` com `fields`;
   `changeAccess` como acima; `declaredFields(fields, names)` ao lado de `declared`. Regras: S7, S8,
   S9, S10, D16, D22.
5. **O convite.** `checkInvited` e `checkInvitation` com os campos; `written` grava `appFields`;
   `sameInvited` compara os campos; `appInvitationOf` os devolve, e `openAppInvitations` os leva à lista; `acceptedApp` os passa a `grant`, e
   a empresa lida uma vez só (#457). Regras: S12, C37.
6. **O acesso e a passagem.** `accessOf` devolve `{ access, fields }`, com só os nomes que `publishedAccessOf` declara; `admitToApp` os leva em
   `ADMITTED`; `admitCall` os põe no `caller` (`handoff.ts:187`). Regras: S4, S8.
7. **A tela.** Em `access.tsx`, `PersonRow` mostra, sob o papel, um `TextField` de `ui/` por campo de
   `list.fields`, com o valor da linha, salvo por `sendAppRole` (renomeado `sendAppAccess`) com só
   aquele campo quando muda e a pessoa sai do campo ou toca Enter; "Salvo" e `Refusal` como o papel.
   Quem não gerencia lê "<rótulo>: <valor>". `GiveAccess` passa os campos a `InviteFields`, que ganha
   uma lista opcional de campos de texto extras (`extra: readonly { name; label }[]`), mandados como
   `fields` sem as chaves vazias. `InvitationRow` mostra os valores. Regras: W23, W24, V18, V29, V31,
   V35.
8. **O convite, na página dele.** `invitation.tsx`: "Convite para <e-mail>." sob a frase de hoje
   (#761), com o `email` que `InvitationView` traz em `NEW` e `HAS_PASSWORD`
   (`packages/hub-api/src/companies.ts:75-77`) e, em `INVITED`, que não o traz, o e-mail da sessão,
   que é o mesmo endereço (só quem entrou com ele vê `INVITED`); nenhum contrato muda. As
   asserções de `invitation.test.tsx:132,139,149` mudam com a frase da #760; e "Senha criada. Toque em Aceitar
   convite para entrar." no lugar de "Senha criada. Você já entrou." (#760).
9. **A varredura.** `sweep-app-states.ts` ganha o estado da lista com campos, para dono e para
   membro.

### Como se prova

- Critérios 6, 7 e 12: `apps/server/src/hub/projects/app-access.test.ts`, pela porta HTTP do Hub de
  teste, com a versão publicada declarando `vendedor`; falha hoje: a lista não tem `fields` e a rota
  é `PUT` com `role` obrigatório.
- Critérios 8 e 11: `apps/server/src/hub/apps/app-access-journey.test.ts`, pela passagem e o
  dispatcher de teste, como "papel no app, troca, tirar, na chamada seguinte"; falha hoje: o
  `caller` não tem `fields`.
- Critério 9: `apps/server/src/hub/identity/invitation-app.test.ts`, pelo convite e pela aceitação
  de verdade.
- Critério 10: `apps/server/src/hub/projects/tables.test.ts`, com o login do convite e um `INSERT`
  com outro valor; falha se a linha da política sair.
- Critérios 13 a 16: os testes de tela citados e a varredura.
- T27: as linhas novas de `app-access.ts`, `hosts.ts`, `invitation-create.ts`,
  `invitation-response.ts` e `organization.ts` passam pelas mutações (`npm run quality`), e o
  relatório conta cada sobrevivente, os três de `additionalFields` que a #457 deixou inclusive.
- Local: os testes tocados, `npm run typecheck`, `npm run lint`, e
  `node scripts/check-migrations.ts` sobre a migração.

### Parar se

- O adaptador do Better Auth gravar `app_fields` como texto, ou ler de volta uma string: parar e
  dizer (o `supportsJSON` do adaptador do PostgreSQL diz que não).
- O `drizzle-kit` gerar a política nova como `DROP` e `CREATE` com uma janela sem política: parar e
  escrever a troca como `ALTER POLICY` na mesma migração, justificado (D5).
- O instantâneo do catálogo mudar: parar; uma mudança de permissão vai num pull request só dela,
  com a palavra do fundador (D11).
- `InviteFields` não aceitar campos extras sem mudar a forma do convite da empresa: parar e dizer;
  o convite da empresa não muda.
- A página do convite não ter o e-mail da sessão em `INVITED`: parar e dizer; mudar
  `InvitationView` e `invitation-reads.ts` é contrato, que volta ao cartão (L7).

## U3 O Builder aprende o vínculo

**Base e modelo.** O commit da U2, com o `main` trazendo os consertos da Capacidade 3 que mexem em
`conexus-data`. Sonnet: texto de skill e um exemplo tipado.

### As linhas da tabela

- **Onde mora "vê só o seu".** `packages/app/skills/conexus-data/SKILL.md:26-43` (Handlers e Roles),
  `references/operations.ts` e `references/handlers.ts:54-90` (`ownerOf`, `listTickets`,
  `countTickets`, `getTicket`), `packages/app/src/skills.test.ts` (como os exemplos passam na
  checagem de tipos do starter), `docs/explanation/app-package.md:40-50`.
- Referência: `dyad@902829f` `src/prompts/neon_prompt.ts:237` ("Filter by the authenticated user in
  server code"); `twenty@b76d0217` `build-row-level-permission-record-filter.util.ts:144-156`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/app/skills/conexus-data/SKILL.md` | Muda a seção Roles e a linha de `caller` em Handlers | o Builder, pelo servidor |
| `packages/app/skills/conexus-data/references/` | Muda `operations.ts` e `handlers.ts` (um campo e o filtro) | `skills.test.ts` |
| `packages/app/src/skills.test.ts` | Muda (as frases e o exemplo rodado) | `npm test` de `packages/app` |
| `docs/explanation/app-package.md` | Muda a linha de `conexus-data` ("roles, person fields, connectors") | — |

### Os contratos que a unidade cria

**Apaga do `main`, antes de acrescentar:** a frase de `SKILL.md:43` que filtra só por
`caller.personId` passa a dizer como filtrar por um campo da pessoa; `ownerOf` do exemplo dá lugar ao
filtro pelo campo.

O texto da skill, na seção Roles (em inglês, como a skill): o app que mostra a cada pessoa só as suas
linhas, quando o plano diz que uma linha é de alguém de um sistema da empresa, declara um campo da
pessoa com `defineFields` em `shared/operations.ts`, com o rótulo que a pessoa da empresa lê em Quem
usa o app; lê com `fieldsOf(caller, fields)`; o papel que vê só o seu passa o valor como parâmetro em
cada leitura; um valor `null` não mostra nenhuma linha e a tela diz que falta o vínculo; quem
constrói e o papel que vê tudo não filtram; o valor nunca vem da entrada da operação; a mensagem
final diz qual campo Quem usa o app pede e que sem ele a pessoa não vê nada. Nenhum nome de sistema.

O exemplo, em `references/handlers.ts` (o começo do código):

```ts
// The role locks the operation; the field narrows the rows. A manager and a builder see every
// ticket; an agent sees the tickets of the area given to them in Quem usa o app, and none without it.
function areaOf(caller: Caller): { kind: 'ALL' } | { kind: 'AREA'; area: string } | { kind: 'NONE' } {
  if (can(caller.access, 'manager')) return { kind: 'ALL' }
  const { area } = fieldsOf(caller, fields)
  return area === null ? { kind: 'NONE' } : { kind: 'AREA', area }
}
```

com `fields = defineFields({ area: 'Área de atendimento' })` em `references/operations.ts`; a coluna
`area` entra por uma migração nova, `002_ticket_area` (`ALTER TABLE ticket ADD COLUMN area text`),
nunca editando a `001_ticket`, como o próprio exemplo manda; `createTicket` grava a área de quem
abre, `fieldsOf(caller, fields).area` (nula para quem constrói ou para o gerente sem área);
`listTickets`, `countTickets`, `getTicket` e `changeTicketStatus` leem `areaOf`: `NONE` devolve a
lista vazia, `{}` em `getTicket` e nenhuma linha mudada em `changeTicketStatus`, sem ler o banco;
`AREA` passa `area` como `$n`; `ALL` passa `NULL`. `ticketSummary` e `ticketsByWeek` são só do
gerente (`MANAGERS`) e ficam sem filtro, com um comentário que diz por quê.

A forma de cada coisa:

- **Estados.** O alcance do exemplo é a união `ALL`, `AREA`, `NONE` por `kind` (C21, C22: a
  ausência do valor é um estado, não um texto vazio).
- **Donos.** A regra está na skill; o exemplo a mostra uma vez (C26).
- **Modelo.** O exemplo de hoje (`references/handlers.ts`) cumpre C21 e C26.

### As skills e a leitura

- `typescript-magician` (`typescript`): o exemplo tipado pelo starter.
- `mastra` não se aplica: a unidade não toca `apps/server/src/builder`; a skill chega ao Builder
  pelo servidor (`readSkills`), e o pacote chega à máquina pelo molde que a publicação refaz
  (`.github/workflows/publish.yml`, o trabalho `template`).

### A ordem do trabalho

1. O exemplo: `operations.ts` com `fields`, `handlers.ts` com `areaOf` e as três leituras.
2. O texto da skill, na seção Roles, e a linha de `caller` em Handlers.
3. `skills.test.ts`: as frases e o exemplo rodado pelo Worker do contrato com um `caller` de cada
   tipo.
4. A linha de `app-package.md`.

### Como se prova

- Critério 18: `packages/app/src/skills.test.ts`, as frases no texto que o servidor entrega ao
  Builder e o exemplo na checagem de tipos do starter; falha hoje: a skill não fala de campos.
- Critério 19: `skills.test.ts`, o exemplo rodado com `serveApp` e um `db` de teste; falha hoje: o
  exemplo filtra por `personId`.
- Critério 20: o primeiro turno real, no roteiro de uso (T14).

### Parar se

- Um conserto da Capacidade 3 ainda aberto mexer em `conexus-data/SKILL.md`: esperar o merge dele e
  trazer o `main` (merge, nunca rebase).
- O exemplo rodado precisar de um banco de verdade para provar o filtro: parar e dizer; a prova do
  filtro é a do `db` de teste, como `runtime.test.ts` faz.
