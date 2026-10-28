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
    14.2 **Correção de tudo.** Vê o Builder trabalhar como na Factory, agora feito sobre o Mastra; o que o app aprende espera a bancada.
    14.1 **A Prévia.** Abre na Prévia o app que ele escreveu; cada versão do Builder que monta vai ao app sozinha.
    14.3 **Arquivos e voz.** Anexa um PDF, `.md`, `.txt` ou imagem na conversa com o Builder e dita a mensagem pelo microfone do navegador.
    13.1 **O primeiro pedido.** Pede o primeiro app no compositor do Início, com **+** e microfone, e vê o Projeto criado; o passo 4 da primeira entrada. É o Início que você planeja.
15. **Mudar o app.** Muda os dados sem perder nada.
17. **Publicar.** Publica um app e o abre.
18. **Entrar num app.** Convida alguém só para um app, e tira o acesso.
19. **Ligar o sistema da empresa.** Cadastra a ligação e a testa.
20. **App com dados da empresa.** Abre um app com dados desse sistema.
21. **Outras contas.** Liga a da OpenAI, se os termos confirmarem.
    21.1 **Ver o que acontece.** Vê a Atividade da empresa e o painel.
16. **Atualizar sem cortar.** Conversa enquanto o Conexus é atualizado.
22. **Ensaio geral.** Restaura tudo junto, pelo procedimento.
23. **Primeira empresa.** Uma empresa de verdade usa um app.
24. **Conectores de serviços.** Liga contas de serviços aos agentes e apps (resposta B, 2026-10-18).

### O que você fornece, e quando

| Etapa | O que | Gasto que uma página dá |
| --- | --- | --- |
| 1 | A conta Cloudflare com o domínio do Hub. O servidor de São Paulo | Servidor: não lido |
| 2 | A organização do Neon, no plano grátis | US$ 0 |
| 4 | O remetente dos convites, com o DNS | Workers Paid: US$ 5 por mês |
| 7 | Neon das empresas | US$ 0 |
| 8 | O domínio dos apps | Workers for Platforms: US$ 25 por mês |
| 9, 11 | Token dos apps. Cópia das chaves | Nenhum |
| 11, 19, 21 | As assinaturas de modelo. Usuário só de leitura no sistema da empresa | Nenhum |
| 13 | Uma chave do E2B (a da conta grátis). Um bucket privado no R2 | E2B pago: US$ 150 por mês, se o uso pedir |
| 22 | Um lugar de cópia fora do Neon | Não lido |
| 23 | O Neon no plano Launch. O aviso do que sai do Brasil, com uma linha: o ditado no Chrome passa pelo Google | Cerca de US$ 19,35 por mês por banco sempre acordado |

### O que fica fora do lançamento

Login social. Arquivos enviados por pessoas para dentro de um app ou da máquina (na conversa com o Builder eles entram, na 14.3). Medição de uso, segundo idioma. Domínio de empresa.

### As suas respostas de 2026-10-13

1. **Código antigo só entra com os consertos médios e grandes feitos.** "2. A": "ele não manter decisões antigas só porque elas já foram
   feitas." Vive na regra do estudo, no `conexus-study`.
2. **A 16 vai para depois da 21.1, antes da 22, com o número que tem.** Em 2026-10-22: "Cara, então vamos mudar esse roadmap aí, velho. Porque essa 16 pra mim não faz sentido entrar agora ... Deixarei ela mais pro final mesmo." e, à posição antes da 22, "Sim". Nenhuma etapa depende dela; os consertos de execução da auditoria e os testes 9 e 10 vão com ela.
3. **Arquivos e voz entram como a 14.3, depois da 14.1.** "A1 sim B1 okay ... C sim", "B1 por agora".
4. **O Início que você planeja vem depois da Prévia e da 14.3.** A ordem é 14.1, 14.3, 13.1: "Concordo documente tudo isso para ser registrado".

## 2. As etapas

