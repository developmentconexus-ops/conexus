# Os conectores por classe

Trilha Dados, depois da etapa O conector no padrão novo do Lago 2. A pergunta: "Eu ligo o HubSpot, o
Google, a Microsoft, o TOTVS e o Sicoob pela tela do Conexus, sem colar chave onde o sistema tem
login, o Assistente lê cada um ao vivo, o que é da empresa chega ao lago, e o que é meu, como o meu
e-mail, só eu leio?"

Rascunho de 2026-11-24, lido no `main` em `2a16091d`. A página ainda não está aprovada. Ela espera
num pull request de rascunho (delivery L5), ao lado do cartão do Lago 2, que está em construção
(a palavra do fundador sobre quando começar, 2026-11-24: "ao lado da parte 1 do Lago 2"). A NF-e saiu
deste cartão em 2026-11-24 e ficou em espera, com as palavras dele em "Fica de fora".

**Linhas da tabela de referência sem referência.** Duas, e cada uma pede a palavra dele na página.

- **Linha 1, a marca de origem de cada corpo do dublê.** Nenhuma referência marca, no mesmo arquivo,
  um corpo escrito da documentação e um corpo gravado do serviço. O Airbyte os separa por pasta
  (`unit_tests/resource` à mão, `integration_tests/expected_records.jsonl` da conta real). A marca é
  nossa e entra pela decisão 2 abaixo.
- **Linha 17, o Sicoob.** A documentação oficial técnica fica atrás do portal e não abriu. A base
  vem de uma biblioteca de terceiro lida e do que a Nekt pede para o Banco do Brasil e o Bradesco.
  Entra pela decisão 5.

Os estudos ficam fora do repositório (delivery L21). `EST/conectores-por-classe` é o relatório
`data/conexus-conectores-por-classe/report.md` do firstmate e `NT/<arquivo>` é uma nota da pasta
`notas/` dele. `EST/respostas` é `data/conexus-conectores-respostas/report.md`, `EST/base` são as duas
leituras de 2026-11-24 que escrevem a base sem conta, `base/hubspot.md` e `base/totvs.md`, e
`QUADROS` é `data/conexus-quadros-manha/report.md`, onde estão as palavras exatas do fundador.

As siglas das referências, todas lidas em 2026-11-24 nos commits abaixo:

- `AB` airbyte `82db089b`, `NG` nango `c607ff39`, `N8` n8n `7a384b35` e `MD` a documentação do
  `@mastra/core` 1.83.0 instalado, na estante local de referências.
- `MT` MeltanoLabs `tap-hubspot` `4903d25a`, `SI` singer-io `tap-hubspot` `38094fde`, `CP`
  ComposioHQ `composio` `2916f70a`, `SP` HubSpot `HubSpot-public-api-spec-collection` `5c00e33c`.
- `TT` totvs `ttalk-standard-message` `b462bd0e`, sem licença: só leitura, nada dele entra no
  repositório (delivery L21, security S40).
- `NK` o texto da Nekt, `https://docs.nekt.com/llms-full.txt`, baixado em 2026-11-24 com 199.682
  linhas; `NK:<n>` é a linha.
- `HS` as páginas e as OpenAPI públicas de `developers.hubspot.com`, `TDN` as páginas públicas de
  `tdn.totvs.com`, lidas em 2026-11-24.
- `C/` é o `main` em `2a16091d`. `L2/` é o cartão do Lago 2,
  `docs/steps/a-primeira-copia-chega-ao-lago.md`, citado pelo nome da unidade ou da seção, porque o
  número de linha dele muda a cada emenda.

**Antes da construção.**

1. O GC1 e o GC2 do Lago 2, mesclados em `2a16091d`: a classe da credencial, a sessão do kit, o
   número exato e a skill gerada (U16), a pasta nova do Sankhya (U17) e a do Mercado Livre (U18).
   Toda unidade deste cartão escreve sobre essa forma.
2. Para uma tabela no lago, o G1 do Lago 2 mesclado (a U3 dele, a declaração por tabela); para ela
   chegar ao lago, a parte 1 do Lago 2 no ar. Sem eles, a leitura ao vivo de cada conector já vale.
3. As respostas do fundador, todas dadas (2026-11-24, `QUADROS`): as da página abaixo e a lista de
   acessos. Ficam as cinco decisões da página, que ele aprova com o cartão.
4. A gravação de cada conector (testing T29) é **autorizada por ele, uma a uma, quando chegar**
   ("Autorizo cada uma quando chegar"). A unidade para e pede a palavra antes de gravar. A gravação
   traz as respostas reais com os valores trocados por inventados e as quatro medidas da classe da
   credencial (`NT/hubspot.md` 2): renovar duas vezes e comparar; usar o refresh antigo; usar o
   token antigo antes do fim; duas renovações juntas. Até lá a classe é exclusiva (0077).

## A página do fundador

**No fim deste cartão** você liga o Google, a Microsoft, o HubSpot, o TOTVS e o Sicoob pela página **Integrações**, cada um
com o login dele. O que o sistema tem de login você não cola. O que a empresa copia chega ao lago. O que é de uma
pessoa, como o e-mail dela, fica ao vivo e só ela lê.

- **Gmail com Agenda.** Cada pessoa da empresa liga a própria conta Google. O Assistente dela lê os
  e-mails e a agenda dela, e de mais ninguém. Nada disso é copiado.
- **A caixa de um setor, como `financeiro@`.** A empresa liga uma caixa pelo login da própria conta
  do setor. Os e-mails dela chegam ao lago, como na Nekt. É uma ligação da empresa, de uma caixa que
  a empresa nomeou; a caixa de cada pessoa continua fora do lago.
- **Google Drive.** A empresa liga uma conta. O Assistente acha um arquivo e lê o texto de um
  documento. Cada planilha escolhida chega ao lago como tabela, uma por aba.
- **E-mail do Outlook e agenda do Outlook.** Como o Gmail e a Agenda: cada pessoa liga a sua.
- **SharePoint.** A empresa liga. O Assistente acha e lê arquivos. As listas e as planilhas do Excel
  chegam ao lago.
- **HubSpot.** Você clica **Ligar**, entra no HubSpot e volta. O Assistente lê contatos, empresas e
  negócios e grava uma nota num contato só depois do seu sim, no cartão. Os contatos, as empresas e
  os negócios chegam ao lago com os campos da sua conta. A base é construída agora, sem conta, pela
  documentação; o uso espera o acesso (decisão 2).
- **TOTVS.** Você põe o endereço do servidor e o usuário de integração. As tabelas chegam ao lago. É
  o primeiro conector que a IA escreve a partir da documentação, e uma leitura de teste o confere. A
  base é construída agora, sem cliente; o uso espera o acesso.
- **Sicoob.** Você põe o acesso da conta e o certificado. O extrato e os Pix recebidos chegam ao
  lago, mês a mês.

Os arquivos do Drive e do SharePoint (o PDF, o documento) vão ao depósito de arquivos do lago na
etapa 3a, que já está no roteiro. Este cartão não a antecipa.

**Por que cinco partes.** São oito ligações e oito peças novas no kit. Juntos passam das 4.000 linhas
que uma etapa deve ter (delivery L2). Cada parte é usada por você quando entra no ar:

- **Parte A, o Google.** Você cria o acesso, então ele vem primeiro: Gmail com Agenda, a caixa de um
  setor e o Drive.
- **Parte B, o HubSpot.** A base nasce já, pela documentação. O uso espera o acesso, e com ele o `D1`.
- **Parte C, a Microsoft.** E-mail e agenda do Outlook, e SharePoint. Espera o login da parte A.
- **Parte D, o TOTVS.** A Fábrica e o conector, pela documentação, sem esperar cliente.
- **Parte E, o Sicoob.** O certificado e o conector.

As partes A, B, D e E correm juntas depois do Lago 2. A parte C espera a parte A.

**A visão.** Este cartão serve a quatro linhas de `VISION.md`, e muda uma.

- "A ferramenta ao vivo de uma pessoa, como o Gmail dela, o agente consulta e nunca copia"
  (VISION:53). A decisão 1 acrescenta o que a caixa de um setor pode.
- "Há uma fonte só de conectores, o kit" (VISION:54): cada conector novo é uma pasta do kit.
- "O dado copiado mora no lago de cada empresa" (VISION:51): o que a empresa copia vai ao lago, e o
  que é de uma pessoa não vai.
- "Nada se desenha para um sistema só, e uma capacidade nova nasce desenhada com duas classes de
  conector" (VISION:56): cada peça nova do kit entra com dois sistemas, menos o certificado
  (decisão 4) e a origem digitada, que só o TOTVS pede.

**Fica de fora.**

- **A NF-e, em espera.** O fundador, em 2026-11-24: "Por agora NF-E não é requisito pode tirar e
  deixar em standby". Saem com ela a ciência da emissão, o fio em SOAP e XML, a tabela
  `nfe_documentos` e a espera de uma hora da SEFAZ. O certificado A1 fica, porque o Sicoob o pede.
  A NF-e volta num cartão próprio, quando ele a quiser, com o estudo de 2026-11-24 (`EST/respostas`
  seção 4) já feito: a ciência automática, desligada por padrão, é a forma de 9 das 18 referências.
- O arquivo no depósito do lago: a etapa 3a (0082).
- Escritas além da nota do HubSpot (2026-11-24, "só a nota do HubSpot escreve"). Cada escrita nova
  pede a gravação dela.
- O servidor MCP do fornecedor, como fonte de cópia (a sua `C1` (a), de 2026-11-21). O kit é obrigatório
  para tudo que é copiado, e os servidores MCP do Google estão em pré-visualização (`NT/google.md`
  4.1). O MCP do HubSpot e o da TOTVS servem aqui como leitura da forma, não como fonte.
- O e-mail e a agenda de uma pessoa no lago: são dela (VISION:53).
- O login por chave colada: você pediu "sem colar chave" (`dados.md:17`), e o HubSpot encerrou o app
  privado em 2026 (`NT/hubspot.md` 2).
- A Fábrica com conta real: o laço de prova dela, sem conta, é o dublê da documentação.

**As suas decisões nesta etapa.** Cinco. As outras respostas dele estão dadas e entram no cartão:

| Resposta dele, 2026-11-24 | O que o cartão faz |
| --- | --- |
| De quem é o Gmail e o Outlook: de cada pessoa, só ao vivo | A U5 |
| Um app de login do Conexus para o Google e outro para a Microsoft, em modo de teste enquanto a verificação corre | A U4 |
| Só a nota do HubSpot escreve | A U2 |
| O endereço do TOTVS: `https`, recusar loopback, endereço privado, CGNAT, link-local e metadados, no escrito e no resolvido, a cada conexão; IP público aceito, "Ter certeza disso, se precisar usar a NEKT" | A U12; a prova é a Nekt (`NK:55644`) e a Nango (`ip.ts:33-47`) |
| O certificado A1 selado, usado só pelo executor | A U14 |
| O cartão corre ao lado da parte 1 do Lago 2 | Este cartão |
| O TOTVS "queria deixar a base pronta e tudo que conseguirmos fazer vendo por exemplo a NEKT como faz conexão o que pede, as tabelas tudo de informação e de acordo com documentação e API da TOTVS": Protheus primeiro, o RM depois | A U11 a U13 |
| Acessos: Google, Microsoft e Sicoob "Crio eu"; HubSpot, TOTVS e NF-e "Agora não"; gravação "Autorizo cada uma quando chegar" | A lista da seção "Os acessos" |

