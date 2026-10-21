# Restaurar o Git de um Projeto

Como voltar o Git de um Projeto da cópia no R2, quando o volume `hub_git` perdeu o repositório dele. A cópia guarda um arquivo por versão salva, então o Projeto volta à última versão, não ao último pedido que ainda não tinha virado versão.

## Antes

Faça logo, antes de alguém escrever no Projeto. Um repositório que some é refeito vazio na primeira mensagem ao Builder, e a próxima versão nasceria como a de número 1. A aba Código só lê: sem repositório, ela mostra "nenhuma versão guardada" e não o refaz. Se alguém já escreveu depois da perda, pare e avise o Firstmate: não restaure por cima.

Reúna o id da empresa e o id do Projeto (estão no endereço da tela do Projeto) e a chave do bucket (`hub_git_copy_key`, no servidor).

## Restaurar

1. Liste as chaves de `git/<empresa>/<projeto>/` no bucket privado. A mais nova é a última da lista: o nome é `<versão com oito dígitos>-<commit>.bundle`. Anote a versão e o commit.
2. Baixe esse arquivo para o servidor, fora do volume, e confira que o tamanho bate com o do bucket.
3. No contêiner do Hub, com o mesmo usuário que escreve no volume, crie o repositório: `git init --bare --template= <HUB_GIT_ROOT>/<empresa>/<projeto>.git`.
4. Traga a cópia: `git -C <repositório> -c transfer.fsckObjects=true fetch <arquivo> 'refs/conexus/runs/*:refs/conexus/runs/*'`.
5. Ponha o `main` no commit anotado: `git -C <repositório> update-ref refs/heads/main <commit>` e `git -C <repositório> symbolic-ref HEAD refs/heads/main`.
6. Confira: `git -C <repositório> fsck` sem erro e `git -C <repositório> rev-list --count refs/heads/main` igual à versão anotada mais um (o primeiro commit é vazio).
7. Abra a aba Código do Projeto: ela mostra a versão anotada e os arquivos dela. Peça uma mudança ao Builder: a versão seguinte é a anotada mais um.

## Se não bate

Se o `fsck` aponta erro, ou a versão da tela é outra, apague o repositório criado e repita com a chave anterior da lista. Se nenhuma serve, pare e avise o Firstmate: não monte o repositório à mão.
