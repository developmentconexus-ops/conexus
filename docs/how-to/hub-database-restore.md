# Restaurar o banco do Hub

Como voltar o banco do Hub a um minuto anterior, no Neon, e conferir que o Hub voltou certo. Vale para qualquer restauração, por erro ou por teste. O ramo guarda dois bancos, o do Hub e o das conversas do Builder: os dois voltam juntos ao mesmo minuto.

## Antes

Escolha o minuto. O Neon guarda só seis horas de histórico no plano grátis. Anote a hora de Brasília: o Neon mostra em UTC, três horas à frente.

## Restaurar

1. No Neon, abra o projeto do Hub, depois Backup & Restore.
2. Escolha o ramo principal e o minuto, e confirme a restauração.
3. Peça ao Firstmate um segredo das sessões novo no servidor ([hub-server](hub-server.md), "Session secret"). Uma sessão restaurada não pode voltar a valer: com o segredo trocado, toda sessão acaba e cada pessoa entra de novo.
4. No GitHub, em Actions, rode "Reiniciar o Hub". É obrigatório depois de toda restauração: as senhas do login do Hub e do login das conversas voltam a ser as dos arquivos do servidor, e as migrações que a restauração desfez são aplicadas de novo.
5. Em até 2 minutos, entre de novo no Hub. "Último início" é a hora de agora. "Início anterior" é o último início que existia antes do minuto escolhido. Os inícios depois desse minuto sumiram.
6. Abra a aba Conversa de um Projeto. As conversas começadas antes do minuto estão lá, com as mensagens até ele; as começadas depois sumiram da lista e do banco das conversas.
7. No Neon, em Branches, apague o ramo de cópia que a restauração criou: o nome termina em `_old_` e uma data. O plano grátis aceita só dez ramos.

## Se a página dá erro

Se o Hub mostra "O banco do Conexus não respondeu" ou "Algo deu errado", rode "Reiniciar o Hub" de novo e espere 2 minutos. Se o minuto escolhido é anterior à primeira migração, o Hub no ar responde erro até esse reinício aplicar as migrações; depois a página volta.

Se o erro continuar depois do segundo reinício, pare e avise o Firstmate: não tente consertar o banco pelo Neon.
