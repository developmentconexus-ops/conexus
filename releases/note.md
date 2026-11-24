# v0.24.120

Esta versão publica o que entrou no `main` em 24/11: o fim da segunda parte do Lago 2. Nada muda na
tela nem no que o Conexus responde.

**Hub.** O Hub deixa de guardar as tabelas antigas das cópias dos dados da empresa e as permissões
delas. Nenhuma tela, nenhum Projeto, nenhum app e nenhum agente lia essas tabelas desde a
v0.24.119, e agora elas saem do banco.

**Lago 2.** Com isso a parte 0 do Lago 2 fecha: o Conexus não guarda mais cópias dos dados da
empresa e lê os sistemas só ao vivo, até o lago trazer as tabelas.

Segue a etapa O conector no padrão novo, começando pelo Sankhya.
