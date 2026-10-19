# Seal the model accounts' credentials

The installation's keys seal every model account's credential, bound to its row (security S32,
S33). Decision: [0049](../decisions/0049-model-accounts-keys-sign-ins-queues.md).

## Write the key file

As root on the server, inside `/etc/conexus/secrets`:

1. Run `printf 'k1:%s\n' "$(openssl rand -base64 32)" > hub_seal_keys`.
2. Set its owner to uid 1000 and its mode to 0400.
3. Copy the file to a place outside the server that only the founder reaches.

The file holds one `id:base64` line per key of 32 bytes. The last line seals; the others only
open. Without the file, the Hub does not start and `deploy.sh` refuses to run.

## Change the key

1. Add a line with a new id at the end of the file, and copy the file out again.
2. Run Reiniciar o Hub. Each deploy runs `reseal`, which moves every credential sealed with an
   older key to the last one and prints how many it moved.
3. Remove the old line, copy the file out again, and run Reiniciar o Hub.

## Para o fundador

- Guarde a cópia do arquivo fora do servidor. Sem ela, se o servidor se perder, toda conta de
  modelo precisa ser ligada de novo.
- A troca da chave não para nenhuma conta: a antiga continua abrindo até sair do arquivo.
