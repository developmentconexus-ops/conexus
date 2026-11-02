# Roteiro do Conexus no repositório novo

## 1. A página do fundador

### As etapas, e o que você faz quando cada uma fecha

Aprovações e usos: [aprovações](approvals.md).

1. **Hub no ar.** Publica e volta atrás.
2. **Banco do Hub.** Restaura o banco, e o vê dormir e acordar.
3. **Entrar.** Entra e sai.
4. **Empresa e convite.** Convida alguém, que aceita e entra.
   4.1 **Convite completo.** Cria a senha no convite, cancela ou recusa um.
   4.2 **Cadastro de cliente.** Cadastra um cliente na Central, e o administrador dele entra como dono.
5. **Duas empresas.** Vê que uma não enxerga a outra, e a Central apaga uma.
6. **Tirar uma pessoa.** Desativa alguém. Outra recupera a senha.
7. **Projeto.** Cria e apaga um Projeto, com o banco da empresa.
8. **App de exemplo.** Abre um app escrito à mão.
9. **Enviar um app.** Manda uma versão nova pelo Hub, e o app grava.
   9.1 **Direto ao app.** Entra e vê o app, sem o Hub no meio; o Neon mostra o apelido.
10. **Recusar um app.** Vê o Hub recusar um app com defeito.
11. **Conta de modelo.** Liga chaves de API, assinatura Claude e Google, em filas por fornecedor.
12. **Primeira conversa.** Pergunta ao Builder, e ele responde.
    12.1 **A conversa no painel.** Conversa no painel e vê o Builder pensar.
    12.2 **A casa.** Barra lateral, Início e primeira entrada.
    12.3 **Padrões.** Escolhe com que modelo as conversas começam.
13. **O Builder escreve.** Pede um app e vê os arquivos guardados.
14. **O Builder constrói.** Pede um app, responde às perguntas, aprova o plano e vê a versão que monta.
    14.0 **Um registro da conversa.** Conversa como antes; depois de um reinício do Hub, vê o aviso direto.
    14.2 **Correção de tudo.** Vê o Builder trabalhar como na Factory, agora sobre o Mastra.
    14.1 **A Prévia.** Abre na Prévia o app que ele escreveu.
    14.3 **Arquivos e voz.** Anexa arquivos na conversa com o Builder e dita a mensagem.
    13.1 **O primeiro pedido.** Pede o primeiro app no Início e vê o Projeto criado.
    13.2 **Configurações.** Vê as páginas na largura, as contas numa página, botões menores.
15. **Mudar o app.** Muda os dados sem perder nada.
17. **Publicar.** Publica um app e o abre.
18. **Entrar num app.** Convida alguém só para um app, e tira o acesso.
19. **Conectores: o kit e a primeira ligação.** Liga o Sankhya em Integrações, na barra lateral, e testa.
    19.1 **Ligar por OAuth.** Liga o Mercado Livre e o vê pedir para conectar de novo.
20. **App com dados de um conector.** Libera uma ligação num Projeto e abre um app com os dados dela.

Sua empresa usa o Conexus desde 2026-11-02, recebendo cada etapa.

- **24.1 O Assistente.** Conversas no Início e no Projeto perguntam aos sistemas e mostram tabelas e gráficos.
- **24.2 Automações: o Assistente na agenda.** Pede "todo dia às 7h, o resumo" e recebe cada execução numa conversa nova, com aviso.
- **24.3 Agentes do Projeto, com o Construtor.** Conversando com o Construtor, cria num Projeto um agente que lê.
- **24.4 Os agentes escrevem, com aprovação.** Um agente ou app pede "Aprovar?" antes de escrever (resposta B, 2026-10-18; leva a 20.1).
- **24.5 Workflows.** Monta conversando o fluxo do orçamento do Sankhya e o vê como trem de balões.
- **21.1 Ver o que acontece.** Vê a Atividade, o painel e o uso por empresa.
- **16 Atualizar sem cortar.** Conversa enquanto o Conexus é atualizado.
- **22 Ensaio geral.** Restaura tudo junto, pelo procedimento.
- **23 As outras empresas.** Empresas além da sua usam o Conexus.
- **20.2 App que se atualiza.** Vê o app mudar com um aviso do fornecedor, depois dos webhooks.

### A fila do molde, ao lado

O que tem molde anda numa segunda fila, de método leve (2026-10-30: "1. Sim 2. Sim 3. Sim"):

1. **Fábrica de conectores.** O esqueleto sai da documentação do fornecedor.
2. **Os sistemas das quatro empresas.**
3. **Bling**, **Omie** (login por chave fixa) e **Conta Azul**.
4. Shopee, Nuvemshop, Google Sheets, NF-e recebida, extratos de banco; a Jet (20.3) quando alguém a usar.
5. **21 Outras contas.** Liga a da OpenAI, se os termos confirmarem.

Em espera: 19.2 Central de Ajuda. Sai: o pg-boss; a agenda do Mastra, gatilho de toda automação, e os workflows o substituem.

