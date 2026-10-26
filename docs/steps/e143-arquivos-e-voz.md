# Etapa 14.3: Arquivos e voz

## A página do fundador

**No fim desta etapa** você anexa um PDF, um `.md`, um `.txt` ou uma imagem na conversa com o
Builder, e ele lê o arquivo; e dita a mensagem pelo microfone do navegador. A caixa de escrever
começa com uma linha e cresce, tem um botão só que é **Parar** ou **Enviar**, um anel só de memória,
e embaixo dela uma linha pequena.

**O roteiro de uso.** Padaria Sol, com Ana (dona), no computador e no celular.

1. "Encomendas" › **Conversa**. A caixa tem uma linha. Na mesma linha, da esquerda para a direita:
   o anel da memória com "0%" ao lado, o modelo, o **+**, o **microfone** e a seta **Enviar**.
   Embaixo, uma linha pequena: "Não cole senhas ou chaves na conversa."
2. Ana toca no **+** e escolhe `tabela-de-precos.pdf` e `logo.png` (também pode colar ou arrastar).
   Cada um vira uma etiqueta acima do texto, a imagem em miniatura, com um **x**. Ela escreve
   "Monte um app de encomendas com os produtos e preços desta tabela." e envia. A bolha dela mostra
   o texto e as duas etiquetas; o Builder responde citando os produtos da tabela.
3. Com o Builder trabalhando e a caixa vazia, o botão é **Parar** (quadrado). Ana anexa
   `observacoes.md`: o botão vira **Enviar** (seta), e o arquivo vai como orientação no meio do
   trabalho; a bolha aparece com a etiqueta, primeiro como pendente.
4. Ana toca no **microfone** e fala: "acrescente o telefone do cliente". O texto aparece na caixa
   enquanto ela fala; ela toca de novo para parar, corrige uma palavra e envia.
5. Ana clica no anel: abre a janela com as duas memórias, Mensagens e Memória, com os números.
   Recarrega a página: a bolha com as etiquetas continua lá.
6. No celular: a mesma linha, o anel sem o número ao lado. Se o navegador não deixar usar o
   microfone, aparece uma frase dizendo isso. No iPhone com o Hub na tela de início, onde o
   navegador não ouve, o microfone não aparece, ou diz que ali não dita.

**O que você faz, e quando.** Antes: nada. No começo: aprova esta página. No fim: faz o roteiro
no computador e no celular, diz o que viu e aprova os textos das telas.

**Fica de fora.**
- Arquivos dentro do app ou da máquina do Builder: na 14.3 o arquivo fica só na conversa, na
  mensagem, no banco do Hub (sua palavra "A1 sim", 2026-10-25).
- Transcrição de áudio no servidor (Whisper e outras): a voz é o ditado do navegador (sua palavra
  "B1 okay", "B1 por agora", 2026-10-25).
- O processamento da voz no próprio aparelho: não se liga (sua palavra "C sim", 2026-10-25); ligado,
  ele falha onde o pacote de português não está instalado.
- Um PDF com mais de 100 páginas: o Claude recusa, e a conversa mostra a falha da volta, como hoje.
- Das issues `next-card` entram duas: a #170 (uma linha repetida no teste do compositor, que a U2
  reescreve) e a #167 (a mensagem enviada volta à caixa depois de A→B→A; sua palavra "9 A" de
  2026-10-21; a U3 muda o rascunho para levar os arquivos e corrige isso junto). A #171 espera: as
  quatro peças que ela cita não mudam aqui. As outras não tocam estas pastas.

**As decisões suas nesta etapa.** Todas dadas:
- **A1**, nativo: os arquivos entram só na conversa com o Builder. "A1 sim", 2026-10-25.
- **B1**, nativo: a voz é o ditado do navegador, sem transcrição no servidor. "B1 okay",
  "B1 por agora", 2026-10-25.
- **C**, nativo: o processamento no aparelho fica desligado. "C sim", 2026-10-25.
- **D1**, nativo: uma linha só embaixo da caixa, menor, com "Não cole senhas ou chaves na
  conversa."; a dica de teclado sai (Enter continua enviando e Shift+Enter quebrando a linha), e a
  regra de design V30 muda com a sua palavra. "D. D1", 2026-10-26.
- **E1**, nativo: um anel só, dentro da linha da caixa, à esquerda; no computador o percentual da
  janela de mensagens ao lado ("12%"), no celular só o anel; o clique abre as duas memórias.
  "E. E1", 2026-10-26.
- **D1a**, nativo: a linha embaixo da caixa fica em 12 px (`text-fact`), o tamanho que já existe;
  fica menor porque passa de duas linhas para uma e o texto encurta. A regra de design V13 não
  muda e não há tamanho novo na marca (o estudo escreveu "menor (11 px)", e V13 pede no mínimo
  12 px para texto corrido). "D1A", 2026-10-26.
- Os pedidos do compositor de 2026-10-25, que esta etapa cumpre: "podemos ter apenas um igual
  codex"; "poderia ser menor só tendo, tipo, uma linha de escrever"; "ela tá embaixo da box";
  "Deixar uma coisa bem menor. Mais simples"; "só uma barra de girar ... quando clica, que abriria
  os dois".

