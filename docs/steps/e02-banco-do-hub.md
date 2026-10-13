# Etapa 2: Banco do Hub

Proposta de 2026-10-13: o passo de escopar desta etapa pode mudar este cartão. Nenhum teste rodou.

## A página do fundador

**No fim desta etapa** você restaura o banco do Hub a uma hora que escolheu, e o vê dormir e
acordar, sem terminal.

**O roteiro de uso.**

1. Abra o endereço do Hub. A página mostra agora a lista das publicações, com a hora de cada uma.
2. Aperte "Merge" no pull request de ensaio, que traz uma migração que só acrescenta. A
   publicação nova entra na lista.
3. Aperte o botão de voltar atrás. A versão antiga volta, e a lista continua lá.
4. Aperte o botão de restaurar e escreva uma hora anterior à ação 2. A publicação da ação 2 some
   da lista.
5. Abra o endereço do teste de dados. Ele mostra uma linha do banco de uma empresa de teste.
6. Fique dez minutos sem abrir o Hub. No painel do Neon o banco aparece parado. Abra o Hub de
   novo: ele demora um pouco mais e responde.

**O que você faz, e quando.** Antes: cria a organização do Neon, no plano grátis, e entrega a
chave dela. No começo: aprova esta página. No fim: faz o roteiro e diz o que viu.

**Fica de fora.** Login e empresas. A lista é nova e pequena, e não espera o estudo da interface.

## As unidades

| Unidade | O que entrega | Pastas |
| --- | --- | --- |
| U1 Banco | O caminho do banco sobre o Drizzle, a conferência de formato de cada linha lida, a primeira migração, aplicada por subcomando, a recusa de migração no CI e o banco de teste sem superusuário | `apps/server/src/platform/`, `migrations/`, `.github/`, `scripts/` |
| U2 Lista | A rota e a página com as publicações | `apps/server/src/hub/`, `apps/web/`, `packages/hub-api/` |
| U3 Restaurar | O botão que restaura o banco do Hub a uma hora, e os dois `how-to`, em português | `docs/how-to/`, `scripts/` |
| U4 Teste de dados | O projeto de uma empresa de teste, criado por comando, e um Worker escrito à mão que lê uma linha dele | `apps/edge/` |

U1 e U4 correm em paralelo. U2 e U3 esperam a U1, e correm juntas.

O caminho do banco fica nesta etapa, e não na 1, porque publicar uma página não pede banco. A
migração que só acrescenta fica aqui pelo mesmo motivo.

## Os critérios de aceite

1. **Voltar atrás sobre o banco migrado.** A imagem anterior roda sobre o banco já migrado pelo
   ensaio. O CI recusa uma migração que apaga ou renomeia, e uma migração alterada. Depois, o
   Firstmate desfaz o ensaio em `main`.
2. **Restaurar dentro das 6 horas.** Quem não escreveu o procedimento restaura o banco do Hub a
   um momento das últimas 6 horas. A publicação gravada depois some, e o Hub responde. Um momento
   mais antigo é recusado, com o limite do plano grátis dito.
3. **O banco dormindo** ([0009](../decisions/0009-neon-free-plan-database-asleep.md)). O Hub no ar e nenhum pedido por dez minutos: o Neon
   mostra o banco parado. A rota de saúde e o aviso de queda não tocam o banco. O pedido seguinte
   responde, com o tempo de acordar medido. Se uma causa não puder sair, a etapa volta a você com
   as duas saídas do registro 0009.
4. **O caminho `http`.** O Worker lê uma linha de um projeto de empresa de teste em PostgreSQL 17,
   a versão da prova PD7, pelo driver do Neon sobre HTTP. Se falhar pela versão ou pelo driver, as
   etapas 7 a 10 são replanejadas antes de a 3 começar. O Worker sai do ar quando a etapa fecha.
   Este teste não serve ao uso: está aqui pelo seu "Sim" de 2026-10-12, lido pela posição.
5. **A linha conferida**, pela sua resposta 3. Uma linha fora do formato é recusada na leitura.
6. **A forma.** O Wrangler importa um pacote que aponta para `.ts`.

## O que vem do código antigo, e o que nasce novo

A ficha da auditoria do Hub é a entrada do estudo, e não a resposta.

| Parte | Vem | Com quais consertos |
| --- | --- | --- |
| O caminho do banco de `platform` (714 linhas) | Trazido, se o estudo confirmar | O Drizzle no núcleo, que é um conserto grande. Prazos no pool. Saem a trava de sessão e 148 linhas que o alvo retira |
| A lista, o botão, os procedimentos, o Worker de teste | Novos | Nenhum |

A medida do transplante e a saída são as do cartão da etapa 1, aplicadas ao caminho do banco.

## O que não está na etapa, e por quê

- **A concessão que troca a trava "um Hub por banco".** A arquitetura a põe na N1. Aqui nenhum
  trabalho roda sozinho, e ela não protegeria nada. Nasce na etapa 3, com o primeiro trabalho
  agendado. A pergunta 4 fica aqui, porque a resposta molda o caminho do banco.
- **O banco do Mastra.** Criado com o login dele na etapa 12, quando o Mastra sobe. O teste do
  banco dormindo e a restauração dos dois bancos rodam de novo ali.
- **A empresa em toda transação.** Entra na etapa 4, com a primeira tabela de empresa.

## As perguntas do passo de estudar

1. Para o caminho do banco: novo ou trazido? Se trazido, em qual arquivo da árvore nova cai, o que
   é refatorado na entrada, e quais decisões do código antigo carrega, cada uma com a base? Seria escrito
   assim do zero?
2. Uma organização do Neon no plano grátis emite uma chave de organização? Se não, qual chave
   cria os projetos, e o que ela alcança?
3. O que mantém um banco do Neon acordado com ninguém usando: uma sessão aberta, um pool, o driver
   HTTP, o Mastra parado, o painel aberto? Os dois bancos do projeto dividem a mesma computação?
4. Uma concessão renovada por atividade segura duas cópias rodando durante uma atualização?
5. Qual versão do Drizzle fica fixada antes da primeira migração: a linha estável ou a 1.0, que
   muda o formato das migrações? Ele gera uma história só para dois schemas?
6. Como os testes criam o banco sem superusuário, no Postgres local e num ramo do Neon?
7. Depois de restaurar um ramo com a chave da pergunta 2, o que o programa precisa fazer?
