# The card template

The card's founder's page, in Portuguese, is the only part the founder approves. The rest may be in
Portuguese or English, one language per card.

The card never carries whole files. A unit's section is its build spec.
The closing deletes the card; then the code is the only source.

```markdown
# Etapa <n>: <nome>

## A página do fundador

**No fim desta etapa** você <ação, pelo que uma pessoa vê>.

**O roteiro de uso.**

1. <ação e o que aparece>

**O que você faz, e quando.** Antes: <o que fornece>. No começo: aprova esta página. No fim: faz o
roteiro, diz o que viu e aprova os textos das telas.

**A visão.** <as linhas da `VISION.md` que a etapa serve, pela frase; cruzar uma pede antes a
mudança ao fundador>

**Fica de fora.** <o que não entra, e por quê>

**As decisões suas nesta etapa.** <cada uma com letras, um exemplo, a recomendação, o veredito
(nativo ou remendo) e o como nativo numa linha; ou "nenhuma">

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |

<os grupos de [delivery L9](../../../../docs/guides/delivery.md): duas ou três unidades por pull
request>

**Orçamento de código alterado.** U<k>: <linhas, sem testes nem gerados>. Total da etapa: <linhas>.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U<k> | | <arquivo do teste e o caso> | <must / should> |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |

Uma etapa com tela leva o desenho de caixas, a 1280 e 390 px, as capturas que o protótipo seguiu
e as peças de `ui/` que usa ([screens](screens.md)).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio (depois de uma instrução ou chamada) | Uma dependência fora (banco ou terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |

## A tabela de referência

<a tabela do estudo ([report](../../conexus-study/references/report.md), "The reference table"),
com a unidade e o arquivo novo de cada linha>

**A medida do transplante.** <por parte trazida: o arquivo antigo, o que se refatora na entrada,
as decisões antigas que carrega com a base, e a medida da regra do estudo (`conexus-study`)>

**A dívida.** <consertos pequenos deixados, um por linha, que vão para a seção 11 da arquitetura>

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../../../../docs/guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |

<ou "nenhuma">

## U<k> <nome>

**Base e modelo.** Commit base; o modelo do builder e por quê (Sonnet; Opus para desenho entre
módulos, concorrência ou algoritmo sutil).

### As linhas da tabela

<cada linha da tabela de referência desta unidade: o que ler na base (arquivo, símbolo, linhas) e
as linhas da referência que a unidade segue (`arquivo:linha`)>

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `<pasta da unidade>/` | Cria ou muda | |

### Os contratos que a unidade cria

Assinaturas em TypeScript, com o arquivo onde vivem (hub-api, server, web), e o que se apaga:
rotas (método, caminho, acesso, entrada, saídas e falhas), colunas numa tabela com tipo,
restrição e "ao apagar" (o `on delete` de cada chave estrangeira), tipos exportados por nome e
campos, códigos de falha. Nenhum corpo de função.

E a forma de cada coisa:

- **Cada estado** como união, com o campo que separa as variantes (C21, C22).
- **Cada id** com a sua marca e o lugar onde é conferido (C23).
- **O dono de cada fato compartilhado**: lista, código, frase, constante (C26).
- **O esquema Zod de cada entrada externa** (C27).
- **O arquivo modelo**, se cumpre C21, C23 e C26; se não, não é modelo.

### As skills e a leitura

<as linhas de `docs/reference/stack.md` das pastas da unidade: as skills que o builder carrega e o
que ler primeiro>

### A ordem do trabalho

1. **<o passo>.** Critérios: <números>.
   - **Arquivos:** <cria, muda ou apaga>.
   - **Referência a seguir:** <`arquivo:linha`; pacote@versão: função, opções e padrão>.
   - **O que sai:** <com cada chamador>.
   - **O que entra:** <símbolo e mudança; num passo não óbvio, o começo do código>. Regras: <ids>.
   - **Testes:** <arquivo e caso>.
   - **Mutações à mão:** <linha, mutação, teste que fica vermelho>.
   - **Pronto quando:** <o que se vê ao rodar>.

### Como se prova

<por critério da unidade: a gravação que o teste toca (T26), o comando, a recusa que mostra, e o
que falha hoje>

### Parar se

<o que o builder não decide: cada ponto que só o teste revela, e o que fazer>

## G<g> O ponto de conferência

<depois da última unidade do grupo, antes do pull request: o que os passos 6 e 7 de [`conexus-build`](../../conexus-build/SKILL.md)
rodam neste grupo (servidor, rota, migração, tela, comandos), sem repetir a skill>
```

## What makes a card good

- Someone who did not write the code checks every criterion outside, and each says what is
  refused and what works.
- Every folder the build will touch is in a unit's blast radius, with its importers, and so is the
  owner of each contract the unit creates. A file
  outside them stops the build only as [delivery L7](../../../../docs/guides/delivery.md) says. A
  unit that adds a package lists the shared root files it changes (`package.json`,
  `package-lock.json`, `biome.json`, `ci.yml`). A check the step needs is no unit
  ([delivery L20](../../../../docs/guides/delivery.md)).
- A contract is a signature to compare with the diff, not a design to re-derive.
- A criterion about a provider's behaviour cites the installed provider's code.
- The founder's page holds only his real decisions: a product choice, references diverging on what
  a person sees, a remendo row of his ([delivery L6](../../../../docs/guides/delivery.md)), a
  guide rule the study found resting only on "implemented so". Never a fact a run can show, a
  technical choice where the references converge, the wording of a library's output, or a
  near-hypothetical case.
- Every piece the use script touches has its row in the reference table, and every file the units
  change is explained by a row or a contract. A remendo row without its proof and its
  [boundaries](../../../../docs/reference/boundaries.md) entry goes back to the study.
- Each invariant stated in prose has its criterion and named test.
- Each unit lists what it deletes from `main` before what it adds. A fact used by two units has one
  owner unit and one criterion whose test crosses both.
- The order of the work names guide rules by identifier and never restates them. Each step cites
  the criteria it proves; each criterion has a step.
- Every write or command the step adds, its own or a library's, has its row in the failure table,
  and each cell names its criterion; a step with no write writes "nenhuma".
- The card takes every item of the open issues labelled `next-card`, or says on the founder's page
  why one waits. Whoever files an item for the next card applies the label.

## The reader's questions

The reader answers each with the card's line.

1. For each thing a criterion or contract observes, open the guide that owns it: does the card
   hold against its rules, cited or not?
2. Does each named test reach what it tests through the public door ([testing
   T5](../../../../docs/guides/testing.md))?
3. Does any criterion rest on a fact the study lists as not proved?
4. Does every write the study listed have its row in the failure table?
5. Does the state matrix give every screen its states, and every contract field a writer and a
   reader? A field nobody reads leaves the contract.
6. Does each unit's contracts section give every shape its template asks, and the model file its
   verdict on C21, C23 and C26?
7. Opened at the installed version, does every cell of the reference table, and every reference
   line a unit cites, say what the card claims? Has every row its unit or a reason to stay out, and
   every built row its trace?
8. Has every foreign key its "ao apagar"?
9. Does the unit table plan more pull requests than [delivery L9](../../../../docs/guides/delivery.md) allows?
