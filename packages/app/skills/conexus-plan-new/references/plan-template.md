# Plan for a new app

Adapt the sections to the app; this shape is the default:

```markdown
# <Nome do app>

## Para a pessoa
- Para que serve: quem usa, em que momento, e o que vê primeiro.
- As telas: cada tela em uma ou duas linhas, começando pela primeira.
- O que você pediu: cada item com a origem, ou "não encontrado".
- Sugestões: o que um bom app deste tipo tem e você não pediu, cada uma com o porquê. Aprovar o plano inclui as sugestões; peça ajustes para tirar alguma.
- O que eu supus: cada suposição, para confirmar.
- O que fica de fora nesta versão.

## Para construir
### Forma
### Telas
### Tabelas do app
### Operações
### Regras e acesso
### Verificações
### Ordem
```

In "Para construir":
- Forma: page, panel or system (`conexus-app`), and whether the app has a server; any library beyond the starter's, with why.
- Telas: start with the screen the person opens first and what it answers. For each screen: its pattern from `conexus-app`, what it shows and where each value comes from, how the person finds their work (filters, counts, statuses), its actions, and what it says when empty or when a read fails.
- Tabelas do app: what people save, with fields, links between tables, and change history when it matters.
- Operações: each operation of `shared/operations.ts` with its input, output, who may call it (its roles, or everyone with access), and the source of each value it returns.
- Regras e acesso: each business rule and where it applies; who sees what; the roles, if the app has any, each with the label the person reads.
- Verificações: for each thing the person asked, how you will show it works: the check, and the code you read against the plan.
- Ordem: first one thin path end to end (one screen, one operation and its table, passing the check), then one slice at a time, each ending in a passing check.
