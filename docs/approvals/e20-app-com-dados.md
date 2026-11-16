# Etapa 20

Cartão da etapa 20 aprovado em 2026-10-30 (commit fa6f160301872fc196efdaae078b1911641d1f00): "1 aprovo / 2 A1"

Ele aprovou a página do cartão e escolheu a `A1`: a aba "Projeto" do alto sai, **Sobre** reúne Sobre e Versões, e o Construir fica com Prévia, Código e Alterações. As decisões `S1`, `R2` e `T-A` com o ajuste vieram antes, ao estudo, no mesmo dia. O commit citado só escreve a `A1` na página. A aprovação é também a palavra da regra de dados D11 para as permissões do banco da U2: a tabela `connectors.project_connection` e o campo `connection.notes`.

Essa emenda muda o cartão da etapa 20 em três pontos, vindos das revisões. Os critérios 9 e 10 citam `project-connection.test.ts`, o esboço da U2 usa `projectId` como `text` e o `catalog.test.ts` deixa de ser arquivo mudado. A linha do corte da leitura cita `builder-tool.ts:89-91` e `sankhya/gateway.ts:34`. A retomada do critério 28 é provada só pelas ferramentas (o Mastra 1.79 não refaz skills nem instruções ao retomar), a metade do rastro do critério 29 vai para a 21.1, e `CONNECTOR_TOOLS` e o caminho passam a `builder/connectors/`.

Cartão da etapa 20 aprovado em 2026-10-30 (commit e84a611647a4816724b76a0f9fc60a69a832594e): "Aprovado"

Etapa 20 usada em https://hub.conexus.fun. À pergunta do firstmate em 2026-10-31, com a v0.20.10 no ar, "liberar uma conexão num Projeto e abrir um app com os dados dela": "Ja fiz deu certo". A resposta cobre o passo 2 do roteiro (liberar uma ligação em Integrações do Projeto) e, no passo 4, o app com os dados de verdade. Ele não relatou os passos 1, 3, 5 e 6, o Caderno do passo 4, o uso no celular nem a aprovação dos textos das telas.

Decisões do fundador na revisão da etapa 20 e nos consertos do fechamento, registradas no fechamento. Cada linha traz as palavras dele; a data é a do dia em que o firstmate as recebeu.

Correção da PR 515 (https://github.com/developmentconexus-ops/conexus/pull/515), em 2026-10-31. Ao achado de que uma ligação liberada que deixou de funcionar continuava dizendo "lê": "A". À forma das duas capturas (liberada que parou de funcionar, e ligação nova não liberada): "2.B".

Consertos do lote de fechamento (https://github.com/developmentconexus-ops/conexus/pull/520), em 2026-10-31. Ao fim do turno que apagava o que o Hub não guardou, e à falha do compilador de tipos: "2A 3OKAY" (as chamadas 2 e 3 da revisão da etapa). Ao texto da recusa de gravar uma versão (`SAVE_REFUSED`, "O trabalho continua na conversa. Peça de novo ao Builder."): "1 sim".

Regra do `MACHINE_LOST`, em 2026-11-01: só uma máquina que o provedor diz perdida (`session.lost`) é `MACHINE_LOST`; qualquer outra coleta que falha é `SAVE_REFUSED`.