Nenhuma linha remendo: as peças são do Mastra que usamos, do shadcn e do AI Elements, de onde já
vieram as peças da conversa (decisão 0033).

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |
| U1 | O Hub aceita mensagens com arquivos: o teto de 30 MiB nas rotas do Mastra, o CSP das miniaturas, o dublê da Anthropic que vê os arquivos, o cenário `files` gravado | `apps/server/src/builder/conversation/`, `apps/server/src/platform/`, `scripts/record.ts` | segurança | — |
| U2 | A linha do compositor: a caixa de uma linha que cresce, uma linha de ações em todo tamanho, o botão único Parar/Enviar, a linha de baixo (D1) | `apps/web/src/builder/conversation/`, `apps/web/src/ui/use-mobile.ts` | web | — |
| U3 | Os arquivos: `ui/attachment.tsx`, o hook de anexos, o rascunho com arquivos (e a #167), o envio com `files`, a bolha com etiquetas | `apps/web/src/ui/`, `apps/web/src/builder/conversation/` | web | U1, U2 |
| U4 | O ditado: `ui/speech-input.tsx`, `pt-BR`, a frase em andamento na caixa, a frase por erro | `apps/web/src/ui/`, `apps/web/src/builder/conversation/` | web | U2 |
| U5 | O anel único (E1) | `apps/web/src/builder/conversation/` | design | U2 |

**A entrega.** Cada unidade é o seu próprio pull request, sobre o `main` com as anteriores já dentro
([entrega L9](../guides/delivery.md)): o CI verde, uma revisão por um revisor Opus e então o
firstmate a junta ao `main`, uma de cada vez ([L13](../guides/delivery.md); sua palavra "3. A",
2026-10-25). A ordem é U1, U2,
U3, U4, U5: a U3 lê a gravação da U1 e a linha da U2; U3, U4 e U5 mudam `builder/conversation/` e
não correm em paralelo. Cada unidade parte do `main` com a anterior já dentro.

**Orçamento de código alterado.** U1 60; U2 70 (sai mais do que entra); U3 230; U4 100; U5 −40.
Total da etapa: ~420 linhas sem testes, teto 4.000 (L2). O estudo estimou ~600 com testes.
Medido no fechamento, sem testes, gravações e documentos (entra/sai): U1 +97/−16; U2 +38/−57;
U3 +476/−65; U4 +189/−9; U5 +58/−96. O teto de 4.000 linhas (L2) vale.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | `POST …/sessions/:id/messages` com um PDF de 2 MiB é aceito e chega ao modelo; um corpo acima de 30 MiB responde 413 `REQUEST_TOO_LARGE` e o modelo não é chamado | `apps/server/src/builder/conversation/conversation-files.test.ts`, "um PDF de 2 MiB passa; 30 MiB e um byte é 413" | must |
| 2 | U1 | O pedido ao modelo leva o `.md` como texto `[File: observacoes.md]`, o PDF como `document` e o PNG como `image`; um PDF enviado com o Builder trabalhando chega ao modelo na mesma volta | `conversation-files.test.ts`, "cada tipo chega ao modelo na sua forma" e "o arquivo enviado no meio do trabalho entra na volta"; um envio só com o arquivo, sem texto, chega ao modelo, e o teste "só o arquivo, sem texto" o prova | must |
| 3 | U1 | A página do Hub responde com `img-src 'self' data:` e nada mais muda no CSP | `apps/server/src/platform/http.test.ts`, o caso do cabeçalho CSP | must |
| 4 | U2 | Vazia, a caixa tem uma linha; cresce com o texto até a altura máxima e então rola | `apps/web/src/builder/conversation/composer.test.tsx`, "a caixa começa com uma linha" (as classes do campo) e a captura da QA | must |
| 5 | U2 | A linha de ações dentro da caixa em todo tamanho: à esquerda o anel e o modelo, à direita +, microfone e botão; quando falta espaço, o anel e o modelo descem para uma segunda linha dentro da caixa (fundador, "A" e depois "F", 2026-10-26); nada da memória embaixo da caixa | `composer.test.tsx`, "uma linha de ações em todo tamanho", a 1280 e a 390 px | must |
| 6 | U2 | Builder trabalhando e caixa vazia (sem texto e sem arquivo): um botão, **Parar**, e Esc para. Com texto ou arquivo: **Enviar**, que orienta. Parado: **Enviar**, desabilitado com a caixa vazia. Nunca os dois juntos | `composer.test.tsx`, "um botão só: Parar com a caixa vazia, Enviar com texto" | must |
| 7 | U2 | Embaixo da caixa, no computador, uma linha só: "Não cole senhas ou chaves na conversa.", em 12 px (`text-fact`, D1a). Nenhuma dica de teclado. No celular, nada embaixo da caixa; a frase segue na conversa vazia e na folha do modelo | `composer.test.tsx`, "embaixo da caixa só a linha das senhas" | must |
| 8 | U3 | **+**, colar e arrastar adicionam PDF, `.md`, `.txt` e imagem como etiquetas com **x**; o **x** tira | `apps/web/src/builder/conversation/attachments.test.tsx`, "escolher, colar e soltar viram etiquetas" | must |
| 9 | U3 | Um 21º arquivo, um arquivo cuja data URL passa de 14 680 064 caracteres, ou uma soma acima de 29 360 128, é recusado no compositor com uma frase, e nada é enviado; cada frase diz o teto que o código aplica, calculado dos mesmos `LIMITS` | `attachments.test.tsx`, "os tetos da rota recusam com frase" (a frase lê o número de `LIMITS`) | must |
| 10 | U3 | O envio leva `{ content, files }` à rota do Mastra, com data URL inteira (`data:text/markdown;base64,…` para um `.md` que o navegador deu sem tipo) | `attachments.test.tsx`, "o envio leva os arquivos como data URL" | must |
| 11 | U3 | A bolha da pessoa mostra o texto e uma etiqueta por arquivo, ao vivo, pendente e depois de recarregar; a imagem em miniatura; nenhum erro de CSP no console | `apps/web/src/builder/conversation/person-turn.test.tsx`, sobre a gravação `files` (T26); a QA lê o console | must |
| 12 | U3 | Um envio recusado devolve texto e arquivos à caixa; recarregar a página guarda o texto da caixa e tira os arquivos anexados, como nas referências; trocar de conversa A→B→A antes da resposta não mostra de novo o que foi enviado (#167) | `apps/web/src/builder/conversation/panel.test.tsx`, "o envio que falha devolve texto e arquivos", "A→B→A não repete a mensagem" e "recarregar guarda o texto e tira os arquivos" | must |
| 13 | U4 | O microfone escreve em português na caixa, com a frase em andamento à vista, e para no segundo toque | `apps/web/src/builder/conversation/dictation.test.tsx`, com o reconhecimento dublado | must |
| 14 | U4 | Microfone recusado (`not-allowed`, `service-not-allowed`), idioma indisponível ou silêncio: uma frase em português por código; o segundo toque para sem frase de erro (`aborted` não mostra frase); sem `SpeechRecognition` no navegador, o microfone não é desenhado. No iPhone com o Hub na tela de início, o microfone não é desenhado ou mostra a frase do código, e a QA da U4 registra qual dos dois acontece | `dictation.test.tsx`, "cada erro tem sua frase", "o segundo toque para sem frase" e "sem reconhecimento não há microfone"; o iPhone, a QA | must |
| 15 | U5 | Um anel com o percentual de `pendingTokens/threshold`; no computador o número ao lado ("12%"), no celular só o anel; o nome lido diz as duas memórias | `apps/web/src/builder/conversation/memory-status.test.tsx`, "um anel com o percentual" | must |
| 16 | U5 | O clique no anel abre a janela com Mensagens e Memória e seus números, como hoje | `memory-status.test.tsx`, "o clique abre as duas memórias" | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Compositor (U2) | caixa de uma linha, "Escreva sua mensagem"; no celular a frase das senhas fica na conversa vazia (V30) | **Enviar** desabilitado | o botão desabilitado durante o envio (`sending`) | a frase do envio (`UNCONFIRMED_SEND` ou a do código), texto e arquivos ficam | `CONVERSATION_NOT_FOUND`: a conversa sai, como hoje | sem conta de modelo: o aviso de hoje, sem modelo na linha | trabalhando com a caixa vazia: **Parar** |
| Etiquetas no compositor (U3) | nenhuma; recarregar a página guarda o texto da caixa e tira os arquivos anexados | nenhuma | — (a leitura é local e curta) | a frase do teto: "Até 20 arquivos por mensagem.", "Este arquivo passa de 10,5 MB.", "Os arquivos passam de 21 MB juntos." (os números saem de `LIMITS`) | — | — | um tipo fora do `accept` não aparece no seletor; colado ou solto: "Este tipo de arquivo não é aceito." |
| Bolha da pessoa (U3) | — | só texto, como hoje | pendente com "Vai ao Builder no próximo passo" | — | — | — | — |
| Microfone (U4) | o botão, parado | — | ouvindo: o botão marcado (`aria-pressed`), o texto em andamento na caixa | "Permita o microfone no navegador para ditar." (`not-allowed`, `service-not-allowed`); "Este navegador não dita em português." (`language-not-supported`); "Não ouvimos nada. Tente de novo." (`no-speech`); outro código: "O ditado parou. Tente de novo."; `aborted` (o segundo toque, `stop()`): nenhuma frase | — | sem `SpeechRecognition`: o botão não é desenhado | — |
| Anel da memória (U5) | anel vazio, "0%" no computador | igual | o anel gira enquanto observa (`omPhase`) | a marca de falha de hoje, e a frase na janela | — | — | — |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `MessageFile.data` (data URL) | web, o hook de anexos (`readAsDataURL`) | Mastra (a rota e `createMessageInput`); web, a etiqueta e a miniatura |
| `MessageFile.mediaType` | web, o hook (o tipo do navegador, ou pela extensão) | Mastra (`document`, `image` ou texto); web, o ícone da etiqueta |
| `MessageFile.filename` | web, o hook | Mastra (`[File: nome]`); web, a etiqueta |
| `Outgoing` `{ content, files }` | web, o compositor | `useSending.send`, `sessionOf().send` |
| `Steer.files` | `useSending.send` | `transcript.tsx`, a bolha pendente |
| `Draft.files` | o hook de anexos | o compositor, o envio |

**Desenho de caixas.** A captura do fundador do compositor de hoje (`composer-2026-10-25.jpg`, fora
do repositório): duas bolinhas de memória embaixo da caixa, a caixa alta, duas linhas de dica. O
desenho segue a Factory do Mastra (`Composer.tsx:266-300`, modelo e memória à esquerda, botões à
direita, dentro da caixa) e as linhas do fundador.

```text
1280 px, Builder trabalhando, um arquivo anexado
┌──────────────────────────────────────────────────────────────┐
│ [▤ tabela-de-precos.pdf ×] [▣ logo.png ×]                    │
│ Escreva para orientar o Builder                              │
│ ◔ 12%   Claude Sonnet ▾                         [+] [mic] [↑] │
└──────────────────────────────────────────────────────────────┘
              Não cole senhas ou chaves na conversa.

390 px, Builder trabalhando, caixa vazia
┌─────────────────────────────────┐
│ Escreva para orientar o Builder │
│ ◔  Claude Sonnet ▾              │
│                  [+] [mic] [■]  │
└─────────────────────────────────┘
(a linha de status desce para uma segunda linha dentro da caixa quando falta espaço; nada
embaixo da caixa; a frase das senhas fica na conversa vazia e na folha do modelo)
```

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |
| `POST …/messages` com `files` (rota do Mastra, `@mastra/server` 1.79.0) | o compositor manda um de cada vez (`sending`); dois de abas diferentes entram como duas mensagens, como hoje | resposta cortada, 502 ou 503: a frase `UNCONFIRMED_SEND`, texto e arquivos voltam à caixa se ela estiver vazia (#167); um corpo que não chega em 30 s (`requestTimeout`): a mesma frase | o banco fora: `DATABASE_UNAVAILABLE`, a mesma volta à caixa; a Anthropic fora: a falha da volta da 14.2 | 413 `REQUEST_TOO_LARGE`; o resto como hoje | 1, 9, 12 |
| `saveMessages` da mensagem com o arquivo (`@mastra/pg` 1.32.0) | uma por mensagem, pelo Mastra | o Mastra guarda a linha antes da volta; uma falha é a da 14.2 | o banco fora: o mesmo | como hoje | 11 |
| O ditado (`SpeechRecognition`, só no navegador) | um reconhecimento por compositor; o segundo toque para | o reconhecimento parado no meio guarda o texto já final na caixa | o serviço do navegador fora: a frase do código | nada no servidor | 13, 14 |

## A tabela de referência

| Peça | Unidade | Hoje no main | Referência | Como a referência faz | Veredito | Prova, se não for nativo | Palavra do fundador | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Teto do corpo nas rotas do Mastra | U1 | `apps/server/src/builder/conversation/guard.ts:115` `new MastraServer({ app: scope, mastra })`, sem teto: vale o 1 MiB do Fastify | `@mastra/fastify@1.5.23` `dist/index.js:542-571`; `@mastra/server@1.79.0` `dist/server/server-adapter/index.d.ts:51-54, 171-174` | Provado: `bodyLimit = route.maxBodySize ?? bodyLimitOptions.maxSize` por rota POST; o 413 vai ao tratador de erro do Fastify; `onError` não é chamado pelo adaptador | nativo: `bodyLimitOptions: { maxSize: 30 MiB, onError: (e) => e }`; vale para os 3 POST da lista fixa (`guard.ts:24-31`) | `runs/body-limit.txt` do estudo | não precisa | |
| 413 vira a falha do Hub | U1 | `http.ts:78-91` `CLIENT_ERRORS[413] = 'REQUEST_TOO_LARGE'` por status; `guard.ts:45` já lista `REQUEST_TOO_LARGE` | Fastify `FST_ERR_CTP_BODY_TOO_LARGE`, status 413 | Provado (resposta acima) | nativo (code C50: status, nunca texto) | | não precisa | |
| Tempo para receber o corpo | fica como está | `http.ts:23` `REQUEST_TIMEOUT_MS = 30_000` | `fastify@5.12.5` `requestTimeout` (todo o pedido) | Lido: 30 MiB em 30 s pede ~8,4 Mbit/s de subida | nativo, fica: a falha já tem frase (`UNCONFIRMED_SEND`), e os arquivos voltam ao rascunho | | não precisa | |
| Rota de mensagem com arquivos | U3 | `session.ts:24` `send: (content) => said(session.sendMessage(content))` | `@mastra/server@1.79.0` `dist/server/handlers/agent-controller.js:169-187, 650-679`; `@mastra/client-js@1.56.0` `dist/resources/agent-controller.d.ts:191-203`, `dist/index.js:7169-7173` | Lido: `files` até 20, `data` ≤ 14 680 064 caracteres, soma ≤ 29 360 128 (constantes não exportadas); `message: z.string()` aceita texto vazio; repassa a `session.sendMessage({ content, files })` | nativo | | não precisa | |
| O que o modelo recebe | U1 | nenhum | `@mastra/core@1.79.0` `dist/agent-controller-DO6rGsQm.js:5232-5260` (`createMessageInput`); `dist/message-list-Bfir0O2V.js:12016-12063, 13250-13295`; `@ai-sdk/anthropic@3.0.133` | Provado (`runs/native-files.json` do estudo, corpo enviado ao Messages API): `.md` → texto `[File: precos.md]` + bloco cercado; PDF → `document` base64; PNG → `image` base64. O data URL é "baixado" pelo `fetch` global antes de cada chamada | nativo | | não precisa | |
| Arquivo enviado durante o trabalho | U1, U3 | `panel.tsx:84-98` manda `content` também durante o trabalho; `session-state.ts:12` `Steer = { id, content }` | mesma fonte, `agent-controller-DO6rGsQm.js:5581-5600` (`sendMessage` → `sendSignal`) | Provado: chega ao modelo como `<user delivery="while-active">texto</user>`, o `.md` como texto e o PDF como `document` na mesma mensagem | nativo; `Steer` ganha `files` | | não precisa | |
| `.md` precisa do prefixo `data:` | U3 | nenhum | `agent-controller-DO6rGsQm.js:5236-5240`; Factory `useComposerImages.ts:13-23` tira o prefixo (só imagens) | Provado: base64 puro de um `.md` chega ao modelo como `IyBQcmXD...` | nativo, com a regra de mandar `readAsDataURL` inteiro (AI Elements `prompt-input` faz assim, `convertBlobUrlToDataUrl`, `ai-elements-prompt-input.tsx:81-93`) | `runs/native-files.json` do estudo, chamada 2 | não precisa | |
| Onde os bytes ficam | U3 | Postgres do Hub pelo armazenamento do Mastra (`builder.ts:151`); conversa da pessoa pela `resourceId` (`guard.ts:93-98`) | `@mastra/pg@1.32.0` (`JSON.stringify(message.content)`) | Provado no armazenamento em memória: a linha `signal` guarda `text`, `text` (o `.md`) e `file` com o data URL, uma cópia | nativo: a mesma fronteira da mensagem | | A1, 2026-10-25 | |
| Evento ao vivo da mensagem | U3 | `messages.ts:48-58` `userText` lê só `text` de `data-user-message` | o mesmo fluxo | Provado: `message_start` da linha `signal` traz o data URL duas vezes (`data.contents` e `metadata.signal.contents`) | nativo; `userText` passa a devolver as partes `text` e `file` | | não precisa | |
| Memória observacional com anexos | fica como está | `observational-memory-settings.ts` sem opção | `@mastra/memory@1.39.0` `dist/src-DxZ7N8nO.js:26266` (`observeAttachments: ["image/*","application/pdf"]`), `:30677-30692` | Lido: PDF conta `max(1500, bytes/3)` tokens para Anthropic; 1 MB ≈ 350 mil, acima da janela de 30 mil, então observa e tira o arquivo da janela | nativo, padrão mantido | | não precisa | |
| Tipo que o modelo recusa | fica como está | nenhum | `@mastra/core@1.79.0` `dist/agent-tuAMgHe3.js` (`UnsupportedFileHandler`, padrão) | Lido: troca o arquivo recusado por `[Attachment unavailable: nome]` e tenta uma vez | nativo; o `accept` do seletor já limita aos tipos que o Claude lê | | não precisa | |
| Etiquetas no compositor | U3 | nenhum (`composer.tsx:85-127`) | shadcn base `attachment` (registro público, lido em 2026-10-26: "Use it for files and images in chat composers, message threads"); Factory `ComposerImageAttachments.tsx`; AI Elements `attachments` | Documentado: `Attachment`, `AttachmentMedia` (ícone ou imagem), `AttachmentTitle`, `AttachmentAction`, `AttachmentGroup` | nativo: copiado para `ui/attachment.tsx` e pintado (decisão 0033) | | não precisa | `apps/web/src/ui/attachment.tsx` |
| **+**, colar, arrastar, tetos | U3 | nenhum | Factory `useComposerImages.ts:25-81`, `Composer.tsx:242, 257-277`; AI Elements `prompt-input` (`accept`, `maxFiles`, `maxFileSize`, `onError`, colar `:1016`); playground `attachment-kind.ts:5-33` (tipo pela extensão, "Browsers can omit these types"); vibesdk `use-image-upload.ts:38-56` | Lido: `<input type=file multiple accept>`, `readAsDataURL`, colar e soltar no form, recusa com frase | embrulhado: o nosso hook mede o data URL com os tetos da rota (20, 14 680 064, 29 360 128), as frases de recusa saem dos mesmos números, e dá `text/markdown` a um `.md` sem tipo | Teste de tela do hook (critérios 8 a 10) | não precisa | `apps/web/src/builder/conversation/attachments.ts` |
| Arquivos no rascunho | U3 | `draft.ts:15-34` guarda o texto no `sessionStorage` por conversa | Factory `ComposerImagesContext.ts:6-15` (estado React) | Lido: imagens no estado da tela; saem ao enviar e voltam se falhar (`Composer.tsx:142-152`) | nativo: arquivos na memória da tela por conversa, ao lado do texto; não no `sessionStorage` (cota de ~5 MB); recarregar guarda o texto e tira os arquivos, como as referências | | não precisa | |
| A bolha da pessoa com as etiquetas | U3 | `person-turn.tsx:21-27` desenha só `text`; `transcript.tsx:103-105` pendente só com texto | playground `split-message-attachments.ts:6-21` (`:6-11` trata como anexo a parte de texto que casa com `<attachment name="…">…</attachment>`); Factory `MessageBubble.tsx:223` (`UserFilePartRenderer`) | Lido: separa as partes de anexo do conteúdo e desenha cada uma | embrulhado: além das partes `file`, a parte de texto que começa com `[File: nome]` e um bloco cercado (o formato do Mastra, `agent-controller-DO6rGsQm.js:5241`) vira etiqueta | Teste da bolha sobre a gravação nativa (T26, critério 11) | não precisa | |
| Miniatura da imagem | U1 | CSP `imgSrc: ["'self'"]` (`http.ts:39`) | AI Elements `prompt-input` usa `URL.createObjectURL` (`:277, 620`); a U3 não o usa: lê com `readAsDataURL`, e a linha guardada volta como `data:` | Lido | embrulhado: `imgSrc` ganha `data:` | Teste de cabeçalho em `http.test.ts` (critério 3) e captura sem erro de CSP | não precisa | |
| Caixa de uma linha que cresce | U2 | `textarea.tsx:12` já `field-sizing-content max-h-48 min-h-9`; `composer.tsx:99` põe `md:min-h-16 pt-md` | Mastra `packages/playground-ui/src/ds/components/Composer/composer.tsx:110-111` (`field-sizing-content`, `min-h-10`); vibesdk `prompt-box.tsx:183-184` (`rows={1}`, `max-h-[120px]`) | Lido | nativo: sai a classe de `composer.tsx:99` | | 2026-10-25 "poderia ser menor só tendo, tipo, uma linha" | |
| Uma linha de ações em todo tamanho | U2 | `composer.tsx:46-49, 101-130`: memória dentro da linha só no celular largo (`inRow`), embaixo no resto | Factory `Composer.tsx:266-300` (`StatusLine` com modelo e memória à esquerda, botões à direita, dentro da caixa) | Lido | nativo: uma linha só; saem `inRow`, `useIsNarrow` e as duas posições da memória | | 2026-10-25 "ela tá embaixo da box" | |
| Um botão Enviar/Parar | U2 | `composer.tsx:104-125` Parar e Enviar lado a lado | AI Elements `PromptInputSubmit` (`ai-elements-prompt-input.tsx:1216-1263`: Parar enquanto `streaming`, `type="button"`); Factory `Composer.tsx:279-298` (os dois) | Lido | embrulhado: Parar quando trabalhando **e** sem texto nem arquivo; senão Enviar. Esc continua parando | Teste de tela (critério 6) | 2026-10-25 "podemos ter apenas um igual codex" | |
| Linha embaixo da caixa | U2 | `composer.tsx:131-134` duas linhas `text-fact` (12 px): a dica de teclado (`STEER_KEYS` trabalhando) e `NO_SECRETS`; V30 pede a dica de teclado | Factory: nenhuma; Claude e ChatGPT: um aviso pequeno (capturas do fundador) | — | nativo: uma linha, "Não cole senhas ou chaves na conversa.", em `text-fact` (12 px, D1a); a dica de teclado sai; V30 muda | | D1, 2026-10-26: "D. D1"; D1a, 2026-10-26: "D1A" | |
| Anel único da memória | U5 | `memory-status.tsx:16-58, 66-167` dois `TokenRing` e o `compact` | Factory `OperationalMemoryStatus.tsx:27-92` sobre `TokenBudget` (`packages/playground-ui/src/ds/components/TokenBudget/token-budget.tsx:25-90`, `role="meter"`); números do Mastra em `session-state.ts:7` (`Display['omProgress']`) | Lido: anel com `aria-valuenow`, o número ao lado, a janela com as duas memórias | nativo: um anel de `pendingTokens/threshold`, à esquerda na linha da caixa; no computador o percentual ao lado, no celular só o anel; a janela fica | | 2026-10-25 "só uma barra de girar ... quando clica, que abriria os dois"; E1, 2026-10-26: "E. E1" | |
| Microfone: ditado | U4 | nenhum | AI Elements `speech-input` (`ai-elements-speech-input.tsx:75-178, 260-330`); Mastra `client-sdks/react/src/voice/use-speech-recognition.ts:76-130`; Conexus OS `apps/web/src/features/builder/composer/use-dictation.ts:36-83` | Lido: `SpeechRecognition ?? webkitSpeechRecognition`, `continuous`, `interimResults`, `lang`; o AI Elements cai para `MediaRecorder` com `onAudioRecorded` | embrulhado: copiado para `ui/`, `lang='pt-BR'`, frase em andamento na caixa, frase por código de erro (`not-allowed`, `service-not-allowed`, `language-not-supported`, `no-speech`); sem `onAudioRecorded`, o botão some onde não há reconhecimento | Teste com o reconhecimento dublado (critérios 13 e 14) | A1 B1 C, 2026-10-25 | `apps/web/src/ui/speech-input.tsx` |
| `processLocally` | U4 | — | MDN, on-device speech recognition (lido em 2026-10-26) | Documentado: `true` exige o pacote no aparelho, senão `start()` falha com `language-not-supported` | nativo: não ligar (padrão `false`) | | "C sim", 2026-10-25 | |
| Tipos do Web Speech | U4 | — | `typescript@6.0.3` `lib/lib.dom.d.ts:35515-35627` tem os eventos e resultados, e `:44456` o tipo `SpeechRecognitionErrorCode`; não tem a interface `SpeechRecognition` nem o construtor | Lido | embrulhado: uma declaração da interface (`continuous`, `interimResults`, `lang`, `start`, `stop`, `onresult`, `onerror`, `onend`) e do construtor na peça, com o código de erro do `lib.dom` (o Conexus OS fazia `use-dictation.ts:3-23`) | `npm run typecheck` | não precisa | |
| Microfone no CSP e cabeçalhos | fica como está | `http.ts` sem `Permissions-Policy` (helmet não define) | — | Lido | nativo | | não precisa | |
| Gravação nativa com arquivos (T26) | U1 | `scripts/record.ts` cenários `cited`, `thinking`, `abort`, `plan`; o dublê recusa qualquer endereço fora da Anthropic (`record.ts:71-74`) | o mesmo fluxo | Provado: com esse dublê o PDF e a imagem viram `[Attachment unavailable]`, porque o Mastra busca o data URL pelo `fetch` | embrulhado: cenário `files` no `record.ts`, deixando `data:` ir ao `fetch` real | `runs/native-files.json` do estudo (primeira rodada, antes do ajuste) | não precisa | `apps/server/src/platform/recordings/mastra/files.jsonl` |
| Arquivo dentro do app ou da máquina | fica de fora (A1) | nenhum | Dyad `902829f` `src/ipc/types/chat.ts:110` (`upload-to-codebase` e `chat-context`), `chat_attachment_utils.ts:100-114`; `@mastra/core` `FileUploadProcessor` | Lido | nativo: a 14.3 é só `chat-context` | | "A1 sim", 2026-10-25 | |
| Transcrição no servidor | fica de fora (B1) | `providers.ts:15-27` tira modelos de áudio | o estudo anterior, linhas de voz do Mastra | — | nativo: a voz é o ditado do navegador | | "B1 por agora", 2026-10-25 | |

As referências fora do `node_modules`: Mastra na estante `mastra-1.78` em `6a465f9d` (a Factory em
`mastracode/factory-ui/src/ui/domains/chat/components/`, o playground em `packages/playground-ui/`),
vibesdk `9da158d`, Dyad `902829f`, Conexus OS `e0353c36`. O shadcn `attachment` e o AI Elements
`prompt-input` e `speech-input` vêm dos registros públicos, lidos em 2026-10-26; a unidade que os
copia relê o registro e cita a versão que copiou.

**A medida do transplante.** Nenhum código do Conexus OS. O `use-dictation.ts` do OS é só leitura:
a peça vem do AI Elements, e do OS fica a lição do `processLocally`.

**A dívida.** Nenhuma.

## U1 O Hub aceita mensagens com arquivos

**Base e modelo.** `main` no commit em que o cartão for aprovado. Sonnet: opção de biblioteca, um
cabeçalho, um teste e uma gravação.

### As linhas da tabela

- **Teto do corpo nas rotas do Mastra** e **413 vira a falha do Hub**: `guard.ts:115`; o tipo em
  `@mastra/server@1.79.0` `dist/server/server-adapter/index.d.ts:51-54` (`bodyLimitOptions`,
  `onError` obrigatório) e o uso em `@mastra/fastify@1.5.23` `dist/index.js:542-571`. O 413 já vira
  `REQUEST_TOO_LARGE` em `http.ts:78-91`.
- **O que o modelo recebe** e **Arquivo enviado durante o trabalho**: provados pelo teste do
  critério 2, pela porta pública.
- **Miniatura da imagem**: `http.ts:39`.
- **Gravação nativa com arquivos**: `scripts/record.ts:71-74` (o `replaying` que recusa outros
  endereços), `:47` (o `Scenario`), `:119` (o `sendMessage`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/conversation/guard.ts` | Muda: `bodyLimitOptions` | `registerBuilderRoutes`, chamado pelo `app.ts` |
| `apps/server/src/builder/conversation/conversation-files.test.ts` | Cria | — |
| `apps/server/src/platform/http.ts` | Muda: `imgSrc` | todo o Hub |
| `apps/server/src/platform/http.test.ts` | Muda: o caso do CSP | — |
| `apps/server/src/platform/test-anthropic-body.ts` | Muda: `Sent.media` | os testes do servidor que leem `sent` |
| `scripts/record.ts` | Muda: o cenário `files` | `npm run record` |
| `apps/server/src/platform/recordings/mastra/files.jsonl` | Cria (gerado) | `test-recorded.ts` da web (U3) |

### Os contratos que a unidade cria

```ts
// guard.ts: 30 MiB, a soma de 29 360 128 caracteres da rota, a mensagem, as chaves do JSON e folga.
const BODY_LIMIT = 31_457_280
new MastraServer({ app: scope, mastra, bodyLimitOptions: { maxSize: BODY_LIMIT, onError: (error) => error } })

// http.ts
imgSrc: ["'self'", 'data:']

// test-anthropic-body.ts: o que não é texto nas mensagens, em ordem.
type Media = { type: 'document' | 'image'; mediaType: string }
type Sent = { /* os campos de hoje */ media: Media[] }
```

- O `onError` existe só porque o tipo o exige; o adaptador Fastify não o chama. Um comentário diz
  isso com a linha da biblioteca (C70).
- O cenário `files` manda, numa primeira mensagem, um texto, `observacoes.md` (`text/markdown`), um
  PDF mínimo inventado e um PNG de 1×1, e, com a volta em curso, uma segunda mensagem com um PDF.
  Os arquivos são pequenos e inventados (S40).

### As skills e a leitura

`mastra` (linhas de `@mastra/server` e `@mastra/fastify` em `docs/reference/stack.md`);
`fastify-best-practices` para o `bodyLimit`. O helmet: README.

### A ordem do trabalho

1. `conversation-files.test.ts` primeiro, falhando hoje: pela porta pública (`test-hub.ts`, T5), um
   `POST …/messages` de 2 MiB volta 413 hoje.
2. `guard.ts`: `bodyLimitOptions`. Funções: `@mastra/server@1.79.0` `MastraServer`, opção
   `bodyLimitOptions.maxSize` (sem padrão). O teste do passo 1 passa; acrescentar o caso de
   30 MiB + 1 byte → 413 `REQUEST_TOO_LARGE`, sem chamada ao modelo.
3. `test-anthropic-body.ts`: `media`, lido das partes `document` e `image` do corpo. Os casos do
   critério 2: `.md` em `texts` com `[File: observacoes.md]`; PDF e PNG em `media`; o PDF enviado
   durante a volta aparece no pedido seguinte da mesma volta; um envio só com o arquivo e `message` vazio chega com o arquivo e sem parte de texto vazia ("só o arquivo, sem texto"). A data URL vai inteira
   (`data:text/markdown;base64,…`), como a U3 vai mandar.
4. `http.ts`: `imgSrc`; `http.test.ts` confere o cabeçalho inteiro.
5. `record.ts`: `files` no `Scenario`; no `replaying`, um endereço `data:` vai ao `fetch` real; as
   respostas do modelo vêm do dublê do Messages API, como o `plan`. `npm run record -- files`.
   Regras: T26, S40.

### Como se prova

Critério 1 e 2: `conversation-files.test.ts`, gravação nenhuma, só a porta pública; hoje o caso de
2 MiB falha com 413. Critério 3: `http.test.ts`. A gravação: a primeira linha diz a biblioteca, a
versão e a data; as linhas `row` guardam a parte `file` com a data URL.

### Parar se

- O 413 não vira `REQUEST_TOO_LARGE` pela porta pública: o tratador central não está no escopo do
  Mastra; parar e relatar, sem tratador novo.
- A segunda mensagem do cenário não entra na mesma volta no dublê: relatar o que o Mastra fez, sem
  mudar o cenário para esconder.

## U2 A linha do compositor

**Base e modelo.** `main` com a U1. Sonnet: uma tela, sobre o compositor de hoje.

### As linhas da tabela

- **Caixa de uma linha que cresce**: sai `pt-md max-md:min-h-11 max-md:pt-sm md:min-h-16` de
  `composer.tsx:99`; `textarea.tsx:12` fica.
- **Uma linha de ações em todo tamanho**: `composer.tsx:46-49` (`phone`, `narrow`, `inRow`),
  `:102`, `:128-130`; o modelo da Factory `Composer.tsx:266-300`.
- **Um botão Enviar/Parar**: `composer.tsx:104-125`; AI Elements `PromptInputSubmit`.
- **Linha embaixo da caixa**: `composer.tsx:131-134`; `text.ts` `NO_SECRETS`, `STEER_KEYS`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/composer.tsx` | Muda | `panel.tsx` |
| `apps/web/src/builder/conversation/panel.tsx` | Muda: `memory` vira um nó | — |
| `apps/web/src/builder/conversation/text.ts` | Muda: `NO_SECRETS`; apaga `STEER_KEYS` | `composer.tsx`, `panel.tsx`, `model-choice.tsx` |
| `apps/web/src/ui/use-mobile.ts` | Apaga `useIsNarrow` (só o compositor o usava) | — |
| `apps/web/src/builder/conversation/workbench.tsx` | Muda: o divisor fica `disabled` no celular, onde só está escondido (achado F3a da revisão da U2) | `panel.tsx` |
| `apps/web/src/builder/conversation/composer.test.tsx` | Muda (e a #170) | — |
| `panel.test.tsx`, `stream.test.tsx`, `card-stopped.test.tsx`, `conversation.test.tsx` | Mudam onde esperam Parar ao lado de Enviar | — |
| `docs/guides/design.md` V30 | Muda (abaixo) | — |

### Os contratos que a unidade cria

```ts
// composer.tsx: some `memory?: (compact: boolean) => ReactNode`.
export function Composer(props: {
  answering: boolean
  canSend: boolean
  draft: Draft
  field: Ref<HTMLTextAreaElement>
  onSend: (content: string) => Promise<boolean>
  onStop: () => void
  picker: ReactNode
  taskPanel?: ReactNode
  /** O anel da memória, o primeiro da linha de ações. */
  memory?: ReactNode
})

// O botão é um só, e o que ele faz sai do estado, não de dois botões.
type Action = 'stop' | 'send'
const action: Action = props.answering && empty ? 'stop' : 'send'
```

- `empty` é a caixa sem texto; a U3 soma "e sem arquivo".
- `text.ts`: `NO_SECRETS = 'Não cole senhas ou chaves na conversa.'`, um dono, lido pelo
  compositor no computador, pela conversa vazia e pela folha do modelo no celular (C26).
- A linha de baixo: um `<p>` no computador (o `!phone` que o compositor já usa), em `text-fact`
  (12 px, o de hoje). Sem tamanho novo e sem mudança na V13: sua palavra "D1A", 2026-10-26.
- O texto novo da V30, que esta unidade escreve no guia, na frase da dica: "In the conversation, on
  a keyboard Enter sends and Shift+Enter breaks the line, with no hint under the field; on touch
  Return breaks the line and the button sends. Under the field on a computer sits one small line
  against pasting secrets. Founder, 2026-10-26: 'D. D1'." O resto da V30 fica, inclusive a frase do
  celular. A palavra dele: D1, "uma linha só, menor, com 'Não cole senhas ou chaves na conversa.' A
  dica de teclado sai".

### As skills e a leitura

`shadcn` (linha de `@shadcn/react`), `impeccable` pelas regras de `docs/reference/impeccable.md`;
React e Tailwind pelas linhas de `stack.md`.

### A ordem do trabalho

1. Apagar antes: `composer.tsx:99` (as alturas), `:46-49` (`narrow`, `inRow`), `:128-130` (a
   memória embaixo), o segundo botão (`:104-115`), a dica de teclado (`:131-133`), `STEER_KEYS`,
   `useIsNarrow`. A #170: a linha repetida em `composer.test.tsx:32-33`.
2. Um botão: `type="button"` com `aria-label="Parar"` e `SquareIcon` quando `action === 'stop'`,
   `type="submit"` com `aria-label="Enviar"` e `ArrowUpIcon` senão, como o `PromptInputSubmit`. O
   foco fica no botão quando ele troca. Esc segue parando (V30, V31).
3. A linha de ações: `memory` primeiro (`me-auto`), depois `picker`, depois o botão; a U3 e a U4
   põem **+** e microfone antes do botão.
4. `panel.tsx`: passa `<MemoryStatus … compact={phone} />` como nó; a U5 tira o `compact`.
5. `NO_SECRETS` novo e a linha em `text-fact`; V30 no guia.

### Como se prova

Critérios 4 a 7 em `composer.test.tsx`; os testes que esperavam Parar ao lado de Enviar passam a
esperar um botão por estado. A QA captura 1280 e 390 px, nos dois temas, vazia e com três linhas.

### Parar se

- Um teste existente prova um comportamento que o botão único tira (Parar com texto digitado):
  relatar o teste e o critério antigo; Esc continua parando, e isso cobre o caso.

## U3 Os arquivos

**Base e modelo.** `main` com U1 e U2. Opus: o envio muda de forma em todo o caminho (compositor,
rascunho, envio, `Steer`, leitura da mensagem, bolha), e o rascunho corrige a #167.

### As linhas da tabela

**Rota de mensagem com arquivos**, **`.md` precisa do prefixo `data:`**, **Onde os bytes ficam**,
**Evento ao vivo da mensagem**, **Etiquetas no compositor**, **+, colar, arrastar, tetos**,
**Arquivos no rascunho**, **A bolha da pessoa com as etiquetas**, **Arquivo enviado durante o
trabalho** (a parte da web). As linhas citadas estão na tabela; o hook copia o jeito do AI Elements
`prompt-input` (`accept`, `maxFiles`, colar `:1016`, `convertBlobUrlToDataUrl` `:81-93`) e da
Factory (`useComposerImages.ts:25-81`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/attachment.tsx` | Cria (shadcn base `attachment`, pintado; "Shaped after" se mudar, C70) | `composer.tsx`, `person-turn.tsx` |
| `apps/web/src/builder/conversation/attachments.ts` | Cria: o hook | `composer.tsx` |
| `composer.tsx` | Muda: etiquetas, **+**, colar e soltar, `empty` com arquivos | `panel.tsx` |
| `apps/web/src/builder/conversation/text.ts` | Muda: `REFUSALS` e `megabytesOf` | `composer.tsx` |
| `draft.ts` | Muda: `files`; a #167 | `panel.tsx`, `composer.tsx` |
| `session.ts` | Muda: `send(outgoing)` | `panel.tsx` |
| `panel.tsx` | Muda: `useSending.send(outgoing, running)` | — |
| `session-state.ts` | Muda: `Steer.files` | `transcript.tsx`, `use-session.ts` |
| `messages.ts` | Muda: `userText` devolve as partes | `session-state.ts` |
| `person-turn.tsx`, `transcript.tsx` | Mudam: etiquetas na bolha e na pendente | — |
| testes: `attachments.test.tsx`, `person-turn.test.tsx` (criam), `panel.test.tsx`, `messages.test.tsx` (mudam) | | |

### Os contratos que a unidade cria

```ts
// attachments.ts
/** Um item `files` da rota do Mastra (`@mastra/client-js@1.56.0` `agent-controller.d.ts:196-203`). */
export type MessageFile = { data: DataUrl; mediaType: string; filename: string }
export type DataUrl = string & { readonly __brand: 'DataUrl' } // conferido onde o FileReader devolve: começa com `data:`
export type Outgoing = { content: string; files: readonly MessageFile[] }
/** Os tetos da rota; as constantes do Mastra não são exportadas. */
export const LIMITS = { files: 20, data: 14_680_064, total: 29_360_128 } as const
export const ACCEPT = 'application/pdf,text/markdown,.md,text/plain,.txt,image/png,image/jpeg,image/gif,image/webp'
type Refusal = 'too-many' | 'too-large' | 'too-large-together' | 'type'
export function useAttachments(draft: Draft): {
  files: readonly MessageFile[]
  add: (picked: FileList | readonly File[]) => Promise<void>
  remove: (index: number) => void
  refusal: Refusal | null
}

// draft.ts: o texto no sessionStorage, como hoje; os arquivos num Map do módulo por conversa.
export function useDraft(conversationId: ConversationId): {
  text: string
  files: readonly MessageFile[]
  change: (text: string) => void
  setFiles: (files: readonly MessageFile[]) => void
  /** Tira texto e arquivos quando o envio começa (#167). */
  take: () => Outgoing
  /** Devolve o que foi tirado se a caixa ainda estiver vazia. */
  restore: (outgoing: Outgoing) => void
}
// some `clear(sent)` e o seu ramo de storage.

// session.ts
send: (outgoing: Outgoing) => said(session.sendMessage({ content: outgoing.content, files: [...outgoing.files] }))

// session-state.ts
export type Steer = { id: string; content: string; files: readonly MessageFile[] }

// messages.ts: `userText(part): MastraMessagePart[]`, as partes `text` e `file` do `data-user-message`.
```

- Estados: `Refusal` é a união da recusa, uma frase por variante, dona `text.ts` (C26, C48). O hook
  confere os tetos de `LIMITS` (caracteres da data URL, como a rota), e `text.ts` calcula os MB das
  frases de `LIMITS.data` e `LIMITS.total` (× 3/4, em MiB: 10,5 e 21), então uma frase nunca diz um
  teto que o código não aplica; não há um segundo teto, mais baixo.
- A bolha: uma parte `file` vira etiqueta; uma parte de texto que começa com `[File: nome]` seguida
  de um bloco cercado (o formato do Mastra, `agent-controller-DO6rGsQm.js:5241`) vira etiqueta com
  esse nome. É a única leitura do texto do Mastra, e a gravação `files` a prova (T26).
- O tipo pela extensão vale só para `.md` (`text/markdown`) e `.txt` (`text/plain`) quando o
  navegador dá o tipo vazio.
- Modelo de arquivo: `draft.ts` de hoje (cumpre C26: um dono por conversa; não tem estado em união
  nem id, então C21 e C23 não se aplicam).

### As skills e a leitura

`shadcn` (o `attachment` relido no registro), `mastra` (linha de `@mastra/client-js`), React e
Tailwind.

### A ordem do trabalho

1. Apagar antes: `draft.clear` e o ramo de storage (`draft.ts:23-28`); o achatamento de
   `userText` (`messages.ts:52-57`).
2. `draft.ts`: `take` e `restore`; o compositor tira no começo do envio e devolve na recusa; o teste
   A→B→A (#167) e o de recusa.
3. `attachments.ts` e `ui/attachment.tsx`; **+** com `<input type="file" multiple accept={ACCEPT}>`,
   colar e soltar no form; `readAsDataURL` inteiro; os tetos sobre o tamanho da data URL.
4. `session.ts`, `panel.tsx` (`Steer.files`), `messages.ts` (`userText` com as partes),
   `person-turn.tsx` e `transcript.tsx` com as etiquetas; a miniatura usa a data URL guardada.
5. O botão da U2: `empty` passa a ser sem texto **e** sem arquivo.

### Como se prova

Critérios 8 a 10 em `attachments.test.tsx` (o envio visto pelo MSW, como os testes do painel);
critério 11 em `person-turn.test.tsx` com `recordedEvent('files', …)` e as linhas guardadas
(T26); critério 12 em `apps/web/src/builder/conversation/panel.test.tsx`. A QA lê o console sem erro de CSP.

### Parar se

- A bolha, depois de recarregar, não traz as partes `file` que a gravação guardou: relatar a linha
  do Mastra, sem guardar os arquivos em outro lugar.

## U4 O ditado

**Base e modelo.** `main` com U1 a U3. Sonnet: uma peça copiada e um teste com o reconhecimento
dublado.

### As linhas da tabela

**Microfone: ditado**, **`processLocally`**, **Tipos do Web Speech**: AI Elements `speech-input`
(`:75-178` o reconhecimento, `:260-330` o botão), relido no registro; o OS `use-dictation.ts:36-83`
só como leitura.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/ui/speech-input.tsx` | Cria (AI Elements, pintado; sem `MediaRecorder` nem `onAudioRecorded`) | `composer.tsx` |
| `composer.tsx` | Muda: o microfone antes do botão; a frase em andamento na caixa | — |
| `text.ts` | Muda: as frases do ditado | — |
| `dictation.test.tsx` | Cria | — |

### Os contratos que a unidade cria

```ts
// ui/speech-input.tsx
// O código vem do `lib.dom` (`lib.dom.d.ts:44456`); a peça só lê o que declara abaixo.
type DictationError = SpeechRecognitionErrorCode
export function SpeechInput(props: {
  lang: 'pt-BR'
  /** O texto final de cada resultado, para juntar à caixa. */
  onFinal: (text: string) => void
  /** A frase em andamento, mostrada na caixa até virar final. */
  onInterim: (text: string) => void
  onError: (error: DictationError) => void
}): ReactNode | null // null onde não há SpeechRecognition
declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    addEventListener(type: 'start' | 'end', listener: () => void): void
    addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void
    addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void
  }
  // Como o `lib.dom` declara os seus: um navegador sem reconhecedor não tem o nome.
  var SpeechRecognition: (new () => SpeechRecognition) | undefined
  var webkitSpeechRecognition: (new () => SpeechRecognition) | undefined
}
```

- `continuous = true`, `interimResults = true`, `lang = 'pt-BR'`; `processLocally` não é tocado.
- O segundo toque chama `stop()`: o texto já final fica e `aborted` não mostra frase. Os códigos
  `not-allowed`, `service-not-allowed`, `language-not-supported` e `no-speech` têm cada um a sua
  frase e os outros a do "ditado parou", dona `text.ts` (C26, C48); a lista na matriz de estados.

### As skills e a leitura

`shadcn` (o registro do AI Elements), React; MDN do Web Speech.

### A ordem do trabalho

1. Copiar `speech-input` sem o ramo `MediaRecorder`; a declaração da interface e do construtor.
2. No compositor: o microfone antes do botão; `onInterim` mostra o texto em andamento depois do
   rascunho, `onFinal` o junta ao rascunho; a frase do erro no lugar da frase de envio.
3. `dictation.test.tsx` com um `SpeechRecognition` dublado em `window`.

### Como se prova

Critérios 13 e 14 em `dictation.test.tsx`. A QA dita no Chrome do computador e no celular e, no iPhone com o Hub
na tela de início, registra se o microfone não é desenhado ou mostra a frase do código (critério 14).

### Parar se

- No iPhone da QA, o Safari na tela de início tem `webkitSpeechRecognition` mas falha ao começar:
  é o segundo caso do critério 14; relatar o código; a frase é a do código, e esconder o botão ali
  volta ao cartão.

## U5 O anel único

**Base e modelo.** `main` com U1 a U4. Sonnet: uma peça que fica menor.

### As linhas da tabela

**Anel único da memória**: `memory-status.tsx:16-58, 66-167`; Factory
`OperationalMemoryStatus.tsx:27-92`, `token-budget.tsx:25-90` (`role="meter"`).

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/builder/conversation/memory-status.tsx` | Muda: um anel; apaga o segundo `TokenRing`, o `compact` e as leituras `k` do gatilho | `panel.tsx` |
| `panel.tsx` | Muda: sem `compact` | — |
| `memory-status.test.tsx` | Muda | — |

### Os contratos que a unidade cria

```ts
export function MemoryStatus(props: {
  memory: MemoryGauge | null
  omPhase?: 'idle' | 'buffering' | 'observing' | 'reflecting'
  failed?: 'observation' | 'reflection' | 'buffering' | null
})
```

- O gatilho, um botão, leva dentro dele um `<meter>` nativo, só para leitores de tela (`sr-only`,
  `value` o percentual de `pendingTokens/threshold`), ao lado do anel e do percentual com
  `max-md:hidden`. A Factory põe `role="meter"` num `span` (`OperationalMemoryStatus.tsx:27-49`,
  `token-budget.tsx:45`); o lint do repositório pede o elemento nativo. O nome lido diz Mensagens e
  Memória com os números, como hoje. A janela fica como está.
- O anel gira enquanto observa, guarda ou reorganiza; a marca de falha fica.

### As skills e a leitura

`shadcn`, `impeccable`; React e Tailwind.

### A ordem do trabalho

1. Apagar antes: o segundo `TokenRing`, o `compact`, `msgReading` e `obsReading` no gatilho.
2. O percentual ao lado do anel no computador; o nome lido com os dois números.
3. `panel.tsx` sem `compact`.

### Como se prova

Critérios 15 e 16 em `memory-status.test.tsx`; a QA captura 1280 e 390 px.

### Parar se

Nada que só o teste revele: a peça fica menor sobre os números que já chegam.