**1. A caixa de um setor como fonte do lago, e a frase nova da VISION:53.**

Você disse: "Se for igual a Nekt e Databricks fazem, okay. Quero seguir a referencia não complicar ou
inventar coisa". As referências fazem de dois jeitos, e o cartão segue o da Nekt, que é a mesma
categoria, uma fonte copiada para o lago.

| Opção | O que acontece | Quem faz |
| --- | --- | --- |
| **A. A caixa do setor entra pelo login da própria conta** (recomendo) | Um administrador entra uma vez como `financeiro@empresa`, que tem de ser um usuário de verdade do Workspace. Os e-mails chegam por `internalDate`, como a Nekt. Reusa o app de login e o login do kit | Nekt (`NK:84480`, "sign in with the Google account whose mailbox you want to sync"), Airbyte (`AB/source-gmail/manifest.yaml:414`, sempre `users/me`), Fivetran, `tap-gmail` |
| B. Conta de serviço com delegação, uma caixa por conexão | O super administrador do Workspace concede a delegação, e cada ligação personifica uma caixa. A credencial alcança qualquer caixa do domínio, e "só a do setor" vira regra nossa. Pede uma peça nova no kit | Databricks (`OAuth U2M: Not supported`) |
| C. Nada copiado, só ao vivo | Cabe na VISION de hoje. Perde o histórico em tabela e a junção com os outros dados, que você pediu | Copilot, Gemini |

A opção A pede uma frase nova. A decisão é sua, porque o texto da VISION é seu.

> **VISION:53 hoje.** A ferramenta ao vivo de uma pessoa, como o Gmail dela, o agente consulta e
> nunca copia, porque não faz sentido cada funcionário ligar o próprio Gmail como fonte.
>
> **VISION:53 proposta.** A ferramenta ao vivo de uma pessoa, como o Gmail dela, o agente consulta e
> nunca copia, porque não faz sentido cada funcionário ligar o próprio Gmail como fonte. A caixa de
> um setor, como `financeiro@`, que a empresa liga como dela, com o login da própria conta do setor,
> pode ser fonte do lago.

O veredito é nativo da referência: a Nekt faz assim. O como nativo em uma linha: o mesmo login OAuth
do kit, uma ligação da empresa, tabelas por `internalDate`. Este pull request não muda a VISION.
A frase entra no `VISION.md` no commit da U8, depois da sua aprovação deste cartão.

**2. O dublê da documentação, antes de haver conta (a regra T29).**

Você disse: "já quero construir a base igual Meltano ja deve ter, Nekt tem, Databricks, Nango,
Composio e muitos outros, mesmo não tendo a conta a gente conseguiria criar a base correta, por
documentação, api, mcp o que eles tiverem". A regra T29 diz o contrário para o dublê: "A page of the
vendor's documentation is not a recording", e manda esperar a gravação. A regra é do guia, e o guia
só muda com a sua palavra (delivery L20).

| Opção | O que acontece |
| --- | --- |
| **a. O dublê da documentação, marcado, vale só para a base** (recomendo) | O corpo escrito da documentação leva no arquivo a página e a data, e a lista do que a documentação não deu e o dublê inventou. A conformidade recusa a classe compartilhável num conector que tem um corpo assim, e a lista dos casos ainda da documentação vai ao corpo do pull request. A gravação (T29) troca cada caso quando você a autorizar. O conector não conta como provado até lá |
| b. Esperar a conta | Nada do HubSpot, do TOTVS e do que você ainda não criou se constrói. Contraria o que você pediu |

O que as referências fazem, sem conta: o Airbyte escreve respostas à mão para os testes de unidade e
prova na conta real (`AB/source-hubspot/unit_tests/test_streams.py:30-104`, `acceptance-test-config.yml:9-11`);
o Meltano e o singer-io rodam contra a API real com a conta no segredo do CI (`MT/tests/test_core.py:10-36`);
a Nango grava a resposta do dry run e a repete nos testes (`NG/docs/guides/functions/testing.mdx:126-138`).
Nenhuma entrega o dublê feito só da documentação, e nenhuma o mistura com uma gravação no mesmo
arquivo. O veredito é remendo, na linha 1 da tabela de referência, com a prova de que nenhuma serve.

**3. Os campos próprios da conta do HubSpot: uma coluna ou várias.**

Você disse que os campos da conta chegam ao lago, os próprios incluídos. As referências divergem no
que a pessoa vê, e o cartão não escolhe sozinho (delivery L28).

| Opção | O que a pessoa vê numa consulta | Quem faz |
| --- | --- | --- |
| **a. Uma coluna `properties` com todos os campos como texto JSON** (recomendo) | `id`, as datas, e `properties`; lê-se um campo com `json_extract_scalar(properties, '$.dealstage')`. Um campo novo na conta não muda a tabela | Nekt (`NK:93683`, `:93783`, `:94660`: "emitted as a flat JSON string", a opção que a Nekt manda ligar contra o limite de campos) |
| b. Uma coluna por campo, `properties_dealstage` | Consulta simples. A tabela muda a cada campo novo da conta e passa dos limites de colunas quando a conta tem milhares | Airbyte (`AB/source-hubspot/manifest.yaml:315-330`, `:1822-1830`), Meltano (`MT/tap_hubspot/client.py:195-235`) |

Recomendo a (a): é a forma da sua referência, não pede peça nova no kit e a tabela não muda quando
alguém cria um campo. Veredito: nativo da referência.

**4. O certificado da empresa com um sistema só.**

Sem a NF-e, o login por certificado (o `.pfx` e a senha, selados) entra com o Sicoob e mais nenhum
sistema, e a VISION:56 pede duas classes para uma peça nova. O desenho se apoia em duas referências
de classes diferentes, a Nango (`client_certificate` na API que você liga, `NG/packages/providers/providers.yaml:757-775`)
e a Nekt nos bancos (`NK:35874`, `:40779`: o mesmo `.pfx` e a senha, Banco do Brasil e Bradesco). A
NF-e, quando voltar, é a segunda classe.

| Opção | O que acontece |
| --- | --- |
| **a. O certificado entra com o Sicoob, desenhado para as duas referências** (recomendo) | O Sicoob não espera a NF-e. A U14 declara o login de forma que a NF-e use o mesmo `.pfx` sem mudar o kit |
| b. O Sicoob espera a NF-e | O Sicoob só entra quando a NF-e voltar |

**5. O Sicoob, sem a documentação oficial aberta.**

O portal técnico do Sicoob (`developers.sicoob.com.br`) é uma página de aplicação; o conteúdo vem de
uma API que responde 401 sem credencial (`NT/totvs-nfe-sicoob.md` 3). Você cria o acesso, e com ele o
portal abre.

| Opção | O que acontece |
| --- | --- |
| **a. A base pela biblioteca de terceiro lida e pelo que a Nekt pede aos bancos, e a conferência com o portal quando o seu acesso abrir** (recomendo) | O conector nasce com a marca da documentação e o veredito remendo, com a entrada em `docs/reference/boundaries.md`. A U15 para antes da gravação se o portal divergir da biblioteca |
| b. Esperar o seu acesso para ler o portal | Nada do Sicoob se constrói até lá |

O que você faz, e quando, é a lista que vem em seguida.

**O que você faz, e quando.** Antes: cria o app de login do Google e o da Microsoft, e o aplicativo do
Sicoob com o certificado ("Crio eu"). No começo: aprova esta página, com a frase da VISION:53.
Durante: autoriza cada gravação quando ela chegar. Quando quiser: dá o acesso do HubSpot e o do
TOTVS ("Agora não" hoje). No fim de cada parte: faz o roteiro, diz o que viu e aprova os textos das
telas.

**Os acessos, como você respondeu em 2026-11-24.**

| Sistema | Sua resposta | O que muda |
| --- | --- | --- |
| Google | Crio eu | A parte A é a primeira com acesso real |
| Microsoft | Crio eu | A parte C tem acesso |
| Sicoob | Crio eu | O aplicativo no portal, com o certificado |
| HubSpot | Agora não | A parte B é construída pela documentação, e o `D1` espera o acesso |
| TOTVS | Agora não | A parte D é construída pela documentação, e a gravação espera |
| NF-e | Agora não | Fora do cartão, em espera |
| Gravação | Autorizo cada uma quando chegar | Cada prova de gravação para e pede a sua palavra |

## O roteiro de uso

Na nuvem, sem terminal. O console de um fornecedor não conta.

**Parte A, o Google.**

1. Em **Integrações**, **Minhas ligações**, ligar a própria conta Google. Perguntar "o que tenho na
   agenda amanhã?" e "qual foi o último e-mail do fornecedor X?". Outra pessoa da empresa pergunta o
   mesmo e não vê nada da sua conta.
2. Ligar o Google Drive da empresa. Perguntar por um documento e ouvir o texto dele. Marcar uma
   planilha. Em **Dados**, ela chega como tabela.
3. Ligar a caixa de um setor, entrando com a conta do próprio setor. Em **Dados**, a tabela `emails`
   chega ao lago. A sua própria caixa não aparece em nenhuma tabela.

**Parte B, o HubSpot, quando o acesso chegar.**

4. Em **Integrações**, buscar HubSpot, clicar **Ligar**, entrar no HubSpot e voltar. A ligação
   aparece com o nome do portal.
5. Perguntar ao Assistente "quais negócios mudaram esta semana?". Ele responde ao vivo e diz a
   origem. Pedir "anote no contato Ana que ligamos hoje". O cartão aparece, e com o sim a nota está
   no HubSpot.
6. Na janela Ligar, marcar contatos, empresas e negócios. Em **Dados**, as três tabelas chegam ao lago.

**Parte C, a Microsoft.** Os passos 1 e 2 com o e-mail e a agenda do Outlook e com o SharePoint (uma
lista e uma planilha do Excel no lago).

**Parte D, o TOTVS, quando o acesso chegar.** Ligar o TOTVS com o endereço e o usuário. Perguntar
pelos títulos a receber. Marcar as tabelas. Em **Dados**, elas chegam ao lago.

