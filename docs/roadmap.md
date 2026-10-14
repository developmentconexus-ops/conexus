# Roteiro do Conexus no repositório novo

Proposta de 2026-10-13, com as suas respostas do mesmo dia. Nada foi construído nem rodado. O desenho está
em `architecture.md`.

## 1. A página do fundador

### As etapas, e o que você faz na nuvem quando cada uma fecha

1. **Hub no ar.** Publica uma mudança no Hub e volta atrás.
   Cartão da etapa 1 aprovado em 2026-10-13 (commit 26b9bdee5dbd01546e59be68292e6354f2b48f91): "Sim"
2. **Banco do Hub.** Restaura o banco, e o vê dormir e acordar.
3. **Entrar.** Entra com e-mail e senha, e sai.
4. **Empresa e convite.** Convida alguém, que aceita e entra.
5. **Duas empresas.** Vê que uma não enxerga a outra, e apaga uma.
6. **Tirar uma pessoa.** Desativa alguém. Outra recupera a senha.
7. **Projeto.** Cria e apaga um Projeto, com o banco da empresa.
8. **App de exemplo.** Abre um app escrito à mão.
9. **Enviar um app.** Manda uma versão nova pelo Hub, e o app grava.
10. **Recusar um app.** Vê o Hub recusar um app com defeito.
11. **Conta de modelo.** Liga a sua assinatura e a testa.
12. **Primeira conversa.** Pergunta ao Builder, e ele responde.
13. **O Builder escreve.** Pede um app e vê os arquivos guardados.
14. **App do Builder.** Abre no Preview o app que ele escreveu.
15. **Mudar o app.** Muda os dados sem perder nada.
16. **Atualizar sem cortar.** Conversa enquanto o Conexus é atualizado.
17. **Publicar.** Publica um app e o abre.
18. **Entrar num app.** Convida alguém só para um app, e tira o acesso.
19. **Ligar o sistema da empresa.** Cadastra a ligação e a testa.
20. **App com dados da empresa.** Abre um app com dados desse sistema.
21. **Outras contas.** Liga a do Google, se o login novo funcionar, e a da OpenAI, se os termos
    confirmarem.
22. **Ensaio geral.** Restaura tudo junto, pelo procedimento.
23. **Primeira empresa.** Uma empresa de verdade usa um app.

### O que você fornece, e quando

| Etapa | O que | Gasto que uma página dá |
| --- | --- | --- |
| 1 | A conta Cloudflare com o domínio do Hub. O servidor de São Paulo | Servidor: não lido |
| 2 | A organização do Neon, no plano grátis | US$ 0 |
| 4 | O remetente dos convites, com o DNS | Workers Paid: US$ 5 por mês |
| 7 | A sua cópia da chave de cifra | Nenhum |
| 8 | O segundo domínio, dos apps | Workers for Platforms: US$ 25 por mês |
| 11, 19, 21 | As assinaturas de modelo. Um usuário só de leitura no sistema de uma empresa | Nenhum |
| 13 | Uma chave do E2B só desta instalação. Um Git privado | E2B pago: US$ 150 por mês, se o uso pedir |
| 22 | Um lugar de cópia fora do Neon | Não lido |
| 23 | O Neon no plano Launch. O aviso do que sai do Brasil | Cerca de US$ 19,35 por mês por banco sempre acordado |

### O que fica fora do lançamento

Login social. Arquivos enviados por pessoas. Trilha de auditoria, medição de uso, segundo idioma.
Domínio próprio de empresa.

### As suas respostas de 2026-10-13

1. **O repositório se chama `conexus`.** "1. A".
2. **Uma parte do código antigo só entra com os consertos médios e grandes feitos.** Os pequenos
   viram dívida listada. "2. A", e com ela: "Tem que ser muito bem estudado como vai ser feito,
   né, o código do zero, o que vai ser reaproveitado, para ele ser também já refatorado como
   código, ele ser no arquivo correto, ele não manter decisões antigas só porque elas já foram
   feitas." Ver a seção 4.
3. **Toda linha lida do banco tem o formato conferido antes de ser usada.** "3. A".
4. **A primeira etapa virou duas.** "4. B". Publicar e voltar atrás, e depois restaurar, o banco
   dormindo e o teste de dados.
5. **A ordem fica.** "5. A".

## 2. As etapas

Os 17 testes de login (LT1 a LT17), as provas PD1 a PD9, as fichas e os
estudos vivem fora do repositório.

