# Roteiro do Conexus no repositório novo

Proposta e respostas de 2026-10-13. Desenho: `architecture.md`.

## 1. A página do fundador

### As etapas, e o que você faz na nuvem quando cada uma fecha

1. **Hub no ar.** Publica e volta atrás.
   Cartão da etapa 1 aprovado em 2026-10-13 (commit 26b9bdee5dbd01546e59be68292e6354f2b48f91): "Sim"
   Etapa 1 usada em 2026-10-14 em https://hub.conexus.fun: "Deu certo"
2. **Banco do Hub.** Restaura o banco, e o vê dormir e acordar.
   Cartão da etapa 2 aprovado em 2026-10-14 (commit 9d94e1a1402951b4aceae42b58e0349bf347717d): "Aprovo"
   Etapa 2 usada em 2026-10-14 em https://hub.conexus.fun: "Deu certo"
3. **Entrar.** Entra e sai.
   Cartão da etapa 3 aprovado em 2026-10-14 (commit 5a65e5348fd47f541a9c0447a3a11996a28d3b25): "Aprovo"
   Etapa 3 usada em 2026-10-15 em https://hub.conexus.fun: "Todos passos deram certo"
4. **Empresa e convite.** Convida alguém, que aceita e entra.
   Cartão da etapa 4 aprovado em 2026-10-15 (commit 9e9bff0e21742a2e04fbe6afb2f685d8ca5f6940): "1. A, sim poré mtem que configurar senha não? 2. A 3. A 4. A 5. A 6. Okay 7. A 8. Aprovo 9. A"
   Etapa 4 usada em 2026-10-16 em https://hub.conexus.fun: "Deu certo"; sobre o fluxo, "O fluxo não está bem pensando pesnando como um todo"
   4.1 **Convite completo.** Cria a senha no convite, cancela ou recusa um.
      Cartão da etapa 4.1 aprovado em 2026-10-16 (commit 473338311584743520a5f5b1ddb4271252f8fc76): "A aprovo"
      Etapa 4.1 usada em 2026-10-16 em https://hub.conexus.fun (v0.4.1): "Foi sim para lixo eletronico, mas nem ligo, podemos passar e tudo deu certo. cancelei e testei tudo e tudo foi validado"
   4.2 **Cadastro de cliente.** Cadastra um cliente na Central, e o administrador dele entra como dono.
      Cartão da etapa 4.2 aprovado em 2026-10-16 (commit 819b1157ca1edc62fb83a5f31d07faa391e32716): "Aprovo"
      Etapa 4.2 usada em 2026-10-17 em https://hub.conexus.fun (v0.4.2): "Legal tudo funcionou"
5. **Duas empresas.** Vê que uma não enxerga a outra, e a Central apaga uma.
   Cartão da etapa 5 aprovado em 2026-10-17 (commit 3fa479344c8bb02a21a75aaf84744b0b01e65a7e): "2A" (2026-10-16); "eu aprovo tudo que você trouxe"
   Etapa 5 usada em 2026-10-17 em https://hub.conexus.fun (v0.5.0 e v0.5.1), roteiro feito pelo firstmate no Chromium a pedido do fundador ("Cara não quer fazer o teste para mim no chromium"): "Aprovo textos, apaga as sobras e todas empresas e continue"
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
| 7 | Organização Neon das empresas | US$ 0 |
| 8 | O segundo domínio, dos apps | Workers for Platforms: US$ 25 por mês |
| 9 ou 11 | Cópia da chave, da primeira que guardar segredo | Nenhum |
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
   feitas." Ver a seção 3.
3. **Toda linha lida do banco tem o formato conferido antes de ser usada.** "3. A".
4. **A primeira etapa virou duas.** "4. B". Publicar e voltar atrás, e depois restaurar, o banco
   dormindo e o teste de dados.
5. **A ordem fica.** "5. A".

## 2. As etapas

Os testes de login (LT1 a LT17), as provas PD1 a PD9, fichas e estudos
vivem fora do repositório. Uma etapa fechada sai desta tabela; a linha de uso fica na seção 1.

| Etapa | O que precisa ser verdade antes | Decisão sua pedida nela | Conhecimento trazido |
| --- | --- | --- | --- |
| 6 Tirar uma pessoa | A 5 | Respondidas em 2026-10-17 | Revisão do login (B3). A regra do último dono |
| 7 Projeto | A 6 | Dadas | Telas de exclusão. PD7 |
| 8 App de exemplo | O segundo domínio. Workers for Platforms | Nenhuma | A prova PD9. LT2 e LT13. Uma ligação provisória do Worker ao Hub |
| 9 Enviar um app | A 8 | Nenhuma | Fichas `registry` e manifesto. Os tipos na fronteira da linha |
| 10 Recusar um app | A 9 | Nenhuma | Ficha do verificador. A regra "2A". Os limites de laço, prazo e consultas |
| 11 Conta de modelo | A chave de cifra | Nenhuma | Ficha `model-account` |
| 12 Primeira conversa | A 11 | `web_fetch` (9) | Fichas do agente e da memória. Os testes 1 a 8 do Builder. O teste do banco dormindo e a restauração dos dois bancos, de novo |
| 13 O Builder escreve | A chave do E2B. O Git de cópia | A rede da máquina (10) | Os onze achados do turno real. Fichas do motor, do sandbox e do Git. Os testes 11 e 12 |
| 14 App do Builder | A 10 e a 13 | Nenhuma | As lacunas de instrução do Builder |
| 15 Mudar o app | A 14 | Nenhuma | As migrações atômicas de app. O lote |
| 16 Atualizar sem cortar | A 14 | Nenhuma | Os consertos de execução da auditoria. Os testes 9 e 10 |
| 17 Publicar | A 15 | Nenhuma | Os pré-requisitos de Release e Publish. O estudo 04 |
| 18 Entrar num app | A 17 | Onde a checagem de sessão vive, pelo teste | Ficha de sessões e passagem. LT1 a LT4 e LT9 |
| 19 Ligar o sistema | A 11 | Usuário só de leitura (8) | Ficha `connectors` |
| 20 App com dados | A 18 e a 19 | Nenhuma | A porta do conector, refeita. Como um Worker alcança o Hub |
| 21 Outras contas | A 12 | Nenhuma | A leitura do proxy do Google e dos termos da OpenAI |
| 22 Ensaio geral | A 20 | O lugar da cópia fora do Neon | Os ensaios das etapas 2, 7, 9, 12 e 13. O teste de carga |
| 23 Primeira empresa | A 22 | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |

O teste do banco dormindo, da etapa 2, roda de novo em toda etapa que acrescenta algo que roda
sozinho; se falhar com o Mastra parado, a etapa 12 volta a você.

## 3. Como uma etapa roda

Cada etapa passa pelas cinco fases de [AGENTS.md](../AGENTS.md), cada uma, menos o uso, com a skill.
A sua resposta 2 vive na regra do estudo
([`conexus-study`](../.agents/skills/conexus-study/SKILL.md), passo 5). Cada decisão sua é pedida na
etapa dela.