**Parte E, o Sicoob.** Ligar o Sicoob com o acesso e o certificado. O extrato do mês e os Pix
recebidos chegam ao lago.

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| GA1 O HubSpot pela documentação (um PR, parte B) | U1 A origem de cada corpo do dublê | A gravação ganha a marca `RECORDED` ou `DOCUMENTATION`; a conformidade recusa a classe compartilhável com um corpo da documentação; o comando de gravação serve a qualquer conector | `packages/connectors/src/kernel/`, `packages/connectors/src/mercado-livre/`, `scripts/` | testing (T26, T29) | o GC2 do Lago 2 (mesclado); a decisão 2 |
| GA1 | U2 A pasta do HubSpot, refeita | A pasta na forma do kit, com os mesmos ids de hoje; a versão datada num dono só; os escopos que a documentação lista; a classe exclusiva até a gravação; o dublê pelas páginas da documentação | `packages/connectors/src/hubspot/` | testing (T5, T29) | U1 |
| GA1 | U3 As tabelas do HubSpot | `contatos`, `empresas`, `negocios`, só o que mudou, com a coluna `properties`; a busca que passa do teto de 10.000 pela chave | `packages/connectors/src/kernel/` (`operation.ts`, `tables.ts`), `hubspot/` | testing (T5) | U2; G1 do Lago 2 (a U3 dele); a decisão 3 |
| GA2 O login do Google e a ligação de uma pessoa (um PR, parte A) | U4 As origens fixas e o app para vários conectores | O conector declara as suas origens fixas, a da API e a do login; um app de login serve a vários conectores | `packages/connectors/src/kernel/`, `apps/server/src/hub/connectors/` (`sign-ins.ts`, `tokens.ts`, `send.ts`) | security (S31, S36) | o GC2 do Lago 2 (mesclado) |
| GA2 | U5 A ligação de uma pessoa | O conector declara de quem é a ligação; a ligação de uma pessoa só serve às conversas dela, nunca à cópia; **Minhas ligações** em Integrações | `kernel/definition.ts`, `hub/connectors/`, a migração, `apps/web/src/hub/connectors/` | security (S8, S10); data (D11) | U4 |
| GA3 O Google (um PR, parte A) | U6 O Gmail com a Agenda | O conector `google`, de uma pessoa: buscar e ler e-mail e conversa, listar eventos, livre ou ocupado | `packages/connectors/src/google/` | testing (T5, T29) | GA2; U1 |
| GA3 | U7 O Google Drive | O conector `google-drive`, da empresa: buscar arquivo, ler o texto de um documento (a resposta em texto); a planilha no lago, uma tabela por aba | `packages/connectors/src/google-drive/`, `kernel/operation.ts`, `apps/server/src/hub/connectors/wire.ts` | testing (T5) | U6; a U3 (a leitura por tabela) |
| GA3 | U8 A caixa de um setor | O conector `gmail-setor`, da empresa, com o login da conta do setor: as tabelas `emails` e `marcadores`; a frase nova da VISION:53 | `packages/connectors/src/google/`, `VISION.md` | testing (T5); a VISION | U7; a decisão 1 |
| GB1 A Microsoft (um PR, parte C) | U9 O e-mail e a agenda do Outlook | Os conectores `outlook-email` e `outlook-agenda`, de uma pessoa, com um app; a página pelo endereço seguinte (`@odata.nextLink`) | `packages/connectors/src/outlook-email/`, `outlook-agenda/`, `kernel/operation.ts` | testing (T5, T29) | GA2; U1 |
| GB1 | U10 O SharePoint | O conector `sharepoint`, da empresa: buscar e ler arquivo; as listas e as planilhas do Excel no lago | `packages/connectors/src/sharepoint/` | testing (T5) | U9; a U3 |
| GT1 A Fábrica e o login do TOTVS (um PR, parte D) | U11 A Fábrica | A skill que a IA segue para escrever a pasta de um conector a partir da documentação; o comando que roda a conformidade e a leitura de teste de cada operação contra o dublê | `.agents/skills/conexus-connector-factory/`, `scripts/`, `packages/connectors/src/kernel/conformance.ts` | testing (T29) | U1 |
| GT1 | U12 A origem digitada e o login por senha | O conector declara a origem que a empresa digita, conferida a cada conexão; o login por usuário e senha, nos dois modos do TOTVS | `kernel/definition.ts`, `auth.ts`, `request.ts`, `hub/connectors/send.ts` | security (S36) | U11 |
| GT2 O TOTVS (um PR, parte D) | U13 O TOTVS Protheus, escrito pela Fábrica | O conector `totvs-protheus`: a `GenericQuery`, as 13 tabelas da Nekt, o dublê das amostras do TDN; o RM depois, pela mesma Fábrica | `packages/connectors/src/totvs-protheus/` | testing (T5, T29) | GT1; a U3 |
| GD1 O certificado e o Sicoob (um PR, parte E) | U14 O certificado da empresa | O login por certificado digital, selado, usado só pelo executor | `kernel/auth.ts`, `hub/connectors/send.ts`, `executor.ts` | security (S31, S32, S36) | o GC2 do Lago 2 (mesclado); a decisão 4 |
| GD1 | U15 O Sicoob | O conector `sicoob`: saldo e boleto ao vivo; o extrato e os Pix recebidos no lago, por mês | `packages/connectors/src/sicoob/` | testing (T5, T29) | U14; a decisão 5 |

São sete grupos, um pull request cada (delivery L9), com um commit por unidade. As unidades que mudam
o mesmo arquivo do kit entram uma de cada vez, na ordem em que aparecem: U1, U3, U4, U5, U7, U9,
U12 e U14. O GA1, o GA2, o GT1 e o GD1 andam juntos depois do Lago 2. O GA3 e o GB1 esperam o GA2.
Depois do `D1` (a parte B usada), as unidades que só acrescentam operações cobertas pela
conformidade usam a revisão leve (delivery L27).

**Orçamento de código alterado.** Estimativa, sem medida, sem testes nem gerados. U1 250, U2 700, U3
550 (GA1: 1.500). U4 450, U5 800 (GA2: 1.250). U6 800, U7 650, U8 600 (GA3: 2.050). U9 900, U10 650
(GB1: 1.550). U11 600, U12 450 (GT1: 1.050). U13 750 (GT2: 750). U14 450, U15 550 (GD1: 1.000). Total
da etapa 9.150, em sete pull requests, cada um abaixo das 4.000 de delivery L2. A etapa fecha parte
a parte, cada uma quando você a usa.

## Os critérios de aceite

Os testes entram pela porta pública de cada peça (testing T5): o índice do kit
(`@conexus/connectors`) e a conformidade dele; a rota do Hub; a ferramenta do agente pela conversa; a
linha de comando. "(novo)" é um teste que nasce com a unidade. Um dublê da documentação prova que o
código lê o que a documentação promete; não prova que o sistema responde assim (decisão 2).

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Uma gravação carrega a sua origem: `RECORDED` com a data e os caminhos trocados, ou `DOCUMENTATION` com a página, a data da leitura e a lista do que o dublê inventou. Um arquivo sem uma das duas, ou com as duas, é recusado | `kernel/recording.test.ts` (novo) | must |
| 2 | U1 | A conformidade lista, por conector, os casos que ainda são da documentação, e recusa um conector com um caso assim que declare a classe compartilhável | `kernel/conformance.test.ts`, "a origem das gravações" (novo) | must |
| 3 | U1 | `npm run record-connector -- --connector <id> --plan` imprime os pedidos do conector pelo registro de casos; um conector sem registro é recusado; o Mercado Livre grava os mesmos quatro casos de hoje pelo mesmo caminho | `scripts/record-connector.test.ts` | must |
| 4 | U2 | A pasta nova do HubSpot, pelo índice do kit, declara o conector `hubspot` com os ids de hoje (`contatos`, `empresas`, `negocios`, `notaNoContato`), as três declarações da 0062 na nota, a classe `EXCLUSIVE` e a versão datada num dono só. Os escopos não trazem `settings.account.read`. O commit apaga cada arquivo da pasta velha que não é dublê, gravação nem teste | `hubspot/hubspot.test.ts`, pelo índice; `kernel/conformance.test.ts` | must |
| 5 | U2 | O dublê do HubSpot responde com os corpos das páginas da documentação, cada um com a página e a data. A renovação do dublê é um interruptor: gira o refresh e mata o anterior, ou não gira; os dois casos passam pela sessão do kit. O padrão gira, o caso conservador | `hubspot/fake.test.ts` (novo) | must |
| 6 | U2 | Pelo Hub, nada muda para quem já usa o HubSpot: as ferramentas `hubspot_*` têm os mesmos nomes e entradas, e a nota passa pelo cartão | `hub/connectors/hubspot-door.test.ts`, `write-executor.test.ts`, `builder/agents/approval*.test.ts`, sem mudar o que esperam | must |
| 7 | U3 | Com 10.050 contatos mudados no dublê, a leitura de `contatos` traz os 10.050, sem repetir nem pular, e a rodada seguinte traz só o que mudou depois. Uma página nunca passa do teto de 10.000 da busca | `hubspot/tables.test.ts` (novo), com o dublê | must |
| 8 | U3 | A coluna `properties` traz todos os campos da conta como texto JSON. Um campo criado no portal do dublê aparece em `properties` na rodada seguinte, sem mudar as colunas da tabela; a descoberta lê só os campos que o escopo de objeto deixa ler | `hubspot/tables.test.ts` | must |
| 9 | U3 | A conformidade aceita as três tabelas com o modo `CHANGED` por `hs_lastmodifieddate`; recusa uma tabela por operação cuja leitura não declare `changed`, ou cuja paginação por chave não declare o campo da chave | `kernel/conformance.test.ts`, "a paginação por chave" (novo) | must |
| 10 | U4 | Um conector declara as suas origens fixas. Um pedido para uma origem que ele não declara é recusado antes de sair (S36). O token do Google vai a `oauth2.googleapis.com` e a leitura a `gmail.googleapis.com`, pelo dublê | `kernel/request.test.ts` (novo), "fora das origens"; `hub/connectors/sign-ins.test.ts` | must |
| 11 | U4 | Dois conectores que declaram o mesmo app leem as mesmas chaves do arquivo de apps. Nenhum log, resposta ou erro traz o segredo | `hub/connectors/sign-ins.test.ts`, `connections-oauth-logs.test.ts` | must |
| 12 | U5 | Um conector declara se a ligação é da empresa ou de uma pessoa. A conformidade recusa um conector de pessoa que declare tabela | `kernel/conformance.test.ts`, "a ligação de uma pessoa" (novo) | must |
| 13 | U5 | A ferramenta de um conector de pessoa usa só a ligação de quem pergunta. Quem não ligou recebe a frase da matriz. A ligação de outra pessoa nunca é lida, nem por quem administra | `hub/connectors/tool-door.test.ts`, "a ligação de quem pergunta" (novo) | must |
| 14 | U5 | **Minhas ligações** lista só as ligações da pessoa; ela liga e desliga a sua; quem sai da empresa perde as suas | `apps/web/src/hub/connectors/my-connections.test.tsx` (novo); `hub/connectors/connections.test.ts` | must |
| 15 | U6 | O Assistente responde "o que tenho na agenda amanhã?" pela ligação de quem pergunta, com a origem ao vivo. Com o token vencido, a sessão renova e repete uma vez | `builder/assistant/assistant.test.ts`, com o dublê do Google | must |
| 16 | U6 | A skill gerada do `google` diz que a ligação só lê; nenhuma das duas partes nomeia uma ferramenta | `google/google.test.ts`, "a skill" | must |
| 17 | U7 | Uma leitura pode declarar a resposta em texto. O texto de um documento exportado chega ao Assistente. Acima do teto do executor, a recusa de hoje | `kernel/operation.test.ts` (novo); `hub/connectors/wire.test.ts`, "a resposta em texto" (novo) | must |
| 18 | U7 | Uma planilha do dublê com duas abas vira duas tabelas, com as colunas pelo cabeçalho. Uma aba sem cabeçalho fica fora, com o motivo | `google-drive/tables.test.ts` (novo) | must |
| 19 | U8 | A caixa de um setor entra como ligação da empresa pelo login da conta do setor. `emails` lê só o que chegou depois do último `internalDate`, e `marcadores` lê inteira. A ligação de uma pessoa continua sem tabela (critério 12). As colunas de remetente e destinatário declaram o dado pessoal da leitura | `google/setor.test.ts` (novo); `kernel/conformance.test.ts` | must |
| 20 | U8 | O `VISION.md` traz a frase aprovada em `VISION:53`, a de hoje mais a da caixa do setor, e nenhuma outra linha muda | `scripts/check-docs.test.ts`, "a VISION" (novo) | should |
| 21 | U9 | O e-mail e a agenda do Outlook leem pela ligação de quem pergunta. A página seguinte vem pelo endereço que a resposta deu, e um endereço fora das origens do conector é recusado | `outlook-email/*.test.ts`, `outlook-agenda/*.test.ts` (novos); `kernel/request.test.ts` (novo) | must |
| 22 | U10 | Uma lista do SharePoint vira tabela com as colunas da lista. A planilha do Excel, uma tabela por aba | `sharepoint/tables.test.ts` (novo) | must |
| 23 | U11 | O comando da Fábrica, dado um conector, roda a conformidade e uma leitura de teste de cada operação contra o dublê, e falha nomeando a operação que não leu | `scripts/connector-check.test.ts` (novo) | must |
| 24 | U11 | A skill da Fábrica escreve a pasta só na forma do kit, sem nomear ferramenta, e o pull request traz a lista do que a IA escreveu e do que a pessoa mudou | a revisão da U13 | must |
| 25 | U12 | Uma ligação de conector com origem digitada aceita só `https`, com domínio ou IP público. Loopback, endereço privado, CGNAT, link-local, metadados, ou um nome que resolve para um deles, são recusados na ligação e a cada conexão. Redirecionamento recusado | `kernel/request.test.ts`, "a origem digitada" (novo); `hub/connectors/send.test.ts` (novo) | must |
| 26 | U12 | O login por usuário e senha troca o par pelo token do sistema, nos dois modos do TOTVS. A senha nunca vai em log, resposta ou erro. Uma resposta com `hasMFA` verdadeiro é um erro de configuração | `kernel/auth.test.ts` (novo); `hub/connectors/connections-logs.test.ts` | must |
| 27 | U13 | A pasta do TOTVS foi escrita pela Fábrica e passa a conformidade e a leitura de teste. As entradas de SQL cru da `GenericQuery` (`where`, `FromQry`) são `fixed` e saem do que o modelo preenche (0062) | `totvs-protheus/*.test.ts` (novos); `kernel/conformance.test.ts` | must |
| 28 | U13 | As treze tabelas do Protheus chegam ao lago inteiras, na ordem da chave, com os campos `*_X` em `extra_fields`; sem permissão a uma tabela, a leitura de teste para antes de copiar e diz qual | `totvs-protheus/tables.test.ts` (novo); a bateria do adaptador | must |
| 29 | U13 | O dublê aceita o pedido do token com o usuário e a senha nos cabeçalhos ou na query, e devolve a resposta literal da TDN; um token vencido dá 401 e a sessão renova e repete uma vez | `totvs-protheus/fake.test.ts` (novo) | must |
| 30 | U14 | O login por certificado guarda o arquivo e a senha selados. Só o executor abre o certificado, para o pedido. O certificado vencido dá a frase da matriz antes de chamar o sistema | `kernel/auth.test.ts`; `hub/connectors/connection-seal.test.ts`; `executor.test.ts`, "o certificado" (novo) | must |
| 31 | U15 | O extrato chega por mês, dentro dos 3 meses que o Sicoob dá. Os Pix recebidos, pela data. O saldo, ao vivo | `sicoob/*.test.ts` (novos), com o dublê | must |
| 32 | U2, U6, U9, U13, U15 | Cada conector declara a classe que a gravação mediu, ou `EXCLUSIVE` sem gravação | `kernel/conformance.test.ts`, "a classe da credencial" | must |