| Etapa | O que precisa ser verdade antes | Decisão sua pedida nela | Conhecimento trazido |
| --- | --- | --- | --- |
| 1 Hub no ar | O repositório, a conta Cloudflare e o servidor | Nenhuma | Ficha `http`. O estudo da forma |
| 2 Banco do Hub | A 1. A organização do Neon | Nenhuma | Ficha `platform` |
| 3 Entrar | A 2, com o Tunnel no domínio. O estudo da interface inteira | O administrador da instalação (5) | Rascunho do login e a revisão dele (B1, B4, R1). Dos testes de login, os que só pedem o Hub. A concessão. O registro 0013, reaberto |
| 4 Empresa e convite | O remetente com DNS | Convite com aceite (4) | Fichas `workspace` e admissão. LT11 e LT12. A porta "apagar empresa". O registro 0015, reaberto |
| 5 Duas empresas | A 4 | A política por linha no banco | A lista de nove itens da política |
| 6 Tirar uma pessoa | A 5 | Senha vazada antes de gastar o link | Revisão do login (B3). A regra do último dono |
| 7 Projeto | A organização do Neon com chave | Nenhuma | Ficha `project`. As correções das telas de exclusão. A prova PD7 |
| 8 App de exemplo | O segundo domínio. Workers for Platforms | Nenhuma | A prova PD9. LT2 e LT13. Uma ligação provisória do Worker ao Hub |
| 9 Enviar um app | A 8 | Nenhuma | Fichas `registry` e manifesto. Os tipos na fronteira da linha |
| 10 Recusar um app | A 9 | Nenhuma | Ficha do verificador. A regra "2A". Os limites de laço, prazo e consultas |
| 11 Conta de modelo | A 7, pela chave de cifra | Nenhuma | Ficha `model-account` |
| 12 Primeira conversa | A 11 | `web_fetch` (9) | Fichas do agente e da memória. Os testes 1 a 8 do Builder. O teste do banco dormindo e a restauração dos dois bancos, de novo |
| 13 O Builder escreve | A chave do E2B. O Git de cópia | A rede da máquina (10) | Os onze achados do turno real. Fichas do motor, do sandbox e do Git. Os testes 11 e 12 |
| 14 App do Builder | A 10 e a 13 | Nenhuma | As lacunas de instrução do Builder |
| 15 Mudar o app | A 14 | Nenhuma | As migrações atômicas de app. O lote |
| 16 Atualizar sem cortar | A 14 | Nenhuma | Os consertos de execução da auditoria. Os testes 9 e 10 |
| 17 Publicar | A 15 | Nenhuma | Os pré-requisitos de Release e Publish. O estudo 04 |
| 18 Entrar num app | A 17 | Onde a checagem de sessão vive, pelo teste | Ficha de sessões e passagem. LT1 a LT4 e LT9 |
| 19 Ligar o sistema | A 7 | Usuário só de leitura (8) | Ficha `connectors` |
| 20 App com dados | A 18 e a 19 | Nenhuma | A porta do conector, refeita. Como um Worker alcança o Hub |
| 21 Outras contas | A 12 | Nenhuma | A leitura do proxy do Google e dos termos da OpenAI |
| 22 Ensaio geral | A 20 | O lugar da cópia fora do Neon | Os ensaios das etapas 2, 7, 9, 12 e 13. O teste de carga |
| 23 Primeira empresa | A 22 | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |

O teste do banco dormindo, da etapa 2, roda de novo em toda etapa que acrescenta algo que roda
sozinho. Se o caminho `http` falhar na etapa 2 por causa da versão do PostgreSQL ou do driver, as
etapas 7 a 10 são replanejadas antes de a 3 começar. Se o banco não dormir com o Mastra parado, a
etapa 12 volta a você.

**A interface.** Antes da etapa 3, o Firstmate encomenda o estudo da tela antiga inteira, contra as
referências e os guias. O resultado decide a árvore de `apps/web` e o guia do lado da tela.

## 3. As duas primeiras etapas

O cartão da etapa 1 está em [`steps/e01-hub-no-ar.md`](steps/e01-hub-no-ar.md). O da etapa 2
espera em rascunho ([entrega L5](guides/delivery.md)).

## 4. Como uma etapa roda

Cada etapa passa pelas cinco fases de [entrega L3](guides/delivery.md), cada uma, menos o uso, com a sua
skill ([`AGENTS.md`](../AGENTS.md)). A sua resposta 2 vive na regra do estudo
([`conexus-study`](../.agents/skills/conexus-study/SKILL.md), passo 5). Cada decisão sua é pedida na
etapa dela, com letras e exemplo.
