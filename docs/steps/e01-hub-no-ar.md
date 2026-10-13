# Etapa 1: Hub no ar

Proposto em 2026-10-13. Nenhum teste rodou.

## A página do fundador

**No fim desta etapa** você publica uma mudança no Hub da nuvem e volta atrás, sem terminal e sem
ajuda.

**O roteiro de uso.**

1. Abra o endereço do Hub. A página mostra a marca, a versão e uma frase.
2. O Firstmate aperta "Merge" no pull request de ensaio. Em minutos a frase nova aparece, e você
   confere.
3. No GitHub Actions, aperte o botão de voltar atrás. A frase antiga volta.

**O que você faz, e quando.** Antes: cria a conta Cloudflare com o domínio do Hub e entrega o
acesso ao servidor e o token do Cloudflare. No começo: aprova esta página. No fim: faz o roteiro,
com a sua conta do GitHub, e diz o que viu.

**Fica de fora.** O banco, que nasce na etapa 2. Login, empresas e toda tela do produto. A página
é nova e pequena, pública e sem segredo, e não espera o estudo da interface.

## As unidades

| Unidade | O que entrega | Pastas |
| --- | --- | --- |
| U1 Esqueleto | A árvore da arquitetura, os cinco `package.json` e um portão só no CI, com o verificador de imports | raiz, `.github/`, `scripts/` |
| U2 Programa | Configuração, erro, a rota de saúde, o registro por requisição, a rota e a página de estado | `apps/server/`, `apps/web/`, `packages/hub-api/` |
| U3 Publicar | A imagem, o Compose, o Tunnel com nome, publicar por push, o botão de voltar atrás e o aviso de queda | `infra/`, `.github/` |

U1 vem sozinha. Depois dela, U2 e U3 correm em paralelo, porque não dividem pasta.

A U1 traz também as conferências que o método marca "primeiro commit", uma linha cada:

- `check-docs`: links, tetos, linha no mapa, um cartão só em `steps/`, identificadores de regra,
  nomes aposentados e o cabeçalho das skills lido por um leitor de YAML.
- A contagem das supressões do lint num arquivo que o CI compara.
- A largura de linha e o tamanho de função e de arquivo na configuração do Biome.
- O lint que recusa um teste que importa o interior do servidor.
- A lei de importações, com a recusa de importar o objeto de tabela de outro dono.
- A linha de aprovação do cartão no roteiro: o commit citado é ancestral da ponta, e o cartão não
  mudou desde ele.
- A recusa de mudança em `.agents/skills/` ou `docs/guides/` com uma etapa em construção.
- A fusão em `main` como dizem [entrega L13 e L14](../guides/delivery.md).

## Os critérios de aceite

1. **Publicar por uma pessoa.** Uma mudança em `main` fica no ar no endereço do Hub sem comando no
   servidor. O servidor não abre porta.
2. **Voltar atrás.** A imagem anterior volta pelo botão. Depois, o Firstmate desfaz o ensaio em
   `main`. Voltar atrás sobre um banco já migrado é da etapa 2, a primeira com banco.
3. **O aviso de queda.** Com o servidor desligado, o e-mail chega em minutos. Um programa que morre
   sobe sozinho.
4. **As recusas.** O CI recusa um import que fura uma parede e um teste que trava. O programa não
   sobe se faltar uma configuração, e diz qual.
5. **A forma.** O código real roda em `.ts` direto. O Vite importa um pacote que aponta para `.ts`.

**As quatro conferências do método**, da seção 9 do relatório dele, ficam nesta etapa: é a
primeira que tem unidade, revisão e uso. Pela emenda de 2026-10-12, "fatia até `main`" vira
"unidade até o ramo da etapa".

1. Uma unidade vai do cartão aprovado ao ramo da etapa sem que o construtor leia nada além do
   cartão, do guia de código e de um guia a mais.
2. Nenhuma skill e nenhum guia precisa do rótulo de emergência para a etapa fechar.
3. As duas leituras da revisão carregam a skill de revisão, e a primeira linha de cada parecer
   mostra isso.
4. Você faz o roteiro de uso sem ajuda.

Se uma falhar, o método muda antes da etapa 2. A etapa mede o tamanho das unidades e da revisão.

## O que vem do código antigo, e o que nasce novo

Os números são da auditoria do Hub, cuja ficha é a entrada do estudo, e não a resposta. Pela sua
resposta 2, uma parte só entra com os consertos médios e grandes feitos.

| Parte | Vem | Com quais consertos |
| --- | --- | --- |
| `http` (548 linhas, 35 casos de teste) | Trazida, se o estudo confirmar | Erros do Fastify por status. Três prazos. O conserto das rotas de login espera a etapa 3 |
| A classe de erro, do resto de `platform` | Trazida, se o estudo confirmar | Deixa de herdar a do Mastra |
| Configuração | Nova | A antiga é reescrita, com conferência de formato |
| A página | Nova, com a marca trazida | Nenhum |
| CI, imagem, Compose, Tunnel, botão | Novos | Actions, Compose e Tunnel são "decidido antes", aceitos na arquitetura por serem baratos de trocar |

**A medida do transplante** começa aqui, com `http` e a classe de erro, e vale em toda etapa que traz código.
Mede-se: as linhas trazidas, as
mudadas até os critérios passarem, os testes antigos que passam pela porta pública sem mudar de
sentido, e as horas de sessão.

**A saída.** Uma parte em que as mudadas passam de um terço das trazidas é escrita nova. O terço é
o limite da revisão das bases para a tela e os testes. Se
`http` e o caminho do banco, da etapa 2, passarem os dois, o transplante volta a você antes da
etapa 3.

## As perguntas do passo de estudar

1. Para `http` e a classe de erro: nova ou trazida? Se trazida, em qual arquivo da árvore nova
   cai, o que é refatorado na entrada, e quais decisões do código antigo carrega, cada uma com a base?
   Seria escrita assim do zero?
2. Onde vivem os segredos do servidor? A arquitetura decide um arquivo de ambiente e os segredos
   do GitHub Actions. O estudo confirma ou troca. A arquitetura pede a chave de cifra e a
   sua cópia na etapa 1. O lugar é decidido aqui, e a chave nasce na etapa 7.
3. O Tunnel com nome e o aviso de saúde existem no plano grátis do Cloudflare? Quanto custa o
   GitHub Actions num repositório privado?
4. O Compose chega a rodar duas cópias ao trocar a imagem?