## A matriz de estados

A tela de **Minhas ligações** (U5) e os campos novos da janela Ligar (U8, U12, U14) usam as peças de
`apps/web/src/ui/` que já existem: `page-header`, `list`, `states`, `notice`, `badge`, `button`,
`field`, `input` e `alert-dialog`. Nenhuma peça nova entra, e nenhuma entrada de showcase nem linha
do `DESIGN.md` muda.

**Minhas ligações, a 1280 px e a 390 px.**

```text
1280                                               390
+--------------------------------------------+    +------------------+
| Minhas ligações                            |    | Minhas ligações  |
| O Assistente lê só o que você ligar.       |    | O Assistente lê  |
|                                            |    | só o que você    |
| [G] Gmail com Agenda   Ligada   [Desligar] |    | ligar.           |
| [O] Outlook            Entrar de novo [..] |    | [G] Gmail com    |
|                                            |    |     Agenda       |
| [ Ligar outra conta ]                      |    |     Ligada       |
+--------------------------------------------+    |     [Desligar]   |
                                                  +------------------+
```

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Minhas ligações** (U5) | "Ligue a sua conta para o Assistente ler o seu e-mail e a sua agenda." | A mesma frase | Esqueleto de lista | "Não consegui ler as suas ligações. Tente de novo." | Não se aplica | Não se aplica: toda pessoa da empresa vê a sua | "Entre de novo para o Assistente voltar a ler." |
| Ligar um conector de origem digitada (U12) | Campo do endereço, com "Use o endereço `https` público do servidor." | Não se aplica | "Testando a conexão" | O endereço recusado, com a mesma frase; o usuário ou a senha recusados | Não se aplica | Quem não gerencia ligações não vê a janela | O usuário ou a senha que o sistema recusou |
| Ligar um conector de certificado (U14) | Campos do arquivo e da senha | Não se aplica | "Testando o certificado" | O arquivo recusado; a senha errada | Não se aplica | Quem não gerencia ligações não vê a janela | O certificado vencido, com a data; ligado, com a data do fim |
| Ligar a caixa de um setor (U8) | "Entre com a conta do setor, não com a sua." | Não se aplica | "Esperando o Google" | "O Google recusou a entrada." | Não se aplica | Quem não gerencia ligações não vê a janela | "Entre de novo com a conta do setor." |

Os textos são os de arranque; você os aprova ao usar cada tela.

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| A dona da ligação (empresa ou pessoa) | o kit, por conector (U5) | a porta de ferramentas, a janela Ligar, a cópia (que recusa a de pessoa) |
| A pessoa de uma ligação | o Hub, ao ligar (U5) | a porta de ferramentas, **Minhas ligações** |
| As origens fixas do conector | o kit, por conector (U4) | o envio, a cada pedido |
| A origem digitada | quem liga (U12) | o envio, a cada pedido |
| O fim do certificado | o Hub, ao ligar (U14) | a página da ligação |
| A origem da gravação (`RECORDED` ou `DOCUMENTATION`) | quem grava, o script ou a Fábrica (U1) | o dublê, a conformidade, o corpo do pull request |

## A tabela de falhas

Este cartão não acrescenta escrita. A nota do HubSpot já está na etapa 24.5, com as três declarações
da 0062, e a U2 só a move para a pasta nova. O que o cartão acrescenta são comandos e logins, e cada
um tem a sua linha.

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| Gravar uma ligação de pessoa (U5, `PUT` da janela) | A chave é a pessoa e o conector: a segunda grava por cima e devolve o que ficou | A migração é uma transação: ou a coluna e a ligação, ou nenhuma | Banco fora: a rota responde a recusa do Hub, e a ligação antiga fica | Nenhuma linha traz o token | 13, 14 |
| Renovar o token de uma ligação exclusiva (U2, U6, U9, U13, U15) | A sessão do kit serve uma renovação por vez; a segunda espera a primeira | O refresh gasto pela primeira e perdido: a ligação pede entrar de novo, e o Hub não repete | O terceiro fora: `UNREACHABLE`, sem trocar a ligação | Só o código da falha | 5, 15, 32 |
| `npm run record-connector` (U1) | Dois comandos gravam o mesmo caso: o segundo grava por cima, na mesma pasta fora do repositório | Uma troca de valores que falha não grava o arquivo do repositório | A rede fora: a gravação crua não existe, e o comando para | A rota e o caso, nunca o corpo nem a credencial | 3 |
| `npm run connector:check` (U11) | Só lê: duas execuções são independentes | Uma leitura de teste que falha para na operação e a nomeia | O dublê não sobe: o comando falha antes de ler | A operação que não leu | 23 |
| A conexão digitada do TOTVS (U12) | Cada conexão confere o endereço de novo | O nome resolve para um endereço recusado: a conexão cai e nada é enviado | O DNS fora: a conexão cai | O endereço recusado, sem a senha | 25, 26 |

## A tabela de referência