| Etapa | O que precisa antes | Decisão sua nela | Conhecimento trazido |
| --- | --- | --- | --- |
| 13 O Builder escreve | A chave do E2B. O bucket do R2 | A rede da máquina (10) | Onze achados do turno real. Fichas do motor, sandbox, Git. Testes 11, 12 |
| 14 O Builder constrói | A 13 | As capturas dos cartões do OS | O prompt, as skills e a casca do Conexus OS |
| 14.0 Um registro da conversa | A 14 | Nenhuma | Dobrada na 14.2, U2 (fundador: "C"). A 0050 revista: as mensagens do Mastra com partes `data-conexus-*`; saem as listas nos metadados, e o diário `run_event` sai na 14.2, em migração própria depois do último código que o lê (D30) (fundador, 2026-10-22: "1. Sim … 2.B") |
| 14.2 Correção de tudo | A 14 | Nenhuma | Fechada em 2026-10-25 (v0.14.2 a v0.14.7, [aprovações](approvals.md)). O Builder refeito sobre o Mastra 1.79, com só o produto Conexus em código nosso (quarta emenda, fundador, 2026-10-24: "Sim"): rotas do Mastra atrás do guarda, o Fim pelo `isTaskComplete`, uma máquina por conversa sem tabela. Não agora: o cartão aberto atravessar a atualização e a queda. O método saiu dela com uma tabela de referência do estudo à revisão |
| 14.1 A Prévia | A 10, a 14.0 e a 14.2 | A1, B1, X1, um número por versão (A), Apaga tudo | Fechada em 2026-10-26 (v0.14.10, [aprovações](approvals.md)). Um app só até Publicar; todo membro põe a versão dele; o número é o do Builder; o Enviar versão saiu |
| 14.3 Arquivos e voz | A 14.1 | Nenhuma | Fechada em 2026-10-27 (v0.14.11 e v0.14.12, [aprovações](approvals.md)). Arquivos (PDF, `.md`, `.txt`, imagens) só na conversa com o Builder: ficam na mensagem, não vão para dentro do app nem da máquina. Voz: o ditado do navegador; no app instalado do iPhone o microfone não aparece; a transcrição no servidor (Whisper e outras) espera, se for preciso |
| 13.1 O primeiro pedido | A 14.3 e a 14.1 | A Alterações saiu do plano com a B1 da 14.1; a 13.1 confirma no estudo | Fechada em 2026-10-27 (v0.14.13, [aprovações](approvals.md)). O compositor do Início é o da 14.3, com **+** e microfone. O contorno no título do Início (foco programático depois de entrar, #32-4) é consertado aqui |
| 15 Mudar o app | A 14.1 | Nenhuma | Migrações atômicas de app. O lote |
| 17 Publicar | A 15 | Nenhuma | Pré-requisitos de Release e Publish. O estudo 04 |
| 18 Entrar num app | A 17 | Onde a checagem de sessão vive, pelo teste | Ficha de sessões e passagem. LT1 a LT4 e LT9 |
| 19 Ligar o sistema | A 11 | Usuário só de leitura (8, 17 sim) | Ficha `connectors` |
| 20 App com dados | A 18 e a 19 | Nenhuma | A porta do conector, refeita. Como um Worker alcança o Hub |
| 21 Outras contas | A 12 | Nenhuma | A leitura dos termos da OpenAI |
| 21.1 Ver o que acontece | A 20 | Grafana no Brasil, provado | Um só caminho OTel (0052) |
| 16 Atualizar sem cortar | A 14 | Nenhuma | Consertos de execução da auditoria. Testes 9 e 10 |
| 22 Ensaio geral | A 21.1 | O lugar da cópia fora do Neon | Ensaios das etapas 2, 7, 9, 12 e 13. Teste de carga |
| 23 Primeira empresa | A 22 | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |
| 24 Conectores de serviços | A 23 | Quem faz o OAuth | O estudo do Mastra Platform e Connect (referência) |