### O que você fornece, e quando

| Etapa | O que | Gasto que uma página dá |
| --- | --- | --- |
| 1 | A conta Cloudflare com o domínio do Hub. O servidor de São Paulo | Servidor: não lido |
| 2 | A organização do Neon, no plano grátis | US$ 0 |
| 4 | O remetente dos convites, com o DNS | Workers Paid: US$ 5 por mês |
| 7 | Neon das empresas | US$ 0 |
| 8 | O domínio dos apps | Workers for Platforms: US$ 25 por mês |
| 9, 11 | Token dos apps. Cópia das chaves | Nenhum |
| 11, 21 | As assinaturas de modelo | Nenhum |
| 13 | Uma chave do E2B (a da conta grátis). Um bucket privado no R2 | E2B pago: US$ 150 por mês, se o uso pedir |
| 19 | Usuário só de leitura no Sankhya de uma empresa | Nenhum |
| 19.1 | O seu app de desenvolvedor do Mercado Livre | Não lido |
| 24.2 | O Neon Launch no projeto do Hub, com a primeira automação: a agenda o mantém acordado | Cerca de US$ 19,35 por mês, uma conta só |
| 22 | Um lugar de cópia fora do Neon | Não lido |
| 23 | O aviso do que sai do Brasil, com uma linha: o ditado no Chrome passa pelo Google | Nenhum novo |

### O que fica fora do lançamento

Login social. Arquivos enviados por pessoas para dentro de um app ou da máquina (na conversa com o Builder eles entram, na 14.3). Medição de uso, segundo idioma. Domínio de empresa.

### As suas respostas de 2026-10-13

1. **Código antigo só entra com os consertos médios e grandes feitos.** "2. A". Vive no `conexus-study`.
2. **A 16 vai para depois da 21.1, antes da 22, com o número que tem.** Em 2026-10-22: "essa 16 pra mim não faz sentido entrar agora ... Deixarei ela mais pro final mesmo." e, à posição antes da 22, "Sim". Nenhuma etapa depende dela.
3. **Arquivos e voz entram como a 14.3, depois da 14.1.** "A1 sim B1 okay ... C sim", "B1 por agora".
4. **O Início que você planeja vem depois da Prévia e da 14.3.** A ordem é 14.1, 14.3, 13.1: "Concordo documente tudo isso para ser registrado".
5. **O roadmap perde o detalhe das etapas fechadas.** Em 2026-10-29: "Roadmap pode ir removendo o que foi de etapas passadas ... se não vamos ter que aumentar ele". A linha de uma etapa fechada sai da tabela; o que ficou é nas [aprovações](approvals.md). O teto de 1.600 palavras não sobe.

6. **Depois da 20, Supervisor, agentes e workflows, antes das outras empresas.** Em 2026-10-30, ao estudo da estrutura dos agentes: "eu vou começar na minha empresa ... depois disso ... eu vou jogar para as outras empresas".
7. **Uma Automação, e a ordem da 24.2 à 24.5.** Em 2026-11-01: "1 confirmado 2. Okay 3.okay".

## 2. As etapas

| Etapa | O que precisa antes | Decisão sua nela | Conhecimento trazido |
| --- | --- | --- | --- |
| 24.2 Automações | A U2 a U4 da 24.1 | Nenhuma | Automação: gatilho, o que roda, o lugar, por `mastra.schedules`. A 20.4 entra aqui |
| 24.3 Agentes do Projeto | A 24.2 | Onde roda o código do Construtor | Projeto como assunto. Agentes como linhas nossas, nunca o Agent Builder pago. O Open Bots |
| 24.4 Escrita com aprovação | A 24.3 | Nenhuma | `requireApproval` do Mastra, provada antes a trava da 0053. Escrita nova pede nova liberação |
| 24.5 Workflows | A 24.4 | O gatilho do Sankhya | Workflows do Mastra como dados; um protótipo de um dia decide o motor. Seu orçamento é o aceite |
| 21.1 Ver o que acontece | A 24.5 | Grafana no Brasil, provado | Um só caminho OTel (0052). O uso por empresa. O rastro por ferramenta: as ferramentas de conector (`connector_read`, `connector_notes`, `connector_note_save`) escondem entrada e saída no span, com o exportador de lista permitida, porque o `TracingPolicy` do Mastra só tem `internal` (veio da 20, critério 29) |
| 16 Atualizar sem cortar | A 21.1 | Nenhuma | Consertos de execução da auditoria. Testes 9 e 10 |
| 22 Ensaio geral | A 16 | O lugar da cópia fora do Neon | Ensaios das etapas 2, 7, 9, 12 e 13. Carga de um painel e de uma rotina |
| 23 As outras empresas | A 22 | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |
| 20.2 App que se atualiza | A 23 e os webhooks | Nenhuma | Avisos do fornecedor (S48), num workflow do Mastra |
| 21 Outras contas | Fila do molde | Nenhuma | A leitura dos termos da OpenAI |