| # | Peça | Hoje no main | Referência | Veredito | Prova, se não for nativo | Decisão | Unidade |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A origem de cada corpo do dublê | `mercado-livre/recordings.ts` lê quatro gravações que o script trocou por valores inventados; nenhuma marca diz de onde veio o corpo (`C/packages/connectors/src/mercado-livre/recordings.ts:9-22`) | **Sem referência** para a marca. O Airbyte separa os dois por pasta, `unit_tests/resource/http/response/*.json` à mão e `integration_tests/expected_records.jsonl` da conta real (`AB/source-hubspot/unit_tests/`, `acceptance-test-config.yml:9-11`); a Nango grava o dry run (`NG/docs/guides/functions/testing.mdx:126-138`); o Meltano não tem dublê (`MT/tests/test_core.py:10-36`) | remendo | Airbyte `source-hubspot` 6.14.3 e Meltano `tap-hubspot` sobre singer-sdk 0.54.9 não marcam a origem no mesmo arquivo. A prova está na seção 3.4 de `base/hubspot.md`. A entrada em `docs/reference/boundaries.md` no commit da U1 | Decisão 2; testing T29 | U1 |
| 2 | A pasta do HubSpot | `C/packages/connectors/src/hubspot/definition.ts` ("A confirmar na gravação", `:20-22`); 645 linhas de TypeScript na pasta | Airbyte `source-hubspot` 6.14.3 (`AB/.../manifest.yaml:12-31`, `:1763-1835`, `:3628-3690`); `MT/tap_hubspot/client.py:100-460`; `SI/tap_hubspot/__init__.py:312-322`; Nango `providers.yaml:17943-17970`; a OpenAPI `SP/PublicApiSpecs/Auth/Oauth/Rollouts/279897/2026-09/oauth.json`; `HS/api-reference/latest/authentication/manage-oauth-tokens` | embrulhado: a forma do kit | Os testes de hoje, pela porta pública | A do conector (`dados.md:64-66`) | U2 |
| 3 | A versão da API e os escopos | o token em `/oauth/2026-09/token` (`hubspot/definition.ts:34`), o resto em `/crm/v3` e `/account-info/v3` (`:42`, `operations/shared.ts:104`, `operations/nota.ts:54`); o escopo `settings.account.read` (`:31`) | A documentação atual usa `/crm/objects/2026-09` e `/account-info/2026-09/details`, e lista `v3` como "Legacy" sem data de desligamento (`HS/llms.txt`); Nango usa a versão datada do `account-info` (`NG/.../hubspot/post-connection.ts:5-17`); a tabela de escopos oficial não traz `settings.account.read` e o detalhe da conta exige só `oauth` (`HS/.../scopes`, `SP/.../Account Info/Rollouts/318954/2026-09/accountInfo.json`) | nativo da referência | — | técnica, decisão do firstmate F1 e F2 | U2 |
| 4 | A classe da credencial do HubSpot | o dublê mata o refresh anterior (`hubspot/fake.ts:56-58`); `L2/` U16, "As linhas da tabela", linha 13, a declara exclusiva | Airbyte e Meltano reusam o refresh guardado (`AB/.../manifest.yaml:16-21`; `MT/tap_hubspot/auth.py:19-24`); o singer-io guarda o devolvido (`SI/tap_hubspot/__init__.py:319`); a Nango deixa compartilhar um refresh entre conexões (`NG/.../pre-connection-deletion.ts:11-16`); a documentação não diz se o anterior morre | embrulhado, decidido: `EXCLUSIVE` até medir (0077, entrada em `docs/reference/boundaries.md`, "the credential class, as the login's data") | a gravação, as quatro medidas | 0077 | U2 |
| 5 | A busca por mudança e o teto de 10.000 | `hubspot/operations/shared.ts:89-108`, lista por `GET` com `changed: null`; a paginação `CURSOR` não passa de 10.000 | A busca devolve no máximo 10.000 por consulta e dá 400 além (`HS/api-reference/latest/crm/search-the-crm`, "Limits"); o Airbyte avança pela chave `hs_object_id` (`AB/.../components.py:891-914`); o Meltano reinicia o cursor (`MT/tap_hubspot/client.py:411-428`) | embrulhado: a chave do Airbyte, a cada página, sem o `after` | — | técnica | U3 |
| 6 | Os campos próprios da conta | a lista pede de 6 a 10 propriedades fixas (`hubspot/operations/shared.ts:72-108`) | A propriedade se descobre em `GET /crm/properties/2026-09/<objeto>` (`HS/.../crm/properties/guide`); o Airbyte cria uma coluna por campo (`AB/.../manifest.yaml:315-330`, `:1774-1786`, `:1822-1830`); o Meltano também (`MT/.../client.py:140-235`); a Nekt guarda tudo em `properties`, como objeto ou texto JSON (`NK:93683`, `:93783`, `:94660`) | nativo da referência (a da Nekt) | — | decisão 3 | U3 |
| 7 | As origens fixas, a da API e a do login | uma origem (`C/packages/connectors/src/kernel/definition.ts:52`); o token nela (`kernel/oauth.ts:35`); fora dela, recusa (`kernel/request.ts:34-35`) | Nango `token_url` à parte de `base_url` (`NG/packages/providers/providers.yaml:16193-16205`, `:21724-21738`); Airbyte, a renovação à parte (`AB/source-gmail/manifest.yaml:378-385`) | embrulhado: a lista continua fixa (S36) | — | técnica | U4 |
| 8 | Um app para vários conectores | um app por conector, do arquivo (`kernel/oauth.ts:19-23`; 0057) | Nango `alias: google` (`providers.yaml:16219`) e `alias: microsoft` (`:4485`) | nativo da referência | — | a sua resposta, 2026-11-24 | U4 |
| 9 | A ligação de uma pessoa | a ligação é da empresa (`C/apps/server/src/hub/connectors/tables.ts:46-49`) | Copilot, Gmail federado com "the user's identity and permissions"; Databricks, "User to Machine Per User"; Gemini ao vivo com a credencial do usuário (`EST/conectores-documentos` 3.5; `NT/google.md` 7); Mastra, um provedor OAuth por usuário no MCP (`MD/references/docs-guides-mcp-authentication-authorization.md:36`) | embrulhado | — | a sua resposta, 2026-11-24; VISION:53 | U5 |
| 10 | O Gmail com a Agenda | nenhum | Airbyte `source-gmail` (`AB/source-gmail/manifest.yaml`, 1.499 linhas) e `source-google-calendar`; n8n, `packages/nodes-base/nodes/Google/Gmail` e `Calendar`; as discovery docs públicas do Google (`https://www.googleapis.com/discovery/v1/apis/<api>/<versão>/rest`; `NT/google.md` 4, 9) | embrulhado: a forma do kit | a gravação | a sua resposta, 2026-11-24 | U6 |
| 11 | A resposta em texto | a 2xx que não é JSON vira `null` (`C/apps/server/src/hub/connectors/wire.ts:62-78`) | Airbyte, o download do Drive (`NT/google.md` 6) | embrulhado | — | técnica | U7 |
| 12 | O Drive e a planilha no lago | nenhum | Airbyte `source-google-drive` e `source-google-sheets`; o `DynamicSchemaLoader` (`AB/source-google-sheets/manifest.yaml:62-100`) e o `HttpComponentsResolver` (`:101-160`); `tap-google-sheets` `93d09962` (`NT/google.md` 3.3, 3.4) | embrulhado | a gravação | g3 a (`dados.md:164`) | U7 |
| 13 | A caixa de um setor como fonte do lago | nenhum | Nekt, as tabelas `Email` por `internalDate` e `Label` inteira, o login da conta da caixa e a data inicial (`NK:84480`, `:84484`, `:84510-84511`, `:84542`); Airbyte, `users/me` e o cursor `internalDate` (`AB/source-gmail/manifest.yaml:414`, `:287-296`); a conta de serviço não lê caixa sem delegação (`:368-377`); Fivetran e `tap-gmail` fazem como a Nekt (`EST/respostas` 2.1); Databricks usa delegação, a opção B | nativo da referência (a Nekt) | — | decisão 1 | U8 |
| 14 | A página pelo endereço seguinte | `ListPaging` sem endereço inteiro (`C/packages/connectors/src/kernel/operation.ts:148-158`) | O n8n segue o endereço inteiro (`N8/packages/nodes-base/nodes/Microsoft/Outlook/trigger/GenericFunctions.ts:24-38`); o Airbyte lê só o `$skiptoken` dele (`AB/source-outlook/manifest.yaml:143-145`, `:515-516`) | nativo da referência (a do n8n) | — | técnica | U9 |
| 15 | O e-mail e a agenda do Outlook | nenhum | Airbyte `source-outlook` 0.0.40, alpha (`AB/source-outlook/metadata.yaml:19`, `:26`); n8n, o nó do Outlook; a Nekt (`NK:118957`, `:118984`, `:119008`); nenhuma referência expõe `getSchedule` | embrulhado | a gravação | a sua resposta, 2026-11-24; a lista dele nomeia os dois | U9 |
| 16 | O SharePoint | nenhum | Airbyte `source-microsoft-sharepoint` 0.10.5 e `source-microsoft-lists` 0.0.72, alpha (`NT/microsoft.md` 1.3); `tap-sharepointsites` `38b22d2d`, sem manutenção | embrulhado | a gravação | g3 a | U10 |
| 17 | A Fábrica | nenhum; "Not proved" (`C/docs/decisions/0069-connectors-one-source-the-kit.md:29`) | Airbyte, o assistente que lê a documentação ou o OpenAPI, com revisão humana e teste (`AB/docs/platform/connector-development/connector-builder-ui/ai-assist.md:32`, `:43-47`, `:75`); Nango, o agente que gera, compila e roda a leitura seca (`NG/docs/guides/functions/functions-guide.mdx:236-262`) e salva as respostas (`testing.mdx:126-138`); as duas fecham o laço com uma conta real, e a nossa o fecha com o dublê | embrulhado | a U13 | 0069; A do conector | U11 |
| 18 | A origem digitada | só o dublê troca a origem (`C/packages/connectors/src/kernel/request.ts:22-26`) | Nango `${connectionConfig.subdomain}` (`NG/.../providers.yaml:290-291`, `:300`) e a política de saída (`NG/packages/egress/lib/ip.ts:32-48`, `policy.ts:31-39`, `validate.ts:147`, `agent.ts:71-122`); Airbyte `config['domain']` (`AB/source-freshdesk/manifest.yaml:1280`); a Nekt exige `https` e aceita IP público (`NK:55644`, `:180998`) | remendo de segurança | `send.test.ts`, os endereços privados, em Node 24.21.0 (`.nvmrc`) | a sua resposta, 2026-11-24 | U12 |
| 19 | O login por usuário e senha | a query do login vai vazia, sem corpo JSON (`C/packages/connectors/src/kernel/auth.ts:86`) | TDN `pageId=465383509` (Protheus: usuário e senha em cabeçalhos ou na query, acesso de 1 h e refresh de 24 h) e `539528505` (RM: corpo JSON); a OpenAPI `TT/jsonschema/apis/Token_v1_000.json:62-140`; Airbyte, `Session Token` (`AB/docs/platform/connector-development/connector-builder-ui/authentication.md:282-284`); a Nekt, Basic (`NK:180998`) | embrulhado | — | técnica | U12 |
| 20 | O TOTVS | nenhum | `TDN` `GenericQuery` e `pageId=484701395`; a Nekt, Protheus com 13 tabelas inteiras e RM por `modified_at` (`NK:180987-181030`, `:181085-181099`, `:181130-181500`, `:181612-181625`, `:181984-181995`); `TT` (490 OpenAPI, sem licença: só leitura); `protheus-mcp` `b47bc0b3` (MIT, só documentação). Composio, Nango, Airbyte, n8n, Meltano: nenhum conector de TOTVS (`base/totvs.md` seção 1) | embrulhado | a gravação | A sua resposta, 2026-11-24 | U13 |
| 21 | O certificado da empresa | nenhum | Nango `client_certificate` (`NG/.../providers.yaml:757-776`, `NG/packages/shared/lib/services/proxy/utils.ts:170-175`); a Nekt, `.pfx` e senha no Banco do Brasil e no Bradesco (`NK:35874`, `:35895-35896`, `:40779`, `:40802-40803`) | embrulhado | — | a sua resposta, 2026-11-24; decisão 4 | U14 |
| 22 | O Sicoob | nenhum | `SharpSistemas/SicoobAPI` `ea3858cb` (lido); a Nekt, o mesmo login no Banco do Brasil e no Bradesco (`NK:35858-35903`, `:40761-40809`); a documentação oficial não abriu | remendo (sem referência oficial) | `send.test.ts` com um `.pfx` gerado na hora, em Node 24.21.0, e a gravação no sandbox com o seu acesso | decisão 5 | U15 |
| 23 | O servidor MCP do fornecedor | `@mastra/mcp` não instalado (`L2/` A tabela de referência, linha 52) | Google MCP em pré-visualização (`NT/google.md` 4.1); HubSpot MCP (`HS/.../integrate-with-the-remote-hubspot-mcp-server`; `base/hubspot.md` 1.5); `protheus-mcp` | embrulhado, fica de fora | — | `C1` (a) de 2026-11-21 | fica de fora |
| 24 | O arquivo no depósito do lago | nenhum | 0082; Airbyte `file_reference` (`NT/google.md` 6); a Nekt, o fluxo de anexos desligado por padrão (`NK:84488`) | embrulhado, fica de fora | — | 0082 | a etapa 3a |
| 25 | A NF-e: a ciência, o fio em SOAP e XML, a tabela `nfe_documentos` | nenhum | `EST/respostas` 4 (18 referências), OCA `l10n-brazil` `res_company.py:65-71`, `:199-215`; `SPED` `Tools.php:385-415` | embrulhado, fica de fora, em espera | — | A sua palavra, 2026-11-24 | a NF-e, num cartão próprio |

