# Etapa 14.1

Em 2026-10-25, sobre o estudo refeito da etapa 14.1 (um app só até Publicar; Alterações e "Pedir ao Builder para corrigir" fora): "Ok, pode ser então A1 e B1". Antes da construção, sobre como a Prévia funciona: "eu não quero que seja igual a 14.2". Se "Autorizo provas reais" (2026-10-21) vale para as provas da U1 (Cloudflare, E2B e iPhone): "Sim". Quem põe no app a versão do Builder, emenda à P3 A da etapa 9 só para o envio do Builder (todo membro que conversa; a aba Versões segue de dono e administrador): "X1".

Em 2026-10-25, sobre o **Abrir app** da Prévia, que abre o app numa aba nova e deixa o Hub onde está: "Ah, isso pode mudar sim. Abrir app, abrir uma aba nova. Não tirar onde a gente tá no hub, tá? Porque isso é até chato."

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit 692b6ecab87730ba73ede1ff5458c716a8422d59): "Aprovo"

Em 2026-10-25, sobre o tempo do fim do turno a "Prévia pronta" medido na U1 (12,5, 16,3 e 20,5 s em três turnos reais; o envio à Cloudflare de ~1 MB leva ~10 s, dos quais ~0,3 s são os bytes e ~9,7 s o processamento da Cloudflare em cinco chamadas; piso de 5,1 s numa versão mínima), acima dos ~13 s do cartão; aceitar o tempo como está, o critério 13 mantido: "A"

Em 2026-10-25, sobre levar o tempo medido também à página do fundador no cartão da 14.1 (passo 1 do roteiro, "uns 10 a 20 segundos"; "Nada mais é seu", "os 12,5 a 20,5 s medidos"), em lugar dos ~9 s da referência: "A"

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit ad8480d20bf09ea7e4bb7f1039865c5c725496a1): "A"

Em 2026-10-25, sobre as três chamadas da revisão da U3 da 14.1: o aviso do WebKit da Apple ganha o × (**Fechar aviso**, lembrado na sessão da aba), a Prévia mostra a frase da falha no lugar do iframe quando o Hub recusa a passagem, e o **Abrir app** do topo some antes do primeiro app: "1. A 2. A 3. A". Sobre como construir os três estados: "Okay cria estados novos, mas nada remendo correto, bem planejado conforme metodologia e guias sem fazer ma implementação"

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit a0fa52b4778f328b31cd5f47b5a1dc4831ab3759): "1. A 2. A 3. A"

Em 2026-10-25, sobre o achado 1 da QA da 14.1 (a conversa diz "Versão 5 guardada… Prévia pronta" e a aba Versões diz "Versão 4 · no ar") e o estudo dos números: um número por versão, o do Builder, em toda parte (opção A); o **Enviar versão** e a rota dele saem; e, na decisão 2, as versões enviadas à mão vão embora, com seus Workers: "A sim mas deveria ser um release ou tag não? Dcisão 2 Apaga tudo"

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit 9adf9d20e2bd692db46048f1940cd691b66f772b): "A sim mas deveria ser um release ou tag não? Dcisão 2 Apaga tudo"

Em 2026-10-25, sobre o achado 2 da revisão da U5 da 14.1: apagar agora o caminho do envio repetido, que ninguém chama depois da U5 (o mesmo turno de novo passa a ser recusado por `unique (project_id, attempt_key)`, sem `REPLAY`): "A"

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit 297a3a14a383e40c25914890043549b1e45d5100): "A"

Em 2026-10-25, sobre as três chamadas da revisão da etapa 14.1 inteira: 1, o estado "subindo" da Prévia fica na mensagem da versão, guardada desde que a versão é salva e trocada no fim por "pronta" ou pela falha, a fase `sending` da máquina e a regra especial de `fold.ts` saem, e quem recarrega no meio do envio vê "Versão N guardada" e "Subindo o app…" (opção a); 2, se "Apaga tudo" cobre apagar os Projetos de teste das etapas 9 e 10 depois do deploy; 3, a mudança do método para as unidades que entram no main: "1. A 2. Sim pode apagar tudo 3. A"

Cartão da etapa 14.1 aprovado em 2026-10-25 (commit f7496ff1a8d4ca1571f4bd2e49c00ec0c81e7a59): "1. A 2. Sim pode apagar tudo 3. A"

Em 2026-10-26, sobre as frases de falha da Prévia propostas no fechamento da 14.1
(`APP_VERSION_NOT_STARTING`, `APP_MIGRATION_FAILED`, `APP_MIGRATION_CHANGED`, `APP_VERSION_FAILED`
sem botão e `APP_VERSION_SENDING`) e o rótulo "App" da aba a 390 px: aprovados com as palavras de
seu uso, abaixo.

Etapa 14.1 usada em 2026-10-26 em https://hub.conexus.fun (v0.14.10): "Foi passou, aprovado"