Cada linha remendo (1, 18 e 22) acrescenta a sua entrada em `docs/reference/boundaries.md`, com a
prova, no commit da unidade.

**A medida do transplante.** Nenhuma parte do código velho vem para a pasta nova. A pasta do HubSpot
é escrita de novo na U2 (a velha sai no mesmo commit), e o dublê muda de respostas inventadas para
as da documentação. O que o `hubspot/` de hoje deixa para a nova são as decisões que o código já
carrega: os ids, as três declarações da nota (0062), `hs_timestamp` e a associação 202
(`hubspot/operations/nota.ts:18`, `:54-58`).

**A dívida.**

- O caso do dublê do HubSpot que renova a chave a cada renovação passa a ser um interruptor (U2);
  a bateria da U4 do Lago 2 o usa como interruptor.
- O host do token, `api.hubapi.com` ou `api.hubspot.com`, e o PKCE ficam para a gravação do HubSpot.
- A data de desligamento do `v3` do CRM não está na documentação. Se vier, a versão datada do
  F1 já a cobre.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| F1 | Todo caminho do HubSpot usa a versão datada `2026-09`, num dono só | A documentação atual usa `/crm/objects/2026-09` e `/account-info/2026-09/details` e chama o `v3` de "Legacy" (`HS/llms.txt`); o token e o Nango já usam a versão datada (`NG/.../post-connection.ts:5-17`). O `v3` não tem data de desligamento achada | Trocar a constante da versão; a gravação do HubSpot diz se o caminho datado responde |
| F2 | Tirar `settings.account.read` dos escopos do HubSpot | O escopo não consta da tabela oficial (`HS/.../scopes`, 15/09/2026), e o `GET /account-info` exige só `oauth` (`SP/.../Account Info/Rollouts/318954/2026-09/accountInfo.json`) | Pôr o escopo de volta; a gravação mostra se o HubSpot recusa a autorização por ele |
| F3 | `contatos` e `empresas` com `registry: true`; `negocios` com `registry: false` | A data inicial do Lago 2 não limita um cadastro (`L2/` U3, "O dono de cada fato", `startDateLimits`); contato e empresa são cadastro, e o negócio é movimento que a data pode cortar. A Nekt aplica a data inicial a todos (`NK:93672`) | Trocar o booleano na declaração de cada tabela |
| F4 | A caixa do setor é uma segunda definição na pasta `google/` (`gmail-setor`), com as operações do Gmail em módulo comum | Sem um conector paralelo (C75): a pessoa lê pelo `google`, a empresa pelo `gmail-setor`, ambos pelo mesmo app (U4). A Airbyte faz um conector só com as duas capacidades, mas o kit declara a dona por conector (U5) | Dividir em duas pastas, sem mudar o que os dois conectores fazem |
| F5 | O Protheus primeiro e o RM depois, pela mesma Fábrica | A palavra dele, 2026-11-24, e a Nekt faz as duas linhas separadas (`NK:180987`, `:181500`) | O RM entra como o segundo conector da U13, sem mudar o kit |
| F6 | O leitor lê a busca do HubSpot pela chave `hs_object_id` a cada página, sem o `after` | O Airbyte faz o `after` zero com o filtro `hs_object_id >= último + 1` (`AB/.../components.py:891-914`); a cada página é o mesmo número de pedidos e não há estado de 10.000 para detectar | Voltar a paginar por `after` até 10.000 e só então a chave, como o Airbyte |

## U1 A origem de cada corpo do dublê

**Base e modelo.** O GC2 do Lago 2 mesclado. Sonnet: uma marca nos arquivos de gravação e um registro.

### As linhas da tabela

- **Linha 1.** Ler `C/packages/connectors/src/mercado-livre/recordings.ts:9-22`, `scripts/record-connector.ts`
  (hoje `z.literal('mercado-livre')`) e `kernel/conformance.ts`. Seguir `AB/source-hubspot/unit_tests/`
  e `acceptance-test-config.yml:9-11` para a ideia de separar os dois; a marca é nossa (remendo).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `recording.ts` e o teste; muda `conformance.ts` e o índice | os conectores, `scripts/` |
| `packages/connectors/src/mercado-livre/` | Muda `recordings.ts` e os quatro JSON para a marca `RECORDED` | o dublê |
| `scripts/record-connector.ts` | Muda: o conector vira argumento e vem do registro de casos do próprio conector | o comando |
| `docs/reference/boundaries.md` | Acrescenta a entrada da linha 1 | a revisão |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/recording.ts
export type RecordingSource =
  | Readonly<{ kind: 'RECORDED'; recordedAt: string; swapped: readonly string[] }>
  | Readonly<{ kind: 'DOCUMENTATION'; page: string; readAt: string; invented: readonly string[] }>
export type Recording = Readonly<{ source: RecordingSource; request: unknown; answer: unknown }>
export function recordingOf(raw: unknown): Recording // refuses a file with neither source or with both
```

- **O dono de cada fato** (C26): a marca, no arquivo da gravação; o registro de casos, na pasta do
  conector (`cases.ts`, um por conector que grava).
- **O que se apaga**: o `z.literal('mercado-livre')` do script.

### As skills e a leitura

`conexus-connector` (a gravação e o dublê). O guia de testes, T26 e T29.

### A ordem do trabalho

1. **A marca.** Critério: 1. Cria `recording.ts`; os quatro JSON do Mercado Livre ganham `RECORDED`.
   - **Testes:** `kernel/recording.test.ts` (novo): sem marca, duas marcas, uma `DOCUMENTATION` sem
     página.
2. **A conformidade.** Critério: 2. Muda `conformance.ts`: lista os casos `DOCUMENTATION` e recusa a
   classe `SHAREABLE` com um deles.
   - **Mutações à mão:** deixar passar a classe compartilhável com um caso da documentação: o 2 fica vermelho.
3. **O comando.** Critério: 3. `--connector` e `--plan`; o registro por conector.
4. **A entrada em `boundaries.md`** da linha 1, com a prova da seção 3.4 de `base/hubspot.md`.

### Como se prova

O `npm run record-connector -- --connector mercado-livre --plan` imprime os mesmos quatro pedidos de
hoje. Nenhuma chamada sai: `--plan` não envia.

### Parar se

Um conector que grava não tem como dar o registro de casos sem inventar o pedido.

## U2 A pasta do HubSpot, refeita

**Base e modelo.** A U1. Sonnet, e Opus só na renovação do dublê, por tocar a sessão.

### As linhas da tabela

- **Linha 2.** Ler `C/packages/connectors/src/hubspot/` inteira (645 linhas de TypeScript), `definition.ts:20-22`
  ("A confirmar na gravação"). Seguir `AB/source-hubspot/manifest.yaml:12-31`, `:1763-1835`, `:3628-3690`,
  `MT/tap_hubspot/client.py:100-460`, `SI/tap_hubspot/__init__.py:312-322`, `NG/.../providers.yaml:17943-17970`.
- **Linha 3.** Ler `hubspot/definition.ts:31-42`. Seguir a documentação com a versão datada
  (`HS/api-reference/latest/...`) e `SP/PublicApiSpecs/Account Info/Rollouts/318954/2026-09/accountInfo.json`.
- **Linha 4.** Ler `hubspot/fake.ts:56-58`. A classe é `EXCLUSIVE` (0077) até a gravação.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/hubspot/` | Reescreve na forma do kit; apaga o que não é dublê, gravação nem teste; o dublê passa a responder com corpos das páginas da documentação, cada um marcado `DOCUMENTATION` (U1) | `apps/server/src/hub/connectors/`, o `builder/` |
| `docs/reference/stack.md` | Linha da pasta, se a lista mudar | o índice |

### Os contratos que a unidade cria

- Nenhum contrato novo no kit. O dublê ganha um interruptor, `rotateRefresh: boolean`, no construtor;
  o padrão é `true` (o caso conservador, o de hoje).
- **O dono de cada fato** (C26): a versão datada, uma constante em `hubspot/definition.ts`; os
  escopos, na mesma definição; os corpos do dublê, nos arquivos de gravação.
- **O que se apaga**: os caminhos `/crm/v3` e `/account-info/v3` e o escopo `settings.account.read`.

### As skills e a leitura

`conexus-connector`. O guia de testes, T5 e T29. A base sem conta, `base/hubspot.md`.

### A ordem do trabalho

1. **A definição.** Critérios: 4, 32. Versão datada, escopos, classe.
   - **Testes:** `hubspot/hubspot.test.ts` (existente, pelo índice do kit); `conformance.test.ts`.
2. **O dublê.** Critério: 5. Os corpos da documentação; o interruptor de renovação.
   - **Testes:** `hubspot/fake.test.ts` (novo).
   - **Mutações à mão:** o interruptor desligado mantém o refresh antigo vivo: o 5 prova as duas formas.
3. **O Hub intacto.** Critério: 6. Os testes que já existem não mudam.

### Como se prova

Os testes pela porta pública, com o dublê. A gravação (T29) espera o acesso do HubSpot, a sua palavra.

### Parar se

A documentação e a OpenAPI divergem num corpo: a unidade anota nos `invented` e para antes de escolher.

## U3 As tabelas do HubSpot

**Base e modelo.** A U2 e o G1 do Lago 2. Opus: a paginação por chave muda o `ListRead` do kit.

### As linhas da tabela

- **Linha 5.** Ler `hubspot/operations/shared.ts:89-108`, `kernel/operation.ts:148-175` (`ListPaging`,
  `ListRead`). Seguir `AB/source-hubspot/.../components.py:891-914` e `MT/tap_hubspot/client.py:411-428`;
  a busca devolve até 10.000 por consulta (`HS/api-reference/latest/crm/search-the-crm`).
- **Linha 6.** Ler a declaração por tabela do Lago 2 (U3 dele, `kernel/tables.ts`). Seguir a Nekt (`NK:93683`,
  `:93783`, `:94660`): `properties` como texto JSON, a decisão 3.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/operation.ts`, `tables.ts` | Muda: a paginação por chave no `ListPaging` e a regra na conformidade | os conectores com lista |
| `packages/connectors/src/hubspot/` | Cria `tables.ts` e o teste; as três tabelas | o motor de cópia |

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/operation.ts — a fourth paging kind
| Readonly<{ kind: 'KEYSET'; key: string; limit: string; max: number; filter: string }>
// the reader asks "key >= last + 1" on each page instead of an offset; the search ceiling never applies
```

- **O dono de cada fato** (C26): `registry` e `startDateLimits` de cada tabela, em `hubspot/tables.ts`
  (F3); `properties` como texto JSON, na declaração da coluna.
- **O que se apaga**: nada.

### As skills e a leitura

`conexus-connector`. O guia de testes, T5.

### A ordem do trabalho

1. **A paginação por chave.** Critérios: 7, 9. Muda `operation.ts` e a conformidade.
   - **Testes:** `kernel/conformance.test.ts`, "a paginação por chave" (novo).
   - **Mutações à mão:** a página seguinte repete a última chave: o 7 conta um duplicado e fica vermelho.
2. **As três tabelas.** Critérios: 7, 8. `tables.ts` e `properties`.
   - **Testes:** `hubspot/tables.test.ts` (novo), com 10.050 contatos no dublê.

### Como se prova

A leitura de 10.050 contatos pelo dublê, e a rodada seguinte que traz só o mudado.

### Parar se

O motor de cópia do Lago 2 não aceita uma paginação que ele não conhece: o cartão dele recebe o delta.

## U4 As origens fixas e o app para vários conectores

**Base e modelo.** O GC2 do Lago 2. Opus: a lista de origens é a defesa da S36.

### As linhas da tabela

- **Linha 7.** Ler `C/packages/connectors/src/kernel/definition.ts:52`, `kernel/oauth.ts:35`,
  `kernel/request.ts:34-35`. Seguir `NG/packages/providers/providers.yaml:16193-16205`, `:21724-21738` e
  `AB/source-gmail/manifest.yaml:378-385`.
- **Linha 8.** Ler `kernel/oauth.ts:19-23` e a 0057. Seguir `NG/.../providers.yaml:16219` e `:4485`
  (`alias`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts`, `oauth.ts`, `request.ts`, a conformidade | os conectores |
| `apps/server/src/hub/connectors/` | Muda `sign-ins.ts`, `tokens.ts`, `send.ts`: as origens e o app | as rotas |

### Os contratos que a unidade cria

```ts
// definition.ts: the origins the connector may call, fixed by the code, never by a person
export type FixedOrigins = Readonly<{ api: readonly string[]; login: readonly string[] }>
// oauth.ts: the app a login reads from the apps file; two connectors may name the same one
export type AppRef = Readonly<{ app: string }>
```

- **O dono de cada fato** (C26): as origens, na definição do conector; o app, no arquivo de apps
  (0057), lido pela chave.
- **O que se apaga**: a suposição de uma origem só em `request.ts:34`.

### As skills e a leitura

`conexus-connector`; o guia de segurança, S31 e S36.

### A ordem do trabalho

1. **As origens.** Critério: 10. **Testes:** `kernel/request.test.ts` (novo), "fora das origens".
   - **Mutações à mão:** aceitar uma origem fora da lista: o 10 fica vermelho.
2. **O app.** Critério: 11. **Testes:** `hub/connectors/sign-ins.test.ts`.

### Como se prova

O pedido de troca de token vai ao host do login do dublê e o de leitura ao host da API; um terceiro é recusado.

### Parar se

Um conector de hoje precisa de uma origem que nenhum campo novo cobre.

## U5 A ligação de uma pessoa

**Base e modelo.** A U4. Opus: muda a regra de quem pode usar uma ligação e a migração.

### As linhas da tabela

- **Linha 9.** Ler `C/apps/server/src/hub/connectors/tables.ts:46-49` e `tool-door.ts`. Seguir o Mastra
  (`MD/references/docs-guides-mcp-authentication-authorization.md:36`) e o que Copilot, Databricks e
  Gemini fazem (`EST/conectores-documentos` 3.5).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/definition.ts`, `conformance.ts` | Muda: a dona da ligação | os conectores |
| `apps/server/src/hub/connectors/` | Muda `connections.ts`, `tool-door.ts`, `tables.ts`; migração: a coluna da pessoa | `builder/assistant/` |
| `apps/web/src/hub/connectors/` | Cria `my-connections.tsx` e o teste; muda `integrations.tsx` | a rota de Integrações |

### Os contratos que a unidade cria

```ts
// definition.ts
export type ConnectionOwner = 'COMPANY' | 'PERSON'
// the connection row gains person_id, null for COMPANY; one row per person and connector for PERSON
```

- **O dono de cada fato** (C26): a dona, na definição; a pessoa, na linha da ligação, gravada ao ligar.
- **O que se apaga**: nada.
- **A migração** é uma transação (a coluna e a restrição), roda em banco descartável e passa o
  `check-migrations` do repositório.

### As skills e a leitura

`conexus-connector`, o guia de segurança S8 e S10, o de dados D11 e `references/screens.md` do scope.

### A ordem do trabalho

1. **A dona e a conformidade.** Critério: 12. **Testes:** `kernel/conformance.test.ts`.
2. **A porta e a migração.** Critério: 13. **Testes:** `tool-door.test.ts`, "a ligação de quem pergunta" (novo).
   - **Mutações à mão:** a porta cai na ligação de outra pessoa quando a de quem pergunta falta: o 13 fica vermelho.
3. **A tela.** Critério: 14. **Testes:** `my-connections.test.tsx` (novo), as quatro faixas da matriz.

### Como se prova

O servidor local com o dublê, duas pessoas, e a tela vista a 1280 e a 390 px, nos dois temas (T23).

### Parar se

A ligação de uma pessoa já existe em alguma tabela e a migração precisa converter dado.

## U6 O Gmail com a Agenda

**Base e modelo.** O GA2 e a U1. Sonnet.

### As linhas da tabela

- **Linha 10.** Ler `NT/google.md` 4 e 9. Seguir `AB/source-gmail/manifest.yaml`, o Calendar do
  Airbyte, o n8n (`N8/packages/nodes-base/nodes/Google/Gmail`, `Calendar`) e as discovery docs do Google.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/google/` | Cria a pasta: definição, operações, dublê, skill, testes | o kit, o índice |
| `docs/reference/stack.md` | Linha da pasta nova | o índice |

### Os contratos que a unidade cria

- Nenhum no kit. As operações (buscar e ler e-mail e conversa, listar eventos, livre ou ocupado) são
  todas `read`; a dona é `PERSON` (U5); a classe é `EXCLUSIVE` até a gravação.
- **O dono de cada fato** (C26): os escopos do Google, na definição.
- **A skill** sai da definição (U16 do Lago 2) e a parte escrita diz só o que a leitura não mostra.

### As skills e a leitura

`conexus-connector`; o guia de testes T5 e T29.

### A ordem do trabalho

1. **A definição e as operações.** Critérios: 15, 16, 32. **Testes:** `google/google.test.ts`.
2. **O dublê e a gravação.** O dublê vem das discovery docs, marcado `DOCUMENTATION`; a gravação
   espera o acesso Google (que ele cria) e a sua palavra.
   - **Mutações à mão:** o dublê para de renovar e o 15 pede a repetição única: fica vermelho se a sessão não repete.

### Como se prova

A pergunta da agenda pelo servidor local; depois, com o acesso, uma conta de teste (T29).

### Parar se

O app do Google ainda está em modo de teste e recusa o escopo de leitura do Gmail: parar e dizer qual.

## U7 O Google Drive

**Base e modelo.** A U6 e a U3. Opus: a resposta em texto muda o executor.

### As linhas da tabela

- **Linha 11.** Ler `C/apps/server/src/hub/connectors/wire.ts:62-78`. Seguir o download do Drive do
  Airbyte (`NT/google.md` 6).
- **Linha 12.** Seguir `AB/source-google-sheets/manifest.yaml:62-100` e `:101-160`, e
  `tap-google-sheets` `93d09962`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/operation.ts` | Muda: a leitura declara a resposta em texto | os conectores |
| `apps/server/src/hub/connectors/wire.ts` | Muda: entrega o texto sem `JSON.parse` quando a operação o declara | o executor |
| `packages/connectors/src/google-drive/` | Cria a pasta | o kit |

### Os contratos que a unidade cria

```ts
// operation.ts: how the answer body is read; JSON by default
export type AnswerBody = 'JSON' | 'TEXT'
// capped by the executor's ceiling; above it the refusal of today
```

- **O dono de cada fato** (C26): a forma da resposta, na operação.
- **O que se apaga**: a 2xx que não é JSON deixa de virar `null` só para a operação que declara texto.

### As skills e a leitura

`conexus-connector`; o guia de testes T5.

### A ordem do trabalho

1. **A resposta em texto.** Critério: 17. **Testes:** `kernel/operation.test.ts` (novo), `wire.test.ts`.
2. **As operações do Drive.** Critério: 32.
3. **A planilha no lago.** Critério: 18. **Testes:** `google-drive/tables.test.ts` (novo).
   - **Mutações à mão:** tratar uma aba sem cabeçalho como tabela: o 18 fica vermelho.

### Como se prova

O dublê com um documento e uma planilha de duas abas, pelo servidor local.

### Parar se

O motor de cópia não aceita colunas que vêm do cabeçalho da aba: o Lago 2 recebe o delta.

## U8 A caixa de um setor

**Base e modelo.** A U7 e a decisão 1. Sonnet.

### As linhas da tabela

- **Linha 13.** Seguir a Nekt (`NK:84480`, `:84484`, `:84510-84511`, `:84542`) e o Airbyte
  (`AB/source-gmail/manifest.yaml:414`, `:287-296`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/google/` | Cria `setor.ts`, o conector `gmail-setor`, as operações comuns em módulo à parte (F4) | o kit |
| `VISION.md` | Muda a linha 53, só com a frase aprovada | todos |

### Os contratos que a unidade cria

- Nenhum no kit. O conector é da dona `COMPANY`, classe `EXCLUSIVE`; as tabelas `emails` (`CHANGED`
  por `internalDate`) e `marcadores` (`FULL`); as colunas de remetente e destinatário declaram o
  dado pessoal.
- **O dono de cada fato** (C26): a frase da VISION, em `VISION.md:53`, alterada só neste commit.

### As skills e a leitura

`conexus-connector`; a decisão 1; a política de dados pessoais dos conectores.

### A ordem do trabalho

1. **O conector.** Critério: 19. **Testes:** `google/setor.test.ts` (novo).
2. **A VISION.** Critério: 20. A frase só entra se a decisão 1 for **A**, e esse commit é o último da unidade.

### Como se prova

O servidor local liga a conta do setor no dublê; `emails` chega ao lago; a caixa de uma pessoa
continua sem tabela.

### Parar se

A decisão 1 não é a opção A: a unidade encolhe para o conector ao vivo, sem tabela, e o critério 19 e o 20 saem.

## U9 O e-mail e a agenda do Outlook

**Base e modelo.** O GA2 e a U1. Sonnet.

### As linhas da tabela

- **Linha 14.** Ler `C/packages/connectors/src/kernel/operation.ts:148-158`. Seguir
  `N8/packages/nodes-base/nodes/Microsoft/Outlook/trigger/GenericFunctions.ts:24-38`.
- **Linha 15.** Seguir `AB/source-outlook/metadata.yaml:19`, `:26`, `manifest.yaml:143-145`, `:515-516`
  e `NK:118957`, `:118984`, `:119008`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/operation.ts` | Muda: `ListPaging` aceita o endereço seguinte (`NEXT_LINK`) | o executor |
| `packages/connectors/src/outlook-email/`, `outlook-agenda/` | Cria as duas pastas | o kit |

### Os contratos que a unidade cria

```ts
// ListPaging gains a kind: the provider's answer carries the whole next address
| Readonly<{ kind: 'NEXT_LINK'; field: string; limit: string; max: number }>
// the address must fall inside the connector's fixed origins (U4)
```

- **O dono de cada fato** (C26): o campo do endereço seguinte, na operação.

### As skills e a leitura

`conexus-connector`; o guia de testes T5 e T29.

### A ordem do trabalho

1. **A paginação.** Critério: 21. **Testes:** `kernel/request.test.ts`, "a página seguinte" (novo).
   - **Mutações à mão:** seguir um endereço de outra origem: o 21 fica vermelho.
2. **As duas pastas.** Critérios: 21, 32.

### Como se prova

O dublê pagina em dois endereços; o terceiro, de outra origem, é recusado.

### Parar se

O app da Microsoft não existe ainda: a unidade fica no dublê.

## U10 O SharePoint

**Base e modelo.** A U9 e a U3. Sonnet.

### As linhas da tabela

- **Linha 16.** Seguir `NT/microsoft.md` 1.3: o `source-microsoft-sharepoint` e o `source-microsoft-lists`
  do Airbyte, os dois em alfa.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sharepoint/` | Cria a pasta | o kit |

### Os contratos que a unidade cria

- Nenhum no kit. As colunas de uma lista vêm da própria lista (a resposta de colunas) e entram como
  `DISCOVERED`, o mecanismo do Lago 2.

### As skills e a leitura

`conexus-connector`.

### A ordem do trabalho

1. **As operações e as tabelas.** Critério: 22. **Testes:** `sharepoint/tables.test.ts` (novo).

### Como se prova

Uma lista e uma planilha do dublê viram tabelas.

### Parar se

Uma lista tem uma coluna de tipo que o Lago 2 não declara: parar e dizer qual.

## U11 A Fábrica

**Base e modelo.** A U1. Opus: é a skill que a IA segue para escrever o que o Conexus vende.

### As linhas da tabela

- **Linha 17.** Ler `C/docs/decisions/0069-connectors-one-source-the-kit.md:29`. Seguir
  `AB/docs/platform/connector-development/connector-builder-ui/ai-assist.md:32`, `:43-47`, `:75` e
  `NG/docs/guides/functions/functions-guide.mdx:236-262`, `testing.mdx:126-138`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `.agents/skills/conexus-connector-factory/` | Cria a skill | o Builder e o firstmate |
| `scripts/connector-check.ts` | Cria o comando e o teste | o `package.json` |
| `kernel/conformance.ts` | Muda: expõe a leitura de teste por operação | o comando |

### Os contratos que a unidade cria

- O comando `npm run connector:check -- --connector <id>` roda a conformidade e a sonda de cada
  operação contra o dublê e imprime a operação que falhou.
- **O dono de cada fato** (C26): a forma da pasta, no kit (`conexus-connector`); a Fábrica só a
  aponta e não a restate.

### As skills e a leitura

`conexus-connector`, `conexus-build`.

### A ordem do trabalho

1. **O comando.** Critério: 23. **Testes:** `scripts/connector-check.test.ts` (novo).
2. **A skill.** Critério: 24, provado na U13.

### Como se prova

O comando roda sobre o Mercado Livre e o HubSpot, e falha ao quebrar uma sonda.

### Parar se

A conformidade de hoje não dá a sonda por operação sem mudar o contrato do kit.

## U12 A origem digitada e o login por usuário e senha

**Base e modelo.** A U11. Opus: segurança de saída e login.

### As linhas da tabela

- **Linha 18.** Ler `C/packages/connectors/src/kernel/request.ts:22-26`. Seguir `NG/packages/egress/lib/ip.ts:32-48`,
  `policy.ts:31-39`, `validate.ts:147`, `agent.ts:71-122`, `NG/.../providers.yaml:290-291`, `:300`,
  `AB/source-freshdesk/manifest.yaml:1280` e `NK:55644`, `:180998`.
- **Linha 19.** Ler `kernel/auth.ts:86`. Seguir a TDN `pageId=465383509` e `539528505`,
  `TT/jsonschema/apis/Token_v1_000.json:62-140`, `AB/.../authentication.md:282-284`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Muda `definition.ts`, `auth.ts`, `request.ts` | os conectores |
| `apps/server/src/hub/connectors/` | Cria `send.test.ts`; muda `send.ts` | o executor |
| `docs/reference/boundaries.md` | Acrescenta a entrada da linha 18 | a revisão |

### Os contratos que a unidade cria

```ts
// definition.ts: an origin the company types; checked at every connection
export type TypedOrigin = Readonly<{ field: string; scheme: 'https' }>
// auth.ts: user and password exchanged for the system's token, with the two TOTVS modes
export type PasswordAuth = Readonly<{ kind: 'PASSWORD'; mode: 'HEADERS' | 'BODY'; credentialClass: CredentialClass }>
```

- **O dono de cada fato** (C26): a lista dos endereços recusados, em `request.ts`; o modo, no login do conector.
- **O que se apaga**: nada.

### As skills e a leitura

`conexus-connector`; o guia de segurança S36.

### A ordem do trabalho

1. **A origem digitada.** Critério: 25. **Testes:** `request.test.ts`, `send.test.ts` (novo), os
   endereços privados, o nome que resolve para eles, o redirecionamento.
   - **Mutações à mão:** conferir só na ligação e não a cada conexão: o 25 fica vermelho.
2. **O login por senha.** Critério: 26. **Testes:** `kernel/auth.test.ts` (novo); `connections-logs.test.ts`.

### Como se prova

O servidor local com o dublê do TOTVS; um endereço de loopback recusado; uma resposta com `hasMFA`.

### Parar se

A resolução de nome do Node não dá o endereço escolhido antes da conexão: parar e dizer como a Nango o faz.

## U13 O TOTVS Protheus, escrito pela Fábrica

**Base e modelo.** O GT1 e a U3. Opus: é a prova da Fábrica.

### As linhas da tabela

- **Linha 20.** Ler `base/totvs.md` (as nove amostras da TDN, as treze tabelas da Nekt). Seguir `NK:180987-181030`,
  `:181085-181099`, `:181130-181500`, `:181612-181625`, `:181984-181995`; o `TT` e o `protheus-mcp` só para
  ler a forma, sem copiar.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/totvs-protheus/` | Cria a pasta, escrita pela Fábrica | o kit |
| `docs/reference/stack.md` | Linha da pasta | o índice |

### Os contratos que a unidade cria

- Nenhum no kit. As entradas de SQL cru (`where`, `FromQry`) são `fixed` (0062); as treze tabelas
  são `FULL`, na ordem da chave; os campos `*_X` vão a `extra_fields`.
- **O que se escreve à mão**: só o que o pull request lista como mudado pela pessoa.

### As skills e a leitura

`conexus-connector-factory` (U11), `conexus-connector`.

### A ordem do trabalho

1. **A pasta pela Fábrica.** Critérios: 27, 24, 32. A IA escreve; o `connector:check` passa.
2. **As treze tabelas.** Critério: 28. **Testes:** `totvs-protheus/tables.test.ts` (novo).
3. **O dublê.** Critério: 29. Os corpos das nove amostras da TDN, marcados `DOCUMENTATION`.
   - **Mutações à mão:** abrir `where` ao modelo: o 27 fica vermelho.

### Como se prova

O `connector:check` e a leitura das treze tabelas pelo dublê. A gravação espera o acesso do TOTVS.

### Parar se

A TDN e a Nekt divergem sobre o corpo do token e a unidade não acha uma amostra que decida.

## U14 O certificado da empresa

**Base e modelo.** O GC2 do Lago 2 e a decisão 4. Opus: segredo e selo.

### As linhas da tabela

- **Linha 21.** Seguir `NG/packages/providers/providers.yaml:757-776`, `NG/packages/shared/lib/services/proxy/utils.ts:170-175`
  e `NK:35874`, `:35895-35896`, `:40779`, `:40802-40803`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/auth.ts` | Muda: o login `CERTIFICATE` | os conectores |
| `apps/server/src/hub/connectors/` | Muda `send.ts`, `executor.ts`, `connections.ts` | as rotas |
| `apps/web/src/hub/connectors/link-dialog.tsx` | Muda: os campos do arquivo e da senha | a janela Ligar |

### Os contratos que a unidade cria

```ts
export type CertificateAuth = Readonly<{ kind: 'CERTIFICATE'; credentialClass: CredentialClass }>
// the .pfx and its password are sealed with the connection; only the executor opens them, for the one request
```

- **O dono de cada fato** (C26): o fim do certificado, lido do arquivo ao ligar e guardado na ligação.

### As skills e a leitura

`conexus-connector`; o guia de segurança S31, S32 e S36.

### A ordem do trabalho

1. **O login e o selo.** Critério: 30. **Testes:** `kernel/auth.test.ts`, `connection-seal.test.ts`,
   `executor.test.ts`, "o certificado" (novo).
   - **Mutações à mão:** devolver o arquivo na resposta da ligação: o 30 fica vermelho.

### Como se prova

O servidor local liga com um `.pfx` gerado na hora; nenhum log traz a senha; o vencido dá a frase da matriz.

### Parar se

O `fetch` do Node não aceita o certificado por pedido sem trocar o agente global.

## U15 O Sicoob

**Base e modelo.** A U14 e a decisão 5. Sonnet.

### As linhas da tabela

- **Linha 22.** Seguir `SharpSistemas/SicoobAPI` `ea3858cb` e `NK:35858-35903`, `:40761-40809`. A
  documentação oficial não abriu: remendo.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/sicoob/` | Cria a pasta | o kit |
| `docs/reference/boundaries.md` | Acrescenta a entrada da linha 22 | a revisão |

### Os contratos que a unidade cria

- Nenhum no kit. O saldo e o boleto ao vivo; o extrato por mês (`WINDOW`, dentro dos 3 meses do
  Sicoob) e os Pix recebidos pela data (`CHANGED`).

### As skills e a leitura

`conexus-connector`; o guia de testes T5 e T29.

### A ordem do trabalho

1. **O conector.** Critérios: 31, 32. **Testes:** `sicoob/*.test.ts` (novos).
   - **Mutações à mão:** pedir o extrato além dos 3 meses: o 31 fica vermelho.

### Como se prova

O dublê do Sicoob; a gravação no sandbox espera o acesso dele e a sua palavra.

### Parar se

O portal, quando abrir, diverge da biblioteca de terceiro na rota ou no corpo.

## Os pontos de conferência

| Grupo | Fica de pé ao fim do grupo | Prova |
| --- | --- | --- |
| GA1 | O HubSpot na forma do kit, as três tabelas, a marca de origem | o servidor local com o dublê; a gravação espera o acesso |
| GA2 | O app serve a dois conectores; **Minhas ligações** | duas pessoas no servidor local, a 1280 e a 390 px |
| GA3 | O Gmail, o Drive e a caixa do setor | o roteiro dos passos 1 a 3 |
| GB1 | O Outlook e o SharePoint | o roteiro da parte C |
| GT1 | A Fábrica e o login do TOTVS | o `connector:check` sobre três conectores |
| GT2 | O TOTVS Protheus | as treze tabelas pelo dublê |
| GD1 | O certificado e o Sicoob | o dublê com o `.pfx` gerado |

## O que o cartão não prova

- O corpo de um e-mail com documento (CPF) não passa pela declaração de colunas pessoais.
- A classe da credencial do HubSpot, do Google, da Microsoft, do TOTVS e do Sicoob: exclusiva até medir.
- O PKCE no app do HubSpot, os escopos reais e os limites por conta.
- O formato real do token do RM e o `length` do RM.
- O texto oficial da NT e o do Sicoob.
- Que o sistema responde como o dublê da documentação: só a gravação prova.
